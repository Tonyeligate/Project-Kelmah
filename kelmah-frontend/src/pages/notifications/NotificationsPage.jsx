import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemAvatar,
    Avatar,
    IconButton,
    Paper,
    Divider,
    Chip,
    Button,
    CircularProgress,
    Menu,
    MenuItem,
    Tab,
    Tabs,
    Tooltip
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    CheckCircle,
    Work,
    Message,
    Payment,
    Star,
    Delete,
    FilterList,
    MoreVert,
    Settings
} from '@mui/icons-material';
import { useNotifications } from '../../contexts/NotificationContext';
import { Link } from 'react-router-dom';
import InfiniteScroll from 'react-infinite-scroll-component';

function NotificationsPage() {
    const { 
        notifications = [], 
        markAsRead, 
        markAllAsRead, 
        deleteNotification, 
        loading, 
        hasMore, 
        loadMore, 
        refresh, 
        unreadCount 
    } = useNotifications();
    
    const [filterType, setFilterType] = useState('all');
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedNotification, setSelectedNotification] = useState(null);
    
    // Filter notifications based on type
    const filteredNotifications = notifications.filter(notification => {
        if (filterType === 'all') return true;
        if (filterType === 'unread') return !notification.read;
        return notification.type === filterType;
    });
    
    const handleMenuOpen = (event, notification) => {
        setAnchorEl(event.currentTarget);
        setSelectedNotification(notification);
    };
    
    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedNotification(null);
    };
    
    const handleMarkRead = () => {
        if (selectedNotification) {
            markAsRead(selectedNotification.id);
        }
        handleMenuClose();
    };
    
    const handleDelete = () => {
        if (selectedNotification) {
            deleteNotification(selectedNotification.id);
        }
        handleMenuClose();
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
    
    const handleChangeFilter = (event, newValue) => {
        setFilterType(newValue);
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={2}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6">
                        Notifications
                        {unreadCount > 0 && (
                            <Chip 
                                label={`${unreadCount} new`} 
                                size="small" 
                                color="primary" 
                                sx={{ ml: 1 }}
                            />
                        )}
                    </Typography>
                    <Box>
                        <Tooltip title="Mark all as read">
                            <Button 
                                size="small" 
                                startIcon={<CheckCircle />}
                                onClick={markAllAsRead}
                                disabled={unreadCount === 0}
                            >
                                Mark all read
                            </Button>
                        </Tooltip>
                        <Tooltip title="Notification preferences">
                            <IconButton 
                                component={Link} 
                                to="/settings/notifications"
                                color="primary"
                            >
                                <Settings fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
                
                <Tabs 
                    value={filterType} 
                    onChange={handleChangeFilter}
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab label="All" value="all" />
                    <Tab label="Unread" value="unread" />
                    <Tab label="Jobs" value="job" />
                    <Tab label="Messages" value="message" />
                    <Tab label="Payments" value="payment" />
                </Tabs>
                
                <Box sx={{ minHeight: 300 }}>
                    {loading && notifications.length === 0 ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <InfiniteScroll
                            dataLength={filteredNotifications.length}
                            next={loadMore}
                            hasMore={hasMore}
                            loader={
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                    <CircularProgress size={24} />
                                </Box>
                            }
                            endMessage={
                                <Box sx={{ textAlign: 'center', p: 2, color: 'text.secondary' }}>
                                    <Typography variant="body2">
                                        {filteredNotifications.length > 0 
                                            ? "You've reached the end" 
                                            : "No notifications found"}
                                    </Typography>
                                </Box>
                            }
                            pullDownToRefresh
                            pullDownToRefreshThreshold={50}
                            refreshFunction={refresh}
                            pullDownToRefreshContent={
                                <Box sx={{ textAlign: 'center', p: 1 }}>
                                    <Typography variant="body2">Pull down to refresh</Typography>
                                </Box>
                            }
                            releaseToRefreshContent={
                                <Box sx={{ textAlign: 'center', p: 1 }}>
                                    <Typography variant="body2">Release to refresh</Typography>
                                </Box>
                            }
                        >
                            <List>
                                {filteredNotifications.length > 0 ? (
                                    filteredNotifications.map((notification, index) => (
                                        <React.Fragment key={notification.id || index}>
                                            <ListItem
                                                alignItems="flex-start"
                                                sx={{
                                                    backgroundColor: notification.read ? 'inherit' : 'rgba(66, 133, 244, 0.05)',
                                                    transition: 'background-color 0.3s'
                                                }}
                                                secondaryAction={
                                                    <IconButton
                                                        edge="end"
                                                        onClick={(e) => handleMenuOpen(e, notification)}
                                                    >
                                                        <MoreVert />
                                                    </IconButton>
                                                }
                                            >
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: notification.read ? 'grey.300' : 'primary.main' }}>
                                                        {getNotificationIcon(notification.type)}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            {notification.title}
                                                            {!notification.read && (
                                                                <Chip
                                                                    label="New"
                                                                    size="small"
                                                                    color="primary"
                                                                    sx={{ height: 20 }}
                                                                />
                                                            )}
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <>
                                                            <Typography
                                                                component="span"
                                                                variant="body2"
                                                                color="text.primary"
                                                            >
                                                                {notification.message}
                                                            </Typography>
                                                            <Typography
                                                                component="span"
                                                                variant="caption"
                                                                sx={{ display: 'block', mt: 1 }}
                                                                color="text.secondary"
                                                            >
                                                                {new Date(notification.createdAt || notification.created_at).toLocaleString()}
                                                            </Typography>
                                                        </>
                                                    }
                                                />
                                            </ListItem>
                                            {index < filteredNotifications.length - 1 && (
                                                <Divider variant="inset" component="li" />
                                            )}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <ListItem>
                                        <ListItemIcon>
                                            <NotificationsIcon color="disabled" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="No notifications"
                                            secondary={filterType !== 'all' ? "Try changing your filter" : "You're all caught up!"}
                                        />
                                    </ListItem>
                                )}
                            </List>
                        </InfiniteScroll>
                    )}
                </Box>
            </Paper>
            
            {/* Notification actions menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                {selectedNotification && !selectedNotification.read && (
                    <MenuItem onClick={handleMarkRead}>
                        <ListItemIcon>
                            <CheckCircle fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Mark as read" />
                    </MenuItem>
                )}
                <MenuItem onClick={handleDelete}>
                    <ListItemIcon>
                        <Delete fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Delete" />
                </MenuItem>
            </Menu>
        </Container>
    );
}

export default NotificationsPage; 