/**
 * Attachment routes
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const attachmentController = require('../controllers/attachment.controller');
const authenticate = require('../middleware/authenticate');
const config = require('../config');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: config.messages.maxAttachmentSize
  }
});

// All routes require authentication
router.use(authenticate);

// Upload a file attachment for a conversation
router.post('/conversation/:conversationId', upload.single('file'), attachmentController.uploadAttachment);

// Get attachment by filename
router.get('/:fileName', attachmentController.getAttachment);

// Get attachment thumbnail
router.get('/:fileName/thumbnail', attachmentController.getAttachmentThumbnail);

module.exports = router; 