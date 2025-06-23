const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

/**
 * Get all conversations for current user
 */
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'firstName lastName profilePicture')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'firstName lastName' } })
      .sort('-updatedAt');
    return successResponse(res, 200, 'Conversations retrieved successfully', conversations);
  } catch (error) {
    return next(error);
  }
};

/**
 * Create a new conversation or return existing
 */
exports.createConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { participantId } = req.body;
    const ids = [userId, participantId];
    let conversation = await Conversation.findOne({ participants: { $all: ids, $size: 2 } });
    if (!conversation) {
      conversation = await Conversation.create({ participants: ids });
    }
    return successResponse(res, conversation.createdAt === conversation.updatedAt ? 201 : 200, 'Conversation ready', conversation);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get messages for a specific conversation
 */
exports.getMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const convoId = req.params.id;
    const conversation = await Conversation.findById(convoId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return errorResponse(res, 403, 'Not authorized to view messages');
    }
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const total = await Message.countDocuments({ conversation: convoId });
    const messages = await Message.find({ conversation: convoId })
      .populate('sender', 'firstName lastName profilePicture')
      .sort('createdAt')
      .skip(skip)
      .limit(limit);
    return paginatedResponse(res, 200, 'Messages retrieved successfully', messages, page, limit, total);
  } catch (error) {
    return next(error);
  }
};

/**
 * Send a new message in a conversation
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const convoId = req.params.id;
    const { content, type, attachment } = req.body;
    const conversation = await Conversation.findById(convoId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return errorResponse(res, 403, 'Not authorized to send message');
    }
    const message = await Message.create({ conversation: convoId, sender: userId, content, type, attachment });
    // Update conversation
    conversation.lastMessage = message._id;
    conversation.unreadCount += 1;
    await conversation.save();
    const populated = await message.populate('sender', 'firstName lastName');
    // Emit new message to real-time message sockets
    const io = req.app.get('io');
    if (io) {
      io.to(convoId.toString()).emit('message', populated);
    }
    // Emit dashboard update for new message to dashboard sockets
    const dashboardSocket = req.app.get('dashboardSocket');
    if (dashboardSocket) {
      conversation.participants.forEach(participantId => {
        dashboardSocket.emitUpdate(participantId.toString(), {
          type: 'newMessage',
          conversationId: convoId,
          message: populated
        });
      });
    }
    return successResponse(res, 201, 'Message sent', populated);
  } catch (error) {
    return next(error);
  }
};

/**
 * Mark all messages in a conversation as read
 */
exports.markRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const convoId = req.params.id;
    const conversation = await Conversation.findById(convoId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return errorResponse(res, 403, 'Not authorized');
    }
    await Message.updateMany({ conversation: convoId, sender: { $ne: userId } }, { isRead: true });
    conversation.unreadCount = 0;
    await conversation.save();
    // Emit read receipt to real-time message sockets
    const io = req.app.get('io');
    if (io) {
      io.to(convoId.toString()).emit('read', { conversationId: convoId, userId });
    }
    return successResponse(res, 200, 'Conversation marked as read');
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete a specific message
 */
exports.deleteMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const msgId = req.params.id;
    const message = await Message.findById(msgId);
    if (!message) {
      return errorResponse(res, 404, 'Message not found');
    }
    if (message.sender.toString() !== userId) {
      return errorResponse(res, 403, 'Not authorized to delete this message');
    }
    await message.remove();
    return successResponse(res, 200, 'Message deleted');
  } catch (error) {
    return next(error);
  }
};

/**
 * Get messaging statistics for current user
 */
exports.getStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const unreadConversations = await Conversation.countDocuments({ participants: userId, unreadCount: { $gt: 0 } });
    return successResponse(res, 200, 'Stats retrieved', { unreadConversations });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get conversation details by ID
 */
exports.getConversationById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const convoId = req.params.id;
    const conversation = await Conversation.findById(convoId)
      .populate('participants', 'firstName lastName profilePicture')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'firstName lastName' } });
    if (!conversation || !conversation.participants.some(p => p._id.toString() === userId)) {
      return errorResponse(res, 403, 'Not authorized to view this conversation');
    }
    return successResponse(res, 200, 'Conversation retrieved successfully', conversation);
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete a conversation and its messages
 */
exports.deleteConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const convoId = req.params.id;
    const conversation = await Conversation.findById(convoId);
    if (!conversation) {
      return errorResponse(res, 404, 'Conversation not found');
    }
    if (!conversation.participants.includes(userId)) {
      return errorResponse(res, 403, 'Not authorized to delete this conversation');
    }
    // Remove all messages
    await Message.deleteMany({ conversation: convoId });
    // Remove conversation
    await conversation.remove();
    return successResponse(res, 200, 'Conversation deleted successfully');
  } catch (error) {
    return next(error);
  }
};

/**
 * Get unread conversations count
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const unreadConversations = await Conversation.countDocuments({ participants: userId, unreadCount: { $gt: 0 } });
    return successResponse(res, 200, 'Unread count retrieved', { unreadConversations });
  } catch (error) {
    return next(error);
  }
}; 