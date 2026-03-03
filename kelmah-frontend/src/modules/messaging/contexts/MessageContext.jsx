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

const normalizeMessageAttachments = (message = {}) => ({
  ...message,
  attachments: normalizeAttachmentListVirusScan(message.attachments || []),
});

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

  // Load the current user's conversations
  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const response = await messagingService.getConversations();
      // Ensure we extract the conversations array from the response
      const convs = Array.isArray(response)
        ? response
        : response?.conversations || response?.data || [];
      setConversations(Array.isArray(convs) ? convs : []);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
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

      // Remove any existing messaging listeners before re-adding to prevent duplicates
      const messagingEvents = [
        'new_message', 'user_typing', 'messages_read',
        'user_status_changed', 'connected',
        'connect', 'disconnect', 'connect_error', 'error'
      ];
      messagingEvents.forEach(evt => sharedSocket.off(evt));

      // Listen for messaging-specific events on the SHARED socket
      sharedSocket.on('connect', () => {
        setIsConnected(true);
        setRealtimeIssue(null);
        socketErrorLoggedRef.current = false;
        connectingRef.current = false;
      });

      sharedSocket.on('disconnect', (reason) => {
        setIsConnected(false);
        if (reason && reason !== 'io client disconnect') {
          setRealtimeIssue('Real-time updates are temporarily unavailable.');
        }
        connectingRef.current = false;
      });

      sharedSocket.on('connect_error', (error) => {
        if (!socketErrorLoggedRef.current) {
          if (import.meta.env.DEV) console.error('🚨 WebSocket connection error:', error);
          socketErrorLoggedRef.current = true;
        }
        setRealtimeIssue('Real-time connection failed. Using standard refresh mode.');
        connectingRef.current = false;
      });

      sharedSocket.on('connected', (data) => {
        if (import.meta.env.DEV) console.log('🎉 Messaging service connected:', data);
        if (data.conversations) {
          setConversations(data.conversations);
        }
      });

    // Real-time message events
      sharedSocket.on('new_message', (messageData) => {
        if (import.meta.env.DEV) console.log('📨 New message received:', messageData);
        const hydratedMessage = normalizeMessageAttachments(messageData);
        const activeConversation = selectedConversationRef.current;

        if (
          activeConversation &&
          messageData.conversationId === activeConversation.id
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
            conv.id === hydratedMessage.conversationId
              ? {
                ...conv,
                lastMessage: hydratedMessage,
                updatedAt: hydratedMessage.createdAt,
              }
              : conv,
          ),
        );
      });

    // Typing indicators
    sharedSocket.on('user_typing', (data) => {
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
    });

    // Read receipts
      sharedSocket.on('messages_read', (data) => {
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
      });

    // User status updates
      sharedSocket.on('user_status_changed', (data) => {
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
      });

    // Error handling
      sharedSocket.on('error', (error) => {
        if (import.meta.env.DEV) console.error('🚨 WebSocket error:', error);
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
      const messagingEvents = [
        'new_message', 'user_typing', 'messages_read',
        'user_status_changed', 'connected',
        'connect', 'disconnect', 'connect_error', 'error'
      ];
      try {
        messagingEvents.forEach(evt => activeSocket.off(evt));
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
      if (selectedConversation?.id === conversation.id) return;

      // Leave previous conversation room
      if (selectedConversation && socket) {
        socket.emit('leave_conversation', {
          conversationId: selectedConversation.id,
        });
      }

      setSelectedConversation(conversation);
      setLoadingMessages(true);
      loadingMessagesRef.current = true;
      setMessages([]);

      try {
        // Join new conversation room via WebSocket
        if (socket && isConnected) {
          socket.emit('join_conversation', { conversationId: conversation.id });

          // Listen for conversation joined event
          socket.once('conversation_joined', (data) => {
            if (import.meta.env.DEV) console.log('🏠 Joined conversation:', data);
            setMessages(normalizeMessageList(data.messages || []));
            setLoadingMessages(false);
            loadingMessagesRef.current = false;
          });

          // MED-21 FIX: Fallback timeout — fetch via REST if WS doesn't respond in time
          const conversationId = conversation.id;
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
            conversation.id,
          );
          setMessages(normalizeMessageList(loadedMessages));
          setLoadingMessages(false);
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error(
          `Error loading messages for conversation ${conversation.id}:`,
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
      if (!selectedConversation || !content.trim() || !user) return;
      const safeAttachments = normalizeAttachmentListVirusScan(attachments);

      setSendingMessage(true);
      try {
        // Use WebSocket for real-time messaging if available
        if (socket && isConnected) {
          if (import.meta.env.DEV) console.log('📤 Sending message via WebSocket');
          // Create optimistic message with clientId
          const clientId = `${user.id}_${Date.now()}`;
          const optimisticMessage = {
            id: clientId,
            conversationId: selectedConversation.id,
            senderId: user.id,
            sender: {
              id: user.id,
              name: user?.name || user?.firstName || 'You',
            },
            content: content.trim(),
            messageType,
            attachments: safeAttachments,
            createdAt: new Date().toISOString(),
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
              encryptedBody: content.trim(),
              encryption: { scheme: 'beta', version: '1', senderKeyId: 'me' },
              messageType,
              attachments: safeAttachments,
              clientId,
            }
            : {
              conversationId: selectedConversation.id,
              content: content.trim(),
              messageType,
              attachments: safeAttachments,
              clientId,
            };

          socket.emit(eventName, payload, async (ack) => {
            if (!ack || ack.ok !== true) {
              if (import.meta.env.DEV) console.warn('WebSocket send failed, falling back to REST', ack);
              try {
                const recipient = selectedConversation.participants.find(
                  (p) => p.id !== user.id,
                );
                const newMessage = await messagingService.sendMessage(
                  user.id,
                  recipient.id,
                  content,
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
            (p) => p.id !== user.id,
          );
          const newMessage = await messagingService.sendMessage(
            user.id,
            recipient.id,
            content,
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
        await loadConversations();
        await selectConversation(convo);
        return convo;
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error creating conversation:', error);
        throw error;
      }
    },
    [loadConversations, selectConversation],
  );

  // compute total unread messages
  const unreadCount = (conversations || []).reduce(
    (sum, c) => sum + (c.unreadCount || 0),
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

