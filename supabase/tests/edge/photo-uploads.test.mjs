import test from 'node:test';
import assert from 'node:assert/strict';
import { createPhotoUploadsHandler,createPhotoCleanupHandler,validatePhotoInput,validateAndNormalize,sha256,detectImageMime } from '../../functions/_shared/photo-uploads.mjs';
const actor='61000000-0000-4000-8000-000000000001',uploadId='62000000-0000-4000-8000-000000000001',session='63000000-0000-4000-8000-000000000001';
const png=new Uint8Array([137,80,78,71,13,10,26,10,...new Uint8Array(24)]);
const json=(body,headers={})=>new Request('https://local.test/photo-uploads',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer real-user-token',...headers},body:JSON.stringify(body)});
function fixture({rpc,decode,storage,user,account}={}){
 const calls=[];
 const service={rpc:async(name,args)=>{calls.push([name,args]);return rpc?rpc(name,args):{data:name==='photo_claim'?{id:uploadId,actor_id:actor,state:'pending',lease:session,declared_mime:'image/png',declared_size:png.length,declared_checksum:await sha256(png),pending_key:'pending/test',final_key:'properties/test/a.png'}:name==='photo_reserve'?{id:uploadId,expires_at:'2026-11-10',pending_key:'pending/a'}:null};}};
 const handler=createPhotoUploadsHandler({service,allowedOrigins:['https://app.test'],createUserClient:()=>({auth:{getUser:async()=>({data:{user:user===false?null:{id:actor}},error:null})},rpc:async()=>({data:account===false?{role:'user'}:{role:'admin'}})}),decode:decode|| (async()=>({bytes:png,width:10,height:10})),storage:storage||{getPending:async()=>png,putFinal:async(u,bytes)=>calls.push(['put',u.final_key,bytes]),signPost:async()=>({url:'https://bucket.s3.test',fields:{key:'pending/a'}})}});
 return {handler,calls,service};
}
test('photo input rejects forged key, invalid scope, unsupported and oversized files',()=>{
 const valid={action:'reserve',requestId:uploadId,createSessionId:session,mimeType:'image/png',byteSize:100,checksum:'a'.repeat(64)};
 assert.equal(validatePhotoInput(valid),valid);
 for(const patch of [{objectKey:'properties/a.jpg'},{propertyId:actor},{mimeType:'image/svg+xml'},{byteSize:5242881},{checksum:'bad'}])assert.throws(()=>validatePhotoInput({...valid,...patch}));
});
test('unauthenticated, revoked and disallowed origins never call elevated SQL',async()=>{
 for(const opts of [{user:false},{account:false}]){const f=fixture(opts);assert.ok([401,403].includes((await f.handler(json({action:'finalize',uploadId}))).status));assert.equal(f.calls.length,0);}
 const f=fixture();assert.equal((await f.handler(json({action:'finalize',uploadId},{origin:'https://evil.test'}))).status,403);assert.equal(f.calls.length,0);
 assert.equal((await f.handler(new Request('https://local.test',{method:'OPTIONS',headers:{origin:'https://app.test'}}))).status,204);
});
test('reservation derives actor from Auth and returns only opaque ID plus POST',async()=>{
 const f=fixture();const response=await f.handler(json({action:'reserve',requestId:uploadId,createSessionId:session,mimeType:'image/png',byteSize:100,checksum:'a'.repeat(64)}));
 assert.equal(response.status,200);assert.equal(f.calls[0][1].p_actor,actor);const body=await response.json();assert.equal(body.uploadId,uploadId);assert.equal(body.pending_key,undefined);
});
test('finalization decodes fetched bytes, writes normalized bytes then commits metadata',async()=>{
 const f=fixture();const response=await f.handler(json({action:'finalize',uploadId}));assert.equal(response.status,200);
 assert.deepEqual(f.calls.map(c=>c[0]),['photo_claim','put','photo_finish']);assert.equal(f.calls[2][1].p_width,10);assert.equal(f.calls[2][1].p_checksum,await sha256(png));
});
test('decode rejection cannot publish; mismatch bypasses decoder',async()=>{
 const f=fixture({decode:async()=>{throw new Error('Invalid stream');}});assert.equal((await f.handler(json({action:'finalize',uploadId}))).status,422);
 assert.deepEqual(f.calls.map(c=>c[0]),['photo_claim','photo_reject']);
 let decoded=false;await assert.rejects(validateAndNormalize(png,{declared_size:png.length,declared_mime:'image/png',declared_checksum:'0'.repeat(64)},()=>{decoded=true;}));assert.equal(decoded,false);
 assert.equal(detectImageMime(new TextEncoder().encode('<svg onload="alert(1)">')),null);
});
test('already validated retry does not fetch or write mutable pending bytes',async()=>{
 const f=fixture({rpc:async()=>({data:{id:uploadId,state:'validated'}}),storage:{getPending:()=>{throw Error('must not fetch');}}});
 assert.equal((await f.handler(json({action:'finalize',uploadId}))).status,200);assert.deepEqual(f.calls.map(c=>c[0]),['photo_claim']);
});
test('provider errors do not reject reservation; safe response never leaks credentials',async()=>{
 const f=fixture({storage:{getPending:()=>{throw Error('AWS_SECRET_ACCESS_KEY=DO_NOT_EXPOSE');}}});const response=await f.handler(json({action:'finalize',uploadId}));
 assert.equal(response.status,503);assert.ok(!(await response.text()).includes('DO_NOT_EXPOSE'));assert.deepEqual(f.calls.map(c=>c[0]),['photo_claim']);
});
test('scheduler authenticates dedicated secret and persists successes and failures',async()=>{
 const calls=[];const secret='a'.repeat(40);
 const handler=createPhotoCleanupHandler({schedulerSecret:secret,service:{rpc:async(name,args)=>{calls.push([name,args]);return {data:name==='photo_cleanup_claim'?[{id:'one',lease:'lease1',object_key:'pending/one'},{id:'two',lease:'lease2',object_key:'properties/two'}]:null};}},storage:{remove:async key=>{if(key==='properties/two')throw Error('retry');}}});
 assert.equal((await handler(new Request('https://local.test',{method:'POST',headers:{authorization:'Bearer service-role'}}))).status,401);assert.equal(calls.length,0);
 const response=await handler(new Request('https://local.test',{method:'POST',headers:{'x-photo-scheduler-secret':secret}}));assert.deepEqual(await response.json(),{completed:1,failed:1});assert.equal(calls[1][1].p_ok,true);assert.equal(calls[2][1].p_ok,false);
});
