import axiosInstance from '../utils/axiosConfig';

// Auth services
export const authService = {
  subscribe: (listener) => {
    const expired = () => listener('SIGNED_OUT', null);
    window.addEventListener('legacySessionExpired', expired);
    return () => window.removeEventListener('legacySessionExpired', expired);
  },
  register: (data) => axiosInstance.post('/auth/register', data),
  login: (data) => axiosInstance.post('/auth/login', data),
  logout: () => axiosInstance.post('/auth/logout'),
  getCurrentUser: () => axiosInstance.get('/auth/me'),
  updateProfile: (data) => axiosInstance.put('/auth/profile', data),
  refreshToken: () => axiosInstance.post('/auth/refresh'),
};

// Property services
export const propertyService = {
  getAll: (params) => axiosInstance.get('/properties', { params }),
  getFeatured: () => axiosInstance.get('/properties/featured'),
  getById: (id) => axiosInstance.get(`/properties/${id}`),
  create: (data) => axiosInstance.post('/properties', data),
  update: (id, data) => axiosInstance.put(`/properties/${id}`, data),
  delete: (id) => axiosInstance.delete(`/properties/${id}`),
  search: (q) => axiosInstance.get('/properties/search', { params: { q } }),
  getNextSequentialId: (category) => axiosInstance.get(`/properties/next-id/${category}`),
};

// Category services
export const categoryService = {
  getAll: () => axiosInstance.get('/categories'),
  getById: (id) => axiosInstance.get(`/categories/${id}`),
  create: (data) => axiosInstance.post('/categories', data),
  update: (id, data) => axiosInstance.put(`/categories/${id}`, data),
  delete: (id) => axiosInstance.delete(`/categories/${id}`),
};

// Inquiry services
export const inquiryService = {
  create: (data) => axiosInstance.post('/inquiries', data),
  getAll: (params) => axiosInstance.get('/inquiries', { params }),
  getById: (id) => axiosInstance.get(`/inquiries/${id}`),
  updateStatus: (id, data) => axiosInstance.put(`/inquiries/${id}`, data),
  delete: (id) => axiosInstance.delete(`/inquiries/${id}`),
};

// Admin services
export const adminService = {
  getDashboardStats: () => axiosInstance.get('/admin/stats'),
  getAllUsers: (params) => axiosInstance.get('/admin/users', { params }),
  deleteUser: (id) => axiosInstance.delete(`/admin/users/${id}`),
  createUser: (data) => axiosInstance.post('/admin/users', data),
};
