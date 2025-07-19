import axios from 'axios';
import { API_BASE_URL, TOKEN_KEY } from '../../../config';

// In development, use Vite's proxy to avoid CORS; in production, hit the real API_BASE_URL
const isDevelopment = import.meta.env.MODE === 'development';
const baseURL = isDevelopment ? '/api' : API_BASE_URL;

// Create an axios instance with default config
const axiosInstance = axios.create({
  baseURL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  // Allow credentials (e.g., cookies) for cross-domain auth
  withCredentials: true,
});

// Add request interceptor to inject auth token
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem(TOKEN_KEY);

    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // For dev mode, provide more helpful error logging
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }

    const originalRequest = error.config;

    // Handle token expiration: attempt to refresh the access token on 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          // Request new tokens using default axios (bypass interceptor)
          const tokenResponse = await axios.post(
            `${API_BASE_URL}/api/auth/refresh-token`,
            { refreshToken },
            { headers: { 'Content-Type': 'application/json' } },
          );
          const resData = tokenResponse.data;
          const newToken = resData.data?.token || resData.token;
          const newRefreshToken =
            resData.data?.refreshToken || resData.refreshToken;
          // Store updated tokens
          localStorage.setItem(TOKEN_KEY, newToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          // Update axios instance headers
          axiosInstance.defaults.headers.Authorization = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          // Retry original request with new token
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear storage and redirect to login
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
