import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Button, 
  IconButton, 
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Grid,
  useTheme,
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  FilterList as FilterIcon,
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
  Refresh as RefreshIcon,
  DeleteSweep as DeleteSweepIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationListItem from '../components/notifications/NotificationListItem';
import PageHeader from '../components/common/PageHeader';

const NotificationsPage = () => {
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
  
  const [activeTab, setActiveTab] = useState(0);
  const [filterMenuAnchorEl, setFilterMenuAnchorEl] = useState(null);
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
  
  const navigate = useNavigate();
  const theme = useTheme();
  
  const filterMenuOpen = Boolean(filterMenuAnchorEl);
  const actionMenuOpen = Boolean(actionMenuAnchorEl);
  
  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchorEl(event.currentTarget);
  };
  
  const handleFilterMenuClose = () => {
    setFilterMenuAnchorEl(null);
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
  };
  
  const handleMarkAsRead = (event, notificationId) => {
    event.stopPropagation();
    markAsRead(notificationId);
    handleActionMenuClose();
  };
  
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };
  
  const handleDeleteConfirmOpen = () => {
    setDeleteConfirmOpen(true);
    handleActionMenuClose();
  };
  
  const handleDeleteConfirmClose = () => {
    setDeleteConfirmOpen(false);
  };
  
  const handleDeleteAllConfirmOpen = () => {
    setDeleteAllConfirmOpen(true);
    handleFilterMenuClose();
  };
  
  const handleDeleteAllConfirmClose = () => {
    setDeleteAllConfirmOpen(false);
  };
  
  const handleDelete = () => {
    if (selectedNotification) {
      deleteNotification(selectedNotification._id);
      setSelectedNotification(null);
    }
    setDeleteConfirmOpen(false);
  };
  
  const handleDeleteAll = () => {
    // This is a placeholder - in a real app, you would implement this functionality
    alert('Delete all notifications functionality would be implemented here');
    setDeleteAllConfirmOpen(false);
  };
  
  const handleRefresh = () => {
    fetchNotifications(true);
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
        6: 'system',
        7: 'security'
      };
      return notification.type === typeMap[activeTab];
    }
  });
  
  // Load more notifications when scrolled to bottom
  const handleScroll = (e) => {
    const element = e.target;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 100) {
      if (!loading && hasMore) {
        fetchNotifications();
      }
    }
  };
  
  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Notifications"
        description="Manage all your notifications"
        icon={<NotificationsIcon fontSize="large" />}
        action={
          <Button
            variant="contained"
            color="primary"
            startIcon={<SettingsIcon />}
            onClick={() => navigate('/notifications/preferences')}
          >
            Notification Settings
          </Button>
        }
      />
      
      <Paper elevation={3} sx={{ mt: 3, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="h6" component="div">
            {activeTab === 1 ? `Unread (${unreadCount})` : 'All Notifications'}
          </Typography>
          <Box>
            <IconButton onClick={handleRefresh} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
            <IconButton onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
              <MarkReadIcon />
            </IconButton>
            <IconButton onClick={handleFilterMenuOpen}>
              <FilterIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Divider />
        
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2 }}
        >
          <Tab label="All" />
          <Tab label={`Unread (${unreadCount})`} />
          <Tab icon={<MessageIcon fontSize="small" />} label="Messages" />
          <Tab icon={<WorkIcon fontSize="small" />} label="Jobs" />
          <Tab icon={<PaymentIcon fontSize="small" />} label="Payments" />
          <Tab icon={<ContractIcon fontSize="small" />} label="Contracts" />
          <Tab icon={<AnnouncementIcon fontSize="small" />} label="System" />
          <Tab icon={<SecurityIcon fontSize="small" />} label="Security" />
        </Tabs>
        
        <Divider />
        
        <Box
          sx={{ 
            maxHeight: 600, 
            overflow: 'auto', 
            pt: 0 
          }}
          onScroll={handleScroll}
        >
          {error ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="error" gutterBottom>
                {error}
              </Typography>
              <Button 
                variant="outlined" 
                onClick={handleRefresh} 
                startIcon={<RefreshIcon />}
                sx={{ mt: 2 }}
              >
                Retry
              </Button>
            </Box>
          ) : filteredNotifications.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No notifications
                            </Typography>
              <Typography color="text.secondary">
                {activeTab === 1 
                  ? "You're all caught up! No unread notifications."
                  : "You don't have any notifications yet."}
        </Typography>
                        </Box>
          ) : (
            <Box>
              {filteredNotifications.map((notification) => (
                <React.Fragment key={notification._id}>
                  <NotificationListItem
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onActionClick={(e) => handleActionMenuOpen(e, notification)}
                    onMarkAsRead={(e) => handleMarkAsRead(e, notification._id)}
                  />
                  <Divider />
                </React.Fragment>
              ))}
              {loading && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <CircularProgress />
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchorEl}
        open={filterMenuOpen}
        onClose={handleFilterMenuClose}
      >
        <MenuItem onClick={() => { setActiveTab(0); handleFilterMenuClose(); }}>
          <ListItemIcon>
            <NotificationsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>All notifications</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setActiveTab(1); handleFilterMenuClose(); }}>
          <ListItemIcon>
            <MarkReadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Unread only</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleMarkAllAsRead(); handleFilterMenuClose(); }}>
          <ListItemIcon>
            <MarkReadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Mark all as read</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteAllConfirmOpen}>
          <ListItemIcon>
            <DeleteSweepIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete all</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchorEl}
        open={actionMenuOpen}
        onClose={handleActionMenuClose}
      >
        {selectedNotification && !selectedNotification.isRead && (
          <MenuItem onClick={(e) => handleMarkAsRead(e, selectedNotification._id)}>
            <ListItemIcon>
              <MarkReadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Mark as read</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleDeleteConfirmOpen}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteConfirmClose}
      >
        <DialogTitle>Delete Notification</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this notification? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteConfirmClose}>Cancel</Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete All Confirmation Dialog */}
      <Dialog
        open={deleteAllConfirmOpen}
        onClose={handleDeleteAllConfirmClose}
      >
        <DialogTitle>Delete All Notifications</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete all notifications? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteAllConfirmClose}>Cancel</Button>
          <Button onClick={handleDeleteAll} color="error" autoFocus>
            Delete All
          </Button>
        </DialogActions>
      </Dialog>
        </Container>
    );
};

export default NotificationsPage;