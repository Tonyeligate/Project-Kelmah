import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { normalizeUser } from '../../../utils/userUtils';
import { Snackbar, Alert } from '@mui/material';
import notificationServiceUser, {
  notificationService,
} from '../services/notificationService';
import { secureStorage } from '../../../utils/secureStorage';
const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  // FIXED: Use standardized user normalization for consistent user data access
  const { user: rawUser } = useSelector((state) => state.auth);
  const user = normalizeUser(rawUser);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  // ✅ FIXED: Add null-safety check to prevent crashes
  const unreadCount = (notifications || []).filter(
    (n) => !n.read && n.readStatus?.isRead !== true,
  ).length;

  // Normalize the user object from Redux or props to extract ONLY the ID
  // ⚠️ CRITICAL FIX: Only track user.id to prevent re-fetches on user object mutations
  const userId = useMemo(() => {
    if (!user) return null;
    return user.id || user._id || user.userId;
  }, [user?.id, user?._id, user?.userId]);

  // Track last fetch timestamp to prevent rapid re-fetches
  const lastFetchRef = useRef(0);
  const MIN_FETCH_INTERVAL = 30000; // 30 seconds minimum between fetches

  const fetchNotifications = useCallback(
    async ({ limit = 20, skip = 0 } = {}) => {
      // Rate limiting check - prevent rapid re-fetches
      const now = Date.now();
      if (now - lastFetchRef.current < MIN_FETCH_INTERVAL) {
        console.log('⏱️ Skipping notification fetch - too soon since last fetch');
        return;
      }

      // Only fetch if we have a user ID and token
      const currentToken = secureStorage.getItem('token');
      if (!userId || !currentToken) {
        setLoading(false);
        return; // Not logged in
      }

      try {
        setLoading(true);
        lastFetchRef.current = now; // Update last fetch timestamp

        const { data, pagination: paginationData } =
          await notificationServiceUser.getNotifications({
            limit,
            skip,
          });

        setNotifications(data);
        setPagination(paginationData);
        setUnreadCount(data.filter((n) => !n.read).length);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        // Check if it's a 429 Too Many Requests error
        if (err?.response?.status === 429) {
          // Rate limited - back off significantly
          console.warn('⚠️ Rate limited on notifications endpoint - backing off 2 minutes');
          lastFetchRef.current = now + 120000; // Block fetches for 2 minutes
          setError(
            'Too many requests. Please wait a moment before refreshing.',
          );
        } else {
          setError('Failed to load notifications.');
        }
      } finally {
        setLoading(false);
      }
    },
    [userId], // ⚠️ CRITICAL: Only depend on userId, not entire user object
  );

  // ⚠️ FIX: Only fetch on mount and when userId changes (not entire user object)
  // This prevents rapid re-fetches when Redux updates user object properties
  useEffect(() => {
    // Only fetch if we have a userId
    if (userId) {
      fetchNotifications();
    }

    if (userId) {
      try {
        const token = secureStorage.getAuthToken();

        if (!token) {
          console.log(
            '⏸️ Notifications: Auth token missing, delaying socket connection',
          );
        } else {
          notificationService.onNotification = (payload) => {
            setNotifications((prev) => [{ ...payload, read: false }, ...prev]);
          };
          notificationService.connect(token);
        }
      } catch (socketError) {
        console.error(
          'Notifications: Failed to initialise socket connection',
          socketError,
        );
      }
    }

    return () => {
      try {
        notificationService.disconnect();
      } catch (disconnectError) {
        console.warn(
          'Notifications: Socket disconnect failed',
          disconnectError,
        );
      }
    };
  }, [fetchNotifications, userId]); // ⚠️ CRITICAL: Depend on userId, not user object


  const markAsRead = async (id) => {
    try {
      await notificationServiceUser.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          (n.id || n._id) === id
            ? {
                ...n,
                read: true,
                readStatus: {
                  ...(n.readStatus || {}),
                  isRead: true,
                  readAt: new Date().toISOString(),
                },
              }
            : n,
        ),
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
