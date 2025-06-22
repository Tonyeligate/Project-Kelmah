import apiClient from '../../../api/index';

class SettingsService {
    // Get user settings
    async getSettings() {
        const response = await apiClient.get('/settings');
        return response.data.data;
    }

    // Update user settings
    async updateSettings(settings) {
        const response = await apiClient.put('/settings', settings);
        return response.data.data;
    }

    // Update notification preferences
    async updateNotificationPreferences(preferences) {
        const response = await apiClient.put('/settings/notifications', preferences);
        return response.data.data;
    }

    // Update privacy settings
    async updatePrivacySettings(settings) {
        const response = await apiClient.put('/settings/privacy', settings);
        return response.data.data;
    }

    // Update language preference
    async updateLanguage(language) {
        const response = await apiClient.put('/settings/language', { language });
        return response.data.data;
    }

    // Update theme preference
    async updateTheme(theme) {
        const response = await apiClient.put('/settings/theme', { theme });
        return response.data.data;
    }

    // Get available languages
    async getLanguages() {
        const response = await apiClient.get('/settings/languages');
        return response.data.data;
    }

    // Get available themes
    async getThemes() {
        const response = await apiClient.get('/settings/themes');
        return response.data.data;
    }

    // Reset settings to default
    async resetSettings() {
        const response = await apiClient.post('/settings/reset');
        return response.data.data;
    }
}

export default new SettingsService(); 