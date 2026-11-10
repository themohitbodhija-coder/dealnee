import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, canAccess, useAuth } from './AuthContext';

jest.mock('../services/api', () => ({ authService: {} }));
let current;
let container;
let root;
function Consumer() {
  current = useAuth();
  return <div>{current.loading ? 'loading' : current.user?.name || 'anonymous'}</div>;
}
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); sessionStorage.clear(); localStorage.clear(); });
const render = async service => act(async () => { root.render(<AuthProvider service={service} supabaseMode><Consumer /></AuthProvider>); });

test('forged legacy cache never grants access while session initializes', async () => {
  sessionStorage.setItem('user', JSON.stringify({ role: 'admin', name: 'Forged' }));
  let resolve;
  const service = { getCurrentUser: jest.fn(() => new Promise(done => { resolve = done; })) };
  await render(service);
  expect(container.textContent).toBe('loading');
  expect(current.user).toBeNull();
  expect(sessionStorage.getItem('user')).toBeNull();
  await act(async () => resolve({ data: { user: null } }));
  expect(container.textContent).toBe('anonymous');
});
test('late profile response cannot restore an account after logout', async () => {
  let resolve;
  const service = { getCurrentUser: () => new Promise(done => { resolve = done; }), logout: jest.fn().mockResolvedValue({}) };
  await render(service);
  localStorage.setItem('property_form_draft', 'private draft');
  await act(async () => current.logout());
  await act(async () => resolve({ data: { user: { role: 'admin', name: 'Stale admin' } } }));
  expect(current.user).toBeNull();
  expect(localStorage.getItem('property_form_draft')).toBeNull();
});
test('permission refresh removes stale grants and account access', async () => {
  const service = { getCurrentUser: jest.fn().mockResolvedValue({ data: { user: { role: 'subadmin', name: 'Staff', permissions: ['manage_properties'] } } }) };
  await render(service);
  expect(current.can('manage_properties')).toBe(true);
  expect(current.can('manage_users')).toBe(false);
  service.getCurrentUser.mockResolvedValue({ data: { user: null } });
  await act(async () => current.refresh());
  expect(current.can('manage_properties')).toBe(false);
});
test('auth event callback defers profile calls outside the SDK lock', async () => {
  let listener;
  const service = {
    subscribe: callback => { listener = callback; return jest.fn(); },
    getCurrentUser: jest.fn().mockResolvedValue({ data: { user: null } }),
  };
  await render(service);
  const calls = service.getCurrentUser.mock.calls.length;
  act(() => listener('TOKEN_REFRESHED', { user: { id: 'user' } }));
  expect(service.getCurrentUser).toHaveBeenCalledTimes(calls);
  await act(async () => { await new Promise(done => setTimeout(done, 10)); });
  expect(service.getCurrentUser).toHaveBeenCalledTimes(calls + 1);
});
test('ordinary roles with stray permissions cannot enter staff routes', () => {
  expect(canAccess({ role: 'user', permissions: ['manage_users'] }, 'manage_users')).toBe(false);
  expect(canAccess({ role: 'subadmin', permissions: [] })).toBe(false);
  expect(canAccess({ role: 'admin' }, 'manage_users')).toBe(true);
});
test('logout also cancels a pending login result', async () => {
  let resolve;
  const service = {
    getCurrentUser: jest.fn().mockResolvedValue({ data: { user: null } }),
    login: () => new Promise(done => { resolve = done; }),
    logout: jest.fn().mockResolvedValue({}),
    clearLocalSession: jest.fn().mockResolvedValue({}),
  };
  await render(service);
  let login;
  act(() => { login = current.login({}); });
  // Attach the rejection handler immediately; the late response is discarded.
  const result = login.catch(error => error);
  await act(async () => current.logout());
  await act(async () => resolve({ data: { user: { name: 'Late login', role: 'admin' } } }));
  expect((await result).message).toContain('cancelled');
  expect(current.user).toBeNull();
  expect(service.clearLocalSession).toHaveBeenCalledTimes(1);
});
