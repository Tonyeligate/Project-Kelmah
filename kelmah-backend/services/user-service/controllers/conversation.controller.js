const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');
const User = require('../models/user.model');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

const conversationController = {
  // Get all conversations for the authenticated user
  getUserConversations: async (req, res) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const conversations = await Conversation.findForUser(userId, parseInt(limit), offset);
      
      // Get total count for pagination
      const total = await Conversation.count({
        where: {
          participants: { [Op.contains]: [userId] },
          archivedByUserIds: { [Op.not]: sequelize.literal(`jsonb_exists(archived_by_user_ids, '${userId}')`) }
        }
      });

      // Get unread counts for each conversation
      const conversationsWithMeta = await Promise.all(conversations.map(async (conversation) => {
        const unreadCount = await Message.count({
          where: {
            conversationId: conversation.id,
            senderId: { [Op.ne]: userId },
            readStatus: {
              [Op.not]: sequelize.literal(`jsonb_exists(read_status, '${userId}')`)
            }
          }
        });

        // Fetch other participant user details for direct messages
        let otherParticipants = [];
        if (conversation.type === 'direct') {
          const otherUserIds = conversation.participants.filter(id => id !== userId);
          
          otherParticipants = await User.findAll({
            attributes: ['id', 'firstName', 'lastName', 'profileImage', 'lastOnline'],
            where: {
              id: {
                [Op.in]: otherUserIds
              }
            }
          });
        }

        return {
          ...conversation.toJSON(),
          unreadCount,
          otherParticipants
        };
      }));

      res.json({
        conversations: conversationsWithMeta,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  },

  // Get a single conversation by ID
  getConversation: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      const conversation = await Conversation.findOne({
        where: {
          id: conversationId,
          participants: { [Op.contains]: [userId] }
        }
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found or unauthorized' });
      }

      // Get unread count
      const unreadCount = await Message.count({
        where: {
          conversationId,
          senderId: { [Op.ne]: userId },
          readStatus: {
            [Op.not]: sequelize.literal(`jsonb_exists(read_status, '${userId}')`)
          }
        }
      });

      // Fetch participant details
      const participantIds = conversation.participants;
      const participants = await User.findAll({
        attributes: ['id', 'firstName', 'lastName', 'profileImage', 'lastOnline'],
        where: {
          id: {
            [Op.in]: participantIds
          }
        }
      });

      res.json({
        ...conversation.toJSON(),
        unreadCount,
        participants
      });
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({ error: 'Failed to fetch conversation' });
    }
  },

  // Create a new direct message conversation
  createDirectConversation: async (req, res) => {
    try {
      const { recipientId } = req.body;
      const senderId = req.user.id;

      if (senderId === recipientId) {
        return res.status(400).json({ error: 'Cannot create conversation with yourself' });
      }

      // Check if recipient exists
      const recipient = await User.findByPk(recipientId);
      if (!recipient) {
        return res.status(404).json({ error: 'Recipient user not found' });
      }

      // Find or create conversation
      const { conversation, created } = await Conversation.findOrCreateDirectMessage(senderId, recipientId);

      // Get participant details
      const participants = await User.findAll({
        attributes: ['id', 'firstName', 'lastName', 'profileImage', 'lastOnline'],
        where: {
          id: {
            [Op.in]: conversation.participants
          }
        }
      });

      res.status(created ? 201 : 200).json({
        ...conversation.toJSON(),
        participants,
        unreadCount: 0
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({ error: 'Failed to create conversation' });
    }
  },

  // Create a job-related conversation
  createJobConversation: async (req, res) => {
    try {
      const { jobId, workerUserId } = req.body;
      const hirerUserId = req.user.id;

      if (hirerUserId === workerUserId) {
        return res.status(400).json({ error: 'Cannot create conversation with yourself' });
      }

      // Check if worker exists
      const worker = await User.findByPk(workerUserId);
      if (!worker) {
        return res.status(404).json({ error: 'Worker user not found' });
      }

      // Find or create job conversation
      const { conversation, created } = await Conversation.findOrCreateJobConversation(jobId, hirerUserId, workerUserId);

      // Get participant details
      const participants = await User.findAll({
        attributes: ['id', 'firstName', 'lastName', 'profileImage', 'lastOnline'],
        where: {
          id: {
            [Op.in]: conversation.participants
          }
        }
      });

      res.status(created ? 201 : 200).json({
        ...conversation.toJSON(),
        participants,
        unreadCount: 0
      });
    } catch (error) {
      console.error('Error creating job conversation:', error);
      res.status(500).json({ error: 'Failed to create job conversation' });
    }
  },

  // Create a group conversation
  createGroupConversation: async (req, res) => {
    try {
      const { title, participantIds, description, avatar } = req.body;
      const creatorId = req.user.id;

      if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        return res.status(400).json({ error: 'At least one participant is required' });
      }

      if (!title) {
        return res.status(400).json({ error: 'Title is required for group conversations' });
      }

      // Create group conversation
      const { conversation } = await Conversation.createGroupConversation(
        title, 
        creatorId, 
        participantIds, 
        { description, avatar }
      );

      // Get participant details
      const participants = await User.findAll({
        attributes: ['id', 'firstName', 'lastName', 'profileImage', 'lastOnline'],
        where: {
          id: {
            [Op.in]: conversation.participants
          }
        }
      });

      res.status(201).json({
        ...conversation.toJSON(),
        participants,
        unreadCount: 0
      });
    } catch (error) {
      console.error('Error creating group conversation:', error);
      res.status(500).json({ error: 'Failed to create group conversation' });
    }
  },

  // Update a conversation
  updateConversation: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;
      const { title, description, avatar } = req.body;

      const conversation = await Conversation.findOne({
        where: {
          id: conversationId,
          participants: { [Op.contains]: [userId] }
        }
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found or unauthorized' });
      }

      // Check if user is admin for group chats
      if (conversation.type !== 'direct' && 
         !conversation.adminUserIds.includes(userId) && 
         conversation.createdBy !== userId) {
        return res.status(403).json({ error: 'Only admins can update this conversation' });
      }

      // Update allowed fields
      const updatedFields = {};
      
      if (title !== undefined && conversation.type !== 'direct') {
        updatedFields.title = title;
      }
      
      if (description !== undefined && conversation.type !== 'direct') {
        updatedFields.description = description;
      }
      
      if (avatar !== undefined && conversation.type !== 'direct') {
        updatedFields.avatar = avatar;
      }

      if (Object.keys(updatedFields).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      await conversation.update(updatedFields);

      res.json(conversation);
    } catch (error) {
      console.error('Error updating conversation:', error);
      res.status(500).json({ error: 'Failed to update conversation' });
    }
  },

  // Add participants to a group conversation
  addParticipants: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { participantIds } = req.body;
      const userId = req.user.id;

      if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        return res.status(400).json({ error: 'At least one participant ID is required' });
      }

      const conversation = await Conversation.findOne({
        where: {
          id: conversationId,
          participants: { [Op.contains]: [userId] }
        }
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found or unauthorized' });
      }

      // Check if user is admin for group chats
      if (conversation.type === 'direct') {
        return res.status(400).json({ error: 'Cannot add participants to direct conversations' });
      }

      if (!conversation.adminUserIds.includes(userId) && conversation.createdBy !== userId) {
        return res.status(403).json({ error: 'Only admins can add participants' });
      }

      // Add new participants
      const currentParticipants = new Set(conversation.participants);
      participantIds.forEach(id => currentParticipants.add(id));
      
      await conversation.update({
        participants: Array.from(currentParticipants)
      });

      res.json(conversation);
    } catch (error) {
      console.error('Error adding participants:', error);
      res.status(500).json({ error: 'Failed to add participants' });
    }
  },

  // Remove a participant from a group conversation
  removeParticipant: async (req, res) => {
    try {
      const { conversationId, participantId } = req.params;
      const userId = req.user.id;

      const conversation = await Conversation.findOne({
        where: {
          id: conversationId,
          participants: { [Op.contains]: [userId] }
        }
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found or unauthorized' });
      }

      // Check if user is admin or self-removing
      if (conversation.type === 'direct') {
        return res.status(400).json({ error: 'Cannot remove participants from direct conversations' });
      }

      const isAdmin = conversation.adminUserIds.includes(userId) || conversation.createdBy === userId;
      const isSelfRemoving = participantId === userId;

      if (!isAdmin && !isSelfRemoving) {
        return res.status(403).json({ error: 'Only admins can remove other participants' });
      }

      // Remove the participant
      const updatedParticipants = conversation.participants.filter(id => id !== participantId);
      
      // If removing the last participant, delete the conversation
      if (updatedParticipants.length === 0) {
        await conversation.destroy();
        return res.json({ message: 'Conversation deleted as all participants were removed' });
      }
      
      // If creator is removed, assign a new creator from admins
      let updatedAdmins = [...conversation.adminUserIds];
      let updatedCreator = conversation.createdBy;
      
      if (participantId === conversation.createdBy) {
        if (updatedAdmins.length > 0) {
          // Find a new creator from admins
          updatedCreator = updatedAdmins[0];
        } else if (updatedParticipants.length > 0) {
          // If no admins left, assign first participant
          updatedCreator = updatedParticipants[0];
        }
      }
      
      // Remove from admins if applicable
      if (conversation.adminUserIds.includes(participantId)) {
        updatedAdmins = updatedAdmins.filter(id => id !== participantId);
      }

      await conversation.update({
        participants: updatedParticipants,
        adminUserIds: updatedAdmins,
        createdBy: updatedCreator
      });

      res.json(conversation);
    } catch (error) {
      console.error('Error removing participant:', error);
      res.status(500).json({ error: 'Failed to remove participant' });
    }
  },

  // Archive a conversation for a user
  archiveConversation: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      const conversation = await Conversation.findOne({
        where: {
          id: conversationId,
          participants: { [Op.contains]: [userId] }
        }
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found or unauthorized' });
      }

      // Add user to archived list if not already there
      const archivedByUserIds = new Set(conversation.archivedByUserIds || []);
      archivedByUserIds.add(userId);
      
      await conversation.update({
        archivedByUserIds: Array.from(archivedByUserIds)
      });

      res.json({ message: 'Conversation archived successfully' });
    } catch (error) {
      console.error('Error archiving conversation:', error);
      res.status(500).json({ error: 'Failed to archive conversation' });
    }
  },

  // Unarchive a conversation for a user
  unarchiveConversation: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      const conversation = await Conversation.findOne({
        where: {
          id: conversationId,
          participants: { [Op.contains]: [userId] }
        }
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found or unauthorized' });
      }

      // Remove user from archived list
      const archivedByUserIds = (conversation.archivedByUserIds || []).filter(id => id !== userId);
      
      await conversation.update({
        archivedByUserIds
      });

      res.json({ message: 'Conversation unarchived successfully' });
    } catch (error) {
      console.error('Error unarchiving conversation:', error);
      res.status(500).json({ error: 'Failed to unarchive conversation' });
    }
  },

  // Mute or unmute a conversation
  toggleMute: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { muted } = req.body;
      const userId = req.user.id;

      if (muted === undefined) {
        return res.status(400).json({ error: 'Mute status is required' });
      }

      const conversation = await Conversation.findOne({
        where: {
          id: conversationId,
          participants: { [Op.contains]: [userId] }
        }
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found or unauthorized' });
      }

      let mutedByUserIds = [...(conversation.mutedByUserIds || [])];
      
      if (muted && !mutedByUserIds.includes(userId)) {
        mutedByUserIds.push(userId);
      } else if (!muted) {
        mutedByUserIds = mutedByUserIds.filter(id => id !== userId);
      }
      
      await conversation.update({ mutedByUserIds });

      res.json({ 
        message: muted ? 'Conversation muted successfully' : 'Conversation unmuted successfully',
        muted
      });
    } catch (error) {
      console.error('Error updating mute status:', error);
      res.status(500).json({ error: 'Failed to update mute status' });
    }
  }
};

module.exports = conversationController; 