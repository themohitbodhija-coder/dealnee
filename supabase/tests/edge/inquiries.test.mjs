import test from 'node:test';
import assert from 'node:assert/strict';
import { createInquiryHandler } from '../../functions/_shared/inquiries.mjs';
const key='10000000-0000-4000-8000-000000000001';
const payload=()=>({name:' Visitor ',email:' LEAD@example.test ',phone:'+91 (999) 999-9999',message:'<b>Plain text</b>',idempotencyKey:key,website:'',startedAt:Date.now()-5000});
function fixture(overrides={}) {
  const calls=[];
  const service={rpc:async(name,args)=>{calls.push({name,args});return {data:name==='inquiry_admit'?{allowed:true}:name==='inquiry_replay'?null:{accepted:true,reference:key}};}};
  const handler=createInquiryHandler({service,allowedOrigins:['https://example.test'],hashSecret:'x'.repeat(32),...overrides});
  const send=(body=payload(),headers={})=>handler(new Request('https://local.test',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://example.test',...headers},body:typeof body==='string'?body:JSON.stringify(body)}));
  return {handler,send,calls};
}
test('submission normalizes fields, hashes signals and returns acknowledgment only',async()=>{
  const {send,calls}=fixture();const response=await send();assert.equal(response.status,200);assert.deepEqual(await response.json(),{accepted:true,reference:key});
  const args=calls.find(c=>c.name==='submit_verified_inquiry').args;
  assert.equal(args.p_email,'lead@example.test');assert.equal(args.p_phone,'+919999999999');assert.equal(args.p_message,'<b>Plain text</b>');assert.match(args.p_email_hash,/^[a-f0-9]{64}$/);assert.equal(args.p_property,null);
  assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://example.test');
});
test('honeypot, minimum fill time, forbidden fields, invalid property and bad contact fields never insert',async()=>{
  for (const patch of [{website:'bot'},{startedAt:Date.now()},{status:'replied'},{actorId:key},{property:'junk'},{property:[]},{idempotencyKey:[]},{name:' '},{email:'invalid'},{phone:'abc1234567'},{message:'x'.repeat(5001)},{name:3},{message:'\u0000x'}]) {
    const {send,calls}=fixture();assert.equal((await send({...payload(),...patch})).status,400,JSON.stringify(patch).slice(0,100));assert.equal(calls.length,1);
  }
});
test('bounded streamed bodies, malformed JSON and content type are rejected',async()=>{
  for (const [body,headers,status] of [['x'.repeat(17000),{},413],['{',{},400],[payload(),{'Content-Type':'text/plain'},415]]) {
    const {send,calls}=fixture();assert.equal((await send(body,headers)).status,status);assert.equal(calls.length,1);
  }
});
test('rate denial returns retry guidance and does not submit',async()=>{
  const {send}=fixture({service:{rpc:async()=>({data:{allowed:false}})}});const response=await send();assert.equal(response.status,429);assert.equal(response.headers.get('Retry-After'),'60');
});
test('daily email limit returns 429',async()=>{
  const {send}=fixture({service:{rpc:async name=>({data:name==='inquiry_admit'?{allowed:true}:name==='inquiry_replay'?null:{limited:true,retryAfter:86400}})}});const response=await send();assert.equal(response.status,429);assert.equal(response.headers.get('Retry-After'),'86400');
});
test('caller spoofed forwarding headers cannot rotate default rate identity',async()=>{
  const {send,calls}=fixture();await send(payload(),{'X-Forwarded-For':'1.2.3.4','CF-Connecting-IP':'1.2.3.4'});await send(payload(),{'X-Forwarded-For':'9.8.7.6','CF-Connecting-IP':'9.8.7.6'});
  const admissions=calls.filter(c=>c.name==='inquiry_admit');assert.equal(admissions[0].args.p_ip_hash,admissions[1].args.p_ip_hash);
});
test('replay returns only the existing reference and makes no insert',async()=>{
  const names=[];const {send}=fixture({service:{rpc:async name=>{names.push(name);return {data:name==='inquiry_admit'?{allowed:true}:{reference:key,email:'must-not-leak'}};}}});assert.deepEqual(await (await send()).json(),{accepted:true,reference:key});assert.deepEqual(names,['inquiry_admit','inquiry_replay']);
});
test('changed retry returns conflict; invalid property and infrastructure errors are safe',async()=>{
  for (const [code,status] of [['23505',409],['P0002',400],['XX000',503]]) {
    const {send}=fixture({service:{rpc:async name=>name==='inquiry_admit'?{data:{allowed:true}}:{error:{code,message:'private database detail'}}}});const response=await send();assert.equal(response.status,status);assert.ok(!(await response.text()).includes('private database detail'));
  }
});
test('CORS, preflight, method and missing hash secret fail safely',async()=>{
  const {handler,send}=fixture();assert.equal((await send(payload(),{Origin:'https://evil.test'})).status,403);
  assert.equal((await handler(new Request('https://local.test',{method:'OPTIONS',headers:{Origin:'https://example.test'}}))).status,200);
  assert.equal((await handler(new Request('https://local.test'))).status,405);
  assert.equal((await fixture({hashSecret:''}).send()).status,503);
});
