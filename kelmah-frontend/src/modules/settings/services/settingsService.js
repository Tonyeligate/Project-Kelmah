import { userServiceClient } from '../../common/services/axios';

class SettingsService {
  // Get user settings
  async getSettings() {
    try {
      const response = await userServiceClient.get('/settings');
      return response.data.data;
    } catch (error) {
      console.warn('Settings service unavailable, using default settings:', error.message);
      return {
        theme: 'light',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false
        }
      };
    }
  }

  // Update user settings
  async updateSettings(settings) {
    const response = await userServiceClient.put('/settings', settings);
    return response.data.data;
  }

  // Update notification preferences
  async updateNotificationPreferences(preferences) {
    const response = await userServiceClient.put(
      '/settings/notifications',
      preferences,
    );
    return response.data.data;
  }

  // Update privacy settings
  async updatePrivacySettings(settings) {
    const response = await userServiceClient.put('/settings/privacy', settings);
    return response.data.data;
  }

  // Update language preference
  async updateLanguage(language) {
    const response = await userServiceClient.put('/settings/language', { language });
    return response.data.data;
  }

  // Update theme preference
  async updateTheme(theme) {
    const response = await userServiceClient.put('/settings/theme', { theme });
    return response.data.data;
  }

  // Get available languages
  async getLanguages() {
    try {
      const response = await userServiceClient.get('/settings/languages');
      return response.data.data;
    } catch (error) {
      console.warn('Languages service unavailable, using default languages:', error.message);
      return [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'tw', name: 'Twi', flag: '🇬🇭' },
        { code: 'ga', name: 'Ga', flag: '🇬🇭' },
        { code: 'fr', name: 'French', flag: '🇫🇷' }
      ];
    }
  }

  // Get available themes
  async getThemes() {
    try {
      const response = await userServiceClient.get('/settings/themes');
      return response.data.data;
    } catch (error) {
      console.warn('Themes service unavailable, using default themes:', error.message);
      return [
        { id: 'light', name: 'Light Mode', description: 'Clean and bright interface' },
        { id: 'dark', name: 'Dark Mode', description: 'Easy on the eyes' },
        { id: 'auto', name: 'Auto', description: 'Follows system preference' }
      ];
    }
  }

  // Reset settings to default
  async resetSettings() {
    const response = await userServiceClient.post('/settings/reset');
    return response.data.data;
  }
}

export default new SettingsService();
