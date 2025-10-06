import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { normalizeUser } from '../../../utils/userUtils';
import { Snackbar, Alert } from '@mui/material';
import notificationServiceUser, { notificationService } from '../services/notificationService';
import { secureStorage } from '../../../utils/secureStorage';
const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  // FIXED: Use standardized user normalization for consistent user data access
  const { user: rawUser } = useSelector(state => state.auth);
  const user = normalizeUser(rawUser);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  // ✅ FIXED: Add null-safety check to prevent crashes
  const unreadCount = (notifications || []).filter((n) => !n.read && n.readStatus?.isRead !== true).length;

  const fetchNotifications = useCallback(async (params = {}) => {
    // ✅ FIX: Check both user AND token availability before making API call
    if (!user) return;
    const token = secureStorage.getAuthToken();
    if (!token) {
      console.log('⏸️ Skipping notifications fetch - no auth token available yet');
      return;
    }
    
    setLoading(true);
    console.log('🔄 Fetching real notification data from API...');

    try {
      const resp = await notificationServiceUser.getNotifications(params);
      // Normalize backend shapes: controller returns { notifications, ... }
      // but service may already unwrap .data
      const list = Array.isArray(resp?.notifications)
        ? resp.notifications
        : Array.isArray(resp?.data?.notifications)
          ? resp.data.notifications
          : Array.isArray(resp?.data)
            ? resp.data
            : Array.isArray(resp)
              ? resp
              : [];
      // If list items are raw Notification documents, map to UI shape keys
      const normalized = list.map((n) => ({
        id: n.id || n._id,
        title: n.title || n.content || n.message,
        message: n.content || n.message || '',
        createdAt: n.createdAt || n.date || new Date().toISOString(),
        read: n.read ?? n.readStatus?.isRead ?? false,
        type: n.type || 'system',
        ...n,
      }));
      
      console.log('📩 Notifications received:', {
        responseType: typeof resp,
        hasData: !!resp?.data,
        isArray: Array.isArray(resp?.data || resp),
        count: Array.isArray(list) ? list.length : 0
      });
      
      setNotifications(normalized);
      const pag = resp?.pagination || resp?.data?.pagination;
      if (pag) {
        setPagination({
          page: parseInt(pag.page) || 1,
          limit: parseInt(pag.limit) || 20,
          total: parseInt(pag.total) || normalized.length,
          pages: parseInt(pag.pages) || Math.ceil((parseInt(pag.total) || normalized.length) / (parseInt(pag.limit) || 20))
        });
      } else {
        setPagination((prev) => ({ ...prev, total: normalized.length, pages: 1 }));
      }
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Could not load notifications. Please check your connection.');
      // Ensure we always have a valid array, never undefined
      setNotifications([]);
      setPagination({ page: 1, limit: 20, total: 0, pages: 0 });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    if (user) {
      try {
        const token = null; // Token is already attached via axios interceptors for HTTP; socket auth handled internally if needed
        notificationService.onNotification = (payload) => {
          setNotifications((prev) => [{ ...payload, read: false }, ...prev]);
        };
        notificationService.connect(token);
      } catch {}
    }
    return () => {
      try { notificationService.disconnect(); } catch {}
    };
  }, [fetchNotifications, user]);

  const markAsRead = async (id) => {
    try {
      await notificationServiceUser.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => ((n.id || n._id) === id ? { ...n, read: true, readStatus: { ...(n.readStatus||{}), isRead: true, readAt: new Date().toISOString() } } : n)),
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      setError('Failed to update notification status.');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationServiceUser.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      setError('Failed to update notifications.');
    }
  };

  const clearAllNotifications = async () => {
    try {
      await notificationServiceUser.clearAllNotifications();
      setNotifications([]);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
      setError('Failed to clear notifications.');
    }
  };

  const showToast = useCallback((message, severity = 'info') => {
    setToast({ open: true, message, severity });
  }, []);

  const handleCloseToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  const value = {
    notifications,
    loading,
    error,
    unreadCount,
    pagination,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    refresh: fetchNotifications,
    showToast,
    // Preferences API passthrough
    getPreferences: notificationServiceUser.getPreferences,
    updatePreferences: notificationServiceUser.updatePreferences,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseToast}
          severity={toast.severity}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider',
    );
  }
  return context;
};

export default NotificationContext;
