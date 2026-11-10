import test from 'node:test';
import assert from 'node:assert/strict';
import { createPropertyWriteHandler,validatePropertyRequest } from '../../functions/_shared/property-writes.mjs';
const id='71000000-0000-4000-8000-000000000001';
const input={requestId:id,property:{title:'Property'},images:[],createSessionId:id};
function setup({account={role:'subadmin',permissions:['manage_properties']},authError=false,dbError=null}={}) {
  const calls=[];
  const client={auth:{getUser:async()=>({data:{user:authError?null:{id}},error:authError?{}:null})},rpc:async(name,args)=>{
    calls.push({name,args});
    return name==='current_account'?{data:account}:{data:{success:true,property:{id,version:1}},error:dbError};
  }};
  return {calls,handler:createPropertyWriteHandler({action:'save',createUserClient:()=>client,allowedOrigins:['https://example.test']})};
}
const request=(body=input,headers={})=>new Request('https://edge.test/property-save',{method:'POST',headers:{authorization:'Bearer verified-token','content-type':'application/json',origin:'https://example.test',...headers},body:JSON.stringify(body)});
test('verified property staff invokes user-scoped transactional RPC with no supplied actor',async()=>{
  const {handler,calls}=setup(); const response=await handler(request());
  assert.equal(response.status,200); assert.equal((await response.json()).success,true);
  assert.deepEqual(calls[1],{name:'save_property',args:{p_request_id:id,p_id:null,p_version:null,p_property:input.property,p_images:[],p_create_session:id}});
  assert.equal(response.headers.get('cache-control'),'no-store');
});
test('missing/invalid sessions and revoked or unrelated capability never write',async()=>{
  for(const options of [{authError:true},{account:null},{account:{role:'user',permissions:['manage_properties']}},{account:{role:'subadmin',permissions:['manage_users']}}]) {
    const {handler,calls}=setup(options); const response=await handler(request());
    assert.ok([401,403].includes(response.status)); assert.ok(!calls.some(c=>c.name==='save_property'));
  }
  const {handler}=setup(); assert.equal((await handler(request(input,{authorization:''}))).status,401);
});
test('strict envelope rejects forged identity, bad IDs, images and missing optimistic version',()=>{
  for(const bad of [{...input,actor:id},{...input,id:'bad'},{...input,id,createSessionId:null},{...input,images:[{objectKey:'properties/forged.jpg'}]},{...input,images:[{imageId:id,uploadId:id}]},{...input,createSessionId:null}]) assert.throws(()=>validatePropertyRequest(bad,'save'));
});
test('database permission, validation, version and unavailable errors map safely',async()=>{
  for(const [code,status] of [['42501',403],['40001',409],['P0002',404],['22023',400],['23514',400],['unknown',503]]) {
    const {handler}=setup({dbError:{code,message:'Secret DB internals'}}); const response=await handler(request());
    assert.equal(response.status,status); assert.ok(!(await response.text()).includes('Secret DB'));
  }
});
test('rejects disallowed origin, oversized streaming body, malformed JSON and method',async()=>{
  const {handler}=setup();
  assert.equal((await handler(request(input,{origin:'https://evil.test'}))).status,403);
  assert.equal((await handler(request({...input,property:{description:'x'.repeat(110001)}}))).status,413);
  assert.equal((await handler(new Request('https://edge.test',{method:'POST',headers:{authorization:'Bearer x','content-type':'application/json'},body:'{'}))).status,400);
  assert.equal((await handler(new Request('https://edge.test'))).status,405);
});
test('delete requires expected version and exact request identity',async()=>{
  const calls=[];
  const handler=createPropertyWriteHandler({action:'delete',allowedOrigins:[],createUserClient:()=>({auth:{getUser:async()=>({data:{user:{id}}})},rpc:async(name,args)=>{calls.push({name,args});return {data:name==='current_account'?{role:'admin'}:{success:true}};}})});
  const response=await handler(request({requestId:id,id,version:2},{origin:''}));
  assert.equal(response.status,200); assert.equal(calls[1].name,'delete_property'); assert.equal(calls[1].args.p_version,2);
});
