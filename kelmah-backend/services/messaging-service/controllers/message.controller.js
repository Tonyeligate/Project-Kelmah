const { Message, Conversation, Notification } = require("../models");
const { validateMessage } = require("../utils/validation");
const { handleError } = require("../utils/errorHandler");
const logger = require("../utils/logger");
const {
  ensureAttachmentScanStateList,
} = require("../utils/virusScanState");
const { createNotificationForUser } = require("./notification.controller");

const toIdString = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value._id?.toString?.() || value.id?.toString?.() || value.toString?.();
  }
  return String(value);
};

/**
 * Extract authenticated user ID from request.
 * Supports gateway-injected user objects with id, _id, or sub fields.
 */
const getUserId = (req) => {
  const u = req.user;
  if (!u) throw new Error("Unauthenticated request — req.user is missing");
  return u._id || u.id || u.sub;
};

/**
 * Escape a string for safe use inside a RegExp.
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isMissingTextIndexError = (error) =>
  /text index required|text index/i.test(String(error?.message || ''));

// Create a new message
exports.createMessage = async (req, res) => {
  try {
    const { error } = validateMessage(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const {
      recipient,
      conversationId: bodyConversationId,
      content,
      messageType,
      attachments,
      relatedJob,
      relatedContract,
      encryptedBody,
      encryption,
    } = req.body;

    const safeAttachments = ensureAttachmentScanStateList(attachments);
    const hasAttachments = Array.isArray(safeAttachments) && safeAttachments.length > 0;
    const trimmedContent = typeof content === "string" ? content.trim() : "";
    const normalizedContent = trimmedContent || (hasAttachments ? "[Attachment]" : "");
    const normalizedMessageType =
      messageType === "mixed"
        ? hasAttachments
          ? "file"
          : "text"
        : messageType;

    const sender = req.user?._id || req.user?.id;

    // Resolve conversation — prefer explicit conversationId from body over
    // participant lookup so the frontend can always pass it and avoid a
    // second DB query.
    let conversation;
    if (bodyConversationId) {
      conversation = await Conversation.findOne({
        _id: bodyConversationId,
        participants: { $in: [sender] },
        status: { $ne: "deleted" },
      });
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found or access denied",
        });
      }
    } else {
      // Legacy path: find/create by participants
      conversation = await Conversation.findOne({
        participants: { $all: [sender, recipient] },
      });

      if (!conversation) {
        conversation = new Conversation({
          participants: [sender, recipient],
          relatedJob,
          relatedContract,
        });
        await conversation.save();
      }
    }

    // Derive recipient from conversation if not supplied
    const resolvedRecipient =
      recipient ||
      (conversation.participants || []).find((p) => String(p) !== String(sender))?.toString();

    if (!resolvedRecipient) {
      return res.status(400).json({
        success: false,
        message: "Unable to resolve message recipient",
      });
    }

    // Create the message with conversation reference
    const message = new Message({
      conversation: conversation._id,
      // Enforce sender as the authenticated user for security
      sender: req.user?._id || req.user?.id,
      recipient: resolvedRecipient,
      content: normalizedContent,
      messageType: normalizedMessageType,
      attachments: safeAttachments,
      relatedJob,
      relatedContract,
      metadata: {
        deviceInfo: req.headers["user-agent"],
        // Omit IP address for user privacy
      },
      ...(process.env.ENABLE_E2E_ENVELOPE === "true" && encryptedBody
        ? { encryptedBody, encryption }
        : {}),
    });

    await message.save();

    // Update conversation's last message
    conversation.lastMessage = message._id;
    if (resolvedRecipient) conversation.incrementUnreadCount(resolvedRecipient);
    await conversation.save();

    await message.populate("sender", "firstName lastName profilePicture");

    const messageData = {
      id: message._id,
      conversationId: conversation._id,
      senderId: toIdString(message.sender?._id || sender),
      sender: message.sender
        ? {
            id: message.sender._id,
            name: `${message.sender.firstName || ""} ${message.sender.lastName || ""}`.trim(),
            profilePicture: message.sender.profilePicture || null,
          }
        : null,
      recipient: resolvedRecipient,
      content: message.content,
      messageType: message.messageType,
      attachments: message.attachments,
      createdAt: message.createdAt,
      isRead: message.readStatus?.isRead || false,
      status: "sent",
      clientId: req.body?.clientId || null,
    };

    const io = req.app?.get?.("io");
    if (io) {
      const conversationRoom = `conversation_${conversation._id}`;
      io.to(conversationRoom).emit("new_message", messageData);
      io.to(conversationRoom).emit("receive_message", messageData);

      const recipientRoom = io.sockets?.adapter?.rooms?.get(
        `user_${String(resolvedRecipient)}`,
      );
      if (recipientRoom?.size) {
        io.to(conversationRoom).emit("message_delivered", {
          messageId: message._id,
          conversationId: conversation._id,
          deliveredAt: new Date(),
        });
        io.to(conversationRoom).emit("message-status", {
          messageId: message._id,
          conversationId: conversation._id,
          status: "delivered",
        });
      }
    }

    // Create preference-aware notification for recipient (with optional email)
    try {
      if (resolvedRecipient) {
        await createNotificationForUser(
          resolvedRecipient,
          {
            type: "message_received",
            title: "New Message",
            content: `You have received a new message${relatedJob ? " regarding a job" : ""}`,
            actionUrl: `/messages?conversation=${conversation._id}`,
            relatedEntity: { type: "message", id: message._id },
            priority: "low",
            metadata: { icon: "message", color: "info" },
          },
          { io },
        );
      }
    } catch (notifErr) {
      logger.warn("Message notification creation failed:", notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        ...message.toObject(),
        conversationId: conversation._id,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get messages for a conversation with pagination cursor support
exports.getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 20, before } = req.query;

    const userId = getUserId(req);

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: { $in: [userId] },
    });
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Scope messages strictly to THIS conversation by ID
    const baseQuery = {
      conversation: conversation._id,
    };
    if (before) {
      baseQuery.createdAt = { $lt: new Date(before) };
    }
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit)));
    const messages = await Message.find(baseQuery)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .populate("sender", "firstName lastName name profilePicture")
      .populate("recipient", "firstName lastName name profilePicture")
      .lean();

    // Mark unread messages in THIS conversation as read (scoped by conversation ID)
    await Message.updateMany(
      {
        conversation: conversation._id,
        recipient: userId,
        "readStatus.isRead": false,
      },
      {
        $set: {
          "readStatus.isRead": true,
          "readStatus.readAt": new Date(),
        },
      },
    );

    // Reset unread count (method mutates in-place; must save afterward)
    conversation.resetUnreadCount(userId);
    await conversation.save();

    const nextCursor =
      messages.length > 0 ? messages[messages.length - 1].createdAt : null;
    return res.json({
      success: true,
      data: {
        messages,
        pagination: {
          limit: parsedLimit,
          returned: messages.length,
          nextCursor,
        },
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== getUserId(req).toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this message" });
    }

    await message.deleteOne();

    return res.json({ message: "Message deleted successfully" });
  } catch (error) {
    handleError(res, error);
  }
};

// Edit a message (sender-only)
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body || {};
    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });
    if (String(message.sender) !== String(getUserId(req))) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this message" });
    }
    message.content = content.trim();
    message.editedAt = new Date();
    await message.save();
    return res.json({
      success: true,
      data: {
        id: message._id,
        content: message.content,
        editedAt: message.editedAt,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// Add a reaction to a message
exports.addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body || {};
    if (!emoji || typeof emoji !== "string")
      return res.status(400).json({ message: "emoji required" });
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    // Verify the user is a participant of the conversation
    const conversation = await Conversation.findOne({
      _id: message.conversation,
      participants: getUserId(req),
    });
    if (!conversation) {
      return res.status(403).json({ message: "Not a participant of this conversation" });
    }

    message.reactions = message.reactions || [];
    const existing = message.reactions.find(
      (r) => r.emoji === emoji && String(r.user) === String(getUserId(req)),
    );
    if (!existing) {
      message.reactions.push({
        emoji,
        user: getUserId(req),
        addedAt: new Date(),
      });
      await message.save();
    }
    return res.json({
      success: true,
      data: { id: message._id, reactions: message.reactions },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// Remove a reaction
exports.removeReaction = async (req, res) => {
  try {
    const { messageId, emoji } = req.params;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    // Verify conversation membership
    const conversation = await Conversation.findOne({
      _id: message.conversation,
      participants: getUserId(req),
    });
    if (!conversation) {
      return res.status(403).json({ message: "Not a participant of this conversation" });
    }

    message.reactions = (message.reactions || []).filter(
      (r) => !(r.emoji === emoji && String(r.user) === String(getUserId(req))),
    );
    await message.save();
    return res.json({
      success: true,
      data: { id: message._id, reactions: message.reactions },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// Get unread message count (optimized aggregation)
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await Conversation.aggregate([
      { $match: { participants: new (require("mongoose").Types.ObjectId)(userId) } },
      { $unwind: "$unreadCounts" },
      { $match: { "unreadCounts.user": new (require("mongoose").Types.ObjectId)(userId) } },
      { $group: { _id: null, total: { $sum: "$unreadCounts.count" } } },
    ]);
    const totalUnread = result.length > 0 ? result[0].total : 0;
    return res.json({ unreadCount: totalUnread });
  } catch (error) {
    handleError(res, error);
  }
};

// Search messages with filters (query, attachments, period, sender)
exports.searchMessages = async (req, res) => {
  try {
    const { q, attachments, period, sender } = req.query;
    const userId = getUserId(req);

    // Scope: only messages involving the current user
    const baseScope = {
      $or: [{ sender: userId }, { recipient: userId }],
    };

    const andFilters = [];

    const rawQuery = typeof q === 'string' ? q.trim() : '';

    if (attachments === "true") {
      // Check if at least one attachment exists
      andFilters.push({ "attachments.0": { $exists: true } });
    }

    if (sender) {
      andFilters.push({ sender });
    }

    if (period && ["today", "week", "month"].includes(period)) {
      const now = new Date();
      let start;
      switch (period) {
        case "today":
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "week":
          start = new Date(now);
          start.setDate(start.getDate() - 7);
          break;
        case "month":
          start = new Date(now);
          start.setMonth(start.getMonth() - 1);
          break;
      }
      andFilters.push({ createdAt: { $gte: start } });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const searchLimit = Math.min(100, parseInt(req.query.limit, 10) || 50);

    const fetchMessages = async (useTextSearch) => {
      const scopedFilters = [...andFilters];

      if (rawQuery) {
        if (useTextSearch) {
          scopedFilters.push({ $text: { $search: rawQuery } });
        } else {
          const safeQ = escapeRegex(rawQuery);
          scopedFilters.push({ content: { $regex: safeQ, $options: 'i' } });
        }
      }

      const query =
        scopedFilters.length > 0
          ? { $and: [baseScope, ...scopedFilters] }
          : baseScope;

      let cursor = Message.find(query)
        .skip((page - 1) * searchLimit)
        .limit(searchLimit)
        .populate('conversation', 'metadata.title')
        .populate('sender', 'firstName lastName name profilePicture')
        .populate('recipient', 'firstName lastName name profilePicture');

      if (rawQuery && useTextSearch) {
        cursor = cursor
          .sort({ score: { $meta: 'textScore' }, createdAt: -1 });
      } else {
        cursor = cursor.sort({ createdAt: -1 });
      }

      return cursor.lean();
    };

    let messages;
    try {
      messages = await fetchMessages(Boolean(rawQuery));
    } catch (error) {
      if (!rawQuery || !isMissingTextIndexError(error)) {
        throw error;
      }

      messages = await fetchMessages(false);
    }

    const results = messages.map((m) => {
      return {
        id: m._id,
        conversation: {
          id: m.conversation?._id || null,
          title: m.conversation?.metadata?.title || 'Conversation',
        },
        sender: m.sender,
        recipient: m.recipient,
        content: m.content,
        attachments: m.attachments || [],
        createdAt: m.createdAt,
      };
    });

    return res.json({ success: true, data: { messages: results } });
  } catch (error) {
    handleError(res, error);
  }
};
