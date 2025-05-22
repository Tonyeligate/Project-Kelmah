/**
 * Attachment Controller
 * Handles file uploads for message attachments
 */

const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config');
const logger = require('../utils/logger');
const imageProcessor = require('../utils/imageProcessor');
const { Conversation, Participant } = require('../models');

// Storage configuration
const uploadDir = path.join(__dirname, '../uploads');

/**
 * Ensure upload directory exists
 */
const initializeStorage = async () => {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    logger.info('Upload directory initialized');
  } catch (error) {
    logger.error(`Failed to initialize upload directory: ${error.message}`);
    throw error;
  }
};

// Initialize storage on startup
initializeStorage().catch(err => {
  logger.error('Fatal error initializing storage', err);
  process.exit(1);
});

/**
 * Upload a file to be used as a message attachment
 */
exports.uploadAttachment = async (req, res) => {
  try {
    // Check if user is participant in the conversation
    const { conversationId } = req.params;
    const userId = req.user.id;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required'
      });
    }

    // Check if user is a participant in the conversation
    const participant = await Participant.findOne({
      where: {
        userId,
        conversationId
      }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    // Check if file exists in the request
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const file = req.file;

    // Check file size
    if (file.size > config.messages.maxAttachmentSize) {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${config.messages.maxAttachmentSize / (1024 * 1024)}MB`
      });
    }

    // Check file type
    if (!config.messages.allowedAttachmentTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported file type. Allowed types: ${config.messages.allowedAttachmentTypes.join(', ')}`
      });
    }

    // Create unique filename
    const fileId = uuidv4();
    const fileExtension = path.extname(file.originalname);
    const fileName = `${fileId}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Save file to disk
    await fs.writeFile(filePath, file.buffer);
    
    // Get file type category
    let fileType = 'file';
    if (file.mimetype.startsWith('image/')) {
      fileType = 'image';
      
      // Process image (generate thumbnails, etc.)
      // Do this asynchronously without waiting to speed up response
      imageProcessor.processImage(fileName, uploadDir)
        .catch(err => logger.error(`Error processing image: ${err.message}`));
    } else if (file.mimetype.startsWith('audio/')) {
      fileType = 'audio';
    } else if (file.mimetype.startsWith('video/')) {
      fileType = 'video';
    }
    
    // Create attachment metadata
    const attachment = {
      id: fileId,
      name: file.originalname,
      type: fileType,
      mimetype: file.mimetype,
      size: file.size,
      url: `/api/messaging/attachments/${fileName}`,
      thumbnailUrl: fileType === 'image' ? `/api/messaging/attachments/${fileName}/thumbnail` : null,
      uploadedAt: new Date().toISOString()
    };
    
    return res.status(201).json({
      success: true,
      data: attachment
    });
  } catch (error) {
    logger.error(`Error uploading attachment: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload attachment',
      error: error.message
    });
  }
};

/**
 * Get an attachment by ID (filename)
 */
exports.getAttachment = async (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(uploadDir, fileName);
    
    try {
      // Check if file exists
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }
    
    // Determine mime type from file extension
    const mimetype = getMimetypeFromFilename(fileName);
    
    // Set content-type header
    res.setHeader('Content-Type', mimetype || 'application/octet-stream');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    logger.error(`Error getting attachment: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to get attachment',
      error: error.message
    });
  }
};

/**
 * Get attachment thumbnail
 */
exports.getAttachmentThumbnail = async (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(uploadDir, `thumb_${fileName}`);
    const originalPath = path.join(uploadDir, fileName);
    
    try {
      // Check if thumbnail exists
      await fs.access(filePath);
      
      // Determine mime type from file extension
      const mimetype = getMimetypeFromFilename(fileName);
      
      // Set content-type header
      res.setHeader('Content-Type', mimetype || 'application/octet-stream');
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      // If thumbnail doesn't exist, try generating it on-demand
      try {
        await fs.access(originalPath);
        
        // Check if it's an image
        const mimetype = getMimetypeFromFilename(fileName);
        if (mimetype && mimetype.startsWith('image/')) {
          // Try to generate the thumbnail now
          const success = await imageProcessor.generateThumbnail(originalPath, filePath);
          
          if (success) {
            // Send the newly generated thumbnail
            res.setHeader('Content-Type', mimetype);
            const fileStream = fs.createReadStream(filePath);
            return fileStream.pipe(res);
          }
        }
        
        // If not an image or thumbnail generation failed, return the original
        res.setHeader('Content-Type', mimetype || 'application/octet-stream');
        const fileStream = fs.createReadStream(originalPath);
        return fileStream.pipe(res);
      } catch (innerError) {
        return res.status(404).json({
          success: false,
          message: 'Attachment not found'
        });
      }
    }
  } catch (error) {
    logger.error(`Error getting attachment thumbnail: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to get attachment thumbnail',
      error: error.message
    });
  }
};

/**
 * Get mimetype from filename
 * @param {string} filename - File name
 * @returns {string|null} - Mimetype or null if unknown
 */
function getMimetypeFromFilename(filename) {
  const extension = path.extname(filename).toLowerCase();
  
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm'
  };
  
  return mimeTypes[extension] || null;
} 