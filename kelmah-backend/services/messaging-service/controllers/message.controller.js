const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const Notification = require("../models/Notification");
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
      sender,
      recipient,
      content,
      messageType,
      attachments,
      relatedJob,
      relatedContract,
    } = req.body;

    // Create the message
    const message = new Message({
      sender,
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

// Get messages for a conversation
exports.getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: { $in: conversation.participants } },
        { recipient: req.user._id, sender: { $in: conversation.participants } },
      ],
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("sender", "name profilePicture")
      .populate("recipient", "name profilePicture");

    // Mark messages as read
    await Message.updateMany(
      {
        recipient: req.user._id,
        readStatus: { isRead: false },
      },
      {
        $set: {
          "readStatus.isRead": true,
          "readStatus.readAt": new Date(),
        },
      },
    );

    // Reset unread count
    await conversation.resetUnreadCount(req.user._id);

    res.json({
      messages,
      totalPages: Math.ceil(messages.length / limit),
      currentPage: page,
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
