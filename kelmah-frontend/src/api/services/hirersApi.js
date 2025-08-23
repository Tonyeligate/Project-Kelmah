/**
 * Hirers API Service
 * Handles hirer profiles and hirer-related operations
 */

import apiClient from '../index';

class HirersApi {
  /**
   * Get hirer profile by ID
   * @param {string} hirerId - Hirer ID
   * @returns {Promise<Object>} Hirer profile data
   */
  async getHirerById(hirerId) {
    const response = await apiClient.get(`/hirers/${hirerId}`);
    return response.data;
  }

  /**
   * Get current hirer's profile
   * @returns {Promise<Object>} Current hirer profile
   */
  async getMyHirerProfile() {
    const response = await apiClient.get('/hirers/me');
    return response.data;
  }

  /**
   * Update hirer profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile
   */
  async updateHirerProfile(profileData) {
    const response = await apiClient.put('/hirers/me', profileData);
    return response.data;
  }

  /**
   * Upload hirer profile image
   * @param {FormData} formData - Form data with image file
   * @returns {Promise<Object>} Upload response
   */
  async uploadProfileImage(formData) {
    const response = await apiClient.post('/hirers/me/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Get hirer's job postings
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Hirer's job postings
   */
  async getHirerJobs(hirerId, params = {}) {
    const response = await apiClient.get(`/hirers/${hirerId}/jobs`, { params });
    return response.data;
  }

  /**
   * Get hirer reviews
   * @param {string} hirerId - Hirer ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Hirer reviews
   */
  async getHirerReviews(hirerId, params = {}) {
    const response = await apiClient.get(`/hirers/${hirerId}/reviews`, {
      params,
    });
    return response.data;
  }

  /**
   * Update company information
   * @param {Object} companyData - Company data
   * @returns {Promise<Object>} Updated profile
   */
  async updateCompanyInfo(companyData) {
    const response = await apiClient.put('/hirers/me/company', companyData);
    return response.data;
  }

  /**
   * Upload company logo
   * @param {FormData} formData - Form data with logo file
   * @returns {Promise<Object>} Upload response
   */
  async uploadCompanyLogo(formData) {
    const response = await apiClient.post('/hirers/me/company/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Get hirer's favorite workers
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Favorite workers
   */
  async getFavoriteWorkers(params = {}) {
    const response = await apiClient.get('/hirers/me/favorites', { params });
    return response.data;
  }

  /**
   * Add worker to favorites
   * @param {string} workerId - Worker ID to add to favorites
   * @returns {Promise<Object>} Updated favorites
   */
  async addWorkerToFavorites(workerId) {
    const response = await apiClient.post(`/hirers/me/favorites/${workerId}`);
    return response.data;
  }

  /**
   * Remove worker from favorites
   * @param {string} workerId - Worker ID to remove from favorites
   * @returns {Promise<Object>} Updated favorites
   */
  async removeWorkerFromFavorites(workerId) {
    const response = await apiClient.delete(`/hirers/me/favorites/${workerId}`);
    return response.data;
  }

  /**
   * Get hiring history
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Hiring history
   */
  async getHiringHistory(params = {}) {
    const response = await apiClient.get('/hirers/me/history', { params });
    return response.data;
  }

  /**
   * Update notification preferences
   * @param {Object} preferences - Notification preferences
   * @returns {Promise<Object>} Updated preferences
   */
  async updateNotificationPreferences(preferences) {
    const response = await apiClient.put(
      '/hirers/me/notifications',
      preferences,
    );
    return response.data;
  }
}

export default new HirersApi();
