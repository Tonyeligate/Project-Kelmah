import axiosInstance from '../services/axios';

// Use Node.js environment variables for tests
const metaEnv = process.env;

/**
 * Check if the API is reachable
 * @param {boolean} showLoading - Whether to show loading state in component
 * @returns {Promise<boolean>} - Whether the API is reachable
 */
export const checkApiHealth = async (showLoading = true) => {
  // In development, allow proceeding without API connectivity
  if (import.meta.env.DEV) {
    console.log('Development mode: Assuming API is available');
    return true;
  }

  const maxAttempts = 3;
  const baseTimeoutMs = 3000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const timeout = baseTimeoutMs * attempt; // simple linear backoff
    try {
      const response = await axiosInstance.get('/health', {
        timeout,
        skipAuthRefresh: true,
        skipErrorHandling: true,
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });
      return response.status === 200;
    } catch (error) {
      const isLast = attempt === maxAttempts;
      console.log(
        `API health check attempt ${attempt}/${maxAttempts} failed:`,
        error?.message || 'unknown error'
      );
      if (isLast) {
        return false;
      }
      // brief delay before next attempt
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    }
  }
  return false;
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
