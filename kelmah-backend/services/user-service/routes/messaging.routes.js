const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const conversationController = require('../controllers/conversation.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');

// Apply authentication middleware to all messaging routes
router.use(authenticate);

// Conversation routes
router.get('/conversations', conversationController.getUserConversations);
router.get('/conversations/:conversationId', conversationController.getConversation);
router.post('/conversations/direct', conversationController.createDirectConversation);
router.post('/conversations/job', conversationController.createJobConversation);
router.post('/conversations/group', conversationController.createGroupConversation);
router.put('/conversations/:conversationId', conversationController.updateConversation);
router.post('/conversations/:conversationId/participants', conversationController.addParticipants);
router.delete('/conversations/:conversationId/participants/:participantId', conversationController.removeParticipant);
router.post('/conversations/:conversationId/archive', conversationController.archiveConversation);
router.post('/conversations/:conversationId/unarchive', conversationController.unarchiveConversation);
router.post('/conversations/:conversationId/mute', conversationController.toggleMute);

// Message routes
router.get('/conversations/:conversationId/messages', messageController.getMessages);
router.post('/conversations/:conversationId/messages', upload.array('attachments', 5), messageController.sendMessage);
router.delete('/messages/:messageId', messageController.deleteMessage);
router.put('/messages/:messageId', messageController.editMessage);
router.post('/conversations/:conversationId/read', messageController.markAsRead);
router.get('/conversations/:conversationId/search', messageController.searchMessages);

module.exports = router; 