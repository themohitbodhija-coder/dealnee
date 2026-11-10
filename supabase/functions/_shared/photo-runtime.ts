import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
import { createPhotoS3 } from './photo-s3.ts';
export const required=(name:string)=>{const value=Deno.env.get(name);if(!value)throw new Error(`Missing server configuration: ${name}`);return value;};
const url=required('SUPABASE_URL');
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
export const service=createClient(url,Deno.env.get('APP_SUPABASE_SECRET_KEY')||required('SUPABASE_SERVICE_ROLE_KEY'),options);
export const createUserClient=(token:string)=>createClient(url,Deno.env.get('APP_SUPABASE_PUBLISHABLE_KEY')||required('SUPABASE_ANON_KEY'),{...options,global:{headers:{Authorization:`Bearer ${token}`}}});
export const storage=createPhotoS3({region:required('PHOTO_AWS_REGION'),bucket:required('PHOTO_S3_BUCKET'),accessKeyId:required('PHOTO_AWS_ACCESS_KEY_ID'),secretAccessKey:required('PHOTO_AWS_SECRET_ACCESS_KEY'),sessionToken:Deno.env.get('PHOTO_AWS_SESSION_TOKEN')});
