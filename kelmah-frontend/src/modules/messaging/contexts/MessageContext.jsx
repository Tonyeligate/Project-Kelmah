import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import { messagingService } from '../services/messagingService';
import { useAuth } from '../../auth/contexts/AuthContext';
import io from 'socket.io-client';

const MessageContext = createContext(null);

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

export const MessageProvider = ({ children }) => {
  const { user, getToken } = useAuth();
  
  // Real-time WebSocket state
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
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

  // Load the current user's conversations
  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const response = await messagingService.getConversations();
      // Ensure we extract the conversations array from the response
      const convs = Array.isArray(response) ? response : (response?.conversations || response?.data || []);
      setConversations(Array.isArray(convs) ? convs : []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  // WebSocket connection setup
  const connectWebSocket = useCallback(() => {
    if (!user || socket) return;

    const token = getToken();
    if (!token) return;

    // WebSocket URL based on environment with robust fallbacks
    // Always use production messaging service for WebSocket connections
    const wsUrl = import.meta.env.VITE_MESSAGING_SERVICE_URL || 
      'https://kelmah-messaging-service.onrender.com';

    console.log('🔌 Connecting to messaging WebSocket:', wsUrl);

    const newSocket = io(wsUrl, {
      auth: {
        token,
        userId: user.id,
        userRole: user.role
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected for messaging');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connected', (data) => {
      console.log('🎉 Messaging service connected:', data);
      // Update conversations with real-time data
      if (data.conversations) {
        setConversations(data.conversations);
      }
    });

    // Real-time message events
    newSocket.on('new_message', (messageData) => {
      console.log('📨 New message received:', messageData);
      
      // Add to messages if it's for the current conversation
      if (selectedConversation && messageData.conversationId === selectedConversation.id) {
        setMessages(prev => {
          // If an optimistic message exists with the same clientId, replace it
          const clientId = messageData.clientId;
          if (clientId) {
            const index = prev.findIndex(m => m.id === clientId);
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = { ...messageData, status: 'sent' };
              return updated;
            }
          }
          return [...prev, messageData];
        });
      }
      
      // Update conversation's last message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === messageData.conversationId 
            ? { ...conv, lastMessage: messageData, updatedAt: messageData.createdAt }
            : conv
        )
      );
    });

    // Typing indicators
    newSocket.on('user_typing', (data) => {
      const { conversationId, userId, isTyping, user: typingUser } = data;
      setTypingUsers(prev => {
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
    newSocket.on('messages_read', (data) => {
      console.log('📖 Messages marked as read:', data);
      // Update message read status
      if (selectedConversation && data.conversationId === selectedConversation.id) {
        setMessages(prev => 
          prev.map(msg => 
            data.messageIds === 'all_unread' || data.messageIds.includes(msg.id)
              ? { ...msg, isRead: true, readAt: data.readAt }
              : msg
          )
        );
      }
    });

    // User status updates
    newSocket.on('user_status_changed', (data) => {
      const { userId, status } = data;
      setOnlineUsers(prev => {
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
    newSocket.on('error', (error) => {
      console.error('🚨 WebSocket error:', error);
    });

    setSocket(newSocket);
  }, [user, getToken, socket, selectedConversation]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (socket) {
      console.log('🔌 Disconnecting WebSocket');
      try { socket.removeAllListeners && socket.removeAllListeners(); } catch {}
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  useEffect(() => {
    if (user) {
      loadConversations();
      connectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [user, loadConversations, connectWebSocket, disconnectWebSocket]);

  const selectConversation = useCallback(
    async (conversation) => {
      if (selectedConversation?.id === conversation.id) return;

      // Leave previous conversation room
      if (selectedConversation && socket) {
        socket.emit('leave_conversation', { conversationId: selectedConversation.id });
      }

      setSelectedConversation(conversation);
      setLoadingMessages(true);
      setMessages([]);

      try {
        // Join new conversation room via WebSocket
        if (socket && isConnected) {
          socket.emit('join_conversation', { conversationId: conversation.id });
          
          // Listen for conversation joined event
          socket.once('conversation_joined', (data) => {
            console.log('🏠 Joined conversation:', data);
            setMessages(data.messages || []);
            setLoadingMessages(false);
          });
          
          // Fallback timeout
          setTimeout(() => {
            if (loadingMessages) {
              setLoadingMessages(false);
            }
          }, 5000);
        } else {
          // Fallback to REST API if WebSocket not available
          const loadedMessages = await messagingService.getMessages(conversation.id);
          setMessages(loadedMessages);
          setLoadingMessages(false);
        }
      } catch (error) {
        console.error(`Error loading messages for conversation ${conversation.id}:`, error);
        setMessages([]);
        setLoadingMessages(false);
      }
    },
    [selectedConversation, socket, isConnected, loadingMessages],
  );

  const sendMessage = useCallback(
    async (content, messageType = 'text', attachments = []) => {
      if (!selectedConversation || !content.trim() || !user) return;

      setSendingMessage(true);
      try {
        // Use WebSocket for real-time messaging if available
        if (socket && isConnected) {
          console.log('📤 Sending message via WebSocket');
          // Create optimistic message with clientId
          const clientId = `${user.id}_${Date.now()}`;
          const optimisticMessage = {
            id: clientId,
            conversationId: selectedConversation.id,
            senderId: user.id,
            sender: { id: user.id, name: user?.name || user?.firstName || 'You' },
            content: content.trim(),
            messageType,
            attachments,
            createdAt: new Date().toISOString(),
            isRead: false,
            status: 'sending',
            optimistic: true,
          };
          setMessages(prev => [...prev, optimisticMessage]);
          setConversations(prev => prev.map(c => c.id === selectedConversation.id ? { ...c, lastMessage: optimisticMessage } : c));

          // Use acknowledgement to verify delivery; fallback to REST if failed
          const useEncrypted = import.meta.env.VITE_ENABLE_E2E_ENVELOPE === 'true';
          const eventName = useEncrypted ? 'send_encrypted' : 'send_message';
          const payload = useEncrypted
            ? {
                conversationId: selectedConversation.id,
                encryptedBody: content.trim(),
                encryption: { scheme: 'beta', version: '1', senderKeyId: 'me' },
                messageType,
                attachments,
                clientId,
              }
            : {
                conversationId: selectedConversation.id,
                content: content.trim(),
                messageType,
                attachments,
                clientId,
              };

          socket.emit(
            eventName,
            payload,
            async (ack) => {
              if (!ack || ack.ok !== true) {
                console.warn('WebSocket send failed, falling back to REST', ack);
                try {
                  const recipient = selectedConversation.participants.find((p) => p.id !== user.id);
                  const newMessage = await messagingService.sendMessage(
                    user.id,
                    recipient.id,
                    content,
                  );
                  // Mark optimistic message as failed and append REST message
                  setMessages((prev) => {
                    const idx = prev.findIndex(m => m.id === clientId);
                    const copy = [...prev];
                    if (idx !== -1) copy[idx] = { ...copy[idx], status: 'failed' };
                    return [...copy, newMessage];
                  });
                  setConversations((prev) =>
                    prev.map((c) => (c.id === selectedConversation.id ? { ...c, lastMessage: newMessage } : c)),
                  );
                } catch (e) {
                  console.error('REST fallback failed:', e);
                  // Mark optimistic message as failed
                  setMessages(prev => prev.map(m => m.id === clientId ? { ...m, status: 'failed' } : m));
                }
              }
            },
          );
          // Message will be added to UI via 'new_message' event
        } else {
          // Fallback to REST API
          console.log('📤 Sending message via REST API (WebSocket unavailable)');
          const recipient = selectedConversation.participants.find(
            (p) => p.id !== user.id,
          );
          const newMessage = await messagingService.sendMessage(
            user.id,
            recipient.id,
            content,
          );
          setMessages((prev) => [...prev, newMessage]);
          setConversations((prev) =>
            prev.map((c) =>
              c.id === selectedConversation.id
                ? { ...c, lastMessage: newMessage }
                : c,
            ),
          );
        }
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        setSendingMessage(false);
      }
    },
    [selectedConversation, conversations, user, socket, isConnected],
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
        console.error('Error creating conversation:', error);
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
      socket.emit('leave_conversation', { conversationId: selectedConversation.id });
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
  const markMessagesAsRead = useCallback((messageIds = []) => {
    if (selectedConversation && socket && isConnected) {
      socket.emit('mark_read', { 
        conversationId: selectedConversation.id, 
        messageIds 
      });
    }
  }, [selectedConversation, socket, isConnected]);

  // Get typing users for current conversation
  const getTypingUsers = useCallback(() => {
    if (!selectedConversation) return [];
    const convMap = typingUsers.get(selectedConversation.id);
    return convMap ? Array.from(convMap.values()) : [];
  }, [selectedConversation, typingUsers]);

  // Check if user is online
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

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

export default MessageContext;
