/**
 * Workers API Service
 * Handles worker profiles, search, and worker-related operations
 */

import apiClient from '../index';

class WorkersApi {
  /**
   * Search workers with filtering options
   * @param {Object} params - Search parameters
   * @param {string} params.search - Search keywords
   * @param {string} params.location - Worker location
   * @param {Array} params.skills - Required skills
   * @param {number} params.minRating - Minimum rating
   * @param {number} params.maxRating - Maximum rating
   * @param {number} params.page - Page number
   * @param {number} params.limit - Results per page
   * @param {string} params.sortBy - Sort field
   * @param {string} params.sortOrder - Sort order ('asc' or 'desc')
   * @returns {Promise<Object>} Workers search results
   */
  async searchWorkers(params = {}) {
    const response = await apiClient.get('/workers', { params });
    return response.data;
  }

  /**
   * Get featured workers for homepage
   * @param {number} limit - Number of workers to retrieve
   * @returns {Promise<Object>} Featured workers
   */
  async getFeaturedWorkers(limit = 6) {
    const response = await apiClient.get('/workers/featured', {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Get worker profile by ID
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} Worker profile data
   */
  async getWorkerById(workerId) {
    const response = await apiClient.get(`/workers/${workerId}`);
    return response.data;
  }

  /**
   * Get current worker's profile
   * @returns {Promise<Object>} Current worker profile
   */
  async getMyWorkerProfile() {
    const response = await apiClient.get('/workers/me');
    return response.data;
  }

  /**
   * Update worker profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile
   */
  async updateWorkerProfile(profileData) {
    const response = await apiClient.put('/workers/me', profileData);
    return response.data;
  }

  /**
   * Upload worker profile image
   * @param {FormData} formData - Form data with image file
   * @returns {Promise<Object>} Upload response
   */
  async uploadProfileImage(formData) {
    const response = await apiClient.post('/workers/me/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Add work experience to profile
   * @param {Object} experienceData - Work experience data
   * @returns {Promise<Object>} Updated profile
   */
  async addWorkExperience(experienceData) {
    const response = await apiClient.post(
      '/workers/me/experience',
      experienceData,
    );
    return response.data;
  }

  /**
   * Update work experience
   * @param {string} experienceId - Experience ID to update
   * @param {Object} experienceData - Updated experience data
   * @returns {Promise<Object>} Updated profile
   */
  async updateWorkExperience(experienceId, experienceData) {
    const response = await apiClient.put(
      `/workers/me/experience/${experienceId}`,
      experienceData,
    );
    return response.data;
  }

  /**
   * Delete work experience
   * @param {string} experienceId - Experience ID to delete
   * @returns {Promise<Object>} Updated profile
   */
  async deleteWorkExperience(experienceId) {
    const response = await apiClient.delete(
      `/workers/me/experience/${experienceId}`,
    );
    return response.data;
  }

  /**
   * Add skill to worker profile
   * @param {Object} skillData - Skill data
   * @returns {Promise<Object>} Updated profile
   */
  async addSkill(skillData) {
    const response = await apiClient.post('/workers/me/skills', skillData);
    return response.data;
  }

  /**
   * Remove skill from worker profile
   * @param {string} skillId - Skill ID to remove
   * @returns {Promise<Object>} Updated profile
   */
  async removeSkill(skillId) {
    const response = await apiClient.delete(`/workers/me/skills/${skillId}`);
    return response.data;
  }

  /**
   * Add portfolio item
   * @param {FormData} formData - Form data with portfolio item
   * @returns {Promise<Object>} Updated profile
   */
  async addPortfolioItem(formData) {
    const response = await apiClient.post('/workers/me/portfolio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Delete portfolio item
   * @param {string} itemId - Portfolio item ID to delete
   * @returns {Promise<Object>} Updated profile
   */
  async deletePortfolioItem(itemId) {
    const response = await apiClient.delete(`/workers/me/portfolio/${itemId}`);
    return response.data;
  }

  /**
   * Update availability settings
   * @param {Object} availabilityData - Availability data
   * @returns {Promise<Object>} Updated availability
   */
  async updateAvailability(availabilityData) {
    const response = await apiClient.put(
      '/workers/me/availability',
      availabilityData,
    );
    return response.data;
  }

  /**
   * Get worker reviews
   * @param {string} workerId - Worker ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Worker reviews
   */
  async getWorkerReviews(workerId, params = {}) {
    const response = await apiClient.get(`/workers/${workerId}/reviews`, {
      params,
    });
    return response.data;
  }

  /**
   * Get available skills list
   * @returns {Promise<Object>} Available skills
   */
  async getAvailableSkills() {
    const response = await apiClient.get('/workers/skills');
    return response.data;
  }

  /**
   * Get worker dashboard statistics
   * @returns {Promise<Object>} Dashboard statistics
   */
  async getDashboardStats() {
    const response = await apiClient.get('/workers/me/dashboard/stats');
    return response.data;
  }

  /**
   * Get worker portfolio projects
   * @returns {Promise<Array>} Portfolio projects
   */
  async getPortfolioProjects() {
    const response = await apiClient.get('/workers/me/portfolio');
    return response.data;
  }

  /**
   * Get worker skills and licenses
   * @returns {Promise<Object>} Skills and licenses
   */
  async getSkillsAndLicenses() {
    const response = await apiClient.get('/workers/me/credentials');
    return response.data;
  }

  /**
   * Request skill verification
   * @param {string} skillId - Skill ID to verify
   * @param {Object} verificationData - Verification data (documents, etc.)
   * @returns {Promise<Object>} Verification response
   */
  async requestSkillVerification(skillId, verificationData) {
    const response = await apiClient.post(
      `/workers/me/skills/${skillId}/verify`,
      verificationData,
    );
    return response.data;
  }

  /**
   * Get current availability status
   * @returns {Promise<Object>} Availability status
   */
  async getAvailabilityStatus() {
    const response = await apiClient.get('/workers/me/availability');
    return response.data;
  }

  /**
   * Get notification counts for badge displays
   * @returns {Promise<Object>} Notification counts
   */
  async getNotificationCounts() {
    const response = await apiClient.get('/workers/me/notification-counts');
    return response.data;
  }
}

export default new WorkersApi();
