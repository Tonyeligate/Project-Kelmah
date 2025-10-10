import { userServiceClient } from '../../common/services/axios';

const API_URL = '/api/workers';

/**
 * Service for managing worker portfolio items
 */
const portfolioService = {
  /**
   * Get portfolio items for a worker
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Response with portfolio items
   */
  getWorkerPortfolio: async (workerId, params = {}) => {
    const response = await userServiceClient.get(
      `/api/profile/workers/${workerId}/portfolio`,
      { params },
    );
    return response.data?.data || response.data;
  },

  /**
   * Create a new portfolio item
   * @param {Object} portfolioData - Portfolio item data
   * @returns {Promise<Object>} - Created portfolio item
   */
  createPortfolioItem: async (portfolioData) => {
    const response = await userServiceClient.post(
      `/api/profile/portfolio`,
      portfolioData,
    );
    return response.data?.data || response.data;
  },

  /**
   * Update an existing portfolio item
   * @param {string} itemId - Portfolio item ID
   * @param {Object} portfolioData - Updated portfolio data
   * @returns {Promise<Object>} - Updated portfolio item
   */
  updatePortfolioItem: async (itemId, portfolioData) => {
    const response = await userServiceClient.put(
      `/api/profile/portfolio/${itemId}`,
      portfolioData,
    );
    return response.data?.data || response.data;
  },

  /**
   * Delete a portfolio item
   * @param {string} itemId - Portfolio item ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  deletePortfolioItem: async (itemId) => {
    const response = await userServiceClient.delete(
      `/api/profile/portfolio/${itemId}`,
    );
    return response.data?.data || response.data;
  },

  /**
   * Upload portfolio images
   * @param {File} file - Image file to upload
   * @returns {Promise<Object>} - Upload response with URL
   */
  uploadPortfolioImage: async (file) => {
    const response = await userServiceClient.post(
      '/api/profile/uploads/presign',
      {
        folder: 'portfolio',
        filename: file.name,
        contentType: file.type,
      },
    );
    return response.data?.data || response.data;
  },

  /**
   * Get portfolio statistics for a worker
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Portfolio statistics
   */
  getPortfolioStats: async (workerId) => {
    const response = await userServiceClient.get(
      `/api/profile/workers/${workerId}/portfolio/stats`,
    );
    return response.data?.data || response.data;
  },

  /**
   * Toggle featured status of a portfolio item
   * @param {string} itemId - Portfolio item ID
   * @param {boolean} featured - Featured status
   * @returns {Promise<Object>} - Updated portfolio item
   */
  toggleFeatured: async (itemId, featured) => {
    const response = await userServiceClient.patch(
      `/api/profile/portfolio/${itemId}`,
      { featured },
    );
    return response.data?.data || response.data;
  },

  /**
   * Share portfolio item (generate shareable link)
   * @param {string} itemId - Portfolio item ID
   * @returns {Promise<Object>} - Shareable link data
   */
  sharePortfolioItem: async (itemId) => {
    const response = await userServiceClient.post(
      `/api/profile/portfolio/${itemId}/share`,
    );
    return response.data?.data || response.data;
  },

  /**
   * Search/filter portfolio items
   * @param {string} workerId - Worker ID
   * @param {Object} filters - Search filters
   * @returns {Promise<Object>} - Filtered portfolio items
   */
  searchPortfolio: async (workerId, filters = {}) => {
    const response = await userServiceClient.get(
      `/api/profile/portfolio/search`,
      { params: { ...filters, workerId } },
    );
    return response.data?.data || response.data;
  },
};

export default portfolioService;
