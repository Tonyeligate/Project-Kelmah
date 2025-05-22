/**
 * Notification WebSocket Service
 * Handles real-time notification delivery to connected clients
 */

const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = console;
const Notification = require('../models/notification.model');
const NotificationPreference = require('../models/notification-preference.model');
const { NOTIFICATION_TYPES } = require('../constants');

// Track connected users
const connectedUsers = new Map();

// Mock notification data
const mockNotifications = [
  {
    _id: '1',
    title: 'New message received',
    message: 'You have a new message from Sarah Johnson',
    type: NOTIFICATION_TYPES.MESSAGE,
    read: false,
    recipient: '1234567890',
    createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    data: {
      conversationId: '123456',
      sender: {
        id: '9876543210',
        name: 'Sarah Johnson'
      }
    }
  },
  {
    _id: '2',
    title: 'Job application accepted',
    message: 'Your application for "Bathroom renovation" has been accepted',
    type: NOTIFICATION_TYPES.JOB_UPDATE,
    read: true,
    recipient: '1234567890',
    createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    data: {
      jobId: '789012',
      jobTitle: 'Bathroom renovation'
    }
  },
  {
    _id: '3',
    title: 'Payment received',
    message: 'You received a payment of $150.00 from Michael Davis',
    type: NOTIFICATION_TYPES.PAYMENT,
    read: false,
    recipient: '1234567890',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    data: {
      amount: 150.00,
      currency: 'USD',
      paymentId: '345678',
      sender: {
        id: '5432167890',
        name: 'Michael Davis'
      }
    }
  },
  {
    _id: '4',
    title: 'New contract received',
    message: 'You have received a new contract for "Home renovation"',
    type: NOTIFICATION_TYPES.CONTRACT,
    read: false,
    recipient: '1234567890',
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    data: {
      contractId: '654321',
      contractNumber: 'K-21-08-0001',
      jobId: '987654',
      jobTitle: 'Home renovation'
    }
  }
];

// Mock user preferences
const mockPreferences = {
  '1234567890': {
    channels: {
      IN_APP: true,
      EMAIL: true,
      SMS: false,
      PUSH: true
    },
    types: {
      [NOTIFICATION_TYPES.MESSAGE]: true,
      [NOTIFICATION_TYPES.JOB_UPDATE]: true,
      [NOTIFICATION_TYPES.PAYMENT]: true,
      [NOTIFICATION_TYPES.REVIEW]: true,
      [NOTIFICATION_TYPES.PROPOSAL]: true,
      [NOTIFICATION_TYPES.CONTRACT]: true,
      [NOTIFICATION_TYPES.SYSTEM]: true
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  }
};

// Global reference to the socket.io instance
let socketIO = null;

/**
 * Initialize the notification socket service
 * @param {Object} server - HTTP server instance
 */
const initialize = (server) => {
  const io = socketIo(server, {
    path: '/socket.io',
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Store reference
  socketIO = io;

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }
      
      try {
        // Verify JWT token using the secret from environment
        const decoded = jwt.verify(
          token, 
          process.env.JWT_SECRET || 'your-default-secret-key'
        );
        
        // Attach user data to socket
        socket.user = {
          id: decoded.sub || decoded.id,
          role: decoded.role
        };
        
        next();
      } catch (error) {
        logger.error(`Socket authentication error: ${error.message}`);
        next(new Error('Invalid authentication token'));
      }
    } catch (error) {
      logger.error(`Socket middleware error: ${error.message}`);
      next(new Error('Internal server error'));
    }
  });

  // Connection handling
  io.on('connection', (socket) => {
    const userId = socket.user.id;
    logger.info(`User connected to notification socket: ${userId}`);
    
    // Add to connected users
    connectedUsers.set(userId, {
      socketId: socket.id,
      userId,
      connectedAt: new Date()
    });
    
    // Join user's personal notification room
    socket.join(`user:${userId}`);
    
    // Listen for notification:join event
    socket.on('join:notifications', (data) => {
      if (data === userId || socket.user.role === 'admin') {
        socket.join(`notifications:${data}`);
        logger.info(`User ${userId} joined notification room: ${data}`);
      } else {
        logger.warn(`User ${userId} attempted to join unauthorized notification room: ${data}`);
      }
    });
    
    // Listen for notification:leave event
    socket.on('leave:notifications', (data) => {
      socket.leave(`notifications:${data}`);
      logger.info(`User ${userId} left notification room: ${data}`);
    });
    
    // Listen for mark_read event
    socket.on('mark_read', async (data) => {
      try {
        if (!data || !data.notificationId) {
          return;
        }
        
        logger.info(`User ${userId} marked notification ${data.notificationId} as read`);
        
        // Update mock data
        const notification = mockNotifications.find(n => n._id === data.notificationId && n.recipient === userId);
        if (notification) {
          notification.read = true;
          notification.readAt = new Date();
        }
        
        // Emit to all user's devices
        io.to(`notifications:${userId}`).emit('notification_read', {
          notificationId: data.notificationId,
          readAt: new Date().toISOString()
        });
        
        // Update unread count
        const unreadCount = mockNotifications.filter(n => n.recipient === userId && !n.read).length;
        io.to(`notifications:${userId}`).emit('notification_count', unreadCount);
        
      } catch (error) {
        logger.error(`Error marking notification as read: ${error.message}`);
      }
    });
    
    // Listen for mark_all_read event
    socket.on('mark_all_read', async () => {
      try {
        logger.info(`User ${userId} marked all notifications as read`);
        
        // Update mock data
        mockNotifications.forEach(n => {
          if (n.recipient === userId && !n.read) {
            n.read = true;
            n.readAt = new Date();
          }
        });
        
        // Emit event to user's devices
        io.to(`notifications:${userId}`).emit('all_notifications_read');
        
        // Emit updated count (0)
        io.to(`notifications:${userId}`).emit('notification_count', 0);
      } catch (error) {
        logger.error(`Error marking all notifications as read: ${error.message}`);
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`User disconnected from notification socket: ${userId}`);
      connectedUsers.delete(userId);
    });
  });
  
  logger.info('Notification WebSocket service initialized');
  
  return io;
};

/**
 * Send a notification to a user via WebSocket
 * @param {string} userId - Recipient user ID
 * @param {Object} notification - Notification object
 */
const sendNotification = async (userId, notification) => {
  try {
    if (!socketIO) {
      logger.error('Socket.io instance not available');
      return false;
    }
    
    // Check mock preferences
    const preferences = mockPreferences[userId] || {
      channels: { IN_APP: true },
      types: { [notification.type]: true }
    };
    
    // Check if in-app notifications are disabled
    if (preferences.channels && preferences.channels.IN_APP === false) {
      return false;
    }
    
    // Check if this notification type is disabled
    if (preferences.types && notification.type && preferences.types[notification.type] === false) {
      return false;
    }
    
    // Save to mock data
    const newNotification = {
      _id: Date.now().toString(),
      title: notification.title || 'New notification',
      message: notification.message || 'You have a new notification',
      type: notification.type || NOTIFICATION_TYPES.SYSTEM,
      read: false,
      recipient: userId,
      createdAt: new Date(),
      data: notification.data || {}
    };
    
    mockNotifications.push(newNotification);
    
    // Emit to user's room
    socketIO.to(`notifications:${userId}`).emit('notification', newNotification);
    
    // Update unread count
    const unreadCount = mockNotifications.filter(n => n.recipient === userId && !n.read).length;
    socketIO.to(`notifications:${userId}`).emit('notification_count', unreadCount);
    
    return true;
  } catch (error) {
    logger.error(`Error sending notification via socket: ${error.message}`);
    return false;
  }
};

/**
 * Notify user with a specific event
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
function notifyUser(userId, event, data) {
  if (!userId) return;
  
  try {
    // Emit to user's room
    socketIO.to(`notifications:${userId}`).emit(event, data);
  } catch (error) {
    logger.error(`Error emitting ${event} event: ${error.message}`);
  }
}

/**
 * Send unread notification count to user
 * @param {string} userId - User ID
 */
async function sendUnreadCount(userId) {
  try {
    // Count unread notifications
    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });
    
    // Emit count to user
    notifyUser(userId, 'notification_count', count);
  } catch (error) {
    logger.error(`Error sending unread count: ${error.message}`);
  }
}

/**
 * Send a contract notification to users
 * 
 * @param {string} contractId - Contract ID
 * @param {string} event - Event type (created, updated, signed, etc.)
 * @param {Object} contractData - Contract data
 */
const sendContractNotification = async (contractId, event, contractData) => {
  try {
    if (!socketIO) {
      logger.warn('Cannot send contract notification: Socket.io not initialized');
      return;
    }
    
    // Determine recipients
    const recipients = [];
    if (contractData.hirerId) {
      recipients.push(contractData.hirerId);
    }
    if (contractData.workerId) {
      recipients.push(contractData.workerId);
    }
    
    // Prepare notification data based on event type
    let notificationData = {};
    
    switch (event) {
      case 'created':
        notificationData = {
          title: 'New Contract Created',
          message: `A new contract has been created for "${contractData.jobTitle || 'a job'}"`,
          type: NOTIFICATION_TYPES.CONTRACT,
          data: {
            contractId,
            contractNumber: contractData.contractNumber,
            jobId: contractData.jobId,
            jobTitle: contractData.jobTitle || 'Job'
          }
        };
        break;
        
      case 'updated':
        notificationData = {
          title: 'Contract Updated',
          message: `Contract ${contractData.contractNumber} has been updated`,
          type: NOTIFICATION_TYPES.CONTRACT,
          data: {
            contractId,
            contractNumber: contractData.contractNumber,
            jobId: contractData.jobId,
            jobTitle: contractData.jobTitle || 'Job'
          }
        };
        break;
        
      case 'signature_requested':
        notificationData = {
          title: 'Contract Signature Requested',
          message: `Your signature is requested for contract ${contractData.contractNumber}`,
          type: NOTIFICATION_TYPES.CONTRACT,
          data: {
            contractId,
            contractNumber: contractData.contractNumber,
            jobId: contractData.jobId,
            jobTitle: contractData.jobTitle || 'Job',
            action: 'sign'
          }
        };
        break;
        
      case 'signed':
        notificationData = {
          title: 'Contract Signed',
          message: `Contract ${contractData.contractNumber} has been signed by ${contractData.signerName}`,
          type: NOTIFICATION_TYPES.CONTRACT,
          data: {
            contractId,
            contractNumber: contractData.contractNumber,
            jobId: contractData.jobId,
            jobTitle: contractData.jobTitle || 'Job',
            signerName: contractData.signerName,
            signerRole: contractData.signerRole
          }
        };
        break;
        
      case 'activated':
        notificationData = {
          title: 'Contract Activated',
          message: `Contract ${contractData.contractNumber} is now active`,
          type: NOTIFICATION_TYPES.CONTRACT,
          data: {
            contractId,
            contractNumber: contractData.contractNumber,
            jobId: contractData.jobId,
            jobTitle: contractData.jobTitle || 'Job'
          }
        };
        break;
        
      case 'milestone_completed':
        notificationData = {
          title: 'Milestone Completed',
          message: `A milestone has been completed for contract ${contractData.contractNumber}`,
          type: NOTIFICATION_TYPES.CONTRACT,
          data: {
            contractId,
            contractNumber: contractData.contractNumber,
            jobId: contractData.jobId,
            jobTitle: contractData.jobTitle || 'Job',
            milestoneId: contractData.milestoneId,
            milestoneTitle: contractData.milestoneTitle,
            completedBy: contractData.completedBy
          }
        };
        break;
        
      case 'completed':
        notificationData = {
          title: 'Contract Completed',
          message: `Contract ${contractData.contractNumber} has been completed`,
          type: NOTIFICATION_TYPES.CONTRACT,
          data: {
            contractId,
            contractNumber: contractData.contractNumber,
            jobId: contractData.jobId,
            jobTitle: contractData.jobTitle || 'Job'
          }
        };
        break;
        
      case 'cancelled':
        notificationData = {
          title: 'Contract Cancelled',
          message: `Contract ${contractData.contractNumber} has been cancelled`,
          type: NOTIFICATION_TYPES.CONTRACT,
          data: {
            contractId,
            contractNumber: contractData.contractNumber,
            jobId: contractData.jobId,
            jobTitle: contractData.jobTitle || 'Job',
            cancelledBy: contractData.cancelledBy,
            reason: contractData.reason
          }
        };
        break;
        
      default:
        notificationData = {
          title: 'Contract Update',
          message: `Contract ${contractData.contractNumber} has been updated`,
          type: NOTIFICATION_TYPES.CONTRACT,
          data: {
            contractId,
            contractNumber: contractData.contractNumber,
            jobId: contractData.jobId,
            jobTitle: contractData.jobTitle || 'Job'
          }
        };
    }
    
    // Send notification to each recipient
    for (const userId of recipients) {
      // Create notification in database
      const notification = {
        ...notificationData,
        recipient: userId,
        read: false,
        createdAt: new Date()
      };
      
      // Mock store notification
      mockNotifications.push({
        _id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...notification
      });
      
      // Emit notification
      socketIO.to(`notifications:${userId}`).emit('notification', notification);
      
      // Update unread count
      const unreadCount = mockNotifications.filter(n => n.recipient === userId && !n.read).length;
      socketIO.to(`notifications:${userId}`).emit('notification_count', unreadCount);
    }
    
    logger.info(`Contract notification sent: ${event} for contract ${contractId} to ${recipients.length} recipients`);
  } catch (error) {
    logger.error(`Error sending contract notification: ${error.message}`);
  }
};

module.exports = {
  initialize,
  sendNotification,
  connectedUsers,
  sendContractNotification
};