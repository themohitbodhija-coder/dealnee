const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const MAX_IMAGE_BYTES = 5242880;
export const PHOTO_MIMES = ['image/png','image/jpeg','image/gif','image/webp','image/avif'];
export class PhotoError extends Error {
  constructor(status, message, code='photo_error') { super(message); this.status=status; this.code=code; }
}
export async function photoRpc(client,name,args) {
  const {data,error}=await client.rpc(name,args);
  if (error) {
    const status=({'42501':403,'22023':400,'22P02':400,'P0002':404,'23505':409,'40001':409,'55P03':409,'P0429':429})[error.code]||503;
    throw new PhotoError(status,status===409?'Upload changed, expired or validation is in progress. Please retry.':status===403?'Property management access required.':status===429?'Upload limit reached. Please wait.':'Photo operation could not be completed.',error.code);
  }
  return data;
}
export function validatePhotoInput(input) {
  if (!input || typeof input!=='object' || Array.isArray(input)) throw new PhotoError(400,'Invalid request.');
  const keys=input.action==='reserve'?['action','requestId','propertyId','createSessionId','mimeType','byteSize','checksum']:input.action==='finalize'?['action','uploadId']:[];
  if (!keys.length || Object.keys(input).some(k=>!keys.includes(k))) throw new PhotoError(400,'Invalid photo action.');
  if (input.action==='finalize') {
    if (!uuid.test(input.uploadId||'')) throw new PhotoError(400,'Invalid upload ID.');
  } else if (!uuid.test(input.requestId||'') || !PHOTO_MIMES.includes(input.mimeType) || !Number.isInteger(input.byteSize)
    || input.byteSize<1 || input.byteSize>MAX_IMAGE_BYTES || !/^[a-f0-9]{64}$/.test(input.checksum||'')
    || (!!input.propertyId === !!input.createSessionId) || (input.propertyId && !uuid.test(input.propertyId)) || (input.createSessionId && !uuid.test(input.createSessionId))) {
    throw new PhotoError(400,'Choose a supported image under 5 MB and a valid listing session.');
  }
  return input;
}
export async function readPhotoJson(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new PhotoError(415,'Send JSON.');
  const reader=request.body?.getReader(); if (!reader) throw new PhotoError(400,'Request required.');
  const parts=[]; let length=0;
  for (;;) {
    const {done,value}=await reader.read(); if (done) break;
    length+=value.length; if(length>4096){await reader.cancel();throw new PhotoError(413,'Request too large.');} parts.push(value);
  }
  const bytes=new Uint8Array(length); let offset=0; for(const part of parts){bytes.set(part,offset);offset+=part.length;}
  try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new PhotoError(400,'Invalid JSON.');}
}
export function detectImageMime(bytes) {
  const ascii=(start,end)=>String.fromCharCode(...bytes.slice(start,end));
  if (bytes.length>=24 && bytes.slice(0,8).every((v,i)=>v===[137,80,78,71,13,10,26,10][i])) return 'image/png';
  if (bytes.length>=4 && bytes[0]===255 && bytes[1]===216 && bytes[2]===255) return 'image/jpeg';
  if (['GIF87a','GIF89a'].includes(ascii(0,6))) return 'image/gif';
  if (ascii(0,4)==='RIFF' && ascii(8,12)==='WEBP') return 'image/webp';
  // AVIF must have an AVIF brand in the file-type box, not any arbitrary HEIF.
  if (bytes.length>=16 && ascii(4,8)==='ftyp') {
    const size=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(0);
    if (size>=16 && size<=Math.min(bytes.length,256)) {
      if (['avif','avis'].includes(ascii(8,12))) return 'image/avif';
      for(let i=16;i+4<=size;i+=4) if(['avif','avis'].includes(ascii(i,i+4)))return 'image/avif';
    }
  }
  return null;
}
export async function sha256(bytes) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function validateAndNormalize(bytes,reservation,decode) {
  if (!(bytes instanceof Uint8Array) || bytes.length!==reservation.declared_size || bytes.length>MAX_IMAGE_BYTES
    || detectImageMime(bytes)!==reservation.declared_mime || await sha256(bytes)!==reservation.declared_checksum) throw new PhotoError(422,'Image content does not match the upload reservation.','invalid_image');
  let image;
  try { image=await decode(bytes,reservation.declared_mime); } catch { throw new PhotoError(422,'Image could not be decoded safely.','invalid_image'); }
  if (!image || !Number.isInteger(image.width) || !Number.isInteger(image.height) || image.width<1 || image.height<1 || image.width>12000 || image.height>12000 || image.width*image.height>40000000
    || !(image.bytes instanceof Uint8Array) || image.bytes.length<1 || image.bytes.length>MAX_IMAGE_BYTES || detectImageMime(image.bytes)!==reservation.declared_mime) throw new PhotoError(422,'Image dimensions or encoded size exceed the allowed limit.','invalid_image');
  return {...image,checksum:await sha256(image.bytes)};
}
export function createPhotoUploadsHandler({createUserClient,service,storage,decode,allowedOrigins}) {
  return async request=>{
    const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'};
    const origin=request.headers.get('origin'); if(origin && allowedOrigins.includes(origin))headers['Access-Control-Allow-Origin']=origin;
    const response=(status,body)=>new Response(JSON.stringify(body),{status,headers});
    try {
      if(origin && !allowedOrigins.includes(origin))throw new PhotoError(403,'Origin denied.');
      if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
      if(request.method!=='POST')throw new PhotoError(405,'Use POST.');
      const match=/^Bearer (\S+)$/i.exec(request.headers.get('authorization')||'');
      if(!match)throw new PhotoError(401,'Please log in.');
      const userClient=createUserClient(match[1]);
      const {data,error}=await userClient.auth.getUser(match[1]);
      if(error || !data.user)throw new PhotoError(401,'Please log in again.');
      const account=await photoRpc(userClient,'current_account');
      if(!account || !(account.role==='admin' || (account.role==='subadmin' && account.permissions?.includes('manage_properties'))))throw new PhotoError(403,'Property management access required.');
      const actor=data.user.id, input=validatePhotoInput(await readPhotoJson(request));
      if(input.action==='reserve'){
        const u=await photoRpc(service,'photo_reserve',{p_actor:actor,p_request:input.requestId,p_property:input.propertyId||null,p_session:input.createSessionId||null,p_mime:input.mimeType,p_size:input.byteSize,p_checksum:input.checksum});
        const post=await storage.signPost(u);
        return response(200,{uploadId:u.id,post,expiresAt:u.expires_at});
      }
      const u=await photoRpc(service,'photo_claim',{p_actor:actor,p_upload:input.uploadId});
      if(['validated','attached'].includes(u.state))return response(200,{uploadId:u.id,state:u.state,objectKey:u.final_key});
      try {
        const bytes=await storage.getPending(u);
        const image=await validateAndNormalize(bytes,u,decode);
        // Upload normalized bytes, never COPY from a mutable browser-writable key.
        await storage.putFinal(u,image.bytes);
        await photoRpc(service,'photo_finish',{p_actor:actor,p_upload:u.id,p_lease:u.lease,p_checksum:image.checksum,p_size:image.bytes.length,p_width:image.width,p_height:image.height});
        return response(200,{uploadId:u.id,state:'validated',objectKey:u.final_key});
      }catch(error){
        // Invalid content is terminal. Provider/network failures can retry after lease expiry.
        if(error instanceof PhotoError && error.code==='invalid_image')await photoRpc(service,'photo_reject',{p_actor:actor,p_upload:u.id,p_lease:u.lease});
        throw error;
      }
    }catch(error){return response(error instanceof PhotoError?error.status:503,{error:error instanceof PhotoError?error.message:'Photo service is unavailable. Please retry.',code:error instanceof PhotoError?error.code:'provider_unavailable'});}
  };
}

export function createPhotoCleanupHandler({service,storage,schedulerSecret}) {
  if(typeof schedulerSecret!=='string' || schedulerSecret.length<32)throw new Error('A dedicated 32+ character photo scheduler secret is required');
  return async request=>{
    const response=(status,body)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
    try {
      if(request.method!=='POST')throw new PhotoError(405,'Use POST.');
      const supplied=request.headers.get('x-photo-scheduler-secret')||'';
      // Hash before comparison to avoid leaking the secret's matching prefix.
      const a=await sha256(new TextEncoder().encode(supplied)),b=await sha256(new TextEncoder().encode(schedulerSecret));
      let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);
      if(diff)throw new PhotoError(401,'Scheduler authentication required.');
      const jobs=await photoRpc(service,'photo_cleanup_claim',{p_limit:10});
      let completed=0,failed=0;
      for(const job of jobs){
        let ok=false;
        try{await storage.remove(job.object_key);ok=true;}catch{/* Do not log provider URLs or raw errors. */}
        await photoRpc(service,'photo_cleanup_finish',{p_id:job.id,p_lease:job.lease,p_ok:ok});
        if(ok)completed++;else failed++;
      }
      return response(200,{completed,failed});
    }catch(error){return response(error instanceof PhotoError?error.status:503,{error:error instanceof PhotoError?error.message:'Cleanup unavailable.'});}
  };
}
