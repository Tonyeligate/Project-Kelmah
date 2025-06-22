import { useState, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import chatService from '../services/chatService';
import { setConversations, setLoading, setError } from '../../../store/slices/chatSlice';
import { useAuth } from '../../auth/hooks/useAuth';

export const useChat = () => {
    const dispatch = useDispatch();
    const { isAuthenticated } = useAuth();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    // Initialize chat service with token from localStorage
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            chatService.initialize(token);
        }
    }, []);

    const loadConversations = useCallback(async () => {
        try {
            dispatch(setLoading(true));
            const conversations = await chatService.getConversations();
            dispatch(setConversations(conversations));
            return conversations;
        } catch (error) {
            dispatch(setError(error.message));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const loadConversation = useCallback(async (conversationId) => {
        try {
            dispatch(setLoading(true));
            const conversation = await chatService.getConversation(conversationId);
            setSelectedConversation(conversation);
            return conversation;
        } catch (error) {
            dispatch(setError(error.message));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const loadMessages = useCallback(async (conversationId, reset = false) => {
        try {
            dispatch(setLoading(true));
            const currentPage = reset ? 1 : page;
            const response = await chatService.getMessages(conversationId, currentPage);
            
            if (reset) {
                setMessages(response.messages);
                setPage(1);
            } else {
                setMessages(prev => [...prev, ...response.messages]);
                setPage(currentPage + 1);
            }
            
            setHasMore(response.hasMore);
            return response.messages;
        } catch (error) {
            dispatch(setError(error.message));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch, page]);

    const sendMessage = useCallback(async (conversationId, content) => {
        try {
            dispatch(setLoading(true));
            const message = await chatService.sendMessage(conversationId, content);
            setMessages(prev => [message, ...prev]);
            return message;
        } catch (error) {
            dispatch(setError(error.message));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const createConversation = useCallback(async (participantId) => {
        try {
            dispatch(setLoading(true));
            const conversation = await chatService.createConversation(participantId);
            await loadConversations(); // Refresh conversations list
            return conversation;
        } catch (error) {
            dispatch(setError(error.message));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch, loadConversations]);

    const markAsRead = useCallback(async (conversationId) => {
        try {
            dispatch(setLoading(true));
            await chatService.markAsRead(conversationId);
            await loadUnreadCount(); // Refresh unread count
        } catch (error) {
            dispatch(setError(error.message));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const deleteConversation = useCallback(async (conversationId) => {
        try {
            dispatch(setLoading(true));
            await chatService.deleteConversation(conversationId);
            await loadConversations(); // Refresh conversations list
            if (selectedConversation?.id === conversationId) {
                setSelectedConversation(null);
                setMessages([]);
            }
        } catch (error) {
            dispatch(setError(error.message));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch, loadConversations, selectedConversation]);

    const searchConversations = useCallback(async (query) => {
        try {
            dispatch(setLoading(true));
            const results = await chatService.searchConversations(query);
            return results;
        } catch (error) {
            dispatch(setError(error.message));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const loadUnreadCount = useCallback(async () => {
        try {
            const count = await chatService.getUnreadCount();
            setUnreadCount(count);
            return count;
        } catch (error) {
            console.error('Error loading unread count:', error);
            throw error;
        }
    }, []);

    // Load conversations and unread count when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            loadConversations();
            loadUnreadCount();
        }
    }, [isAuthenticated, loadConversations, loadUnreadCount]);

    return {
        selectedConversation,
        messages,
        unreadCount,
        hasMore,
        loadConversations,
        loadConversation,
        loadMessages,
        sendMessage,
        createConversation,
        markAsRead,
        deleteConversation,
        searchConversations,
        loadUnreadCount
    };
}; 