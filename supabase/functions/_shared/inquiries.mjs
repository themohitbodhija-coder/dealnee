const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail = (status, message) => { throw Object.assign(new Error(message), { status, safe:true }); };
export function validateInquiry(body) {
  const allowed = ['name','email','phone','message','property','idempotencyKey','website','startedAt'];
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !allowed.includes(k))) fail(400,'Please check the inquiry fields.');
  const text = (key, max, required = true) => {
    if (body[key] === undefined && !required) return '';
    if (typeof body[key] !== 'string' || body[key].length > max || (required && !body[key].trim()) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(body[key])) fail(400,'Please check the inquiry fields.');
    return body[key].trim();
  };
  const name=text('name',120),email=text('email',254).toLowerCase(),message=text('message',5000);
  const rawPhone=text('phone',32,false),phone=rawPhone.replace(/[ ()-]/g,'');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || (phone && !/^\+?\d{7,15}$/.test(phone))) fail(400,'Please enter a valid email and phone number.');
  if (typeof body.idempotencyKey !== 'string' || !uuid.test(body.idempotencyKey) || (body.property != null && (typeof body.property !== 'string' || !uuid.test(body.property)))) fail(400,'Please check the inquiry fields.');
  if (text('website',200,false) || !Number.isSafeInteger(body.startedAt) || Date.now()-body.startedAt<2000 || Date.now()-body.startedAt>86400000) fail(400,'Please refresh the form and try again.');
  return { name,email,phone,message,property:body.property || null,idempotencyKey:body.idempotencyKey };
}
async function boundedJson(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) fail(415,'Please send JSON.');
  if (Number(request.headers.get('content-length'))>16384) fail(413,'The inquiry is too large.');
  const reader=request.body?.getReader();
  if (!reader) fail(400,'Invalid request.');
  let size=0; const chunks=[];
  try {
    while (true) { const {done,value}=await reader.read(); if (done) break; size+=value.length; if (size>16384) { await reader.cancel(); fail(413,'The inquiry is too large.'); } chunks.push(value); }
    const bytes=new Uint8Array(size); let offset=0; for (const c of chunks) { bytes.set(c,offset); offset+=c.length; }
    return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  } catch (error) { if (error.status) throw error; fail(400,'Invalid JSON.'); }
}
export function createInquiryHandler({ service, allowedOrigins, hashSecret, trustedIpHeader }) {
  const encoder=new TextEncoder();
  const hash=async value => {
    const key=await crypto.subtle.importKey('raw',encoder.encode(hashSecret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
    return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
  };
  return async request => {
    const requestId=crypto.randomUUID(),origin=request.headers.get('origin');
    const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','X-Request-Id':requestId};
    if (origin && allowedOrigins.includes(origin)) Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info'});
    const respond=(status,body,extra={})=>new Response(JSON.stringify(body),{status,headers:{...headers,...extra}});
    try {
      if (origin && !allowedOrigins.includes(origin)) fail(403,'Origin not allowed.');
      if (request.method==='OPTIONS') return respond(200,{});
      if (request.method!=='POST') return respond(405,{error:'Method not allowed.'},{Allow:'POST, OPTIONS'});
      if (!hashSecret || hashSecret.length<32) fail(503,'Inquiry service is unavailable. Please try again later.');
      // Only enable a header after the hosting ingress is proven to overwrite it.
      // No X-Forwarded-For fallback: unknown callers share one conservative bucket.
      const ip=trustedIpHeader ? request.headers.get(trustedIpHeader) : null;
      const signal=ip && ip.length<=64 && /^[a-f\d:.]+$/i.test(ip) ? ip.toLowerCase() : 'unknown-shared';
      const rpc=async (name,args) => { const {data,error}=await service.rpc(name,args); if (error) {
        if (error.code==='23505') fail(409,'This request key was already used. Please refresh the form.');
        if (error.code==='P0002') fail(400,'This listing is unavailable. Please use the contact page.');
        fail(503,'Inquiry service is unavailable. Please try again later.');
      } return data; };
      const admission=await rpc('inquiry_admit',{p_ip_hash:await hash(`ip:${signal}`)});
      if (!admission.allowed) return respond(429,{error:'Please wait before trying again.',retryAfter:60},{'Retry-After':'60'});
      const input=validateInquiry(await boundedJson(request));
      const {idempotencyKey,...fields}=input;
      const emailHash=await hash(`email:${input.email}`),digest=await hash(JSON.stringify(fields));
      const replay=await rpc('inquiry_replay',{p_email_hash:emailHash,p_key:idempotencyKey,p_digest:digest});
      if (replay) return respond(200,{accepted:true,reference:replay.reference});
      const accepted=await rpc('submit_verified_inquiry',{
        p_email_hash:emailHash,p_key:idempotencyKey,p_digest:digest,p_name:fields.name,p_email:fields.email,p_phone:fields.phone,p_message:fields.message,p_property:fields.property,
      });
      if (accepted.limited) return respond(429,{error:'Please wait before trying again.',retryAfter:accepted.retryAfter},{'Retry-After':String(accepted.retryAfter)});
      return respond(200,{accepted:true,reference:accepted.reference});
    } catch (error) { return respond(error.safe ? error.status : 503,{error:error.safe ? error.message : 'Inquiry service is unavailable. Please try again later.',requestId}); }
  };
}
