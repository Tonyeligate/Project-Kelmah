/**
 * Notification Service
 * Handles all notification-related API calls with proper service routing and fallbacks
 */

import { authServiceClient } from '../../common/services/axios';
import { API_BASE_URL } from '../../../config/constants';

class NotificationService {
  constructor() {
    // Temporarily use auth service for notifications until messaging service is deployed
    this.client = authServiceClient;
  }

  // Connect to notification socket
  connect() {
    if (this.isConnected) return;

    try {
      // Socket connection will be implemented when needed
      console.log('Notification socket connection not implemented yet');
    } catch (error) {
      console.error('Failed to connect to notification socket:', error);
    }
  }

  // Disconnect from notification socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }

  // Get notifications
  async getNotifications() {
    try {
      const response = await this.client.get('/notifications');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const response = await this.client.patch(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await this.client.patch('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  // Clear all notifications
  async clearAllNotifications() {
    try {
      const response = await this.client.delete('/notifications/clear-all');
      return response.data;
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      throw error;
    }
  }

  // Get unread count
  async getUnreadCount() {
    try {
      const response = await this.client.get('/notifications/unread/count');
      return response.data.count;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      throw error;
    }
  }

  // Delete a specific notification
  async deleteNotification(notificationId) {
    try {
      const response = await this.client.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();

/**
 * Service for managing user notifications
 * This is the main export that should be used by components
 */
const notificationServiceUser = {
  /**
   * Get all notifications for the current user
   * @returns {Promise<Array>} Array of notification objects
   */
  getNotifications: async () => {
    return await notificationService.getNotifications();
  },

  /**
   * Get unread notification count
   * @returns {Promise<number>} Count of unread notifications
   */
  getUnreadCount: async () => {
    return await notificationService.getUnreadCount();
  },

  /**
   * Mark a notification as read
   * @param {string} notificationId - ID of the notification to mark as read
   * @returns {Promise<Object>} Updated notification
   */
  markAsRead: async (notificationId) => {
    return await notificationService.markAsRead(notificationId);
  },

  /**
   * Mark all notifications as read
   * @returns {Promise<Object>} Response with success status
   */
  markAllAsRead: async () => {
    return await notificationService.markAllAsRead();
  },

  /**
   * Delete a notification
   * @param {string} notificationId - ID of the notification to delete
   * @returns {Promise<Object>} Response with success status
   */
  deleteNotification: async (notificationId) => {
    return await notificationService.deleteNotification(notificationId);
  },

  // Clear all notifications
  clearAllNotifications: async () => {
    return await notificationService.clearAllNotifications();
  },
};

export default notificationServiceUser;