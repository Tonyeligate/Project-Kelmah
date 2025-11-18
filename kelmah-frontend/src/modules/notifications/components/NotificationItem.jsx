import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Mail as MailIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useNotifications } from '../contexts/NotificationContext';

const getNotificationIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'message':
      return <MailIcon color="primary" />;
    case 'application':
      return <AssignmentIcon color="secondary" />;
    case 'success':
      return <CheckCircleIcon color="success" />;
    case 'error':
      return <ErrorIcon color="error" />;
    case 'info':
      return <InfoIcon color="info" />;
    default:
      return <NotificationsIcon color="disabled" />;
  }
};

const NotificationItem = ({ notification, sx = {} }) => {
  const { markAsRead, deleteNotification } = useNotifications();
  const hasNotification = Boolean(notification);

  const id = notification?.id || notification?._id || '';
  const title =
    notification?.title || notification?.content || notification?.message;
  const message = notification?.content || notification?.message || '';
  const createdAt = notification?.createdAt || notification?.date || Date.now();
  const read = notification?.read ?? notification?.readStatus?.isRead ?? false;
  const type = notification?.type;
  const handleItemClick = useCallback(() => {
    if (!hasNotification || read) {
      return;
    }
    markAsRead(id);
  }, [hasNotification, read, markAsRead, id]);

  const handleDelete = useCallback(
    (e) => {
      if (!hasNotification) {
        return;
      }
      e.stopPropagation();
      deleteNotification(id);
    },
    [hasNotification, id, deleteNotification],
  );

  if (!hasNotification) {
    return null;
  }
  return (
    <ListItem
      button
      onClick={handleItemClick}
      alignItems="flex-start"
      sx={{
        py: 1.5,
        bgcolor: read ? 'transparent' : 'action.hover',
        transition: 'background-color 0.3s',
        '&:hover': {
          bgcolor: read ? 'action.hover' : 'action.selected',
        },
        ...sx,
      }}
    >
      <ListItemIcon sx={{ mt: 0.5 }}>{getNotificationIcon(type)}</ListItemIcon>

      <ListItemText
        primary={
          <Typography
            variant="body1"
            sx={{ fontWeight: read ? 'normal' : 'bold' }}
          >
            {title}
          </Typography>
        }
        secondary={
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {message}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {format(new Date(createdAt), 'PPpp')}
            </Typography>
          </>
        }
      />

      <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
        {!read && (
          <Chip
            size="small"
            label="New"
            color="primary"
            sx={{ mr: 1, height: '20px', fontSize: '0.7rem' }}
          />
        )}
        <IconButton
          edge="end"
          aria-label="delete"
          onClick={handleDelete}
          size="small"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </ListItem>
  );
};

NotificationItem.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    content: PropTypes.string,
    message: PropTypes.string,
    createdAt: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.instanceOf(Date),
    ]),
    date: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.instanceOf(Date),
    ]),
    read: PropTypes.bool,
    readStatus: PropTypes.shape({
      isRead: PropTypes.bool,
    }),
    type: PropTypes.string,
  }),
  sx: PropTypes.object,
};

export default NotificationItem;
