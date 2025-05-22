import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  IconButton,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  Box,
  Divider,
  Button,
  CircularProgress
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  MarkEmailRead as MarkReadIcon,
  Settings as SettingsIcon,
  NotificationsActive as NewNotificationIcon,
  Message as MessageIcon,
  Assignment as AssignmentIcon,
  Work as WorkIcon,
  Payment as PaymentIcon,
  Star as StarIcon,
  Person as PersonAddIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { styled } from '@mui/material/styles';
import { markNotificationAsRead, fetchNotifications } from '../../redux/actions/notificationActions';
import NotificationCenter from './NotificationCenter';

// Styled components
const NotificationPopover = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    width: 360,
    maxHeight: 450,
    maxWidth: '100%',
    overflow: 'hidden',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    }
  }
}));

const NotificationItem = styled(ListItem)(({ theme, isUnread }) => ({
  backgroundColor: isUnread ? theme.palette.action.hover : 'transparent',
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  },
  cursor: 'pointer',
  transition: 'background-color 0.2s ease'
}));

const NotificationHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText
}));

const NotificationList = styled(List)(({ theme }) => ({
  padding: 0,
  maxHeight: 320,
  overflow: 'auto'
}));

const EmptyNotifications = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(3),
  height: 200,
  color: theme.palette.text.secondary,
  textAlign: 'center'
}));

const NotificationFooter = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  padding: theme.spacing(1),
  borderTop: `1px solid ${theme.palette.divider}`
}));

// Helper function to get notification icon
const getNotificationIcon = (type) => {
  switch (type) {
    case 'message':
      return <MessageIcon color="primary" />;
    case 'job_application':
      return <AssignmentIcon style={{ color: '#388e3c' }} />;
    case 'job_update':
      return <WorkIcon style={{ color: '#f57c00' }} />;
    case 'payment':
      return <PaymentIcon style={{ color: '#6200ea' }} />;
    case 'review':
      return <StarIcon style={{ color: '#fbc02d' }} />;
    case 'connection':
      return <PersonAddIcon style={{ color: '#1976d2' }} />;
    case 'system':
      return <InfoIcon color="action" />;
    default:
      return <NotificationsIcon color="action" />;
  }
};

// Main component
const NotificationBadge = () => {
  const dispatch = useDispatch();
  const notifications = useSelector((state) => state.notifications.items);
  const unreadCount = useSelector((state) => state.notifications.unreadCount);
  const loading = useSelector((state) => state.notifications.loading);

  // Local state
  const [anchorEl, setAnchorEl] = useState(null);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  // Check for new notifications when unreadCount changes
  useEffect(() => {
    if (unreadCount > 0) {
      setHasNewNotification(true);
      
      // Reset the animation after 5 seconds
      const timer = setTimeout(() => {
        setHasNewNotification(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  const handleClick = (event) => {
    // If we already have notifications or are currently loading, just open the menu
    if (notifications.length > 0 || loading) {
      setAnchorEl(event.currentTarget);
    } else {
      // Otherwise, fetch notifications first
      dispatch(fetchNotifications()).then(() => {
        setAnchorEl(event.currentTarget);
      });
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOpenNotificationCenter = () => {
    setAnchorEl(null);
    setShowNotificationCenter(true);
  };

  const handleCloseNotificationCenter = () => {
    setShowNotificationCenter(false);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      dispatch(markNotificationAsRead(notification.id));
    }
    
    // Handle routing based on notification type
    // This would typically navigate to the relevant page
    handleClose();
  };

  const handleMarkAllAsRead = () => {
    // This action would mark all notifications as read
    handleClose();
  };

  // Get the most recent notifications for the preview
  const recentNotifications = notifications.slice(0, 5);

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={handleClick}
          size="large"
          sx={{ 
            animation: hasNewNotification 
              ? 'pulse 1s infinite' 
              : 'none',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.1)' },
              '100%': { transform: 'scale(1)' }
            }
          }}
        >
          <Badge 
            badgeContent={unreadCount} 
            color="error"
            overlap="circular"
          >
            {hasNewNotification ? (
              <NewNotificationIcon />
            ) : (
              <NotificationsIcon />
            )}
          </Badge>
        </IconButton>
      </Tooltip>
      
      <NotificationPopover
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <NotificationHeader>
          <Typography variant="subtitle1">
            Notifications
            {unreadCount > 0 && (
              <Typography component="span" variant="body2" sx={{ ml: 1 }}>
                ({unreadCount} unread)
              </Typography>
            )}
          </Typography>
          {unreadCount > 0 && (
            <Tooltip title="Mark all as read">
              <IconButton size="small" color="inherit" onClick={handleMarkAllAsRead}>
                <MarkReadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </NotificationHeader>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={30} />
          </Box>
        ) : recentNotifications.length === 0 ? (
          <EmptyNotifications>
            <NotificationsIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
            <Typography variant="body1">No notifications yet</Typography>
            <Typography variant="body2" color="textSecondary">
              Notifications will appear here
            </Typography>
          </EmptyNotifications>
        ) : (
          <NotificationList>
            {recentNotifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <NotificationItem 
                  button
                  isUnread={!notification.read}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <ListItemAvatar>
                    <Avatar>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body1"
                        color="textPrimary"
                        sx={{ 
                          fontWeight: notification.read ? 'normal' : 'bold',
                          fontSize: '0.9rem'
                        }}
                      >
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ 
                            display: 'block',
                            fontSize: '0.8rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          sx={{ fontSize: '0.75rem' }}
                        >
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </Typography>
                      </>
                    }
                  />
                </NotificationItem>
                <Divider />
              </React.Fragment>
            ))}
          </NotificationList>
        )}
        
        <NotificationFooter>
          <Button 
            onClick={handleOpenNotificationCenter}
            endIcon={<SettingsIcon />}
          >
            View all notifications
          </Button>
        </NotificationFooter>
      </NotificationPopover>
      
      <NotificationCenter
        open={showNotificationCenter}
        onClose={handleCloseNotificationCenter}
      />
    </>
  );
};

export default NotificationBadge; 