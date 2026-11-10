jest.mock('axios', () => {
  const instance = jest.fn().mockResolvedValue({ data: { success: true } });
  instance.interceptors = { request: { use: jest.fn() }, response: { use: jest.fn() } };
  return { create: jest.fn(() => instance), post: jest.fn() };
});
let axios;
let transport;
let client;
let handleError;
beforeEach(() => {
  jest.resetModules();
  axios = require('axios'); transport = require('./axiosConfig'); client = transport.default;
  handleError = client.interceptors.response.use.mock.calls[0][1];
});
const unauthorized = url => ({ config: { url, headers: {} }, response: { status: 401 } });
test('invalid login credentials never start refresh or redirect loops', async () => {
  const error = unauthorized('/auth/login');
  await expect(handleError(error)).rejects.toBe(error);
  expect(axios.post).not.toHaveBeenCalled();
});
test('concurrent expired API requests share one refresh', async () => {
  let finish;
  axios.post.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const first = handleError(unauthorized('/auth/me'));
  const second = handleError(unauthorized('/properties'));
  expect(axios.post).toHaveBeenCalledTimes(1);
  finish({ data: { accessToken: 'synthetic-access-token' } });
  await Promise.all([first, second]);
  expect(client).toHaveBeenCalledTimes(2);
  expect(client.mock.calls[0][0].headers.Authorization).toBe('Bearer synthetic-access-token');
});
test('a refresh finishing after logout cannot restore the token', async () => {
  let finish;
  axios.post.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const result = handleError(unauthorized('/auth/me')).catch(error => error);
  transport.clearAccessToken();
  finish({ data: { accessToken: 'stale-synthetic-token' } });
  expect((await result).sessionChanged).toBe(true);
  expect(transport.getAccessToken()).toBeNull();
  expect(client).not.toHaveBeenCalled();
});
test('failed refresh reports session expiry without forcing public pages to login', async () => {
  const previous = window.location.href;
  const expired = jest.fn(); window.addEventListener('legacySessionExpired', expired);
  axios.post.mockRejectedValue(new Error('No refresh session'));
  await expect(handleError(unauthorized('/auth/me'))).rejects.toThrow('No refresh session');
  expect(expired).toHaveBeenCalledTimes(1);
  expect(window.location.href).toBe(previous);
  window.removeEventListener('legacySessionExpired', expired);
});
