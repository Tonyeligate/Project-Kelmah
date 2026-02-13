import { api } from '../../../services/apiClient';

// FIXED: Removed /api prefix - apiClient.baseURL already includes '/api'
const SETTINGS_BASE = '/settings';
const settingsPath = (suffix = '') => `${SETTINGS_BASE}${suffix}`;

// Static configuration lists — the same for all users, no backend call needed.
const DEFAULT_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'tw', name: 'Twi', flag: '🇬🇭' },
  { code: 'ga', name: 'Ga', flag: '🇬🇭' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
];

const DEFAULT_THEMES = [
  { id: 'light', name: 'Light Mode', description: 'Clean and bright interface' },
  { id: 'dark', name: 'Dark Mode', description: 'Easy on the eyes' },
  { id: 'auto', name: 'Auto', description: 'Follows system preference' },
];

const DEFAULT_NOTIFICATION_PREFS = {
  email: true,
  push: true,
  sms: false,
  inApp: true,
};

class SettingsService {
  // Get user settings (aggregates notification prefs with local defaults)
  async getSettings() {
    try {
      const response = await api.get(settingsPath());
      const payload = response?.data?.data || {};
      return {
        theme: payload.theme || 'light',
        language: payload.language || 'en',
        notifications: {
          ...DEFAULT_NOTIFICATION_PREFS,
          ...(payload.notifications || {}),
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false,
          ...(payload.privacy || {}),
        },
      };
    } catch {
      return {
        theme: 'light',
        language: 'en',
        notifications: DEFAULT_NOTIFICATION_PREFS,
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false,
        },
      };
    }
  }

  // Get notification preferences — tries backend, falls back silently
  async getNotificationPreferences() {
    try {
      const response = await api.get(settingsPath('/notifications'));
      return response.data.data ?? DEFAULT_NOTIFICATION_PREFS;
    } catch {
      return DEFAULT_NOTIFICATION_PREFS;
    }
  }

  // Update user settings
  async updateSettings(settings) {
    const response = await api.put(settingsPath(), settings);
    return response.data.data;
  }

  // Update notification preferences
  async updateNotificationPreferences(preferences) {
    const response = await api.put(settingsPath('/notifications'), preferences);
    return response.data.data;
  }

  // Update privacy settings
  async updatePrivacySettings(settings) {
    const response = await api.put(settingsPath('/privacy'), settings);
    return response.data.data;
  }

  // Update language preference
  async updateLanguage(language) {
    const response = await api.put(settingsPath('/language'), { language });
    return response.data.data;
  }

  // Update theme preference
  async updateTheme(theme) {
    const response = await api.put(settingsPath('/theme'), { theme });
    return response.data.data;
  }

  // Available languages — static list, no backend call
  async getLanguages() {
    return DEFAULT_LANGUAGES;
  }

  // Available themes — static list, no backend call
  async getThemes() {
    return DEFAULT_THEMES;
  }

  // Reset settings to default
  async resetSettings() {
    const response = await api.post(settingsPath('/reset'));
    return response.data.data;
  }
}

export default new SettingsService();
