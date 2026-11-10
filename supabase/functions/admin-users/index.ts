import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
import { createAdminUsersHandler } from '../_shared/admin-users.mjs';

const required = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
};
const url = required('SUPABASE_URL');
const publicKey = Deno.env.get('APP_SUPABASE_PUBLISHABLE_KEY') || required('SUPABASE_ANON_KEY');
const secretKey = Deno.env.get('APP_SUPABASE_SECRET_KEY') || required('SUPABASE_SERVICE_ROLE_KEY');
const options = { auth: { persistSession:false,autoRefreshToken:false,detectSessionInUrl:false } };
const service = createClient(url,secretKey,options);
const handler = createAdminUsersHandler({
  service,
  siteUrl: required('APP_SITE_URL'),
  allowedOrigins: required('APP_ALLOWED_ORIGINS').split(',').map(value => value.trim()).filter(Boolean),
  createUserClient: (token: string) => createClient(url,publicKey,{ ...options,global:{ headers:{ Authorization:`Bearer ${token}` } } }),
  reauthenticate: async (email: string,password: string,actorId: string) => {
    const temporary = createClient(url,publicKey,options);
    try {
      const { data,error } = await temporary.auth.signInWithPassword({ email,password });
      return !error && data.user?.id === actorId;
    } finally {
      // Revoke only this temporary verification session, not the caller's session.
      await temporary.auth.signOut({ scope:'local' });
    }
  },
});
Deno.serve(handler);
