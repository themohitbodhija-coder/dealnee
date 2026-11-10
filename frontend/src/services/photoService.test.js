import { imageReferences, uploadPropertyImage } from './photoService';
import { getSupabase } from '../lib/supabase';
jest.mock('../lib/supabase',()=>({ getSupabase:jest.fn() }));
const id='62000000-0000-4000-8000-000000000001';
const session='63000000-0000-4000-8000-000000000001';
afterEach(()=>jest.clearAllMocks());
test('ordered references preserve existing IDs and validated uploads, reject unfinished images',()=>{
  expect(imageReferences([{id},{uploadId:session,uploadState:'validated'}])).toEqual([{imageId:id},{uploadId:session}]);
  expect(()=>imageReferences([{file:new Blob(),preview:'data:...'}])).toThrow();
  expect(()=>imageReferences([{uploadId:id,uploadState:'uploading'}])).toThrow();
  expect(()=>imageReferences([{id},{id}])).toThrow();
});
test('unsupported or oversize selection never invokes the signer',async()=>{
  await expect(uploadPropertyImage({type:'image/svg+xml',size:100},{createSessionId:session,requestId:id})).rejects.toThrow('Choose a JPEG');
  await expect(uploadPropertyImage({type:'image/png',size:5242881},{createSessionId:session,requestId:id})).rejects.toThrow('under 5 MB');
  expect(getSupabase).not.toHaveBeenCalled();
});
test('uploads to signed POST then finalizes before exposing reservation',async()=>{
  const oldCrypto=global.crypto;
  Object.defineProperty(global,'crypto',{configurable:true,value:{subtle:{digest:async()=>new Uint8Array(32).buffer}}});
  try {
    const invoke=jest.fn().mockResolvedValueOnce({data:{uploadId:id,post:{url:'https://s3.test',fields:{key:'pending/random'}},expiresAt:'soon'}}).mockResolvedValueOnce({data:{uploadId:id,state:'validated'}});
    getSupabase.mockReturnValue({functions:{invoke}});
    global.fetch=jest.fn().mockResolvedValue({ok:true});URL.createObjectURL=jest.fn().mockReturnValue('blob:preview');
    const file=new File(['bytes'],'photo.png',{type:'image/png'});file.arrayBuffer=async()=>new Uint8Array([1,2,3]).buffer;
    const image=await uploadPropertyImage(file,{createSessionId:session,requestId:id});
    expect(image.uploadState).toBe('validated');expect(image.uploadId).toBe(id);
    expect(fetch.mock.calls[0][1].credentials).toBe('omit');expect(invoke.mock.calls[1][1].body).toEqual({action:'finalize',uploadId:id});
  } finally {Object.defineProperty(global,'crypto',{configurable:true,value:oldCrypto});}
});
