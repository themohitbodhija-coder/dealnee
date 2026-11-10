jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn(() => ({ auth: {} })) }));
const originalUrl = process.env.REACT_APP_SUPABASE_URL;
const originalKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY;
beforeEach(() => {
  jest.resetModules();
  process.env.REACT_APP_SUPABASE_URL = 'http://127.0.0.1:54321';
  process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test_placeholder';
});
afterEach(() => {
  if (originalUrl === undefined) delete process.env.REACT_APP_SUPABASE_URL; else process.env.REACT_APP_SUPABASE_URL = originalUrl;
  if (originalKey === undefined) delete process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY; else process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY = originalKey;
});
test('initializes one PKCE client with tab-scoped session storage', () => {
  const { getSupabase } = require('./supabase');
  expect(getSupabase()).toBe(getSupabase());
  const { createClient } = require('@supabase/supabase-js');
  expect(createClient).toHaveBeenCalledTimes(1);
  const options = createClient.mock.calls[0][2];
  expect(options.auth).toMatchObject({ flowType: 'pkce', autoRefreshToken: true, detectSessionInUrl: true });
  options.auth.storage.setItem(options.auth.storageKey, 'test-session');
  expect(localStorage.getItem(options.auth.storageKey)).toBeNull();
  sessionStorage.clear();
});
test('rejects a server secret key', () => {
  process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY = 'sb_secret_test_placeholder';
  expect(() => require('./supabase').getSupabase()).toThrow('Service configuration');
});
test('rejects a legacy service-role JWT', () => {
  process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY = `header.${btoa(JSON.stringify({ role: 'service_role' }))}.signature`;
  expect(() => require('./supabase').getSupabase()).toThrow('Service configuration');
});
test('requires HTTPS for remote Supabase services', () => {
  process.env.REACT_APP_SUPABASE_URL = 'http://remote.example.test';
  expect(() => require('./supabase').getSupabase()).toThrow('secure connection');
});
