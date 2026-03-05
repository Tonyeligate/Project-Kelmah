/**
 * Messaging Service Routes
 * Proxy configuration for messaging-service endpoints
 */

const express = require('express');
const router = express.Router();
const { createServiceProxy } = require('../proxy/serviceProxy');
const { authenticate } = require('../middlewares/auth');
const axios = require('axios');

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
      '^/api/messages/conversations': '/api/conversations',
      '^/api/messaging/conversations': '/api/conversations'
    }
  });
  return proxy(req, res, next);
};

// HIGH-14 FIX: Removed `router.use(authenticate)` — authentication is already\n// applied at the server.js level via `app.use('/api/messages', authenticate, messagingRouter)`.\n// Double-applying it caused redundant token verification.

// Conversation routes (mounted at /api/conversations)
router.get('/conversations', conversationProxy); // List conversations

// Direct axios handler for POST /conversations to bypass proxy body-stream issue
// (Express body-parser consumes the stream → http-proxy pipe hangs → 504).
// This matches the pattern used for auth/login.
router.post('/conversations', async (req, res) => {
  try {
    const upstream = getServiceUrl(req);
    const url = `${upstream}/api/conversations`;

    // Forward gateway-trust headers so the messaging service accepts the request
    const headers = {
      'Content-Type': 'application/json',
      'X-Request-ID': req.id || req.headers['x-request-id'] || '',
      'User-Agent': 'kelmah-api-gateway',
    };
    if (req.headers['x-authenticated-user']) {
      headers['x-authenticated-user'] = req.headers['x-authenticated-user'];
    }
    if (req.headers['x-auth-source']) {
      headers['x-auth-source'] = req.headers['x-auth-source'];
    }
    if (req.headers['x-gateway-signature']) {
      headers['x-gateway-signature'] = req.headers['x-gateway-signature'];
    }
    if (req.headers['authorization']) {
      headers['Authorization'] = req.headers['authorization'];
    }
    const internalKey = process.env.INTERNAL_API_KEY;
    if (internalKey) {
      headers['X-Internal-Request'] = internalKey;
    }

    console.log(`[MESSAGING] POST /conversations → ${url}`);

    const r = await axios.post(url, req.body, {
      headers,
      timeout: 30000,
      validateStatus: () => true,
    });

    console.log(`[MESSAGING] POST /conversations response: ${r.status}`);
    res.status(r.status).json(r.data);
  } catch (e) {
    console.error(`[MESSAGING] POST /conversations error:`, e.message);
    res.status(504).json({
      success: false,
      message: 'Messaging service temporarily unavailable',
    });
  }
});

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
// Post message via REST: direct axios to avoid proxy body-stream hang
router.post('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const upstream = getServiceUrl(req);
    const cid = req.params.conversationId;
    const url = `${upstream}/api/messages/conversation/${cid}`;

    const headers = {
      'Content-Type': 'application/json',
      'X-Request-ID': req.id || req.headers['x-request-id'] || '',
      'User-Agent': 'kelmah-api-gateway',
    };
    if (req.headers['x-authenticated-user']) headers['x-authenticated-user'] = req.headers['x-authenticated-user'];
    if (req.headers['x-auth-source']) headers['x-auth-source'] = req.headers['x-auth-source'];
    if (req.headers['x-gateway-signature']) headers['x-gateway-signature'] = req.headers['x-gateway-signature'];
    if (req.headers['authorization']) headers['Authorization'] = req.headers['authorization'];
    const internalKey = process.env.INTERNAL_API_KEY;
    if (internalKey) headers['X-Internal-Request'] = internalKey;

    console.log(`[MESSAGING] POST message → ${url}`);
    const r = await axios.post(url, req.body, { headers, timeout: 30000, validateStatus: () => true });
    console.log(`[MESSAGING] POST message response: ${r.status}`);
    res.status(r.status).json(r.data);
  } catch (e) {
    console.error(`[MESSAGING] POST message error:`, e.message);
    res.status(504).json({ success: false, message: 'Messaging service temporarily unavailable' });
  }
});
router.get('/messages/:messageId', messagingProxy); // Get specific message
router.put('/messages/:messageId', messagingProxy); // Edit message
router.delete('/messages/:messageId', messagingProxy); // Delete message

// Message status
router.put('/messages/:messageId/read', messagingProxy); // Mark message as read
router.put('/conversations/:conversationId/read', conversationProxy); // Mark all messages as read

// File attachments (aliases)
router.post('/attachments/upload', messagingProxy); // Alias for dev uploads
router.post('/:conversationId/attachments', messagingProxy); // Canonical dev upload path
router.get('/files/:fileId', messagingProxy); // Download attachment

// Message search
router.get('/search', messagingProxy); // Search messages

// Notifications for messaging
router.get('/notifications', messagingProxy); // Get message notifications
router.put('/notifications/:notificationId/read', messagingProxy); // Mark notification as read

// For /api/notifications route (direct notifications endpoint)
router.get('/', messagingProxy); // Handle /api/notifications as root for this router

// Real-time endpoints (handled by WebSocket in server.js)
// These are just for REST fallbacks
router.get('/online-users', messagingProxy); // Get online users
router.post('/typing', messagingProxy); // Send typing indicator

module.exports = router;