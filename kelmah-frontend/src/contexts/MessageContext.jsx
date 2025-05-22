import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSnackbar } from 'notistack';
import { messagingService } from '../services/messagingService';

// Create context
const MessageContext = createContext();

// Custom hook to use the message context
export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};

export const MessageProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  
  // State for messages and conversations
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [unreadCount, setUnreadCount] = useState({});

  // Initialize socket connection when user authenticates
  useEffect(() => {
    if (isAuthenticated && user) {
      messagingService.initialize(user.id, user.token);
      messagingService.connect();
      
      // Set up event listeners
      messagingService.on('connect', handleConnection);
      messagingService.on('disconnect', handleDisconnection);
      messagingService.on('message', handleNewMessage);
      messagingService.on('typing', handleTypingIndicator);
      messagingService.on('read', handleMessageRead);
      messagingService.on('user_status', handleUserStatus);
      messagingService.on('error', handleError);
      
      // Load initial data
      fetchConversations();
      
      // Cleanup on unmount
      return () => {
        messagingService.off('connect', handleConnection);
        messagingService.off('disconnect', handleDisconnection);
        messagingService.off('message', handleNewMessage);
        messagingService.off('typing', handleTypingIndicator);
        messagingService.off('read', handleMessageRead);
        messagingService.off('user_status', handleUserStatus);
        messagingService.off('error', handleError);
        messagingService.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  // Event handlers
  const handleConnection = useCallback(() => {
    console.log('Connected to messaging service');
  }, []);
  
  const handleDisconnection = useCallback(() => {
    console.log('Disconnected from messaging service');
  }, []);
  
  const handleNewMessage = useCallback((message) => {
    // Add message to messages if conversation is active
    if (activeConversation && message.conversationId === activeConversation.id) {
      setMessages(prevMessages => [...prevMessages, message]);
      
      // Mark message as read if it's from someone else
      if (message.senderId !== user.id) {
        messagingService.markMessageAsRead(message.id);
      }
    }
    
    // Update conversation list with latest message
    setConversations(prevConversations => {
      const updatedConversations = [...prevConversations];
      const conversationIndex = updatedConversations.findIndex(
        conv => conv.id === message.conversationId
      );
      
      if (conversationIndex !== -1) {
        // Update existing conversation
        const conversation = updatedConversations[conversationIndex];
        const isActive = activeConversation && activeConversation.id === conversation.id;
        
        // Update conversation with new message
        updatedConversations[conversationIndex] = {
          ...conversation,
          lastMessage: {
            id: message.id,
            content: message.content,
            createdAt: message.createdAt,
            senderId: message.senderId
          },
          unreadCount: isActive ? 0 : (conversation.unreadCount || 0) + (message.senderId !== user.id ? 1 : 0)
        };
        
        // Move conversation to top
        const [updatedConversation] = updatedConversations.splice(conversationIndex, 1);
        updatedConversations.unshift(updatedConversation);
      }
      
      return updatedConversations;
    });
    
    // Show notification if message is not from current user and conversation is not active
    if (message.senderId !== user.id && (!activeConversation || message.conversationId !== activeConversation.id)) {
      enqueueSnackbar(`New message from ${message.sender?.name || 'Someone'}`, {
        variant: 'info',
        preventDuplicate: true
      });
    }
  }, [activeConversation, user, enqueueSnackbar]);
  
  const handleTypingIndicator = useCallback((data) => {
    const { conversationId, userId, isTyping, userName } = data;
    
    if (userId === user.id) return; // Don't show typing for ourselves
    
    if (isTyping) {
      setTypingUsers(prev => ({ ...prev, [conversationId]: userName }));
      } else {
        setTypingUsers(prev => {
        const updated = { ...prev };
        delete updated[conversationId];
        return updated;
      });
    }
  }, [user]);
  
  const handleMessageRead = useCallback((data) => {
    const { messageIds, conversationId } = data;
    
    // Update message read status
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
      )
    );
    
    // Update unread count for the conversation
    setConversations(prevConversations => 
      prevConversations.map(conv => 
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      )
    );
  }, []);
  
  const handleUserStatus = useCallback((data) => {
    const { userId, status } = data;
    
    setOnlineUsers(prev => ({
      ...prev,
      [userId]: status === 'online'
    }));
  }, []);
  
  const handleError = useCallback((error) => {
    console.error('Messaging error:', error);
    setError(error.message || 'An error occurred with the messaging service');
  }, []);
  
  // API methods
  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await messagingService.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;

    setLoading(true);
    setError(null);
    
    try {
      const data = await messagingService.getMessages(conversationId);
      setMessages(data);
      
      // Mark conversation as read
      messagingService.markConversationAsRead(conversationId);
      
      // Join conversation (socket room)
      messagingService.joinConversation(conversationId);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);
  
  const sendMessage = useCallback(async (content, attachments = []) => {
    if (!activeConversation) return null;
    
    try {
      // Create optimistic message
      const optimisticId = `temp-${Date.now()}`;
      const optimisticMessage = {
        id: optimisticId,
        conversationId: activeConversation.id,
        senderId: user.id,
        content,
        attachments: attachments.map(att => ({
          ...att,
          id: `temp-${Date.now()}-${att.name}`
        })),
        createdAt: new Date().toISOString(),
        isRead: false,
        status: 'sending',
        sender: {
          id: user.id,
          name: user.name,
          profileImage: user.profileImage
        }
      };
      
      // Add to messages for immediate display
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Actually send via service
      const result = await messagingService.sendMessage(
        activeConversation.id,
        content,
        attachments
      );
      
      // Replace optimistic message with actual one
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticId ? { ...result, status: 'sent' } : msg
        )
      );
      
      return result;
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Mark optimistic message as failed
      setMessages(prev => 
        prev.map(msg => 
          msg.id.startsWith('temp-') ? { ...msg, status: 'failed' } : msg
        )
      );
      
      enqueueSnackbar('Failed to send message', { variant: 'error' });
      return null;
    }
  }, [activeConversation, user, enqueueSnackbar]);
  
  const updateTypingStatus = useCallback((conversationId, isTyping) => {
    if (!conversationId) return;
    
    messagingService.sendTypingIndicator(conversationId, isTyping);
  }, []);
  
  const markConversationAsRead = useCallback((conversationId) => {
    if (!conversationId) return;
    
    messagingService.markConversationAsRead(conversationId);
    
    // Update local state immediately for better UX
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      )
    );
  }, []);
  
  const createDirectConversation = useCallback(async (recipientId) => {
    try {
      const result = await messagingService.createDirectConversation(recipientId);
      
      // Add to conversations list
      setConversations(prev => {
        // Check if conversation already exists
        const exists = prev.some(conv => conv.id === result.id);
        
        if (exists) {
          return prev.map(conv => 
            conv.id === result.id ? result : conv
          );
        } else {
          return [result, ...prev];
        }
      });
      
      return result;
    } catch (err) {
      console.error('Error creating conversation:', err);
      enqueueSnackbar('Failed to create conversation', { variant: 'error' });
      throw err;
    }
  }, [enqueueSnackbar]);
  
  // When activeConversation changes, fetch messages
  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
      
      // Update conversation to be read
      if (activeConversation.unreadCount > 0) {
        markConversationAsRead(activeConversation.id);
      }
    } else {
      setMessages([]);
    }
    
    // Leave previous conversation room if any
    return () => {
      if (activeConversation) {
        messagingService.leaveConversation(activeConversation.id);
      }
    };
  }, [activeConversation, fetchMessages, markConversationAsRead]);
  
  // Calculate total unread messages
  useEffect(() => {
    const total = conversations.reduce(
      (acc, conv) => acc + (conv.unreadCount || 0),
      0
    );
    
    // Update app-wide unread message count
    if (window.updateUnreadMessageCount) {
      window.updateUnreadMessageCount(total);
    }
  }, [conversations]);

  // Context value
  const value = {
    conversations,
    activeConversation,
    messages,
    loading,
    error,
    typingUsers,
    onlineUsers,
    unreadCount,
    setActiveConversation,
    fetchConversations,
    fetchMessages,
    sendMessage,
    updateTypingStatus,
    markConversationAsRead,
    createDirectConversation
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export default MessageContext; 