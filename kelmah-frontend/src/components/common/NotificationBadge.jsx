import React, { useState, useEffect } from 'react';
import { 
  Badge, 
  IconButton, 
  Popover, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Typography, 
  Box, 
  Divider, 
  Button 
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  Work,
  Message,
  Payment,
  Star,
  Circle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';

const NotificationBadge = () => {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  
  // Show only the most recent 5 notifications
  const recentNotifications = notifications.slice(0, 5);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Handle navigation based on notification type and data
    if (notification.actionLink) {
      navigate(notification.actionLink);
    } else {
      // Default navigation based on type
      switch (notification.type) {
        case 'message':
          navigate(`/messages/${notification.relatedId || ''}`);
          break;
        case 'job':
        case 'job_update':
          navigate(`/jobs/${notification.relatedId || ''}`);
          break;
        case 'payment':
          navigate(`/payments/${notification.relatedId || ''}`);
          break;
        default:
          navigate('/notifications');
      }
    }
    
    handleClose();
  };

  const handleViewAll = () => {
    navigate('/notifications');
    handleClose();
  };
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'job':
      case 'job_update':
        return <Work />;
      case 'message':
        return <Message />;
      case 'payment':
        return <Payment />;
      case 'review':
        return <Star />;
      default:
        return <NotificationsIcon />;
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  return (
    <>
      <IconButton
        color="inherit"
        aria-label="notifications"
        onClick={handleClick}
        aria-describedby={id}
      >
        <Badge badgeContent={unreadCount} color="error" overlap="circular">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 500,
            overflow: 'auto',
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Typography variant="body2" color="primary">
              {unreadCount} new
            </Typography>
          )}
        </Box>
        
        {recentNotifications.length > 0 ? (
          <>
            <List sx={{ p: 0 }}>
              {recentNotifications.map((notification, index) => (
                <React.Fragment key={notification.id || index}>
                  <ListItem 
                    button 
                    alignItems="flex-start"
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      backgroundColor: notification.read ? 'inherit' : 'rgba(66, 133, 244, 0.05)',
                      transition: 'background-color 0.3s'
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: notification.read ? 'grey.300' : 'primary.main' }}>
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" noWrap>
                            {notification.title}
                          </Typography>
                          {!notification.read && (
                            <Circle 
                              fontSize="small" 
                              color="primary" 
                              sx={{ ml: 1, width: 8, height: 8 }} 
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography
                            variant="body2"
                            color="text.primary"
                            noWrap
                            sx={{ display: 'block' }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {new Date(notification.createdAt || notification.created_at).toLocaleString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < recentNotifications.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
            
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
              <Button 
                variant="text" 
                color="primary" 
                onClick={handleViewAll}
                fullWidth
              >
                View All Notifications
              </Button>
            </Box>
          </>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsIcon color="disabled" sx={{ fontSize: 40, mb: 2 }} />
            <Typography color="textSecondary">
              No notifications yet
            </Typography>
          </Box>
        )}
      </Popover>
    </>
  );
};

export default NotificationBadge; 