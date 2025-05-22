const Message = require('../models/message.model');
const Conversation = require('../models/conversation.model');
const { processUploadedFiles, deleteFile } = require('../services/fileUpload.service');
const { Op } = require('sequelize');

const messageController = {
  // Get messages for a conversation
  getMessages: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      // Verify user is part of the conversation
      const conversation = await Conversation.findOne({
        where: {
          id: conversationId,
          participants: {
            [Op.contains]: [req.user.id]
          }
        }
      });

      if (!conversation) {
        return res.status(403).json({ error: 'Access denied to this conversation' });
      }

      const messages = await Message.findByConversationId(conversationId, parseInt(limit), offset);
      const total = await Message.count({ where: { conversationId } });

      res.json({
        messages,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  },

  // Send a message
  sendMessage: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { content, replyToId } = req.body;
      const files = req.files;

      // Verify user is part of the conversation
      const conversation = await Conversation.findOne({
        where: {
          id: conversationId,
          participants: {
            [Op.contains]: [req.user.id]
          }
        }
      });

      if (!conversation) {
        return res.status(403).json({ error: 'Access denied to this conversation' });
      }

      // Process uploaded files if any
      const attachments = files ? processUploadedFiles(files) : [];

      // Create message
      const message = await Message.create({
        conversationId,
        senderId: req.user.id,
        content,
        attachments,
        replyToId,
        type: attachments.length > 0 ? attachments[0].category : 'text',
        status: 'sent',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      // Update conversation's last message
      await conversation.updateLastMessage(message);

      // Emit new message event through WebSocket
      req.app.get('io').to(conversationId).emit('new_message', {
        message,
        conversationId
      });

      res.status(201).json(message);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  },

  // Delete a message
  deleteMessage: async (req, res) => {
    try {
      const { messageId } = req.params;

      const message = await Message.findOne({
        where: {
          id: messageId,
          senderId: req.user.id
        }
      });

      if (!message) {
        return res.status(404).json({ error: 'Message not found or unauthorized' });
      }

      // Delete attached files
      if (message.attachments && message.attachments.length > 0) {
        message.attachments.forEach(attachment => {
          deleteFile(attachment.url);
        });
      }

      await message.destroy();
      res.json({ message: 'Message deleted successfully' });
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({ error: 'Failed to delete message' });
    }
  },

  // Edit a message
  editMessage: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { content } = req.body;

      const message = await Message.findOne({
        where: {
          id: messageId,
          senderId: req.user.id
        }
      });

      if (!message) {
        return res.status(404).json({ error: 'Message not found or unauthorized' });
      }

      await message.editContent(content);
      res.json(message);
    } catch (error) {
      console.error('Error editing message:', error);
      res.status(500).json({ error: 'Failed to edit message' });
    }
  },

  // Mark messages as read
  markAsRead: async (req, res) => {
    try {
      const { conversationId } = req.params;

      // Verify user is part of the conversation
      const conversation = await Conversation.findOne({
        where: {
          id: conversationId,
          participants: {
            [Op.contains]: [req.user.id]
          }
        }
      });

      if (!conversation) {
        return res.status(403).json({ error: 'Access denied to this conversation' });
      }

      // Get unread messages
      const messages = await Message.findAll({
        where: {
          conversationId,
          senderId: { [Op.ne]: req.user.id },
          readStatus: {
            [Op.not]: sequelize.literal(`jsonb_exists(read_status, '${req.user.id}')`)
          }
        }
      });

      // Mark each message as read
      await Promise.all(messages.map(message => message.markAsRead(req.user.id)));

      res.json({ message: 'Messages marked as read' });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({ error: 'Failed to mark messages as read' });
    }
  },

  // Search messages
  searchMessages: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      // Verify user is part of the conversation
      const conversation = await Conversation.findOne({
        where: {
          id: conversationId,
          participants: {
            [Op.contains]: [req.user.id]
          }
        }
      });

      if (!conversation) {
        return res.status(403).json({ error: 'Access denied to this conversation' });
      }

      const messages = await Message.searchByContent(conversationId, query);
      res.json(messages);
    } catch (error) {
      console.error('Error searching messages:', error);
      res.status(500).json({ error: 'Failed to search messages' });
    }
  }
};

module.exports = messageController; 