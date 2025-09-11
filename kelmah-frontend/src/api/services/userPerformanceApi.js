/**
 * User Performance API Service
 * Handles user performance tracking and tier management
 */

import apiClient from '../index';

class UserPerformanceApi {
  /**
   * Get user performance data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User performance data
   */
  async getUserPerformance(userId) {
    const response = await apiClient.get(`/user-performance/${userId}`);
    return response.data;
  }

  /**
   * Get current user's performance data
   * @returns {Promise<Object>} Current user's performance data
   */
  async getMyPerformance() {
    const response = await apiClient.get('/user-performance/me');
    return response.data;
  }

  /**
   * Update user performance metrics
   * @param {string} userId - User ID
   * @param {Object} metrics - Performance metrics
   * @returns {Promise<Object>} Updated performance data
   */
  async updateUserPerformance(userId, metrics) {
    const response = await apiClient.patch(`/user-performance/${userId}`, { metrics });
    return response.data;
  }

  /**
   * Verify user skill (admin only)
   * @param {string} userId - User ID
   * @param {string} skill - Skill name
   * @param {boolean} isPrimary - Whether it's a primary skill
   * @param {Object} verificationData - Verification data
   * @returns {Promise<Object>} Updated performance data
   */
  async verifySkill(userId, skill, isPrimary, verificationData) {
    const response = await apiClient.patch(`/user-performance/${userId}/verify-skill`, {
      skill,
      isPrimary,
      verificationData
    });
    return response.data;
  }

  /**
   * Update user tier (admin only)
   * @param {string} userId - User ID
   * @param {string} tier - New tier (tier1, tier2, tier3)
   * @param {string} reason - Reason for tier change
   * @returns {Promise<Object>} Updated performance data
   */
  async updateUserTier(userId, tier, reason = '') {
    const response = await apiClient.patch(`/user-performance/${userId}/tier`, {
      tier,
      reason
    });
    return response.data;
  }

  /**
   * Get users by performance tier (admin only)
   * @param {string} tier - Performance tier
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Users in tier
   */
  async getUsersByTier(tier, params = {}) {
    const response = await apiClient.get(`/user-performance/tier/${tier}`, { params });
    return response.data;
  }

  /**
   * Get top performers (admin only)
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of top performers
   * @param {string} params.tier - Filter by tier (optional)
   * @returns {Promise<Object>} Top performers
   */
  async getTopPerformers(params = {}) {
    const response = await apiClient.get('/user-performance/top-performers', { params });
    return response.data;
  }

  /**
   * Get users by location (admin only)
   * @param {string} region - Ghana region
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Users in region
   */
  async getUsersByLocation(region, params = {}) {
    const response = await apiClient.get(`/user-performance/location/${region}`, { params });
    return response.data;
  }

  /**
   * Get users by skill (admin only)
   * @param {string} skill - Skill name
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Users with skill
   */
  async getUsersBySkill(skill, params = {}) {
    const response = await apiClient.get(`/user-performance/skill/${skill}`, { params });
    return response.data;
  }

  /**
   * Update location preferences
   * @param {string} userId - User ID
   * @param {Object} locationPreferences - Location preferences
   * @returns {Promise<Object>} Updated performance data
   */
  async updateLocationPreferences(userId, locationPreferences) {
    const response = await apiClient.patch(`/user-performance/${userId}/location-preferences`, {
      locationPreferences
    });
    return response.data;
  }

  /**
   * Get performance analytics (admin only)
   * @returns {Promise<Object>} Performance analytics
   */
  async getPerformanceAnalytics() {
    const response = await apiClient.get('/user-performance/analytics');
    return response.data;
  }

  /**
   * Recalculate all user tiers (admin only)
   * @returns {Promise<Object>} Recalculation response
   */
  async recalculateAllTiers() {
    const response = await apiClient.patch('/user-performance/recalculate-tiers');
    return response.data;
  }
}

export default new UserPerformanceApi();
