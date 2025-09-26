const { Message, Conversation, Notification } = require('../models');
const { validateMessage } = require("../utils/validation");
const { handleError } = require("../utils/errorHandler");

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
      encryption
    } = req.body;

    // Create the message
    const message = new Message({
      // Enforce sender as the authenticated user for security
      sender: req.user?._id || req.user?.id,
      recipient,
      content,
      messageType,
      attachments,
      relatedJob,
      relatedContract,
      metadata: {
        deviceInfo: req.headers["user-agent"],
        ipAddress: req.ip,
      },
      ...(process.env.ENABLE_E2E_ENVELOPE === 'true' && encryptedBody ? { encryptedBody, encryption } : {}),
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
    await conversation.incrementUnreadCount(recipient);
    await conversation.save();

    // Create notification for recipient
    const notification = new Notification({
      recipient,
      type: "message_received",
      title: "New Message",
      content: `You have received a new message${relatedJob ? " regarding a job" : ""}`,
      actionUrl: `/messages/${conversation._id}`,
      relatedEntity: {
        type: "message",
        id: message._id,
      },
    });

    await notification.save();

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
    const { page = 1, limit = 20, before } = req.query;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Fetch strictly within the conversation participants, sorted desc
    const baseQuery = {
      $or: [
        { sender: req.user._id, recipient: { $in: conversation.participants } },
        { recipient: req.user._id, sender: { $in: conversation.participants } },
      ],
    };
    if (before) {
      baseQuery.createdAt = { $lt: new Date(before) };
    }
    const messages = await Message.find(baseQuery)
      .sort({ createdAt: -1 })
      .limit(Math.min(100, Math.max(1, parseInt(limit))))
      .populate("sender", "name profilePicture")
      .populate("recipient", "name profilePicture");

    // Mark messages as read
    await Message.updateMany(
      {
        recipient: req.user._id,
        'readStatus.isRead': false,
        // Scope only to this conversation participants
        $or: [
          { sender: { $in: conversation.participants }, recipient: req.user._id },
          { recipient: { $in: conversation.participants }, sender: req.user._id },
        ],
      },
      {
        $set: {
          'readStatus.isRead': true,
          'readStatus.readAt': new Date(),
        },
      },
    );

    // Reset unread count
    await conversation.resetUnreadCount(req.user._id);

    const nextCursor = messages.length > 0 ? messages[messages.length - 1].createdAt : null;
    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          limit: Math.min(100, Math.max(1, parseInt(limit))),
          returned: messages.length,
          nextCursor,
        }
      }
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

    if (message.sender.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this message" });
    }

    await message.remove();

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
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (String(message.sender) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to edit this message' });
    }
    message.content = content.trim();
    message.editedAt = new Date();
    await message.save();
    return res.json({ success: true, data: { id: message._id, content: message.content, editedAt: message.editedAt } });
  } catch (error) {
    return handleError(res, error);
  }
};

// Add a reaction to a message
exports.addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body || {};
    if (!emoji || typeof emoji !== 'string') return res.status(400).json({ message: 'emoji required' });
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    message.reactions = message.reactions || [];
    const existing = message.reactions.find((r) => r.emoji === emoji && String(r.user) === String(req.user._id));
    if (!existing) {
      message.reactions.push({ emoji, user: req.user._id, addedAt: new Date() });
      await message.save();
    }
    return res.json({ success: true, data: { id: message._id, reactions: message.reactions } });
  } catch (error) {
    return handleError(res, error);
  }
};

// Remove a reaction
exports.removeReaction = async (req, res) => {
  try {
    const { messageId, emoji } = req.params;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    message.reactions = (message.reactions || []).filter((r) => !(r.emoji === emoji && String(r.user) === String(req.user._id)));
    await message.save();
    return res.json({ success: true, data: { id: message._id, reactions: message.reactions } });
  } catch (error) {
    return handleError(res, error);
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    });

    const totalUnread = conversations.reduce((sum, conv) => {
      const unreadCount = conv.unreadCounts.find(
        (count) => count.user.toString() === req.user._id.toString(),
      );
      return sum + (unreadCount ? unreadCount.count : 0);
    }, 0);

    res.json({ unreadCount: totalUnread });
  } catch (error) {
    handleError(res, error);
  }
};

// Search messages with filters (query, attachments, period, sender)
exports.searchMessages = async (req, res) => {
  try {
    const { q, attachments, period, sender } = req.query;

    // Scope: only messages involving the current user
    const baseScope = { $or: [ { sender: req.user._id }, { recipient: req.user._id } ] };

    const andFilters = [];

    if (q && typeof q === 'string') {
      andFilters.push({ content: { $regex: q, $options: 'i' } });
    }

    if (attachments === 'true') {
      // Check if at least one attachment exists
      andFilters.push({ 'attachments.0': { $exists: true } });
    }

    if (sender) {
      andFilters.push({ sender });
    }

    if (period && ['today', 'week', 'month'].includes(period)) {
      const now = new Date();
      let start;
      switch (period) {
        case 'today':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          start = new Date(now);
          start.setDate(start.getDate() - 7);
          break;
        case 'month':
          start = new Date(now);
          start.setMonth(start.getMonth() - 1);
          break;
      }
      andFilters.push({ createdAt: { $gte: start } });
    }

    const query = andFilters.length > 0 ? { $and: [baseScope, ...andFilters] } : baseScope;

    const [messages, conversations] = await Promise.all([
      Message.find(query)
        .sort({ createdAt: -1 })
        .limit(100)
        .populate('sender', 'name profilePicture')
        .populate('recipient', 'name profilePicture'),
      Conversation.find({ participants: req.user._id }).select('_id participants title'),
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
      const key = [a, b].sort().join(':');
      const conv = convByPair.get(key);
      return {
        id: m._id,
        conversation: conv ? { id: conv._id, title: conv.title || 'Conversation' } : { id: null, title: 'Conversation' },
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
