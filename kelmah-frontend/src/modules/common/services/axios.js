/**
 * Axios Configuration
 *
 * Centralized axios instance with interceptors for authentication,
 * error handling, and request/response processing.
 */

import axios from 'axios';
import {
  API_BASE_URL,
  AUTH_CONFIG,
  PERFORMANCE_CONFIG,
  LOG_CONFIG,
  SERVICES,
} from '../../../config/environment';
import { secureStorage } from '../../../utils/secureStorage';

// Create axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: PERFORMANCE_CONFIG.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add auth token securely
    const token = secureStorage.getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add security headers
    config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    config.headers['X-Client-Version'] = '1.0.0';

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };

    // Log request in development
    if (LOG_CONFIG.enableConsole) {
      console.group(
        `🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`,
      );
      console.log('Config:', {
        baseURL: config.baseURL,
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.data,
      });
      console.groupEnd();
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  },
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = new Date() - response.config.metadata.startTime;

    // Log response in development
    if (LOG_CONFIG.enableConsole) {
      console.group(`✅ API Response: ${response.status} (${duration}ms)`);
      console.log('Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
      });
      console.groupEnd();
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Calculate request duration if available
    const duration = originalRequest?.metadata?.startTime
      ? new Date() - originalRequest.metadata.startTime
      : 'unknown';

    // Enhanced error logging
    if (LOG_CONFIG.enableConsole) {
      console.group(
        `❌ API Error: ${error.response?.status || 'Network'} (${duration}ms)`,
      );
      console.error('Error details:', {
        url: originalRequest?.url,
        method: originalRequest?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        data: error.response?.data,
      });
      console.groupEnd();
    }

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = secureStorage.getRefreshToken();

      if (refreshToken) {
        try {
          // Use a new axios instance to avoid interceptor loops
          const refreshResponse = await axios.post(
            `${API_BASE_URL}/api/auth/refresh-token`,
            { refreshToken },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: PERFORMANCE_CONFIG.apiTimeout,
            },
          );

          const newToken =
            refreshResponse.data.data?.token || refreshResponse.data.token;

          if (newToken) {
            // Update stored token securely
            secureStorage.setAuthToken(newToken);

            // Update the failed request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            // Retry the original request
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);

          // Clear auth data securely
          secureStorage.clear();

          // Redirect to login page
          if (typeof window !== 'undefined') {
            window.location.href = '/login?reason=session_expired';
          }

          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login?reason=no_token';
        }
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.warn('Access forbidden - insufficient permissions');

      // You might want to redirect to an unauthorized page
      if (
        typeof window !== 'undefined' &&
        window.location.pathname !== '/unauthorized'
      ) {
        window.location.href = '/unauthorized';
      }
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.warn('Resource not found:', originalRequest?.url);
    }

    // Handle 500 Server Error
    if (error.response?.status >= 500) {
      console.error('Server error occurred');

      // You might want to show a global error notification here
    }

    // Network errors
    if (!error.response) {
      console.error('Network error - check your internet connection');
    }

    return Promise.reject(error);
  },
);

// Helper function to create API calls with consistent error handling
export const createApiCall = (method, url, data = null, config = {}) => {
  const requestConfig = {
    method,
    url,
    ...config,
  };

  if (data && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
    requestConfig.data = data;
  } else if (data && method.toLowerCase() === 'get') {
    requestConfig.params = data;
  }

  return axiosInstance(requestConfig);
};

// Helper functions for common HTTP methods
export const apiGet = (url, params = null, config = {}) =>
  createApiCall('GET', url, params, config);

export const apiPost = (url, data = null, config = {}) =>
  createApiCall('POST', url, data, config);

export const apiPut = (url, data = null, config = {}) =>
  createApiCall('PUT', url, data, config);

export const apiPatch = (url, data = null, config = {}) =>
  createApiCall('PATCH', url, data, config);

export const apiDelete = (url, config = {}) =>
  createApiCall('DELETE', url, null, config);

// File upload helper
export const uploadFile = (url, file, onProgress = null) => {
  const formData = new FormData();
  formData.append('file', file);

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };

  if (onProgress) {
    config.onUploadProgress = (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total,
      );
      onProgress(percentCompleted);
    };
  }

  return apiPost(url, formData, config);
};

// Create service-specific clients with optimized configurations
export const authServiceClient = axios.create({
  baseURL: SERVICES.AUTH_SERVICE,
  timeout: 5000, // Reduced timeout for better UX
  headers: {
    'Content-Type': 'application/json',
  },
});

export const userServiceClient = axios.create({
  baseURL: SERVICES.USER_SERVICE,
  timeout: 10000, // Increased timeout for better reliability
  headers: {
    'Content-Type': 'application/json',
  },
});

export const jobServiceClient = axios.create({
  baseURL: SERVICES.JOB_SERVICE,
  timeout: 10000, // Increased timeout for better reliability
  headers: {
    'Content-Type': 'application/json',
  },
});

export const messagingServiceClient = axios.create({
  baseURL: SERVICES.MESSAGING_SERVICE,
  timeout: 5000, // Reduced timeout for better UX
  headers: {
    'Content-Type': 'application/json',
  },
});

export const paymentServiceClient = axios.create({
  baseURL: SERVICES.PAYMENT_SERVICE,
  timeout: 5000, // Reduced timeout for better UX
  headers: {
    'Content-Type': 'application/json',
  },
});

export const schedulingClient = axios.create({
  baseURL: SERVICES.USER_SERVICE, // Using user service for scheduling
  timeout: 5000, // Reduced timeout for better UX
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptors to all service clients
[authServiceClient, userServiceClient, jobServiceClient, messagingServiceClient, paymentServiceClient, schedulingClient].forEach(client => {
  // Request interceptor
  client.interceptors.request.use(
    (config) => {
      // Add auth token securely
      const token = secureStorage.getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add request timestamp for debugging
      config.metadata = { startTime: new Date() };

      // Log request in development
      if (LOG_CONFIG.enableConsole) {
        console.group(
          `🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`,
        );
        console.log('Config:', {
          baseURL: config.baseURL,
          url: config.url,
          method: config.method,
          headers: config.headers,
          data: config.data,
        });
        console.groupEnd();
      }

      return config;
    },
    (error) => {
      console.error('❌ Request Error:', error);
      return Promise.reject(error);
    },
  );

  // Response interceptor
  client.interceptors.response.use(
    (response) => {
      // Log response time in development
      if (LOG_CONFIG.enableConsole && response.config.metadata) {
        const duration = new Date() - response.config.metadata.startTime;
        console.log(
          `✅ Response received in ${duration}ms for ${response.config.method?.toUpperCase()} ${response.config.url}`,
        );
      }

      return response;
    },
    (error) => {
      // Log error in development
      if (LOG_CONFIG.enableConsole) {
        console.error('❌ API Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
        });
      }

      return Promise.reject(error);
    },
  );
});

// Get token from secure storage for external use
export const getAuthToken = () => {
  return secureStorage.getAuthToken();
};

export default axiosInstance;
