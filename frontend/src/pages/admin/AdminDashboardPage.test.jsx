import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from './AdminDashboardPage';
import { adminService } from '../../services/api';
let mockUser;
jest.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser, can: permission => mockUser?.role === 'admin' || mockUser?.permissions?.includes(permission) }) }));
jest.mock('../../lib/backend', () => ({ usesSupabase: true }));
jest.mock('../../services/api', () => ({ adminService: { getDashboardStats: jest.fn() } }));
let container, root;
const full = {
  visibility: { properties: true, users: true, inquiries: true, categories: true },
  stats: { totalProperties: 7, totalUsers: 3, totalInquiries: 2, newInquiries: 1, totalCategories: 10 },
  recentProperties: [{ _id: 'property', title: 'A home', price: '1234.56', status: 'sold', category: { name: 'Resale' } }],
  recentInquiries: [{ _id: 'lead', name: '<script>bad()</script>', email: 'lead@example.test', property: { title: 'Deleted listing' }, status: 'new' }],
};
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  mockUser = { id: 'admin', role: 'admin' };
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  jest.clearAllMocks(); adminService.getDashboardStats.mockResolvedValue({ data: full });
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = () => act(async () => root.render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><AdminDashboard /></MemoryRouter>));
test('admin sees all sections, new-lead alert, decimal price and safe text', async () => {
  await render();
  ['Total Properties', 'Total Users', 'Total Inquiries', 'Categories', 'Recent Properties', 'Recent Inquiries', 'lead@example.test', 'Deleted listing', '₹1,234.56'].forEach(text => expect(container.textContent).toContain(text));
  expect(container.textContent).toContain('1 new inquiries'); expect(container.querySelector('script')).toBeNull();
});
test.each([
  ['manage_properties', 'properties', 'Total Properties'],
  ['manage_users', 'users', 'Regular Users'],
  ['view_inquiries', 'inquiries', 'Total Inquiries'],
  ['manage_categories', 'categories', 'Categories'],
])('individual %s shows only the permitted section', async (permission, section, label) => {
  mockUser = { id: 'staff', role: 'subadmin', permissions: [permission] };
  adminService.getDashboardStats.mockResolvedValue({ data: { ...full, userScope: 'regular', visibility: { [section]: true } } });
  await render();
  expect(container.querySelectorAll('button')).toHaveLength(1);
  expect(container.querySelector('button').textContent).toContain(label);
  if (section !== 'inquiries') { expect(container.textContent).not.toContain('lead@example.test'); expect(container.textContent).not.toContain('new inquiries waiting'); }
  if (section !== 'properties') expect(container.textContent).not.toContain('A home');
});
test('server redaction overrides stale cached admin permissions and hides zero placeholders', async () => {
  adminService.getDashboardStats.mockResolvedValue({ data: { visibility: {}, stats: {} } });
  await render(); expect(container.querySelectorAll('button')).toHaveLength(0);
  expect(container.textContent).toContain('No dashboard sections'); expect(container.textContent).not.toContain('Total Inquiries');
});
test('authorized empty lists render meaningful empty states', async () => {
  adminService.getDashboardStats.mockResolvedValue({ data: { ...full, recentProperties: [], recentInquiries: [] } });
  await render(); expect(container.textContent).toContain('No properties yet.'); expect(container.textContent).toContain('No inquiries yet.');
});
test('failed refresh clears previously loaded inquiry information', async () => {
  await render(); expect(container.textContent).toContain('lead@example.test');
  mockUser = { id: 'staff', role: 'subadmin', permissions: ['manage_categories'] };
  adminService.getDashboardStats.mockRejectedValue(new Error('Staff dashboard access required'));
  await render(); expect(container.textContent).not.toContain('lead@example.test');
  expect(container.querySelector('[role="alert"]').textContent).toContain('Staff dashboard access required');
});
test('late responses for a previous account cannot restore private rows', async () => {
  let resolve;
  adminService.getDashboardStats.mockReturnValueOnce(new Promise(done => { resolve = done; }));
  await render();
  mockUser = { id: 'other', role: 'subadmin', permissions: ['manage_categories'] };
  adminService.getDashboardStats.mockResolvedValue({ data: { visibility: { categories: true }, stats: { totalCategories: 10 } } });
  await render(); await act(async () => resolve({ data: full }));
  expect(container.textContent).not.toContain('lead@example.test'); expect(container.querySelectorAll('button')).toHaveLength(1);
});
