const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
class Failure extends Error {
  constructor(status,message) { super(message); this.status=status; }
}
export function validatePropertyRequest(input, action) {
  const keys = action==='save' ? ['requestId','property','images','id','version','createSessionId'] : ['requestId','id','version'];
  if (!input || Array.isArray(input) || typeof input!=='object' || Object.keys(input).some(k=>!keys.includes(k)) || !uuid.test(input.requestId||'')) throw new Failure(400,'Invalid property request.');
  if (input.id != null && !uuid.test(input.id)) throw new Failure(400,'Invalid property ID.');
  if (input.id) {
    if (!Number.isSafeInteger(input.version) || input.version<1 || input.createSessionId!=null) throw new Failure(400,'Reload the property before saving.');
  } else if (action==='delete' || input.version!=null || !uuid.test(input.createSessionId||'')) throw new Failure(400,'A new listing requires a create session.');
  if (action==='save') {
    if (!input.property || typeof input.property!=='object' || Array.isArray(input.property) || !Array.isArray(input.images) || input.images.length>20 || input.images.some(image=>!image || typeof image!=='object' || Object.keys(image).length!==1 || !['imageId','uploadId'].includes(Object.keys(image)[0]) || !uuid.test(Object.values(image)[0]))) throw new Failure(400,'Invalid property or image references.');
  }
  return input;
}
async function body(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Failure(415,'Send JSON.');
  const reader=request.body?.getReader(); if (!reader) throw new Failure(400,'Request body required.');
  const chunks=[]; let size=0;
  for (;;) {
    const {done,value}=await reader.read(); if(done) break;
    size+=value.length; if(size>110000) { await reader.cancel(); throw new Failure(413,'Property request is too large.'); }
    chunks.push(value);
  }
  const bytes=new Uint8Array(size); let offset=0;
  for(const chunk of chunks) { bytes.set(chunk,offset); offset+=chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new Failure(400,'Invalid JSON.'); }
}
export function createPropertyWriteHandler({ action,createUserClient,allowedOrigins }) {
  if (!['save','delete'].includes(action)) throw new Error('Invalid handler action');
  return async request=>{
    const origin=request.headers.get('origin');
    const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'};
    if(origin && allowedOrigins.includes(origin)) headers['Access-Control-Allow-Origin']=origin;
    const respond=(status,data)=>new Response(JSON.stringify(data),{status,headers});
    try {
      if(origin && !allowedOrigins.includes(origin)) throw new Failure(403,'Origin is not allowed.');
      if(request.method==='OPTIONS') return new Response(null,{status:204,headers});
      if(request.method!=='POST') throw new Failure(405,'Use POST.');
      const token=/^Bearer (\S+)$/i.exec(request.headers.get('authorization')||'')?.[1];
      if(!token) throw new Failure(401,'Please log in.');
      const client=createUserClient(token);
      const verified=await client.auth.getUser(token);
      if(verified.error || !verified.data?.user) throw new Failure(401,'Please log in again.');
      const account=await client.rpc('current_account');
      if(account.error) throw new Failure(503,'Property service is unavailable.');
      if(!account.data || !(account.data.role==='admin' || (account.data.role==='subadmin' && account.data.permissions?.includes('manage_properties')))) throw new Failure(403,'Property management permission required.');
      const input=validatePropertyRequest(await body(request),action);
      const args={p_request_id:input.requestId,p_id:input.id??null,p_version:input.version??null};
      if(action==='save') Object.assign(args,{p_property:input.property,p_images:input.images,p_create_session:input.createSessionId??null});
      const {data,error}=await client.rpc(action==='save'?'save_property':'delete_property',args);
      if(error) {
        const status=({'42501':403,'P0002':404,'40001':409,'23505':409,'22023':400,'23514':400,'23502':400,'22P02':400,'22003':400,'22007':400,'22008':400})[error.code]||503;
        throw new Failure(status,status===409?'This property or retry request changed. Reload before trying again.':status===404?'Property not found.':status===403?'Property management permission required.':status===400?'Check the property fields and image selections.':'Property service is unavailable. Please retry.');
      }
      return respond(200,data);
    } catch(error) {
      return respond(error.status||503,{error:error.status?error.message:'Property service is unavailable. Please retry.'});
    }
  };
}
