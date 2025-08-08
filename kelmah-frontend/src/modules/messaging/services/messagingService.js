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
      const response = await messagingServiceClient.get('/api/conversations');
      return response.data || [];
    } catch (error) {
      console.warn('Messaging service unavailable:', error.message);
      throw error;
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
};

// ✅ ADDED: Default export for compatibility
export default messagingService;
