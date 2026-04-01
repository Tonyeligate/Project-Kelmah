/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from 'react';
import PropTypes from 'prop-types';
import { messagingService } from '../services/messagingService';
import { useAuth } from '../../auth/hooks/useAuth';
// CRIT-08 FIX: Removed direct `import io` - reuse the global websocketService
// singleton instead of creating a second Socket.IO connection.
import websocketService from '../../../services/websocketService';
import fileUploadService from '../../common/services/fileUploadService';
import { normalizeAttachmentListVirusScan } from '../utils/virusScanUtils';
import {
  MESSAGE_DELIVERY_ALIASES,
  SOCKET_EVENTS,
} from '../../../services/socketEvents';
import {
  buildRealtimeMessageKey,
  createRealtimeMessageDeduper,
} from '../utils/realtimeMessageDeduper';
import {
  createFeatureLogger,
  devError,
  devWarn,
} from '@/modules/common/utils/devLogger';

const MESSAGING_SOCKET_EVENTS = [
  ...MESSAGE_DELIVERY_ALIASES,
  SOCKET_EVENTS.MESSAGE.MESSAGE_DELIVERED,
  SOCKET_EVENTS.MESSAGE.MESSAGE_READ,
  SOCKET_EVENTS.MESSAGE.USER_TYPING,
  SOCKET_EVENTS.MESSAGE.MESSAGES_READ,
  'user_status_changed',
  SOCKET_EVENTS.PRESENCE.USER_ONLINE,
  SOCKET_EVENTS.PRESENCE.USER_OFFLINE,
  SOCKET_EVENTS.CORE.CONNECTED,
  SOCKET_EVENTS.CORE.CONNECT,
  SOCKET_EVENTS.CORE.DISCONNECT,
  SOCKET_EVENTS.CORE.CONNECT_ERROR,
  SOCKET_EVENTS.CORE.ERROR,
];

const MessageContext = createContext(null);
const messagingLog = createFeatureLogger({
  flagName: 'VITE_DEBUG_MESSAGING',
  level: 'log',
});

const normalizeParticipant = (participant = {}) => {
  if (!participant || typeof participant !== 'object') return participant;
  return {
    ...participant,
    id: participant.id || participant._id || participant.userId,
  };
};

const resolveParticipantId = (participant) => {
  if (!participant) return null;
  if (typeof participant === 'string') return participant;
  if (typeof participant === 'object') {
    return participant.id || participant._id || participant.userId || null;
  }
  return null;
};

const normalizeContextAttachment = (attachment = {}) => {
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
      : attachment.type === 'video' || String(mimeType).startsWith('video/')
        ? 'video'
        : attachment.type || 'file';

  return {
    ...attachment,
    id: attachment.id || attachment._id,
    url:
      attachment.url ||
      attachment.fileUrl ||
      attachment.path ||
      attachment.getUrl ||
      null,
    fileUrl: attachment.fileUrl || attachment.url || null,
    type: normalizedType,
    mimeType,
    fileType: attachment.fileType || mimeType || attachment.type,
    name:
      attachment.name ||
      attachment.fileName ||
      attachment.filename ||
      'Attachment',
    size: attachment.size || attachment.fileSize || 0,
  };
};

const uploadPendingAttachments = async (attachments = [], conversationId) => {
  const normalized = Array.isArray(attachments) ? attachments : [];

  return Promise.all(
    normalized.map(async (attachment) => {
      const sourceFile =
        typeof File !== 'undefined' && attachment?.file instanceof File
          ? attachment.file
          : null;
      if (!sourceFile) {
        return normalizeContextAttachment(attachment);
      }

      const uploaded = await fileUploadService.uploadFile(
        sourceFile,
        `attachments/${conversationId}`,
        'messaging',
      );

      const mimeType =
        attachment?.mimeType || attachment?.fileType || sourceFile.type || '';

      return normalizeContextAttachment({
        name: attachment?.name || sourceFile.name,
        fileName: attachment?.name || sourceFile.name,
        url: uploaded.url,
        fileUrl: uploaded.fileUrl || uploaded.url,
        type: String(mimeType).startsWith('image/')
          ? 'image'
          : String(mimeType).startsWith('video/')
            ? 'video'
            : 'file',
        mimeType,
        fileType: mimeType,
        size: uploaded.size || sourceFile.size,
        fileSize: uploaded.size || sourceFile.size,
        uploadDate: new Date().toISOString(),
        publicId: uploaded.publicId || null,
        resourceType: uploaded.resourceType || null,
        thumbnailUrl: uploaded.thumbnailUrl || null,
        width: uploaded.width || null,
        height: uploaded.height || null,
        duration: uploaded.duration || null,
        format: uploaded.format || null,
      });
    }),
  );
};

const normalizeMessageAttachments = (message = {}) => {
  if (!message || typeof message !== 'object') return null;

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
    // Map content<->text and createdAt<->timestamp for UI compatibility
    text: message.text || message.content || '',
    content: message.content || message.text || '',
    timestamp: message.timestamp || message.createdAt,
    createdAt: message.createdAt || message.timestamp,
    attachments: normalizeAttachmentListVirusScan(
      (message.attachments || []).map((attachment) =>
        normalizeContextAttachment(attachment),
      ),
    ),
  };
};

const getMessageTimestamp = (message = {}) => {
  const timestamp = message.updatedAt || message.createdAt || message.timestamp;
  const parsedTimestamp = new Date(timestamp || 0).getTime();
  return Number.isFinite(parsedTimestamp) ? parsedTimestamp : 0;
};

const isOptimisticMessage = (message = {}) =>
  Boolean(
    message?.optimistic ||
      String(message?.status || '').toLowerCase() === 'sending',
  );

const preferMessageVersion = (existingMessage, incomingMessage) => {
  if (!existingMessage) {
    return incomingMessage;
  }

  if (!incomingMessage) {
    return existingMessage;
  }

  const existingOptimistic = isOptimisticMessage(existingMessage);
  const incomingOptimistic = isOptimisticMessage(incomingMessage);

  if (existingOptimistic !== incomingOptimistic) {
    return existingOptimistic ? incomingMessage : existingMessage;
  }

  const existingTimestamp = getMessageTimestamp(existingMessage);
  const incomingTimestamp = getMessageTimestamp(incomingMessage);

  if (incomingTimestamp !== existingTimestamp) {
    return incomingTimestamp > existingTimestamp
      ? incomingMessage
      : existingMessage;
  }

  return {
    ...existingMessage,
    ...incomingMessage,
  };
};

const dedupeMessageList = (messages = []) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  const dedupedMessages = [];
  const messageIndexByKey = new Map();

  messages.forEach((message) => {
    if (!message || typeof message !== 'object') {
      return;
    }

    const key = buildRealtimeMessageKey(message);
    if (!key) {
      dedupedMessages.push(message);
      return;
    }

    if (!messageIndexByKey.has(key)) {
      messageIndexByKey.set(key, dedupedMessages.length);
      dedupedMessages.push(message);
      return;
    }

    const existingIndex = messageIndexByKey.get(key);
    dedupedMessages[existingIndex] = preferMessageVersion(
      dedupedMessages[existingIndex],
      message,
    );
  });

  return dedupedMessages;
};

const normalizeConversation = (conversation = {}) => {
  if (!conversation || typeof conversation !== 'object') return null;

  return {
    ...conversation,
    id: conversation.id || conversation._id,
    participants: Array.isArray(conversation.participants)
      ? conversation.participants.map((participant) =>
          normalizeParticipant(participant),
        )
      : [],
    unread:
      typeof conversation.unread === 'number'
        ? conversation.unread
        : conversation.unreadCount || 0,
    unreadCount:
      typeof conversation.unreadCount === 'number'
        ? conversation.unreadCount
        : conversation.unread || 0,
    lastMessage: conversation.lastMessage
      ? normalizeMessageAttachments(conversation.lastMessage)
      : conversation.lastMessage,
    latestMessage: conversation.latestMessage
      ? normalizeMessageAttachments(conversation.latestMessage)
      : conversation.latestMessage,
  };
};

const normalizeConversationList = (list = []) =>
  (Array.isArray(list) ? list : [])
    .map((conversation) => normalizeConversation(conversation))
    .filter(Boolean);

const normalizeMessageList = (list = []) =>
  dedupeMessageList(
    (Array.isArray(list) ? list : [])
      .map((message) => normalizeMessageAttachments(message))
      .filter(Boolean),
  );

const createTemporaryConversation = (participant = {}) => {
  const participantId = resolveParticipantId(participant);
  const tempId = `temp-${participantId || Date.now()}`;

  return {
    id: tempId,
    _id: tempId,
    isTemporary: true,
    participants: participantId
      ? [
          normalizeParticipant({
            ...participant,
            id: participantId,
          }),
        ]
      : [],
    unread: 0,
    unreadCount: 0,
    lastMessage: null,
    latestMessage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

const sortConversationsByActivity = (list = []) =>
  [...list].sort((left, right) => {
    const leftStamp = new Date(
      left?.lastMessage?.createdAt ||
        left?.lastMessage?.timestamp ||
        left?.updatedAt ||
        0,
    ).getTime();
    const rightStamp = new Date(
      right?.lastMessage?.createdAt ||
        right?.lastMessage?.timestamp ||
        right?.updatedAt ||
        0,
    ).getTime();
    return rightStamp - leftStamp;
  });

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

export const MessageProvider = ({ children }) => {
  const { user, getToken, isAuthenticated, loading: authLoading } = useAuth();
  const socketRef = useRef(null);
  const connectingRef = useRef(false);
  const selectedConversationRef = useRef(null);
  const getTokenRef = useRef(getToken);
  const conversationJoinHandlerRef = useRef(null);
  const conversationLoadTimeoutRef = useRef(null);
  // Stores named handler references so we can remove ONLY our listeners on cleanup
  const msgListenersRef = useRef({});
  const realtimeMessageDeduperRef = useRef(createRealtimeMessageDeduper());

  // Real-time WebSocket state
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [realtimeIssue, setRealtimeIssue] = useState(null);
  const socketErrorLoggedRef = useRef(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  // Map<conversationId, Map<userId, userInfo>>
  const [typingUsers, setTypingUsers] = useState(new Map());

  // Messaging state
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [messageAnnouncement, setMessageAnnouncement] = useState('');

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  // Load the current user's conversations (with retry for cold starts)
  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    let lastError = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await messagingService.getConversations();
        // Ensure we extract the conversations array from the response
        const convs = Array.isArray(response)
          ? response
          : response?.conversations || response?.data || [];
        const normalized = sortConversationsByActivity(
          normalizeConversationList(convs),
        );
        setConversations(normalized);
        setLoadingConversations(false);
        return normalized; // Return list for callers that need it
      } catch (error) {
        lastError = error;
        messagingLog(
          `loadConversations attempt ${attempt}/2 failed:`,
          error.message,
        );
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 3000)); // Wait 3s before retry
        }
      }
    }

    // All retries failed
    devError('Error loading conversations after retries:', lastError);
    setConversations([]);
    setLoadingConversations(false);
    return [];
  }, []);

  // CRIT-08 FIX: Reuse the global websocketService singleton instead of
  // creating a second Socket.IO connection. We subscribe to the
  // messaging-specific events on the shared socket.
  const connectWebSocket = useCallback(async () => {
    if (!user || !isAuthenticated || authLoading) return;
    if (socketRef.current || connectingRef.current) return;

    const token = getTokenRef.current?.();
    if (!token) return;
    connectingRef.current = true;

    try {
      // Ensure the global websocket service is connected
      if (!websocketService.isConnected) {
        await websocketService.connect(user.id, user.role, token);
      }

      const sharedSocket = websocketService.socket;
      if (!sharedSocket) {
        devWarn(
          'WebSocketService socket unavailable - messaging will use REST only',
        );
        setRealtimeIssue(
          'Real-time connection unavailable. Using standard refresh mode.',
        );
        connectingRef.current = false;
        return;
      }

      messagingLog('MessageContext: reusing shared WebSocket connection');

      // Remove ONLY the listeners WE registered (named references), not all listeners
      const msgListeners = msgListenersRef.current;
      MESSAGING_SOCKET_EVENTS.forEach((evt) => {
        if (msgListeners[evt]) sharedSocket.off(evt, msgListeners[evt]);
      });
      msgListenersRef.current = {};

      // Listen for messaging-specific events on the SHARED socket
      const onConnect = () => {
        setIsConnected(true);
        setRealtimeIssue(null);
        socketErrorLoggedRef.current = false;
        connectingRef.current = false;
      };
      const onDisconnect = (reason) => {
        setIsConnected(false);
        if (reason && reason !== 'io client disconnect') {
          setRealtimeIssue('Real-time updates are temporarily unavailable.');
        }
        connectingRef.current = false;
      };
      const onConnectError = (error) => {
        if (!socketErrorLoggedRef.current) {
          devError('WebSocket connection error:', error);
          socketErrorLoggedRef.current = true;
        }
        setRealtimeIssue(
          'Real-time connection failed. Using standard refresh mode.',
        );
        connectingRef.current = false;
      };
      const onConnected = (data) => {
        messagingLog('Messaging service connected:', data);
        if (data.conversations) {
          setConversations((prev) => {
            if (Array.isArray(prev) && prev.length > 0) {
              return prev;
            }
            return sortConversationsByActivity(
              normalizeConversationList(data.conversations),
            );
          });
        }
        if (Array.isArray(data?.onlineUsers)) {
          setOnlineUsers(new Set(data.onlineUsers.map((id) => String(id))));
        }
      };
      const onNewMessage = (messageData) => {
        messagingLog('New message received:', messageData);
        const hydratedMessage = normalizeMessageAttachments(messageData);
        if (realtimeMessageDeduperRef.current.mark(hydratedMessage)) {
          return;
        }
        const hydratedConversationId = hydratedMessage.conversationId;
        const activeConversation = selectedConversationRef.current;

        if (
          activeConversation &&
          hydratedConversationId === activeConversation.id
        ) {
          setMessages((prev) => {
            const { clientId } = hydratedMessage;
            const existingIdIndex = prev.findIndex(
              (message) => String(message.id) === String(hydratedMessage.id),
            );
            if (existingIdIndex !== -1) {
              const updated = [...prev];
              updated[existingIdIndex] = {
                ...updated[existingIdIndex],
                ...hydratedMessage,
                status: 'sent',
              };
              return updated;
            }
            if (clientId) {
              const index = prev.findIndex((m) => m.id === clientId);
              if (index !== -1) {
                const updated = [...prev];
                updated[index] = { ...hydratedMessage, status: 'sent' };
                return updated;
              }
            }
            return [...prev, hydratedMessage];
          });
        }

        const activeConvId = activeConversation?.id;
        if (
          hydratedMessage.senderId &&
          String(hydratedMessage.senderId) !== String(user?.id)
        ) {
          const senderName =
            hydratedMessage.senderName ||
            hydratedMessage.sender?.name ||
            hydratedMessage.sender?.fullName ||
            'New message';
          setMessageAnnouncement(`${senderName} sent a new message.`);
        }

        setConversations((prev) =>
          sortConversationsByActivity(
            prev.map((conv) =>
              conv.id === hydratedConversationId
                ? {
                    ...conv,
                    lastMessage: hydratedMessage,
                    updatedAt: hydratedMessage.createdAt,
                    // Increment unread badge only when this conversation is NOT currently open
                    unreadCount:
                      conv.id !== activeConvId
                        ? (conv.unreadCount || 0) + 1
                        : 0,
                    unread:
                      conv.id !== activeConvId ? (conv.unread || 0) + 1 : 0,
                  }
                : conv,
            ),
          ),
        );
      };
      const onUserTyping = (data) => {
        const { conversationId, userId, isTyping, user: typingUser } = data;
        setTypingUsers((prev) => {
          const newMap = new Map(prev);
          const convMap = newMap.get(conversationId) || new Map();
          if (isTyping) {
            convMap.set(userId, typingUser || { id: userId });
            newMap.set(conversationId, convMap);
          } else {
            if (convMap.has(userId)) {
              convMap.delete(userId);
            }
            if (convMap.size === 0) {
              newMap.delete(conversationId);
            } else {
              newMap.set(conversationId, convMap);
            }
          }
          return newMap;
        });
      };
      const onMessagesRead = (data) => {
        messagingLog('Messages marked as read:', data);
        const activeConversation = selectedConversationRef.current;
        if (
          activeConversation &&
          data.conversationId === activeConversation.id
        ) {
          setMessages((prev) =>
            prev.map((msg) =>
              data.messageIds === 'all_unread' ||
              data.messageIds.includes(msg.id)
                ? { ...msg, isRead: true, readAt: data.readAt }
                : msg,
            ),
          );
        }
      };
      const onUserStatusChanged = (data) => {
        const { userId, status } = data;
        const normalizedUserId = String(userId);
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          if (status === 'online') {
            newSet.add(normalizedUserId);
          } else {
            newSet.delete(normalizedUserId);
          }
          return newSet;
        });
      };
      const onUserOnline = (data) =>
        onUserStatusChanged({ userId: data.userId, status: 'online' });
      const onUserOffline = (data) =>
        onUserStatusChanged({ userId: data.userId, status: 'offline' });

      const onMessageDelivered = (data) => {
        messagingLog('Message delivered:', data);
        const activeConversation = selectedConversationRef.current;
        if (
          activeConversation &&
          data.conversationId === activeConversation.id
        ) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === data.messageId
                ? {
                    ...msg,
                    status: 'delivered',
                    isDelivered: true,
                    deliveredAt: data.deliveredAt || Date.now(),
                  }
                : msg,
            ),
          );
        }
      };

      const onError = (error) => {
        devError('WebSocket error:', error);
      };

      // Register all named handlers and store references for cleanup
      msgListenersRef.current = {
        [SOCKET_EVENTS.CORE.CONNECT]: onConnect,
        [SOCKET_EVENTS.CORE.DISCONNECT]: onDisconnect,
        [SOCKET_EVENTS.CORE.CONNECT_ERROR]: onConnectError,
        [SOCKET_EVENTS.CORE.CONNECTED]: onConnected,
        [SOCKET_EVENTS.MESSAGE.NEW_MESSAGE]: onNewMessage,
        [SOCKET_EVENTS.MESSAGE.RECEIVE_MESSAGE]: onNewMessage,
        [SOCKET_EVENTS.MESSAGE.NEW_MESSAGE_ALT]: onNewMessage,
        [SOCKET_EVENTS.MESSAGE.USER_TYPING]: onUserTyping,
        [SOCKET_EVENTS.MESSAGE.MESSAGES_READ]: onMessagesRead,
        [SOCKET_EVENTS.MESSAGE.MESSAGE_READ]: onMessagesRead,
        [SOCKET_EVENTS.MESSAGE.MESSAGE_DELIVERED]: onMessageDelivered,
        user_status_changed: onUserStatusChanged,
        [SOCKET_EVENTS.PRESENCE.USER_ONLINE]: onUserOnline,
        [SOCKET_EVENTS.PRESENCE.USER_OFFLINE]: onUserOffline,
        [SOCKET_EVENTS.CORE.ERROR]: onError,
      };
      Object.entries(msgListenersRef.current).forEach(([evt, handler]) => {
        sharedSocket.on(evt, handler);
      });

      socketRef.current = sharedSocket;
      setSocket(sharedSocket);
      // If socket is already connected, update state immediately
      if (sharedSocket.connected) {
        setIsConnected(true);
        connectingRef.current = false;
      }
    } catch (error) {
      devError('Failed to initialize messaging socket:', error);
      setRealtimeIssue(
        'Real-time connection failed. Using standard refresh mode.',
      );
      connectingRef.current = false;
    }
  }, [authLoading, isAuthenticated, user]);

  // Disconnect WebSocket
  // CRIT-08 FIX: Only remove messaging-specific listeners from the shared
  // socket. Do NOT call activeSocket.disconnect() - that would kill the
  // connection for notifications and all other features too.
  const disconnectWebSocket = useCallback(() => {
    const activeSocket = socketRef.current;
    if (conversationLoadTimeoutRef.current) {
      clearTimeout(conversationLoadTimeoutRef.current);
      conversationLoadTimeoutRef.current = null;
    }
    if (activeSocket) {
      messagingLog(
        'MessageContext: detaching messaging listeners from shared socket',
      );
      const msgListeners = msgListenersRef.current;
      try {
        MESSAGING_SOCKET_EVENTS.forEach((evt) => {
          if (msgListeners[evt]) activeSocket.off(evt, msgListeners[evt]);
        });
        if (conversationJoinHandlerRef.current) {
          activeSocket.off(
            SOCKET_EVENTS.CONVERSATION.JOINED,
            conversationJoinHandlerRef.current,
          );
          conversationJoinHandlerRef.current = null;
        }
        msgListenersRef.current = {};
      } catch (error) {
        messagingLog('Failed to remove messaging listeners', error);
      }
      // Do NOT disconnect the shared socket
      setSocket(null);
      setIsConnected(false);
      setRealtimeIssue(null);
    }
    socketRef.current = null;
    connectingRef.current = false;
    realtimeMessageDeduperRef.current.clear();
  }, []);

  useEffect(() => {
    const canInitializeMessaging = Boolean(
      user && isAuthenticated && !authLoading && getTokenRef.current?.(),
    );

    if (canInitializeMessaging) {
      loadConversations();
      connectWebSocket();
    } else {
      disconnectWebSocket();
      setConversations([]);
      setSelectedConversation(null);
      setMessages([]);
      setMessageAnnouncement('');
      setLoadingConversations(Boolean(authLoading));
    }

    return () => {
      disconnectWebSocket();
    };
  }, [
    authLoading,
    isAuthenticated,
    user,
    loadConversations,
    connectWebSocket,
    disconnectWebSocket,
  ]);

  const loadingMessagesRef = useRef(false);

  const selectConversation = useCallback(
    async (conversation) => {
      const normalizedConversation = normalizeConversation(conversation);
      if (!normalizedConversation?.id) return;
      if (selectedConversation?.id === normalizedConversation.id) return;

      // Leave previous conversation room
      if (selectedConversation && socket && !selectedConversation.isTemporary) {
        socket.emit(SOCKET_EVENTS.CONVERSATION.LEAVE, {
          conversationId: selectedConversation.id,
        });
      }

      if (socket && conversationJoinHandlerRef.current) {
        socket.off(
          SOCKET_EVENTS.CONVERSATION.JOINED,
          conversationJoinHandlerRef.current,
        );
        conversationJoinHandlerRef.current = null;
      }
      if (conversationLoadTimeoutRef.current) {
        clearTimeout(conversationLoadTimeoutRef.current);
        conversationLoadTimeoutRef.current = null;
      }

      setConversations((prev) => {
        const exists = prev.some(
          (c) => String(c.id || c._id) === String(normalizedConversation.id),
        );
        if (!exists) {
          return [normalizedConversation, ...prev];
        }
        return prev.map((c) =>
          String(c.id || c._id) === String(normalizedConversation.id)
            ? { ...c, ...normalizedConversation }
            : c,
        );
      });

      setSelectedConversation(normalizedConversation);
      setLoadingMessages(true);
      loadingMessagesRef.current = true;
      setMessages([]);

      // Reset unread badge immediately when opening a conversation
      setConversations((prev) =>
        prev.map((c) =>
          c.id === normalizedConversation.id
            ? { ...c, unreadCount: 0, unread: 0 }
            : c,
        ),
      );

      if (normalizedConversation.isTemporary) {
        setLoadingMessages(false);
        loadingMessagesRef.current = false;
        return;
      }

      try {
        // Join new conversation room via WebSocket
        if (socket && isConnected) {
          socket.emit(SOCKET_EVENTS.CONVERSATION.JOIN, {
            conversationId: normalizedConversation.id,
          });

          // Notify backend that messages in this conversation have been read
          socket.emit(SOCKET_EVENTS.CONVERSATION.MARK_READ, {
            conversationId: normalizedConversation.id,
            messageIds: 'all_unread',
          });

          // Listen for conversation joined event
          const handleConversationJoined = (data) => {
            if (
              String(data?.conversationId) !== String(normalizedConversation.id)
            ) {
              return;
            }
            if (conversationJoinHandlerRef.current) {
              socket.off(
                SOCKET_EVENTS.CONVERSATION.JOINED,
                conversationJoinHandlerRef.current,
              );
              conversationJoinHandlerRef.current = null;
            }
            if (conversationLoadTimeoutRef.current) {
              clearTimeout(conversationLoadTimeoutRef.current);
              conversationLoadTimeoutRef.current = null;
            }
            messagingLog('Joined conversation:', data);
            setMessages(normalizeMessageList(data.messages || []));
            setLoadingMessages(false);
            loadingMessagesRef.current = false;
          };

          conversationJoinHandlerRef.current = handleConversationJoined;
          socket.on(
            SOCKET_EVENTS.CONVERSATION.JOINED,
            handleConversationJoined,
          );

          // MED-21 FIX: Fallback timeout - fetch via REST if WS doesn't respond in time
          const conversationId = normalizedConversation.id;
          conversationLoadTimeoutRef.current = setTimeout(async () => {
            if (loadingMessagesRef.current) {
              try {
                const fallbackMessages =
                  await messagingService.getMessages(conversationId);
                setMessages(normalizeMessageList(fallbackMessages));
              } catch (fallbackErr) {
                messagingLog(
                  'REST fallback for messages also failed:',
                  fallbackErr.message,
                );
              } finally {
                if (conversationJoinHandlerRef.current) {
                  socket.off(
                    SOCKET_EVENTS.CONVERSATION.JOINED,
                    conversationJoinHandlerRef.current,
                  );
                  conversationJoinHandlerRef.current = null;
                }
                setLoadingMessages(false);
                loadingMessagesRef.current = false;
                conversationLoadTimeoutRef.current = null;
              }
            }
          }, 5000);
        } else {
          // Fallback to REST API if WebSocket not available
          const loadedMessages = await messagingService.getMessages(
            normalizedConversation.id,
          );
          setMessages(normalizeMessageList(loadedMessages));
          setLoadingMessages(false);
        }
      } catch (error) {
        devError(
          `Error loading messages for conversation ${normalizedConversation.id}:`,
          error,
        );
        setMessages([]);
        setLoadingMessages(false);
      }
    },
    [selectedConversation, socket, isConnected],
  );

  const sendMessage = useCallback(
    async (content, messageType = 'text', attachments = []) => {
      if (!selectedConversation || !user) return;

      const currentUserId = user.id || user._id || user.userId;
      if (!currentUserId) return;

      const trimmedContent = typeof content === 'string' ? content.trim() : '';
      const rawAttachments = Array.isArray(attachments) ? attachments : [];
      if (!trimmedContent && rawAttachments.length === 0) return;

      const normalizedMessageType =
        messageType === 'mixed'
          ? rawAttachments.some((attachment) => {
              const mimeType =
                attachment?.type ||
                attachment?.mimeType ||
                attachment?.fileType ||
                '';
              return String(mimeType).startsWith('image/');
            })
            ? 'image'
            : 'file'
          : messageType;

      setSendingMessage(true);
      try {
        let activeConversation = selectedConversation;

        if (selectedConversation.isTemporary) {
          const tempRecipient = selectedConversation.participants.find(
            (participant) => resolveParticipantId(participant),
          );
          const tempRecipientId = resolveParticipantId(tempRecipient);
          if (!tempRecipientId) {
            throw new Error('Unable to resolve temporary message recipient');
          }

          const createdConversation =
            await messagingService.createDirectConversation(tempRecipientId);
          const normalizedCreatedConversation =
            normalizeConversation(createdConversation);

          setConversations((prev) =>
            sortConversationsByActivity(
              prev.map((conversation) =>
                conversation.id === selectedConversation.id
                  ? {
                      ...normalizedCreatedConversation,
                      unreadCount: 0,
                      unread: 0,
                    }
                  : conversation,
              ),
            ),
          );

          setSelectedConversation(normalizedCreatedConversation);
          activeConversation = normalizedCreatedConversation;
        }

        const uploadedAttachments = await uploadPendingAttachments(
          attachments,
          activeConversation.id,
        );
        const safeAttachments =
          normalizeAttachmentListVirusScan(uploadedAttachments);

        // Use WebSocket for real-time messaging if available
        if (socket && isConnected) {
          messagingLog('Sending message via WebSocket');
          // Create optimistic message with clientId
          const clientId = `${currentUserId}_${Date.now()}`;
          const now = new Date().toISOString();
          const optimisticMessage = {
            id: clientId,
            clientId,
            conversationId: activeConversation.id,
            senderId: currentUserId,
            sender: currentUserId,
            senderInfo: {
              id: currentUserId,
              name: user?.name || user?.firstName || 'You',
            },
            content: trimmedContent,
            text: trimmedContent,
            messageType: normalizedMessageType,
            attachments: safeAttachments,
            createdAt: now,
            timestamp: now,
            isRead: false,
            status: 'sending',
            optimistic: true,
          };
          setMessages((prev) =>
            dedupeMessageList([...prev, optimisticMessage]),
          );
          setConversations((prev) =>
            sortConversationsByActivity(
              prev.map((c) =>
                c.id === activeConversation.id
                  ? {
                      ...c,
                      lastMessage: optimisticMessage,
                      updatedAt: optimisticMessage.createdAt,
                    }
                  : c,
              ),
            ),
          );

          // Use acknowledgement to verify delivery; fallback to REST if failed
          const useEncrypted =
            import.meta.env.VITE_ENABLE_E2E_ENVELOPE === 'true';
          const eventName = useEncrypted ? 'send_encrypted' : 'send_message';
          const payload = useEncrypted
            ? {
                conversationId: activeConversation.id,
                encryptedBody: trimmedContent,
                encryption: { scheme: 'beta', version: '1', senderKeyId: 'me' },
                messageType: normalizedMessageType,
                attachments: safeAttachments,
                clientId,
              }
            : {
                conversationId: activeConversation.id,
                content: trimmedContent,
                messageType: normalizedMessageType,
                attachments: safeAttachments,
                clientId,
              };

          socket.emit(eventName, payload, async (ack) => {
            if (!ack || ack.ok !== true) {
              messagingLog('WebSocket send failed, falling back to REST', ack);
              try {
                const recipient = activeConversation.participants.find(
                  (participant) => {
                    const participantId = resolveParticipantId(participant);
                    return participantId && participantId !== currentUserId;
                  },
                );
                const recipientId = resolveParticipantId(recipient);
                if (!recipientId) {
                  throw new Error('Unable to resolve message recipient');
                }
                const newMessage = await messagingService.sendMessage(
                  currentUserId,
                  recipientId,
                  trimmedContent,
                  normalizedMessageType,
                  safeAttachments,
                  activeConversation.id,
                );
                const normalized = normalizeMessageAttachments(newMessage);
                // Replace the optimistic placeholder with the persisted message.
                // If the realtime echo already arrived, update in place instead of duplicating.
                setMessages((prev) => {
                  const existingPersistedIndex = prev.findIndex(
                    (message) => String(message.id) === String(normalized.id),
                  );
                  if (existingPersistedIndex !== -1) {
                    const updated = [...prev];
                    updated[existingPersistedIndex] = {
                      ...updated[existingPersistedIndex],
                      ...normalized,
                      status: 'sent',
                    };
                    return updated;
                  }

                  const idx = prev.findIndex((m) => m.id === clientId);
                  if (idx === -1) {
                    return dedupeMessageList([...prev, normalized]);
                  }

                  const copy = [...prev];
                  copy[idx] = { ...normalized, status: 'sent' };
                  return dedupeMessageList(copy);
                });
                setConversations((prev) =>
                  sortConversationsByActivity(
                    prev.map((c) =>
                      c.id === activeConversation.id
                        ? {
                            ...c,
                            lastMessage: normalized,
                            updatedAt: normalized.createdAt,
                          }
                        : c,
                    ),
                  ),
                );
              } catch (e) {
                devError('REST fallback failed:', e);
                // Mark optimistic message as failed
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === clientId ? { ...m, status: 'failed' } : m,
                  ),
                );
              }
            }
          });
          // Message will be added to UI via 'new_message' event
        } else {
          // Fallback to REST API
          messagingLog('Sending message via REST API (WebSocket unavailable)');
          const recipient = activeConversation.participants.find(
            (participant) => {
              const participantId = resolveParticipantId(participant);
              return participantId && participantId !== currentUserId;
            },
          );
          const recipientId = resolveParticipantId(recipient);
          if (!recipientId) {
            throw new Error('Unable to resolve message recipient');
          }
          const newMessage = await messagingService.sendMessage(
            currentUserId,
            recipientId,
            trimmedContent,
            normalizedMessageType,
            safeAttachments,
            activeConversation.id,
          );
          const normalized = normalizeMessageAttachments(newMessage);
          setMessages((prev) => {
            const existingIndex = prev.findIndex(
              (message) => String(message.id) === String(normalized.id),
            );
            if (existingIndex !== -1) {
              const updated = [...prev];
              updated[existingIndex] = {
                ...updated[existingIndex],
                ...normalized,
              };
              return dedupeMessageList(updated);
            }
            return dedupeMessageList([...prev, normalized]);
          });
          setConversations((prev) =>
            sortConversationsByActivity(
              prev.map((c) =>
                c.id === activeConversation.id
                  ? {
                      ...c,
                      lastMessage: normalized,
                      updatedAt: normalized.createdAt,
                    }
                  : c,
              ),
            ),
          );
        }
      } catch (error) {
        devError('Error sending message:', error);
        setSendError(
          error?.message || 'Failed to send message. Please try again.',
        );
      } finally {
        setSendingMessage(false);
      }
    },
    [selectedConversation, user, socket, isConnected],
  );

  const createConversation = useCallback(
    async (participantId) => {
      try {
        const convo =
          await messagingService.createDirectConversation(participantId);
        const convoId = convo?.id || convo?._id;

        // Reload conversations to get full participant data
        const freshList = await loadConversations();

        // Select the full conversation from the refreshed list (has participant names)
        // Fallback to the partial convo from the bridge if not found in list
        const fullConvo =
          (freshList || []).find((c) => c.id === convoId) || convo;
        await selectConversation(fullConvo);
        return fullConvo;
      } catch (error) {
        devError('Error creating conversation:', error);
        throw error;
      }
    },
    [loadConversations, selectConversation],
  );

  const openTemporaryConversation = useCallback((participant) => {
    const tempConversation = createTemporaryConversation(participant);

    setConversations((prev) => {
      const existingIndex = prev.findIndex(
        (conversation) =>
          conversation.isTemporary &&
          String(resolveParticipantId(conversation.participants?.[0])) ===
            String(resolveParticipantId(participant)),
      );

      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          participants: tempConversation.participants,
          updatedAt: tempConversation.updatedAt,
        };
        return updated;
      }

      return [tempConversation, ...prev];
    });

    setSelectedConversation(tempConversation);
    setMessages([]);
    setLoadingMessages(false);
    setMessageAnnouncement('');
    loadingMessagesRef.current = false;

    return tempConversation;
  }, []);

  // compute total unread messages
  const unreadCount = (conversations || []).reduce(
    (sum, c) => sum + (c.unreadCount ?? c.unread ?? 0),
    0,
  );

  const clearConversation = useCallback(() => {
    if (selectedConversation && socket && !selectedConversation.isTemporary) {
      socket.emit(SOCKET_EVENTS.CONVERSATION.LEAVE, {
        conversationId: selectedConversation.id,
      });
    }
    if (socket && conversationJoinHandlerRef.current) {
      socket.off(
        SOCKET_EVENTS.CONVERSATION.JOINED,
        conversationJoinHandlerRef.current,
      );
      conversationJoinHandlerRef.current = null;
    }
    if (conversationLoadTimeoutRef.current) {
      clearTimeout(conversationLoadTimeoutRef.current);
      conversationLoadTimeoutRef.current = null;
    }
    if (selectedConversation?.isTemporary) {
      setConversations((prev) =>
        prev.filter(
          (conversation) => conversation.id !== selectedConversation.id,
        ),
      );
    }
    setSelectedConversation(null);
    setMessages([]);
    setMessageAnnouncement('');
  }, [selectedConversation, socket]);

  // Real-time typing functions
  const startTyping = useCallback(() => {
    if (
      selectedConversation &&
      socket &&
      isConnected &&
      !selectedConversation.isTemporary
    ) {
      socket.emit(SOCKET_EVENTS.MESSAGE.TYPING_START, {
        conversationId: selectedConversation.id,
      });
    }
  }, [selectedConversation, socket, isConnected]);

  const stopTyping = useCallback(() => {
    if (
      selectedConversation &&
      socket &&
      isConnected &&
      !selectedConversation.isTemporary
    ) {
      socket.emit(SOCKET_EVENTS.MESSAGE.TYPING_STOP, {
        conversationId: selectedConversation.id,
      });
    }
  }, [selectedConversation, socket, isConnected]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(
    (messageIds = []) => {
      if (
        selectedConversation &&
        socket &&
        isConnected &&
        !selectedConversation.isTemporary
      ) {
        socket.emit(SOCKET_EVENTS.CONVERSATION.MARK_READ, {
          conversationId: selectedConversation.id,
          messageIds,
        });
      }
    },
    [selectedConversation, socket, isConnected],
  );

  // Get typing users for current conversation
  const getTypingUsers = useCallback(() => {
    if (!selectedConversation) return [];
    const convMap = typingUsers.get(selectedConversation.id);
    return convMap ? Array.from(convMap.values()) : [];
  }, [selectedConversation, typingUsers]);

  // Check if user is online
  const isUserOnline = useCallback(
    (userId) => onlineUsers.has(String(userId)),
    [onlineUsers],
  );

  const value = {
    // Core messaging state
    conversations,
    selectedConversation,
    messages,
    loadingConversations,
    loadingMessages,
    sendingMessage,
    sendError,
    messageAnnouncement,
    unreadCount,

    // Core messaging actions
    selectConversation,
    sendMessage,
    createConversation,
    openTemporaryConversation,
    clearConversation,

    // Real-time WebSocket features
    isConnected,
    realtimeIssue,
    onlineUsers,
    typingUsers,
    startTyping,
    stopTyping,
    markMessagesAsRead,
    getTypingUsers,
    isUserOnline,

    // Legacy support
    messagingService, // expose raw service for convenience (legacy components)
  };

  return (
    <MessageContext.Provider value={value}>{children}</MessageContext.Provider>
  );
};

MessageProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default MessageContext;
