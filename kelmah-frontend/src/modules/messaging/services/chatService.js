import axios from 'axios';
import { API_BASE_URL } from '../../../config/constants';

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
      const response = await axios.get(
        `${API_BASE_URL}/api/chat/conversations`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        },
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  // Get conversation by ID
  async getConversation(conversationId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/chat/conversations/${conversationId}`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        },
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  }

  // Get messages for a conversation
  async getMessages(conversationId, page = 1, limit = 20) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/chat/conversations/${conversationId}/messages`,
        {
          params: { page, limit },
          headers: { Authorization: `Bearer ${this.token}` },
        },
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
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/conversations/${conversationId}/messages`,
        { content },
        {
          headers: { Authorization: `Bearer ${this.token}` },
        },
      );
      return response.data.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Create a new conversation
  async createConversation(participantId) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/conversations`,
        { participantId },
        {
          headers: { Authorization: `Bearer ${this.token}` },
        },
      );
      return response.data.data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markAsRead(conversationId) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/chat/conversations/${conversationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${this.token}` },
        },
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
      const response = await axios.delete(
        `${API_BASE_URL}/api/chat/conversations/${conversationId}`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        },
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
      const response = await axios.get(
        `${API_BASE_URL}/api/chat/conversations/search`,
        {
          params: { query },
          headers: { Authorization: `Bearer ${this.token}` },
        },
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
      const response = await axios.get(
        `${API_BASE_URL}/api/chat/unread-count`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        },
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }
}

const chatService = new ChatService();

export default chatService;
