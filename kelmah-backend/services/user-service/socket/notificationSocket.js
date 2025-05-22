const jwt = require('jsonwebtoken');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const { JWT_SECRET } = require('../config/env');

/**
 * Setup WebSocket handlers for real-time notifications
 * @param {Object} io - Socket.io instance
 */
const setupNotificationSocket = (io) => {
  // Create a namespace for notifications
  const notificationNamespace = io.of('/notifications');

  // Authentication middleware
  notificationNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Check if user exists
      const user = await User.findByPk(decoded.sub);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user to socket
      socket.user = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName
      };
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  notificationNamespace.on('connection', (socket) => {
    console.log(`User connected to notification socket: ${socket.user.id}`);
    
    // Join user's personal notification channel
    socket.on('join:notifications', (userId) => {
      if (userId === socket.user.id) {
        socket.join(`user:${userId}:notifications`);
        console.log(`User ${userId} joined their notification channel`);
        
        // Send unread notification count on join
        sendUnreadCount(socket);
      }
    });
    
    // Leave notification channel
    socket.on('leave:notifications', (userId) => {
      if (userId === socket.user.id) {
        socket.leave(`user:${userId}:notifications`);
        console.log(`User ${userId} left their notification channel`);
      }
    });
    
    // Mark notification as read
    socket.on('mark_read', async (data) => {
      try {
        const { notificationId } = data;
        
        if (!notificationId) {
          socket.emit('error', { message: 'Notification ID is required' });
          return;
        }
        
        const notification = await Notification.findOne({
          where: {
            id: notificationId,
            userId: socket.user.id
          }
        });
        
        if (!notification) {
          socket.emit('error', { message: 'Notification not found' });
          return;
        }
        
        // Update read status
        if (!notification.readAt) {
          await notification.update({ readAt: new Date() });
          
          // Emit notification read status
          socket.emit('notification_read', {
            id: notification.id,
            updateCount: true
          });
          
          // Send updated unread count
          sendUnreadCount(socket);
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
        socket.emit('error', { message: 'Failed to mark notification as read' });
      }
    });
    
    // Mark all notifications as read
    socket.on('mark_all_read', async () => {
      try {
        // Update all unread notifications
        const result = await Notification.update(
          { readAt: new Date() },
          {
            where: {
              userId: socket.user.id,
              readAt: null
            }
          }
        );
        
        // Emit all notifications read status
        socket.emit('all_notifications_read', {
          count: result[0]
        });
        
        // Send updated unread count (should be 0)
        socket.emit('notification_count', 0);
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        socket.emit('error', { message: 'Failed to mark all notifications as read' });
      }
    });
    
    // Disconnect event
    socket.on('disconnect', () => {
      console.log(`User disconnected from notification socket: ${socket.user.id}`);
    });
  });
  
  // Send unread notification count to the user
  async function sendUnreadCount(socket) {
    try {
      const count = await Notification.count({
        where: {
          userId: socket.user.id,
          readAt: null
        }
      });
      
      socket.emit('notification_count', count);
    } catch (error) {
      console.error('Error getting notification count:', error);
    }
  }
  
  // Function to send a notification via WebSocket
  async function sendNotification(userId, notification) {
    try {
      notificationNamespace.to(`user:${userId}:notifications`).emit('notification', notification);
      
      // Also update the count for the user
      const count = await Notification.count({
        where: {
          userId: userId,
          readAt: null
        }
      });
      
      notificationNamespace.to(`user:${userId}:notifications`).emit('notification_count', count);
    } catch (error) {
      console.error('Error sending notification via WebSocket:', error);
    }
  }
  
  // Expose the sendNotification function
  return {
    sendNotification
  };
};

module.exports = setupNotificationSocket; 