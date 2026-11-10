import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
import { createPropertyWriteHandler } from '../_shared/property-writes.mjs';
const required = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing configuration: ${name}`);
  return value;
};
const url = required('SUPABASE_URL');
const key = Deno.env.get('APP_SUPABASE_PUBLISHABLE_KEY') || required('SUPABASE_ANON_KEY');
Deno.serve(createPropertyWriteHandler({
  action: 'save',
  allowedOrigins: required('APP_ALLOWED_ORIGINS').split(',').map(value => value.trim()).filter(Boolean),
  createUserClient: (token: string) => createClient(url,key,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{headers:{Authorization:`Bearer ${token}`}},
  }),
}));
