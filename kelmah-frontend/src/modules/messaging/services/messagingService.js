/**
 * Messaging Service
 * Handles messaging functionality including conversations and message sending
 * Updated: 2025-01-07 - Fixed import/export issues
 */

import { messagingServiceClient } from '../../common/services/axios';
import { getServiceStatusMessage } from '../../../utils/serviceHealthCheck';

// ✅ FIXED: Clear export to resolve import errors
export const messagingService = {
  // Get all conversations for the current user
  async getConversations() {
    try {
      // Direct service path (matches messaging-service server.js)
      const response = await messagingServiceClient.get('/api/conversations');
      // Normalize response shape
      const payload = response.data;
      if (Array.isArray(payload)) return payload;
      if (payload?.data?.conversations) return payload.data.conversations;
      if (payload?.conversations) return payload.conversations;
      return [];
    } catch (error) {
      console.warn('Messaging service unavailable:', error.message);
      // No mock data; return empty list to avoid false positives
      return [];
    }
  },

  // Create a new conversation
  async createConversation(participantId, jobId) {
    try {
      const response = await messagingServiceClient.post('/api/conversations', {
        participantId,
        jobId,
      });
      return response.data;
    } catch (error) {
      console.warn('Messaging service unavailable for creating conversation:', error.message);
      throw error; // Let the calling code handle the error appropriately
    }
  },

  // Create conversation from job application
  async createConversationFromApplication(applicationId) {
    try {
      const response = await messagingServiceClient.post('/api/conversations', {
        applicationId,
      });
      return response.data;
    } catch (error) {
      console.warn('Messaging service unavailable for conversation from application:', error.message);
      throw error;
    }
  },

  // Get messages for a conversation (REST fallback or initial load)
  async getMessages(conversationId, page = 1, limit = 50) {
    try {
      const response = await messagingServiceClient.get(`/api/messages/conversations/${conversationId}/messages`, {
        params: { page, limit },
      });
      const payload = response.data;
      // Support shapes: { success, data: { messages, pagination } } or raw array
      if (payload?.data?.messages) return payload.data.messages;
      if (Array.isArray(payload?.messages)) return payload.messages;
      if (Array.isArray(payload)) return payload;
      return [];
    } catch (error) {
      console.warn('Failed to load messages:', error.message);
      return [];
    }
  },

  // Send a message via REST (used as websocket fallback)
  async sendMessage(senderId, recipientId, content, messageType = 'text', attachments = []) {
    try {
      const response = await messagingServiceClient.post('/api/messages', { sender: senderId, recipient: recipientId, content, messageType, attachments });
      // Controller responds with { message: '...', data: message }
      return response.data?.data || response.data;
    } catch (error) {
      console.warn('Failed to send message via REST:', error.message);
      throw error;
    }
  },

  // Create a direct conversation with a single participant
  async createDirectConversation(participantId) {
    try {
      const response = await messagingServiceClient.post('/api/conversations', {
        participantIds: [participantId],
        type: 'direct',
      });
      return response.data?.data?.conversation || response.data;
    } catch (error) {
      console.warn('Messaging service unavailable for creating direct conversation:', error.message);
      throw error;
    }
  },

  // Search messages with filters used by MessageSearch.jsx
  async searchMessages(query, { attachments = false, period, sender } = {}) {
    try {
      const params = { q: query, attachments, period, sender };
      const response = await messagingServiceClient.get('/api/messages/search', { params });
      const payload = response.data;
      if (payload?.data?.messages) return payload.data;
      if (Array.isArray(payload?.messages)) return { messages: payload.messages };
      return { messages: [] };
    } catch (error) {
      console.warn('Failed to search messages:', error.message);
      return { messages: [] };
    }
  },
};

// ✅ ADDED: Default export for compatibility
export default messagingService;
