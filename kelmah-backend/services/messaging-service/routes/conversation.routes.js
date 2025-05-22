/**
 * Conversation routes
 */

const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversation.controller');
const authenticate = require('../middleware/authenticate');

// All routes require authentication
router.use(authenticate);

// Get all conversations for the current user
router.get('/', conversationController.getConversations);

// Get a specific conversation by ID
router.get('/:conversationId', conversationController.getConversationById);

// Create a new conversation
router.post('/', conversationController.createConversation);

// Archive a conversation
router.put('/:conversationId/archive', conversationController.archiveConversation);

// Unarchive a conversation
router.put('/:conversationId/unarchive', conversationController.unarchiveConversation);

// Leave a conversation
router.delete('/:conversationId/leave', conversationController.leaveConversation);

module.exports = router; 