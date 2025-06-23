import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import messagingService from '../services/messagingService';
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
    const [typingStatus, setTypingStatus] = useState({}); // { conversationId: boolean }
    const [readReceipts, setReadReceipts] = useState({}); // { conversationId: [userIds] }
    const [userStatuses, setUserStatuses] = useState({}); // { userId: 'online' | 'offline' }
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);

    useEffect(() => {
        if (user) {
            messagingService.initialize(user.id, user.token);
            messagingService.connect();
            loadConversations();

            // Subscribe to socket events
            messagingService.onNewMessage(handleNewMessage);
            messagingService.on('typing', handleTypingEvent);
            messagingService.on('read', handleReadEvent);
            messagingService.on('user_status', handleUserStatusEvent);
        }

        return () => {
            messagingService.disconnect();
            messagingService.offNewMessage(handleNewMessage);
            messagingService.off('typing', handleTypingEvent);
            messagingService.off('read', handleReadEvent);
            messagingService.off('user_status', handleUserStatusEvent);
        };
    }, [user]);

    // Handle typing indicator events
    const handleTypingEvent = ({ conversationId, isTyping }) => {
        setTypingStatus(prev => ({ ...prev, [conversationId]: isTyping }));
    };

    // Handle read receipt events
    const handleReadEvent = ({ conversationId, userId: readerId }) => {
        setReadReceipts(prev => {
            const existing = prev[conversationId] || [];
            return { ...prev, [conversationId]: Array.from(new Set([...existing, readerId])) };
        });
    };

    // Handle user online/offline status
    const handleUserStatusEvent = ({ userId: uid, status }) => {
        setUserStatuses(prev => ({ ...prev, [uid]: status }));
    };

    const handleNewMessage = (newMessage) => {
        if (selectedConversation && newMessage.conversationId === selectedConversation.id) {
            setMessages(prev => [...prev, newMessage]);
        }
        // Optionally, update conversation list with new last message
        loadConversations(); 
    };

    const loadConversations = useCallback(async () => {
        try {
            setLoadingConversations(true);
            const loadedConversations = await messagingService.getConversations();
            setConversations(loadedConversations);
        } catch (error) {
            console.error('Error loading conversations:', error);
            setConversations([]);
        } finally {
            setLoadingConversations(false);
        }
    }, []);

    const selectConversation = useCallback(async (conversation) => {
        if (selectedConversation?.id === conversation.id) return;

        setSelectedConversation(conversation);
        setLoadingMessages(true);
        try {
            messagingService.joinConversation(conversation.id);
            const loadedMessages = await messagingService.getMessages(conversation.id);
            setMessages(loadedMessages);
        } catch (error) {
            console.error(`Error loading messages for conversation ${conversation.id}:`, error);
            setMessages([]);
        } finally {
            setLoadingMessages(false);
        }
    }, [selectedConversation]);

    const sendMessage = useCallback(async (content) => {
        if (!selectedConversation || !content.trim()) return;

        setSendingMessage(true);
        try {
            const newMessage = await messagingService.sendMessage(selectedConversation.id, content);
            setMessages(prev => [...prev, newMessage]);
            // Optimistically update conversation list
            const updatedConversations = conversations.map(c => 
                c.id === selectedConversation.id ? { ...c, lastMessage: newMessage } : c
            );
            setConversations(updatedConversations);
        } catch (error) {
            console.error('Error sending message:', error);
            // Optionally revert optimistic update
        } finally {
            setSendingMessage(false);
        }
    }, [selectedConversation, conversations]);

    const createConversation = useCallback(async (participantId) => {
        try {
            // Create a new direct conversation and refresh
            const convo = await messagingService.createDirectConversation(participantId);
            await loadConversations();
            await selectConversation(convo);
            return convo;
        } catch (error) {
            console.error('Error creating conversation:', error);
            throw error;
        }
    }, [loadConversations, selectConversation]);
    
    // compute total unread messages
    const unreadCount = (conversations || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);

    const clearConversation = useCallback(() => {
        if (selectedConversation) {
            messagingService.leaveConversation(selectedConversation.id);
        }
        setSelectedConversation(null);
        setMessages([]);
    }, [selectedConversation]);

    const value = {
        conversations,
        selectedConversation,
        messages,
        loadingConversations,
        loadingMessages,
        sendingMessage,
        unreadCount,
        typingStatus,
        readReceipts,
        userStatuses,
        selectConversation,
        sendMessage,
        createConversation,
        clearConversation,
        messagingService,
    };

    return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
};

export default MessageContext; 