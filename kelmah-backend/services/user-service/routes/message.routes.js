const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { upload } = require('../services/fileUpload.service');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get messages for a conversation with pagination
router.get('/conversations/:conversationId/messages', messageController.getMessages);

// Send a message with optional file attachments
router.post('/conversations/:conversationId/messages', 
  upload.array('files', 5), // Allow up to 5 files per message
  messageController.sendMessage
);

// Delete a message
router.delete('/messages/:messageId', messageController.deleteMessage);

// Edit a message
router.put('/messages/:messageId', messageController.editMessage);

// Mark messages as read
router.put('/conversations/:conversationId/read', messageController.markAsRead);

// Search messages in a conversation
router.get('/conversations/:conversationId/search', messageController.searchMessages);

module.exports = router; 