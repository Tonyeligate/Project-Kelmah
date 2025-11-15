import { userServiceClient } from '../../common/services/axios';

const SETTINGS_BASE = '/api/settings';
const settingsPath = (suffix = '') => `${SETTINGS_BASE}${suffix}`;

class SettingsService {
  // Get user settings
  async getSettings() {
    try {
      // User-service currently implements only notifications under /api/settings
      // Return a sensible default settings object instead of 404
      const notifications = await this.getNotificationPreferences().catch(
        () => null,
      );
      return {
        theme: 'light',
        language: 'en',
        notifications: notifications || {
          email: true,
          push: true,
          sms: false,
          inApp: true,
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false,
        },
      };
    } catch (error) {
      console.warn(
        'Settings service unavailable, using default settings:',
        error.message,
      );
      return {
        theme: 'light',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false,
        },
      };
    }
  }
  // Get notification preferences from backend (supported endpoint)
  async getNotificationPreferences() {
    const response = await userServiceClient.get(
      settingsPath('/notifications'),
    );
    return response.data.data;
  }

  // Update user settings
  async updateSettings(settings) {
    const response = await userServiceClient.put(settingsPath(), settings);
    return response.data.data;
  }

  // Update notification preferences
  async updateNotificationPreferences(preferences) {
    const response = await userServiceClient.put(
      settingsPath('/notifications'),
      preferences,
    );
    return response.data.data;
  }

  // Update privacy settings
  async updatePrivacySettings(settings) {
    const response = await userServiceClient.put(
      settingsPath('/privacy'),
      settings,
    );
    return response.data.data;
  }

  // Update language preference
  async updateLanguage(language) {
    const response = await userServiceClient.put(settingsPath('/language'), {
      language,
    });
    return response.data.data;
  }

  // Update theme preference
  async updateTheme(theme) {
    const response = await userServiceClient.put(settingsPath('/theme'), {
      theme,
    });
    return response.data.data;
  }

  // Get available languages
  async getLanguages() {
    try {
      const response = await userServiceClient.get(settingsPath('/languages'));
      return response.data.data;
    } catch (error) {
      console.warn(
        'Languages service unavailable, using default languages:',
        error.message,
      );
      return [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'tw', name: 'Twi', flag: '🇬🇭' },
        { code: 'ga', name: 'Ga', flag: '🇬🇭' },
        { code: 'fr', name: 'French', flag: '🇫🇷' },
      ];
    }
  }

  // Get available themes
  async getThemes() {
    try {
      const response = await userServiceClient.get(settingsPath('/themes'));
      return response.data.data;
    } catch (error) {
      console.warn(
        'Themes service unavailable, using default themes:',
        error.message,
      );
      return [
        {
          id: 'light',
          name: 'Light Mode',
          description: 'Clean and bright interface',
        },
        { id: 'dark', name: 'Dark Mode', description: 'Easy on the eyes' },
        { id: 'auto', name: 'Auto', description: 'Follows system preference' },
      ];
    }
  }

  // Reset settings to default
  async resetSettings() {
    const response = await userServiceClient.post(settingsPath('/reset'));
    return response.data.data;
  }
}

export default new SettingsService();
