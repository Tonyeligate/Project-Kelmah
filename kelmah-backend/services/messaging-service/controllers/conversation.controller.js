/**
 * Conversation Controller
 * Handles API requests for conversations
 */

const { v4: uuidv4 } = require('uuid');
const { sequelize, Conversation, Message, Participant } = require('../models');
const logger = require('../utils/logger');

/**
 * Get all conversations for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, archived = false } = req.query;
    
    // Find all conversations where user is a participant
    const participants = await Participant.findAll({
      where: {
        userId,
        isArchived: archived === 'true'
      },
      include: [
        {
        model: Conversation,
        as: 'conversation',
          include: [
            {
          model: Participant,
              as: 'participants',
              include: [
                {
                  model: sequelize.models.User,
                  as: 'user',
                  attributes: ['id', 'firstName', 'lastName', 'avatar']
                }
              ]
            },
            {
              model: Message,
              as: 'messages',
              limit: 1,
              order: [['createdAt', 'DESC']],
              include: [
                {
                  model: sequelize.models.User,
                  as: 'sender',
                  attributes: ['id', 'firstName', 'lastName']
                }
              ]
            }
          ]
        }
      ],
      order: [
        [{ model: Conversation, as: 'conversation' }, 'lastMessageAt', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    // Transform data for response
    const conversations = participants.map(participant => {
        const conversation = participant.conversation;
      const lastMessage = conversation.messages[0];
      
      // For direct conversations, get the other user
      let otherUser = null;
      if (conversation.type === 'direct') {
        otherUser = conversation.participants.find(p => p.userId !== userId)?.user || null;
      }
        
        return {
          id: conversation.id,
        name: conversation.type === 'direct' ? 
          `${otherUser?.firstName} ${otherUser?.lastName}` : 
          conversation.name,
          type: conversation.type,
        avatar: conversation.type === 'direct' ? otherUser?.avatar : conversation.avatar,
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            content: lastMessage.content,
          type: lastMessage.type,
            senderId: lastMessage.senderId,
          senderName: `${lastMessage.sender.firstName} ${lastMessage.sender.lastName}`,
            createdAt: lastMessage.createdAt,
          status: lastMessage.status
          } : null,
        unreadCount: participant.unreadCount || 0,
        participants: conversation.participants.map(p => ({
          id: p.userId,
          name: `${p.user.firstName} ${p.user.lastName}`,
          avatar: p.user.avatar,
          role: p.role
        })),
          createdAt: conversation.createdAt,
        lastActivity: conversation.lastMessageAt || conversation.createdAt
        };
    });
    
    // Get total count for pagination
    const totalCount = await Participant.count({
      where: {
        userId,
        isArchived: archived === 'true'
      }
    });
    
    return res.status(200).json({
      success: true,
      data: conversations,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: totalCount > parseInt(offset) + parseInt(limit)
      }
    });
  } catch (error) {
    logger.error(`Error fetching conversations: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Could not retrieve conversations'
    });
  }
};

/**
 * Get conversation by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getConversationById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Check if user is participant in conversation
    const participant = await Participant.findOne({
      where: {
        userId,
        conversationId: id
      }
    });
    
    if (!participant) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You are not a participant in this conversation'
      });
    }
    
    // Get conversation with details
    const conversation = await Conversation.findByPk(id, {
      include: [
        {
        model: Participant,
          as: 'participants',
          include: [
            {
              model: sequelize.models.User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'avatar']
            }
          ]
        },
        {
          model: Message,
          as: 'messages',
          limit: 1,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: sequelize.models.User,
              as: 'sender',
              attributes: ['id', 'firstName', 'lastName']
            }
          ]
        }
      ]
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Conversation not found'
      });
    }
    
    // Format response
    const lastMessage = conversation.messages[0];
    
    // For direct conversations, get the other user
    let otherUser = null;
    if (conversation.type === 'direct') {
      otherUser = conversation.participants.find(p => p.userId !== userId)?.user || null;
    }
    
    const result = {
      id: conversation.id,
      name: conversation.type === 'direct' ? 
        `${otherUser?.firstName} ${otherUser?.lastName}` : 
        conversation.name,
      type: conversation.type,
      avatar: conversation.type === 'direct' ? otherUser?.avatar : conversation.avatar,
      createdBy: conversation.createdBy,
      lastMessage: lastMessage ? {
        id: lastMessage.id,
        content: lastMessage.content,
        type: lastMessage.type,
        senderId: lastMessage.senderId,
        senderName: `${lastMessage.sender.firstName} ${lastMessage.sender.lastName}`,
        createdAt: lastMessage.createdAt
      } : null,
      participants: conversation.participants.map(p => ({
        id: p.userId,
        name: `${p.user.firstName} ${p.user.lastName}`,
        avatar: p.user.avatar,
        role: p.role,
        isTyping: p.isTyping,
        lastTypingAt: p.lastTypingAt,
        lastReadAt: p.lastReadAt,
        lastDeliveredAt: p.lastDeliveredAt
      })),
      createdAt: conversation.createdAt,
      lastActivity: conversation.lastMessageAt || conversation.createdAt,
      metadata: conversation.metadata
    };
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Error fetching conversation: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Could not retrieve conversation'
    });
  }
};

/**
 * Create a new conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createConversation = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const userId = req.user.id;
    const { participantIds, name, type = 'direct', metadata = {} } = req.body;
    
    // Validate request
    if (!participantIds || !Array.isArray(participantIds)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'participantIds is required and must be an array'
      });
    }
    
    // Ensure userId is included in participants
    if (!participantIds.includes(userId)) {
      participantIds.push(userId);
    }
    
    // For direct conversations, only allow 2 participants
    if (type === 'direct' && participantIds.length !== 2) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Direct conversations must have exactly 2 participants'
      });
    }
    
    // For direct conversations, check if conversation already exists
    if (type === 'direct') {
      const otherUserId = participantIds.find(id => id !== userId);
      
      // Find existing direct conversation between these users
      const existingConversationParticipant = await Participant.findOne({
        where: { userId },
        include: [
          {
          model: Conversation,
          as: 'conversation',
            where: { type: 'direct' },
            include: [
              {
                model: Participant,
                as: 'participants',
                where: { userId: otherUserId }
              }
            ]
          }
        ]
      });
      
      if (existingConversationParticipant) {
        await transaction.rollback();
        
        // Return existing conversation
          return res.status(200).json({
            success: true,
          data: {
            id: existingConversationParticipant.conversation.id,
            exists: true,
            message: 'Conversation already exists'
          }
        });
      }
    }
    
    // Create new conversation
    const conversation = await Conversation.create({
      id: uuidv4(),
      type,
      name: type === 'group' ? name : null,
      createdBy: userId,
      lastMessageAt: null,
      metadata
    }, { transaction });
    
    // Create participants
    const participants = [];
    
    for (const participantId of participantIds) {
      const isCreator = participantId === userId;
      
      const participant = await Participant.create({
        id: uuidv4(),
        userId: participantId,
        conversationId: conversation.id,
        role: isCreator ? 'admin' : 'regular'
      }, { transaction });
      
      participants.push(participant);
    }
    
    // Create system message
    if (type === 'group') {
      await Message.create({
        id: uuidv4(),
        conversationId: conversation.id,
        senderId: userId,
        content: 'Conversation created',
        type: 'system',
        readAt: { [userId]: new Date().toISOString() }
      }, { transaction });
    }
    
    await transaction.commit();
    
    return res.status(201).json({
      success: true,
      data: {
        id: conversation.id,
        type: conversation.type,
        name: conversation.name,
        createdBy: conversation.createdBy,
        participantIds
      }
    });
  } catch (error) {
    await transaction.rollback();
    logger.error(`Error creating conversation: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Could not create conversation'
    });
  }
};

/**
 * Archive a conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.archiveConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Find participant entry
    const participant = await Participant.findOne({
      where: {
        userId,
        conversationId: id
      }
    });
    
    if (!participant) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You are not a participant in this conversation'
      });
    }
    
    // Update participant record
    await participant.update({ isArchived: true });
    
    return res.status(200).json({
      success: true,
      message: 'Conversation archived'
    });
  } catch (error) {
    logger.error(`Error archiving conversation: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Could not archive conversation'
    });
  }
};

/**
 * Unarchive a conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.unarchiveConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Find participant entry
    const participant = await Participant.findOne({
      where: {
        userId,
        conversationId: id
      }
    });
    
    if (!participant) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You are not a participant in this conversation'
      });
    }
    
    // Update participant record
    await participant.update({ isArchived: false });
    
    return res.status(200).json({
      success: true,
      message: 'Conversation restored from archive'
    });
  } catch (error) {
    logger.error(`Error unarchiving conversation: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Could not unarchive conversation'
    });
  }
};

/**
 * Leave a conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.leaveConversation = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Find conversation
    const conversation = await Conversation.findByPk(id, { transaction });
    
    if (!conversation) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Conversation not found'
      });
    }
    
    // Check if direct conversation
    if (conversation.type === 'direct') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Cannot leave a direct conversation, archive it instead'
      });
    }
    
    // Find participant
    const participant = await Participant.findOne({
      where: {
        userId,
        conversationId: id
      },
      transaction
    });
    
    if (!participant) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You are not a participant in this conversation'
      });
    }
    
    // Delete participant
    await participant.destroy({ transaction });
    
    // Add system message
      await Message.create({
      id: uuidv4(),
        conversationId: id,
        senderId: userId,
      content: 'Left the conversation',
        type: 'system'
      }, { transaction });
    
    // Check if this was the last participant
    const remainingParticipants = await Participant.count({
      where: { conversationId: id },
      transaction
    });
    
    // If no participants left, delete the conversation
    if (remainingParticipants === 0) {
      await conversation.destroy({ transaction });
    }
    
    await transaction.commit();
    
    return res.status(200).json({
      success: true,
      message: 'Left the conversation',
      conversationDeleted: remainingParticipants === 0
    });
  } catch (error) {
    await transaction.rollback();
    logger.error(`Error leaving conversation: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Could not leave conversation'
    });
  }
}; 