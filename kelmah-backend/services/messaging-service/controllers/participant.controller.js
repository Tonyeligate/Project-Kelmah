/**
 * Participant Controller
 * Handles API requests for conversation participants
 */

const { v4: uuidv4 } = require('uuid');
const { sequelize, Conversation, Participant, Message } = require('../models');
const logger = require('../utils/logger');

/**
 * Get participants for a conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getParticipants = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    // Check if user is a participant
    const userParticipant = await Participant.findOne({
      where: {
        userId,
        conversationId
      }
    });
    
    if (!userParticipant) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You are not a participant in this conversation'
      });
    }
    
    // Get all participants with user details
    const participants = await Participant.findAll({
      where: { conversationId },
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'email', 'status']
        }
      ]
    });
    
    // Format the response
    const formattedParticipants = participants.map(participant => ({
      id: participant.id,
      userId: participant.userId,
      role: participant.role,
      status: participant.status,
      lastReadAt: participant.lastReadAt,
      lastTypingAt: participant.lastTypingAt,
      joinedAt: participant.createdAt,
      user: {
        id: participant.user.id,
        name: `${participant.user.firstName} ${participant.user.lastName}`,
        avatar: participant.user.avatar,
        email: participant.user.email,
        status: participant.user.status
      }
    }));
    
    return res.status(200).json({
      success: true,
      data: formattedParticipants
    });
  } catch (error) {
    logger.error(`Error getting participants: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Could not retrieve participants'
    });
  }
};

/**
 * Add a participant to a conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.addParticipant = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { conversationId } = req.params;
    const { userId, role = 'member' } = req.body;
    const requesterId = req.user.id;
    
    if (!userId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'User ID is required'
      });
    }
    
    // Check if conversation exists
    const conversation = await Conversation.findByPk(conversationId, { transaction });
    
    if (!conversation) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Conversation not found'
      });
    }
    
    // Check if requester is an admin if the conversation is a group
    if (conversation.type === 'group') {
      const requesterParticipant = await Participant.findOne({
        where: {
          conversationId,
          userId: requesterId,
          role: 'admin'
        },
        transaction
      });
      
      if (!requesterParticipant) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only admins can add participants to a group conversation'
        });
      }
    } else if (conversation.type === 'direct') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Cannot add participants to a direct conversation'
      });
    }
    
    // Check if user is already a participant
    const existingParticipant = await Participant.findOne({
      where: {
        conversationId,
        userId
      },
      transaction
    });
    
    if (existingParticipant) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'User is already a participant in this conversation'
      });
    }
    
    // Add the participant
    const participant = await Participant.create({
      id: uuidv4(),
      conversationId,
      userId,
      role,
      status: 'active'
    }, { transaction });
    
    // Create a system message about the new participant
    await Message.create({
      id: uuidv4(),
      conversationId,
      senderId: requesterId,
      content: `User was added to the conversation`,
      type: 'system',
      metadata: {
        event: 'participant_added',
        addedBy: requesterId,
        addedUser: userId
      }
    }, { transaction });
    
    // Update conversation's last message timestamp
    await conversation.update(
      { lastMessageAt: new Date() },
      { transaction }
    );
    
    await transaction.commit();
    
    // Get the participant with user details
    const participantWithUser = await Participant.findOne({
      where: { id: participant.id },
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'email', 'status']
        }
      ]
    });
    
    // Format the response
    const formattedParticipant = {
      id: participantWithUser.id,
      userId: participantWithUser.userId,
      role: participantWithUser.role,
      status: participantWithUser.status,
      joinedAt: participantWithUser.createdAt,
      user: {
        id: participantWithUser.user.id,
        name: `${participantWithUser.user.firstName} ${participantWithUser.user.lastName}`,
        avatar: participantWithUser.user.avatar,
        email: participantWithUser.user.email,
        status: participantWithUser.user.status
      }
    };
    
    return res.status(201).json({
      success: true,
      data: formattedParticipant
    });
  } catch (error) {
    await transaction.rollback();
    logger.error(`Error adding participant: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Could not add participant'
    });
  }
};

/**
 * Remove a participant from a conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.removeParticipant = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { conversationId, participantId } = req.params;
    const requesterId = req.user.id;
    
    // Get the participant to be removed
    const participant = await Participant.findOne({
      where: { id: participantId, conversationId },
      transaction
    });
    
    if (!participant) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Participant not found in this conversation'
      });
    }
    
    // Check if conversation exists
    const conversation = await Conversation.findByPk(conversationId, { transaction });
    
    if (!conversation) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Conversation not found'
      });
    }
    
    const userToRemoveId = participant.userId;
    
    // Check permissions for removal
    if (conversation.type === 'group') {
      // In group chats:
      // 1. Admins can remove any member
      // 2. Users can remove themselves
      
      if (userToRemoveId !== requesterId) {
        // Trying to remove someone else - check if requester is admin
        const requesterParticipant = await Participant.findOne({
          where: {
            conversationId,
            userId: requesterId,
            role: 'admin'
          },
          transaction
        });
        
        if (!requesterParticipant) {
          await transaction.rollback();
          return res.status(403).json({
            success: false,
            error: 'Forbidden',
            message: 'Only admins can remove other participants'
          });
        }
        
        // Cannot remove another admin if you're an admin
        if (participant.role === 'admin' && requesterParticipant.role === 'admin') {
          await transaction.rollback();
          return res.status(403).json({
            success: false,
            error: 'Forbidden',
            message: 'Admins cannot remove other admins'
          });
        }
      }
    } else if (conversation.type === 'direct') {
      // Only allow leaving the conversation (removing yourself)
      if (userToRemoveId !== requesterId) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You can only remove yourself from a direct conversation'
        });
      }
    }
    
    // Remove the participant
    await participant.destroy({ transaction });
    
    // Create a system message about the participant removal
    const removedByUser = userToRemoveId === requesterId ? 'left' : 'was removed from';
    
    await Message.create({
      id: uuidv4(),
      conversationId,
      senderId: requesterId,
      content: `User ${removedByUser} the conversation`,
      type: 'system',
      metadata: {
        event: userToRemoveId === requesterId ? 'participant_left' : 'participant_removed',
        removedBy: requesterId,
        removedUser: userToRemoveId
      }
    }, { transaction });
    
    // Update conversation's last message timestamp
    await conversation.update(
      { lastMessageAt: new Date() },
      { transaction }
    );
    
    await transaction.commit();
    
    return res.status(200).json({
      success: true,
      message: 'Participant removed successfully'
    });
  } catch (error) {
    await transaction.rollback();
    logger.error(`Error removing participant: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Could not remove participant'
    });
  }
};

/**
 * Update a participant's role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateRole = async (req, res) => {
  try {
    const { conversationId, participantId } = req.params;
    const { role } = req.body;
    const requesterId = req.user.id;
    
    if (!role || !['admin', 'member'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Valid role (admin or member) is required'
      });
    }
    
    // Check if conversation exists and is a group
    const conversation = await Conversation.findByPk(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Conversation not found'
      });
    }
    
    if (conversation.type !== 'group') {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Roles can only be updated in group conversations'
      });
    }
    
    // Check if requester is an admin
    const requesterParticipant = await Participant.findOne({
      where: {
        conversationId,
        userId: requesterId,
        role: 'admin'
      }
    });
    
    if (!requesterParticipant) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only admins can update participant roles'
      });
    }
    
    // Get the participant to update
    const participant = await Participant.findOne({
      where: { id: participantId, conversationId }
    });
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Participant not found'
      });
    }
    
    // Cannot change your own role
    if (participant.userId === requesterId) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'You cannot change your own role'
      });
    }
    
    // Update the role
    await participant.update({ role });
    
    // Create a system message about the role change
    await Message.create({
      id: uuidv4(),
      conversationId,
      senderId: requesterId,
      content: `User role was updated to ${role}`,
      type: 'system',
      metadata: {
        event: 'role_updated',
        updatedBy: requesterId,
        updatedUser: participant.userId,
        newRole: role,
        previousRole: participant.role
      }
    });
    
    // Update conversation's last message timestamp
    await conversation.update({ lastMessageAt: new Date() });
    
    return res.status(200).json({
      success: true,
      data: {
        id: participant.id,
        userId: participant.userId,
        role: participant.role,
        status: participant.status
      }
    });
  } catch (error) {
    logger.error(`Error updating participant role: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Could not update participant role'
    });
  }
}; 