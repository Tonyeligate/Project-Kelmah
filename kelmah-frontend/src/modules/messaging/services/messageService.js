import { apiService } from '../../../common/utils/apiUtils';
import { MESSAGE_TYPES } from '../config/constants';

// Token handling
let authToken = null;

const messageService = {
  // Set the auth token for API requests
  setToken: (token) => {
    authToken = token;
  },

  // Get all conversations for the current user
  getConversations: async () => {
    try {
      return await apiService.get('/messages/conversations');
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  // Create a new conversation with a user
  createConversation: async (userId) => {
    try {
      return await apiService.post('/messages/conversations', { recipientId: userId });
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  },

  // Get messages for a specific conversation with pagination
  getMessages: async (conversationId, page = 1, limit = 20) => {
    try {
      return await apiService.get(`/messages/conversations/${conversationId}/messages`, {
        params: { page, limit }
      });
    } catch (error) {
      console.error(`Error fetching messages for conversation ${conversationId}:`, error);
      throw error;
    }
  },

  // Send a message in a conversation with optional file attachments
  sendMessage: async (conversationId, content, attachments = []) => {
    try {
      const formData = new FormData();
      formData.append('content', content);
      
      // Add attachments to form data
      attachments.forEach(file => {
        formData.append('files', file);
      });

      return await apiService.post(
        `/messages/conversations/${conversationId}/messages`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Delete a specific message
  deleteMessage: async (messageId) => {
    try {
      return await apiService.delete(`/messages/messages/${messageId}`);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },

  // Edit a message
  editMessage: async (messageId, content) => {
    try {
      return await apiService.put(`/messages/messages/${messageId}`, { content });
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  },

  // Mark all messages in a conversation as read
  markAsRead: async (conversationId) => {
    try {
      return await apiService.put(`/messages/conversations/${conversationId}/read`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },

  // Search messages in a conversation
  searchMessages: async (conversationId, query) => {
    try {
      return await apiService.get(`/messages/conversations/${conversationId}/search`, {
        params: { query }
      });
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  },

  // Get message statistics
  getStats: async () => {
    try {
      return await apiService.get('/messages/stats');
    } catch (error) {
      console.error('Error fetching message stats:', error);
      throw error;
    }
  }
};

export default messageService; 