const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversation.controller');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Conversation routes
router.get('/', conversationController.getUserConversations);
router.post('/', conversationController.createConversation);
router.get('/:conversationId', conversationController.getConversationDetails);
router.patch('/:conversationId/archive', conversationController.archiveConversation);
router.patch('/:conversationId/metadata', conversationController.updateConversationMetadata);

module.exports = router; 