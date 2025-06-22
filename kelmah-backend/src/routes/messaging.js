const express = require('express');
const { validate } = require('../middlewares/validator');
const { authenticateUser } = require('../middlewares/auth');
const messagingController = require('../controllers/messaging.controller');
const messageValidation = require('../validations/message.validation');

const router = express.Router();

// All messaging routes are protected
router.use(authenticateUser);

// Conversation list and creation
router.get(
  '/conversations',
  messagingController.getConversations
);

router.post(
  '/conversations',
  validate(messageValidation.createConversation),
  messagingController.createConversation
);

// Conversation details (no messages)
router.get(
  '/conversations/:id',
  messagingController.getConversationById
);

// Messages within a conversation
router.get(
  '/conversations/:id/messages',
  messagingController.getMessages
);

router.post(
  '/conversations/:id/messages',
  validate(messageValidation.sendMessage),
  messagingController.sendMessage
);

router.put(
  '/conversations/:id/read',
  messagingController.markRead
);

// Delete message
router.delete(
  '/messages/:id',
  messagingController.deleteMessage
);

// Stats
router.get(
  '/stats',
  messagingController.getStats
);

// Delete a conversation
router.delete(
  '/conversations/:id',
  messagingController.deleteConversation
);

// Unread conversations count
router.get(
  '/unread',
  messagingController.getUnreadCount
);

module.exports = router; 