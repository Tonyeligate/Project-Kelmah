/**
 * Messaging Service Routes
 * Proxy configuration for messaging-service endpoints
 */

const express = require('express');
const router = express.Router();
const { createServiceProxy } = require('../proxy/serviceProxy');
const { authenticate } = require('../middleware/auth');

// Get service URLs from app context
const getServiceUrl = (req) => req.app.get('serviceUrls').MESSAGING_SERVICE;

// Messaging proxy middleware
// Forward /api/messages/* → messaging-service /api/messages/* (no duplication)
const messagingProxy = (req, res, next) => {
  const proxy = createServiceProxy({
    target: getServiceUrl(req),
    requireAuth: true,
  });
  return proxy(req, res, next);
};

// Conversation proxy middleware
// Map gateway /api/messages/conversations[/...] → service /api/conversations[/...]
const conversationProxy = (req, res, next) => {
  const proxy = createServiceProxy({
    target: getServiceUrl(req),
    requireAuth: true,
    pathRewrite: {
      '^/api/messages/conversations$': '/api/conversations',
      '^/api/messages/conversations/': '/api/conversations/'
    }
  });
  return proxy(req, res, next);
};

// All messaging routes require authentication
router.use(authenticate);

// Conversation routes (mounted at /api/conversations)
router.get('/conversations', conversationProxy); // List conversations
router.post('/conversations', conversationProxy); // Create conversation
router.get('/conversations/:conversationId', conversationProxy); // Get specific conversation
router.put('/conversations/:conversationId', conversationProxy); // Update conversation
router.delete('/conversations/:conversationId', conversationProxy); // Delete conversation

// Conversation participants
router.post('/conversations/:conversationId/participants', conversationProxy); // Add participant
router.delete('/conversations/:conversationId/participants/:userId', conversationProxy); // Remove participant

// Message routes: map FE path to service path /api/messages/conversation/:id
router.get('/conversations/:conversationId/messages', (req, res, next) => {
  const proxy = createServiceProxy({
    target: getServiceUrl(req),
    pathPrefix: '/api/messages',
    requireAuth: true,
    pathRewrite: {
      '^/api/messages/conversations/([^/]+)/messages': '/api/messages/conversation/$1',
    },
  });
  return proxy(req, res, next);
});
router.post('/conversations/:conversationId/messages', (req, res, next) => {
  const proxy = createServiceProxy({
    target: getServiceUrl(req),
    pathPrefix: '/api/messages',
    requireAuth: true,
    pathRewrite: {
      '^/api/messages/conversations/([^/]+)/messages': '/api/messages/conversation/$1',
    },
  });
  return proxy(req, res, next);
});
router.get('/messages/:messageId', messagingProxy); // Get specific message
router.put('/messages/:messageId', messagingProxy); // Edit message
router.delete('/messages/:messageId', messagingProxy); // Delete message

// Message status
router.put('/messages/:messageId/read', messagingProxy); // Mark message as read
router.put('/conversations/:conversationId/read', messagingProxy); // Mark all messages as read

// File attachments (aliases)
router.post('/attachments/upload', messagingProxy); // Alias for dev uploads
router.post('/:conversationId/attachments', messagingProxy); // Canonical dev upload path
router.get('/files/:fileId', messagingProxy); // Download attachment

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