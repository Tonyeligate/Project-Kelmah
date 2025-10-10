/**
 * Notification Service
 * Handles all notification-related API calls with proper service routing and fallbacks
 */

import { messagingServiceClient } from '../../common/services/axios';
import { getServiceStatusMessage } from '../../../utils/serviceHealthCheck';
import { WS_CONFIG } from '../../../config/environment';

class NotificationService {
  constructor() {
    // Use messaging service for notifications (now that CORS is fixed)
    this.client = messagingServiceClient;
  }

  // Connect to notification socket
  async connect(token) {
    if (this.isConnected) return;
    try {
      if (!token) {
        console.warn('Notifications: connect skipped - missing auth token');
        return;
      }

      const normalizeUrl = (url) => {
        if (!url) {
          return null;
        }

        const trimmed = url.trim();
        if (!trimmed) {
          return null;
        }

        if (/^https?:/i.test(trimmed) || /^wss?:/i.test(trimmed)) {
          return trimmed;
        }

        if (typeof window !== 'undefined' && window.location?.origin) {
          return `${window.location.origin.replace(/\/$/, '')}/${trimmed.replace(/^\//, '')}`;
        }

        return `https://${trimmed.replace(/^\//, '')}`;
      };

      const preferSecureScheme = (url) => {
        if (!url) {
          return null;
        }
        if (url.startsWith('wss://') || url.startsWith('ws://')) {
          return url;
        }
        if (url.startsWith('https://')) {
          return url;
        }
        if (url.startsWith('http://')) {
          // Allow explicit http for localhost development
          return url;
        }
        return url;
      };

      const deriveDefaultUrl = () => {
        if (WS_CONFIG?.url) {
          return WS_CONFIG.url;
        }
        if (typeof window !== 'undefined' && window.location?.origin) {
          return window.location.origin;
        }
        return 'http://localhost:5000';
      };

      // Get backend WebSocket URL from runtime config
      let wsUrl = deriveDefaultUrl();
      try {
        const response = await fetch('/runtime-config.json');
        if (response.ok) {
          const config = await response.json();
          wsUrl =
            config.websocketUrl ||
            config.localtunnelUrl ||
            config.ngrokUrl ||
            config.WS_URL ||
            config.API_URL ||
            wsUrl;
        }
      } catch (configError) {
        console.warn(
          '⚠️ Notifications: Failed to load runtime config, using fallback URL:',
          wsUrl,
          configError,
        );
      }

      wsUrl = preferSecureScheme(normalizeUrl(wsUrl));

      if (!wsUrl) {
        console.error(
          'Notifications: No valid WebSocket URL resolved; skipping socket connection',
        );
        return;
      }

      console.log('📡 Notifications WebSocket connecting to:', wsUrl);

      const { io } = await import('socket.io-client');
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
      this.isConnected = false;
    }
  }

  // Get notifications
  async getNotifications(params = {}) {
    try {
      const response = await this.client.get('/api/notifications', { params });
      // Normalize to { notifications, pagination }
      const data = response.data;
      if (Array.isArray(data)) {
        return {
          notifications: data,
          pagination: {
            page: 1,
            limit: data.length,
            total: data.length,
            pages: 1,
          },
        };
      }
      if (data?.data && Array.isArray(data.data)) {
        return { notifications: data.data, pagination: data.pagination };
      }
      if (data?.data?.notifications) {
        return {
          notifications: data.data.notifications,
          pagination: data.data.pagination || data.pagination,
        };
      }
      if (data?.notifications) {
        return {
          notifications: data.notifications,
          pagination: data.pagination,
        };
      }
      return data;
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
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      };
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const response = await this.client.patch(
        `/api/notifications/${notificationId}/read`,
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
      const response = await this.client.patch('/api/notifications/read/all');
      return response.data;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  // Clear all notifications
  async clearAllNotifications() {
    try {
      const response = await this.client.delete('/api/notifications/clear-all');
      return response.data;
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      throw error;
    }
  }

  // Get unread count
  async getUnreadCount() {
    try {
      const response = await this.client.get('/api/notifications/unread/count');
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
        `/api/notifications/${notificationId}`,
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
      const response = await this.client.get('/api/notifications/preferences');
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
        '/api/notifications/preferences',
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
