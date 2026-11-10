import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import PermissionRoute from './PermissionRoute';
jest.mock('../../services/api', () => ({ authService: {} }));
let root;
let container;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = service => act(async () => {
  root.render(<AuthProvider service={service} supabaseMode><MemoryRouter initialEntries={['/admin']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes>
    <Route path="/" element={<p>Public home</p>} /><Route path="/login" element={<p>Login page</p>} />
    <Route path="/admin" element={<PermissionRoute permission="manage_properties"><p>Private admin content</p></PermissionRoute>} />
  </Routes></MemoryRouter></AuthProvider>);
});
test('protected content never renders before session initialization', async () => {
  let finish;
  await render({ getCurrentUser: () => new Promise(resolve => { finish = resolve; }) });
  expect(container.textContent).toContain('Checking your session');
  expect(container.textContent).not.toContain('Private admin content');
  await act(async () => finish({ data: { user: null } }));
  expect(container.textContent).toBe('Login page');
});
test.each([
  [{ role: 'user', permissions: ['manage_properties'] }, 'Public home'],
  [{ role: 'subadmin', permissions: ['view_inquiries'] }, 'Public home'],
  [{ role: 'subadmin', permissions: ['manage_properties'] }, 'Private admin content'],
  [{ role: 'admin' }, 'Private admin content'],
])('guard evaluates effective role and required capability: %p', async (user, text) => {
  await render({ getCurrentUser: jest.fn().mockResolvedValue({ data: { user } }) });
  expect(container.textContent).toBe(text);
});
