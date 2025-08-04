import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../auth/contexts/AuthContext';
import { Snackbar, Alert } from '@mui/material';
import notificationServiceUser from '../services/notificationService';
import { USE_MOCK_DATA } from '../../../config';

const NotificationContext = createContext(null);

const mockNotifications = [
  {
    id: 1,
    type: 'message',
    message:
      "You have a new message from John Smith regarding the 'Kitchen Sink Repair' job.",
    link: '/messages/123',
    read: false,
    date: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: 2,
    type: 'job',
    message:
      "Your application for 'Ceiling Fan Installation' has been viewed by the hirer.",
    link: '/worker/applications',
    read: false,
    date: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: 3,
    type: 'contract',
    message:
      "A new contract for 'Drywall Patching' has been sent to you for review.",
    link: '/contracts/c4',
    read: true,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: 4,
    type: 'job',
    message:
      "The 'Electrical Socket Replacement' job has been marked as complete.",
    link: '/jobs/j5',
    read: true,
    date: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
];

export const NotificationProvider = ({ children }) => {
  // Guard against missing AuthProvider (e.g. in tests)
  let user = null;
  try {
    user = useAuth().user;
  } catch (e) {
    user = null;
  }
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    console.log('🔄 Fetching real notification data from API...');

    try {
      const resp = await notificationServiceUser.getNotifications();
      setNotifications(resp.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Could not load notifications. Please check your connection.');
      // Don't fall back to mock data - show actual error state
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await notificationServiceUser.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
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
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    refresh: fetchNotifications,
    showToast,
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
