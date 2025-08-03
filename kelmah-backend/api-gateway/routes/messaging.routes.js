/**
 * Messaging Service Routes
 * Proxy configuration for messaging-service endpoints
 */

const express = require('express');
const router = express.Router();
const { createServiceProxy } = require('../proxy/serviceProxy');
const authenticate = require('../middlewares/auth.middleware');

// Get service URLs from app context
const getServiceUrl = (req) => req.app.get('serviceUrls').MESSAGING_SERVICE;

// Messaging proxy middleware
const messagingProxy = (req, res, next) => {
  const proxy = createServiceProxy({
    target: getServiceUrl(req),
    pathPrefix: '/api/messages',
    requireAuth: true
  });
  return proxy(req, res, next);
};

// Conversation proxy middleware
const conversationProxy = (req, res, next) => {
  const proxy = createServiceProxy({
    target: getServiceUrl(req),
    pathPrefix: '/api/conversations',
    requireAuth: true
  });
  return proxy(req, res, next);
};

// All messaging routes require authentication
router.use(authenticate);

// Conversation routes
router.get('/conversations', conversationProxy); // Get user's conversations
router.post('/conversations', conversationProxy); // Create new conversation
router.get('/conversations/:conversationId', conversationProxy); // Get specific conversation
router.put('/conversations/:conversationId', conversationProxy); // Update conversation
router.delete('/conversations/:conversationId', conversationProxy); // Delete conversation

// Conversation participants
router.post('/conversations/:conversationId/participants', conversationProxy); // Add participant
router.delete('/conversations/:conversationId/participants/:userId', conversationProxy); // Remove participant

// Message routes
router.get('/conversations/:conversationId/messages', messagingProxy); // Get conversation messages
router.post('/conversations/:conversationId/messages', messagingProxy); // Send message
router.get('/messages/:messageId', messagingProxy); // Get specific message
router.put('/messages/:messageId', messagingProxy); // Edit message
router.delete('/messages/:messageId', messagingProxy); // Delete message

// Message status
router.put('/messages/:messageId/read', messagingProxy); // Mark message as read
router.put('/conversations/:conversationId/read', messagingProxy); // Mark all messages as read

// File attachments
router.post('/messages/upload', messagingProxy); // Upload message attachment
router.get('/messages/files/:fileId', messagingProxy); // Download attachment

// Message search
router.get('/search', messagingProxy); // Search messages

// Notifications for messaging
router.get('/notifications', messagingProxy); // Get message notifications
router.put('/notifications/:notificationId/read', messagingProxy); // Mark notification as read

// Real-time endpoints (handled by WebSocket in server.js)
// These are just for REST fallbacks
router.get('/online-users', messagingProxy); // Get online users
router.post('/typing', messagingProxy); // Send typing indicator

module.exports = router;