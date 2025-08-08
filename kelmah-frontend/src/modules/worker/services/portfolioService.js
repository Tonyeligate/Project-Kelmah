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
  getWorkerPortfolio: async (workerId) => {
    try {
      const response = await userServiceClient.get(`${API_URL}/${workerId}/portfolio`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new portfolio item
   * @param {Object} portfolioData - Portfolio item data
   * @returns {Promise<Object>} - Created portfolio item
   */
  createPortfolioItem: async (portfolioData) => {
    try {
      const response = await userServiceClient.post(
        `${API_URL}/${portfolioData.workerId}/portfolio`,
        portfolioData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update an existing portfolio item
   * @param {string} itemId - Portfolio item ID
   * @param {Object} portfolioData - Updated portfolio data
   * @returns {Promise<Object>} - Updated portfolio item
   */
  updatePortfolioItem: async (itemId, portfolioData) => {
    try {
      const response = await userServiceClient.put(
        `${API_URL}/portfolio/${itemId}`,
        portfolioData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a portfolio item
   * @param {string} itemId - Portfolio item ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  deletePortfolioItem: async (itemId) => {
    try {
      const response = await userServiceClient.delete(`${API_URL}/portfolio/${itemId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Upload portfolio images
   * @param {File} file - Image file to upload
   * @returns {Promise<Object>} - Upload response with URL
   */
  uploadPortfolioImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'portfolio');

      const response = await userServiceClient.post('/api/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get portfolio statistics for a worker
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Portfolio statistics
   */
  getPortfolioStats: async (workerId) => {
    try {
      const response = await userServiceClient.get(`${API_URL}/${workerId}/portfolio/stats`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Toggle featured status of a portfolio item
   * @param {string} itemId - Portfolio item ID
   * @param {boolean} featured - Featured status
   * @returns {Promise<Object>} - Updated portfolio item
   */
  toggleFeatured: async (itemId, featured) => {
    try {
      const response = await userServiceClient.patch(`${API_URL}/portfolio/${itemId}`, {
        featured
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Share portfolio item (generate shareable link)
   * @param {string} itemId - Portfolio item ID
   * @returns {Promise<Object>} - Shareable link data
   */
  sharePortfolioItem: async (itemId) => {
    try {
      const response = await userServiceClient.post(`${API_URL}/portfolio/${itemId}/share`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Search/filter portfolio items
   * @param {string} workerId - Worker ID
   * @param {Object} filters - Search filters
   * @returns {Promise<Object>} - Filtered portfolio items
   */
  searchPortfolio: async (workerId, filters = {}) => {
    try {
      const response = await userServiceClient.get(`${API_URL}/${workerId}/portfolio/search`, {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default portfolioService;