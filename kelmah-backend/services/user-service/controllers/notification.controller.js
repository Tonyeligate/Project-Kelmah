const { notificationService, DELIVERY_CHANNELS, NOTIFICATION_TYPES } = require('../services/notification.service');

const notificationController = {
  // Get notifications for the authenticated user
  getNotifications: async (req, res) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, unreadOnly = false } = req.query;
      
      const result = await notificationService.getNotifications(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        unreadOnly: unreadOnly === 'true'
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({ error: 'Failed to get notifications' });
    }
  },
  
  // Get unread notification count
  getUnreadCount: async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await notificationService.getUnreadCount(userId);
      
      res.json(result);
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({ error: 'Failed to get unread notification count' });
    }
  },
  
  // Mark a notification as read
  markAsRead: async (req, res) => {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;
      
      const notification = await notificationService.markAsRead(notificationId, userId);
      
      res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  },
  
  // Mark all notifications as read
  markAllAsRead: async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await notificationService.markAllAsRead(userId);
      
      res.json(result);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  },
  
  // Delete a notification
  deleteNotification: async (req, res) => {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;
      
      const result = await notificationService.deleteNotification(notificationId, userId);
      
      res.json(result);
    } catch (error) {
      console.error('Error deleting notification:', error);
      
      if (error.message === 'Notification not found or unauthorized') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  },
  
  // Get notification preferences
  getNotificationPreferences: async (req, res) => {
    try {
      const userId = req.user.id;
      const preferences = await notificationService.getUserPreferences(userId);
      
      // Format for frontend display
      const formattedPreferences = Object.keys(NOTIFICATION_TYPES).reduce((acc, type) => {
        const key = NOTIFICATION_TYPES[type];
        acc[key] = {
          type: key,
          displayName: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
          channels: Object.keys(DELIVERY_CHANNELS).reduce((channels, channel) => {
            const channelKey = DELIVERY_CHANNELS[channel];
            channels[channelKey] = (preferences[key] || []).includes(channelKey);
            return channels;
          }, {})
        };
        return acc;
      }, {});
      
      res.json(formattedPreferences);
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      res.status(500).json({ error: 'Failed to get notification preferences' });
    }
  },
  
  // Update notification preferences
  updateNotificationPreferences: async (req, res) => {
    try {
      const userId = req.user.id;
      const { preferences } = req.body;
      
      if (!preferences || typeof preferences !== 'object') {
        return res.status(400).json({ error: 'Invalid preferences format' });
      }
      
      // Convert format from frontend to backend
      const formattedPreferences = {};
      
      Object.keys(preferences).forEach(type => {
        const channelSettings = preferences[type].channels;
        if (channelSettings) {
          formattedPreferences[type] = Object.keys(channelSettings)
            .filter(channel => channelSettings[channel])
            .map(channel => channel);
        }
      });
      
      const updatedPreferences = await notificationService.updateUserPreferences(userId, formattedPreferences);
      
      res.json(updatedPreferences);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      res.status(500).json({ error: 'Failed to update notification preferences' });
    }
  },
  
  // Send a test notification
  sendTestNotification: async (req, res) => {
    try {
      const userId = req.user.id;
      const { type } = req.body;
      
      if (!type || !NOTIFICATION_TYPES[type]) {
        return res.status(400).json({ error: 'Invalid notification type' });
      }
      
      const notification = await notificationService.sendNotification(
        userId,
        NOTIFICATION_TYPES[type],
        {
          testData: 'This is a test notification',
          senderName: 'Test Sender',
          jobTitle: 'Test Job',
          budget: '$100-$200',
          jobLink: '#',
          applicationLink: '#',
          messageLink: '#'
        }
      );
      
      res.json(notification);
    } catch (error) {
      console.error('Error sending test notification:', error);
      res.status(500).json({ error: 'Failed to send test notification' });
    }
  }
};

module.exports = notificationController; 