import { userServiceClient } from '../../common/services/axios';

const API_URL = '/api/workers';

/**
 * Service for managing worker earnings and analytics
 */
const earningsService = {
  /**
   * Get earnings analytics for a worker
   * @param {string} workerId - Worker ID
   * @param {string} timeRange - Time range for analytics
   * @returns {Promise<Object>} - Earnings analytics data
   */
  getEarningsAnalytics: async (workerId, timeRange = '12months') => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/${workerId}/earnings/analytics`,
        { params: { timeRange } },
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get detailed earnings breakdown
   * @param {string} workerId - Worker ID
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Object>} - Detailed earnings data
   */
  getEarningsBreakdown: async (workerId, filters = {}) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/${workerId}/earnings/breakdown`,
        { params: filters },
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get payment history
   * @param {string} workerId - Worker ID
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} - Payment history
   */
  getPaymentHistory: async (workerId, pagination = {}) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/${workerId}/payments/history`,
        { params: pagination },
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Export earnings data as CSV
   * @param {string} workerId - Worker ID
   * @param {string} timeRange - Time range for export
   * @returns {Promise<Blob>} - CSV file blob
   */
  exportEarningsData: async (workerId, timeRange = '12months') => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/${workerId}/earnings/export`,
        {
          params: { timeRange, format: 'csv' },
          responseType: 'blob',
        },
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get earnings projections
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Earnings projections
   */
  getEarningsProjections: async (workerId) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/${workerId}/earnings/projections`,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get tax information
   * @param {string} workerId - Worker ID
   * @param {string} taxYear - Tax year
   * @returns {Promise<Object>} - Tax information
   */
  getTaxInformation: async (workerId, taxYear = new Date().getFullYear()) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/${workerId}/earnings/tax`,
        { params: { taxYear } },
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get earnings comparison with peers
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Peer comparison data
   */
  getPeerComparison: async (workerId) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/${workerId}/earnings/peer-comparison`,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Removed mock generators and fallbacks. All methods now use real API or throw on failure.

export default earningsService;
