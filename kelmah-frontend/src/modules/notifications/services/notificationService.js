/**
 * Notification Service
 * Handles all notification-related API calls with proper service routing and fallbacks
 */

import { api } from '../../../services/apiClient';
import { io } from 'socket.io-client';
import { getServiceStatusMessage } from '../../../utils/serviceHealthCheck';
import { WS_CONFIG } from '../../../config/environment';
import { getWebSocketUrl } from '../../../services/socketUrl';

const normalizeNotificationLink = (notification = {}) => {
  const rawLink = notification?.link || notification?.actionUrl || null;
  const entityType = notification?.relatedEntity?.type;
  const entityId = notification?.relatedEntity?.id;
  const type = notification?.type;

  if (typeof rawLink === 'string' && rawLink.length > 0) {
    if (/^https?:\/\//i.test(rawLink)) {
      return rawLink;
    }

    const messageMatch = rawLink.match(/^\/messages\/([^/?#]+)$/);
    if (messageMatch) {
      return `/messages?conversation=${messageMatch[1]}`;
    }

    return rawLink;
  }

  if (entityType === 'contract' && entityId) {
    return `/contracts/${entityId}`;
  }

  if ((entityType === 'payment' || entityType === 'escrow') && entityId) {
    return `/payment/escrow/${entityId}`;
  }

  if (type === 'contract_update') {
    return '/contracts';
  }

  if (type === 'payment_received') {
    return '/wallet';
  }

  return null;
};

class NotificationService {
  constructor() {
    // Use messaging service for notifications (now that CORS is fixed)
    this.client = api;
    this.socket = null;
    this.isConnected = false;
    this.onNotification = null;
  }

  // Connect to notification socket
  async connect(token) {
    if (this.isConnected) return;
    try {
      if (!token) {
        console.warn('Notifications: connect skipped - missing auth token');
        return;
      }

      // Disconnect any stale socket before reconnecting
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }

      const wsUrl = await getWebSocketUrl();
      console.log('📡 Notifications WebSocket connecting to:', wsUrl);

      // Connect to backend messaging service via API Gateway
      this.socket = io(wsUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        path: '/socket.io',
      });
      this.socket.on('connect', () => {
        this.isConnected = true;
      });
      this.socket.on('disconnect', () => {
        this.isConnected = false;
      });
      this.socket.on('notification', (payload) => {
        // Bubble up via callback if set
        this.onNotification && this.onNotification(payload);
      });
    } catch (error) {
      console.error('Failed to connect to notification socket:', error);
    }
  }

  // Disconnect from notification socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }

  // Get notifications
  async getNotifications(params = {}) {
    try {
      // Add retry-control header to prevent excessive retries on rate limit
      const response = await this.client.get('/notifications', {
        params,
        // Disable automatic retries for this endpoint to prevent rate limiting
        'axios-retry': {
          retries: 2, // Max 2 retries instead of default
          retryDelay: (retryCount) => retryCount * 2000, // 2s, 4s delays
          retryCondition: (error) => {
            // Don't retry on 429 (rate limit) or 4xx errors except 408, 429, 503
            if (error.response) {
              const { status } = error.response;
              return status === 408 || status === 503; // Only retry timeouts and service unavailable
            }
            return false;
          },
        },
      });
      const normalizeNotification = (notification = {}) => ({
        ...notification,
        id: notification?.id || notification?._id,
        title: notification?.title || notification?.message || '',
        message:
          notification?.message ||
          notification?.content ||
          notification?.title ||
          '',
        link: normalizeNotificationLink(notification),
        read:
          typeof notification?.read === 'boolean'
            ? notification.read
            : Boolean(notification?.readStatus?.isRead),
        date:
          notification?.date ||
          notification?.createdAt ||
          notification?.timestamp ||
          new Date().toISOString(),
      });

      // Normalize to { notifications, data, pagination }
      const payload = response.data;
      let notifications = [];
      let pagination = null;

      if (Array.isArray(payload)) {
        notifications = payload;
        pagination = {
          page: 1,
          limit: payload.length,
          total: payload.length,
          pages: 1,
        };
      } else if (payload?.data && Array.isArray(payload.data)) {
        notifications = payload.data;
        pagination = payload.pagination;
      } else if (payload?.data?.notifications) {
        notifications = payload.data.notifications;
        pagination = payload.data.pagination || payload.pagination;
      } else if (payload?.notifications) {
        notifications = payload.notifications;
        pagination = payload.pagination;
      }

      const normalizedNotifications = notifications.map(normalizeNotification);

      return {
        notifications: normalizedNotifications,
        data: normalizedNotifications,
        pagination:
          pagination || {
            page: 1,
            limit: normalizedNotifications.length,
            total: normalizedNotifications.length,
            pages: normalizedNotifications.length > 0 ? 1 : 0,
          },
      };
    } catch (error) {
      const statusMsg = getServiceStatusMessage();

      // Enhanced error logging with service health context
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Unknown error occurred';

      console.error('Failed to fetch notifications:', {
        error: errorMessage,
        serviceStatus: statusMsg.status,
        userMessage: statusMsg.message,
        action: statusMsg.action,
      });

      // Enhanced fallback messaging based on service status
      if (statusMsg.status === 'cold') {
        console.log(
          '🔥 Messaging Service is cold starting - this is normal and will take 30-60 seconds...',
        );
      } else {
        console.log(
          '🔔 Using empty notifications fallback during service timeout',
        );
      }
      return {
        notifications: [],
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      };
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const response = await this.client.patch(
        `/notifications/${notificationId}/read`,
      );
      return response.data;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await this.client.patch('/notifications/read/all');
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
      return response.data.unreadCount;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      throw error;
    }
  }

  // Delete a specific notification
  async deleteNotification(notificationId) {
    try {
      const response = await this.client.delete(
        `/notifications/${notificationId}`,
      );
      return response.data;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  // Get notification preferences (channels and types)
  async getPreferences() {
    try {
      const response = await this.client.get('/notifications/preferences');
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      throw error;
    }
  }

  // Update notification preferences
  async updatePreferences(preferences) {
    try {
      const response = await this.client.put(
        '/notifications/preferences',
        preferences,
      );
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
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
  getNotifications: async (params = {}) => {
    return await notificationService.getNotifications(params);
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

  // Preferences
  getPreferences: async () => {
    return await notificationService.getPreferences();
  },
  updatePreferences: async (preferences) => {
    return await notificationService.updatePreferences(preferences);
  },
};

export default notificationServiceUser;
