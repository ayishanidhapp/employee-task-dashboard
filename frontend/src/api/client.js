import axios from 'axios';

const TOKEN_KEY = 'taskflow_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({ baseURL: `${import.meta.env.VITE_API_URL || ''}/api` });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token expires or is rejected, drop it and send the user to the login page.
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const isLogin = err.config?.url?.includes('/auth/login');
    if (err.response?.status === 401 && !isLogin) {
      tokenStore.clear();
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(err);
  }
);

export const errMsg = (err) => err.response?.data?.message || err.message || 'Something went wrong';

export const authApi = {
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};
export const statsApi = { get: () => api.get('/stats').then((r) => r.data) };
export const employeeApi = {
  list: (params) => api.get('/employees', { params }).then((r) => r.data),
  create: (d) => api.post('/employees', d).then((r) => r.data),
  update: (id, d) => api.put(`/employees/${id}`, d).then((r) => r.data),
  remove: (id) => api.delete(`/employees/${id}`).then((r) => r.data),
};
export const taskApi = {
  list: (params) => api.get('/tasks', { params }).then((r) => r.data),
  create: (d) => api.post('/tasks', d).then((r) => r.data),
  update: (id, d) => api.put(`/tasks/${id}`, d).then((r) => r.data),
  setStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }).then((r) => r.data),
  remove: (id) => api.delete(`/tasks/${id}`).then((r) => r.data),
};

export default api;
