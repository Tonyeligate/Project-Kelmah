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
import { handleServiceError, getServiceStatusMessage } from '../../../utils/serviceHealthCheck';

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

// Normalize url when baseURL already includes /api but url also begins with /api
const normalizeUrlForGateway = (config) => {
  try {
    const base = typeof config.baseURL === 'string' ? config.baseURL : '';
    const url = typeof config.url === 'string' ? config.url : '';
    const baseEndsWithApi = base === '/api' || base.endsWith('/api');
    const urlStartsWithApi = url === '/api' || url.startsWith('/api/');
    if (baseEndsWithApi && urlStartsWithApi) {
      config.url = url.replace(/^\/api\/?/, '/');
    }
  } catch (_) {}
  return config;
};

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Normalize to avoid /api/api duplication
    config = normalizeUrlForGateway(config);
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
            `${API_BASE_URL}/auth/refresh-token`,
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

// Enhanced timeout configuration for different environments
const getTimeoutConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  
  // For Render services (production), use longer timeout to handle cold starts
  if (!isDevelopment && !isLocal) {
    return {
      timeout: 90000, // 90 seconds for cold starts on Render (increased)
      retries: 5, // More retries for production
      retryDelay: 3000, // 3 seconds between retries
      maxRetryDelay: 30000, // Max 30 seconds
    };
  }
  
  // For local development or localhost
  return {
    timeout: 15000, // 15 seconds for local services (increased)
    retries: 3,
    retryDelay: 1500,
    maxRetryDelay: 10000,
  };
};

const timeoutConfig = getTimeoutConfig();

// Enhanced retry interceptor for handling cold starts with service health context
const retryInterceptor = (client, maxRetries = timeoutConfig.retries) => {
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { config } = error;
      const serviceUrl = config.baseURL;
      
      // Don't retry if we've already retried or if it's not a timeout/network error
      if (!config || config.__retryCount >= maxRetries) {
        // Add service health context to final error
        const enhancedError = handleServiceError(error, serviceUrl);
        return Promise.reject(enhancedError);
      }
      
      // Special-case: Treat known Not Implemented endpoints as successful no-op
      // Avoid noisy errors for escrow listing while backend is not implemented
      if (
        error.response?.status === 501 &&
        typeof config?.url === 'string' &&
        config.url.includes('/api/payments/escrows')
      ) {
        if (LOG_CONFIG.enableConsole) {
          console.warn('ℹ️ Escrow list not implemented on service - returning empty list');
        }
        // Synthesize a successful empty response
        return Promise.resolve({
          data: [],
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          request: null,
        });
      }

      // Enhanced retry logic - retry on timeouts, network errors, and 5xx errors
      const status = error.response?.status;
      // Do not retry on explicit Not Implemented (e.g., escrows stub)
      if (status === 501) {
        const enhancedError = handleServiceError(error, serviceUrl);
        return Promise.reject(enhancedError);
      }

      const shouldRetry = 
        error.code === 'ECONNABORTED' || // timeout
        error.code === 'NETWORK_ERROR' ||
        error.message?.includes('timeout') ||
        error.message?.includes('Network Error') ||
        status >= 500 || // Server errors
        status === 429 || // Rate limiting
        status === 408 || // Request timeout
        !error.response; // No response usually means network/timeout issue
      
      if (!shouldRetry) {
        const enhancedError = handleServiceError(error, serviceUrl);
        return Promise.reject(enhancedError);
      }
      
      config.__retryCount = (config.__retryCount || 0) + 1;
      
      // Enhanced exponential backoff with jitter and max delay
      const baseDelay = timeoutConfig.retryDelay;
      const exponentialDelay = baseDelay * Math.pow(2, config.__retryCount - 1);
      const jitter = Math.random() * 1000; // Add up to 1 second jitter
      const delay = Math.min(exponentialDelay + jitter, timeoutConfig.maxRetryDelay);
      
      // Get service status for better logging
      const statusMsg = getServiceStatusMessage(serviceUrl);
      
      console.warn(`🔄 Retrying request (${config.__retryCount}/${maxRetries}) after ${delay}ms delay:`, {
        url: config.url,
        method: config.method,
        error: error.message,
        serviceStatus: statusMsg.status,
        reason: statusMsg.message,
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return client.request(config);
    }
  );
};

// Helper: prefer gateway base when VITE_API_URL is provided
const getClientBaseUrl = (serviceUrl) => {
  // If a global gateway URL is set, use it for all services
  const hasGatewayEnv = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL;
  const isHttps = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
  // Avoid mixed-content by preferring relative /api over http:// base when on https
  if (isHttps) {
    const base = hasGatewayEnv ? API_BASE_URL : serviceUrl;
    if (typeof base === 'string' && base.startsWith('http:')) {
      return '/api';
    }
  }
  if (hasGatewayEnv) {
    return API_BASE_URL; // e.g., http(s)://gateway or '/api'
  }
  // In development, API_BASE_URL is '/api' (proxied to gateway)
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
    return API_BASE_URL;
  }
  // Fallback to service-specific URL (production direct service)
  return serviceUrl;
};

// Create service-specific clients with enhanced configurations
export const authServiceClient = axios.create({
  baseURL: getClientBaseUrl(SERVICES.AUTH_SERVICE),
  timeout: timeoutConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});
retryInterceptor(authServiceClient);

export const userServiceClient = axios.create({
  baseURL: getClientBaseUrl(SERVICES.USER_SERVICE),
  timeout: timeoutConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});
retryInterceptor(userServiceClient);

export const jobServiceClient = axios.create({
  baseURL: getClientBaseUrl(SERVICES.JOB_SERVICE),
  timeout: timeoutConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});
retryInterceptor(jobServiceClient);

export const messagingServiceClient = axios.create({
  baseURL: getClientBaseUrl(SERVICES.MESSAGING_SERVICE),
  timeout: timeoutConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});
retryInterceptor(messagingServiceClient);

export const paymentServiceClient = axios.create({
  baseURL: getClientBaseUrl(SERVICES.PAYMENT_SERVICE),
  timeout: timeoutConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});
retryInterceptor(paymentServiceClient);

export const reviewsServiceClient = axios.create({
  baseURL: getClientBaseUrl(SERVICES.REVIEW_SERVICE),
  timeout: timeoutConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});
retryInterceptor(reviewsServiceClient);

export const schedulingClient = axios.create({
  baseURL: getClientBaseUrl(SERVICES.USER_SERVICE), // Using user service for scheduling
  timeout: timeoutConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});
retryInterceptor(schedulingClient);

// Add auth interceptors to all service clients
[authServiceClient, userServiceClient, jobServiceClient, messagingServiceClient, paymentServiceClient, reviewsServiceClient, schedulingClient].forEach(client => {
  // Request interceptor
  client.interceptors.request.use(
    (config) => {
      // Normalize to avoid /api/api duplication
      config = normalizeUrlForGateway(config);
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

// Global session-expired notifier for appshell
axiosInstance.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      try { window.dispatchEvent(new CustomEvent('auth:tokenExpired')); } catch (_) {}
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
