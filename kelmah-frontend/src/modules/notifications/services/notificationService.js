/**
 * Notification Service
 * Handles all notification-related API calls with proper service routing and fallbacks
 */

import { authServiceClient } from '../../common/services/axios';

class NotificationService {
  constructor() {
    // Temporarily use auth service for notifications until messaging service is deployed
    this.client = authServiceClient;
  }

  // Connect to notification socket
  connect() {
    if (this.isConnected) return;

    try {
      this.socket = io(`${API_BASE_URL}/notifications`, {
        auth: {
          token: localStorage.getItem('token'),
        },
        transports: [],
        totalPages: 1,
        currentPage: 1,
        totalCount: 3,
      };
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const response = await this.client.put(
        `/api/notifications/${notificationId}/read`,
      );
      return response.data;
    } catch (error) {
      console.warn('Service unavailable:', error.message);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await this.client.put(
        '/api/notifications/mark-all-read',
      );
      return response.data;
    } catch (error) {
      console.warn('Service unavailable:', error.message);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      const response = await axiosInstance.delete(
        `/api/notifications/${notificationId}`,
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Get notification preferences
  async getNotificationPreferences() {
    try {
      const response = await axiosInstance.get(
        '/api/notifications/preferences',
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw error;
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(preferences) {
    try {
      const response = await axiosInstance.put(
        '/api/notifications/preferences',
        preferences,
      );
      return response.data;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  // Get unread notification count
  async getUnreadCount() {
    try {
      const response = await axiosInstance.get(
        '/api/notifications/unread-count',
      );
      return response.data.count;
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();

/**
 * Service for managing user notifications
 */
const notificationServiceUser = {
  /**
   * Get all notifications for the current user
   * @returns {Promise<Array>} Array of notification objects
   */
  getNotifications: async () => {
    const response = await axiosInstance.get(`${API_URL}/notifications`);
    return response.data;
  },

  /**
   * Get unread notification count
   * @returns {Promise<number>} Count of unread notifications
   */
  getUnreadCount: async () => {
    const response = await axiosInstance.get(
      `${API_URL}/notifications/unread/count`,
    );
    return response.data.count;
  },

  /**
   * Mark a notification as read
   * @param {string} notificationId - ID of the notification to mark as read
   * @returns {Promise<Object>} Updated notification
   */
  markAsRead: async (notificationId) => {
    const response = await axiosInstance.patch(
      `${API_URL}/notifications/${notificationId}/read`,
    );
    return response.data;
  },

  /**
   * Mark all notifications as read
   * @returns {Promise<Object>} Response with success status
   */
  markAllAsRead: async () => {
    const response = await axiosInstance.patch(
      `${API_URL}/notifications/read-all`,
    );
    return response.data;
  },

  /**
   * Delete a notification
   * @param {string} notificationId - ID of the notification to delete
   * @returns {Promise<Object>} Response with success status
   */
  deleteNotification: async (notificationId) => {
    const response = await axiosInstance.delete(
      `${API_URL}/notifications/${notificationId}`,
    );
    return response.data;
  },

  // Clear all notifications
  clearAllNotifications: async () => {
    const response = await axiosInstance.delete(
      `${API_URL}/notifications/clear-all`,
    );
    return response.data;
  },
};

export default notificationServiceUser;
