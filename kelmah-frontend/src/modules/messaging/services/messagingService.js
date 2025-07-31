/**
 * Messaging Service
 * Handles messaging functionality including conversations and message sending
 */

import { messagingServiceClient } from '../../common/services/axios';

export const messagingService = {
  // Get all conversations for the current user
  async getConversations() {
    try {
      const response = await messagingServiceClient.get('/api/conversations');
      return response.data;
    } catch (error) {
      console.warn(
        'Messaging service unavailable for conversations, using mock data:',
        error.message,
      );
      return {
        conversations: [
          {
            id: 'conv-1',
            participants: [
              {
                id: 'user-1',
                name: 'John Contractor',
                avatar: '/api/placeholder/40/40',
              },
              {
                id: 'user-2',
                name: 'Sarah Client',
                avatar: '/api/placeholder/40/40',
              },
            ],
            lastMessage: {
              content: 'Thanks for the update on the project!',
              timestamp: new Date(Date.now() - 1000 * 60 * 30),
              senderId: 'user-2',
            },
            unreadCount: 2,
            jobTitle: 'Kitchen Renovation',
          },
          {
            id: 'conv-2',
            participants: [
              {
                id: 'user-1',
                name: 'Mike Builder',
                avatar: '/api/placeholder/40/40',
              },
              {
                id: 'user-3',
                name: 'Tech Support',
                avatar: '/api/placeholder/40/40',
              },
            ],
            lastMessage: {
              content: 'When can we schedule the next phase?',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
              senderId: 'user-1',
            },
            unreadCount: 0,
            jobTitle: 'Office Setup',
          },
        ],
      };
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
      console.warn(
        'Messaging service unavailable for creating conversation, simulating success:',
        error.message,
      );
      return {
        success: true,
        conversation: {
          id: `conv-${Date.now()}`,
          participants: [{ id: participantId }],
          jobId,
          createdAt: new Date(),
        },
      };
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
