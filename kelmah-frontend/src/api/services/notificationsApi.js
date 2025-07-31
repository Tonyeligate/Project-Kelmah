/**
 * Notifications API Service
 * Handles user notifications and preferences
 */

import { authServiceClient } from '../../modules/common/services/axios';

class NotificationsApi {
  constructor() {
    // Temporarily use auth service client until messaging service is deployed
    this.client = authServiceClient;
  }

  /**
   * Get all notifications for current user
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Results per page
   * @param {boolean} params.unreadOnly - Filter to unread notifications only
   * @returns {Promise<Object>} Notifications data
   */
  async getNotifications(params = {}) {
    try {
      const response = await this.client.get('/api/notifications', { params });
      return response.data;
    } catch (error) {
      console.warn('Service unavailable:', error.message);
      throw error;
    }
  }

  /**
   * Get a specific notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Notification data
   */
  async getNotification(notificationId) {
    const response = await this.client.get(
      `/api/notifications/${notificationId}`,
    );
    return response.data;
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Updated notification
   */
  async markAsRead(notificationId) {
    const response = await this.client.put(
      `/api/notifications/${notificationId}/read`,
    );
    return response.data;
  }

  /**
   * Mark all notifications as read
   * @returns {Promise<Object>} Operation result
   */
  async markAllAsRead() {
    // Note: backend does not support bulk, fallback to individual operations
    const response = await this.client.get('/api/notifications');
    const ids = response.data.data.map((n) => n.id);
    await Promise.all(
      ids.map((id) => this.client.put(`/api/notifications/${id}/read`)),
    );
    return { success: true };
  }

  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Operation result
   */
  async deleteNotification(notificationId) {
    const response = await this.client.delete(
      `/api/notifications/${notificationId}`,
    );
    return response.data;
  }

  /**
   * Delete all notifications
   * @returns {Promise<Object>} Operation result
   */
  async deleteAllNotifications() {
    // Delete each notification since bulk endpoint is not available
    const resp = await this.client.get('/api/notifications');
    const ids = resp.data.data.map((n) => n.id);
    await Promise.all(
      ids.map((id) => this.client.delete(`/api/notifications/${id}`)),
    );
    return { success: true };
  }

  /**
   * Get notification preferences
   * @returns {Promise<Object>} Notification preferences
   */
  async getNotificationPreferences() {
    const response = await this.client.get('/notifications/preferences');
    return response.data;
  }

  /**
   * Update notification preferences
   * @param {Object} preferences - Updated preferences
   * @returns {Promise<Object>} Updated preferences
   */
  async updateNotificationPreferences(preferences) {
    const response = await this.client.put(
      '/notifications/preferences',
      preferences,
    );
    return response.data;
  }

  /**
   * Get unread notification count
   * @returns {Promise<Object>} Unread count data
   */
  async getUnreadCount() {
    const response = await this.client.get('/notifications/unread-count');
    return response.data;
  }

  /**
   * Subscribe to push notifications
   * @param {Object} subscription - Push subscription data
   * @returns {Promise<Object>} Subscription result
   */
  async subscribeToPushNotifications(subscription) {
    const response = await this.client.post(
      '/api/notifications/push/subscribe',
      subscription,
    );
    return response.data;
  }

  /**
   * Unsubscribe from push notifications
   * @returns {Promise<Object>} Unsubscription result
   */
  async unsubscribeFromPushNotifications() {
    const response = await this.client.post(
      '/api/notifications/push/unsubscribe',
    );
    return response.data;
  }
}

const notificationsInstance = new NotificationsApi();

// Add named export for backwards compatibility
export const notifications = notificationsInstance;

// Keep the default export
export default notificationsInstance;
