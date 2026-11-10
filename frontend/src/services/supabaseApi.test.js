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
test('unfinished category editor mutations fail closed instead of falling back to Express', async () => {
  const { client, categoryService } = fixture();
  await expect(categoryService.create({})).rejects.toMatchObject({ status: 503 });
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

test('admin adapter invokes the protected Edge Function with action and request ID', async () => {
  const { client,adminService } = fixture();
  client.functions = { invoke:jest.fn().mockResolvedValue({ data:{ operationId:'request-id',completed:true } }) };
  await adminService.createUser({ name:'Invitee',email:'invitee@example.test',role:'user',permissions:[],requestId:'request-id' });
  expect(client.functions.invoke).toHaveBeenCalledWith('admin-users',{ body:{ action:'invite',name:'Invitee',email:'invitee@example.test',role:'user',permissions:[],requestId:'request-id' } });
});
test('admin adapter reads safe Edge error status instead of treating an HTTP error as success', async () => {
  const { client,adminService } = fixture();
  client.functions = { invoke:jest.fn().mockResolvedValue({ error:{ context:{ status:409,json:async() => ({ error:'Account changed; reload.' }) } } }) };
  await expect(adminService.updateUserAccess('target',{})).rejects.toMatchObject({ status:409,message:'Account changed; reload.' });
});
test('invitation confirmation verifies only invite token hashes', async () => {
  const { client,authService } = fixture();
  client.auth.verifyOtp = jest.fn().mockResolvedValue({});
  await authService.verifyInvitation('synthetic-invitation-token-hash');
  expect(client.auth.verifyOtp).toHaveBeenCalledWith({ token_hash:'synthetic-invitation-token-hash',type:'invite' });
  await expect(authService.verifyInvitation('bad')).rejects.toMatchObject({ status:400 });
});
test('account activation goes through the server invitation gate', async () => {
  const { client,authService } = fixture();
  await authService.activateInvitation();
  expect(client.rpc).toHaveBeenCalledWith('accept_invitation',undefined);
});
