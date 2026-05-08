import axios from 'axios';

const ADMIN_TOKEN_KEY = 'kelmah_admin_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const getMessageFromPayload = (payload) => {
  if (!payload) {
    return null;
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (payload.error && typeof payload.error === 'string') {
    return payload.error;
  }

  if (payload.error?.message) {
    return payload.error.message;
  }

  if (payload.message) {
    return payload.message;
  }

  return null;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const payload = error?.response?.data;
    const message =
      getMessageFromPayload(payload) ||
      error?.message ||
      'Request failed. Please try again.';

    const wrapped = new Error(message);
    wrapped.status = error?.response?.status;
    wrapped.payload = payload;
    wrapped.cause = error;

    return Promise.reject(wrapped);
  },
);

export default api;
