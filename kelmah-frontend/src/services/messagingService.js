import io from 'socket.io-client';
import { format } from 'date-fns';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

class MessagingService {
    constructor() {
        this.socket = null;
    this.userId = null;
    this.token = null;
    this.connected = false;
    this.eventHandlers = {
      connect: [],
      disconnect: [],
      error: [],
      message: [],
      typing: [],
      read: [],
      user_status: []
    };
  }

  // Initialize with user credentials
  initialize(userId, token) {
    this.userId = userId;
    this.token = token;
  }

  // Connect to the messaging service
  connect() {
    if (this.socket) {
      // Already connected
      return;
    }

    // Create socket connection with authentication
      this.socket = io(`${API_BASE_URL}/messaging`, {
            auth: {
                token: this.token
            },
        query: {
          userId: this.userId
        },
      transports: ['websocket', 'polling'],
            reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Set up base event listeners
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.connected = true;
      this._triggerEvent('connect');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.connected = false;
      this._triggerEvent('disconnect', reason);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this._triggerEvent('error', error);
    });

    // Set up application event listeners
    this.socket.on('message', (data) => {
      this._triggerEvent('message', data);
    });

    this.socket.on('typing', (data) => {
      this._triggerEvent('typing', data);
    });

    this.socket.on('read', (data) => {
      this._triggerEvent('read', data);
    });

    this.socket.on('user_status', (data) => {
      this._triggerEvent('user_status', data);
    });
  }

  // Disconnect from the messaging service
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Event handling
  on(event, callback) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.eventHandlers[event]) return;
    this.eventHandlers[event] = this.eventHandlers[event].filter(cb => cb !== callback);
  }

  _triggerEvent(event, data) {
    if (!this.eventHandlers[event]) return;
    this.eventHandlers[event].forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error(`Error in ${event} handler:`, err);
      }
    });
  }

  // Join a conversation room
  joinConversation(conversationId) {
    if (!this.connected || !this.socket) {
      console.warn('Cannot join conversation: not connected');
      return;
    }
    this.socket.emit('join_conversation', { conversationId });
  }

  // Leave a conversation room
  leaveConversation(conversationId) {
    if (!this.connected || !this.socket) {
      console.warn('Cannot leave conversation: not connected');
      return;
    }
    this.socket.emit('leave_conversation', { conversationId });
  }

  // Send a typing indicator
  sendTypingIndicator(conversationId, isTyping) {
    if (!this.connected || !this.socket) {
      console.warn('Cannot send typing indicator: not connected');
      return;
    }
    this.socket.emit('typing', { 
      conversationId, 
      isTyping 
    });
  }

  // API Methods

  // Get all conversations
  async getConversations() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/conversations`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  // Get messages for a conversation
  async getMessages(conversationId, page = 1, limit = 50) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/conversations/${conversationId}/messages`, {
        params: { page, limit },
        headers: { Authorization: `Bearer ${this.token}` }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  // Send a message
  async sendMessage(conversationId, content, attachments = []) {
    try {
      // Handle file uploads if there are attachments
      let uploadedAttachments = [];
      if (attachments && attachments.length > 0) {
        uploadedAttachments = await this._uploadAttachments(attachments);
      }

      // Send the message with attachment references
      const response = await axios.post(
        `${API_BASE_URL}/api/conversations/${conversationId}/messages`,
        {
      content,
          attachments: uploadedAttachments.map(att => att.id)
        },
        {
          headers: { Authorization: `Bearer ${this.token}` }
        }
      );

      return response.data.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Upload attachments and get their IDs
  async _uploadAttachments(files) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/uploads/message-attachments`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error uploading attachments:', error);
      throw error;
    }
  }

  // Mark a message as read
  async markMessageAsRead(messageId) {
    try {
      await axios.post(
        `${API_BASE_URL}/api/messages/${messageId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${this.token}` }
        }
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  // Mark all messages in a conversation as read
  async markConversationAsRead(conversationId) {
    try {
      await axios.post(
        `${API_BASE_URL}/api/conversations/${conversationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${this.token}` }
        }
      );

      // Also emit through socket for real-time updates
      if (this.connected && this.socket) {
        this.socket.emit('mark_read', { conversationId });
      }
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      throw error;
    }
  }

  // Create a direct conversation with another user
  async createDirectConversation(recipientId) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/conversations`,
        {
          type: 'direct',
          participants: [recipientId]
        },
        {
          headers: { Authorization: `Bearer ${this.token}` }
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error creating direct conversation:', error);
      throw error;
    }
  }

  // Create a group conversation
  async createGroupConversation(name, participantIds, avatar = null) {
    try {
      // Upload avatar if provided
      let avatarId = null;
      if (avatar) {
        const formData = new FormData();
        formData.append('file', avatar);
        const uploadResponse = await axios.post(
          `${API_BASE_URL}/api/uploads/avatars`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${this.token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        avatarId = uploadResponse.data.data.id;
      }

      // Create the group conversation
      const response = await axios.post(
        `${API_BASE_URL}/api/conversations`,
        {
          type: 'group',
          name,
          participants: participantIds,
          avatarId
        },
        {
          headers: { Authorization: `Bearer ${this.token}` }
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error creating group conversation:', error);
      throw error;
    }
  }

  // Download an attachment
  getAttachmentUrl(attachmentId) {
    return `${API_BASE_URL}/api/attachments/${attachmentId}/download?token=${this.token}`;
  }

  // Get the details of a specific conversation
  async getConversation(conversationId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  }

  // Search for messages
  async searchMessages(query, conversationId = null) {
    try {
      const params = { query };
      if (conversationId) {
        params.conversationId = conversationId;
      }

      const response = await axios.get(`${API_BASE_URL}/api/messages/search`, {
        params,
        headers: { Authorization: `Bearer ${this.token}` }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }

  // Get unread message count
  async getUnreadCount() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/messages/unread-count`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      return response.data.data.count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }
}

// Create a singleton instance
export const messagingService = new MessagingService();

export default messagingService;