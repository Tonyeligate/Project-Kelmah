import axios from '../../common/services/axios';
import { userServiceClient } from '../../common/services/axios';

/**
 * Unified Portfolio Service
 * 
 * Handles all portfolio-related operations including:
 * - Fetching portfolio items
 * - Creating/updating/deleting portfolio items
 * - Uploading work samples and certificates
 * - Portfolio statistics and sharing
 * 
 * Note: Endpoints use baseURL='/api' automatically (no /api prefix in paths)
 */
const portfolioService = {
  /**
   * Get current user's portfolio
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Portfolio data
   */
  async getMyPortfolio(params = {}) {
    const { data } = await axios.get('/profile/portfolio/search', { params });
    return data?.data || data;
  },

  /**
   * Get portfolio items for a specific worker
   * @param {string} workerId - Worker ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Worker's portfolio data
   */
  async getWorkerPortfolio(workerId, params = {}) {
    const { data } = await axios.get(`/profile/workers/${workerId}/portfolio`, { params });
    return data?.data || data;
  },

  /**
   * Get a single portfolio item by ID
   * @param {string} id - Portfolio item ID
   * @returns {Promise<Object>} - Portfolio item data
   */
  async getPortfolioItem(id) {
    const { data } = await axios.get(`/profile/portfolio/${id}`);
    return data?.data || data;
  },

  /**
   * Create a new portfolio item
   * @param {Object} portfolioData - Portfolio item data
   * @returns {Promise<Object>} - Created portfolio item
   */
  async createPortfolioItem(portfolioData) {
    const response = await userServiceClient.post('/profile/portfolio', portfolioData);
    return response.data?.data || response.data;
  },

  /**
   * Update an existing portfolio item
   * @param {string} itemId - Portfolio item ID
   * @param {Object} portfolioData - Updated portfolio data
   * @returns {Promise<Object>} - Updated portfolio item
   */
  async updatePortfolioItem(itemId, portfolioData) {
    const response = await userServiceClient.put(`/profile/portfolio/${itemId}`, portfolioData);
    return response.data?.data || response.data;
  },

  /**
   * Delete a portfolio item
   * @param {string} itemId - Portfolio item ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  async deletePortfolioItem(itemId) {
    const response = await userServiceClient.delete(`/profile/portfolio/${itemId}`);
    return response.data?.data || response.data;
  },

  /**
   * Upload work samples (multiple files)
   * @param {Array<File>} files - Array of files to upload
   * @returns {Promise<Object>} - Upload response
   */
  async uploadWorkSamples(files = []) {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    const { data } = await axios.post('/profile/portfolio/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data?.data || data;
  },

  /**
   * Upload certificates (multiple files)
   * @param {Array<File>} files - Array of certificate files
   * @returns {Promise<Object>} - Upload response
   */
  async uploadCertificates(files = []) {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    const { data } = await axios.post('/profile/certificates/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data?.data || data;
  },

  /**
   * Upload single portfolio image (for portfolio item)
   * @param {File} file - Image file to upload
   * @returns {Promise<Object>} - Upload response with URL
   */
  async uploadPortfolioImage(file) {
    const response = await userServiceClient.post('/profile/uploads/presign', {
      folder: 'portfolio',
      filename: file.name,
      contentType: file.type,
    });
    return response.data?.data || response.data;
  },

  /**
   * Get portfolio statistics for a worker
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Portfolio statistics
   */
  async getPortfolioStats(workerId) {
    const response = await userServiceClient.get(`/profile/workers/${workerId}/portfolio/stats`);
    return response.data?.data || response.data;
  },

  /**
   * Toggle featured status of a portfolio item
   * @param {string} itemId - Portfolio item ID
   * @param {boolean} featured - Featured status
   * @returns {Promise<Object>} - Updated portfolio item
   */
  async toggleFeatured(itemId, featured) {
    const response = await userServiceClient.patch(`/profile/portfolio/${itemId}`, { featured });
    return response.data?.data || response.data;
  },

  /**
   * Share portfolio item (generate shareable link)
   * @param {string} itemId - Portfolio item ID
   * @returns {Promise<Object>} - Shareable link data
   */
  async sharePortfolioItem(itemId) {
    const response = await userServiceClient.post(`/profile/portfolio/${itemId}/share`);
    return response.data?.data || response.data;
  },

  /**
   * Search/filter portfolio items
   * @param {Object} filters - Search filters (includes workerId if searching specific worker)
   * @returns {Promise<Object>} - Filtered portfolio items
   */
  async searchPortfolio(filters = {}) {
    const response = await userServiceClient.get('/profile/portfolio/search', { 
      params: filters 
    });
    return response.data?.data || response.data;
  },
};

export default portfolioService;

// Legacy export for backward compatibility during migration
export const portfolioApi = portfolioService;
