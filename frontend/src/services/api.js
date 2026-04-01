import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-redirect on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  listUsers: () => api.get('/auth/users'),
  updateRole: (id, role) => api.patch(`/auth/users/${id}/role`, { role }),
  toggleStatus: (id) => api.patch(`/auth/users/${id}/status`),
};

// ── Videos ────────────────────────────────────────────────────────────────────
export const videosAPI = {
  upload: (formData, onProgress) =>
    api.post('/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0, // no timeout for large uploads
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    }),

  list: (params = {}) => api.get('/videos', { params }),
  getOne: (id) => api.get(`/videos/${id}`),
  update: (id, data) => api.patch(`/videos/${id}`, data),
  delete: (id) => api.delete(`/videos/${id}`),
  stats: () => api.get('/videos/stats'),

  // Build streaming URL (auth header can't be set on <video> src, so we send token as query param)
  streamUrl: (id) => {
    const token = localStorage.getItem('token');
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    return `${base}/videos/${id}/stream?token=${token}`;
  },
  thumbnailUrl: (id) => {
    const token = localStorage.getItem('token');
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    return `${base}/videos/${id}/thumbnail?token=${token}`;
  },
};

export default api;
