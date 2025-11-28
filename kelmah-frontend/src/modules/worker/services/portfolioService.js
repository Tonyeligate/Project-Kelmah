import { api } from '../../../services/apiClient';

// FIXED: Removed /api prefix - apiClient.baseURL already includes '/api'
const PROFILE_BASE = '/profile';
const profilePath = (suffix = '') => `${PROFILE_BASE}${suffix}`;

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
    const { data } = await api.get(profilePath('/portfolio/search'), {
      params,
    });
    return data?.data || data;
  },

  /**
   * Get portfolio items for a specific worker
   * @param {string} workerId - Worker ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Worker's portfolio data
   */
  async getWorkerPortfolio(workerId, params = {}) {
    const { data } = await api.get(
      profilePath(`/workers/${workerId}/portfolio`),
      { params },
    );
    return data?.data || data;
  },

  /**
   * Get a single portfolio item by ID
   * @param {string} id - Portfolio item ID
   * @returns {Promise<Object>} - Portfolio item data
   */
  async getPortfolioItem(id) {
    const { data } = await api.get(profilePath(`/portfolio/${id}`));
    return data?.data || data;
  },

  /**
   * Create a new portfolio item
   * @param {Object} portfolioData - Portfolio item data
   * @returns {Promise<Object>} - Created portfolio item
   */
  async createPortfolioItem(portfolioData) {
    const response = await api.post(profilePath('/portfolio'), portfolioData);
    return response.data?.data || response.data;
  },

  /**
   * Update an existing portfolio item
   * @param {string} itemId - Portfolio item ID
   * @param {Object} portfolioData - Updated portfolio data
   * @returns {Promise<Object>} - Updated portfolio item
   */
  async updatePortfolioItem(itemId, portfolioData) {
    const response = await api.put(
      profilePath(`/portfolio/${itemId}`),
      portfolioData,
    );
    return response.data?.data || response.data;
  },

  /**
   * Delete a portfolio item
   * @param {string} itemId - Portfolio item ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  async deletePortfolioItem(itemId) {
    const response = await api.delete(profilePath(`/portfolio/${itemId}`));
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
    const { data } = await api.post(profilePath('/portfolio/upload'), form, {
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
    const { data } = await api.post(profilePath('/certificates/upload'), form, {
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
    const response = await api.post(profilePath('/uploads/presign'), {
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
    const response = await api.get(
      profilePath(`/workers/${workerId}/portfolio/stats`),
    );
    return response.data?.data || response.data;
  },

  /**
   * Toggle featured status of a portfolio item
   * @param {string} itemId - Portfolio item ID
   * @param {boolean} featured - Featured status
   * @returns {Promise<Object>} - Updated portfolio item
   */
  async toggleFeatured(itemId, featured) {
    const response = await api.patch(profilePath(`/portfolio/${itemId}`), {
      featured,
    });
    return response.data?.data || response.data;
  },

  /**
   * Share portfolio item (generate shareable link)
   * @param {string} itemId - Portfolio item ID
   * @returns {Promise<Object>} - Shareable link data
   */
  async sharePortfolioItem(itemId) {
    const response = await api.post(profilePath(`/portfolio/${itemId}/share`));
    return response.data?.data || response.data;
  },

  /**
   * Search/filter portfolio items
   * @param {Object} filters - Search filters (includes workerId if searching specific worker)
   * @returns {Promise<Object>} - Filtered portfolio items
   */
  async searchPortfolio(filters = {}) {
    const response = await api.get(profilePath('/portfolio/search'), {
      params: filters,
    });
    return response.data?.data || response.data;
  },
};

export default portfolioService;

// Legacy export for backward compatibility during migration
export const portfolioApi = portfolioService;
