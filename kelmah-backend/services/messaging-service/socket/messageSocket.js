/**
 * Socket Handler for Real-time Messaging
 */

const jwt = require('jsonwebtoken');
const { Message, Conversation, Participant, sequelize } = require('../models');
const { Op } = require('sequelize');
const config = require('../config');
const logger = require('../utils/logger');

// Track connected users
const connectedUsers = new Map();

/**
 * Setup Socket.io for messaging
 * @param {SocketIO.Server} io - Socket.io server instance
 */
const setupMessageSocket = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }
      
      try {
        // Verify JWT token
        const decoded = jwt.verify(token, config.jwt.secret);
        
        // Attach user data to socket
        socket.user = decoded;
        
        return next();
      } catch (err) {
        logger.error(`Socket authentication failed: ${err.message}`, { err });
        return next(new Error('Authentication error: Invalid token'));
      }
    } catch (error) {
      logger.error(`Socket middleware error: ${error.message}`, { error });
      return next(new Error('Internal server error'));
    }
  });
  
  io.on('connection', (socket) => {
    const userId = socket.user.id;
    
    logger.info(`User connected: ${userId}`);
    
    // Track connected user
    connectedUsers.set(userId, {
      socketId: socket.id,
      userId,
      lastActive: new Date()
    });
    
    // Join user's personal room for direct messages
    socket.join(`user:${userId}`);
    
    // Broadcast user's online status
    io.emit('user_status', {
      userId,
      status: 'online',
      timestamp: new Date().toISOString()
    });
    
    // Handle joining conversations
    socket.on('join_conversation', async (conversationId) => {
      try {
        // Verify user is a participant in this conversation
        const participant = await Participant.findOne({
          where: {
            conversationId,
            userId
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
        logger.info(`User ${userId} joined conversation: ${conversationId}`);
      } catch (error) {
        logger.error(`Error joining conversation: ${error.message}`, { error });
        socket.emit('error', {
          message: 'Failed to join conversation'
        });
      }
    });
    
    // Handle leaving conversations
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      logger.info(`User ${userId} left conversation: ${conversationId}`);
    });
    
    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, type = 'text' } = data;
        
        // Validate inputs
        if (!conversationId || !content) {
          socket.emit('error', {
            message: 'Conversation ID and content are required'
          });
          return;
        }
        
        // Verify user is a participant in this conversation
        const participant = await Participant.findOne({
          where: {
            conversationId,
            userId
          }
        });
        
        if (!participant) {
          socket.emit('error', {
            message: 'You are not a participant in this conversation'
          });
          return;
        }
        
        // Create message
        const message = await Message.create({
          conversationId,
          senderId: userId,
          content,
          type
        });
        
        // Update conversation lastMessageAt
        await Conversation.update(
          { lastMessageAt: new Date() },
          { where: { id: conversationId } }
        );
        
        // Emit message to conversation
        io.to(`conversation:${conversationId}`).emit('new_message', message);
        
        // Log success
        logger.info(`Message sent in conversation ${conversationId} by user ${userId}`);
      } catch (error) {
        logger.error(`Error sending message: ${error.message}`, { error });
        socket.emit('error', {
          message: 'Failed to send message'
        });
      }
    });
    
    // Handle typing status
    socket.on('typing', async (data) => {
      try {
        const { conversationId, isTyping } = data;
        
        // Verify user is a participant in this conversation
        const participant = await Participant.findOne({
          where: {
            conversationId,
            userId
          }
        });
        
        if (!participant) {
          return;
        }
        
        // Emit typing status to conversation members
        socket.to(`conversation:${conversationId}`).emit('user_typing', {
          conversationId,
          userId,
          isTyping,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(`Error handling typing status: ${error.message}`, { error });
      }
    });
    
    // Handle marking messages as read
    socket.on('mark_read', async (data) => {
      try {
        const { conversationId } = data;
        
        // Verify user is a participant in this conversation
        const participant = await Participant.findOne({
          where: {
            conversationId,
            userId
          }
        });
        
        if (!participant) {
          return;
        }
        
        // Get unread messages
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
        
        // Mark messages as read
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
        
        // Emit read status to conversation
        io.to(`conversation:${conversationId}`).emit('messages_read', {
          conversationId,
          userId,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(`Error marking messages as read: ${error.message}`, { error });
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${userId}`);
      
      // Remove from connected users
      connectedUsers.delete(userId);
      
      // Broadcast user's offline status
      io.emit('user_status', {
        userId,
        status: 'offline',
        timestamp: new Date().toISOString()
      });
    });
  });
  
  return io;
};

module.exports = setupMessageSocket;
module.exports.connectedUsers = connectedUsers; 