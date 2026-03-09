/**
 * Real-time Messaging Socket Handler
 * Handles WebSocket connections for real-time messaging
 */

const { verifyAccessToken } = require("../../../shared/utils/jwt");
const { Conversation, Message, User } = require("../models");
const {
  ensureAttachmentScanStateList,
} = require("../utils/virusScanState");
const auditLogger = require("../utils/audit-logger");

/**
 * CRIT-MSG-01: Sanitize user-supplied content via HTML entity encoding.
 * Encodes dangerous characters so that content is safe for storage and
 * rendering without relying on fragile regex-based tag stripping.
 */
function sanitizeContent(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

const toIdString = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value._id?.toString?.() || value.id?.toString?.() || value.toString?.();
  }
  return String(value);
};

class MessageSocketHandler {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socketId mapping
    this.userSockets = new Map(); // socketId -> user info mapping
    this.typingUsers = new Map(); // conversationId -> Set of userIds typing
    // H-MSG5: Cache of userId -> Set of participant userIds from their conversations.
    // Populated on connection, updated on join/leave. Avoids DB query on every status broadcast.
    this.userConversationContacts = new Map();

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
        // CRIT-MSG-02: Only accept token from auth header, never from query string
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error("Authentication token required"));
        }

        // Verify JWT token using shared utility
        const decoded = verifyAccessToken(token);
        const claims = {
          id: decoded.id || decoded.sub,
          email: decoded.email,
          role: decoded.role,
        };

        // Get user details
        const user = await User.findById(claims.id).select(
          "firstName lastName email role isActive",
        );

        if (!user || !user.isActive) {
          return next(new Error("Invalid or inactive user"));
        }

        socket.userId = user.id;
        socket.user = user;
        socket.tokenVersion = claims.version;

        next();
      } catch (error) {
        console.error("Socket authentication error:", error);
        next(new Error("Authentication failed"));
      }
    });

    // Rate limiting middleware
    this.io.use((socket, next) => {
      const now = Date.now();

      if (!socket.rateLimitData) {
        socket.rateLimitData = {
          messages: [],
          connections: [],
        };
      }

      // Clean old entries (last 1 minute)
      socket.rateLimitData.messages = socket.rateLimitData.messages.filter(
        (timestamp) => now - timestamp < 60000,
      );

      // Check message rate limit (60 messages per minute)
      if (socket.rateLimitData.messages.length >= 60) {
        return next(new Error("Rate limit exceeded"));
      }

      next();
    });
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.io.on("connection", (socket) => {
      this.handleConnection(socket);

      // Message events
      // Support acknowledgements from client emit
      socket.on("send_message", (data, ack) =>
        this.handleSendMessage(socket, data, ack),
      );
      socket.on("send_encrypted", (data, ack) =>
        this.handleSendEncrypted(socket, data, ack),
      );
      socket.on("mark_read", (data) => this.handleMarkRead(socket, data));
      socket.on("typing_start", (data) => this.handleTypingStart(socket, data));
      socket.on("typing_stop", (data) => this.handleTypingStop(socket, data));

      // Conversation events
      socket.on("join_conversation", (data) =>
        this.handleJoinConversation(socket, data),
      );
      socket.on("leave_conversation", (data) =>
        this.handleLeaveConversation(socket, data),
      );

      // File sharing events
      socket.on("file_upload_progress", (data) =>
        this.handleFileUploadProgress(socket, data),
      );
      socket.on("file_shared", (data) => this.handleFileShared(socket, data));

      // Connection events
      socket.on("disconnect", () => this.handleDisconnection(socket));
      socket.on("reconnect", () => this.handleReconnection(socket));

      // Presence events
      socket.on("update_status", (data) =>
        this.handleUpdateStatus(socket, data),
      );
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
      if (!this.connectedUsers.has(String(userId))) {
        this.connectedUsers.set(String(userId), new Set());
      }
      this.connectedUsers.get(String(userId)).add(socket.id);
      this.userSockets.set(socket.id, {
        userId,
        user,
        connectedAt: new Date(),
        status: "online",
      });

      // Join user to their personal room
      socket.join(`user_${userId}`);

      // Get user's conversations and join them
      const conversations = await Conversation.find({
        participants: { $in: [userId] },
      })
        .populate("participants", "firstName lastName profilePicture isActive")
        .populate({
          path: "lastMessage",
          populate: { path: "sender", select: "firstName lastName" },
        });

      conversations.forEach((conversation) => {
        socket.join(`conversation_${conversation.id}`);
      });

      // H-MSG5: Build and cache the set of participant IDs from all conversations
      const contactIds = new Set();
      conversations.forEach((conv) => {
        (conv.participants || []).forEach((p) => {
          const pid = toIdString(p._id || p);
          if (pid && pid !== toIdString(userId)) {
            contactIds.add(pid);
          }
        });
      });
      this.userConversationContacts.set(String(userId), contactIds);

      // Notify other users that this user is online
      this.broadcastUserStatus(userId, "online");

      // Send welcome message with user's conversations
      socket.emit("connected", {
        message: "Successfully connected to messaging service",
        userId,
        onlineUsers: Array.from(this.connectedUsers.keys()).map((id) => String(id)),
        conversations: conversations.map((conv) => ({
          id: conv._id,
          participants: (conv.participants || []).map((participant) => ({
            id: participant._id,
            name: `${participant.firstName || ""} ${participant.lastName || ""}`.trim(),
            profilePicture: participant.profilePicture || null,
            isActive: participant.isActive,
          })),
          lastMessage: conv.lastMessage
            ? {
                id: conv.lastMessage._id,
                content: conv.lastMessage.content,
                messageType: conv.lastMessage.messageType,
                createdAt: conv.lastMessage.createdAt,
                senderId: toIdString(conv.lastMessage.sender?._id),
                senderName: conv.lastMessage.sender
                  ? `${conv.lastMessage.sender.firstName || ""} ${conv.lastMessage.sender.lastName || ""}`.trim()
                  : undefined,
              }
            : null,
          status: conv.status,
          updatedAt: conv.updatedAt,
        })),
      });

      // Log connection
      await auditLogger.log({
        userId,
        action: "SOCKET_CONNECTED",
        details: {
          socketId: socket.id,
          userAgent: socket.handshake.headers["user-agent"],
          ip: socket.handshake.address,
        },
      });

      console.log(`User ${userId} connected with socket ${socket.id}`);
    } catch (error) {
      console.error("Handle connection error:", error);
      socket.emit("error", { message: "Connection setup failed" });
    }
  }

  /**
   * Handle sending message
   */
  async handleSendMessage(socket, data, ack) {
    try {
      const {
        conversationId,
        content,
        messageType = "text",
        attachments = [],
        clientId,
      } = data || {};
      const userId = socket.userId;
      const attachmentsArray = Array.isArray(attachments) ? attachments : [];
      const normalizedContent =
        typeof content === "string" ? sanitizeContent(content) : "";

      // H-MSG3: Enforce content constraints on WebSocket messages (DoS prevention)
      if (messageType === 'text' && (!content || typeof content !== 'string' || content.trim().length === 0) && attachmentsArray.length === 0) {
        if (typeof ack === 'function') ack({ ok: false, error: 'Message content is required' });
        return;
      }
      if (content && typeof content === 'string' && content.length > 5000) {
        if (typeof ack === 'function') ack({ ok: false, error: 'Message too long. Maximum 5000 characters.' });
        return;
      }

      // Rate limiting check
      const now = Date.now();
      if (!socket.rateLimitData.messages) {
        socket.rateLimitData.messages = [];
      }

      // Prune timestamps older than 60 seconds before checking
      socket.rateLimitData.messages = socket.rateLimitData.messages.filter(
        (t) => now - t < 60000
      );

      if (socket.rateLimitData.messages.length >= 60) {
        socket.emit("error", {
          message: "Too many messages. Please slow down.",
        });
        if (typeof ack === "function")
          ack({ ok: false, error: "rate_limited" });
        return;
      }

      socket.rateLimitData.messages.push(now);

      // Validate input
      if (
        !conversationId ||
        (!normalizedContent && attachmentsArray.length === 0)
      ) {
        socket.emit("error", { message: "Invalid message data" });
        if (typeof ack === "function") ack({ ok: false, error: "invalid" });
        return;
      }

      // Check if user is participant in conversation
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: { $in: [userId] },
      });

      if (!conversation) {
        socket.emit("error", {
          message: "Conversation not found or access denied",
        });
        if (typeof ack === "function") ack({ ok: false, error: "not_found" });
        return;
      }

      // Create message
      const normalizedMessageType =
        messageType === "mixed"
          ? attachmentsArray.some((attachment) => {
              const mimeType =
                attachment?.fileType ||
                attachment?.mimeType ||
                attachment?.type ||
                "";
              return String(mimeType).startsWith("image/");
            })
            ? "image"
            : "file"
          : messageType;

      const message = new Message({
        conversation: conversationId,
        sender: userId,
        recipient: conversation.participants.find(
          (p) => p.toString() !== userId.toString(),
        ),
        content: normalizedContent || "[Attachment]",
        messageType: normalizedMessageType,
        attachments: ensureAttachmentScanStateList(attachmentsArray),
        readStatus: { isRead: false },
      });
      await message.save();

      // Update conversation's last message
      const recipientId = toIdString(
        conversation.participants.find(
          (p) => toIdString(p) !== toIdString(userId),
        ),
      );

      // H-MSG2: Use atomic operations for both lastMessage and unread count
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
      });
      if (recipientId) {
        await Conversation.atomicIncrementUnread(conversationId, recipientId);
      }

      // Populate sender details
      await message.populate("sender", "firstName lastName profilePicture");

      // Prepare message data for broadcast
      const messageData = {
        id: message._id,
        conversationId,
        senderId: message.sender._id,
        sender: {
          id: message.sender._id,
          name: `${message.sender.firstName} ${message.sender.lastName}`,
          profilePicture: message.sender.profilePicture,
        },
        content: message.content,
        messageType: message.messageType,
        attachments: message.attachments,
        createdAt: message.createdAt,
        isRead: message.readStatus.isRead,
        status: "sent",
        clientId: clientId || null,
      };

      // Broadcast message to all conversation participants
      this.io
        .to(`conversation_${conversationId}`)
        .emit("new_message", messageData);

      // Support the required receive_message event explicitly
      this.io
        .to(`conversation_${conversationId}`)
        .emit("receive_message", messageData);

      // Acknowledge to sender
      if (typeof ack === "function") ack({ ok: true, message: messageData });

      // Simulate a delivery tick if the recipient is online
      if (recipientId && this.connectedUsers.has(String(recipientId))) {
        this.io.to(`conversation_${conversationId}`).emit("message_delivered", {
          messageId: message._id,
          conversationId,
          deliveredAt: new Date(),
        });
        
        // Also emit camelCase/dash versions to be safe with older clients
        this.io.to(`conversation_${conversationId}`).emit("message-status", {
          messageId: message._id,
          conversationId,
          status: "delivered",
        });
      }

      // Send push notifications to offline users
      const offlineParticipants = conversation.participants.filter(
        (participantId) => {
          const normalizedParticipantId = toIdString(participantId);
          return (
            normalizedParticipantId &&
            normalizedParticipantId !== toIdString(userId) &&
            !this.connectedUsers.has(normalizedParticipantId)
          );
        },
      );

      if (offlineParticipants.length > 0) {
        // Use preference-aware notification helper for each offline participant
        try {
          const { createNotificationForUser } = require("../controllers/notification.controller");
          const notifPromises = offlineParticipants.map((uid) =>
            createNotificationForUser(
              uid,
              {
                type: "message_received",
                title: `New message from ${messageData.sender?.name || "Contact"}`,
                content: messageData.content || "Sent an attachment",
                actionUrl: `/messages?conversation=${conversationId}`,
                relatedEntity: { type: "message", id: messageData.id },
                priority: "low",
                metadata: { icon: "message", color: "info" },
              },
              { io: this.io },
            ).catch((err) => {
              console.warn(`Notification creation failed for ${uid}:`, err.message);
              return null;
            }),
          );
          await Promise.all(notifPromises);
        } catch (error) {
          console.warn("Failed to create notification docs:", error.message);
        }
      }

      // Stop typing indicator for sender
      this.handleTypingStop(socket, { conversationId });

      // Log message sent
      await auditLogger.log({
        userId,
        action: "MESSAGE_SENT",
        details: {
          messageId: message.id,
          conversationId,
          messageType,
          hasAttachments: attachments.length > 0,
        },
      });
    } catch (error) {
      console.error("Handle send message error:", error);
      socket.emit("error", { message: "Failed to send message" });
      if (typeof ack === "function") ack({ ok: false, error: "server_error" });
    }
  }

  /**
   * Handle sending encrypted message (envelope)
   */
  async handleSendEncrypted(socket, data, ack) {
    try {
      if ((process.env.ENABLE_E2E_ENVELOPE || "false") !== "true") {
        return this.handleSendMessage(socket, data, ack);
      }
      const {
        conversationId,
        encryptedBody,
        encryption,
        messageType = "text",
        attachments = [],
        clientId,
      } = data || {};
      const attachmentsArray = Array.isArray(attachments)
        ? attachments
        : [];
      const userId = socket.userId;

      // H-MSG4: Apply the same rate limiting as normal messages
      const now = Date.now();
      if (!socket.rateLimitData) {
        socket.rateLimitData = { messages: [], connections: [] };
      }
      if (!socket.rateLimitData.messages) {
        socket.rateLimitData.messages = [];
      }
      socket.rateLimitData.messages = socket.rateLimitData.messages.filter(
        (t) => now - t < 60000
      );
      if (socket.rateLimitData.messages.length >= 60) {
        if (typeof ack === "function") ack({ ok: false, error: "rate_limited" });
        return;
      }
      socket.rateLimitData.messages.push(now);

      if (!conversationId || !encryptedBody || !encryption) {
        if (typeof ack === "function")
          ack({ ok: false, error: "invalid_envelope" });
        return;
      }
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: { $in: [userId] },
      });
      if (!conversation) {
        if (typeof ack === "function") ack({ ok: false, error: "not_found" });
        return;
      }
      // Sanitize the encrypted body in case it contains injection vectors
      const sanitizedEncryptedBody = sanitizeContent(encryptedBody);

      const message = new Message({
        conversation: conversationId,
        sender: userId,
        recipient: conversation.participants.find(
          (p) => p.toString() !== userId.toString(),
        ),
        content: "",
        messageType,
        attachments: ensureAttachmentScanStateList(attachmentsArray),
        readStatus: { isRead: false },
        encryptedBody: sanitizedEncryptedBody,
        encryption,
      });
      await message.save();
      // H-MSG2: Use atomic operations for lastMessage and unread count
      const recipientId = toIdString(
        conversation.participants.find(
          (p) => p.toString() !== userId.toString(),
        ),
      );
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
      });
      if (recipientId) {
        await Conversation.atomicIncrementUnread(conversationId, recipientId);
      }
      await message.populate("sender", "firstName lastName profilePicture");
      const messageData = {
        id: message._id,
        conversationId,
        senderId: message.sender._id,
        sender: {
          id: message.sender._id,
          name: `${message.sender.firstName} ${message.sender.lastName}`,
          profilePicture: message.sender.profilePicture,
        },
        content: "",
        encrypted: true,
        messageType,
        attachments: message.attachments,
        createdAt: message.createdAt,
        isRead: message.readStatus.isRead,
        status: "sent",
        clientId: clientId || null,
      };
      this.io
        .to(`conversation_${conversationId}`)
        .emit("new_message", messageData);
      if (typeof ack === "function") ack({ ok: true, message: messageData });
    } catch (error) {
      console.error("Handle send encrypted error:", error);
      if (typeof ack === "function") ack({ ok: false, error: "server_error" });
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
        socket.emit("error", { message: "Conversation ID required" });
        return;
      }

      // Verify user is participant of this conversation
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: { $in: [userId] },
      });
      if (!conversation) {
        socket.emit("error", { message: "Conversation not found or access denied" });
        return;
      }

      // Scope mark-as-read to THIS conversation by ID
      const query = {
        conversation: conversationId,
        recipient: userId,
        "readStatus.isRead": false,
      };

      if (messageIds && messageIds.length > 0) {
        query._id = { $in: messageIds };
      }

      const updateResult = await Message.updateMany(query, {
        "readStatus.isRead": true,
        "readStatus.readAt": new Date(),
      });

      // H-MSG2: Atomic reset of unread count (avoids race condition)
      await Conversation.atomicResetUnread(conversationId, userId);

      // Broadcast read receipt to conversation participants
      this.io.to(`conversation_${conversationId}`).emit("messages_read", {
        conversationId,
        readByUserId: userId,
        messageIds: messageIds || "all_unread",
        readAt: new Date(),
        updatedCount: updateResult.modifiedCount || 0,
      });
      // Explicitly support message_read (alias)
      this.io.to(`conversation_${conversationId}`).emit("message_read", {      
        conversationId,
        readByUserId: userId,
        messageIds: messageIds || "all_unread",
        readAt: new Date(),
        updatedCount: updateResult.modifiedCount || 0,
      });    } catch (error) {
      console.error("Handle mark read error:", error);
      socket.emit("error", { message: "Failed to mark messages as read" });
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
      socket.to(`conversation_${conversationId}`).emit("user_typing", {
        conversationId,
        userId,
        user: {
          id: socket.user.id,
          name: `${socket.user.firstName} ${socket.user.lastName}`,
        },
        isTyping: true,
      });

      // MED-06 FIX: Store timeout ref and clear previous before creating new
      if (!this.typingTimeouts) this.typingTimeouts = new Map();
      const timeoutKey = `${conversationId}:${userId}`;
      const existingTimeout = this.typingTimeouts.get(timeoutKey);
      if (existingTimeout) clearTimeout(existingTimeout);

      // Auto-stop typing after 10 seconds
      const newTimeout = setTimeout(() => {
        this.typingTimeouts.delete(timeoutKey);
        this.handleTypingStop(socket, { conversationId });
      }, 10000);
      this.typingTimeouts.set(timeoutKey, newTimeout);
    } catch (error) {
      console.error("Handle typing start error:", error);
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
      socket.to(`conversation_${conversationId}`).emit("user_typing", {
        conversationId,
        userId,
        user: {
          id: socket.user.id,
          name: `${socket.user.firstName} ${socket.user.lastName}`,
        },
        isTyping: false,
      });
    } catch (error) {
      console.error("Handle typing stop error:", error);
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
        participants: { $in: [userId] },
      });

      if (!conversation) {
        socket.emit("error", {
          message: "Conversation not found or access denied",
        });
        return;
      }

      // Join conversation room
      socket.join(`conversation_${conversationId}`);

      // H-MSG5: Update the conversation contacts cache with new participants
      const userContacts = this.userConversationContacts.get(String(userId)) || new Set();
      (conversation.participants || []).forEach((p) => {
        const pid = toIdString(p);
        if (pid && pid !== toIdString(userId)) {
          userContacts.add(pid);
        }
      });
      this.userConversationContacts.set(String(userId), userContacts);

      // Get recent messages scoped to THIS conversation by ID
      const messages = await Message.find({
        conversation: conversationId,
      })
        .populate("sender", "firstName lastName profilePicture")
        .sort({ createdAt: -1 })
        .limit(50);

      // Send conversation data to user
      socket.emit("conversation_joined", {
        conversationId,
        messages: messages.reverse().map((msg) => ({
          id: msg._id,
          senderId: msg.sender._id,
          sender: {
            id: msg.sender._id,
            name: `${msg.sender.firstName} ${msg.sender.lastName}`,
            profilePicture: msg.sender.profilePicture,
          },
          content: msg.content,
          messageType: msg.messageType,
          attachments: msg.attachments,
          isRead: msg.readStatus.isRead,
          createdAt: msg.createdAt,
        })),
      });

      // Notify other participants that user joined
      socket
        .to(`conversation_${conversationId}`)
        .emit("user_joined_conversation", {
          conversationId,
          userId,
          user: {
            id: socket.user.id,
            name: `${socket.user.firstName} ${socket.user.lastName}`,
          },
        });
    } catch (error) {
      console.error("Handle join conversation error:", error);
      socket.emit("error", { message: "Failed to join conversation" });
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
      socket
        .to(`conversation_${conversationId}`)
        .emit("user_left_conversation", {
          conversationId,
          userId,
          user: {
            id: socket.user.id,
            name: `${socket.user.firstName} ${socket.user.lastName}`,
          },
        });
    } catch (error) {
      console.error("Handle leave conversation error:", error);
    }
  }

  /**
   * Handle file upload progress
   */
  handleFileUploadProgress(socket, data) {
    try {
      const { conversationId, fileId, progress, fileName } = data;

      // Broadcast upload progress to conversation participants
      socket.to(`conversation_${conversationId}`).emit("file_upload_progress", {
        conversationId,
        fileId,
        progress,
        fileName,
        uploadedBy: socket.userId,
      });
    } catch (error) {
      console.error("Handle file upload progress error:", error);
    }
  }

  /**
   * Handle file shared
   */
  async handleFileShared(socket, data) {
    try {
      const { conversationId, fileData } = data;

      // Send message with file attachment
      await this.handleSendMessage(socket, {
        conversationId,
        content: `Shared a file: ${fileData.fileName}`,
        messageType: "file",
        attachments: [fileData],
      });
    } catch (error) {
      console.error("Handle file shared error:", error);
      socket.emit("error", { message: "Failed to share file" });
    }
  }

  /**
   * Handle user status update
   */
  handleUpdateStatus(socket, data) {
    try {
      const { status } = data; // 'online', 'away', 'busy', 'offline'
      const userId = socket.userId;

      if (!["online", "away", "busy", "offline"].includes(status)) {
        socket.emit("error", { message: "Invalid status" });
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
      console.error("Handle update status error:", error);
    }
  }

  /**
   * Handle socket disconnection
   */
  async handleDisconnection(socket) {
    try {
      const userId = socket.userId;

      if (!userId) return;

      // LOW-04 FIX: Read connectedAt BEFORE deleting from map
      const socketMeta = this.userSockets.get(socket.id);
      const connectedAt = socketMeta?.connectedAt?.getTime() || Date.now();

      // Remove from connected users
      const userSocketSet = this.connectedUsers.get(String(userId));
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          this.connectedUsers.delete(String(userId));
          // H-MSG5: Clear contacts cache when user fully disconnects
          this.userConversationContacts.delete(String(userId));
        }
      }
      this.userSockets.delete(socket.id);

      // Clean up typing indicators
      for (const [
        conversationId,
        typingUsersSet,
      ] of this.typingUsers.entries()) {
        if (typingUsersSet.has(userId)) {
          this.handleTypingStop(socket, { conversationId });
        }
      }

      // Clean up typing timeouts for this user
      if (this.typingTimeouts) {
        for (const [key, timeout] of this.typingTimeouts.entries()) {
          if (key.endsWith(`:${userId}`)) {
            clearTimeout(timeout);
            this.typingTimeouts.delete(key);
          }
        }
      }

      // Broadcast user offline status
      this.broadcastUserStatus(userId, "offline");

      // Log disconnection
      await auditLogger.log({
        userId,
        action: "SOCKET_DISCONNECTED",
        details: {
          socketId: socket.id,
          duration: Date.now() - connectedAt,
        },
      });

      console.log(`User ${userId} disconnected from socket ${socket.id}`);
    } catch (error) {
      console.error("Handle disconnection error:", error);
    }
  }

  /**
   * Handle reconnection
   */
  handleReconnection(socket) {
    try {
      const userId = socket.userId;

      // Broadcast user online status
      this.broadcastUserStatus(userId, "online");

      console.log(`User ${userId} reconnected with socket ${socket.id}`);
    } catch (error) {
      console.error("Handle reconnection error:", error);
    }
  }

  /**
   * Broadcast user status to relevant users
   * H-MSG5: Uses the in-memory contacts cache instead of querying the DB
   * on every status change. Falls back to a DB query only if the cache is
   * not populated (e.g. user connected before cache was introduced).
   */
  broadcastUserStatus(userId, status) {
    try {
      const cachedContacts = this.userConversationContacts.get(String(userId));

      const emitToContacts = (contactIds) => {
        const statusData = {
          userId,
          status,
          timestamp: new Date(),
        };
        contactIds.forEach((contactId) => {
          if (!this.connectedUsers.has(contactId)) return;
          const socketSet = this.connectedUsers.get(contactId);
          if (socketSet && socketSet.size > 0) {
            socketSet.forEach((sid) => {
              this.io.to(sid).emit("user_status_changed", statusData);
              this.io.to(sid).emit(status === "online" ? "user_online" : "user_offline", statusData);
            });
          }
        });
      };

      if (cachedContacts && cachedContacts.size > 0) {
        // Fast path: use the cache
        emitToContacts(cachedContacts);
      } else {
        // Fallback: query DB once and populate cache
        Conversation.find({ participants: { $in: [userId] } })
          .then((conversations) => {
            const contactIds = new Set();
            conversations.forEach((conv) => {
              conv.participants.forEach((participantId) => {
                const pid = toIdString(participantId);
                if (pid && pid !== toIdString(userId)) {
                  contactIds.add(pid);
                }
              });
            });
            // Store for future calls
            this.userConversationContacts.set(String(userId), contactIds);
            emitToContacts(contactIds);
          })
          .catch((error) => {
            console.error("Error broadcasting user status:", error);
          });
      }
    } catch (error) {
      console.error("Broadcast user status error:", error);
    }
  }

  /**
   * Queue push notifications for offline users
   */
  queuePushNotifications(userIds, messageData) {
    try {
      // This would integrate with your notification service
      // For now, just log the notification request
      console.log(
        "Queuing push notifications for users:",
        userIds,
        "Message:",
        messageData.content?.substring(0, 50),
      );

      // Implementation would send to notification service
      // notificationService.sendPushNotifications(userIds, {
      //   title: `New message from ${messageData.sender.name}`,
      //   body: messageData.content || 'Sent an attachment',
      //   data: { conversationId: messageData.conversationId }
      // });

      // Minimal in-app notification emitter to user_{id} rooms
      userIds.forEach((uid) => {
        this.io.to(`user_${uid}`).emit("notification", {
          id: `msg_${messageData.id}`,
          type: "message",
          title: `New message from ${messageData.sender?.name || "Contact"}`,
          body: messageData.content || "Sent an attachment",
          data: { conversationId: messageData.conversationId },
          timestamp: new Date().toISOString(),
          read: false,
        });
      });
    } catch (error) {
      console.error("Queue push notifications error:", error);
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
    const socketSet = this.connectedUsers.get(String(userId));
    if (!socketSet || socketSet.size === 0) return "offline";
    const firstSocketId = socketSet.values().next().value;
    const socketData = this.userSockets.get(firstSocketId);
    return socketData?.status || "online";
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId, event, data) {
    const socketSet = this.connectedUsers.get(String(userId));
    if (socketSet && socketSet.size > 0) {
      socketSet.forEach((sid) => this.io.to(sid).emit(event, data));
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
