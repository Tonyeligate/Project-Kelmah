/**
 * Messaging Service
 * Handles messaging functionality including conversations and message sending
 * Updated: 2025-01-07 - Fixed import/export issues
 */

import { api } from '../../../services/apiClient';
import { getServiceStatusMessage } from '../../../utils/serviceHealthCheck';

const normalizeParticipant = (participant = {}) => {
  if (!participant || typeof participant !== 'object') return participant;
  return {
    ...participant,
    id: participant.id || participant._id || participant.userId,
  };
};

const normalizeMessage = (message = {}) => {
  if (!message || typeof message !== 'object') return message;

  const senderId =
    message.senderId ||
    message.sender_id ||
    (typeof message.sender === 'string'
      ? message.sender
      : message.sender?.id || message.sender?._id);

  const conversationId =
    message.conversationId ||
    message.conversation_id ||
    (typeof message.conversation === 'string'
      ? message.conversation
      : message.conversation?.id || message.conversation?._id);

  return {
    ...message,
    id: message.id || message._id,
    senderId,
    conversationId,
    // sender as string ID so `message.sender === user.id` works in UI
    sender: senderId,
    // Keep full sender object for display purposes
    senderInfo:
      message.sender && typeof message.sender === 'object'
        ? normalizeParticipant(message.sender)
        : null,
    // Map content↔text and createdAt↔timestamp for UI compatibility
    text: message.text || message.content || '',
    content: message.content || message.text || '',
    timestamp: message.timestamp || message.createdAt,
    createdAt: message.createdAt || message.timestamp,
  };
};

const normalizeConversation = (conversation = {}) => {
  if (!conversation || typeof conversation !== 'object') return conversation;

  return {
    ...conversation,
    id: conversation.id || conversation._id,
    participants: Array.isArray(conversation.participants)
      ? conversation.participants.map((participant) => normalizeParticipant(participant))
      : [],
    unread:
      typeof conversation.unread === 'number'
        ? conversation.unread
        : (conversation.unreadCount || 0),
    unreadCount:
      typeof conversation.unreadCount === 'number'
        ? conversation.unreadCount
        : (conversation.unread || 0),
    latestMessage: conversation.latestMessage
      ? normalizeMessage(conversation.latestMessage)
      : conversation.latestMessage,
    lastMessage: conversation.lastMessage
      ? normalizeMessage(conversation.lastMessage)
      : conversation.lastMessage,
  };
};

const normalizeConversationList = (list = []) =>
  Array.isArray(list) ? list.map((conversation) => normalizeConversation(conversation)) : [];

const normalizeMessageList = (list = []) =>
  Array.isArray(list) ? list.map((message) => normalizeMessage(message)) : [];

// ✅ FIXED: Clear export to resolve import errors
export const messagingService = {
  // Get all conversations for the current user
  async getConversations() {
    try {
      // FIXED: Use /messages/conversations - matches backend router path rewrite
      const response = await api.get('/messages/conversations');
      // Normalize response shape
      const payload = response.data;
      if (Array.isArray(payload)) return normalizeConversationList(payload);
      if (payload?.data?.conversations) return normalizeConversationList(payload.data.conversations);
      if (payload?.conversations) return normalizeConversationList(payload.conversations);
      return [];
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Messaging service unavailable:', error.message);
      // No mock data; return empty list to avoid false positives
      return [];
    }
  },

  // Create a new conversation (delegates to createDirectConversation)
  async createConversation(participantId, jobId) {
    return this.createDirectConversation(participantId, jobId);
  },

  // Create conversation from job application
  async createConversationFromApplication(applicationId) {
    try {
      // FIXED: Use /messages/conversations - matches backend router path rewrite
      const response = await api.post('/messages/conversations', {
        applicationId,
      });
      const payload = response.data;
      if (payload?.data?.conversation) {
        return {
          ...payload,
          data: {
            ...payload.data,
            conversation: normalizeConversation(payload.data.conversation),
          },
        };
      }
      return normalizeConversation(payload);
    } catch (error) {
      if (import.meta.env.DEV) console.warn(
        'Messaging service unavailable for conversation from application:',
        error.message,
      );
      throw error;
    }
  },

  // Get messages for a conversation (REST fallback or initial load)
  async getMessages(conversationId, page = 1, limit = 50) {
    try {
      // FIXED: Correct path structure - /messaging/conversations/:id/messages
      // Backend router at /api/messages handles /conversations/:id/messages
      const response = await api.get(
        `/messages/conversations/${conversationId}/messages`,
        {
          params: { page, limit },
        },
      );
      const payload = response.data;
      // Support shapes: { success, data: { messages, pagination } } or raw array
      if (payload?.data?.messages) return normalizeMessageList(payload.data.messages);
      if (Array.isArray(payload?.messages)) return normalizeMessageList(payload.messages);
      if (Array.isArray(payload)) return normalizeMessageList(payload);
      return [];
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Failed to load messages:', error.message);
      return [];
    }
  },

  // Send a message via REST (used as websocket fallback)
  async sendMessage(
    senderId,
    recipientId,
    content,
    messageType = 'text',
    attachments = [],
  ) {
    try {
      // FIXED: Use /messages/messages - matches backend router
      const response = await api.post('/messages', {
        sender: senderId,
        recipient: recipientId,
        content,
        messageType,
        attachments,
      });
      // Controller responds with { message: '...', data: message }
      return normalizeMessage(response.data?.data || response.data);
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Failed to send message via REST:', error.message);
      throw error;
    }
  },

  // Create a direct conversation with a single participant
  async createDirectConversation(participantId, jobId = null) {
    try {
      // FIXED: Use /messages/conversations - matches backend router path rewrite
      const payload = {
        participantIds: [participantId],
        type: 'direct',
      };
      if (jobId) {
        payload.jobId = jobId;
      }
      const response = await api.post('/messages/conversations', payload);
      return normalizeConversation(response.data?.data?.conversation || response.data);
    } catch (error) {
      if (import.meta.env.DEV) console.warn(
        'Messaging service unavailable for creating direct conversation:',
        error.message,
      );
      throw error;
    }
  },

  // Search messages with filters used by MessageSearch.jsx
  async searchMessages(query, { attachments = false, period, sender } = {}) {
    try {
      const params = { q: query, attachments, period, sender };
      // FIXED: Use /messages/search - matches backend router
      const response = await api.get('/messages/search', {
        params,
      });
      const payload = response.data;
      if (payload?.data?.messages) {
        return {
          ...payload.data,
          messages: normalizeMessageList(payload.data.messages),
        };
      }
      if (Array.isArray(payload?.messages))
        return { messages: normalizeMessageList(payload.messages) };
      return { messages: [] };
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Failed to search messages:', error.message);
      return { messages: [] };
    }
  },
};

// ✅ ADDED: Default export for compatibility
export default messagingService;
