import { createPropertyMutations } from './propertyMutations';
import { createInquiryService } from './inquiries';
// Existing response envelopes stay at this boundary. No Express calls in this mode.
export function apiError(error) {
  const status = error.status || (error.code === '42501' ? 403 : error.code === 'P0002' ? 404 : ['23505', '23503'].includes(error.code) ? 409 : 400);
  return Object.assign(new Error(error.message || 'Request failed. Please try again.'), {
    status, response: { status, data: { message: error.message || 'Request failed. Please try again.', ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}) } },
  });
}
const envelope = data => ({ data });
export function createSupabaseApi(getClient) {
  const rpc = async (name, args) => {
    const { data, error } = await getClient().rpc(name, args);
    if (error) throw apiError(error);
    return envelope(data);
  };
  const unavailable = async () => { throw apiError({ status: 503, message: 'This action is currently unavailable. Please try again later.' }); };
  const currentUser = async () => {
    const { data, error } = await getClient().auth.getSession();
    if (error) throw apiError(error);
    if (!data.session) return envelope({ user: null });
    let response = await rpc('current_account');
    if (!response.data) {
      // Only the DB can activate a completed, confirmed invitation with a password.
      await rpc('accept_invitation');
      response = await rpc('current_account');
    }
    if (!response.data) throw apiError({ status: 403, message: 'Your account is unavailable. Please contact support.' });
    return envelope({ user: { ...response.data, _id: response.data.id, email: data.session.user.email } });
  };
  const authService = {
    getCurrentUser: currentUser,
    clearLocalSession: () => getClient().auth.signOut({ scope: 'local' }),
    async login({ email, password }) {
      const { error } = await getClient().auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw apiError(error);
      try { return await currentUser(); } catch (failure) {
        await getClient().auth.signOut({ scope: 'local' });
        throw failure;
      }
    },
    async register({ email, password, name, phone }) {
      const { data, error } = await getClient().auth.signUp({
        email: email.trim(), password,
        options: { data: { name: name.trim(), phone: (phone || '').trim() }, emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw apiError(error);
      return data.session ? currentUser() : envelope({ user: null, requiresConfirmation: true });
    },
    async logout() {
      const { error } = await getClient().auth.signOut({ scope: 'global' });
      if (error) {
        await getClient().auth.signOut({ scope: 'local' });
        throw apiError(error);
      }
      return envelope({});
    },
    async updateProfile({ name, phone }) {
      const user = (await currentUser()).data.user;
      if (!user) throw apiError({ status: 401, message: 'Please log in.' });
      const { error } = await getClient().from('profiles').update({ name: name.trim(), phone: (phone || '').trim() }).eq('id', user.id);
      if (error) throw apiError(error);
      return currentUser();
    },
    async requestPasswordReset(email) {
      const { error } = await getClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
      if (error) throw apiError(error);
      return envelope({});
    },
    async updatePassword(password) {
      const { error } = await getClient().auth.updateUser({ password });
      if (error) throw apiError(error);
      return envelope({});
    },
    async verifyInvitation(tokenHash) {
      if (!/^[a-zA-Z0-9_-]{20,512}$/.test(tokenHash || '')) throw apiError({ status: 400, message: 'Invalid invitation link.' });
      const { error } = await getClient().auth.verifyOtp({ token_hash: tokenHash, type: 'invite' });
      if (error) throw apiError(error);
    },
    activateInvitation: () => rpc('accept_invitation'),
    subscribe(listener) {
      const { data } = getClient().auth.onAuthStateChange((event, session) => listener(event, session));
      return () => data.subscription.unsubscribe();
    },
  };
  const categoryDto = c => ({ ...c, _id: c.id, createdAt: c.created_at, parentCategory: c.parent_id || 'none' });
  const saveCategory = async (id, input) => {
    const response = await rpc('save_category', {
      p_id: id, p_name: input.name, p_description: input.description || '',
      p_icon: input.icon || '', p_parent_id: !input.parentCategory || input.parentCategory === 'none' ? null : input.parentCategory,
      p_set_parent: true,
    });
    return envelope({ category: categoryDto(response.data) });
  };
  const categories = async () => {
    const { data, error } = await getClient().from('categories').select('id,code,name,description,icon,parent_id,is_system,created_at').order('name');
    if (error) throw apiError(error);
    return envelope({ categories: data.map(categoryDto) });
  };
  const adminInvoke = async body => {
    const { data, error } = await getClient().functions.invoke('admin-users', { body });
    if (error) {
      let detail;
      try { detail = await error.context?.json(); } catch (_) { /* No readable provider response. */ }
      throw apiError({ status: error.context?.status || 503, message: detail?.error || 'Account service is unavailable. Please try again.' });
    }
    return envelope(data);
  };
  return {
    authService,
    propertyService: {
      getAll: (params = {}) => rpc('list_properties', { p_filters: params, p_admin: false }),
      getAdminAll: (params = {}) => rpc('list_properties', { p_filters: params, p_admin: true }),
      getFeatured: () => rpc('featured_properties'),
      getById: id => rpc('get_property', { p_id: id }),
      search: q => rpc('search_properties', { p_query: q }),
      ...createPropertyMutations(getClient, apiError), getNextSequentialId: unavailable,
    },
    categoryService: {
      getAll: categories,
      async getById(id) {
        const category = (await categories()).data.categories.find(c => c.id === id);
        if (!category) throw apiError({ status: 404, message: 'Category not found' });
        return envelope({ category });
      },
      create: input => saveCategory(null, input),
      update: (id, input) => saveCategory(id, input),
      delete: id => rpc('delete_category', { p_id: id }),
    },
    inquiryService: createInquiryService(getClient, apiError),
    adminService: {
      getDashboardStats: () => rpc('get_dashboard_stats'),
      getAllUsers: (params = {}) => adminInvoke({ ...params, action: 'list' }),
      createUser: data => adminInvoke({ ...data, action: 'invite' }),
      deleteUser: (id, options = {}) => adminInvoke({ ...options, action: 'delete', targetId: id }),
      updateUserAccess: (id, data) => adminInvoke({ ...data, action: 'access', targetId: id }),
      getOperations: () => adminInvoke({ action: 'operations' }),
      retryOperation: (id, password) => adminInvoke({ action: 'retry', operationId: id, ...(password && { password }) }),
    },
  };
}
