// Temporary Express adapter. Supabase mode never uses this session/transport.
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const axiosInstance = axios.create({ baseURL: API_URL, withCredentials: true });
let accessToken = null;
let tokenVersion = 0;
let refreshing;
axiosInstance.interceptors.request.use(config => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  if (!(config.data instanceof FormData)) config.headers['Content-Type'] = 'application/json';
  return config;
});
axiosInstance.interceptors.response.use(response => response, async error => {
  const request = error.config;
  const isAuthAction = /\/auth\/(login|register|logout|refresh)$/.test(request?.url || '');
  if (error.response?.status !== 401 || !request || request._retry || isAuthAction) throw error;
  request._retry = true;
  const requestVersion = tokenVersion;
  try {
    if (!refreshing) {
      refreshing = axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
        .then(response => {
          if (requestVersion !== tokenVersion) throw Object.assign(new Error('Session changed'), { sessionChanged: true });
          accessToken = response.data.accessToken;
        })
        .finally(() => { refreshing = null; });
    }
    await refreshing;
    if (requestVersion !== tokenVersion) throw Object.assign(new Error('Session changed'), { sessionChanged: true });
    request.headers.Authorization = `Bearer ${accessToken}`;
    return axiosInstance(request);
  } catch (failure) {
    if (requestVersion === tokenVersion && !failure.sessionChanged) {
      accessToken = null;
      window.dispatchEvent(new Event('legacySessionExpired'));
    }
    throw failure;
  }
});
export const setAccessToken = token => { ++tokenVersion; accessToken = token; };
export const getAccessToken = () => accessToken;
export const clearAccessToken = () => { ++tokenVersion; accessToken = null; };
export default axiosInstance;
