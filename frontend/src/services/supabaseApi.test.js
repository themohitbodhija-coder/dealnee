import { createSupabaseApi } from './supabaseApi';

function fixture() {
  const client = {
    rpc: jest.fn().mockResolvedValue({ data: { id: 'account-id', role: 'user', permissions: [] } }),
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: { user: { email: 'user@example.test', user_metadata: { role: 'admin' } } } } }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: {} }),
      signUp: jest.fn().mockResolvedValue({ data: { session: null } }),
      signOut: jest.fn().mockResolvedValue({}),
      resetPasswordForEmail: jest.fn().mockResolvedValue({}),
      updateUser: jest.fn().mockResolvedValue({}),
    },
  };
  return { client, ...createSupabaseApi(() => client) };
}

test('current account role comes from live RPC, never user metadata', async () => {
  const { client, authService } = fixture();
  const { data } = await authService.getCurrentUser();
  expect(client.rpc).toHaveBeenCalledWith('current_account', undefined);
  expect(data.user.role).toBe('user');
  expect(data.user.email).toBe('user@example.test');
});
test('confirmation-required signup sends only safe metadata and no fabricated user session', async () => {
  const { client, authService } = fixture();
  const { data } = await authService.register({ email: ' user@example.test ', password: 'test-password', name: ' User ', role: 'admin', permissions: ['manage_users'] });
  expect(data).toEqual({ user: null, requiresConfirmation: true });
  expect(client.auth.signUp.mock.calls[0][0].options.data).toEqual({ name: 'User', phone: '' });
  expect(client.rpc).not.toHaveBeenCalled();
});
test('absent session does not query account RPC', async () => {
  const { client, authService } = fixture();
  client.auth.getSession.mockResolvedValue({ data: { session: null } });
  expect((await authService.getCurrentUser()).data.user).toBeNull();
  expect(client.rpc).not.toHaveBeenCalled();
});
test('deleted or disabled account fails closed even after password login', async () => {
  const { client, authService } = fixture();
  client.rpc.mockResolvedValue({ data: null });
  await expect(authService.login({ email: 'user@example.test', password: 'test-password' })).rejects.toMatchObject({ status: 403 });
  expect(client.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
});
test('catalog adapter uses RPC envelopes and never sends staff mode for public reads', async () => {
  const { client, propertyService } = fixture();
  client.rpc.mockResolvedValue({ data: { properties: [], total: 0, page: 1, pages: 0 } });
  await expect(propertyService.getAll({ minPrice: '12.34' })).resolves.toEqual({ data: { properties: [], total: 0, page: 1, pages: 0 } });
  expect(client.rpc).toHaveBeenCalledWith('list_properties', { p_filters: { minPrice: '12.34' }, p_admin: false });
  await propertyService.getAdminAll({ page: 2 });
  expect(client.rpc).toHaveBeenLastCalledWith('list_properties', { p_filters: { page: 2 }, p_admin: true });
});
test('unfinished mutations fail closed instead of falling back to Express', async () => {
  const { client, propertyService, inquiryService } = fixture();
  await expect(propertyService.create({})).rejects.toMatchObject({ status: 503 });
  await expect(inquiryService.create({})).rejects.toMatchObject({ status: 503 });
  expect(client.rpc).not.toHaveBeenCalled();
});
test('database permission errors keep a useful transport-independent status', async () => {
  const { client, propertyService } = fixture();
  client.rpc.mockResolvedValue({ error: { code: '42501', message: 'Permission required' } });
  await expect(propertyService.getAdminAll()).rejects.toMatchObject({ status: 403, response: { data: { message: 'Permission required' } } });
});
test('password recovery uses same-origin allowlisted reset route', async () => {
  const { client, authService } = fixture();
  await authService.requestPasswordReset(' user@example.test ');
  expect(client.auth.resetPasswordForEmail).toHaveBeenCalledWith('user@example.test', { redirectTo: `${window.location.origin}/reset-password` });
});
test('failed server logout still attempts to remove the local SDK session', async () => {
  const { client, authService } = fixture();
  client.auth.signOut.mockResolvedValueOnce({ error: { status: 503, message: 'Offline' } }).mockResolvedValueOnce({});
  await expect(authService.logout()).rejects.toMatchObject({ status: 503 });
  expect(client.auth.signOut).toHaveBeenNthCalledWith(1, { scope: 'global' });
  expect(client.auth.signOut).toHaveBeenNthCalledWith(2, { scope: 'local' });
});
