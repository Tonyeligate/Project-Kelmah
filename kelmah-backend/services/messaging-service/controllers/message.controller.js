/**
 * Message Controller
 * Handles message-related operations
 */

const { Message, Conversation, Participant, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const encryption = require('../utils/encryption');
const config = require('../config');

/**
 * Get messages for a conversation
 */
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50, before, after } = req.query;
    
    // Check if user is a participant in the conversation
    const participant = await Participant.findOne({
      where: {
        conversationId,
        userId
      }
    });
    
    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }
    
    // Build query options
    const queryOptions = {
      where: { conversationId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    };
    
    // Add pagination conditions based on before/after timestamps
    if (before) {
      queryOptions.where.createdAt = {
        ...queryOptions.where.createdAt,
        [Op.lt]: new Date(before)
      };
    }
    
    if (after) {
      queryOptions.where.createdAt = {
        ...queryOptions.where.createdAt,
        [Op.gt]: new Date(after)
      };
    }
    
    // If no before/after, use offset pagination
    if (!before && !after) {
      const offset = (parseInt(page) - 1) * parseInt(limit);
      queryOptions.offset = offset;
    }
    
    // Get messages
    const messages = await Message.findAll(queryOptions);
    
    // Count total messages for pagination
    const totalCount = await Message.count({
      where: { conversationId }
    });
    
    // Mark messages as read in a separate process (don't await to speed up response)
    this.markMessagesAsRead(conversationId, userId).catch(err => {
      logger.error(`Error marking messages as read: ${err.message}`, { error: err });
    });
    
    return res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error(`Error getting messages: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: 'Failed to get messages',
      error: error.message
    });
  }
};

/**
 * Get a single message by ID
 */
exports.getMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const message = await Message.findByPk(id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Check if user is a participant in the conversation
    const participant = await Participant.findOne({
      where: {
        conversationId: message.conversationId,
        userId
      }
    });
    
    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    logger.error(`Error getting message: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: 'Failed to get message',
      error: error.message
    });
  }
};

/**
 * Send a new message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { 
      content, 
      type = 'text', 
      attachments = [], 
      replyToId = null,
      clientEncrypted = false,  // Flag if the client already encrypted the message
      iv = null               // Initialization vector for client-encrypted messages
    } = req.body;
    
    // Validate required fields
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Message content is required'
      });
    }
    
    // Check if user is participant in conversation
    const participant = await Participant.findOne({
      where: {
        userId,
        conversationId
      }
    });
    
    if (!participant) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You are not a participant in this conversation'
      });
    }
    
    // If replying, check if the message exists in this conversation
    if (replyToId) {
      const replyToMessage = await Message.findOne({
        where: {
          id: replyToId,
          conversationId
        }
      });
      
      if (!replyToMessage) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Reply message not found in this conversation'
        });
      }
    }
    
    // Handle message encryption (server-side)
    let messageContent = content;
    let isEncrypted = clientEncrypted;
    let messageIv = iv;
    let messageHash = null;
    
    // Only encrypt from server-side if not already encrypted by client
    // and server encryption is enabled
    if (!clientEncrypted && config.messages.enableEncryption) {
      // Encrypt the message content
      const encryptedData = encryption.encryptMessage(content);
      messageContent = encryptedData.content;
      isEncrypted = encryptedData.encrypted;
      messageIv = encryptedData.iv;
      
      // Generate hash for message integrity
      messageHash = encryption.hashData(content);
    }
    
    // Create message
    const message = await Message.create({
      id: uuidv4(),
      conversationId,
      senderId: userId,
      content: messageContent,
      type,
      attachments,
      replyToId,
      readAt: { [userId]: new Date().toISOString() }, // Mark as read by sender
      status: 'sent',
      isEncrypted,
      metadata: {
        iv: messageIv,
        hash: messageHash,
        encrypted: isEncrypted
      }
    });
    
    // Update conversation last message timestamp
    await Conversation.update(
      { lastMessageAt: new Date() },
      { where: { id: conversationId } }
    );
    
    // Update typing status (set to false)
    participant.update({ isTyping: false, lastTypingAt: null }).catch(err => {
      logger.error(`Error updating typing status: ${err.message}`);
    });
    
    // Get message with sender info
    const messageFull = await Message.findByPk(message.id, {
      include: [
        {
          model: sequelize.models.User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        },
        {
          model: Message,
          as: 'replyTo',
          include: [
            {
              model: sequelize.models.User,
              as: 'sender',
              attributes: ['id', 'firstName', 'lastName']
            }
          ]
        }
      ]
    });
    
    // Format message for response
    const formattedMessage = {
      id: messageFull.id,
      conversationId: messageFull.conversationId,
      content: messageFull.content,
      type: messageFull.type,
      sender: {
        id: messageFull.sender.id,
        name: `${messageFull.sender.firstName} ${messageFull.sender.lastName}`,
        avatar: messageFull.sender.avatar
      },
      replyTo: messageFull.replyTo ? {
        id: messageFull.replyTo.id,
        content: messageFull.replyTo.content,
        type: messageFull.replyTo.type,
        sender: {
          id: messageFull.replyTo.sender.id,
          name: `${messageFull.replyTo.sender.firstName} ${messageFull.replyTo.sender.lastName}`
        }
      } : null,
      attachments: messageFull.attachments,
      status: messageFull.status,
      isEncrypted: messageFull.isEncrypted,
      metadata: {
        iv: messageIv,
        encrypted: isEncrypted
      },
      readAt: messageFull.readAt,
      createdAt: messageFull.createdAt
    };
    
    return res.status(201).json({
      success: true,
      data: formattedMessage
    });
  } catch (error) {
    logger.error(`Error sending message: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Could not send message'
    });
  }
};

/**
 * Update a message (edit)
 */
exports.updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }
    
    // Check if message exists and belongs to user
    const message = await Message.findByPk(id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Only message sender can edit
    if (message.senderId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages'
      });
    }
    
    // Cannot edit system messages
    if (message.type === 'system') {
      return res.status(400).json({
        success: false,
        message: 'System messages cannot be edited'
      });
    }
    
    // Messages can only be edited within 24 hours
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    if (messageAge > oneDayInMs) {
      return res.status(400).json({
        success: false,
        message: 'Messages can only be edited within 24 hours of sending'
      });
    }
    
    // Update the message
    message.content = content;
    message.isEdited = true;
    await message.save();
    
    // Emit the updated message through Socket.io if available
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${message.conversationId}`).emit('message_updated', message);
    }
    
    return res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    logger.error(`Error updating message: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: 'Failed to update message',
      error: error.message
    });
  }
};

/**
 * Delete a message
 */
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if message exists
    const message = await Message.findByPk(id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Check permissions
    if (message.senderId !== userId) {
      // Check if user is an admin in the conversation
      const participant = await Participant.findOne({
        where: {
          conversationId: message.conversationId,
          userId,
          role: 'admin'
        }
      });
      
      if (!participant) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own messages or messages in groups where you are an admin'
        });
      }
    }
    
    // Soft delete the message
    message.isDeleted = true;
    message.content = 'This message has been deleted';
    await message.save();
    
    // Emit delete event through Socket.io if available
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${message.conversationId}`).emit('message_deleted', {
        id: message.id,
        conversationId: message.conversationId
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    logger.error(`Error deleting message: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message
    });
  }
};

/**
 * Mark messages as read (internal function)
 */
exports.markMessagesAsRead = async (conversationId, userId) => {
  try {
    // Get unread messages sent by others
    const unreadMessages = await Message.findAll({
      where: {
        conversationId,
        senderId: { [Op.ne]: userId },
        [Op.or]: [
          { readAt: null },
          { readAt: { [Op.not]: sequelize.where(sequelize.fn('JSON_EXISTS', sequelize.col('readAt'), `$."${userId}"` )) } }
        ]
      }
    });
    
    // Mark each message as read by this user
    for (const message of unreadMessages) {
      let readAt = message.readAt || {};
      
      // If readAt is stored as string (JSON), parse it
      if (typeof readAt === 'string') {
        try {
          readAt = JSON.parse(readAt);
        } catch (e) {
          readAt = {};
        }
      }
      
      // Add current user to readAt object
      readAt[userId] = new Date().toISOString();
      
      // Update the message
      await message.update({ readAt });
    }
    
    // Emit read status through Socket.io if available
    const io = global.io;
    if (io) {
      io.to(`conversation:${conversationId}`).emit('messages_read', {
        conversationId,
        userId,
        timestamp: new Date().toISOString()
      });
    }
    
    return true;
  } catch (error) {
    logger.error(`Error marking messages as read: ${error.message}`, { error });
    throw error;
  }
};

/**
 * Mark messages as read (API endpoint)
 */
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    // Check if user is a participant in the conversation
    const participant = await Participant.findOne({
      where: {
        conversationId,
        userId
      }
    });
    
    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }
    
    await this.markMessagesAsRead(conversationId, userId);
    
    return res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    logger.error(`Error marking messages as read (API): ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
      error: error.message
    });
  }
};

/**
 * Search messages
 */
exports.searchMessages = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }
    
    // Find conversations where user is a participant
    const participations = await Participant.findAll({
      where: { userId },
      attributes: ['conversationId']
    });
    
    const conversationIds = participations.map(p => p.conversationId);
    
    if (conversationIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No conversations to search in'
      });
    }
    
    // Search for messages within these conversations
    const messages = await Message.findAll({
      where: {
        conversationId: { [Op.in]: conversationIds },
        content: { [Op.like]: `%${query}%` },
        isDeleted: false
      },
      limit: 50,
      order: [['createdAt', 'DESC']],
      include: [{
        model: Conversation,
        as: 'conversation',
        attributes: ['id', 'name', 'type', 'avatar']
      }]
    });
    
    return res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    logger.error(`Error searching messages: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: 'Failed to search messages',
      error: error.message
    });
  }
}; 