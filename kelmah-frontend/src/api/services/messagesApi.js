/**
 * Messages API Service
 * Handles messaging between users
 */

import apiClient from '../index';

class MessagesApi {
  /**
   * Get all conversations for current user
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Results per page
   * @returns {Promise<Object>} Conversations data
   */
  async getConversations(params = {}) {
    const response = await apiClient.get('/messages/conversations', { params });
    return response.data;
  }
  
  /**
   * Get a specific conversation
   * @param {string} conversationId - Conversation ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Conversation with messages
   */
  async getConversation(conversationId, params = {}) {
    const response = await apiClient.get(`/messages/conversations/${conversationId}`, { params });
    return response.data;
  }
  
  /**
   * Get messages from a conversation
   * @param {string} conversationId - Conversation ID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Results per page
   * @returns {Promise<Object>} Messages data
   */
  async getMessages(conversationId, params = {}) {
    const response = await apiClient.get(`/messages/conversations/${conversationId}/messages`, { params });
    return response.data;
  }
  
  /**
   * Send a message
   * @param {string} conversationId - Conversation ID
   * @param {Object} messageData - Message data
   * @param {string} messageData.content - Message content
   * @returns {Promise<Object>} Sent message data
   */
  async sendMessage(conversationId, messageData) {
    const response = await apiClient.post(`/messages/conversations/${conversationId}/messages`, messageData);
    return response.data;
  }
  
  /**
   * Start a new conversation
   * @param {Object} conversationData - Conversation data
   * @param {string} conversationData.recipientId - Recipient user ID
   * @param {string} conversationData.initialMessage - First message content
   * @returns {Promise<Object>} New conversation data
   */
  async startConversation(conversationData) {
    const response = await apiClient.post('/messages/conversations', conversationData);
    return response.data;
  }
  
  /**
   * Mark conversation as read
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} Updated conversation
   */
  async markConversationAsRead(conversationId) {
    const response = await apiClient.put(`/messages/conversations/${conversationId}/read`);
    return response.data;
  }
  
  /**
   * Delete a conversation
   * @param {string} conversationId - Conversation ID to delete
   * @returns {Promise<Object>} Deletion response
   */
  async deleteConversation(conversationId) {
    const response = await apiClient.delete(`/messages/conversations/${conversationId}`);
    return response.data;
  }
  
  /**
   * Get unread message count
   * @returns {Promise<Object>} Unread count data
   */
  async getUnreadCount() {
    const response = await apiClient.get('/messages/unread');
    return response.data;
  }
  
  /**
   * Upload attachment to a message
   * @param {string} conversationId - Conversation ID
   * @param {FormData} formData - Form data with file
   * @returns {Promise<Object>} Attachment data
   */
  async uploadAttachment(conversationId, formData) {
    const response = await apiClient.post(`/messages/conversations/${conversationId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
  
  /**
   * Search messages
   * @param {Object} params - Search parameters
   * @param {string} params.query - Search query
   * @param {string} params.conversationId - Optional conversation ID to limit search
   * @returns {Promise<Object>} Search results
   */
  async searchMessages(params = {}) {
    const response = await apiClient.get('/messages/search', { params });
    return response.data;
  }
  
  /**
   * Update notification settings for messaging
   * @param {Object} settings - Notification settings
   * @returns {Promise<Object>} Updated settings
   */
  async updateNotificationSettings(settings) {
    const response = await apiClient.put('/messages/settings', settings);
    return response.data;
  }
}

export default new MessagesApi(); 