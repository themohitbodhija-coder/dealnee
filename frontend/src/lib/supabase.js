import { createClient } from '@supabase/supabase-js';
import { createAuthStorage } from './authStorage';

let client;
export function getSupabase() {
  if (client) return client;
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY;
  let legacyRole;
  try {
    const payload = (key || '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    legacyRole = JSON.parse(atob(payload)).role;
  } catch (_) { /* opaque key */ }
  if (!url || !key || (!key.startsWith('sb_publishable_') && legacyRole !== 'anon')) {
    throw new Error('Service configuration is unavailable. Please contact support.');
  }
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname))) {
    throw new Error('Service requires a secure connection.');
  }
  const storageKey = `dealinee-${parsed.host}-auth`;
  client = createClient(url, key, {
    auth: {
      flowType: 'pkce', persistSession: true, autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: createAuthStorage(storageKey, window.sessionStorage, window.localStorage),
      storageKey,
    },
  });
  return client;
}
