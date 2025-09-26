/**
 * Settings API Service
 * Handles application settings and preferences
 */

import apiClient from '../index';

class SettingsApi {
  /**
   * Get user application settings
   * @returns {Promise<Object>} Application settings
   */
  async getSettings() {
    const response = await apiClient.get('/settings');
    return response.data;
  }

  /**
   * Update user application settings
   * @param {Object} settings - Updated settings
   * @returns {Promise<Object>} Updated settings
   */
  async updateSettings(settings) {
    const response = await apiClient.put('/settings', settings);
    return response.data;
  }

  /**
   * Get theme settings
   * @returns {Promise<Object>} Theme settings
   */
  async getThemeSettings() {
    const response = await apiClient.get('/settings/theme');
    return response.data;
  }

  /**
   * Update theme settings
   * @param {Object} themeSettings - Updated theme settings
   * @returns {Promise<Object>} Updated theme settings
   */
  async updateThemeSettings(themeSettings) {
    const response = await apiClient.put('/settings/theme', themeSettings);
    return response.data;
  }

  /**
   * Get language preferences
   * @returns {Promise<Object>} Language preferences
   */
  async getLanguagePreferences() {
    const response = await apiClient.get('/settings/language');
    return response.data;
  }

  /**
   * Update language preferences
   * @param {Object} languagePreferences - Updated language preferences
   * @returns {Promise<Object>} Updated language preferences
   */
  async updateLanguagePreferences(languagePreferences) {
    const response = await apiClient.put(
      '/settings/language',
      languagePreferences,
    );
    return response.data;
  }

  /**
   * Get notification settings
   * @returns {Promise<Object>} Notification settings
   */
  async getNotificationSettings() {
    const response = await apiClient.get('/settings/notifications');
    return response.data;
  }

  /**
   * Update notification settings
   * @param {Object} notificationSettings - Updated notification settings
   * @returns {Promise<Object>} Updated notification settings
   */
  async updateNotificationSettings(notificationSettings) {
    const response = await apiClient.put(
      '/settings/notifications',
      notificationSettings,
    );
    return response.data;
  }

  /**
   * Get privacy settings
   * @returns {Promise<Object>} Privacy settings
   */
  async getPrivacySettings() {
    const response = await apiClient.get('/settings/privacy');
    return response.data;
  }

  /**
   * Update privacy settings
   * @param {Object} privacySettings - Updated privacy settings
   * @returns {Promise<Object>} Updated privacy settings
   */
  async updatePrivacySettings(privacySettings) {
    const response = await apiClient.put('/settings/privacy', privacySettings);
    return response.data;
  }

  /**
   * Get security settings
   * @returns {Promise<Object>} Security settings
   */
  async getSecuritySettings() {
    const response = await apiClient.get('/settings/security');
    return response.data;
  }

  /**
   * Update security settings
   * @param {Object} securitySettings - Updated security settings
   * @returns {Promise<Object>} Updated security settings
   */
  async updateSecuritySettings(securitySettings) {
    const response = await apiClient.put(
      '/settings/security',
      securitySettings,
    );
    return response.data;
  }

  /**
   * Get accessibility settings
   * @returns {Promise<Object>} Accessibility settings
   */
  async getAccessibilitySettings() {
    const response = await apiClient.get('/settings/accessibility');
    return response.data;
  }

  /**
   * Update accessibility settings
   * @param {Object} accessibilitySettings - Updated accessibility settings
   * @returns {Promise<Object>} Updated accessibility settings
   */
  async updateAccessibilitySettings(accessibilitySettings) {
    const response = await apiClient.put(
      '/settings/accessibility',
      accessibilitySettings,
    );
    return response.data;
  }

  /**
   * Reset all settings to default
   * @returns {Promise<Object>} Reset response
   */
  async resetSettings() {
    const response = await apiClient.post('/settings/reset');
    return response.data;
  }
}

export default new SettingsApi();
