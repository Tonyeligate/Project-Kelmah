import { api } from '../../../services/apiClient';

class ChatService {
  constructor() {
    this.token = null;
  }

  initialize(token) {
    this.token = token;
  }

  // Get all conversations
  async getConversations() {
    try {
      const response = await api.get(`/messaging/conversations`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  // Get conversation by ID
  async getConversation(conversationId) {
    try {
      const response = await api.get(
        `/messaging/conversations/${conversationId}`,
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  }

  // ✅ FIXED: Get messages for a conversation - Updated to match backend route
  async getMessages(conversationId, page = 1, limit = 20) {
    try {
      const response = await api.get(
        `/messaging/messages/conversations/${conversationId}/messages`,
        { params: { page, limit } },
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  // Send a message
  async sendMessage(conversationId, content) {
    try {
      const response = await api.post(`/messaging/messages`, {
        conversationId,
        content,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Create a new conversation
  async createConversation(participantId) {
    try {
      const response = await api.post(`/messaging/conversations`, {
        participantId,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markAsRead(conversationId) {
    try {
      const response = await api.put(
        `/messaging/conversations/${conversationId}/read`,
      );
      return response.data.data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Delete a conversation
  async deleteConversation(conversationId) {
    try {
      const response = await api.delete(
        `/messaging/conversations/${conversationId}`,
      );
      return response.data.data;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  // Search conversations
  async searchConversations(query) {
    try {
      const response = await api.get(`/messaging/conversations/search`, {
        params: { query },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error searching conversations:', error);
      throw error;
    }
  }

  // Get unread message count
  async getUnreadCount() {
    try {
      const response = await api.get(`/messaging/messages/unread/count`);
      return response.data?.unreadCount ?? response.data?.data ?? 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }
}

const chatService = new ChatService();

export default chatService;
