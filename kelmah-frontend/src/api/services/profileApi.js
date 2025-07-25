/**
 * Profile API Service
 * Handles user profile operations
 */

import apiClient from '../index';

class ProfileApi {
  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile data
   */
  async getCurrentProfile() {
    const response = await apiClient.get('/profile');
    return response.data;
  }

  /**
   * Update current user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile data
   */
  async updateProfile(profileData) {
    const response = await apiClient.put('/profile', profileData);
    return response.data;
  }

  /**
   * Upload profile picture
   * @param {FormData} formData - Form data with image file
   * @returns {Promise<Object>} Upload response
   */
  async uploadProfilePicture(formData) {
    const response = await apiClient.post('/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Delete profile picture
   * @returns {Promise<Object>} Deletion response
   */
  async deleteProfilePicture() {
    const response = await apiClient.delete('/profile/picture');
    return response.data;
  }

  /**
   * Get user account settings
   * @returns {Promise<Object>} Account settings
   */
  async getAccountSettings() {
    const response = await apiClient.get('/profile/settings');
    return response.data;
  }

  /**
   * Update account settings
   * @param {Object} settings - Updated settings
   * @returns {Promise<Object>} Updated settings
   */
  async updateAccountSettings(settings) {
    const response = await apiClient.put('/profile/settings', settings);
    return response.data;
  }

  /**
   * Update email address
   * @param {Object} emailData - Email data
   * @param {string} emailData.email - New email address
   * @param {string} emailData.password - Current password for verification
   * @returns {Promise<Object>} Update response
   */
  async updateEmail(emailData) {
    const response = await apiClient.put('/profile/email', emailData);
    return response.data;
  }

  /**
   * Verify email address
   * @param {Object} verificationData - Verification data
   * @param {string} verificationData.token - Verification token
   * @returns {Promise<Object>} Verification response
   */
  async verifyEmail(verificationData) {
    const response = await apiClient.post(
      '/profile/email/verify',
      verificationData,
    );
    return response.data;
  }

  /**
   * Get notification preferences
   * @returns {Promise<Object>} Notification preferences
   */
  async getNotificationPreferences() {
    const response = await apiClient.get('/profile/notifications');
    return response.data;
  }

  /**
   * Update notification preferences
   * @param {Object} preferences - Updated preferences
   * @returns {Promise<Object>} Updated preferences
   */
  async updateNotificationPreferences(preferences) {
    const response = await apiClient.put('/profile/notifications', preferences);
    return response.data;
  }

  /**
   * Get privacy settings
   * @returns {Promise<Object>} Privacy settings
   */
  async getPrivacySettings() {
    const response = await apiClient.get('/profile/privacy');
    return response.data;
  }

  /**
   * Update privacy settings
   * @param {Object} settings - Updated privacy settings
   * @returns {Promise<Object>} Updated settings
   */
  async updatePrivacySettings(settings) {
    const response = await apiClient.put('/profile/privacy', settings);
    return response.data;
  }

  /**
   * Get user's connected accounts
   * @returns {Promise<Object>} Connected accounts
   */
  async getConnectedAccounts() {
    const response = await apiClient.get('/profile/connected-accounts');
    return response.data;
  }

  /**
   * Connect external account
   * @param {Object} accountData - Account connection data
   * @returns {Promise<Object>} Connection response
   */
  async connectAccount(accountData) {
    const response = await apiClient.post(
      '/profile/connected-accounts',
      accountData,
    );
    return response.data;
  }

  /**
   * Disconnect external account
   * @param {string} accountId - Connected account ID
   * @returns {Promise<Object>} Disconnection response
   */
  async disconnectAccount(accountId) {
    const response = await apiClient.delete(
      `/profile/connected-accounts/${accountId}`,
    );
    return response.data;
  }

  /**
   * Request account deletion
   * @param {Object} deletionData - Deletion request data
   * @param {string} deletionData.password - Current password for verification
   * @param {string} deletionData.reason - Reason for deletion
   * @returns {Promise<Object>} Deletion request response
   */
  async requestAccountDeletion(deletionData) {
    const response = await apiClient.post(
      '/profile/delete-account',
      deletionData,
    );
    return response.data;
  }
}

export default new ProfileApi();
