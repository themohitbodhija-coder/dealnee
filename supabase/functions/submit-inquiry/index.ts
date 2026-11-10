import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
import { createInquiryHandler } from '../_shared/inquiries.mjs';
const env=(name: string)=>Deno.env.get(name) || '';
const service=createClient(env('SUPABASE_URL'),env('APP_SUPABASE_SECRET_KEY') || env('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false,autoRefreshToken:false}});
Deno.serve(createInquiryHandler({
  service,
  allowedOrigins:env('APP_ALLOWED_ORIGINS').split(',').map(v=>v.trim()).filter(Boolean),
  hashSecret:env('APP_RATE_LIMIT_HASH_SECRET'),
  trustedIpHeader:env('APP_INQUIRY_TRUSTED_IP_HEADER') || undefined,
}));
