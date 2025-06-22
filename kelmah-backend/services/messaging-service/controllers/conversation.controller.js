const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { handleError } = require('../utils/errorHandler');

// Get all conversations for a user
exports.getUserConversations = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const conversations = await Conversation.find({
      participants: req.user._id,
      status: 'active'
    })
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('participants', 'name profilePicture')
      .populate('lastMessage')
      .populate('relatedJob', 'title')
      .populate('relatedContract', 'status');

    const totalConversations = await Conversation.countDocuments({
      participants: req.user._id,
      status: 'active'
    });

    res.json({
      conversations,
      totalPages: Math.ceil(totalConversations / limit),
      currentPage: page
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Create a new conversation
exports.createConversation = async (req, res) => {
  try {
    const { participants, relatedJob, relatedContract, metadata } = req.body;

    // Ensure the current user is included in participants
    if (!participants.includes(req.user._id.toString())) {
      participants.push(req.user._id);
    }

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      participants: { $all: participants },
      status: 'active'
    });

    if (existingConversation) {
      return res.status(200).json({
        message: 'Conversation already exists',
        data: existingConversation
      });
    }

    const conversation = new Conversation({
      participants,
      relatedJob,
      relatedContract,
      metadata
    });

    await conversation.save();

    res.status(201).json({
      message: 'Conversation created successfully',
      data: conversation
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Archive a conversation
exports.archiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    conversation.status = 'archived';
    await conversation.save();

    res.json({ message: 'Conversation archived successfully' });
  } catch (error) {
    handleError(res, error);
  }
};

// Get conversation details
exports.getConversationDetails = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    })
      .populate('participants', 'name profilePicture')
      .populate('lastMessage')
      .populate('relatedJob', 'title status')
      .populate('relatedContract', 'status');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    handleError(res, error);
  }
};

// Update conversation metadata
exports.updateConversationMetadata = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { metadata } = req.body;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    conversation.metadata = {
      ...conversation.metadata,
      ...metadata
    };

    await conversation.save();

    res.json({
      message: 'Conversation metadata updated successfully',
      data: conversation
    });
  } catch (error) {
    handleError(res, error);
  }
}; 