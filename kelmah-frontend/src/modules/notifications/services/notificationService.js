/**
 * Notification Service
 * Handles all notification-related API calls with proper service routing and fallbacks
 */

import { api } from '../../../services/apiClient';
import { getServiceStatusMessage } from '../../../utils/serviceHealthCheck';
import websocketService from '../../../services/websocketService';
import { APP_SOCKET_EVENTS } from '../../../services/socketEvents';
import {
  createFeatureLogger,
  devError,
  devWarn,
} from '@/modules/common/utils/devLogger';

const devLog = createFeatureLogger({
  flagName: 'VITE_DEBUG_NOTIFICATIONS',
  level: 'log',
});

export const normalizeNotificationLink = (notification = {}) => {
  const rawLink = notification?.link || notification?.actionUrl || null;
  const entityType = notification?.relatedEntity?.type;
  const rawEntityId = notification?.relatedEntity?.id;
  const entityId =
    typeof rawEntityId === 'string' || typeof rawEntityId === 'number'
      ? String(rawEntityId)
      : rawEntityId?._id || rawEntityId?.id || null;
  const type = notification?.type;

  if (typeof rawLink === 'string' && rawLink.length > 0) {
    if (/^https?:\/\//i.test(rawLink)) {
      return rawLink;
    }

    const legacyJobMatch = rawLink.match(/^\/job\/([^/?#]+)$/);
    if (legacyJobMatch) {
      return `/jobs/${legacyJobMatch[1]}`;
    }

    const jobApplicationsMatch = rawLink.match(/^\/jobs\/([^/?#]+)\/applications(?:\?.*)?$/);
    if (jobApplicationsMatch) {
      return `/jobs/${jobApplicationsMatch[1]}`;
    }

    const messageMatch = rawLink.match(/^\/messages\/([^/?#]+)$/);
    if (messageMatch) {
      return `/messages?conversation=${messageMatch[1]}`;
    }

    const quickJobsMatch = rawLink.match(/^\/quick-jobs\/([^/?#]+)$/);
    if (quickJobsMatch) {
      return `/quick-job/${quickJobsMatch[1]}`;
    }

    const quickJobMatch = rawLink.match(/^\/quick-job\/([^/?#]+)$/);
    if (quickJobMatch) {
      return `/quick-job/${quickJobMatch[1]}`;
    }

    return rawLink;
  }

  if (entityType === 'contract' && entityId) {
    return `/contracts/${entityId}`;
  }

  if (entityType === 'job' && entityId) {
    return `/jobs/${entityId}`;
  }

  if (entityType === 'escrow' && entityId) {
    return `/payment/escrow/${entityId}`;
  }

  if (entityType === 'quick_job' && entityId) {
    return `/quick-job/${entityId}`;
  }

  if (entityType === 'payment') {
    return '/wallet';
  }

  if (type === 'contract_update') {
    return '/contracts';
  }

  if (type === 'payment_received') {
    return '/wallet';
  }

  if (type === 'job_application' || type === 'job_offer') {
    return '/jobs';
  }

  return null;
};

class NotificationService {
  constructor() {
    // Use messaging service for notifications (now that CORS is fixed)
    this.client = api;
    this.isConnected = false;
    this.onNotification = null;
    this._listeners = null;
  }

  // Attach to shared websocketService notification channels
  async connect(token, userId, userRole = 'worker') {
    if (this.isConnected && this._listeners) return;
    try {
      if (!token) {
        devWarn('Notifications: connect skipped - missing auth token');
        return;
      }

      if (!websocketService.isConnected && userId) {
        await websocketService.connect(userId, userRole, token);
      }

      if (!websocketService.socket) {
        devWarn('Notifications: shared websocket unavailable; realtime notifications paused');
        return;
      }

      this._listeners = {
        [APP_SOCKET_EVENTS.GENERIC_NOTIFICATION]: (payload) => {
          this.onNotification && this.onNotification(payload);
        },
        [APP_SOCKET_EVENTS.SYSTEM_NOTIFICATION]: (payload) => {
          this.onNotification && this.onNotification(payload);
        },
        [APP_SOCKET_EVENTS.PAYMENT_NOTIFICATION]: (payload) => {
          this.onNotification && this.onNotification(payload);
        },
        [APP_SOCKET_EVENTS.JOB_NOTIFICATION]: (payload) => {
          this.onNotification && this.onNotification(payload);
        },
      };

      Object.entries(this._listeners).forEach(([event, handler]) => {
        websocketService.addEventListener(event, handler);
      });

      this.isConnected = true;
      devLog('ðŸ“¡ Notifications subscribed to shared websocket events');
    } catch (error) {
      devError('Failed to connect to notification socket:', error);
    }
  }

  // Detach notification listeners from shared websocketService
  disconnect() {
    if (this._listeners) {
      Object.entries(this._listeners).forEach(([event, handler]) => {
        websocketService.removeEventListener(event, handler);
      });
      this._listeners = null;
    }
    this.isConnected = false;
  }

  // Get notifications
  async getNotifications(params = {}) {
    try {
      const response = await this.client.get('/notifications', {
        params,
        'axios-retry': {
          retries: 2,
          retryDelay: (retryCount) => retryCount * 2000,
          retryCondition: (error) => {
            if (error.response) {
              const { status } = error.response;
              return status === 408 || status === 503;
            }
            return false;
          },
        },
      });

      // Normalize response shape â€” backend should return { data, pagination }
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

      // Return raw notifications â€” normalization is handled by NotificationContext
      return {
        notifications,
        data: notifications,
        pagination:
          pagination || {
            page: 1,
            limit: notifications.length,
            total: notifications.length,
            pages: notifications.length > 0 ? 1 : 0,
          },
      };
    } catch (error) {
      const statusMsg = getServiceStatusMessage();

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Unknown error occurred';

      devError('Failed to fetch notifications:', {
        error: errorMessage,
        serviceStatus: statusMsg.status,
      });

      if (statusMsg.status === 'cold') {
        devLog(
          'Messaging Service is cold starting â€” this is normal and will take 30-60 seconds...',
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
      devError('Failed to mark notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await this.client.patch('/notifications/read/all');
      return response.data;
    } catch (error) {
      devError('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  // Clear all notifications
  async clearAllNotifications() {
    try {
      const response = await this.client.delete('/notifications/clear-all');
      return response.data;
    } catch (error) {
      devError('Failed to clear all notifications:', error);
      throw error;
    }
  }

  // Get unread count
  async getUnreadCount() {
    try {
      const response = await this.client.get('/notifications/unread/count');
      const payload = response.data;
      if (typeof payload?.unreadCount === 'number') return payload.unreadCount;
      if (typeof payload?.data?.unreadCount === 'number') return payload.data.unreadCount;
      return 0;
    } catch (error) {
      devError('Failed to get unread count:', error);
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
      devError('Failed to delete notification:', error);
      throw error;
    }
  }

  // Get notification preferences (channels and types)
  async getPreferences() {
    try {
      const response = await this.client.get('/notifications/preferences');
      return response.data?.data || response.data;
    } catch (error) {
      devError('Failed to load notification preferences:', error);
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
      devError('Failed to update notification preferences:', error);
      throw error;
    }
  }
}

// Named export: full class instance used by NotificationContext + JobAlertsPage
export const notificationService = new NotificationService();

/**
 * Simplified notification API wrapper â€” default export
 * Used by NotificationSettingsPage and other simple consumers.
 * For socket-level access (connect/disconnect), use the named { notificationService } export.
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

