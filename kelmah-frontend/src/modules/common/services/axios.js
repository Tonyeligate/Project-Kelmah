import axios from 'axios';
import { API_BASE_URL, TOKEN_KEY } from '../../../config/constants';

// Create an axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
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
  }
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
        data: error.response?.data
      });
    }

    const originalRequest = error.config;
    
    // Handle token expiration and refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Token refresh logic would go here
      
      // For now, just redirect to login
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
