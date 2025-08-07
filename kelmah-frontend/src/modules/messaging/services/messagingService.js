/**
 * Messaging Service
 * Handles messaging functionality including conversations and message sending
 */

import { messagingServiceClient } from '../../common/services/axios';
import { getServiceStatusMessage } from '../../../utils/serviceHealthCheck';

export const messagingService = {
  // Get all conversations for the current user
  async getConversations() {
    try {
      const response = await messagingServiceClient.get('/api/conversations');
      return response.data || [];
    } catch (error) {
      const serviceUrl = messagingServiceClient.defaults.baseURL;
      const statusMsg = getServiceStatusMessage(serviceUrl);
      
      console.warn('Messaging service unavailable:', {
        error: error.message,
        serviceStatus: statusMsg.status,
        userMessage: statusMsg.message,
        action: statusMsg.action,
      });
      
      // Enhanced fallback messaging based on service status
      if (statusMsg.status === 'cold') {
        console.log('🔥 Messaging Service is cold starting - this is normal and will take 30-60 seconds...');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.log('💬 Using empty conversations fallback during service timeout');
      } else {
        console.log('💬 Using empty conversations fallback during service issues...');
      }
      
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
      console.warn(
        'Messaging service unavailable for conversation from application, simulating success:',
        error.message,
      );
      return {
        success: true,
        conversation: {
          id: `conv-${Date.now()}`,
          applicationId,
          createdAt: new Date(),
        },
      };
    }
  },
};
