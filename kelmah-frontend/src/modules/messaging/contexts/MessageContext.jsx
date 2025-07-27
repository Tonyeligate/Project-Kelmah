import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import { messagingService } from '../services/messagingService';
import { useAuth } from '../../auth/contexts/AuthContext';

const MessageContext = createContext(null);

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

export const MessageProvider = ({ children }) => {
  const { user } = useAuth();
  // Real-time event state
  // const [typingStatus, setTypingStatus] = useState({}); // { conversationId: boolean }
  // const [readReceipts, setReadReceipts] = useState({}); // { conversationId: [userIds] }
  // const [userStatuses, setUserStatuses] = useState({}); // { userId: 'online' | 'offline' }
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
      const convs = await messagingService.getConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  const selectConversation = useCallback(
    async (conversation) => {
      if (selectedConversation?.id === conversation.id) return;

      setSelectedConversation(conversation);
      setLoadingMessages(true);
      try {
        const loadedMessages = await messagingService.getMessages(
          conversation.id,
        );
        setMessages(loadedMessages);
      } catch (error) {
        console.error(
          `Error loading messages for conversation ${conversation.id}:`,
          error,
        );
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    },
    [selectedConversation],
  );

  const sendMessage = useCallback(
    async (content) => {
      if (!selectedConversation || !content.trim() || !user) return;

      setSendingMessage(true);
      try {
        // Determine the other participant
        const recipient = selectedConversation.participants.find(
          (p) => p.id !== user.id,
        );
        const newMessage = await messagingService.sendMessage(
          user.id,
          recipient.id,
          content,
        );
        setMessages((prev) => [...prev, newMessage]);
        // Update conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConversation.id
              ? { ...c, lastMessage: newMessage }
              : c,
          ),
        );
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        setSendingMessage(false);
      }
    },
    [selectedConversation, conversations, user],
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
    setSelectedConversation(null);
    setMessages([]);
  }, []);

  const value = {
    conversations,
    selectedConversation,
    messages,
    loadingConversations,
    loadingMessages,
    sendingMessage,
    unreadCount,
    selectConversation,
    sendMessage,
    createConversation,
    clearConversation,
    messagingService, // expose raw service for convenience (legacy components)
  };

  return (
    <MessageContext.Provider value={value}>{children}</MessageContext.Provider>
  );
};

export default MessageContext;
