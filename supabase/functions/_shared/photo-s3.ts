import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from 'npm:@aws-sdk/client-s3@3.922.0';
import { FetchHttpHandler } from 'npm:@smithy/fetch-http-handler@5.8.1';
import { createPresignedPost } from 'npm:@aws-sdk/s3-presigned-post@3.922.0';
import { MAX_IMAGE_BYTES, PhotoError } from './photo-uploads.mjs';

export function createPhotoS3({ region, bucket, accessKeyId, secretAccessKey, sessionToken }: {
  region:string;bucket:string;accessKeyId:string;secretAccessKey:string;sessionToken?:string;
}) {
  const client=new S3Client({ region,credentials:{accessKeyId,secretAccessKey,sessionToken},maxAttempts:2,requestHandler:new FetchHttpHandler({requestTimeout:20000}) });
  const timeout=()=>AbortSignal.timeout(20000);
  return {
    async signPost(u: {pending_key:string;declared_mime:string;declared_size:number;declared_checksum:string}) {
      const checksum=btoa(String.fromCharCode(...u.declared_checksum.match(/../g)!.map(h=>parseInt(h,16))));
      return await createPresignedPost(client,{
        Bucket:bucket,Key:u.pending_key,Expires:300,
        Fields:{'Content-Type':u.declared_mime,'x-amz-checksum-algorithm':'SHA256','x-amz-checksum-sha256':checksum,'success_action_status':'204'},
        Conditions:[['content-length-range',u.declared_size,u.declared_size],['eq','$Content-Type',u.declared_mime],
          ['eq','$x-amz-checksum-algorithm','SHA256'],['eq','$x-amz-checksum-sha256',checksum],['eq','$success_action_status','204']],
      });
    },
    async getPending(u: {pending_key:string;declared_size:number;declared_mime:string}) {
      if(!u.pending_key.startsWith('pending/'))throw new Error('Invalid pending key');
      const object=await client.send(new GetObjectCommand({Bucket:bucket,Key:u.pending_key}),{abortSignal:timeout()});
      if(object.ContentLength!==u.declared_size || object.ContentLength>MAX_IMAGE_BYTES || object.ContentType!==u.declared_mime || !object.Body)throw new PhotoError(422,'Uploaded object does not match reservation.','invalid_image');
      const reader=object.Body.transformToWebStream().getReader();
      const parts:Uint8Array[]=[];let length=0;
      for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>MAX_IMAGE_BYTES || length>u.declared_size){await reader.cancel();throw new PhotoError(422,'Image exceeds size limit.','invalid_image');}parts.push(value);}
      const bytes=new Uint8Array(length);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}return bytes;
    },
    async putFinal(u:{final_key:string;declared_mime:string},bytes:Uint8Array) {
      if(!/^properties\/[a-f0-9-]+\/[a-f0-9-]+\.(png|jpg|gif|webp|avif)$/.test(u.final_key))throw new Error('Invalid final key');
      await client.send(new PutObjectCommand({Bucket:bucket,Key:u.final_key,Body:bytes,ContentLength:bytes.length,
        ContentType:u.declared_mime,CacheControl:'public, max-age=31536000, immutable',ServerSideEncryption:'AES256',IfNoneMatch:'*'}),{abortSignal:timeout()});
    },
    async remove(key:string) {
      if(!/^(pending|properties)\/[a-zA-Z0-9/.-]+$/.test(key) || key.includes('..'))throw new Error('Invalid deletion key');
      await client.send(new DeleteObjectCommand({Bucket:bucket,Key:key}),{abortSignal:timeout()});
    },
  };
}
