import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAdminUsersHandler,validateAdminInput } from '../../functions/_shared/admin-users.mjs';
const actor='70000000-0000-4000-8000-000000000001';
const target='70000000-0000-4000-8000-000000000002';
const operation='70000000-0000-4000-8000-000000000003';
const lease='70000000-0000-4000-8000-000000000004';
function fixture(options={}) {
  const calls=[];
  const account=options.account || { role:'admin',permissions:[] };
  const userClient={ auth:{ getUser:async token => { calls.push(['verifyJwt',token]); return { data:{ user:options.invalidJwt ? null : { id:actor,email:'actor@example.test',user_metadata:{ role:'admin' } } } }; } },
    rpc:async(name,args) => {
      calls.push([name,args]);
      if (options.userRpc?.[name]) return options.userRpc[name];
      return { data:({ current_account:account,admin_list_users:{ users:[],page:1,pages:0,total:0 },
        admin_prepare_invite:operation,admin_prepare_delete:operation,admin_retry_operation:operation,
        admin_get_user:{ id:target,role:'user' },admin_list_operations:[{ id:operation,needsPassword:true }],admin_update_access:{ id:target,role:'subadmin' } })[name] };
    } };
  const service={ rpc:async(name,args) => {
    calls.push([name,args]);
    if (options.serviceRpc?.[name]) return options.serviceRpc[name];
    return { data:name==='admin_issue_reauth' ? 'one-use-proof' : name==='admin_claim_operation' ? {
      id:operation,kind:options.kind || 'invite',targetId:target,email:'invitee@example.test',payload:{ name:'Invitee',role:'user' },lease,
      createdUserId:options.createdUserId || null,completed:options.completed || false,
    } : null };
  }, auth:{ admin:{
    inviteUserByEmail:async(email,settings) => { calls.push(['inviteAuth',email,settings]); return options.inviteError ? { error:{ message:'private-provider-error-with-secret' },data:{} } : { data:{ user:{ id:target } } }; },
    deleteUser:async id => { calls.push(['deleteAuth',id]); return { error:options.deleteError || null }; },
  } } };
  const handler=createAdminUsersHandler({
    createUserClient:token => { calls.push(['userClient',token]); return userClient; },service,
    reauthenticate:async(email,password,id) => { calls.push(['reauth',email,password,id]); return options.reauth !== false; },
    siteUrl:'http://localhost:3001',allowedOrigins:['http://localhost:3001'],
  });
  const request=(body,headers={},method='POST') => handler(new Request('http://edge.test/admin-users',{
    method,headers:{ origin:'http://localhost:3001','content-type':'application/json',authorization:'Bearer user-jwt',...headers },
    ...(method==='POST' && { body:typeof body==='string' ? body : JSON.stringify(body) }),
  }));
  return { calls,request };
}
const invite={ action:'invite',name:'Invitee',email:'invitee@example.test',role:'user',permissions:[],requestId:operation };

test('rejects missing JWT, apikey-only callers and invalid user JWTs',async() => {
  for (const headers of [{ authorization:'' },{ authorization:'',apikey:'sb_publishable_placeholder' }]) {
    const f=fixture(); assert.equal((await f.request({ action:'list' },headers)).status,401);
    assert.equal(f.calls.length,0);
  }
  const f=fixture({ invalidJwt:true }); assert.equal((await f.request({ action:'list' })).status,401);
  assert.ok(!f.calls.some(([name]) => name==='admin_list_users'));
});
test('effective DB role defeats forged admin metadata and wrong capabilities',async() => {
  for (const account of [{ role:'user',permissions:['manage_users'] },{ role:'subadmin',permissions:['manage_properties'] }]) {
    const f=fixture({ account }); assert.equal((await f.request({ action:'list' })).status,403);
    assert.ok(!f.calls.some(([name]) => name==='admin_rate_limit'));
  }
});
test('CORS is exact, preflight is handled and methods are restricted',async() => {
  const f=fixture();
  assert.equal((await f.request({}, { origin:'https://evil.example' })).status,403);
  assert.equal((await f.request({}, {},'OPTIONS')).status,204);
  assert.equal((await f.request({}, {},'GET')).status,405);
  assert.equal(f.calls.length,0);
});
test('rejects oversized, malformed and identity-forging request bodies',async() => {
  const f=fixture();
  assert.equal((await f.request('{bad-json')).status,400);
  assert.equal((await f.request({ action:'list',actorId:target })).status,400);
  assert.equal((await f.request('x'.repeat(16385))).status,413);
  assert.equal((await f.request('{}',{ 'content-type':'text/plain' })).status,415);
});
test('list uses a user-scoped RPC and never the Auth directory API',async() => {
  const f=fixture(); const response=await f.request({ action:'list',page:2,limit:10 });
  assert.equal(response.status,200);
  assert.deepEqual(f.calls.find(([name]) => name==='admin_list_users')[1],{ p_page:2,p_limit:10 });
  assert.ok(!f.calls.some(([name]) => name==='inviteAuth' || name==='deleteAuth'));
});
test('delegated manager can invite regular users but cannot invite staff',async() => {
  const f=fixture({ account:{ role:'subadmin',permissions:['manage_users'] } });
  assert.equal((await f.request({ ...invite,role:'admin' })).status,403);
  assert.ok(!f.calls.some(([name]) => name==='inviteAuth'));
  assert.equal((await f.request(invite)).status,200);
  const settings=f.calls.find(([name]) => name==='inviteAuth')[2];
  assert.deepEqual(settings,{ redirectTo:'http://localhost:3001/accept-invite',data:{ name:'Invitee' } });
});
test('staff invite and role changes require a fresh password verification',async() => {
  const f=fixture({ reauth:false });
  assert.equal((await f.request({ ...invite,role:'admin' })).status,401);
  assert.equal((await f.request({ ...invite,role:'admin',password:'synthetic-admin-password' })).status,401);
  assert.ok(!f.calls.some(([name]) => name==='admin_issue_reauth' || name==='inviteAuth'));
});
test('reauthentication identity comes from verified Auth data, and proof binds exact access',async() => {
  const f=fixture();
  const response=await f.request({ action:'access',targetId:target,role:'subadmin',permissions:['view_inquiries','manage_users'],active:true,version:3,password:'synthetic-admin-password' });
  assert.equal(response.status,200);
  assert.deepEqual(f.calls.find(([name]) => name==='reauth').slice(1),['actor@example.test','synthetic-admin-password',actor]);
  const proof=f.calls.find(([name]) => name==='admin_issue_reauth')[1];
  assert.equal(proof.p_actor,actor); assert.equal(proof.p_action,'access'); assert.equal(proof.p_target,target);
  assert.deepEqual(proof.p_payload,{ role:'subadmin',permissions:['manage_users','view_inquiries'],active:true,version:3 });
  assert.ok(!JSON.stringify(f.calls.filter(([name]) => name.startsWith('admin_'))).includes('synthetic-admin-password'));
});
test('a lost invite response is reconciled without sending another invitation',async() => {
  const f=fixture({ createdUserId:target });
  assert.equal((await f.request(invite)).status,200);
  assert.ok(!f.calls.some(([name]) => name==='inviteAuth'));
  assert.equal(f.calls.find(([name]) => name==='admin_finish_operation')[1].p_user,target);
});
test('provider errors leave retriable state and never leak raw error text',async() => {
  const f=fixture({ inviteError:true }); const response=await f.request(invite);
  assert.equal(response.status,503);
  assert.equal(f.calls.find(([name]) => name==='admin_fail_operation')[1].p_code,'auth_provider_error');
  assert.ok(!(await response.text()).includes('private-provider-error-with-secret'));
  assert.ok(!f.calls.some(([name]) => name==='admin_finish_operation'));
});
test('database completion failure is distinct from an Auth failure',async() => {
  const f=fixture({ serviceRpc:{ admin_finish_operation:{ error:{ code:'40001' } } } });
  assert.equal((await f.request(invite)).status,409);
  assert.equal(f.calls.find(([name]) => name==='admin_fail_operation')[1].p_code,'completion_failed');
});
test('deletion tolerates an already deleted Auth user and completes its ledger',async() => {
  const f=fixture({ kind:'delete',deleteError:{ status:404,code:'user_not_found' } });
  assert.equal((await f.request({ action:'delete',targetId:target,requestId:operation })).status,200);
  assert.ok(f.calls.some(([name]) => name==='admin_prepare_delete'));
  assert.ok(f.calls.some(([name]) => name==='admin_finish_operation'));
});
test('failed Auth deletion never reports success and remains pending',async() => {
  const f=fixture({ kind:'delete',deleteError:{ status:500 } });
  assert.equal((await f.request({ action:'delete',targetId:target,requestId:operation })).status,503);
  assert.ok(!f.calls.some(([name]) => name==='admin_finish_operation'));
});
test('a completed deletion replay works after its directory row disappears',async() => {
  const f=fixture({ completed:true,userRpc:{ admin_get_user:{ error:{ code:'P0002' } } } });
  assert.equal((await f.request({ action:'delete',targetId:target,requestId:operation })).status,200);
  assert.ok(f.calls.some(([name]) => name==='admin_prepare_delete'));
  assert.ok(!f.calls.some(([name]) => name==='deleteAuth'));
});
test('SQL leases and revoked permissions fail before provider side effects',async() => {
  for (const code of ['42501','55P03']) {
    const f=fixture({ serviceRpc:{ admin_claim_operation:{ error:{ code } } } });
    assert.equal((await f.request(invite)).status,code==='42501' ? 403 : 409);
    assert.ok(!f.calls.some(([name]) => name==='inviteAuth'));
  }
});
test('retrying/adopting a protected operation needs a password and uses its ID',async() => {
  const f=fixture({ completed:true });
  assert.equal((await f.request({ action:'retry',operationId:operation })).status,401);
  assert.equal((await f.request({ action:'retry',operationId:operation,password:'synthetic-admin-password' })).status,200);
  const proof=f.calls.find(([name]) => name==='admin_issue_reauth')[1];
  assert.equal(proof.p_action,'retry'); assert.equal(proof.p_target,operation);
});
test('grant validation rejects legacy manage_admin, duplicates, nulls and malformed versions',() => {
  for (const grant of [['manage_admin'],['manage_users','manage_users'],[null]]) {
    assert.throws(() => validateAdminInput({ ...invite,role:'subadmin',permissions:grant }));
  }
  assert.throws(() => validateAdminInput({ action:'access',targetId:target,role:'user',permissions:[],active:true,version:0 }));
});
