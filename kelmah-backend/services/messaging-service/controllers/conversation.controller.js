/**
 * Conversation Controller
 * Handles conversation management and operations (Mongoose)
 */

const { Conversation, Message, User } = require('../models');
const auditLogger = require('../utils/audit-logger');
const mongoose = require('mongoose');

class ConversationController {
  /**
   * Get user's conversations
   */
  static async getUserConversations(req, res) {
    try {
      const userId = req.user.id || req.user._id;
      const { page = 1, limit = 20, type = 'all' } = req.query;

      const pageNum = Math.max(1, parseInt(page));
      const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * pageSize;

      const query = { participants: { $in: [new mongoose.Types.ObjectId(userId)] } };
      if (type && type !== 'all') {
        // Map optional filter to status if provided
        query.status = type;
      }

      const conversations = await Conversation.find(query)
        .populate('participants', 'firstName lastName profilePicture isActive')
        .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'firstName lastName' } })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean();

      const formattedConversations = conversations.map((conv) => {
        const otherParticipant = (conv.participants || []).find((p) => String(p._id) !== String(userId));
        const unreadCountObj = (conv.unreadCounts || []).find((c) => String(c.user) === String(userId));
        return {
          id: conv._id,
          type: (conv.participants || []).length > 2 ? 'group' : 'direct',
          participants: (conv.participants || []).map((p) => ({
            id: p._id,
            name: `${p.firstName} ${p.lastName}`,
            profilePicture: p.profilePicture,
            isActive: p.isActive,
          })),
          otherParticipant: otherParticipant
            ? {
                id: otherParticipant._id,
                name: `${otherParticipant.firstName} ${otherParticipant.lastName}`,
                profilePicture: otherParticipant.profilePicture,
                isActive: otherParticipant.isActive,
              }
            : null,
          lastMessage: conv.lastMessage
            ? {
                id: conv.lastMessage._id,
                content: conv.lastMessage.content,
                messageType: conv.lastMessage.messageType,
                senderId: conv.lastMessage.sender?._id,
                senderName: conv.lastMessage.sender
                  ? `${conv.lastMessage.sender.firstName} ${conv.lastMessage.sender.lastName}`
                  : undefined,
                createdAt: conv.lastMessage.createdAt,
              }
            : null,
          lastMessageAt: conv.updatedAt,
          unreadCount: unreadCountObj ? unreadCountObj.count : 0,
          createdAt: conv.createdAt,
        };
      });

      res.status(200).json({
        success: true,
        message: 'Conversations retrieved successfully',
        data: {
          conversations: formattedConversations,
          pagination: { page: pageNum, limit: pageSize, total: formattedConversations.length }
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
      const userId = req.user.id || req.user._id;

      // Validate participants
      if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Participant IDs are required',
          code: 'MISSING_PARTICIPANTS'
        });
      }

      // Add current user to participants if not included
      const allParticipants = [...new Set([String(userId), ...participantIds.map(String)])].map(
        (id) => new mongoose.Types.ObjectId(id)
      );

      // Validate that all participants exist
      const existingUsers = await User.find({ _id: { $in: allParticipants }, isActive: true }).select('_id');

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
          participants: { $all: allParticipants },
          status: { $ne: 'deleted' },
        });
        if (existingConversation) {
          return res.status(200).json({
            success: true,
            message: 'Conversation already exists',
            data: { conversation: { id: existingConversation._id } },
          });
        }
      }

      // Create conversation
      const conversation = await Conversation.create({
        participants: allParticipants,
        status: 'active',
        metadata: type === 'group' && title ? { title } : undefined,
      });

      // Get participant details for response
      const participants = await User.find({ _id: { $in: allParticipants } }).select(
        'firstName lastName profilePicture'
      );

      // Log conversation creation
      await auditLogger.log({
        userId,
        action: 'CONVERSATION_CREATED',
        details: {
          conversationId: conversation._id,
          type,
          participantCount: allParticipants.length
        }
      });

      res.status(201).json({
        success: true,
        message: 'Conversation created successfully',
        data: {
          conversation: {
            id: conversation._id,
            type: (conversation.participants || []).length > 2 ? 'group' : 'direct',
            title: conversation.metadata?.title || null,
            participants: participants.map(p => ({
              id: p._id,
              name: `${p.firstName} ${p.lastName}`,
              profilePicture: p.profilePicture
            })),
            createdAt: conversation.createdAt,
            lastMessageAt: conversation.updatedAt
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
      const userId = req.user.id || req.user._id;

      const conversation = await Conversation.findOne({
        _id: id,
        participants: { $in: [new mongoose.Types.ObjectId(userId)] }
      })
        .populate('participants', 'firstName lastName profilePicture isActive')
        .lean();

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found or access denied',
          code: 'CONVERSATION_NOT_FOUND'
        });
      }

      // Get participant details
      const participantIds = (conversation.participants || []).map((p) => p._id);
      const messages = await Message.find({
        $or: [
          { sender: { $in: participantIds }, recipient: { $in: participantIds } }
        ]
      })
        .populate('sender', 'firstName lastName profilePicture')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      res.status(200).json({
        success: true,
        message: 'Conversation retrieved successfully',
        data: {
          conversation: {
            id: conversation._id,
            type: (conversation.participants || []).length > 2 ? 'group' : 'direct',
            title: conversation.metadata?.title || null,
            participants: (conversation.participants || []).map(p => ({
              id: p._id,
              name: `${p.firstName} ${p.lastName}`,
              profilePicture: p.profilePicture,
              isActive: p.isActive
            })),
            messages: messages.reverse().map(msg => ({
              id: msg._id,
              senderId: msg.sender?._id,
              sender: {
                id: msg.sender?._id,
                name: msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName}` : undefined,
                profilePicture: msg.sender?.profilePicture
              },
              content: msg.content,
              messageType: msg.messageType,
              attachments: msg.attachments,
              isRead: msg.readStatus?.isRead,
              createdAt: msg.createdAt
            })),
            createdAt: conversation.createdAt,
            lastMessageAt: conversation.updatedAt
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
      const userId = req.user.id || req.user._id;

      const conversation = await Conversation.findOne({
        _id: id,
        participants: { $in: [new mongoose.Types.ObjectId(userId)] }
      });

    if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found or access denied',
          code: 'CONVERSATION_NOT_FOUND'
        });
      }

      const isGroup = (conversation.participants || []).length > 2;
      if (!isGroup && title) {
        return res.status(400).json({
          success: false,
          message: 'Only group conversations can be updated',
          code: 'INVALID_CONVERSATION_TYPE'
        });
      }

      // Update fields
      const updateData = {};
      if (title !== undefined) updateData['metadata.title'] = title;
      if (participants && Array.isArray(participants)) {
        const normalized = participants.map((id) => new mongoose.Types.ObjectId(id));
        const existingUsers = await User.find({ _id: { $in: normalized }, isActive: true }).select('_id');
        if (existingUsers.length !== normalized.length) {
          return res.status(400).json({
            success: false,
            message: 'One or more participants not found or inactive',
            code: 'INVALID_PARTICIPANTS'
          });
        }

        updateData.participants = normalized;
      }

      await Conversation.updateOne({ _id: conversation._id }, { $set: updateData });

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
        data: { conversation: { id } }
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
      const userId = req.user.id || req.user._id;

      const conversation = await Conversation.findOne({
        _id: id,
        participants: { $in: [new mongoose.Types.ObjectId(userId)] }
      });

    if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found or access denied',
          code: 'CONVERSATION_NOT_FOUND'
        });
      }

      const updatedParticipants = (conversation.participants || []).filter(
        (p) => String(p) !== String(userId)
      );
      if (updatedParticipants.length < 2) {
        await Conversation.deleteOne({ _id: conversation._id });
      } else {
        await Conversation.updateOne({ _id: conversation._id }, { $set: { participants: updatedParticipants } });
      }

      // Log conversation deletion/leave
      await auditLogger.log({
        userId,
        action: 'CONVERSATION_LEFT',
        details: {
          conversationId: id,
          type: (conversation.participants || []).length > 2 ? 'group' : 'direct'
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
      const userId = req.user.id || req.user._id;

      const conversation = await Conversation.findOne({
        _id: id,
        participants: { $in: [new mongoose.Types.ObjectId(userId)] }
      });

    if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found or access denied',
          code: 'CONVERSATION_NOT_FOUND'
        });
      }

      await Message.updateMany(
        {
          recipient: new mongoose.Types.ObjectId(userId),
          'readStatus.isRead': false
        },
        { $set: { 'readStatus.isRead': true, 'readStatus.readAt': new Date() } }
      );
      await Conversation.updateOne(
        { _id: conversation._id, 'unreadCounts.user': new mongoose.Types.ObjectId(userId) },
        { $set: { 'unreadCounts.$.count': 0 } }
      );

      res.status(200).json({
        success: true,
        message: 'Conversation marked as read',
        data: {
          conversationId: id
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
      const userId = req.user.id || req.user._id;
      const { query, type, page = 1, limit = 20 } = req.query;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters',
          code: 'INVALID_SEARCH_QUERY'
        });
      }

      const pageNum = Math.max(1, parseInt(page));
      const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * pageSize;

      const convQuery = { participants: { $in: [new mongoose.Types.ObjectId(userId)] } };
      if (type && type !== 'all') convQuery.status = type;

      const conversations = await Conversation.find(convQuery)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean();

      const regex = new RegExp(query, 'i');
      const matched = [];
      for (const conv of conversations) {
        const found = await Message.findOne({
          content: { $regex: regex },
          $or: [
            { sender: { $in: conv.participants } },
            { recipient: { $in: conv.participants } }
          ]
        }).lean();
        if (found) matched.push(conv);
      }

      res.status(200).json({
        success: true,
        message: 'Conversation search completed',
        data: {
          conversations: matched.map(conv => ({
            id: conv._id,
            type: (conv.participants || []).length > 2 ? 'group' : 'direct',
            title: conv.metadata?.title || null,
            lastMessageAt: conv.updatedAt
          })),
          pagination: { page: pageNum, limit: pageSize, total: matched.length },
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