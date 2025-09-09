/**
 * Real-time Messaging Socket Handler
 * Handles WebSocket connections for real-time messaging
 */

const jwt = require('jsonwebtoken');
const { Conversation, Message, User } = require('../models');
const auditLogger = require('../utils/audit-logger');

class MessageSocketHandler {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socketId mapping
    this.userSockets = new Map(); // socketId -> user info mapping
    this.typingUsers = new Map(); // conversationId -> Set of userIds typing
    
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  /**
   * Setup Socket.IO middleware
   */
  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const claims = {
          id: decoded.id || decoded.sub,
          email: decoded.email,
          role: decoded.role
        };
        
        // Get user details
        const user = await User.findById(claims.id).select('firstName lastName email role isActive');

        if (!user || !user.isActive) {
          return next(new Error('Invalid or inactive user'));
        }

        socket.userId = user.id;
        socket.user = user;
        socket.tokenVersion = claims.version;
        
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Rate limiting middleware
    this.io.use((socket, next) => {
      const userId = socket.userId;
      const now = Date.now();
      
      if (!socket.rateLimitData) {
        socket.rateLimitData = {
          messages: [],
          connections: []
        };
      }

      // Clean old entries (last 1 minute)
      socket.rateLimitData.messages = socket.rateLimitData.messages.filter(
        timestamp => now - timestamp < 60000
      );

      // Check message rate limit (60 messages per minute)
      if (socket.rateLimitData.messages.length >= 60) {
        return next(new Error('Rate limit exceeded'));
      }

      next();
    });
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
      
      // Message events
      // Support acknowledgements from client emit
      socket.on('send_message', (data, ack) => this.handleSendMessage(socket, data, ack));
      socket.on('send_encrypted', (data, ack) => this.handleSendEncrypted(socket, data, ack));
      socket.on('mark_read', (data) => this.handleMarkRead(socket, data));
      socket.on('typing_start', (data) => this.handleTypingStart(socket, data));
      socket.on('typing_stop', (data) => this.handleTypingStop(socket, data));
      
      // Conversation events
      socket.on('join_conversation', (data) => this.handleJoinConversation(socket, data));
      socket.on('leave_conversation', (data) => this.handleLeaveConversation(socket, data));
      
      // File sharing events
      socket.on('file_upload_progress', (data) => this.handleFileUploadProgress(socket, data));
      socket.on('file_shared', (data) => this.handleFileShared(socket, data));
      
      // Connection events
      socket.on('disconnect', () => this.handleDisconnection(socket));
      socket.on('reconnect', () => this.handleReconnection(socket));
      
      // Presence events
      socket.on('update_status', (data) => this.handleUpdateStatus(socket, data));
    });
  }

  /**
   * Handle new socket connection
   */
  async handleConnection(socket) {
    try {
      const userId = socket.userId;
      const user = socket.user;

      // Store connection mapping
      this.connectedUsers.set(userId, socket.id);
      this.userSockets.set(socket.id, {
        userId,
        user,
        connectedAt: new Date(),
        status: 'online'
      });

      // Join user to their personal room
      socket.join(`user_${userId}`);

      // Get user's conversations and join them
      const conversations = await Conversation.find({
        participants: { $in: [userId] }
      });

      conversations.forEach(conversation => {
        socket.join(`conversation_${conversation.id}`);
      });

      // Notify other users that this user is online
      this.broadcastUserStatus(userId, 'online');

      // Send welcome message with user's conversations
      socket.emit('connected', {
        message: 'Successfully connected to messaging service',
        userId,
        conversations: conversations.map(conv => ({
          id: conv._id,
          participants: conv.participants,
          status: conv.status,
          updatedAt: conv.updatedAt
        }))
      });

      // Log connection
      await auditLogger.log({
        userId,
        action: 'SOCKET_CONNECTED',
        details: {
          socketId: socket.id,
          userAgent: socket.handshake.headers['user-agent'],
          ip: socket.handshake.address
        }
      });

      console.log(`User ${userId} connected with socket ${socket.id}`);

    } catch (error) {
      console.error('Handle connection error:', error);
      socket.emit('error', { message: 'Connection setup failed' });
    }
  }

  /**
   * Handle sending message
   */
  async handleSendMessage(socket, data, ack) {
    try {
      const { conversationId, content, messageType = 'text', attachments = [], clientId } = data || {};
      const userId = socket.userId;

      // Rate limiting check
      const now = Date.now();
      if (!socket.rateLimitData.messages) {
        socket.rateLimitData.messages = [];
      }
      
      socket.rateLimitData.messages.push(now);
      
      if (socket.rateLimitData.messages.length > 60) {
        socket.emit('error', { message: 'Too many messages. Please slow down.' });
        if (typeof ack === 'function') ack({ ok: false, error: 'rate_limited' });
        return;
      }

      // Validate input
      if (!conversationId || (!content && (!Array.isArray(attachments) || attachments.length === 0))) {
        socket.emit('error', { message: 'Invalid message data' });
        if (typeof ack === 'function') ack({ ok: false, error: 'invalid' });
        return;
      }

      // Check if user is participant in conversation
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: { $in: [userId] }
      });

      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found or access denied' });
        if (typeof ack === 'function') ack({ ok: false, error: 'not_found' });
        return;
      }

      // Create message
      const message = new Message({
        sender: userId,
        recipient: conversation.participants.find(p => p.toString() !== userId.toString()),
        content: typeof content === 'string' ? content : '',
        messageType,
        attachments: Array.isArray(attachments) && attachments.length > 0 ? attachments : [],
        readStatus: { isRead: false }
      });
      await message.save();

      // Update conversation's last message timestamp  
      conversation.lastMessage = message._id;
      await conversation.save();

      // Populate sender details
      await message.populate('sender', 'firstName lastName profilePicture');

      // Prepare message data for broadcast
      const messageData = {
        id: message._id,
        conversationId,
        senderId: message.sender._id,
        sender: {
          id: message.sender._id,
          name: `${message.sender.firstName} ${message.sender.lastName}`,
          profilePicture: message.sender.profilePicture
        },
        content: message.content,
        messageType: message.messageType,
        attachments: message.attachments,
        createdAt: message.createdAt,
        isRead: message.readStatus.isRead,
        status: 'sent',
        clientId: clientId || null
      };

      // Broadcast message to all conversation participants
      this.io.to(`conversation_${conversationId}`).emit('new_message', messageData);

      // Acknowledge to sender
      if (typeof ack === 'function') ack({ ok: true, message: messageData });

      // Send push notifications to offline users
      const offlineParticipants = conversation.participants.filter(
        participantId => participantId !== userId && !this.connectedUsers.has(participantId)
      );

      if (offlineParticipants.length > 0) {
        // Queue push notifications and persist lightweight in-app notifications
        this.queuePushNotifications(offlineParticipants, messageData);
        try {
          const Notification = require('../models/Notification');
          const docs = offlineParticipants.map((uid) => ({
            recipient: uid,
            type: 'message_received',
            title: `New message from ${messageData.sender?.name || 'Contact'}`,
            content: messageData.content || 'Sent an attachment',
            actionUrl: `/messages/${conversationId}`,
            relatedEntity: { type: 'message', id: messageData.id },
            priority: 'low',
            metadata: { icon: 'message', color: 'info' }
          }));
          if (docs.length > 0) await Notification.insertMany(docs);
        } catch (_) {}
      }

      // Stop typing indicator for sender
      this.handleTypingStop(socket, { conversationId });

      // Log message sent
      await auditLogger.log({
        userId,
        action: 'MESSAGE_SENT',
        details: {
          messageId: message.id,
          conversationId,
          messageType,
          hasAttachments: attachments.length > 0
        }
      });

    } catch (error) {
      console.error('Handle send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
      if (typeof ack === 'function') ack({ ok: false, error: 'server_error' });
    }
  }

  /**
   * Handle sending encrypted message (envelope)
   */
  async handleSendEncrypted(socket, data, ack) {
    try {
      if ((process.env.ENABLE_E2E_ENVELOPE || 'false') !== 'true') {
        return this.handleSendMessage(socket, data, ack);
      }
      const { conversationId, encryptedBody, encryption, messageType = 'text', attachments = [], clientId } = data || {};
      const userId = socket.userId;
      if (!conversationId || !encryptedBody || !encryption) {
        if (typeof ack === 'function') ack({ ok: false, error: 'invalid_envelope' });
        return;
      }
      const conversation = await Conversation.findOne({ _id: conversationId, participants: { $in: [userId] } });
      if (!conversation) {
        if (typeof ack === 'function') ack({ ok: false, error: 'not_found' });
        return;
      }
      const message = new Message({
        sender: userId,
        recipient: conversation.participants.find(p => p.toString() !== userId.toString()),
        content: '',
        messageType,
        attachments: attachments.length > 0 ? attachments : [],
        readStatus: { isRead: false },
        encryptedBody,
        encryption,
      });
      await message.save();
      conversation.lastMessage = message._id;
      await conversation.save();
      await message.populate('sender', 'firstName lastName profilePicture');
      const messageData = {
        id: message._id,
        conversationId,
        senderId: message.sender._id,
        sender: { id: message.sender._id, name: `${message.sender.firstName} ${message.sender.lastName}`, profilePicture: message.sender.profilePicture },
        content: '',
        encrypted: true,
        messageType,
        attachments: message.attachments,
        createdAt: message.createdAt,
        isRead: message.readStatus.isRead,
        status: 'sent',
        clientId: clientId || null
      };
      this.io.to(`conversation_${conversationId}`).emit('new_message', messageData);
      if (typeof ack === 'function') ack({ ok: true, message: messageData });
    } catch (error) {
      console.error('Handle send encrypted error:', error);
      if (typeof ack === 'function') ack({ ok: false, error: 'server_error' });
    }
  }

  /**
   * Handle marking messages as read
   */
  async handleMarkRead(socket, data) {
    try {
      const { conversationId, messageIds } = data;
      const userId = socket.userId;

      if (!conversationId) {
        socket.emit('error', { message: 'Conversation ID required' });
        return;
      }

      // Update messages as read
      const query = {
        sender: { $ne: userId }, // Don't mark own messages as read
        'readStatus.isRead': false
      };

      if (messageIds && messageIds.length > 0) {
        query._id = { $in: messageIds };
      }

      const updatedMessages = await Message.updateMany(
        query,
        { 
          'readStatus.isRead': true, 
          'readStatus.readAt': new Date() 
        }
      );

      // Broadcast read receipt to conversation participants
      this.io.to(`conversation_${conversationId}`).emit('messages_read', {
        conversationId,
        readByUserId: userId,
        messageIds: messageIds || 'all_unread',
        readAt: new Date()
      });

    } catch (error) {
      console.error('Handle mark read error:', error);
      socket.emit('error', { message: 'Failed to mark messages as read' });
    }
  }

  /**
   * Handle typing start
   */
  handleTypingStart(socket, data) {
    try {
      const { conversationId } = data;
      const userId = socket.userId;

      if (!conversationId) return;

      // Add user to typing users for this conversation
      if (!this.typingUsers.has(conversationId)) {
        this.typingUsers.set(conversationId, new Set());
      }
      
      this.typingUsers.get(conversationId).add(userId);

      // Broadcast typing indicator to other participants
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        user: {
          id: socket.user.id,
          name: `${socket.user.firstName} ${socket.user.lastName}`
        },
        isTyping: true
      });

      // Auto-stop typing after 10 seconds
      setTimeout(() => {
        this.handleTypingStop(socket, { conversationId });
      }, 10000);

    } catch (error) {
      console.error('Handle typing start error:', error);
    }
  }

  /**
   * Handle typing stop
   */
  handleTypingStop(socket, data) {
    try {
      const { conversationId } = data;
      const userId = socket.userId;

      if (!conversationId || !this.typingUsers.has(conversationId)) return;

      // Remove user from typing users
      this.typingUsers.get(conversationId).delete(userId);
      
      if (this.typingUsers.get(conversationId).size === 0) {
        this.typingUsers.delete(conversationId);
      }

      // Broadcast stop typing to other participants
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        user: {
          id: socket.user.id,
          name: `${socket.user.firstName} ${socket.user.lastName}`
        },
        isTyping: false
      });

    } catch (error) {
      console.error('Handle typing stop error:', error);
    }
  }

  /**
   * Handle joining conversation
   */
  async handleJoinConversation(socket, data) {
    try {
      const { conversationId } = data;
      const userId = socket.userId;

      // Verify user has access to conversation
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: { $in: [userId] }
      });

      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found or access denied' });
        return;
      }

      // Join conversation room
      socket.join(`conversation_${conversationId}`);

      // Get recent messages (Note: This needs to be adjusted based on your Message schema)
      const messages = await Message.find({
        $or: [
          { sender: userId, recipient: { $in: conversation.participants } },
          { recipient: userId, sender: { $in: conversation.participants } }
        ]
      })
      .populate('sender', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 })
      .limit(50);

      // Send conversation data to user
      socket.emit('conversation_joined', {
        conversationId,
        messages: messages.reverse().map(msg => ({
          id: msg._id,
          senderId: msg.sender._id,
          sender: {
            id: msg.sender._id,
            name: `${msg.sender.firstName} ${msg.sender.lastName}`,
            profilePicture: msg.sender.profilePicture
          },
          content: msg.content,
          messageType: msg.messageType,
          attachments: msg.attachments,
          isRead: msg.readStatus.isRead,
          createdAt: msg.createdAt
        }))
      });

      // Notify other participants that user joined
      socket.to(`conversation_${conversationId}`).emit('user_joined_conversation', {
        conversationId,
        userId,
        user: {
          id: socket.user.id,
          name: `${socket.user.firstName} ${socket.user.lastName}`
        }
      });

    } catch (error) {
      console.error('Handle join conversation error:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  }

  /**
   * Handle leaving conversation
   */
  handleLeaveConversation(socket, data) {
    try {
      const { conversationId } = data;
      const userId = socket.userId;

      // Leave conversation room
      socket.leave(`conversation_${conversationId}`);

      // Stop typing if user was typing
      this.handleTypingStop(socket, { conversationId });

      // Notify other participants that user left
      socket.to(`conversation_${conversationId}`).emit('user_left_conversation', {
        conversationId,
        userId,
        user: {
          id: socket.user.id,
          name: `${socket.user.firstName} ${socket.user.lastName}`
        }
      });

    } catch (error) {
      console.error('Handle leave conversation error:', error);
    }
  }

  /**
   * Handle file upload progress
   */
  handleFileUploadProgress(socket, data) {
    try {
      const { conversationId, fileId, progress, fileName } = data;

      // Broadcast upload progress to conversation participants
      socket.to(`conversation_${conversationId}`).emit('file_upload_progress', {
        conversationId,
        fileId,
        progress,
        fileName,
        uploadedBy: socket.userId
      });

    } catch (error) {
      console.error('Handle file upload progress error:', error);
    }
  }

  /**
   * Handle file shared
   */
  async handleFileShared(socket, data) {
    try {
      const { conversationId, fileData } = data;
      const userId = socket.userId;

      // Send message with file attachment
      await this.handleSendMessage(socket, {
        conversationId,
        content: `Shared a file: ${fileData.fileName}`,
        messageType: 'file',
        attachments: [fileData]
      });

    } catch (error) {
      console.error('Handle file shared error:', error);
      socket.emit('error', { message: 'Failed to share file' });
    }
  }

  /**
   * Handle user status update
   */
  handleUpdateStatus(socket, data) {
    try {
      const { status } = data; // 'online', 'away', 'busy', 'offline'
      const userId = socket.userId;

      if (!['online', 'away', 'busy', 'offline'].includes(status)) {
        socket.emit('error', { message: 'Invalid status' });
        return;
      }

      // Update user status in socket data
      const socketData = this.userSockets.get(socket.id);
      if (socketData) {
        socketData.status = status;
        this.userSockets.set(socket.id, socketData);
      }

      // Broadcast status update
      this.broadcastUserStatus(userId, status);

    } catch (error) {
      console.error('Handle update status error:', error);
    }
  }

  /**
   * Handle socket disconnection
   */
  async handleDisconnection(socket) {
    try {
      const userId = socket.userId;

      if (!userId) return;

      // Remove from connected users
      this.connectedUsers.delete(userId);
      this.userSockets.delete(socket.id);

      // Clean up typing indicators
      for (const [conversationId, typingUsersSet] of this.typingUsers.entries()) {
        if (typingUsersSet.has(userId)) {
          this.handleTypingStop(socket, { conversationId });
        }
      }

      // Broadcast user offline status
      this.broadcastUserStatus(userId, 'offline');

      // Log disconnection
      await auditLogger.log({
        userId,
        action: 'SOCKET_DISCONNECTED',
        details: {
          socketId: socket.id,
          duration: Date.now() - (this.userSockets.get(socket.id)?.connectedAt?.getTime() || Date.now())
        }
      });

      console.log(`User ${userId} disconnected from socket ${socket.id}`);

    } catch (error) {
      console.error('Handle disconnection error:', error);
    }
  }

  /**
   * Handle reconnection
   */
  handleReconnection(socket) {
    try {
      const userId = socket.userId;

      // Broadcast user online status
      this.broadcastUserStatus(userId, 'online');

      console.log(`User ${userId} reconnected with socket ${socket.id}`);

    } catch (error) {
      console.error('Handle reconnection error:', error);
    }
  }

  /**
   * Broadcast user status to relevant users
   */
  broadcastUserStatus(userId, status) {
    try {
      // Get user's conversations to determine who should receive the status update
      Conversation.find({
        participants: { $in: [userId] }
      }).then(conversations => {
        const notifyUsers = new Set();
        
        conversations.forEach(conv => {
          conv.participants.forEach(participantId => {
            if (participantId !== userId && this.connectedUsers.has(participantId)) {
              notifyUsers.add(participantId);
            }
          });
        });

        // Send status update to relevant users
        notifyUsers.forEach(notifyUserId => {
          const socketId = this.connectedUsers.get(notifyUserId);
          if (socketId) {
            this.io.to(socketId).emit('user_status_changed', {
              userId,
              status,
              timestamp: new Date()
            });
          }
        });
      }).catch(error => {
        console.error('Error broadcasting user status:', error);
      });

    } catch (error) {
      console.error('Broadcast user status error:', error);
    }
  }

  /**
   * Queue push notifications for offline users
   */
  queuePushNotifications(userIds, messageData) {
    try {
      // This would integrate with your notification service
      // For now, just log the notification request
      console.log('Queuing push notifications for users:', userIds, 'Message:', messageData.content?.substring(0, 50));
      
      // Implementation would send to notification service
      // notificationService.sendPushNotifications(userIds, {
      //   title: `New message from ${messageData.sender.name}`,
      //   body: messageData.content || 'Sent an attachment',
      //   data: { conversationId: messageData.conversationId }
      // });

      // Minimal in-app notification emitter to user_{id} rooms
      userIds.forEach((uid) => {
        this.io.to(`user_${uid}`).emit('notification', {
          id: `msg_${messageData.id}`,
          type: 'message',
          title: `New message from ${messageData.sender?.name || 'Contact'}`,
          body: messageData.content || 'Sent an attachment',
          data: { conversationId: messageData.conversationId },
          timestamp: new Date().toISOString(),
          read: false,
        });
      });

    } catch (error) {
      console.error('Queue push notifications error:', error);
    }
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Get user's online status
   */
  getUserStatus(userId) {
    const socketId = this.connectedUsers.get(userId);
    if (!socketId) return 'offline';
    
    const socketData = this.userSockets.get(socketId);
    return socketData?.status || 'online';
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  /**
   * Broadcast to all connected users
   */
  broadcast(event, data) {
    this.io.emit(event, data);
  }
}

module.exports = MessageSocketHandler;