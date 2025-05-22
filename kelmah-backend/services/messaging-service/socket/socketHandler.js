/**
 * Socket.io Handler
 * Manages real-time messaging functionality
 */

const jwt = require('jsonwebtoken');
const { sequelize, Message, Conversation, Participant } = require('../models');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const encryption = require('../utils/encryption');
const config = require('../config');

// Store active user connections
const connectedUsers = new Map();

/**
 * Initialize Socket.io handler
 * @param {Object} io - Socket.io instance
 */
exports.initialize = (io) => {
  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await sequelize.models.User.findByPk(decoded.id);
      
      if (!user) {
        return next(new Error('User not found'));
      }
      
      // Check if user is active
      if (user.status !== 'active') {
        return next(new Error('Account is not active'));
      }
      
      // Attach user to socket
      socket.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      };
      
      next();
    } catch (error) {
      logger.error(`Socket authentication error: ${error.message}`);
      next(new Error('Authentication failed'));
    }
  });
  
  // Handle new connections
  io.on('connection', (socket) => {
    const userId = socket.user.id;
    logger.info(`User connected: ${userId}`);
    
    // Add user to connected users map
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId).add(socket.id);
    
    // Update user's online status
    updateUserStatus(userId, 'online');
    
    // Join user to their conversation rooms
    joinUserRooms(socket);
    
    // Handle joining a specific conversation
    socket.on('join_conversation', (conversationId) => {
      joinConversation(socket, conversationId);
    });
    
    // Handle leaving a specific conversation
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      logger.info(`User ${userId} left conversation ${conversationId}`);
    });
    
    // Handle new message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, type = 'text', attachments = [], replyToId = null, clientEncrypted = false, iv = null } = data;
        
        // Create the message
        const message = await createMessage(
          socket.user.id, 
          conversationId, 
          content, 
          type, 
          attachments, 
          replyToId,
          clientEncrypted,
          iv
        );
        
        // Broadcast to all users in the conversation
        io.to(`conversation:${conversationId}`).emit('new_message', message);
        
        // Send notifications to offline users
        sendMessageNotifications(message, socket.user.id);
      } catch (error) {
        logger.error(`Error sending message: ${error.message}`);
        socket.emit('error', { message: 'Failed to send message', error: error.message });
      }
    });
    
    // Handle typing status
    socket.on('typing', async ({ conversationId, isTyping }) => {
      try {
        // Update user's typing status
        await updateTypingStatus(socket.user.id, conversationId, isTyping);
        
        // Broadcast typing status to others in the conversation
        socket.to(`conversation:${conversationId}`).emit('user_typing', {
          userId: socket.user.id,
          conversationId,
          isTyping,
          userName: `${socket.user.firstName} ${socket.user.lastName}`
        });
      } catch (error) {
        logger.error(`Error updating typing status: ${error.message}`);
      }
    });
    
    // Handle read receipts
    socket.on('mark_read', async ({ conversationId, messageIds }) => {
      try {
        await markMessagesAsRead(socket.user.id, conversationId, messageIds);
        
        // Broadcast read status to others in the conversation
        socket.to(`conversation:${conversationId}`).emit('messages_read', {
          userId: socket.user.id,
          conversationId,
          messageIds,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(`Error marking messages as read: ${error.message}`);
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${userId}`);
      
      // Remove socket from connected users
      if (connectedUsers.has(userId)) {
        connectedUsers.get(userId).delete(socket.id);
        
        // If no more sockets for this user, remove from map and update status
        if (connectedUsers.get(userId).size === 0) {
          connectedUsers.delete(userId);
          updateUserStatus(userId, 'offline');
        }
      }
    });
  });
};

/**
 * Join user to all their conversation rooms
 * @param {Object} socket - Socket.io socket
 */
async function joinUserRooms(socket) {
  try {
    const userId = socket.user.id;
    
    // Get all conversations where user is a participant
    const participants = await Participant.findAll({
      where: { userId },
      attributes: ['conversationId']
    });
    
    // Join each conversation room
    for (const participant of participants) {
      socket.join(`conversation:${participant.conversationId}`);
    }
    
    logger.info(`User ${userId} joined ${participants.length} conversation rooms`);
  } catch (error) {
    logger.error(`Error joining user rooms: ${error.message}`);
  }
}

/**
 * Join a specific conversation
 * @param {Object} socket - Socket.io socket
 * @param {string} conversationId - Conversation ID
 */
async function joinConversation(socket, conversationId) {
  try {
    const userId = socket.user.id;
    
    // Check if user is a participant
    const participant = await Participant.findOne({
      where: {
        userId,
        conversationId
      }
    });
    
    if (!participant) {
      socket.emit('error', {
        message: 'You are not a participant in this conversation'
      });
      return;
    }
    
    // Join the conversation room
    socket.join(`conversation:${conversationId}`);
    
    // Update last activity timestamp
    participant.update({ lastActiveAt: new Date() }).catch(err => {
      logger.error(`Error updating last activity: ${err.message}`);
    });
    
    logger.info(`User ${userId} joined conversation ${conversationId}`);
    
    // Notify others in the conversation that user is active
    socket.to(`conversation:${conversationId}`).emit('user_joined', {
      userId,
      conversationId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error joining conversation: ${error.message}`);
    socket.emit('error', { message: 'Failed to join conversation', error: error.message });
  }
}

/**
 * Create a new message
 * @param {string} userId - User ID
 * @param {string} conversationId - Conversation ID
 * @param {string} content - Message content
 * @param {string} type - Message type
 * @param {Array} attachments - Message attachments
 * @param {string} replyToId - ID of message being replied to
 * @param {boolean} clientEncrypted - Whether the message is already encrypted by the client
 * @param {string} iv - Initialization vector for client-encrypted messages
 * @returns {Object} Formatted message
 */
async function createMessage(userId, conversationId, content, type, attachments, replyToId, clientEncrypted = false, iv = null) {
  const transaction = await sequelize.transaction();
  
  try {
    // Check if user is a participant in the conversation
    const participant = await Participant.findOne({
      where: {
        userId,
        conversationId
      },
      transaction
    });
    
    if (!participant) {
      await transaction.rollback();
      throw new Error('User is not a participant in this conversation');
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
    
    // Create the message
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
    }, { transaction });
    
    // Update conversation's last message timestamp
    await Conversation.update(
      { lastMessageAt: new Date() },
      { 
        where: { id: conversationId },
        transaction
      }
    );
    
    // Reset typing status
    await Participant.update(
      { isTyping: false, lastTypingAt: null },
      { 
        where: { userId, conversationId },
        transaction
      }
    );
    
    await transaction.commit();
    
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
    return {
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
  } catch (error) {
    await transaction.rollback();
    logger.error(`Error creating message: ${error.message}`);
    throw error;
  }
}

/**
 * Update user's typing status
 * @param {string} userId - User ID
 * @param {string} conversationId - Conversation ID
 * @param {boolean} isTyping - Whether user is typing
 */
async function updateTypingStatus(userId, conversationId, isTyping) {
  try {
    await Participant.update(
      {
        isTyping,
        lastTypingAt: isTyping ? new Date() : null
      },
      {
        where: {
          userId,
          conversationId
        }
      }
    );
  } catch (error) {
    logger.error(`Error updating typing status: ${error.message}`);
    throw error;
  }
}

/**
 * Mark messages as read
 * @param {string} userId - User ID
 * @param {string} conversationId - Conversation ID
 * @param {Array} messageIds - IDs of messages to mark as read
 */
async function markMessagesAsRead(userId, conversationId, messageIds) {
  const transaction = await sequelize.transaction();
  
  try {
    // Update participant's last read timestamp
    await Participant.update(
      { lastReadAt: new Date() },
      {
        where: {
          userId,
          conversationId
        },
        transaction
      }
    );
    
    // Get unread messages
    const messages = await Message.findAll({
      where: {
        id: messageIds,
        conversationId,
        senderId: { [sequelize.Sequelize.Op.ne]: userId } // Not sent by this user
      },
      transaction
    });
    
    // Update read status for each message
    for (const message of messages) {
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
      await message.update({ readAt }, { transaction });
    }
    
    await transaction.commit();
    
    logger.info(`Marked ${messages.length} messages as read by user ${userId}`);
  } catch (error) {
    await transaction.rollback();
    logger.error(`Error marking messages as read: ${error.message}`);
    throw error;
  }
}

/**
 * Update user's online status
 * @param {string} userId - User ID
 * @param {string} status - New status ('online'/'offline')
 */
async function updateUserStatus(userId, status) {
  try {
    await sequelize.models.User.update(
      {
        lastSeen: new Date(),
        isOnline: status === 'online'
      },
      {
        where: { id: userId }
      }
    );
    
    // Notify participants in all conversations about status change
    const participants = await Participant.findAll({
      where: { userId },
      attributes: ['conversationId']
    });
    
    // Get Socket.io instance
    const io = global.io;
    
    if (!io) return;
    
    // Broadcast status change to all conversations
    for (const participant of participants) {
      io.to(`conversation:${participant.conversationId}`).emit('user_status', {
        userId,
        status,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error(`Error updating user status: ${error.message}`);
  }
}

/**
 * Send notifications to offline users
 * @param {Object} message - Message object
 * @param {string} senderId - Sender ID
 */
async function sendMessageNotifications(message, senderId) {
  try {
    // Get all participants of the conversation
    const participants = await Participant.findAll({
      where: {
        conversationId: message.conversationId,
        userId: { [sequelize.Sequelize.Op.ne]: senderId } // Exclude sender
      },
      attributes: ['userId']
    });
    
    // Get conversation details
    const conversation = await Conversation.findByPk(message.conversationId, {
      attributes: ['name', 'type']
    });
    
    // Get sender details
    const sender = await sequelize.models.User.findByPk(senderId, {
      attributes: ['firstName', 'lastName']
    });
    
    const senderName = `${sender.firstName} ${sender.lastName}`;
    
    // For each participant
    for (const participant of participants) {
      // Check if user is offline (not in connected users map)
      if (!connectedUsers.has(participant.userId)) {
        // TODO: Integrate with notification service to send push notification
        logger.info(`Should send notification to user ${participant.userId} about message ${message.id}`);
      }
    }
  } catch (error) {
    logger.error(`Error sending message notifications: ${error.message}`);
  }
} 