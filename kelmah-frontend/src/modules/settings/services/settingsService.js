import { authServiceClient } from '../../common/services/axios';

class SettingsService {
  // Get user settings
  async getSettings() {
    const response = await authServiceClient.get('/settings');
    return response.data.data;
  }

  // Update user settings
  async updateSettings(settings) {
    const response = await authServiceClient.put('/settings', settings);
    return response.data.data;
  }

  // Update notification preferences
  async updateNotificationPreferences(preferences) {
    const response = await authServiceClient.put(
      '/settings/notifications',
      preferences,
    );
    return response.data.data;
  }

  // Update privacy settings
  async updatePrivacySettings(settings) {
    const response = await authServiceClient.put('/settings/privacy', settings);
    return response.data.data;
  }

  // Update language preference
  async updateLanguage(language) {
    const response = await authServiceClient.put('/settings/language', { language });
    return response.data.data;
  }

  // Update theme preference
  async updateTheme(theme) {
    const response = await authServiceClient.put('/settings/theme', { theme });
    return response.data.data;
  }

  // Get available languages
  async getLanguages() {
    const response = await authServiceClient.get('/settings/languages');
    return response.data.data;
  }

  // Get available themes
  async getThemes() {
    const response = await authServiceClient.get('/settings/themes');
    return response.data.data;
  }

  // Reset settings to default
  async resetSettings() {
    const response = await authServiceClient.post('/settings/reset');
    return response.data.data;
  }
}

export default new SettingsService();
