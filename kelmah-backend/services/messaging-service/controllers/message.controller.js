const { Message, Conversation, Notification } = require("../models");
const { validateMessage } = require("../utils/validation");
const { handleError } = require("../utils/errorHandler");
const {
  ensureAttachmentScanStateList,
} = require("../utils/virusScanState");
const { createNotificationForUser } = require("./notification.controller");

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

// Create a new message
exports.createMessage = async (req, res) => {
  try {
    const { error } = validateMessage(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const {
      recipient,
      content,
      messageType,
      attachments,
      relatedJob,
      relatedContract,
      encryptedBody,
      encryption,
    } = req.body;

    const sender = req.user?._id || req.user?.id;

    // Create the message
    const message = new Message({
      // Enforce sender as the authenticated user for security
      sender: req.user?._id || req.user?.id,
      recipient,
      content,
      messageType,
      attachments: ensureAttachmentScanStateList(attachments),
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

    // Update or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [sender, recipient] },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [sender, recipient],
        relatedJob,
        relatedContract,
      });
    }

    conversation.lastMessage = message._id;
    conversation.incrementUnreadCount(recipient);
    await conversation.save();

    // Create preference-aware notification for recipient (with optional email)
    try {
      await createNotificationForUser(
        recipient,
        {
          type: "message_received",
          title: "New Message",
          content: `You have received a new message${relatedJob ? " regarding a job" : ""}`,
          actionUrl: `/messages/${conversation._id}`,
          relatedEntity: { type: "message", id: message._id },
          priority: "low",
          metadata: { icon: "message", color: "info" },
        },
        { io: req.app?.get?.("io") },
      );
    } catch (notifErr) {
      console.warn("Message notification creation failed:", notifErr.message);
    }

    res.status(201).json({
      message: "Message sent successfully",
      data: message,
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

    // Scope messages strictly to THIS conversation's participants only
    // Both sender AND recipient must be participants of this conversation
    const participants = conversation.participants.map(String);
    const baseQuery = {
      sender: { $in: participants },
      recipient: { $in: participants },
      $or: [
        { sender: userId },
        { recipient: userId },
      ],
    };
    if (before) {
      baseQuery.createdAt = { $lt: new Date(before) };
    }
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit)));
    const messages = await Message.find(baseQuery)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .populate("sender", "firstName lastName name profilePicture")
      .populate("recipient", "firstName lastName name profilePicture");

    // Mark unread messages in THIS conversation as read (scoped to participants)
    await Message.updateMany(
      {
        recipient: userId,
        sender: { $in: participants },
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
    res.json({
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

    res.json({ message: "Message deleted successfully" });
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
    res.json({ unreadCount: totalUnread });
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

    if (q && typeof q === "string") {
      // Escape regex special characters to prevent NoSQL regex injection/DoS
      const safeQ = escapeRegex(q.trim());
      andFilters.push({ content: { $regex: safeQ, $options: "i" } });
    }

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

    const query =
      andFilters.length > 0 ? { $and: [baseScope, ...andFilters] } : baseScope;

    const [messages, conversations] = await Promise.all([
      Message.find(query)
        .sort({ createdAt: -1 })
        .limit(100)
        .populate("sender", "firstName lastName name profilePicture")
        .populate("recipient", "firstName lastName name profilePicture"),
      Conversation.find({ participants: userId }).select(
        "_id participants title",
      ),
    ]);

    // Build a quick lookup map by participant pair "a:b"
    const convByPair = new Map();
    conversations.forEach((c) => {
      if (Array.isArray(c.participants) && c.participants.length === 2) {
        const [a, b] = c.participants.map((p) => p.toString()).sort();
        convByPair.set(`${a}:${b}`, c);
      }
    });

    const results = messages.map((m) => {
      const a = m.sender?._id?.toString?.() || m.sender.toString();
      const b = m.recipient?._id?.toString?.() || m.recipient.toString();
      const key = [a, b].sort().join(":");
      const conv = convByPair.get(key);
      return {
        id: m._id,
        conversation: conv
          ? { id: conv._id, title: conv.title || "Conversation" }
          : { id: null, title: "Conversation" },
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
