import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.message || err.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

const toFormData = (data, file) => {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    fd.append(k, typeof v === 'object' && !(v instanceof File) ? JSON.stringify(v) : v);
  });
  if (file) fd.append('file', file);
  return fd;
};

export const contextApi = {
  list: (includeStale = false) => api.get(`/context?includeStale=${includeStale}`),
  retrieve: (params) => api.get('/context/retrieve', { params }),
  analyze: (params) => api.get('/context/analyze', { params }),
  get: (id) => api.get(`/context/${id}`),
  create: (data, file) =>
    file
      ? api.post('/context', toFormData(data, file), { headers: { 'Content-Type': 'multipart/form-data' } })
      : api.post('/context', data),
  update: (id, data, file) =>
    file
      ? api.put(`/context/${id}`, toFormData(data, file), { headers: { 'Content-Type': 'multipart/form-data' } })
      : api.put(`/context/${id}`, data),
  delete: (id) => api.delete(`/context/${id}`),
  explain: (id, query = '') => api.get(`/context/explain/${id}`, { params: { query } }),
  stats: () => api.get('/context/stats'),
};

export const ragApi = {
  query: (query) => api.post('/rag/query', { query }),
};
