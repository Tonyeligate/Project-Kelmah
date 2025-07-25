import axiosInstance from '../services/axios';
import { API_BASE_URL } from '../../../config/constants';

// Use Node.js environment variables for tests
const metaEnv = process.env;

/**
 * Check if the API is reachable
 * @param {boolean} showLoading - Whether to show loading state in component
 * @returns {Promise<boolean>} - Whether the API is reachable
 */
export const checkApiHealth = async (showLoading = true) => {
  try {
    // In development, allow proceeding without API connectivity
    if (import.meta.env.DEV) {
      console.log('Development mode: Assuming API is available');
      return true;
    }

    // Check actual health endpoint
    const response = await axiosInstance.get('/health', {
      timeout: 3000, // Shorter timeout for faster development
      skipAuthRefresh: true, // Don't try to refresh tokens on health check
      skipErrorHandling: true, // Handle errors locally
    });
    return response.status === 200;
  } catch (error) {
    console.log('API health check failed:', error.message);
    return import.meta.env.DEV; // In development, proceed even if API is down
  }
};

// Utility functions for API calls
export const apiService = {
  /**
   * Make a GET request
   * @param {string} url - URL to request
   * @param {Object} params - Query parameters
   * @param {Object} options - Additional options
   * @returns {Promise<any>} - Promise with response data
   */
  get: (url, params = {}, options = {}) => {
    return axiosInstance
      .get(url, { params, ...options })
      .then((response) => response.data);
  },

  /**
   * Make a POST request
   * @param {string} url - URL to request
   * @param {Object} data - Data to send
   * @param {Object} options - Additional options
   * @returns {Promise<any>} - Promise with response data
   */
  post: (url, data = {}, options = {}) => {
    return axiosInstance
      .post(url, data, options)
      .then((response) => response.data);
  },

  /**
   * Make a PUT request
   * @param {string} url - URL to request
   * @param {Object} data - Data to send
   * @param {Object} options - Additional options
   * @returns {Promise<any>} - Promise with response data
   */
  put: (url, data = {}, options = {}) => {
    return axiosInstance
      .put(url, data, options)
      .then((response) => response.data);
  },

  /**
   * Make a DELETE request
   * @param {string} url - URL to request
   * @param {Object} options - Additional options
   * @returns {Promise<any>} - Promise with response data
   */
  delete: (url, options = {}) => {
    return axiosInstance.delete(url, options).then((response) => response.data);
  },
};
