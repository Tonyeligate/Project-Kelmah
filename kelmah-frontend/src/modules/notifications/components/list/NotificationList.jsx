import React from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  Paper,
  CircularProgress,
  Divider,
} from '@mui/material';
import NotificationItem from '../NotificationItem';
import { useNotifications } from '../../contexts/NotificationContext';

const NotificationList = () => {
  const {
    notifications,
    loading,
    markAllAsRead,
    clearAllNotifications,
    unreadCount,
  } = useNotifications();

  if (loading) {
    return (
      <Paper
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 200,
        }}
      >
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h6">Notifications</Typography>
        <Box>
          <Button
            size="small"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            sx={{ mr: 1 }}
          >
            Mark all as read
          </Button>
          <Button
            size="small"
            color="error"
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
          >
            Clear all
          </Button>
        </Box>
      </Box>
      <Divider sx={{ mb: 2 }} />
      {notifications.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
          You have no new notifications.
        </Typography>
      ) : (
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id || notification._id}
              notification={notification}
            />
          ))}
        </List>
      )}
    </Paper>
  );
};

export default NotificationList;
