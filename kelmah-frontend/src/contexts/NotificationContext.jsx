import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';
import { useSnackbar } from 'notistack';

// Create notification context
const NotificationContext = createContext();

// Custom hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [page, setPage] = useState(1);
  const limit = 20;

  // Initialize notification service when the component mounts
  useEffect(() => {
    if (isAuthenticated) {
      notificationService.connect();
      fetchNotifications();
      fetchPreferences();
    }

    return () => {
      notificationService.disconnect();
    };
  }, [isAuthenticated]);

  // Set up socket event listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNewNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
      // Show a notification toast if the user has enabled them
      if (preferences?.showToasts) {
        enqueueSnackbar(notification.title, {
          variant: getPriorityVariant(notification.priority),
          autoHideDuration: 5000,
          action: (key) => (
          <React.Fragment>
              <button onClick={() => markAsRead(notification._id)}>
                Mark as read
            </button>
          </React.Fragment>
          ),
      });
    }
    };

    const handleReadNotification = (notificationId) => {
    setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId 
            ? { ...n, read: true } 
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleDeletedNotification = (notificationId) => {
      setNotifications(prev => {
        const filtered = prev.filter(n => n._id !== notificationId);
        return filtered;
      });
      // Update unread count if needed
      setUnreadCount(prev => {
        const notification = notifications.find(n => n._id === notificationId);
        return notification && !notification.read ? Math.max(0, prev - 1) : prev;
      });
    };

    const handleUnreadCount = (count) => {
      setUnreadCount(count);
    };

    // Subscribe to notification events
    const unsubscribeNewNotification = notificationService.subscribe('notification', handleNewNotification);
    const unsubscribeReadNotification = notificationService.subscribe('notification_read', handleReadNotification);
    const unsubscribeDeletedNotification = notificationService.subscribe('notification_deleted', handleDeletedNotification);
    const unsubscribeUnreadCount = notificationService.subscribe('notification_count', handleUnreadCount);

    return () => {
      // Unsubscribe from all events
      unsubscribeNewNotification();
      unsubscribeReadNotification();
      unsubscribeDeletedNotification();
      unsubscribeUnreadCount();
    };
  }, [isAuthenticated, preferences]);

  // Helper function to get Notistack variant based on notification priority
  const getPriorityVariant = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const fetchNotifications = useCallback(async (refresh = false) => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const newPage = refresh ? 1 : page;
      const response = await notificationService.getNotifications(newPage, limit);
      
      if (refresh) {
        setNotifications(response.notifications);
      } else {
        setNotifications(prev => [...prev, ...response.notifications]);
      }
      
      setUnreadCount(response.unreadCount);
      setHasMore(response.notifications.length === limit);
      setPage(newPage + 1);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, page, limit]);

  const fetchPreferences = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const prefs = await notificationService.getNotificationPreferences();
      setPreferences(prefs);
    } catch (err) {
      console.error('Error fetching notification preferences:', err);
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!isAuthenticated) return;

    try {
      await notificationService.markAsRead(notificationId);
      
      // Update locally
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId 
            ? { ...n, read: true } 
            : n
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, [isAuthenticated]);

  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      await notificationService.markAllAsRead();
      
      // Update locally
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
      
      return true;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return false;
    }
  }, [isAuthenticated]);

  const deleteNotification = useCallback(async (notificationId) => {
    if (!isAuthenticated) return;

    try {
      await notificationService.deleteNotification(notificationId);
      
      // Update locally
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      // Update unread count if needed
      setUnreadCount(prev => {
        const notification = notifications.find(n => n._id === notificationId);
        return notification && !notification.read ? Math.max(0, prev - 1) : prev;
      });
      
      return true;
    } catch (err) {
      console.error('Error deleting notification:', err);
      return false;
    }
  }, [isAuthenticated, notifications]);

  const deleteAllNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      // This method might not exist in the notificationService
      // Falling back to marking all as read for now
      await notificationService.markAllAsRead();
      
      // Update locally
      setNotifications([]);
      setUnreadCount(0);
      
      return true;
    } catch (err) {
      console.error('Error clearing all notifications:', err);
      return false;
    }
  }, [isAuthenticated]);

  const updatePreferences = useCallback(async (newPreferences) => {
    if (!isAuthenticated) return;

    try {
      await notificationService.updateNotificationPreferences(newPreferences);
      setPreferences(newPreferences);
      return true;
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      return false;
    }
  }, [isAuthenticated]);

  const toggleChannel = useCallback(async (channel, enabled) => {
    if (!isAuthenticated) return;
    
    try {
      await notificationService.toggleNotificationChannel(channel, enabled);
      
      // Update local state
      if (preferences) {
        setPreferences(prev => ({
          ...prev,
          channels: {
            ...prev.channels,
            [channel]: enabled
          }
        }));
      }
      
      return true;
    } catch (err) {
      console.error(`Error toggling ${channel} notifications:`, err);
      return false;
    }
  }, [isAuthenticated, preferences]);

  const toggleType = useCallback(async (type, enabled) => {
    if (!isAuthenticated) return;
    
    try {
      await notificationService.toggleNotificationType(type, enabled);
      
      // Update local state
      if (preferences) {
        setPreferences(prev => ({
          ...prev,
          types: {
            ...prev.types,
            [type]: enabled
          }
        }));
      }
      
      return true;
    } catch (err) {
      console.error(`Error toggling ${type} notifications:`, err);
      return false;
    }
  }, [isAuthenticated, preferences]);

  const updateQuietHours = useCallback(async (quietHours) => {
    if (!isAuthenticated) return;
    
    try {
      await notificationService.updateQuietHours(quietHours);
      
      // Update local state
      if (preferences) {
        setPreferences(prev => ({
          ...prev,
          quietHours
        }));
      }
      
      return true;
    } catch (err) {
      console.error('Error updating quiet hours:', err);
      return false;
    }
  }, [isAuthenticated, preferences]);

  const enableAllNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      await notificationService.enableAllNotifications();
      await fetchPreferences();
      return true;
    } catch (err) {
      console.error('Error enabling all notifications:', err);
      return false;
    }
  }, [isAuthenticated, fetchPreferences]);

  // Context value
  const value = {
    notifications,
    unreadCount,
    preferences,
    loading,
    error,
    hasMore,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    updatePreferences,
    toggleChannel,
    toggleType,
    updateQuietHours,
    enableAllNotifications,
    notificationTypes: notificationService.notificationTypes,
    notificationChannels: notificationService.notificationChannels
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider; 