import axios from 'axios';
import { getAuthToken } from './authService';
import { API_BASE_URL } from '../config/constants';

export const fetchConversation = async (jobId, userId1, userId2, limit = 50, offset = 0) => {
    try {
        const token = getAuthToken();
        const response = await axios.get(`${API_BASE_URL}/conversations/${jobId}`, {
            params: { userId1, userId2, limit, offset },
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching conversation:', error);
        throw error;
    }
};

export const sendMessage = async (messageData) => {
    try {
        const token = getAuthToken();
        const response = await axios.post(`${API_BASE_URL}/messages`, messageData, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

export const markMessageAsRead = async (messageId) => {
    try {
        const token = getAuthToken();
        const response = await axios.patch(`${API_BASE_URL}/messages/${messageId}/read`, {}, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error marking message as read:', error);
        throw error;
    }
};

export const getUnreadMessageCount = async (userId) => {
    try {
        const token = getAuthToken();
        const response = await axios.get(`${API_BASE_URL}/messages/unread-count`, {
            params: { userId },
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data.unreadCount;
    } catch (error) {
        console.error('Error getting unread message count:', error);
        throw error;
    }
};
