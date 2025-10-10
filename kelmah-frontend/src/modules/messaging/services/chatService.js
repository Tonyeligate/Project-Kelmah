import { messagingServiceClient } from '../../common/services/axios';

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
      const response = await messagingServiceClient.get(`/api/conversations`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  // Get conversation by ID
  async getConversation(conversationId) {
    try {
      const response = await messagingServiceClient.get(
        `/api/conversations/${conversationId}`,
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
      const response = await messagingServiceClient.get(
        `/api/messages/conversations/${conversationId}/messages`,
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
      const response = await messagingServiceClient.post(`/api/messages`, {
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
      const response = await messagingServiceClient.post(`/api/conversations`, {
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
      const response = await messagingServiceClient.put(
        `/api/conversations/${conversationId}/read`,
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
      const response = await messagingServiceClient.delete(
        `/api/conversations/${conversationId}`,
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
      const response = await messagingServiceClient.get(
        `/api/conversations/search`,
        { params: { query } },
      );
      return response.data.data;
    } catch (error) {
      console.error('Error searching conversations:', error);
      throw error;
    }
  }

  // Get unread message count
  async getUnreadCount() {
    try {
      const response = await messagingServiceClient.get(
        `/api/messages/unread/count`,
      );
      return response.data?.unreadCount ?? response.data?.data ?? 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }
}

const chatService = new ChatService();

export default chatService;
