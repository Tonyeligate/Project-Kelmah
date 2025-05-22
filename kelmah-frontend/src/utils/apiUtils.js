import axios from 'axios';
import { API_BASE_URL } from '../config/constants';
import { STORAGE_KEYS } from '../config/constants';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Add a request interceptor to add authentication token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle token expiration
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Log errors in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('API Error:', error.response || error);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Check if the API is healthy and reachable
 * @param {boolean} showLogging - Whether to show console logs
 * @returns {Promise<boolean>} - Whether the API is healthy
 */
export const checkApiHealth = async (showLogging = true) => {
  try {
    // Use 'health' without '/api' prefix to avoid duplication since baseURL already includes it
    const response = await api.get('/health', { 
      timeout: 5000,
      // Skip auth refresh to avoid unnecessary token operations
      skipAuthRefresh: true,
      // Skip error handling to prevent error logs
      skipErrorHandling: true
    });
    if (showLogging) {
      console.log('API health check: OK');
    }
    return response.status === 200;
  } catch (error) {
    if (showLogging) {
      console.warn('API health check failed:', error.message);
    }
    return false;
  }
};

/**
 * Check if the API is reachable (simpler check)
 * @returns {Promise<boolean>} - Whether the API is reachable
 */
export const isApiReachable = async () => {
  try {
    // Use a base URL without the /api suffix for the HEAD request
    const baseURL = API_BASE_URL.replace(/\/api$/, '');
    await fetch(baseURL, { 
      method: 'HEAD', 
      mode: 'no-cors',
      cache: 'no-store',
      timeout: 3000
    });
    return true;
  } catch (error) {
    return false;
  }
};

// Wrapper functions for API calls with better error handling
export const apiService = {
  /**
   * Make a GET request
   * @param {string} url - API endpoint
   * @param {Object} params - URL parameters
   * @param {Object} options - Additional axios options
   * @returns {Promise} - Response promise
   */
  get: async (url, params = {}, options = {}) => {
    try {
      const response = await api.get(url, { ...options, params });
      return response.data;
    } catch (error) {
      processApiError(error);
      throw error;
    }
  },

  /**
   * Make a POST request
   * @param {string} url - API endpoint
   * @param {Object} data - Request body
   * @param {Object} options - Additional axios options
   * @returns {Promise} - Response promise
   */
  post: async (url, data = {}, options = {}) => {
    try {
      const response = await api.post(url, data, options);
      return response.data;
    } catch (error) {
      processApiError(error);
      throw error;
    }
  },

  /**
   * Make a PUT request
   * @param {string} url - API endpoint
   * @param {Object} data - Request body
   * @param {Object} options - Additional axios options
   * @returns {Promise} - Response promise
   */
  put: async (url, data = {}, options = {}) => {
    try {
      const response = await api.put(url, data, options);
      return response.data;
    } catch (error) {
      processApiError(error);
      throw error;
    }
  },

  /**
   * Make a PATCH request
   * @param {string} url - API endpoint
   * @param {Object} data - Request body
   * @param {Object} options - Additional axios options
   * @returns {Promise} - Response promise
   */
  patch: async (url, data = {}, options = {}) => {
    try {
      const response = await api.patch(url, data, options);
      return response.data;
    } catch (error) {
      processApiError(error);
      throw error;
    }
  },

  /**
   * Make a DELETE request
   * @param {string} url - API endpoint
   * @param {Object} options - Additional axios options
   * @returns {Promise} - Response promise
   */
  delete: async (url, options = {}) => {
    try {
      const response = await api.delete(url, options);
      return response.data;
    } catch (error) {
      processApiError(error);
      throw error;
    }
  },
};

/**
 * Handle API errors with appropriate messaging
 * @param {Error} error - The error object
 */
const processApiError = (error) => {
  let errorMessage = 'An unknown error occurred';
  
  if (error.response) {
    // Server responded with an error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        errorMessage = data.message || 'Invalid request';
        break;
      case 401:
        errorMessage = 'Unauthorized - Please log in again';
        break;
      case 403:
        errorMessage = 'You do not have permission to access this resource';
        break;
      case 404:
        errorMessage = 'Resource not found';
        break;
      case 422:
        errorMessage = data.message || 'Validation error';
        break;
      case 500:
        errorMessage = 'Server error - Please try again later';
        break;
      default:
        errorMessage = data.message || `Error ${status}`;
    }
  } else if (error.request) {
    // Request was made but no response received
    errorMessage = 'No response from server. Please check your internet connection.';
  }
  
  // You can integrate with a toast or notification system here
  console.error(errorMessage);
  
  return errorMessage;
};

/**
 * Export a function to get detailed API error information
 * @param {Error} error - The error object
 * @returns {Object} - Formatted error information
 */
export const handleApiError = (error) => {
  const errorInfo = {
    message: 'An unknown error occurred',
    status: null,
    details: null
  };
  
  if (error.response) {
    // Server responded with an error status
    const { status, data } = error.response;
    errorInfo.status = status;
    
    if (data.message) {
      errorInfo.message = data.message;
    } else if (data.error) {
      errorInfo.message = data.error;
    } else {
      switch (status) {
        case 400: errorInfo.message = 'Invalid request'; break;
        case 401: errorInfo.message = 'Unauthorized - Please log in again'; break;
        case 403: errorInfo.message = 'Access forbidden'; break;
        case 404: errorInfo.message = 'Resource not found'; break;
        case 422: errorInfo.message = 'Validation error'; break;
        case 500: errorInfo.message = 'Server error'; break;
        default: errorInfo.message = `Error ${status}`;
      }
    }
    
    if (data.errors) {
      errorInfo.details = data.errors;
    }
  } else if (error.request) {
    // Request was made but no response received
    errorInfo.message = 'No response from server. Please check your internet connection.';
    errorInfo.status = 0;
  }
  
  return errorInfo;
};

export default api; 