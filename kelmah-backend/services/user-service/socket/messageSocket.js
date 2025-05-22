const jwt = require('jsonwebtoken');
const Message = require('../models/message.model');
const Conversation = require('../models/conversation.model');
const User = require('../models/user.model');
const { processUploadedFiles } = require('../services/fileUpload.service');
const { JWT_SECRET } = require('../config/env');

/**
 * Setup WebSocket handlers for real-time messaging
 * @param {Object} io - Socket.io instance
 */
const setupMessageSocket = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Check if user exists
      const user = await User.findByPk(decoded.sub);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user to socket
      socket.user = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName
      };
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id}`);
    
    // Update user's online status
    updateUserStatus(socket.user.id, true);
    
    // Join user's personal channel
    socket.on('join:user', (userId) => {
      if (userId === socket.user.id) {
        socket.join(`user:${userId}`);
        console.log(`User ${userId} joined their personal channel`);
      }
    });
    
    // Join conversation channel
    socket.on('join:conversation', async (conversationId) => {
      try {
        // Check if user is part of the conversation
        const conversation = await Conversation.findOne({
          where: {
            id: conversationId,
            participants: {
              [Op.contains]: [socket.user.id]
            }
          }
        });
        
        if (!conversation) {
          socket.emit('error', { message: 'Not authorized to join this conversation' });
          return;
        }
        
        socket.join(conversationId);
        console.log(`User ${socket.user.id} joined conversation ${conversationId}`);
        
        // Emit user joined event to other participants
        socket.to(conversationId).emit('user_joined', {
          userId: socket.user.id,
          conversationId
        });
      } catch (error) {
        console.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });
    
    // Leave conversation channel
    socket.on('leave:conversation', (conversationId) => {
      socket.leave(conversationId);
      console.log(`User ${socket.user.id} left conversation ${conversationId}`);
      
      // Emit user left event to other participants
      socket.to(conversationId).emit('user_left', {
        userId: socket.user.id,
        conversationId
      });
    });
    
    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, attachments = [], isEncrypted = false } = data;
        
        // Check if user is part of the conversation
        const conversation = await Conversation.findOne({
          where: {
            id: conversationId,
            participants: {
              [Op.contains]: [socket.user.id]
            }
          }
        });
        
        if (!conversation) {
          socket.emit('error', { message: 'Not authorized to send messages to this conversation' });
          return;
        }
        
        // Create message
        const message = await Message.create({
          conversationId,
          senderId: socket.user.id,
          content,
          attachments,
          type: attachments.length > 0 ? attachments[0].category : 'text',
          isEncrypted,
          status: 'sent',
          ipAddress: socket.handshake.address,
          userAgent: socket.handshake.headers['user-agent']
        });
        
        // Update conversation's last message
        await conversation.updateLastMessage(message);
        
        // Get sender details
        const sender = await User.findByPk(socket.user.id, {
          attributes: ['id', 'firstName', 'lastName', 'profileImage']
        });
        
        // Emit new message to all participants in the conversation
        io.to(conversationId).emit('new_message', {
          message: {
            ...message.toJSON(),
            sender: sender.toJSON()
          },
          conversationId
        });
        
        // Send notifications to users not in the conversation room
        conversation.participants.forEach(participantId => {
          if (participantId !== socket.user.id) {
            io.to(`user:${participantId}`).emit('message_notification', {
              conversationId,
              message: {
                id: message.id,
                senderId: socket.user.id,
                senderName: `${sender.firstName} ${sender.lastName}`,
                content: isEncrypted ? '[Encrypted message]' : content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                createdAt: message.createdAt
              }
            });
          }
        });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Mark messages as read
    socket.on('mark_read', async (data) => {
      try {
        const { conversationId, messageId } = data;
        
        // Check if user is part of the conversation
        const conversation = await Conversation.findOne({
          where: {
            id: conversationId,
            participants: {
              [Op.contains]: [socket.user.id]
            }
          }
        });
        
        if (!conversation) {
          socket.emit('error', { message: 'Not authorized to access this conversation' });
          return;
        }
        
        // If messageId is provided, mark specific message as read
        if (messageId) {
          const message = await Message.findByPk(messageId);
          if (message && message.conversationId === conversationId) {
            await message.markAsRead(socket.user.id);
            
            // Emit message read status to conversation
            io.to(conversationId).emit('message_read', {
              messageId,
              userId: socket.user.id,
              conversationId
            });
          }
        } else {
          // Mark all unread messages in conversation as read
          const messages = await Message.findAll({
            where: {
              conversationId,
              senderId: { [Op.ne]: socket.user.id },
              readStatus: {
                [Op.not]: sequelize.literal(`jsonb_exists(read_status, '${socket.user.id}')`)
              }
            }
          });
          
          await Promise.all(messages.map(message => message.markAsRead(socket.user.id)));
          
          // Emit conversation read status to all participants
          io.to(conversationId).emit('conversation_read', {
            userId: socket.user.id,
            conversationId,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
        socket.emit('error', { message: 'Failed to mark message as read' });
      }
    });
    
    // Typing status
    socket.on('typing_status', (data) => {
      const { conversationId, isTyping } = data;
      
      // Emit typing status to other participants in the conversation
      socket.to(conversationId).emit('typing_status', {
        userId: socket.user.id,
        userName: `${socket.user.firstName} ${socket.user.lastName}`,
        conversationId,
        isTyping
      });
    });
    
    // Get message history
    socket.on('get_message_history', async (data, callback) => {
      try {
        const { conversationId, page = 1, limit = 20 } = data;
        const offset = (page - 1) * limit;
        
        // Check if user is part of the conversation
        const conversation = await Conversation.findOne({
          where: {
            id: conversationId,
            participants: {
              [Op.contains]: [socket.user.id]
            }
          }
        });
        
        if (!conversation) {
          callback({ error: 'Not authorized to access this conversation' });
          return;
        }
        
        const messages = await Message.findByConversationId(conversationId, parseInt(limit), offset);
        const total = await Message.count({ where: { conversationId } });
        
        // Get sender details for each message
        const messagesWithSenders = await Promise.all(messages.map(async (message) => {
          const sender = await User.findByPk(message.senderId, {
            attributes: ['id', 'firstName', 'lastName', 'profileImage']
          });
          
          return {
            ...message.toJSON(),
            sender: sender ? sender.toJSON() : null
          };
        }));
        
        callback({
          messages: messagesWithSenders,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
          }
        });
      } catch (error) {
        console.error('Error fetching message history:', error);
        callback({ error: 'Failed to fetch message history' });
      }
    });
    
    // Search messages
    socket.on('search_messages', async (data, callback) => {
      try {
        const { conversationId, query } = data;
        
        if (!query) {
          callback({ error: 'Search query is required' });
          return;
        }
        
        // Check if user is part of the conversation
        const conversation = await Conversation.findOne({
          where: {
            id: conversationId,
            participants: {
              [Op.contains]: [socket.user.id]
            }
          }
        });
        
        if (!conversation) {
          callback({ error: 'Not authorized to access this conversation' });
          return;
        }
        
        const messages = await Message.searchByContent(conversationId, query);
        
        // Get sender details for each message
        const messagesWithSenders = await Promise.all(messages.map(async (message) => {
          const sender = await User.findByPk(message.senderId, {
            attributes: ['id', 'firstName', 'lastName', 'profileImage']
          });
          
          return {
            ...message.toJSON(),
            sender: sender ? sender.toJSON() : null
          };
        }));
        
        callback({ messages: messagesWithSenders });
      } catch (error) {
        console.error('Error searching messages:', error);
        callback({ error: 'Failed to search messages' });
      }
    });
    
    // User status (online/offline)
    socket.on('user_status', (data) => {
      const { status } = data;
      
      // Update user status
      updateUserStatus(socket.user.id, status === 'online');
      
      // Broadcast status change to all conversations user is part of
      broadcastUserStatus(socket.user.id, status);
    });
    
    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
      
      // Update user's online status
      updateUserStatus(socket.user.id, false);
      
      // Broadcast offline status to all conversations user is part of
      broadcastUserStatus(socket.user.id, 'offline');
    });
  });
  
  // Helper function to update user's online status
  async function updateUserStatus(userId, isOnline) {
    try {
      await User.update(
        { 
          isOnline, 
          lastOnline: isOnline ? null : new Date() 
        },
        { where: { id: userId } }
      );
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  }
  
  // Helper function to broadcast user status change to relevant conversations
  async function broadcastUserStatus(userId, status) {
    try {
      // Find all conversations user is part of
      const conversations = await Conversation.findAll({
        where: {
          participants: {
            [Op.contains]: [userId]
          }
        }
      });
      
      // Get user details
      const user = await User.findByPk(userId, {
        attributes: ['id', 'firstName', 'lastName', 'profileImage']
      });
      
      if (!user) return;
      
      // Broadcast to each conversation
      conversations.forEach(conversation => {
        io.to(conversation.id).emit('user_status', {
          userId,
          userName: `${user.firstName} ${user.lastName}`,
          status,
          lastOnline: status === 'offline' ? new Date() : null
        });
      });
    } catch (error) {
      console.error('Error broadcasting user status:', error);
    }
  }
};

module.exports = setupMessageSocket; 