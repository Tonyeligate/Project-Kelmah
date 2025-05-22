import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  Badge,
    Box,
  Button, 
  Divider, 
    IconButton,
    List,
    ListItem,
  ListItemAvatar, 
    ListItemText,
    Menu,
    MenuItem,
  Paper, 
  Popover, 
  Stack, 
  Tab, 
  Tabs, 
  Typography,
  useTheme,
  alpha,
  CircularProgress
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Message as MessageIcon,
  Work as WorkIcon,
  Payment as PaymentIcon,
  Star as StarIcon,
  Description as ContractIcon,
  Announcement as AnnouncementIcon,
  ErrorOutline as SecurityIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import NotificationListItem from './NotificationListItem';
import EmptyState from '../common/EmptyState';

const NotificationCenter = () => {
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        fetchNotifications,
    loading,
    hasMore,
    error
    } = useNotifications();
  
    const [anchorEl, setAnchorEl] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
    const [selectedNotification, setSelectedNotification] = useState(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
    const theme = useTheme();

  const open = Boolean(anchorEl);
  const actionMenuOpen = Boolean(actionMenuAnchorEl);
  
  const handleButtonClick = (event) => {
    if (open) {
      handleClose();
    } else {
      setAnchorEl(event.currentTarget);
    }
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

  const handleActionMenuOpen = (event, notification) => {
    event.stopPropagation();
    setSelectedNotification(notification);
    setActionMenuAnchorEl(event.currentTarget);
  };
  
  const handleActionMenuClose = () => {
    setActionMenuAnchorEl(null);
    setSelectedNotification(null);
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    };

    const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
            markAsRead(notification._id);
        }
        
    // Handle navigation to the appropriate page based on notification type and metadata
    if (notification.metadata) {
            switch (notification.type) {
        case 'message':
          navigate(`/messages?conversationId=${notification.metadata.conversationId}`);
                    break;
        case 'job_update':
          navigate(`/jobs/${notification.metadata.jobId}`);
                    break;
        case 'payment':
          navigate(`/payments/${notification.metadata.paymentId}`);
                    break;
        case 'review':
          navigate(`/reviews/${notification.metadata.reviewId}`);
                    break;
        case 'proposal':
          navigate(`/proposals/${notification.metadata.proposalId}`);
                    break;
        case 'contract':
          navigate(`/contracts/${notification.metadata.contractId}`);
                    break;
                default:
          // For system and security notifications, usually no navigation
                    break;
            }
        }
    
    // Close the notification center
    handleClose();
  };
  
  const handleMarkAsRead = (event, notificationId) => {
    event.stopPropagation();
    markAsRead(notificationId);
    handleActionMenuClose();
  };
  
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };
  
  const handleDelete = (event, notificationId) => {
    event.stopPropagation();
    deleteNotification(notificationId);
    handleActionMenuClose();
  };
  
  const handleRefresh = () => {
    fetchNotifications(true);
  };
  
  const handleShowAll = () => {
    navigate('/notifications');
    handleClose();
  };
  
  // Filter notifications based on active tab
    const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 0) {
      return true; // All notifications
    } else if (activeTab === 1) {
      return !notification.isRead; // Unread only
    } else {
      // Filter by type
      const typeMap = {
        2: 'message',
        3: 'job_update',
        4: 'payment',
        5: 'contract',
        6: 'system'
      };
      return notification.type === typeMap[activeTab];
    }
  });
  
  // Icon map for notification types
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <MessageIcon />;
      case 'job_update':
        return <WorkIcon />;
      case 'payment':
        return <PaymentIcon />;
      case 'review':
        return <StarIcon />;
      case 'proposal':
        return <WorkIcon />;
      case 'contract':
        return <ContractIcon />;
      case 'system':
        return <AnnouncementIcon />;
      case 'security':
        return <SecurityIcon />;
      default:
        return <NotificationsIcon />;
    }
  };
  
  // Load more notifications when scrolled to bottom
  const handleScroll = (e) => {
    const element = e.target;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 50) {
      if (!loading && hasMore) {
        fetchNotifications();
      }
    }
  };
  
  return (
    <>
                <IconButton 
        size="large"
        color="inherit"
        aria-label="show notifications"
        onClick={handleButtonClick}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
                </IconButton>
      
      <Popover
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
      >
        <Paper sx={{ width: 360, maxHeight: 480, overflow: 'hidden', boxShadow: theme.shadows[4] }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="div">
              Notifications
                        </Typography>
            <Stack direction="row" spacing={1}>
              <IconButton size="small" onClick={handleRefresh} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
              <IconButton size="small" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                <MarkReadIcon />
              </IconButton>
              <IconButton size="small" onClick={() => navigate('/notifications/preferences')}>
                <SettingsIcon />
                        </IconButton>
            </Stack>
                </Box>
          
          <Divider />
          
                    <Tabs 
            value={activeTab}
                        onChange={handleTabChange} 
                        variant="scrollable"
                        scrollButtons="auto"
            sx={{ px: 1 }}
          >
            <Tab label="All" />
            <Tab label={`Unread (${unreadCount})`} />
            <Tab icon={<MessageIcon fontSize="small" />} aria-label="Messages" />
            <Tab icon={<WorkIcon fontSize="small" />} aria-label="Jobs" />
            <Tab icon={<PaymentIcon fontSize="small" />} aria-label="Payments" />
            <Tab icon={<ContractIcon fontSize="small" />} aria-label="Contracts" />
            <Tab icon={<AnnouncementIcon fontSize="small" />} aria-label="System" />
                    </Tabs>
          
          <Divider />
          
          {error ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="error" gutterBottom>
                {error}
              </Typography>
              <Button onClick={handleRefresh} startIcon={<RefreshIcon />}>
                Retry
              </Button>
            </Box>
          ) : (
            <Box
              ref={listRef}
              sx={{
                maxHeight: 320,
                overflow: 'auto',
                bgcolor: 'background.paper',
              }}
              onScroll={handleScroll}
            >
              {filteredNotifications.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <EmptyState
                    icon={NotificationsIcon}
                    title="No notifications"
                    description={activeTab === 1 ? "You're all caught up!" : "You don't have any notifications yet"}
                  />
                </Box>
              ) : (
                <List disablePadding>
                  {filteredNotifications.map((notification) => (
                    <React.Fragment key={notification._id}>
                      <NotificationListItem
                        notification={notification}
                        onClick={() => handleNotificationClick(notification)}
                        onActionClick={(e) => handleActionMenuOpen(e, notification)}
                        onMarkAsRead={(e) => handleMarkAsRead(e, notification._id)}
                      />
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                  {loading && (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                      <CircularProgress size={24} />
                    </Box>
                  )}
                </List>
              )}
            </Box>
          )}
          
          <Divider />
          
          <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
            <Button fullWidth onClick={handleShowAll}>
              View All Notifications
            </Button>
                </Box>
        </Paper>
      </Popover>

                <Menu
        anchorEl={actionMenuAnchorEl}
        open={actionMenuOpen}
        onClose={handleActionMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {selectedNotification && !selectedNotification.isRead && (
          <MenuItem onClick={(e) => handleMarkAsRead(e, selectedNotification._id)}>
                            <ListItemIcon>
              <MarkReadIcon fontSize="small" />
                            </ListItemIcon>
            <ListItemText>Mark as read</ListItemText>
                        </MenuItem>
                    )}
        <MenuItem onClick={(e) => handleDelete(e, selectedNotification?._id)}>
                        <ListItemIcon>
            <DeleteIcon fontSize="small" />
                        </ListItemIcon>
          <ListItemText>Remove</ListItemText>
                    </MenuItem>
                </Menu>
        </>
    );
};

export default NotificationCenter; 