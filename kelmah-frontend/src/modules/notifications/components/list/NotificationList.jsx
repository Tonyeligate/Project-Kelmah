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
import SwipeToAction from '../../../../components/common/SwipeToAction';
import EmptyState from '../../../../components/common/EmptyState';
import { useNotifications } from '../../contexts/NotificationContext';

const NotificationList = () => {
  const {
    notifications,
    loading,
    markAllAsRead,
    clearAllNotifications,
    deleteNotification,
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
        <EmptyState
          variant="notifications"
          title="All caught up!"
          subtitle="You have no new notifications. We'll let you know when something happens."
        />
      ) : (
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {notifications.map((notification) => (
            <SwipeToAction
              key={notification.id || notification._id}
              onDelete={() => deleteNotification(notification.id || notification._id)}
            >
              <NotificationItem
                notification={notification}
              />
            </SwipeToAction>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default NotificationList;
