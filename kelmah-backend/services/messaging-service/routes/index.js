/**
 * Main routes file for messaging service
 */

const express = require('express');
const router = express.Router();
const conversationRoutes = require('./conversation.routes');
const messageRoutes = require('./message.routes');
const participantRoutes = require('./participant.routes');
const attachmentRoutes = require('./attachment.routes');

// Register routes
router.use('/conversations', conversationRoutes);
router.use('/messages', messageRoutes);
router.use('/participants', participantRoutes);
router.use('/attachments', attachmentRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Messaging service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 