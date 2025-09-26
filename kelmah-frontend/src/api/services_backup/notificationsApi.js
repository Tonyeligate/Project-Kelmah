/**
 * Notifications API Service
 * Handles user notifications and preferences
 */

import apiClient from '../index';

class NotificationsApi {
  /**
   * Get all notifications for current user
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Results per page
   * @param {boolean} params.unreadOnly - Filter to unread notifications only
   * @returns {Promise<Object>} Notifications data
   */
  async getNotifications(params = {}) {
    const response = await apiClient.get('/api/notifications', { params });
    return response.data;
  }

  /**
   * Get a specific notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Notification data
   */
  async getNotification(notificationId) {
    // Messaging-service does not expose GET /api/notifications/:id currently
    // Fallback: fetch list and find client-side
    try {
      const resp = await apiClient.get('/api/notifications');
      const list = resp.data?.data || resp.data?.notifications || resp.data || [];
      return Array.isArray(list) ? list.find((n) => n.id === notificationId || n._id === notificationId) : null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Updated notification
   */
  async markAsRead(notificationId) {
    // Backend expects PATCH /api/notifications/:notificationId/read
    const response = await apiClient.patch(
      `/api/notifications/${notificationId}/read`,
    );
    return response.data;
  }

  /**
   * Mark all notifications as read
   * @returns {Promise<Object>} Operation result
   */
  async markAllAsRead() {
    // Supported endpoint in messaging-service: PATCH /api/notifications/read/all
    const response = await apiClient.patch('/api/notifications/read/all');
    return response.data;
  }

  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Operation result
   */
  async deleteNotification(notificationId) {
    const response = await apiClient.delete(
      `/api/notifications/${notificationId}`,
    );
    return response.data;
  }

  /**
   * Delete all notifications
   * @returns {Promise<Object>} Operation result
   */
  async deleteAllNotifications() {
    // Supported endpoint in messaging-service: DELETE /api/notifications/clear-all
    const response = await apiClient.delete('/api/notifications/clear-all');
    return response.data;
  }

  /**
   * Get notification preferences
   * @returns {Promise<Object>} Notification preferences
   */
  async getNotificationPreferences() {
    // Preferences are under /api/notifications/preferences
    const response = await apiClient.get('/api/notifications/preferences');
    return response.data;
  }

  /**
   * Update notification preferences
   * @param {Object} preferences - Updated preferences
   * @returns {Promise<Object>} Updated preferences
   */
  async updateNotificationPreferences(preferences) {
    const response = await apiClient.put(
      '/api/notifications/preferences',
      preferences,
    );
    return response.data;
  }

  /**
   * Get unread notification count
   * @returns {Promise<Object>} Unread count data
   */
  async getUnreadCount() {
    // Messaging-service exposes /api/notifications/unread/count
    const response = await apiClient.get('/api/notifications/unread/count');
    return response.data;
  }

  /**
   * Subscribe to push notifications
   * @param {Object} subscription - Push subscription data
   * @returns {Promise<Object>} Subscription result
   */
  async subscribeToPushNotifications(subscription) {
    // If push endpoints are not implemented server-side, fail softly
    try {
      const response = await apiClient.post(
        '/api/notifications/push/subscribe',
        subscription,
      );
      return response.data;
    } catch (err) {
      return { success: false, message: 'Push subscribe not available' };
    }
  }

  /**
   * Unsubscribe from push notifications
   * @returns {Promise<Object>} Unsubscription result
   */
  async unsubscribeFromPushNotifications() {
    try {
      const response = await apiClient.post(
        '/api/notifications/push/unsubscribe',
      );
      return response.data;
    } catch (err) {
      return { success: false, message: 'Push unsubscribe not available' };
    }
  }
}

const notificationsInstance = new NotificationsApi();

// Add named export for backwards compatibility
export const notifications = notificationsInstance;

// Keep the default export
export default notificationsInstance;
