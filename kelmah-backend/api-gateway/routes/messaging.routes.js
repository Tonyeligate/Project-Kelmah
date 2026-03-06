/**
 * Messaging Service Routes
 * Proxy configuration for messaging-service endpoints
 */

const express = require('express');
const router = express.Router();
const { createServiceProxy } = require('../proxy/serviceProxy');
const { authenticate } = require('../middlewares/auth');
const axios = require('axios');
const crypto = require('crypto');

/**
 * Build gateway-trust headers from req.user (populated by authenticate middleware).
 * The messaging service's verifyGatewayRequest middleware requires these headers.
 * NEVER copy x-authenticated-user from the incoming client request — clients don't set it.
 */
const buildGatewayTrustHeaders = (req) => {
  const headers = {
    'Content-Type': 'application/json',
    'X-Request-ID': req.id || req.headers['x-request-id'] || '',
    'User-Agent': 'kelmah-api-gateway',
  };

  if (req.user) {
    const userPayload = JSON.stringify(req.user);
    headers['x-authenticated-user'] = userPayload;
    headers['x-auth-source'] = 'api-gateway';
    // Generate HMAC signature so verifyGatewayRequest trusts the user payload
    const hmacSecret = process.env.INTERNAL_API_KEY || process.env.JWT_SECRET;
    if (hmacSecret) {
      headers['x-gateway-signature'] = crypto
        .createHmac('sha256', hmacSecret)
        .update(userPayload)
        .digest('hex');
    }
  }

  const internalKey = process.env.INTERNAL_API_KEY;
  if (internalKey) {
    headers['X-Internal-Request'] = internalKey;
  }

  return headers;
};

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
router.post('/conversations', async (req, res) => {
  try {
    const upstream = getServiceUrl(req);
    const url = `${upstream}/api/conversations`;
    // Build trust headers from req.user (set by authenticate middleware at server.js level)
    // NOT from client incoming headers — clients don't send x-authenticated-user
    const headers = buildGatewayTrustHeaders(req);

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
    // Build trust headers from req.user (NOT from client incoming headers)
    const headers = buildGatewayTrustHeaders(req);

    console.log(`[MESSAGING] POST message → ${url}`);
    const r = await axios.post(url, req.body, { headers, timeout: 30000, validateStatus: () => true });
    console.log(`[MESSAGING] POST message response: ${r.status}`);
    res.status(r.status).json(r.data);
  } catch (e) {
    console.error(`[MESSAGING] POST message error:`, e.message);
    res.status(504).json({ success: false, message: 'Messaging service temporarily unavailable' });
  }
});

// Direct message POST fallback (required by frontend REST fallback: POST /api/messages)
const postMessageFallback = async (req, res) => {
  try {
    const upstream = getServiceUrl(req);
    const url = `${upstream}/api/messages`;
    const headers = buildGatewayTrustHeaders(req);

    console.log(`[MESSAGING] POST message(root) → ${url}`);
    const r = await axios.post(url, req.body, {
      headers,
      timeout: 30000,
      validateStatus: () => true,
    });
    console.log(`[MESSAGING] POST message(root) response: ${r.status}`);
    return res.status(r.status).json(r.data);
  } catch (e) {
    console.error('[MESSAGING] POST message(root) error:', e.message);
    return res.status(504).json({
      success: false,
      message: 'Messaging service temporarily unavailable',
    });
  }
};

router.post('/', postMessageFallback);
router.post('/messages', postMessageFallback);

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