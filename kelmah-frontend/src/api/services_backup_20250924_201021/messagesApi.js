import { messagingServiceClient } from '../../modules/common/services/axios';

const messagesApi = {
  // Get all conversations for current user
  async getConversations() {
    try {
      const { data } = await messagingServiceClient.get('/api/conversations');
      return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('Failed to fetch conversations:', error);
      return [];
    }
  },

  // Get messages for a specific conversation - FIXED ENDPOINT
  async getMessages(conversationId, page = 1, limit = 50) {
    try {
      // ✅ FIXED: Use correct endpoint pattern to match backend routing
      const { data } = await messagingServiceClient.get(`/api/messages/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
      return {
        messages: Array.isArray(data?.data?.messages) ? data.data.messages : [],
        pagination: data?.data?.pagination || { page: 1, total: 0, hasMore: false }
      };
    } catch (error) {
      console.warn('Failed to fetch messages:', error);
      return { messages: [], pagination: { page: 1, total: 0, hasMore: false } };
    }
  },

  // Send a new message - FIXED ENDPOINT
  async sendMessage(conversationId, messageData) {
    try {
      // ✅ FIXED: Send to messages endpoint, not conversation-specific endpoint
      const payload = {
        conversationId,
        ...messageData
      };
      const { data } = await messagingServiceClient.post('/api/messages', payload);
      return data?.data || data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  },

  // Create new conversation
  async createConversation(participantId, initialMessage = '') {
    try {
      const { data } = await messagingServiceClient.post('/api/conversations', {
        participantId,
        initialMessage
      });
      return data?.data || data;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  },

  // Upload attachment - FIXED ENDPOINT
  async uploadAttachment(conversationId, formData, config = {}) {
    try {
      // ✅ FIXED: Use uploads endpoint for attachments
      const { data } = await messagingServiceClient.post(`/api/uploads`, formData, config);
      return data?.data || data;
    } catch (error) {
      console.error('Failed to upload attachment:', error);
      throw error;
    }
  },

  // Mark conversation as read
  async markAsRead(conversationId) {
    try {
      const { data } = await messagingServiceClient.put(`/api/conversations/${conversationId}/read`);
      return data?.data || data;
    } catch (error) {
      console.warn('Failed to mark conversation as read:', error);
      return null;
    }
  },

  // Delete conversation
  async deleteConversation(conversationId) {
    try {
      const { data } = await messagingServiceClient.delete(`/api/conversations/${conversationId}`);
      return data?.data || data;
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  },

  // Archive conversation
  async archiveConversation(conversationId) {
    try {
      const { data } = await messagingServiceClient.put(`/api/conversations/${conversationId}/archive`);
      return data?.data || data;
    } catch (error) {
      console.error('Failed to archive conversation:', error);
      throw error;
    }
  }
};

export default messagesApi;




