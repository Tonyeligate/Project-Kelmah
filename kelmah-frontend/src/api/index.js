/**
 * API Client System
 * Main entry point for all API services
 */

import axios from 'axios';
import { API_BASE_URL } from '../config';
import { JWT_LOCAL_STORAGE_KEY, REFRESH_TOKEN_KEY } from '../config/config';
import mockWorkersApiDefault from './services/mockWorkersApi';
import workersApiDefault from './services/workersApi';

// Import all other APIs
import authApi from './services/authApi';
import jobsApi from './services/jobsApi';
import hirersApi from './services/hirersApi';
import messagesApi from './services/messagesApi';
import profileApi from './services/profileApi';
import paymentsApi from './services/paymentsApi';
import notificationsApi from './services/notificationsApi';
import reviewsApi from './services/reviewsApi';
import contractsApi from './services/contractsApi';
import searchApi from './services/searchApi';
import settingsApi from './services/settingsApi';

// Check if we should use mock mode
const USE_MOCK_MODE = true; // Set to true to use mock APIs

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor for adding auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(JWT_LOCAL_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle token expiration (401 errors)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        // Request new tokens
        const resp = await axiosInstance.post('/auth/refresh-token', { refreshToken });
        const { token: newToken, refreshToken: newRefreshToken } = resp.data;
        // Store new tokens
        localStorage.setItem(JWT_LOCAL_STORAGE_KEY, newToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        // Update authorization header and retry original request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Handle refresh failure - clear storage and redirect to login
        localStorage.removeItem(JWT_LOCAL_STORAGE_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Export configured axios instance
export default axiosInstance;

// Import and export all API services
export { default as authApi } from './services/authApi';
export { default as jobsApi } from './services/jobsApi';

// Use mockWorkersApi if in mock mode, otherwise use the real API
export const workersApi = USE_MOCK_MODE 
  ? mockWorkersApiDefault
  : workersApiDefault;

export { default as hirersApi } from './services/hirersApi';
export { messagesApi };
export { profileApi };
export { paymentsApi };
export { notificationsApi };
export { default as reviewsApi } from './services/reviewsApi';
export { default as contractsApi } from './services/contractsApi';
export { default as searchApi } from './services/searchApi';
export { default as settingsApi } from './services/settingsApi';