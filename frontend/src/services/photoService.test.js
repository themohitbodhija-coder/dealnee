import { imageReferences, uploadPropertyImage } from './photoService';
import { getSupabase } from '../lib/supabase';
import { preparePropertyImage } from '../utils/preparePropertyImage';
jest.mock('../utils/preparePropertyImage', () => ({ MAX_IMAGE_BYTES: 20 * 1024 * 1024, preparePropertyImage: jest.fn(async file => file) }));
jest.mock('../lib/supabase',()=>({ getSupabase:jest.fn() }));
const id='62000000-0000-4000-8000-000000000001';
const session='63000000-0000-4000-8000-000000000001';
beforeEach(() => preparePropertyImage.mockImplementation(async file => file));
afterEach(()=>jest.clearAllMocks());
test('ordered references preserve existing IDs and validated uploads, reject unfinished images',()=>{
  expect(imageReferences([{id},{uploadId:session,uploadState:'validated'}])).toEqual([{imageId:id},{uploadId:session}]);
  expect(()=>imageReferences([{file:new Blob(),preview:'data:...'}])).toThrow();
  expect(()=>imageReferences([{uploadId:id,uploadState:'uploading'}])).toThrow();
  expect(()=>imageReferences([{id},{id}])).toThrow();
});
test('unsupported or oversize selection never invokes the signer',async()=>{
  await expect(uploadPropertyImage({type:'image/svg+xml',size:100},{createSessionId:session,requestId:id})).rejects.toThrow('Choose a JPEG');
  await expect(uploadPropertyImage({type:'image/png',size:20971521},{createSessionId:session,requestId:id})).rejects.toThrow('up to 20 MB');
  expect(getSupabase).not.toHaveBeenCalled();
});
test.each([
  ['photo.png', 'image/png', 'image/png'],
  ['photo.jpg', 'image/jpeg', 'image/jpeg'],
  ['photo.jpg', 'image/jpg', 'image/jpeg'],
  ['photo.jpeg', 'image/pjpeg', 'image/jpeg'],
  ['PHOTO.JPG', '', 'image/jpeg'],
  ['photo.jpg', 'application/octet-stream', 'image/jpeg'],
])('uploads %s (%s) with canonical MIME then finalizes',async(name,type,mimeType)=>{
  const oldCrypto=global.crypto;
  Object.defineProperty(global,'crypto',{configurable:true,value:{subtle:{digest:async()=>new Uint8Array(32).buffer}}});
  try {
    const invoke=jest.fn().mockResolvedValueOnce({data:{uploadId:id,post:{url:'https://s3.test',fields:{key:'pending/random'}},expiresAt:'soon'}}).mockResolvedValueOnce({data:{uploadId:id,state:'validated'}});
    getSupabase.mockReturnValue({functions:{invoke}});
    global.fetch=jest.fn().mockResolvedValue({ok:true});URL.createObjectURL=jest.fn().mockReturnValue('blob:preview');
    const file=new File(['bytes'],name,{type});file.arrayBuffer=async()=>new Uint8Array([1,2,3]).buffer;
    const image=await uploadPropertyImage(file,{createSessionId:session,requestId:id});
    expect(image.uploadState).toBe('validated');expect(image.uploadId).toBe(id);
    expect(invoke.mock.calls[0][1].body.mimeType).toBe(mimeType);
    expect(fetch.mock.calls[0][1].body.get('file').type).toBe(mimeType);
    expect(fetch.mock.calls[0][1].body.get('file').name).toBe(name);
    expect(fetch.mock.calls[0][1].credentials).toBe('omit');expect(invoke.mock.calls[1][1].body).toEqual({action:'finalize',uploadId:id});
  } finally {Object.defineProperty(global,'crypto',{configurable:true,value:oldCrypto});}
});

test('reserves, hashes and uploads the prepared JPG bytes for a source above the old 5 MB limit', async () => {
  const oldCrypto = global.crypto;
  const digest = jest.fn(async () => new Uint8Array(32).buffer);
  Object.defineProperty(global, 'crypto', { configurable: true, value: { subtle: { digest } } });
  try {
    const source = new File(['original'], 'd_1.jpg', { type: 'image/jpeg' });
    Object.defineProperty(source, 'size', { value: 8214704 });
    const prepared = new File(['resized JPG'], 'd_1.jpg', { type: 'image/jpeg' });
    const bytes = new Uint8Array([1, 2, 3, 4]).buffer;
    prepared.arrayBuffer = jest.fn(async () => bytes);
    preparePropertyImage.mockResolvedValueOnce(prepared);
    const invoke = jest.fn()
      .mockResolvedValueOnce({ data: { uploadId: id, post: { url: 'https://s3.test', fields: {} } } })
      .mockResolvedValueOnce({ data: { state: 'validated' } });
    getSupabase.mockReturnValue({ functions: { invoke } });
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    await uploadPropertyImage(source, { createSessionId: session, requestId: id });
    expect(prepared.arrayBuffer).toHaveBeenCalledTimes(1);
    expect(invoke.mock.calls[0][1].body.byteSize).toBe(prepared.size);
    expect(fetch.mock.calls[0][1].body.get('file').size).toBe(prepared.size);
  } finally {
    Object.defineProperty(global, 'crypto', { configurable: true, value: oldCrypto });
  }
});
