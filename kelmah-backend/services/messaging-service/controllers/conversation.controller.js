/**
 * Conversation Controller
 * Handles conversation management and operations
 */

const { Op } = require('sequelize');
const { Conversation, Message, User } = require('../models');
const auditLogger = require('../../../shared/utils/audit-logger');

class ConversationController {
  /**
   * Get user's conversations
   */
  static async getUserConversations(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, type = 'all' } = req.query;
      
      const offset = (page - 1) * limit;
      const whereClause = {
        participants: {
          [Op.contains]: [userId]
        }
      };

      if (type !== 'all') {
        whereClause.type = type;
      }

      const conversations = await Conversation.findAll({
        where: whereClause,
        include: [
          {
            model: Message,
            as: 'lastMessage',
            required: false,
            order: [['createdAt', 'DESC']],
            limit: 1,
            include: [{
              model: User,
              as: 'sender',
              attributes: ['id', 'firstName', 'lastName']
            }]
          }
        ],
        order: [['lastMessageAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      // Format conversations with participant details
      const formattedConversations = await Promise.all(
        conversations.map(async (conv) => {
          // Get participant details
          const participants = await User.findAll({
            where: {
              id: { [Op.in]: conv.participants }
            },
            attributes: ['id', 'firstName', 'lastName', 'profilePicture', 'isActive']
          });

          // Get unread message count
          const unreadCount = await Message.count({
            where: {
              conversationId: conv.id,
              senderId: { [Op.ne]: userId },
              isRead: false
            }
          });

          // Find the other participant (for direct conversations)
          const otherParticipant = participants.find(p => p.id !== userId);

          return {
            id: conv.id,
            type: conv.type,
            participants: participants.map(p => ({
              id: p.id,
              name: `${p.firstName} ${p.lastName}`,
              profilePicture: p.profilePicture,
              isActive: p.isActive
            })),
            otherParticipant: otherParticipant ? {
              id: otherParticipant.id,
              name: `${otherParticipant.firstName} ${otherParticipant.lastName}`,
              profilePicture: otherParticipant.profilePicture,
              isActive: otherParticipant.isActive
            } : null,
            lastMessage: conv.lastMessage ? {
              id: conv.lastMessage.id,
              content: conv.lastMessage.content,
              messageType: conv.lastMessage.messageType,
              senderId: conv.lastMessage.senderId,
              senderName: `${conv.lastMessage.sender.firstName} ${conv.lastMessage.sender.lastName}`,
              createdAt: conv.lastMessage.createdAt
            } : null,
            lastMessageAt: conv.lastMessageAt,
            unreadCount,
            createdAt: conv.createdAt
          };
        })
      );

      res.status(200).json({
        success: true,
        message: 'Conversations retrieved successfully',
        data: {
          conversations: formattedConversations,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: formattedConversations.length
          }
        }
      });

    } catch (error) {
      console.error('Get user conversations error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve conversations',
        code: 'CONVERSATIONS_RETRIEVAL_ERROR'
      });
    }
  }

  /**
   * Create new conversation
   */
  static async createConversation(req, res) {
    try {
      const { participantIds, type = 'direct', title } = req.body;
      const userId = req.user.id;

      // Validate participants
      if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Participant IDs are required',
          code: 'MISSING_PARTICIPANTS'
        });
      }

      // Add current user to participants if not included
      const allParticipants = [...new Set([userId, ...participantIds])];

      // Validate that all participants exist
      const existingUsers = await User.findAll({
        where: {
          id: { [Op.in]: allParticipants },
          isActive: true
        },
        attributes: ['id']
      });

      if (existingUsers.length !== allParticipants.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more participants not found or inactive',
          code: 'INVALID_PARTICIPANTS'
        });
      }

      // For direct conversations, check if conversation already exists
      if (type === 'direct' && allParticipants.length === 2) {
        const existingConversation = await Conversation.findOne({
          where: {
            type: 'direct',
            participants: {
              [Op.contains]: allParticipants
            }
          }
        });

        if (existingConversation) {
          return res.status(200).json({
            success: true,
            message: 'Conversation already exists',
            data: { conversation: existingConversation }
          });
        }
      }

      // Create conversation
      const conversation = await Conversation.create({
        type,
        participants: allParticipants,
        title: type === 'group' ? title : null,
        createdBy: userId,
        lastMessageAt: new Date()
      });

      // Get participant details for response
      const participants = await User.findAll({
        where: {
          id: { [Op.in]: allParticipants }
        },
        attributes: ['id', 'firstName', 'lastName', 'profilePicture']
      });

      // Log conversation creation
      await auditLogger.log({
        userId,
        action: 'CONVERSATION_CREATED',
        details: {
          conversationId: conversation.id,
          type,
          participantCount: allParticipants.length
        }
      });

      res.status(201).json({
        success: true,
        message: 'Conversation created successfully',
        data: {
          conversation: {
            id: conversation.id,
            type: conversation.type,
            title: conversation.title,
            participants: participants.map(p => ({
              id: p.id,
              name: `${p.firstName} ${p.lastName}`,
              profilePicture: p.profilePicture
            })),
            createdAt: conversation.createdAt,
            lastMessageAt: conversation.lastMessageAt
          }
        }
      });

    } catch (error) {
      console.error('Create conversation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create conversation',
        code: 'CONVERSATION_CREATION_ERROR'
      });
    }
  }

  /**
   * Get conversation details
   */
  static async getConversationById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const conversation = await Conversation.findOne({
        where: {
          id,
          participants: {
            [Op.contains]: [userId]
          }
        }
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found or access denied',
          code: 'CONVERSATION_NOT_FOUND'
        });
      }

      // Get participant details
      const participants = await User.findAll({
        where: {
          id: { [Op.in]: conversation.participants }
        },
        attributes: ['id', 'firstName', 'lastName', 'profilePicture', 'isActive']
      });

      // Get recent messages
      const messages = await Message.findAll({
        where: { conversationId: id },
        include: [{
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'profilePicture']
        }],
        order: [['createdAt', 'DESC']],
        limit: 50
      });

      res.status(200).json({
        success: true,
        message: 'Conversation retrieved successfully',
        data: {
          conversation: {
            id: conversation.id,
            type: conversation.type,
            title: conversation.title,
            participants: participants.map(p => ({
              id: p.id,
              name: `${p.firstName} ${p.lastName}`,
              profilePicture: p.profilePicture,
              isActive: p.isActive
            })),
            messages: messages.reverse().map(msg => ({
              id: msg.id,
              senderId: msg.senderId,
              sender: {
                id: msg.sender.id,
                name: `${msg.sender.firstName} ${msg.sender.lastName}`,
                profilePicture: msg.sender.profilePicture
              },
              content: msg.content,
              messageType: msg.messageType,
              attachments: msg.attachments,
              isRead: msg.isRead,
              createdAt: msg.createdAt
            })),
            createdAt: conversation.createdAt,
            lastMessageAt: conversation.lastMessageAt
          }
        }
      });

    } catch (error) {
      console.error('Get conversation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve conversation',
        code: 'CONVERSATION_RETRIEVAL_ERROR'
      });
    }
  }

  /**
   * Update conversation (group conversations only)
   */
  static async updateConversation(req, res) {
    try {
      const { id } = req.params;
      const { title, participants } = req.body;
      const userId = req.user.id;

      const conversation = await Conversation.findOne({
        where: {
          id,
          participants: {
            [Op.contains]: [userId]
          }
        }
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found or access denied',
          code: 'CONVERSATION_NOT_FOUND'
        });
      }

      // Only allow updating group conversations
      if (conversation.type !== 'group') {
        return res.status(400).json({
          success: false,
          message: 'Only group conversations can be updated',
          code: 'INVALID_CONVERSATION_TYPE'
        });
      }

      // Update fields
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (participants && Array.isArray(participants)) {
        // Validate participants exist
        const existingUsers = await User.findAll({
          where: {
            id: { [Op.in]: participants },
            isActive: true
          },
          attributes: ['id']
        });

        if (existingUsers.length !== participants.length) {
          return res.status(400).json({
            success: false,
            message: 'One or more participants not found or inactive',
            code: 'INVALID_PARTICIPANTS'
          });
        }

        updateData.participants = participants;
      }

      await conversation.update(updateData);

      // Log conversation update
      await auditLogger.log({
        userId,
        action: 'CONVERSATION_UPDATED',
        details: {
          conversationId: id,
          changes: Object.keys(updateData)
        }
      });

      res.status(200).json({
        success: true,
        message: 'Conversation updated successfully',
        data: { conversation }
      });

    } catch (error) {
      console.error('Update conversation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update conversation',
        code: 'CONVERSATION_UPDATE_ERROR'
      });
    }
  }

  /**
   * Delete conversation
   */
  static async deleteConversation(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const conversation = await Conversation.findOne({
        where: {
          id,
          participants: {
            [Op.contains]: [userId]
          }
        }
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found or access denied',
          code: 'CONVERSATION_NOT_FOUND'
        });
      }

      // For direct conversations, just remove the user from participants
      if (conversation.type === 'direct') {
        const updatedParticipants = conversation.participants.filter(p => p !== userId);
        
        if (updatedParticipants.length === 0) {
          // If no participants left, delete the conversation
          await conversation.destroy();
        } else {
          await conversation.update({ participants: updatedParticipants });
        }
      } else {
        // For group conversations, remove user from participants
        const updatedParticipants = conversation.participants.filter(p => p !== userId);
        
        if (updatedParticipants.length < 2) {
          // If less than 2 participants, delete the conversation
          await conversation.destroy();
        } else {
          await conversation.update({ participants: updatedParticipants });
        }
      }

      // Log conversation deletion/leave
      await auditLogger.log({
        userId,
        action: 'CONVERSATION_LEFT',
        details: {
          conversationId: id,
          type: conversation.type
        }
      });

      res.status(200).json({
        success: true,
        message: 'Successfully left conversation'
      });

    } catch (error) {
      console.error('Delete conversation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to leave conversation',
        code: 'CONVERSATION_DELETION_ERROR'
      });
    }
  }

  /**
   * Mark conversation as read
   */
  static async markConversationAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verify user has access to conversation
      const conversation = await Conversation.findOne({
        where: {
          id,
          participants: {
            [Op.contains]: [userId]
          }
        }
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found or access denied',
          code: 'CONVERSATION_NOT_FOUND'
        });
      }

      // Mark all unread messages as read
      const updatedMessages = await Message.update(
        { 
          isRead: true,
          readAt: new Date()
        },
        {
          where: {
            conversationId: id,
            senderId: { [Op.ne]: userId },
            isRead: false
          },
          returning: true
        }
      );

      res.status(200).json({
        success: true,
        message: 'Conversation marked as read',
        data: {
          conversationId: id,
          markedMessagesCount: updatedMessages[0] || 0
        }
      });

    } catch (error) {
      console.error('Mark conversation as read error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to mark conversation as read',
        code: 'MARK_READ_ERROR'
      });
    }
  }

  /**
   * Search conversations
   */
  static async searchConversations(req, res) {
    try {
      const userId = req.user.id;
      const { query, type, page = 1, limit = 20 } = req.query;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters',
          code: 'INVALID_SEARCH_QUERY'
        });
      }

      const offset = (page - 1) * limit;
      const whereClause = {
        participants: {
          [Op.contains]: [userId]
        }
      };

      if (type && type !== 'all') {
        whereClause.type = type;
      }

      // Search in conversation titles and recent messages
      const conversations = await Conversation.findAll({
        where: whereClause,
        include: [
          {
            model: Message,
            as: 'messages',
            where: {
              [Op.or]: [
                { content: { [Op.iLike]: `%${query}%` } }
              ]
            },
            required: false,
            limit: 1,
            order: [['createdAt', 'DESC']]
          }
        ],
        order: [['lastMessageAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.status(200).json({
        success: true,
        message: 'Conversation search completed',
        data: {
          conversations: conversations.map(conv => ({
            id: conv.id,
            type: conv.type,
            title: conv.title,
            lastMessageAt: conv.lastMessageAt
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: conversations.length
          },
          searchQuery: query
        }
      });

    } catch (error) {
      console.error('Search conversations error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to search conversations',
        code: 'CONVERSATION_SEARCH_ERROR'
      });
    }
  }
}

module.exports = ConversationController;