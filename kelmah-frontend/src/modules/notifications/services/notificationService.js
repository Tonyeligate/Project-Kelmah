import axiosInstance from '../../common/services/axios';
import io from 'socket.io-client';
import { API_BASE_URL } from '../../../config/constants';
import { API_URL } from '../../../config/constants';

class NotificationService {
    constructor() {
        this.socket = null;
        this.subscribers = {};
        this.isConnected = false;
    }

    // Connect to notification socket
    connect() {
        if (this.isConnected) return;

        try {
            this.socket = io(`${API_BASE_URL}/notifications`, {
                auth: {
                    token: localStorage.getItem('token'),
                },
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 2000,
            });

            this.socket.on('connect', () => {
                this.isConnected = true;
                console.log('Connected to notification service');
            });

            this.socket.on('disconnect', () => {
                this.isConnected = false;
                console.log('Disconnected from notification service');
            });

            this.socket.on('error', (error) => {
                console.error('Notification socket error:', error);
            });

            // Set up event listeners based on subscribers
            Object.keys(this.subscribers).forEach(event => {
                this.socket.on(event, (data) => {
                    this.subscribers[event].forEach(callback => callback(data));
                });
            });
        } catch (error) {
            console.error('Error connecting to notification service:', error);
        }
    }

    // Disconnect from notification socket
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.isConnected = false;
        }
    }

    // Subscribe to an event
    subscribe(event, callback) {
        if (!this.subscribers[event]) {
            this.subscribers[event] = [];
            
            // If socket is already connected, set up event listener
            if (this.socket && this.isConnected) {
                this.socket.on(event, (data) => {
                    this.subscribers[event].forEach(cb => cb(data));
                });
            }
        }
        
        this.subscribers[event].push(callback);
        
        // Return unsubscribe function
        return () => {
            this.subscribers[event] = this.subscribers[event].filter(cb => cb !== callback);
            
            // If no more subscribers for this event, remove event listener
            if (this.subscribers[event].length === 0) {
                delete this.subscribers[event];
                if (this.socket && this.isConnected) {
                    this.socket.off(event);
                }
            }
        };
    }

    // Get notifications with pagination
    async getNotifications(page = 1, limit = 20) {
        try {
            const response = await axiosInstance.get('/api/notifications', {
                params: { page, limit }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    }

    // Mark notification as read
    async markAsRead(notificationId) {
        try {
            const response = await axiosInstance.put(`/api/notifications/${notificationId}/read`);
            return response.data;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    // Mark all notifications as read
    async markAllAsRead() {
        try {
            const response = await axiosInstance.put('/api/notifications/read-all');
            return response.data;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }

    // Delete notification
    async deleteNotification(notificationId) {
        try {
            const response = await axiosInstance.delete(`/api/notifications/${notificationId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }

    // Get notification preferences
    async getNotificationPreferences() {
        try {
            const response = await axiosInstance.get('/api/notifications/preferences');
            return response.data;
        } catch (error) {
            console.error('Error fetching notification preferences:', error);
            throw error;
        }
    }

    // Update notification preferences
    async updateNotificationPreferences(preferences) {
        try {
            const response = await axiosInstance.put('/api/notifications/preferences', preferences);
            return response.data;
        } catch (error) {
            console.error('Error updating notification preferences:', error);
            throw error;
        }
    }

    // Get unread notification count
    async getUnreadCount() {
        try {
            const response = await axiosInstance.get('/api/notifications/unread-count');
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
    const response = await axiosInstance.get(`${API_URL}/notifications/unread/count`);
    return response.data.count;
  },
  
  /**
   * Mark a notification as read
   * @param {string} notificationId - ID of the notification to mark as read
   * @returns {Promise<Object>} Updated notification
   */
  markAsRead: async (notificationId) => {
    const response = await axiosInstance.patch(`${API_URL}/notifications/${notificationId}/read`);
    return response.data;
  },
  
  /**
   * Mark all notifications as read
   * @returns {Promise<Object>} Response with success status
   */
  markAllAsRead: async () => {
    const response = await axiosInstance.patch(`${API_URL}/notifications/read-all`);
    return response.data;
  },
  
  /**
   * Delete a notification
   * @param {string} notificationId - ID of the notification to delete
   * @returns {Promise<Object>} Response with success status
   */
  deleteNotification: async (notificationId) => {
    const response = await axiosInstance.delete(`${API_URL}/notifications/${notificationId}`);
    return response.data;
  },

  // Clear all notifications
  clearAllNotifications: async () => {
    const response = await axiosInstance.delete(`${API_URL}/notifications/clear-all`);
    return response.data;
  }
};

export default notificationServiceUser; 