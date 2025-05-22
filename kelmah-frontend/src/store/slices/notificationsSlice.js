import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const deleteNotification = createAsyncThunk(
    'notifications/deleteNotification',
    async (notificationId, { rejectWithValue }) => {
        try {
            await api.delete(`/api/notifications/${notificationId}`);
            return notificationId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete notification');
        }
    }
);

export const fetchNotifications = createAsyncThunk(
    'notifications/fetchNotifications',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/notifications');
            const notifications = Array.isArray(response.data) ? response.data : [];
            return notifications;
        } catch (error) {
            return rejectWithValue({
                message: error.response?.data?.message || 'Failed to fetch notifications',
                status: error.response?.status,
                error: error.message
            });
        }
    }
);

export const markAsRead = createAsyncThunk(
    'notifications/markAsRead',
    async (notificationId, { rejectWithValue }) => {
        try {
            await api.patch(`/api/notifications/${notificationId}/read`);
            return notificationId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to mark notification as read');
        }
    }
);

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState: {
        items: [],
        loading: false,
        error: null,
        unreadCount: 0
    },
    reducers: {
        clearNotifications: (state) => {
            state.items = [];
            state.unreadCount = 0;
            state.error = null;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
                state.unreadCount = action.payload.filter(item => !item.read).length;
                state.error = null;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(deleteNotification.fulfilled, (state, action) => {
                state.items = state.items.filter(item => item.id !== action.payload);
                state.unreadCount = state.items.filter(item => !item.read).length;
            })
            .addCase(deleteNotification.rejected, (state, action) => {
                state.error = action.payload;
            })
            .addCase(markAsRead.fulfilled, (state, action) => {
                const notification = state.items.find(item => item.id === action.payload);
                if (notification && !notification.read) {
                    notification.read = true;
                    state.unreadCount = state.items.filter(item => !item.read).length;
                }
            })
            .addCase(markAsRead.rejected, (state, action) => {
                state.error = action.payload;
            });
    }
});

export const { clearNotifications, clearError } = notificationsSlice.actions;
export default notificationsSlice.reducer; 