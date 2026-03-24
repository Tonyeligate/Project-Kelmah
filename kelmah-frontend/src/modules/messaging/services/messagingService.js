/**
 * Messaging Service
 * Handles messaging functionality including conversations and message sending
 * Updated: 2025-01-07 - Fixed import/export issues
 */

import axios from 'axios';
import { api } from '../../../services/apiClient';
import store from '../../../store';
import { getServiceStatusMessage } from '../../../utils/serviceHealthCheck';
import { secureStorage } from '../../../utils/secureStorage';
import authService from '../../auth/services/authService';
import { devWarn } from '@/modules/common/utils/devLogger';

/**
 * Call a Vercel serverless bridge endpoint (bypasses API Gateway proxy).
 * The Express body-parser on the Render gateway consumes the request body
 * stream before http-proxy-middleware can pipe it, causing 504 on POST.
 * The serverless bridge forwards directly to the messaging service.
 */
/**
 * Whether the Vercel serverless bridge should be attempted.
 * True on any non-localhost deployment (bridge endpoints only exist on Vercel).
 * On localhost the bridge paths return 404, so the fallback to gateway proxy is instant.
 */
const shouldUseBridge = () =>
  typeof window !== 'undefined' &&
  !['localhost', '127.0.0.1'].includes(window.location?.hostname);

let bridgeUnavailable = false;

const getBridgeToken = async ({ forceRefresh = false } = {}) => {
  if (!forceRefresh) {
    const reduxToken = store.getState()?.auth?.token;
    if (reduxToken) return reduxToken;

    const storedToken = secureStorage.getAuthToken();
    if (storedToken) return storedToken;
  }

  const refreshResult = await authService.refreshToken();
  if (refreshResult?.success && refreshResult.token) {
    return refreshResult.token;
  }

  return null;
};

const postBridgeWithToken = (path, data, timeoutMs, token) =>
  axios.post(path, data, {
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    timeout: timeoutMs,
  });

const bridgePost = async (path, data, timeoutMs = 45000) => {
  if (bridgeUnavailable) {
    throw new Error('Bridge unavailable');
  }

  let token = await getBridgeToken();

  try {
    return await postBridgeWithToken(path, data, timeoutMs, token);
  } catch (error) {
    const status = error?.response?.status;
    if ([404, 405, 501].includes(status)) {
      bridgeUnavailable = true;
    }

    if (error.response?.status !== 401) {
      throw error;
    }

    const refreshedToken = await getBridgeToken({ forceRefresh: true });
    if (!refreshedToken || refreshedToken === token) {
      throw error;
    }

    token = refreshedToken;
    return postBridgeWithToken(path, data, timeoutMs, token);
  }
};

const normalizeParticipant = (participant = {}) => {
  if (!participant || typeof participant !== 'object') return participant;
  return {
    ...participant,
    id: participant.id || participant._id || participant.userId,
  };
};

const normalizeAttachment = (attachment = {}) => {
  if (!attachment || typeof attachment !== 'object') return attachment;

  const mimeType =
    attachment.mimeType ||
    attachment.fileType ||
    attachment.type ||
    attachment?.virusScan?.metadata?.mimeType ||
    '';

  const normalizedType =
    attachment.type === 'image' || String(mimeType).startsWith('image/')
      ? 'image'
      : attachment.type || 'file';

  return {
    ...attachment,
    id: attachment.id || attachment._id,
    url: attachment.url || attachment.fileUrl || attachment.path || attachment.getUrl || null,
    fileUrl: attachment.fileUrl || attachment.url || null,
    type: normalizedType,
    mimeType,
    fileType: attachment.fileType || mimeType || attachment.type,
    name: attachment.name || attachment.fileName || attachment.filename || 'Attachment',
    size: attachment.size || attachment.fileSize || 0,
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
    attachments: Array.isArray(message.attachments)
      ? message.attachments.map((attachment) => normalizeAttachment(attachment))
      : [],
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
      devWarn('Messaging service unavailable:', error.message);
      // No mock data; return empty list to avoid false positives
      return [];
    }
  },

  // Get a single conversation by ID for direct deep-link recovery
  async getConversationById(conversationId) {
    try {
      const response = await api.get(`/messages/conversations/${conversationId}`);
      const payload = response.data;
      if (payload?.data?.conversation) return normalizeConversation(payload.data.conversation);
      if (payload?.conversation) return normalizeConversation(payload.conversation);
      if (payload?.data) return normalizeConversation(payload.data);
      return normalizeConversation(payload);
    } catch (error) {
      devWarn(`Failed to fetch conversation ${conversationId}:`, error.message);
      throw error;
    }
  },

  // Create a new conversation (delegates to createDirectConversation)
  async createConversation(participantId, jobId) {
    return this.createDirectConversation(participantId, jobId);
  },

  // Create conversation from job application
  async createConversationFromApplication(applicationId) {
    const payload = { applicationId };

    // 1. Try Vercel serverless bridge (bypasses gateway body-stream hang)
    if (shouldUseBridge() && !bridgeUnavailable) {
      try {
        const response = await bridgePost('/api/create-conversation', payload);
        const data = response.data;
        if (data?.data?.conversation) {
          return { ...data, data: { ...data.data, conversation: normalizeConversation(data.data.conversation) } };
        }
        return normalizeConversation(data);
      } catch (_) {
        // Fall through to gateway
      }
    }

    // 2. Fallback: gateway proxy
    try {
      const response = await api.post('/messages/conversations', payload);
      const data = response.data;
      if (data?.data?.conversation) {
        return { ...data, data: { ...data.data, conversation: normalizeConversation(data.data.conversation) } };
      }
      return normalizeConversation(data);
    } catch (error) {
      devWarn(
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
      devWarn('Failed to load messages:', error.message);
      return [];
    }
  },

  // Send a message via REST (used as websocket fallback)
  // conversationId is now required so the backend can link the message
  // to the correct conversation without doing a participant lookup.
  async sendMessage(
    senderId,
    recipientId,
    content,
    messageType = 'text',
    attachments = [],
    conversationId = null,
  ) {
    const safeAttachments = Array.isArray(attachments) ? attachments : [];
    const hasAttachments = safeAttachments.length > 0;
    const trimmedContent = typeof content === 'string' ? content.trim() : '';
    const normalizedMessageType =
      messageType === 'mixed'
        ? safeAttachments.some((attachment) => {
          const mimeType =
            attachment?.mimeType ||
            attachment?.fileType ||
            attachment?.type ||
            '';
          return String(mimeType).startsWith('image/');
        })
          ? 'image'
          : 'file'
        : messageType;

    const payload = {
      sender: senderId,
      recipient: recipientId,
      content: trimmedContent || (hasAttachments ? '[Attachment]' : ''),
      messageType: normalizedMessageType,
      attachments: safeAttachments,
      // Always include conversationId so the backend skips the participant lookup
      ...(conversationId ? { conversationId } : {}),
    };

    // 1. Try Vercel serverless bridge for POST body
    if (shouldUseBridge() && !bridgeUnavailable) {
      try {
        const response = await bridgePost('/api/send-message', payload, 30000);
        const msg = response.data?.data || response.data;
        if (msg && !msg.error) return normalizeMessage(msg);
        // Bridge returned an error body — fall through to gateway
        devWarn('[sendMessage] Bridge returned error, trying gateway:', response.data);
      } catch (bridgeErr) {
        devWarn('[sendMessage] Bridge threw, trying gateway:', bridgeErr.message);
        // Fall through to gateway
      }
    }

    // 2. Fallback: gateway proxy POSTs via conversations/:id/messages
    try {
      const postPath = '/messages';
      const response = await api.post(postPath, payload);
      return normalizeMessage(response.data?.data || response.data);
    } catch (error) {
      devWarn('Failed to send message via REST:', error.message);
      throw error;
    }
  },

  // Create a direct conversation with a single participant
  async createDirectConversation(participantId, jobId = null) {
    const payload = {
      participantIds: [participantId],
      type: 'direct',
      ...(jobId ? { jobId } : {}),
    };

    // 1. Try Vercel serverless bridge (bypasses gateway proxy body-stream hang)
    if (shouldUseBridge() && !bridgeUnavailable) {
      try {
        const response = await bridgePost('/api/create-conversation', payload);
        return normalizeConversation(response.data?.data?.conversation || response.data);
      } catch (bridgeErr) {
        devWarn('Bridge failed, trying gateway:', bridgeErr.message);
        // Fall through to gateway
      }
    }

    // 2. Fallback: standard gateway proxy
    try {
      const response = await api.post('/messages/conversations', payload);
      return normalizeConversation(response.data?.data?.conversation || response.data);
    } catch (error) {
      devWarn(
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
      devWarn('Failed to search messages:', error.message);
      return { messages: [] };
    }
  },
};

// ✅ ADDED: Default export for compatibility
export default messagingService;
