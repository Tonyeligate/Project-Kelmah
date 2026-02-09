const express = require('express');
const router = express.Router();
const ConversationController = require('../controllers/conversation.controller');

// NOTE: Authentication is applied in server.js at mount time

// Search must come before param routes
router.get('/search', ConversationController.searchConversations);

// List and create
router.get('/', ConversationController.getUserConversations);
router.post('/', ConversationController.createConversation);

// Read, update, delete, mark read
router.get('/:id', ConversationController.getConversationById);
router.patch('/:id', ConversationController.updateConversation);
router.delete('/:id', ConversationController.deleteConversation);
router.post('/:id/read', ConversationController.markConversationAsRead);
// Bulk mark read endpoint alias (PUT for idempotence)
router.put('/:id/read', ConversationController.markConversationAsRead);

module.exports = router;
