import axios from 'axios';
import { io } from 'socket.io-client';
import { API_BASE_URL, WS_URL, USE_MOCK_DATA } from '../config';
import { getAuthToken } from './authService';

// Mock data for offline/development mode
const MOCK_NOTIFICATIONS = [
  {
    _id: '1',
    title: 'New message received',
    content: 'You have a new message from Sarah Johnson',
    type: 'message',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    recipient: '1234567890',
    sender: {
      id: '9876543210',
      name: 'Sarah Johnson'
    },
    metadata: {
      conversationId: '123456'
    }
  },
  {
    _id: '2',
    title: 'Job application accepted',
    content: 'Your application for "Bathroom renovation" has been accepted',
    type: 'job_update',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    recipient: '1234567890',
    sender: {
      id: 'system',
      name: 'System'
    },
    metadata: {
      jobId: '789012'
    }
  },
  {
    _id: '3',
    title: 'Payment received',
    content: 'You received a payment of $150.00 from Michael Davis',
    type: 'payment',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    recipient: '1234567890',
    sender: {
      id: '5432167890',
      name: 'Michael Davis'
    },
    metadata: {
      amount: 150.00,
      currency: 'USD',
      paymentId: '345678'
    }
  }
];

const MOCK_PREFERENCES = {
  channels: {
    in_app: true,
    email: true,
    sms: false,
    push: true
  },
  types: {
    message: true,
    job_update: true,
    payment: true,
    proposal: true,
    review: true,
    contract: true,
    system: true
  },
  quietHours: {
    enabled: false,
    from: '22:00',
    to: '08:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  },
  weeklyDigest: true,
  showToasts: true
};

/**
 * NotificationService
 * Handles all notification operations including real-time delivery via WebSockets
 */
class NotificationService {
  constructor() {
    this.socket = null;
    this.subscribers = new Map();
    this.connected = false;
    this.notificationTypes = {
      MESSAGE: 'message', // New message
      JOB_UPDATE: 'job_update', // Job status changed
      PAYMENT: 'payment', // Payment received/sent
      REVIEW: 'review', // New review
      PROPOSAL: 'proposal', // New proposal received
      CONTRACT: 'contract', // Contract updates
      SYSTEM: 'system', // System notifications
      SECURITY: 'security', // Security-related notifications
    };
    this.notificationChannels = {
      IN_APP: 'in_app',
      EMAIL: 'email',
      SMS: 'sms',
      PUSH: 'push'
    };
    // Set to true to use mock data when backend is unavailable (in development)
    this.useMockData = USE_MOCK_DATA || process.env.NODE_ENV === 'development';
  }

  /**
   * Connect to notification WebSocket
   * Sets up event listeners for real-time notifications
   */
  connect() {
    if (this.socket) return;

    try {
      const token = getAuthToken();
      if (!token) return;
      
      // If using mock data, don't try to connect to WebSocket
      if (this.useMockData) {
        console.log('Using mock data for notifications - not connecting to WebSocket');
        this._emitMockNotification();
        return;
      }

      // Connect to the notifications namespace
      this.socket = io(`${WS_URL || 'ws://localhost:5174'}/notifications`, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        this.connected = true;
        console.log('Notification socket connected');
        
        // Join user's notification channel
        const userId = JSON.parse(atob(token.split('.')[1])).sub;
        this.socket.emit('join:notifications', userId);
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
        console.log('Notification socket disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Notification socket connection error:', error);
        
        // If socket can't connect, we'll use mock data
        if (this.useMockData) {
          console.log('Using mock data for notifications');
          this._emitMockNotification();
        }
      });

      // Set up event listeners
      this.socket.on('notification', this.handleNotification.bind(this));
      this.socket.on('notification_read', this.handleNotificationRead.bind(this));
      this.socket.on('notification_count', this.handleNotificationCount.bind(this));
      this.socket.on('all_notifications_read', this.handleAllNotificationsRead.bind(this));
      this.socket.on('error', this.handleSocketError.bind(this));
    } catch (error) {
      console.log('Using mock notification data in development mode');
      if (this.useMockData) {
        this._emitMockNotification();
      }
    }
  }
  
  /**
   * Emit a mock notification for testing when backend is unavailable
   * @private
   */
  _emitMockNotification() {
    // Wait a bit to simulate network delay
    setTimeout(() => {
      // Emit a mock notification to subscribers
      const mockNotification = {
        _id: Date.now().toString(),
        title: 'Welcome to Kelmah',
        content: 'This is a mock notification because the backend is not available.',
        type: 'system',
        isRead: false,
        createdAt: new Date().toISOString(),
        sender: {
          id: 'system',
          name: 'System'
        }
      };
      
      const callbacks = this.subscribers.get('notification');
      if (callbacks) {
        callbacks.forEach(callback => callback(mockNotification));
      }
    }, 2000);
  }

  /**
   * Disconnect from notification WebSocket
   */
  disconnect() {
    if (!this.socket) return;
    
    const token = getAuthToken();
    if (token) {
      const userId = JSON.parse(atob(token.split('.')[1])).sub;
      this.socket.emit('leave:notifications', userId);
    }
    
    this.socket.disconnect();
    this.socket = null;
    this.connected = false;
  }

  /**
   * Subscribe to notification events
   * @param {string} event - Event name to subscribe to
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    
    this.subscribers.get(event).add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  /**
   * Handle new notification from WebSocket
   * @param {Object} notification - Notification object
   */
  handleNotification(notification) {
    const callbacks = this.subscribers.get('notification');
    if (callbacks) {
      callbacks.forEach(callback => callback(notification));
    }
  }

  /**
   * Handle notification read event from WebSocket
   * @param {Object} data - Read notification data
   */
  handleNotificationRead(data) {
    const callbacks = this.subscribers.get('notification_read');
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Handle notification count update from WebSocket
   * @param {number} count - Unread notification count
   */
  handleNotificationCount(count) {
    const callbacks = this.subscribers.get('notification_count');
    if (callbacks) {
      callbacks.forEach(callback => callback(count));
    }
  }

  /**
   * Handle all notifications read event from WebSocket
   */
  handleAllNotificationsRead() {
    const callbacks = this.subscribers.get('all_notifications_read');
    if (callbacks) {
      callbacks.forEach(callback => callback());
    }
  }

  /**
   * Handle socket error
   * @param {Error} error - Error object
   */
  handleSocketError(error) {
    console.error('Notification socket error:', error);
    const callbacks = this.subscribers.get('error');
    if (callbacks) {
      callbacks.forEach(callback => callback(error));
    }
  }

  /**
   * Mark notification as read via WebSocket
   * @param {string} notificationId - Notification ID
   * @returns {Promise} Promise resolving when completed
   */
  markAsReadViaSocket(notificationId) {
    if (!this.connected || !this.socket) {
      console.warn('Socket not connected. Using REST API instead.');
      return this.markAsRead(notificationId);
    }

    this.socket.emit('mark_read', { notificationId });
    return Promise.resolve();
  }

  /**
   * Mark all notifications as read via WebSocket
   * @returns {Promise} Promise resolving when completed
   */
  markAllAsReadViaSocket() {
    if (!this.connected || !this.socket) {
      console.warn('Socket not connected. Using REST API instead.');
      return this.markAllAsRead();
    }

    this.socket.emit('mark_all_read');
    return Promise.resolve();
  }

  /**
   * Get notifications from the API
   * Falls back to mock data if API is unavailable
   * @param {number} page - Page number
   * @param {number} limit - Number of items per page
   * @returns {Promise<Object>} - Paginated notifications response
   */
  async getNotifications(page = 1, limit = 10) {
    if (this.useMockData) {
      console.log('Using mock notification data');
      return {
        notifications: MOCK_NOTIFICATIONS,
        unreadCount: MOCK_NOTIFICATIONS.filter(n => !n.isRead).length,
        total: MOCK_NOTIFICATIONS.length,
        page,
        pages: 1
      };
    }
    
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        params: { page, limit },
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      return response.data;
    } catch (error) {
      console.log('Error fetching notifications: ', error);
      console.log('Using mock notification data');
      return {
        notifications: MOCK_NOTIFICATIONS,
        unreadCount: MOCK_NOTIFICATIONS.filter(n => !n.isRead).length,
        total: MOCK_NOTIFICATIONS.length,
        page,
        pages: 1
      };
    }
  }

  /**
   * Get unread notification count
   * @returns {Promise<number>} Unread notification count
   */
  async getUnreadCount() {
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications/unread-count`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      
      return response.data.data.count;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      
      // Return mock count if backend is unavailable
      if (this.useMockData) {
        return MOCK_NOTIFICATIONS.filter(n => !n.isRead).length;
      }
      
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Updated notification
   */
  async markAsRead(notificationId) {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`
          }
        }
      );
      
      return response.data.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      
      // Return mock response if backend is unavailable
      if (this.useMockData) {
        const notification = MOCK_NOTIFICATIONS.find(n => n._id === notificationId);
        if (notification) {
          notification.isRead = true;
          notification.readAt = new Date().toISOString();
          return notification;
        }
      }
      
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   * @returns {Promise<Object>} Response data
   */
  async markAllAsRead() {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/notifications/mark-all-read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      
      // Return mock response if backend is unavailable
      if (this.useMockData) {
        MOCK_NOTIFICATIONS.forEach(n => {
          n.isRead = true;
          n.readAt = new Date().toISOString();
        });
        return { success: true, message: 'All notifications marked as read' };
      }
      
      throw error;
    }
  }

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Response data
   */
  async deleteNotification(notificationId) {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/notifications/${notificationId}`,
        {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      
      // Return mock response if backend is unavailable
      if (this.useMockData) {
        const index = MOCK_NOTIFICATIONS.findIndex(n => n._id === notificationId);
        if (index !== -1) {
          MOCK_NOTIFICATIONS.splice(index, 1);
        }
        return { success: true, message: 'Notification deleted' };
      }
      
      throw error;
    }
  }

  /**
   * Get notification preferences
   * @returns {Promise<Object>} - Notification preferences
   */
  async getNotificationPreferences() {
    if (this.useMockData) {
      return MOCK_PREFERENCES;
    }
    
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications/preferences`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      return response.data;
    } catch (error) {
      console.log('Error fetching notification preferences: ', error);
      return MOCK_PREFERENCES;
    }
  }

  /**
   * Update notification preferences
   * @param {Object} preferences - New preference settings
   * @returns {Promise<Object>} Updated preferences
   */
  async updateNotificationPreferences(preferences) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/notifications/preferences`,
        preferences,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`
          }
        }
      );
      
      return response.data.data;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      
      // Return mock response if backend is unavailable
      if (this.useMockData) {
        Object.assign(MOCK_PREFERENCES, preferences);
        return MOCK_PREFERENCES;
      }
      
      throw error;
    }
  }

  /**
   * Toggle notification channel
   * @param {string} channel - Channel to toggle
   * @param {boolean} enabled - Whether to enable or disable
   * @returns {Promise<Object>} Updated preferences
   */
  async toggleNotificationChannel(channel, enabled) {
    try {
      return await this.updateNotificationPreferences({
        channels: {
          [channel]: enabled
        }
      });
    } catch (error) {
      console.error(`Error toggling ${channel} channel:`, error);
      throw error;
    }
  }

  /**
   * Toggle notification type
   * @param {string} type - Notification type to toggle
   * @param {boolean} enabled - Whether to enable or disable
   * @returns {Promise<Object>} Updated preferences
   */
  async toggleNotificationType(type, enabled) {
    try {
      return await this.updateNotificationPreferences({
        types: {
          [type]: enabled
        }
      });
    } catch (error) {
      console.error(`Error toggling ${type} notifications:`, error);
      throw error;
    }
  }

  /**
   * Update quiet hours preferences
   * @param {Object} quietHours - Quiet hours settings
   * @returns {Promise<Object>} Updated preferences
   */
  async updateQuietHours(quietHours) {
    try {
      return await this.updateNotificationPreferences({
        quietHours
      });
    } catch (error) {
      console.error('Error updating quiet hours:', error);
      throw error;
    }
  }

  /**
   * Toggle digest email preference
   * @param {boolean} enabled - Whether to enable or disable
   * @returns {Promise<Object>} Updated preferences
   */
  async toggleDigestEmail(enabled) {
    try {
      return await this.updateNotificationPreferences({
        weeklyDigest: enabled
      });
    } catch (error) {
      console.error('Error toggling digest email:', error);
      throw error;
    }
  }

  /**
   * Enable all notifications
   * @returns {Promise<Object>} Updated preferences
   */
  async enableAllNotifications() {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/notifications/preferences/enable-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`
          }
        }
      );
      
      return response.data.data;
    } catch (error) {
      console.error('Error enabling all notifications:', error);
      
      // Return mock response if backend is unavailable
      if (this.useMockData) {
        // Enable all notification types and channels
        Object.keys(MOCK_PREFERENCES.channels).forEach(channel => {
          MOCK_PREFERENCES.channels[channel] = true;
        });
        
        Object.keys(MOCK_PREFERENCES.types).forEach(type => {
          MOCK_PREFERENCES.types[type] = true;
        });
        
        return MOCK_PREFERENCES;
      }
      
      throw error;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService(); 