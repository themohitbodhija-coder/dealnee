import { createPhotoS3 } from '../../functions/_shared/photo-s3.ts';
Deno.test('real AWS signer policy fixes pending key, length, MIME and checksum without network',async()=>{
  const storage=createPhotoS3({region:'ap-south-1',bucket:'local-photo-test',accessKeyId:'TESTACCESSKEY',secretAccessKey:'test-secret-not-real'});
  const post=await storage.signPost({pending_key:'pending/opaque-id',declared_mime:'image/png',declared_size:1234,declared_checksum:'a'.repeat(64)});
  const policy=JSON.parse(atob(post.fields.Policy));
  const assert=(value:boolean)=>{if(!value)throw new Error('Unexpected presigned POST policy');};
  assert(post.url==='https://local-photo-test.s3.ap-south-1.amazonaws.com/');
  assert(post.fields.key==='pending/opaque-id');
  assert(policy.conditions.some((c:unknown)=>JSON.stringify(c)===JSON.stringify(['content-length-range',1234,1234])));
  assert(policy.conditions.some((c:unknown)=>JSON.stringify(c)===JSON.stringify(['eq','$Content-Type','image/png'])));
  assert(post.fields['x-amz-checksum-sha256']===btoa(String.fromCharCode(...new Uint8Array(32).fill(170))));
  assert(!('acl' in post.fields));
  assert(Date.parse(policy.expiration)>Date.now() && Date.parse(policy.expiration)<=Date.now()+301000);
});
