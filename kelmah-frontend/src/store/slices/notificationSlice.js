import { createSlice } from '@reduxjs/toolkit';

/**
 * Notification slice for managing real-time notifications, messages, and user presence
 */
const initialState = {
  // Notifications
  notifications: [],
  unreadCount: 0,
  notificationSettings: {
    sound: true,
    desktop: true,
    email: true,
    sms: false,
    marketing: false,
  },

  // Real-time messaging
  conversations: {},
  activeConversation: null,
  unreadMessages: {},
  typingIndicators: {},

  // User presence
  onlineUsers: [],
  userStatuses: {},

  // Connection status
  connectionStatus: {
    connected: false,
    reconnecting: false,
    lastConnected: null,
    error: null,
  },

  // UI state
  notificationPanelOpen: false,
  soundEnabled: true,
  doNotDisturb: false,
  lastNotificationTime: null,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Notification actions
    addNotification: (state, action) => {
      const notification = {
        id: action.payload.id || Date.now(),
        timestamp: new Date().toISOString(),
        read: false,
        ...action.payload,
      };

      state.notifications.unshift(notification);
      state.unreadCount += 1;
      state.lastNotificationTime = notification.timestamp;

      // Limit to 100 notifications to prevent memory issues
      if (state.notifications.length > 100) {
        state.notifications = state.notifications.slice(0, 100);
      }
    },

    markNotificationAsRead: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(
        (n) => n.id === notificationId,
      );

      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach((notification) => {
        notification.read = true;
      });
      state.unreadCount = 0;
    },

    removeNotification: (state, action) => {
      const notificationId = action.payload;
      const notificationIndex = state.notifications.findIndex(
        (n) => n.id === notificationId,
      );

      if (notificationIndex !== -1) {
        const notification = state.notifications[notificationIndex];
        if (!notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(notificationIndex, 1);
      }
    },

    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },

    updateNotificationSettings: (state, action) => {
      state.notificationSettings = {
        ...state.notificationSettings,
        ...action.payload,
      };
    },

    toggleNotificationPanel: (state) => {
      state.notificationPanelOpen = !state.notificationPanelOpen;
    },

    setNotificationPanelOpen: (state, action) => {
      state.notificationPanelOpen = action.payload;
    },

    // Real-time messaging actions
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
    },

    addMessage: (state, action) => {
      const { conversationId, message } = action.payload;

      if (!state.conversations[conversationId]) {
        state.conversations[conversationId] = {
          id: conversationId,
          messages: [],
          participants: [],
          lastActivity: null,
          unreadCount: 0,
        };
      }

      const conversation = state.conversations[conversationId];
      conversation.messages.push(message);
      conversation.lastActivity = message.timestamp;

      // Mark as unread if not the active conversation
      if (state.activeConversation !== conversationId) {
        conversation.unreadCount += 1;

        if (!state.unreadMessages[conversationId]) {
          state.unreadMessages[conversationId] = 0;
        }
        state.unreadMessages[conversationId] += 1;
      }

      // Keep only last 100 messages per conversation
      if (conversation.messages.length > 100) {
        conversation.messages = conversation.messages.slice(-100);
      }
    },

    markConversationAsRead: (state, action) => {
      const conversationId = action.payload;

      if (state.conversations[conversationId]) {
        state.conversations[conversationId].unreadCount = 0;
      }

      delete state.unreadMessages[conversationId];
    },

    updateMessageStatus: (state, action) => {
      const { conversationId, messageId, status } = action.payload;

      if (state.conversations[conversationId]) {
        const message = state.conversations[conversationId].messages.find(
          (m) => m.id === messageId,
        );
        if (message) {
          message.status = status;
          message.updatedAt = new Date().toISOString();
        }
      }
    },

    setTypingIndicator: (state, action) => {
      const { conversationId, userId, isTyping, userName } = action.payload;

      if (!state.typingIndicators[conversationId]) {
        state.typingIndicators[conversationId] = {};
      }

      if (isTyping) {
        state.typingIndicators[conversationId][userId] = {
          userName,
          timestamp: new Date().toISOString(),
        };
      } else {
        delete state.typingIndicators[conversationId][userId];
      }
    },

    clearTypingIndicators: (state, action) => {
      const conversationId = action.payload;
      if (state.typingIndicators[conversationId]) {
        state.typingIndicators[conversationId] = {};
      }
    },

    // User presence actions
    updateOnlineUsers: (state, action) => {
      const { type, userId, users } = action.payload;

      switch (type) {
        case 'online':
          if (!state.onlineUsers.includes(userId)) {
            state.onlineUsers.push(userId);
          }
          state.userStatuses[userId] = {
            status: 'online',
            lastSeen: new Date().toISOString(),
          };
          break;

        case 'offline':
          state.onlineUsers = state.onlineUsers.filter(id => id !== userId);
          state.userStatuses[userId] = {
            status: 'offline',
            lastSeen: new Date().toISOString(),
          };
          break;

        case 'bulk':
          state.onlineUsers = [...new Set(users)];
          users.forEach((uid) => {
            state.userStatuses[uid] = {
              status: 'online',
              lastSeen: new Date().toISOString(),
            };
          });
          break;

        default:
          break;
      }
    },

    updateUserStatus: (state, action) => {
      const { userId, status, customStatus, lastSeen } = action.payload;

      state.userStatuses[userId] = {
        status,
        customStatus,
        lastSeen: lastSeen || new Date().toISOString(),
      };

      if (status === 'online') {
        if (!state.onlineUsers.includes(userId)) {
          state.onlineUsers.push(userId);
        }
      } else {
        state.onlineUsers = state.onlineUsers.filter(id => id !== userId);
      }
    },

    // Connection status actions
    setConnectionStatus: (state, action) => {
      state.connectionStatus = {
        ...state.connectionStatus,
        ...action.payload,
      };
    },

    setConnected: (state, action) => {
      state.connectionStatus.connected = action.payload;
      state.connectionStatus.lastConnected = action.payload
        ? new Date().toISOString()
        : state.connectionStatus.lastConnected;
      state.connectionStatus.error = null;
      state.connectionStatus.reconnecting = false;
    },

    setReconnecting: (state, action) => {
      state.connectionStatus.reconnecting = action.payload;
    },

    setConnectionError: (state, action) => {
      state.connectionStatus.error = action.payload;
      state.connectionStatus.connected = false;
      state.connectionStatus.reconnecting = false;
    },

    // UI and settings actions
    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled;
    },

    setSoundEnabled: (state, action) => {
      state.soundEnabled = action.payload;
    },

    toggleDoNotDisturb: (state) => {
      state.doNotDisturb = !state.doNotDisturb;
    },

    setDoNotDisturb: (state, action) => {
      state.doNotDisturb = action.payload;
    },

    // Bulk actions for performance
    bulkAddMessages: (state, action) => {
      const { conversationId, messages } = action.payload;

      if (!state.conversations[conversationId]) {
        state.conversations[conversationId] = {
          id: conversationId,
          messages: [],
          participants: [],
          lastActivity: null,
          unreadCount: 0,
        };
      }

      const conversation = state.conversations[conversationId];
      conversation.messages = [...conversation.messages, ...messages];

      if (messages.length > 0) {
        conversation.lastActivity = messages[messages.length - 1].timestamp;
      }

      // Keep only last 100 messages
      if (conversation.messages.length > 100) {
        conversation.messages = conversation.messages.slice(-100);
      }
    },

    updateConversationInfo: (state, action) => {
      const { conversationId, info } = action.payload;

      if (state.conversations[conversationId]) {
        state.conversations[conversationId] = {
          ...state.conversations[conversationId],
          ...info,
        };
      }
    },

    // Cleanup actions
    cleanupOldNotifications: (state) => {
      const oneWeekAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString();

      state.notifications = state.notifications.filter(
        (notification) => notification.timestamp > oneWeekAgo,
      );

      // Recalculate unread count
      state.unreadCount = state.notifications.filter((n) => !n.read).length;
    },

    cleanupOldMessages: (state) => {
      Object.keys(state.conversations).forEach((conversationId) => {
        const conversation = state.conversations[conversationId];
        if (conversation.messages.length > 100) {
          conversation.messages = conversation.messages.slice(-50); // Keep last 50
        }
      });
    },

    resetNotificationState: (state) => {
      return {
        ...initialState,
        notificationSettings: state.notificationSettings, // Preserve user settings
      };
    },
  },
});

export const {
  // Notification actions
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
  clearNotifications,
  updateNotificationSettings,
  toggleNotificationPanel,
  setNotificationPanelOpen,

  // Messaging actions
  setActiveConversation,
  addMessage,
  markConversationAsRead,
  updateMessageStatus,
  setTypingIndicator,
  clearTypingIndicators,
  bulkAddMessages,
  updateConversationInfo,

  // User presence actions
  updateOnlineUsers,
  updateUserStatus,

  // Connection actions
  setConnectionStatus,
  setConnected,
  setReconnecting,
  setConnectionError,

  // UI actions
  toggleSound,
  setSoundEnabled,
  toggleDoNotDisturb,
  setDoNotDisturb,

  // Cleanup actions
  cleanupOldNotifications,
  cleanupOldMessages,
  resetNotificationState,
} = notificationSlice.actions;

// Selectors
export const selectNotifications = (state) => state.notifications.notifications;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export const selectNotificationSettings = (state) =>
  state.notifications.notificationSettings;
export const selectConnectionStatus = (state) =>
  state.notifications.connectionStatus;
export const selectActiveConversation = (state) =>
  state.notifications.activeConversation;
export const selectConversations = (state) => state.notifications.conversations;
export const selectUnreadMessages = (state) =>
  state.notifications.unreadMessages;
export const selectOnlineUsers = (state) =>
  state.notifications.onlineUsers;
export const selectUserStatuses = (state) => state.notifications.userStatuses;
export const selectTypingIndicators = (state) =>
  state.notifications.typingIndicators;
export const selectSoundEnabled = (state) => state.notifications.soundEnabled;
export const selectDoNotDisturb = (state) => state.notifications.doNotDisturb;
export const selectNotificationPanelOpen = (state) =>
  state.notifications.notificationPanelOpen;

// Complex selectors
export const selectConversationById = (conversationId) => (state) =>
  state.notifications.conversations[conversationId];

export const selectUnreadNotifications = (state) =>
  state.notifications.notifications.filter((n) => !n.read);

export const selectNotificationsByType = (type) => (state) =>
  state.notifications.notifications.filter((n) => n.type === type);

export const selectTotalUnreadMessages = (state) =>
  Object.values(state.notifications.unreadMessages).reduce(
    (sum, count) => sum + count,
    0,
  );

export const selectIsUserOnline = (userId) => (state) =>
  state.notifications.onlineUsers.includes(userId);

export const selectUserStatus = (userId) => (state) =>
  state.notifications.userStatuses[userId] || {
    status: 'offline',
    lastSeen: null,
  };

export const selectConversationTyping = (conversationId) => (state) => {
  const typing = state.notifications.typingIndicators[conversationId];
  if (!typing) return [];

  return Object.entries(typing).map(([userId, info]) => ({
    userId,
    ...info,
  }));
};

export default notificationSlice.reducer;
