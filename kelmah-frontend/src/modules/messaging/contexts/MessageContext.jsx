import React, {
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
// CRIT-08 FIX: Removed direct `import io` — reuse the global websocketService
// singleton instead of creating a second Socket.IO connection.
import websocketService from '../../../services/websocketService';
import { normalizeAttachmentListVirusScan } from '../utils/virusScanUtils';

const MessageContext = createContext(null);

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

const normalizeMessageAttachments = (message = {}) => {
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
    attachments: normalizeAttachmentListVirusScan(message.attachments || []),
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
    lastMessage: conversation.lastMessage
      ? normalizeMessageAttachments(conversation.lastMessage)
      : conversation.lastMessage,
    latestMessage: conversation.latestMessage
      ? normalizeMessageAttachments(conversation.latestMessage)
      : conversation.latestMessage,
  };
};

const normalizeConversationList = (list = []) =>
  (Array.isArray(list) ? list : []).map((conversation) => normalizeConversation(conversation));

const normalizeMessageList = (list = []) =>
  list.map((message) => normalizeMessageAttachments(message || {}));

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

export const MessageProvider = ({ children }) => {
  const { user, getToken } = useAuth();
  const socketRef = useRef(null);
  const connectingRef = useRef(false);
  const selectedConversationRef = useRef(null);
  const getTokenRef = useRef(getToken);
  // Stores named handler references so we can remove ONLY our listeners on cleanup
  const msgListenersRef = useRef({});

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
        const normalized = normalizeConversationList(convs);
        setConversations(normalized);
        setLoadingConversations(false);
        return normalized; // Return list for callers that need it
      } catch (error) {
        lastError = error;
        if (import.meta.env.DEV) console.warn(`loadConversations attempt ${attempt}/2 failed:`, error.message);
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 3000)); // Wait 3s before retry
        }
      }
    }

    // All retries failed
    if (import.meta.env.DEV) console.error('Error loading conversations after retries:', lastError);
    setConversations([]);
    setLoadingConversations(false);
    return [];
  }, []);

  // CRIT-08 FIX: Reuse the global websocketService singleton instead of
  // creating a second Socket.IO connection. We subscribe to the
  // messaging-specific events on the shared socket.
  const connectWebSocket = useCallback(async () => {
    if (!user) return;
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
        if (import.meta.env.DEV) console.warn('WebSocketService socket unavailable — messaging will use REST only');
        setRealtimeIssue('Real-time connection unavailable. Using standard refresh mode.');
        connectingRef.current = false;
        return;
      }

      if (import.meta.env.DEV) console.log('🔌 MessageContext: reusing shared WebSocket connection');

      // Remove ONLY the listeners WE registered (named references), not all listeners
      const msgListeners = msgListenersRef.current;
      const messagingEvents = [
        'new_message', 'user_typing', 'messages_read',
        'user_status_changed', 'connected',
        'connect', 'disconnect', 'connect_error', 'error'
      ];
      messagingEvents.forEach(evt => {
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
          if (import.meta.env.DEV) console.error('🚨 WebSocket connection error:', error);
          socketErrorLoggedRef.current = true;
        }
        setRealtimeIssue('Real-time connection failed. Using standard refresh mode.');
        connectingRef.current = false;
      };
      const onConnected = (data) => {
        if (import.meta.env.DEV) console.log('🎉 Messaging service connected:', data);
        if (data.conversations) {
          setConversations(normalizeConversationList(data.conversations));
        }
      };
      const onNewMessage = (messageData) => {
        if (import.meta.env.DEV) console.log('📨 New message received:', messageData);
        const hydratedMessage = normalizeMessageAttachments(messageData);
        const hydratedConversationId = hydratedMessage.conversationId;
        const activeConversation = selectedConversationRef.current;

        if (
          activeConversation &&
          hydratedConversationId === activeConversation.id
        ) {
          setMessages((prev) => {
            const { clientId } = hydratedMessage;
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

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === hydratedConversationId
              ? {
                ...conv,
                lastMessage: hydratedMessage,
                updatedAt: hydratedMessage.createdAt,
              }
              : conv,
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
        if (import.meta.env.DEV) console.log('📖 Messages marked as read:', data);
        const activeConversation = selectedConversationRef.current;
        if (
          activeConversation &&
          data.conversationId === activeConversation.id
        ) {
          setMessages((prev) =>
            prev.map((msg) =>
              data.messageIds === 'all_unread' || data.messageIds.includes(msg.id)
                ? { ...msg, isRead: true, readAt: data.readAt }
                : msg,
            ),
          );
        }
      };
      const onUserStatusChanged = (data) => {
        const { userId, status } = data;
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          if (status === 'online') {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }
          return newSet;
        });
      };
      const onError = (error) => {
        if (import.meta.env.DEV) console.error('🚨 WebSocket error:', error);
      };

      // Register all named handlers and store references for cleanup
      msgListenersRef.current = {
        connect: onConnect,
        disconnect: onDisconnect,
        connect_error: onConnectError,
        connected: onConnected,
        new_message: onNewMessage,
        user_typing: onUserTyping,
        messages_read: onMessagesRead,
        user_status_changed: onUserStatusChanged,
        error: onError,
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
      if (import.meta.env.DEV) console.error('Failed to initialize messaging socket:', error);
      setRealtimeIssue('Real-time connection failed. Using standard refresh mode.');
      connectingRef.current = false;
    }
  }, [user]);

  // Disconnect WebSocket
  // CRIT-08 FIX: Only remove messaging-specific listeners from the shared
  // socket. Do NOT call activeSocket.disconnect() — that would kill the
  // connection for notifications and all other features too.
  const disconnectWebSocket = useCallback(() => {
    const activeSocket = socketRef.current;
    if (activeSocket) {
      if (import.meta.env.DEV) console.log('🔌 MessageContext: detaching messaging listeners from shared socket');
      const msgListeners = msgListenersRef.current;
      try {
        const messagingEvents = [
          'new_message', 'user_typing', 'messages_read',
          'user_status_changed', 'connected',
          'connect', 'disconnect', 'connect_error', 'error'
        ];
        messagingEvents.forEach(evt => {
          if (msgListeners[evt]) activeSocket.off(evt, msgListeners[evt]);
        });
        msgListenersRef.current = {};
      } catch (error) {
        if (import.meta.env.DEV) console.warn('Failed to remove messaging listeners', error);
      }
      // Do NOT disconnect the shared socket
      setSocket(null);
      setIsConnected(false);
      setRealtimeIssue(null);
    }
    socketRef.current = null;
    connectingRef.current = false;
  }, []);

  useEffect(() => {
    if (user) {
      loadConversations();
      connectWebSocket();
    } else {
      disconnectWebSocket();
      setConversations([]);
      setSelectedConversation(null);
      setMessages([]);
    }

    return () => {
      disconnectWebSocket();
    };
  }, [user, loadConversations, connectWebSocket, disconnectWebSocket]);

  const loadingMessagesRef = useRef(false);

  const selectConversation = useCallback(
    async (conversation) => {
      const normalizedConversation = normalizeConversation(conversation);
      if (!normalizedConversation?.id) return;
      if (selectedConversation?.id === normalizedConversation.id) return;

      // Leave previous conversation room
      if (selectedConversation && socket) {
        socket.emit('leave_conversation', {
          conversationId: selectedConversation.id,
        });
      }

      setSelectedConversation(normalizedConversation);
      setLoadingMessages(true);
      loadingMessagesRef.current = true;
      setMessages([]);

      try {
        // Join new conversation room via WebSocket
        if (socket && isConnected) {
          socket.emit('join_conversation', { conversationId: normalizedConversation.id });

          // Listen for conversation joined event
          socket.once('conversation_joined', (data) => {
            if (import.meta.env.DEV) console.log('🏠 Joined conversation:', data);
            setMessages(normalizeMessageList(data.messages || []));
            setLoadingMessages(false);
            loadingMessagesRef.current = false;
          });

          // MED-21 FIX: Fallback timeout — fetch via REST if WS doesn't respond in time
          const conversationId = normalizedConversation.id;
          setTimeout(async () => {
            if (loadingMessagesRef.current) {
              try {
                const fallbackMessages = await messagingService.getMessages(conversationId);
                setMessages(normalizeMessageList(fallbackMessages));
              } catch (fallbackErr) {
                if (import.meta.env.DEV) console.warn('REST fallback for messages also failed:', fallbackErr.message);
              } finally {
                setLoadingMessages(false);
                loadingMessagesRef.current = false;
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
        if (import.meta.env.DEV) console.error(
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
      const safeAttachments = normalizeAttachmentListVirusScan(attachments);
      if (!selectedConversation || !user) return;

      const trimmedContent = typeof content === 'string' ? content.trim() : '';
      if (!trimmedContent && safeAttachments.length === 0) return;

      setSendingMessage(true);
      try {
        // Use WebSocket for real-time messaging if available
        if (socket && isConnected) {
          if (import.meta.env.DEV) console.log('📤 Sending message via WebSocket');
          // Create optimistic message with clientId
          const clientId = `${user.id}_${Date.now()}`;
          const now = new Date().toISOString();
          const optimisticMessage = {
            id: clientId,
            conversationId: selectedConversation.id,
            senderId: user.id,
            sender: user.id,
            senderInfo: {
              id: user.id,
              name: user?.name || user?.firstName || 'You',
            },
            content: content.trim(),
            text: content.trim(),
            messageType,
            attachments: safeAttachments,
            createdAt: now,
            timestamp: now,
            isRead: false,
            status: 'sending',
            optimistic: true,
          };
          setMessages((prev) => [...prev, optimisticMessage]);
          setConversations((prev) =>
            prev.map((c) =>
              c.id === selectedConversation.id
                ? { ...c, lastMessage: optimisticMessage }
                : c,
            ),
          );

          // Use acknowledgement to verify delivery; fallback to REST if failed
          const useEncrypted =
            import.meta.env.VITE_ENABLE_E2E_ENVELOPE === 'true';
          const eventName = useEncrypted ? 'send_encrypted' : 'send_message';
          const payload = useEncrypted
            ? {
              conversationId: selectedConversation.id,
              encryptedBody: trimmedContent,
              encryption: { scheme: 'beta', version: '1', senderKeyId: 'me' },
              messageType,
              attachments: safeAttachments,
              clientId,
            }
            : {
              conversationId: selectedConversation.id,
              content: trimmedContent,
              messageType,
              attachments: safeAttachments,
              clientId,
            };

          socket.emit(eventName, payload, async (ack) => {
            if (!ack || ack.ok !== true) {
              if (import.meta.env.DEV) console.warn('WebSocket send failed, falling back to REST', ack);
              try {
                const recipient = selectedConversation.participants.find(
                  (participant) => {
                    const participantId = resolveParticipantId(participant);
                    return participantId && participantId !== user.id;
                  },
                );
                const recipientId = resolveParticipantId(recipient);
                if (!recipientId) {
                  throw new Error('Unable to resolve message recipient');
                }
                const newMessage = await messagingService.sendMessage(
                  user.id,
                  recipientId,
                  trimmedContent,
                  messageType,
                  safeAttachments,
                );
                const normalized = normalizeMessageAttachments(newMessage);
                // Mark optimistic message as failed and append REST message
                setMessages((prev) => {
                  const idx = prev.findIndex((m) => m.id === clientId);
                  const copy = [...prev];
                  if (idx !== -1)
                    copy[idx] = { ...copy[idx], status: 'failed' };
                  return [...copy, normalized];
                });
                setConversations((prev) =>
                  prev.map((c) =>
                    c.id === selectedConversation.id
                      ? { ...c, lastMessage: normalized }
                      : c,
                  ),
                );
              } catch (e) {
                if (import.meta.env.DEV) console.error('REST fallback failed:', e);
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
          if (import.meta.env.DEV) console.log(
            '📤 Sending message via REST API (WebSocket unavailable)',
          );
          const recipient = selectedConversation.participants.find(
            (participant) => {
              const participantId = resolveParticipantId(participant);
              return participantId && participantId !== user.id;
            },
          );
          const recipientId = resolveParticipantId(recipient);
          if (!recipientId) {
            throw new Error('Unable to resolve message recipient');
          }
          const newMessage = await messagingService.sendMessage(
            user.id,
            recipientId,
            trimmedContent,
            messageType,
            safeAttachments,
          );
          const normalized = normalizeMessageAttachments(newMessage);
          setMessages((prev) => [...prev, normalized]);
          setConversations((prev) =>
            prev.map((c) =>
              c.id === selectedConversation.id
                ? { ...c, lastMessage: normalized }
                : c,
            ),
          );
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error sending message:', error);
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
        const fullConvo = (freshList || []).find((c) => c.id === convoId) || convo;
        await selectConversation(fullConvo);
        return fullConvo;
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error creating conversation:', error);
        throw error;
      }
    },
    [loadConversations, selectConversation],
  );

  // compute total unread messages
  const unreadCount = (conversations || []).reduce(
    (sum, c) => sum + (c.unreadCount ?? c.unread ?? 0),
    0,
  );

  const clearConversation = useCallback(() => {
    if (selectedConversation && socket) {
      socket.emit('leave_conversation', {
        conversationId: selectedConversation.id,
      });
    }
    setSelectedConversation(null);
    setMessages([]);
  }, [selectedConversation, socket]);

  // Real-time typing functions
  const startTyping = useCallback(() => {
    if (selectedConversation && socket && isConnected) {
      socket.emit('typing_start', { conversationId: selectedConversation.id });
    }
  }, [selectedConversation, socket, isConnected]);

  const stopTyping = useCallback(() => {
    if (selectedConversation && socket && isConnected) {
      socket.emit('typing_stop', { conversationId: selectedConversation.id });
    }
  }, [selectedConversation, socket, isConnected]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(
    (messageIds = []) => {
      if (selectedConversation && socket && isConnected) {
        socket.emit('mark_read', {
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
    (userId) => onlineUsers.has(userId),
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
    unreadCount,

    // Core messaging actions
    selectConversation,
    sendMessage,
    createConversation,
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

