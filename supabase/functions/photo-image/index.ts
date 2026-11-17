import { GetObjectCommand, S3Client } from 'npm:@aws-sdk/client-s3@3.922.0';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3.922.0';
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
import { createPhotoImageHandler } from '../_shared/photo-image.mjs';

function required(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
}

const catalog = createClient(
  required('SUPABASE_URL'),
  Deno.env.get('APP_SUPABASE_PUBLISHABLE_KEY') || required('SUPABASE_ANON_KEY'),
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
);
const bucket = required('PHOTO_S3_BUCKET');
const s3 = new S3Client({
  region: required('PHOTO_AWS_REGION'),
  credentials: {
    accessKeyId: required('PHOTO_AWS_ACCESS_KEY_ID'),
    secretAccessKey: required('PHOTO_AWS_SECRET_ACCESS_KEY'),
    sessionToken: Deno.env.get('PHOTO_AWS_SESSION_TOKEN'),
  },
});

Deno.serve(createPhotoImageHandler({
  async findPublicImage(key: string) {
    const { data, error } = await catalog.from('property_images').select('object_key').eq('object_key', key).maybeSingle();
    if (error) throw error;
    return data;
  },
  signGet(key: string) {
    return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 300 });
  },
}));
