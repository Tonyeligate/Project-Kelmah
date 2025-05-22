/**
 * Notification routes
 */

const express = require('express');
const router = express.Router();

// Mock authentication middleware for testing
const authMiddleware = (req, res, next) => {
  // For testing purposes, we'll create a mock user
  req.user = {
    id: '1234567890',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user'
  };
  next();
};

// Apply auth middleware to all routes
router.use(authMiddleware);

// Mock data for notifications
const mockNotifications = [
  {
    id: '1',
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
    id: '2',
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
    id: '3',
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

// Get all notifications
router.get('/', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user.id;
  
  // Filter notifications for this user
  const userNotifications = mockNotifications.filter(n => n.recipient === userId);
  
  // Calculate unread count
  const unreadCount = userNotifications.filter(n => !n.isRead).length;
  
  return res.status(200).json({
    success: true,
    data: {
      notifications: userNotifications,
      unreadCount,
      pagination: {
        total: userNotifications.length,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(userNotifications.length / parseInt(limit))
      }
    }
  });
});

// Get notification by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  // Find notification
  const notification = mockNotifications.find(n => n.id === id && n.recipient === userId);
  
  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }
  
  return res.status(200).json({
    success: true,
    data: notification
  });
});

// Mark notification as read
router.patch('/:id/read', (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  // Find notification
  const notification = mockNotifications.find(n => n.id === id && n.recipient === userId);
  
  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }
  
  // Mark as read
  notification.isRead = true;
  notification.readAt = new Date().toISOString();
  
  return res.status(200).json({
    success: true,
    data: notification
  });
});

// Get unread count
router.get('/unread-count', (req, res) => {
  const userId = req.user.id;
  
  // Count unread notifications
  const unreadCount = mockNotifications.filter(n => n.recipient === userId && !n.isRead).length;
  
  return res.status(200).json({
    success: true,
    data: {
      count: unreadCount
    }
  });
});

// Mark all as read
router.patch('/mark-all-read', (req, res) => {
  const userId = req.user.id;
  
  // Mark all user's notifications as read
  mockNotifications.forEach(n => {
    if (n.recipient === userId && !n.isRead) {
      n.isRead = true;
      n.readAt = new Date().toISOString();
    }
  });
  
  return res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// Get notification preferences
router.get('/preferences', (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
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
    }
  });
});

// Update notification preferences
router.put('/preferences', (req, res) => {
  // In a real implementation, we would update the user's preferences
  return res.status(200).json({
    success: true,
    message: 'Preferences updated successfully',
    data: req.body
  });
});

module.exports = router; 