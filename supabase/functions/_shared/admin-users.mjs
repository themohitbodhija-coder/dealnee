// Runtime-independent handler; tested with Node's Request/Response implementation.
// Supabase-specific clients and server credentials are wired only in index.ts.
const permissions = ['manage_properties','manage_categories','manage_users','view_inquiries'];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export class HttpError extends Error {
  constructor(status, message, code = 'request_failed') { super(message); this.status = status; this.code = code; }
}
export function validateAdminInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400,'Invalid request.');
  const keys = {
    list: ['action','page','limit'], operations: ['action'],
    invite: ['action','name','email','role','permissions','requestId','password'],
    access: ['action','targetId','role','permissions','active','version','password'],
    delete: ['action','targetId','requestId','password'], retry: ['action','operationId','password'],
  }[input.action];
  if (!keys || Object.keys(input).some(key => !keys.includes(key))) throw new HttpError(400,'Invalid administrative action.');
  const value = { ...input };
  for (const key of ['requestId','targetId','operationId']) {
    if (keys.includes(key) && !uuid.test(value[key] || '')) throw new HttpError(400,'Invalid request identifier.');
  }
  if (keys.includes('password') && value.password !== undefined && (typeof value.password !== 'string' || value.password.length > 1024)) throw new HttpError(400,'Invalid password confirmation.');
  if (value.action === 'list') {
    value.page ??= 1; value.limit ??= 10;
    if (!Number.isInteger(value.page) || value.page < 1 || value.page > 1000000 || !Number.isInteger(value.limit) || value.limit < 1 || value.limit > 100) throw new HttpError(400,'Invalid pagination.');
  }
  if (['invite','access'].includes(value.action)) {
    value.permissions ??= [];
    if (!['user','subadmin','admin'].includes(value.role) || !Array.isArray(value.permissions) || value.permissions.length > 4 ||
      new Set(value.permissions).size !== value.permissions.length || value.permissions.some(p => !permissions.includes(p)) ||
      (value.role !== 'subadmin' && value.permissions.length)) throw new HttpError(400,'Invalid role or permissions.');
    value.permissions = [...value.permissions].sort();
  }
  if (value.action === 'invite') {
    if (typeof value.name !== 'string' || value.name.trim().length < 1 || value.name.trim().length > 120 ||
      typeof value.email !== 'string' || value.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())) throw new HttpError(400,'Enter a valid name and email.');
    value.name = value.name.trim(); value.email = value.email.trim().toLowerCase();
  }
  if (value.action === 'access' && (typeof value.active !== 'boolean' || !Number.isSafeInteger(value.version) || value.version < 1)) throw new HttpError(400,'Invalid access update.');
  return value;
}
async function rpc(client, name, args) {
  const { data, error } = await client.rpc(name, args);
  if (error) {
    const status = ({ '42501':403, '22023':400, 'P0002':404, '23505':409, '40001':409, '55P03':409, 'P0429':429 })[error.code] || 503;
    const message = status === 403 ? 'Access denied or fresh password confirmation required.' : status === 409 ? 'This account or request has changed. Reload or retry the pending operation.' : status === 429 ? 'Too many requests. Please wait and try again.' : status === 404 ? 'Account or operation not found.' : status === 400 ? 'The requested change is not allowed.' : 'Account service is unavailable. Please try again.';
    throw new HttpError(status,message,error.code || 'database_error');
  }
  return data;
}
async function readBody(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new HttpError(415,'Send a JSON request.');
  if (Number(request.headers.get('content-length')) > 16384) throw new HttpError(413,'Request is too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400,'Request body is required.');
  const chunks = []; let size = 0;
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.length;
    if (size > 16384) { await reader.cancel(); throw new HttpError(413,'Request is too large.'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch (_) { throw new HttpError(400,'Invalid JSON.'); }
}

export function createAdminUsersHandler({ createUserClient, service, reauthenticate, siteUrl, allowedOrigins }) {
  const site = new URL(siteUrl);
  if (site.protocol !== 'https:' && !(site.protocol === 'http:' && ['localhost','127.0.0.1'].includes(site.hostname))) throw new Error('APP_SITE_URL must be HTTPS or local development');
  const inviteRedirect = new URL('/accept-invite',site).href;
  return async request => {
    const requestId = crypto.randomUUID();
    const origin = request.headers.get('origin');
    const headers = { 'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',
      'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods':'POST, OPTIONS' };
    if (origin && allowedOrigins.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
    const response = (status, body) => new Response(JSON.stringify(body), { status, headers });
    try {
      if (origin && !allowedOrigins.includes(origin)) throw new HttpError(403,'Origin is not allowed.');
      if (request.method === 'OPTIONS') return new Response(null,{ status:204,headers });
      if (request.method !== 'POST') throw new HttpError(405,'Use POST.');
      const match = /^Bearer (\S+)$/i.exec(request.headers.get('authorization') || '');
      if (!match) throw new HttpError(401,'Please log in.');
      const userClient = createUserClient(match[1]);
      const { data, error } = await userClient.auth.getUser(match[1]);
      if (error || !data.user) throw new HttpError(401,'Please log in again.');
      const actor = data.user;
      const account = await rpc(userClient,'current_account');
      if (!account || !(account.role === 'admin' || (account.role === 'subadmin' && account.permissions.includes('manage_users')))) throw new HttpError(403,'User management permission required.');
      const input = validateAdminInput(await readBody(request));
      await rpc(service,'admin_rate_limit',{ p_actor:actor.id });
      const proof = async (action, target, payload) => {
        if (account.role !== 'admin') throw new HttpError(403,'Only admins can change staff access.');
        if (!input.password) throw new HttpError(401,'Confirm your password for this change.','reauth_required');
        // Email and UUID are verified server data, never caller-supplied identity.
        const verified = await reauthenticate(actor.email,input.password,actor.id);
        if (!verified) throw new HttpError(401,'Password confirmation failed.','reauth_failed');
        return rpc(service,'admin_issue_reauth',{ p_actor:actor.id,p_action:action,p_target:target,p_payload:payload });
      };
      const execute = async id => {
        const op = await rpc(service,'admin_claim_operation',{ p_id:id,p_actor:actor.id });
        if (op.completed) return { operationId:id,completed:true };
        let providerFinished = false;
        try {
          let userId = op.createdUserId;
          if (op.kind === 'invite') {
            if (!userId) {
              const invited = await service.auth.admin.inviteUserByEmail(op.email,{ redirectTo:inviteRedirect,data:{ name:op.payload.name } });
              if (invited.error || !invited.data.user) throw new HttpError(503,'Invitation could not be completed. Retry it from pending actions.');
              userId = invited.data.user.id;
            }
          } else {
            const deleted = await service.auth.admin.deleteUser(op.targetId,false);
            if (deleted.error && deleted.error.status !== 404 && deleted.error.code !== 'user_not_found') throw new HttpError(503,'Deletion could not be completed. The account remains disabled; retry the pending action.');
          }
          providerFinished = true;
          await rpc(service,'admin_finish_operation',{ p_id:id,p_lease:op.lease,p_user:userId || null });
          return { operationId:id,completed:true };
        } catch (failure) {
          try { await rpc(service,'admin_fail_operation',{ p_id:id,p_lease:op.lease,p_code:providerFinished ? 'completion_failed' : 'auth_provider_error' }); } catch (_) { /* Lease expiry permits a later reconciliation attempt. */ }
          throw failure;
        }
      };
      if (input.action === 'list') return response(200,await rpc(userClient,'admin_list_users',{ p_page:input.page,p_limit:input.limit }));
      if (input.action === 'operations') return response(200,{ operations:await rpc(userClient,'admin_list_operations') });
      if (input.action === 'access') {
        const desired = { role:input.role,permissions:input.permissions,active:input.active,version:input.version };
        const token = await proof('access',input.targetId,desired);
        const user = await rpc(userClient,'admin_update_access',{ p_target:input.targetId,p_role:input.role,p_permissions:input.permissions,p_active:input.active,p_version:input.version,p_proof:token });
        return response(200,{ user });
      }
      if (input.action === 'invite') {
        const desired = { email:input.email,name:input.name,role:input.role,permissions:input.permissions };
        const token = input.role === 'user' ? null : await proof('invite',null,desired);
        const id = await rpc(userClient,'admin_prepare_invite',{ p_id:input.requestId,p_email:input.email,p_name:input.name,p_role:input.role,p_permissions:input.permissions,p_proof:token });
        return response(200,await execute(id));
      }
      if (input.action === 'delete') {
        let target;
        try { target = await rpc(userClient,'admin_get_user',{ p_target:input.targetId }); }
        catch (failure) {
          if (!(failure instanceof HttpError) || failure.status !== 404) throw failure;
          // A completed hard deletion has no directory row left. The database
          // verifies an exact, actor-owned replay before returning its result.
          const id = await rpc(userClient,'admin_prepare_delete',{ p_id:input.requestId,p_target:input.targetId,p_proof:null });
          return response(200,await execute(id));
        }
        const token = target.role === 'user' ? null : await proof('delete',input.targetId,{});
        const id = await rpc(userClient,'admin_prepare_delete',{ p_id:input.requestId,p_target:input.targetId,p_proof:token });
        return response(200,await execute(id));
      }
      // SQL decides whether an admin must adopt another actor's operation.
      const operations = await rpc(userClient,'admin_list_operations');
      const operation = operations.find(op => op.id === input.operationId);
      if (!operation) throw new HttpError(404,'Pending action not found.');
      const token = operation.needsPassword ? await proof('retry',input.operationId,{}) : null;
      const id = await rpc(userClient,'admin_retry_operation',{ p_id:input.operationId,p_proof:token });
      return response(200,await execute(id));
    } catch (failure) {
      const known = failure instanceof HttpError;
      return response(known ? failure.status : 503,{ error:known ? failure.message : 'Account service is unavailable. Please try again.',code:known ? failure.code : 'service_unavailable',requestId });
    }
  };
}
