import { createAuthStorage } from './authStorage';
afterEach(() => { localStorage.clear(); sessionStorage.clear(); });
test('only PKCE proofs are shared; access and refresh sessions stay in sessionStorage', () => {
  const storage = createAuthStorage('project-auth', sessionStorage, localStorage);
  storage.setItem('project-auth', 'session-with-tokens');
  storage.setItem('project-auth-flow-12345678-code-verifier', 'proof-only');
  expect(localStorage.getItem('project-auth')).toBeNull();
  expect(sessionStorage.getItem('project-auth')).toBe('session-with-tokens');
  const otherTab = createAuthStorage('project-auth', { getItem: () => null }, localStorage);
  expect(otherTab.getItem('project-auth')).toBeNull();
  expect(otherTab.getItem('project-auth-flow-12345678-code-verifier')).toBe('proof-only');
});
test('PKCE proofs expire and are removed', () => {
  let time = 0;
  const storage = createAuthStorage('project-auth', sessionStorage, localStorage, () => time);
  storage.setItem('project-auth-code-verifier', 'proof-only');
  time = 3600001;
  expect(storage.getItem('project-auth-code-verifier')).toBeNull();
  expect(localStorage.getItem('project-auth-code-verifier')).toBeNull();
});
test('other environments cannot consume verifier records', () => {
  const storage = createAuthStorage('staging-auth', sessionStorage, localStorage);
  storage.setItem('staging-auth-code-verifier', 'staging-proof');
  const production = createAuthStorage('production-auth', sessionStorage, localStorage);
  expect(production.getItem('staging-auth-code-verifier')).toBeNull();
});
