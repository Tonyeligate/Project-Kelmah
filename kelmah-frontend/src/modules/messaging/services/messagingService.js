// Real-time socket support removed; using REST API only
import { format } from 'date-fns';
import axios from '../../common/services/axios';

class MessagingService {
  constructor() {
    // REST API only
  }

  // Get all conversations for the current user
  async getConversations() {
    const response = await axios.get('/api/conversations');
    return response.data.conversations;
  }

  // Get messages in a conversation
  async getMessages(conversationId, page = 1, limit = 50) {
    const response = await axios.get(`/api/messages/conversation/${conversationId}`, {
      params: { page, limit },
    });
    return response.data.messages;
  }

  // Send a message
  async sendMessage(senderId, recipientId, content) {
    const response = await axios.post('/api/messages', {
      sender: senderId,
      recipient: recipientId,
      content,
    });
    return response.data.data;
  }

  // Create a direct conversation
  async createDirectConversation(recipientId) {
    const response = await axios.post('/api/conversations', {
      participants: [recipientId],
    });
    return response.data.data;
  }

  // Create a group conversation
  async createGroupConversation(participantIds, metadata = {}) {
    const response = await axios.post('/api/conversations', {
      participants: participantIds,
      metadata,
    });
    return response.data.data;
  }

  // Get conversation metadata
  async getConversation(conversationId) {
    const response = await axios.get(`/api/conversations/${conversationId}`);
    return response.data;
  }

  // Get unread message count
  async getUnreadCount() {
    const response = await axios.get('/api/messages/unread/count');
    return response.data.unreadCount;
  }

  // No-op real-time placeholders to maintain backward compatibility with components that still call these methods
  initialize() {
    // In REST-only mode, no initialization is required
  }

  connect() {
    // No real-time socket connection in REST-only mode
  }

  disconnect() {
    // No socket to disconnect from
  }

  // Mark all messages in a conversation as read
  async markConversationAsRead(conversationId) {
    try {
      await axios.post(`/api/conversations/${conversationId}/read`);
    } catch (err) {
      // Silently fail – backend may not implement read receipts yet
      console.warn('markConversationAsRead failed or is not implemented on backend', err);
    }
  }
}

const MOCK_MESSAGE_STORE = {
  1: [
    {
      id: 'msg1',
      content:
        "Hi there! I saw your job posting for bathroom plumbing repair. I'm interested in taking it on.",
      createdAt: '2023-10-27T10:30:00Z',
      sender: {
        id: '2',
        name: 'John Smith',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      },
    },
    {
      id: 'msg2',
      content:
        'Hey John! Thanks for reaching out. Could you tell me more about your experience with similar projects?',
      createdAt: '2023-10-27T10:35:00Z',
      sender: { id: 'mock-user-id', name: 'You' }, // Assume this is the current user
    },
    {
      id: 'msg3',
      content:
        "I've been a licensed plumber for 15 years and have handled countless bathroom repairs. Most recently, I completed a full bathroom renovation for a client in downtown. I specialize in fixing leaks and installing new fixtures.",
      createdAt: '2023-10-27T10:38:00Z',
      sender: {
        id: '2',
        name: 'John Smith',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      },
    },
    {
      id: 'msg4',
      content:
        'That sounds perfect! When would you be available to come take a look?',
      createdAt: '2023-10-27T10:40:00Z',
      sender: { id: 'mock-user-id', name: 'You' },
    },
    {
      id: 'msg5',
      content:
        'I could come by tomorrow afternoon, around 2pm. Would that work for you?',
      createdAt: '2023-10-27T10:42:00Z',
      sender: {
        id: '2',
        name: 'John Smith',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      },
    },
  ],
  2: [
    {
      id: 'msg6',
      content: "Hello! I'm interested in the graphic design gig.",
      createdAt: '2023-10-27T09:10:00Z',
      sender: {
        id: '3',
        name: 'Maria Garcia',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      },
    },
    {
      id: 'msg7',
      content: 'Hi Maria, glad to hear it. Can you share your portfolio?',
      createdAt: '2023-10-27T09:12:00Z',
      sender: { id: 'mock-user-id', name: 'You' },
    },
    {
      id: 'msg8',
      content: "Of course, here's the link: [portfolio link].",
      createdAt: '2023-10-27T09:14:00Z',
      sender: {
        id: '3',
        name: 'Maria Garcia',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      },
    },
    {
      id: 'msg9',
      content: 'Sounds good, thank you!',
      createdAt: '2023-10-27T09:15:00Z',
      sender: {
        id: '3',
        name: 'Maria Garcia',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      },
    },
  ],
};

const messagingService = new MessagingService();
export default messagingService;
