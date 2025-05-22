/**
 * Socket.io handler for Messaging Service
 * Manages real-time messaging functionality
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// In-memory store for connected users (userId -> socketId)
const connectedUsers = new Map();

// In-memory store for typing status (conversationId -> { userId: timestamp })
const typingUsers = new Map();

// Authenticate socket connection using JWT
const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error: Token required'));
  }
  
  try {
    // Verify token (would normally use a JWT_SECRET from environment)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kelmah-messaging-secret');
    
    // Attach user to socket
    socket.user = decoded;
    next();
  } catch (error) {
    return next(new Error('Authentication error: Invalid token'));
  }
};

// Initialize socket.io handlers
module.exports = (io, models, logger) => {
  const { Message, Conversation, Participant } = models;
  
  // Use authentication middleware
  io.use(authenticateSocket);
  
  // Handle socket connections
  io.on('connection', (socket) => {
    const { user } = socket;
    const userId = user.id;
    
    logger.info(`User connected: ${userId}, Socket ID: ${socket.id}`);
    
    // Store socket connection
    connectedUsers.set(userId, socket.id);
    
    // Emit online status to all connected users
    io.emit('user:status', { userId, status: 'online' });
    
    // Join user's conversations
    joinUserConversations(socket, userId);
    
    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${userId}`);
      
      // Remove from connected users
      connectedUsers.delete(userId);
      
      // Emit offline status
      io.emit('user:status', { userId, status: 'offline' });
      
      // Clear typing status
      clearUserTypingStatus(userId);
    });
    
    // Handle sending messages
    socket.on('message:send', async (data, callback) => {
      try {
        const { conversationId, content, type = 'text', attachments = [], replyToId = null } = data;
        
        if (!conversationId || !content) {
          return callback({ 
            error: 'Missing required fields' 
          });
        }
        
        // Check if user is participant in conversation
        const isParticipant = await isUserInConversation(userId, conversationId);
        
        if (!isParticipant) {
          return callback({ 
            error: 'Not authorized to send message to this conversation' 
          });
        }
        
        // Create message
        const message = await Message.create({
          id: uuidv4(),
          conversationId,
          senderId: userId,
          content,
          type,
          attachments,
          replyToId,
          readAt: { [userId]: new Date().toISOString() }, // Mark as read by sender
          status: 'sent'
        });
        
        // Get fresh message with sender info
        const newMessage = await Message.findByPk(message.id);
        
        // Emit message to all participants in the conversation
        socket.to(`conversation:${conversationId}`).emit('message:new', newMessage);
        
        // Clear typing status for this user
        updateTypingStatus(conversationId, userId, false);
        
        // Return success to sender
        callback({ success: true, message: newMessage });
        
        // Update conversation last activity
        await Conversation.update(
          { lastMessageAt: new Date() },
          { where: { id: conversationId } }
        );
        
        // Update last delivered status for online users
        updateMessageDeliveryStatus(newMessage);
        
      } catch (error) {
        logger.error(`Error sending message: ${error.message}`, error);
        callback({ error: 'Failed to send message' });
      }
    });
    
    // Handle message read status
    socket.on('message:read', async (data, callback) => {
      try {
        const { messageId, conversationId } = data;
        
        if (!messageId) {
          return callback({ error: 'Message ID required' });
        }
        
        // Check if user is participant in conversation
        const isParticipant = await isUserInConversation(userId, conversationId);
        
        if (!isParticipant) {
          return callback({ error: 'Not authorized' });
        }
        
        // Get message
        const message = await Message.findByPk(messageId);
        
        if (!message) {
          return callback({ error: 'Message not found' });
        }
        
        // Update read status
        await message.markAsRead(userId);
        
        // Update participant last read
        await Participant.update(
          { lastReadAt: new Date() },
          { 
            where: { 
              userId,
              conversationId: message.conversationId
            } 
          }
        );
        
        // Emit read status to conversation
        io.to(`conversation:${message.conversationId}`).emit('message:read', {
          messageId,
          userId,
          readAt: new Date().toISOString()
        });
        
        callback({ success: true });
        
      } catch (error) {
        logger.error(`Error marking message as read: ${error.message}`);
        callback({ error: 'Failed to update read status' });
      }
    });
    
    // Handle typing status
    socket.on('user:typing', async (data) => {
      try {
        const { conversationId, isTyping } = data;
        
        // Check if user is participant in conversation
        const isParticipant = await isUserInConversation(userId, conversationId);
        
        if (!isParticipant) {
          return;
        }
        
        // Update typing status
        updateTypingStatus(conversationId, userId, isTyping);
        
        // Update participant typing status
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
      }
    });
    
    // Join a conversation
    socket.on('conversation:join', async (data, callback) => {
      try {
        const { conversationId } = data;
        
        // Check if user is participant
        const isParticipant = await isUserInConversation(userId, conversationId);
        
        if (!isParticipant) {
          return callback({ error: 'Not authorized to join this conversation' });
        }
        
        // Join the room
        socket.join(`conversation:${conversationId}`);
        
        // Get unread messages for this conversation
        const unreadMessages = await Message.findUnreadForUser(userId, conversationId);
        
        callback({ 
          success: true,
          unreadCount: unreadMessages.length
        });
        
      } catch (error) {
        logger.error(`Error joining conversation: ${error.message}`);
        callback({ error: 'Failed to join conversation' });
      }
    });
  });
  
  // Helper function to join user's conversations
  const joinUserConversations = async (socket, userId) => {
    try {
      // Find all conversations where user is a participant
      const participants = await Participant.findAll({
        where: { userId }
      });
      
      // Join each conversation room
      participants.forEach(participant => {
        socket.join(`conversation:${participant.conversationId}`);
      });
      
      logger.info(`User ${userId} joined ${participants.length} conversation rooms`);
    } catch (error) {
      logger.error(`Error joining user conversations: ${error.message}`);
    }
  };
  
  // Helper function to check if user is in conversation
  const isUserInConversation = async (userId, conversationId) => {
    const participant = await Participant.findOne({
      where: {
        userId,
        conversationId
      }
    });
    
    return !!participant;
  };
  
  // Helper function to update typing status
  const updateTypingStatus = (conversationId, userId, isTyping) => {
    // Initialize typing status for conversation if not exists
    if (!typingUsers.has(conversationId)) {
      typingUsers.set(conversationId, new Map());
    }
    
    const conversationTyping = typingUsers.get(conversationId);
    
    if (isTyping) {
      // Set typing status with timestamp
      conversationTyping.set(userId, Date.now());
    } else {
      // Remove typing status
      conversationTyping.delete(userId);
    }
    
    // Get all typing users for this conversation
    const typingUserIds = Array.from(conversationTyping.keys());
    
    // Emit typing status to conversation
    io.to(`conversation:${conversationId}`).emit('user:typing', {
      conversationId,
      users: typingUserIds
    });
  };
  
  // Helper function to clear user typing status
  const clearUserTypingStatus = (userId) => {
    // Iterate through all conversations
    for (const [conversationId, users] of typingUsers.entries()) {
      if (users.has(userId)) {
        users.delete(userId);
        
        // Emit updated typing status
        const typingUserIds = Array.from(users.keys());
        io.to(`conversation:${conversationId}`).emit('user:typing', {
          conversationId,
          users: typingUserIds
        });
      }
    }
  };
  
  // Helper function to update message delivery status
  const updateMessageDeliveryStatus = (message) => {
    // Get message data
    const { id: messageId, conversationId, senderId } = message;
    
    // Find all participants in the conversation
    Participant.findAll({
      where: { conversationId }
    }).then(participants => {
      // Update delivered status for online participants
      participants.forEach(participant => {
        // Skip sender
        if (participant.userId === senderId) return;
        
        // Check if user is online
        if (connectedUsers.has(participant.userId)) {
          // Update participant last delivered timestamp
          Participant.update(
            { lastDeliveredAt: new Date() },
            { where: { id: participant.id } }
          ).catch(err => {
            logger.error(`Error updating delivery status: ${err.message}`);
          });
          
          // Emit delivery status to sender
          io.to(connectedUsers.get(senderId)).emit('message:delivered', {
            messageId,
            userId: participant.userId,
            deliveredAt: new Date().toISOString()
          });
        }
      });
    }).catch(error => {
      logger.error(`Error processing message delivery: ${error.message}`);
    });
  };
  
  // Start a cleanup interval for typing status
  const TYPING_TIMEOUT = 10000; // 10 seconds
  
  setInterval(() => {
    const now = Date.now();
    
    // Check all conversations
    for (const [conversationId, users] of typingUsers.entries()) {
      let updated = false;
      
      // Check each user's typing timestamp
      for (const [userId, timestamp] of users.entries()) {
        if (now - timestamp > TYPING_TIMEOUT) {
          users.delete(userId);
          updated = true;
        }
      }
      
      // If any user's typing status was cleared, emit update
      if (updated) {
        const typingUserIds = Array.from(users.keys());
        io.to(`conversation:${conversationId}`).emit('user:typing', {
          conversationId,
          users: typingUserIds
        });
      }
    }
  }, 5000); // Check every 5 seconds
}; 