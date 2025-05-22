/**
 * Message routes
 */

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const authenticate = require('../middleware/authenticate');

// All routes require authentication
router.use(authenticate);

// Get messages for a conversation
router.get('/conversation/:conversationId', messageController.getMessages);

// Send a message to a conversation
router.post('/conversation/:conversationId', messageController.sendMessage);

// Edit a message
router.put('/:id', messageController.editMessage);

// Delete a message
router.delete('/:id', messageController.deleteMessage);

// Search messages across conversations or in a specific conversation
router.get('/search', messageController.searchMessages);

module.exports = router; 