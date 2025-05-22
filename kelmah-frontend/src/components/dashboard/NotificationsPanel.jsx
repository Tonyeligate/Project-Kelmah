import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markAsRead, deleteNotification } from '../../store/slices/notificationsSlice';
import { 
    Box, 
    Typography, 
    List, 
    ListItem, 
    ListItemText, 
    ListItemIcon,
    Badge,
    IconButton,
    Tabs,
    Tab,
    Chip,
    Avatar,
    Button,
    Divider,
    Tooltip,
    CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { 
    NotificationsActive,
    Work,
    Payment,
    Message,
    Star,
    CheckCircle,
    Delete,
    Close
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSnackbar } from 'notistack';

const StyledNotificationItem = styled(ListItem)(({ theme, 'data-isnew': isNew }) => ({
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(1),
    backgroundColor: isNew ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
    transition: 'all 0.2s ease'
}));

const NotificationBadge = styled(Chip)(({ theme, type }) => {
    const colors = {
        job: theme.palette.primary.main,
        payment: theme.palette.success.main,
        message: theme.palette.info.main,
        review: theme.palette.warning.main
    };
    
    return {
        backgroundColor: alpha(colors[type], 0.1),
        color: colors[type],
        fontWeight: 500
    };
});

const getNotificationColor = (type) => {
    const colors = {
        job: 'primary',
        payment: 'success',
        message: 'info',
        review: 'warning'
    };
    return colors[type] || 'default';
};

const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
};

const getNotificationIcon = (type) => {
    switch (type) {
        case 'job':
            return <Work />;
        case 'payment':
            return <Payment />;
        case 'message':
            return <Message />;
        case 'review':
            return <Star />;
        default:
            return <NotificationsActive />;
    }
};

function NotificationsPanel({ onClose, onMarkAllRead }) {
    const dispatch = useDispatch();
    const { items: notifications, loading } = useSelector(state => state.notifications);
    const [currentTab, setCurrentTab] = useState(0);
    const { enqueueSnackbar } = useSnackbar();
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const initializeData = async () => {
            try {
                await dispatch(fetchNotifications()).unwrap();
                setIsInitialized(true);
            } catch (error) {
                enqueueSnackbar('Failed to load notifications', { variant: 'error' });
            }
        };
        
        initializeData();
    }, [dispatch, enqueueSnackbar]);

    if (!isInitialized) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    const handleMarkAllRead = async () => {
        try {
            const unreadNotifications = notifications.filter(n => !n.read);
            await Promise.all(
                unreadNotifications.map(notification => 
                    dispatch(markAsRead(notification.id)).unwrap()
                )
            );
            enqueueSnackbar('All notifications marked as read', { 
                variant: 'success' 
            });
        } catch (error) {
            enqueueSnackbar('Failed to mark all notifications as read', { 
                variant: 'error' 
            });
        }
    };

    const handleDelete = async (id) => {
        try {
            await dispatch(deleteNotification(id)).unwrap();
        } catch (error) {
            enqueueSnackbar('Failed to delete notification', { 
                variant: 'error' 
            });
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await dispatch(markAsRead(id)).unwrap();
            enqueueSnackbar('Notification marked as read', { 
                variant: 'success' 
            });
        } catch (error) {
            enqueueSnackbar('Failed to mark notification as read', { 
                variant: 'error' 
            });
        }
    };

    return (
        <Box sx={{ width: 300, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ 
                p: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderBottom: 1,
                borderColor: 'divider'
            }}>
                <Typography variant="h6">
                    Notifications
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Mark all as read">
                        <IconButton size="small" onClick={handleMarkAllRead}>
                            <CheckCircle />
                        </IconButton>
                    </Tooltip>
                    <IconButton size="small" onClick={onClose}>
                        <Close />
                    </IconButton>
                </Box>
            </Box>

            <Tabs 
                value={currentTab} 
                onChange={(_, newValue) => setCurrentTab(newValue)}
                variant="fullWidth"
                sx={{ px: 2, pt: 1 }}
            >
                <Tab label="All" />
                <Tab 
                    label="Unread" 
                    icon={
                        <Badge 
                            badgeContent={notifications.filter(n => !n.read).length} 
                            color="error"
                            sx={{ ml: 1 }}
                        />
                    }
                    iconPosition="end"
                />
            </Tabs>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
                    <AnimatePresence>
                        {notifications
                            .filter(n => currentTab === 0 || !n.read)
                            .map((notification) => (
                                <motion.div
                                    key={notification.id}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ListItem
                                        sx={{
                                            borderBottom: '1px solid',
                                            borderColor: 'divider',
                                            bgcolor: notification.read ? 'transparent' : alpha('#ffd700', 0.05)
                                        }}
                                    >
                                        <ListItemIcon>
                                            <Avatar
                                                sx={{
                                                    bgcolor: notification.read ? 'action.disabled' : 'secondary.main'
                                                }}
                                            >
                                                {getNotificationIcon(notification.type)}
                                            </Avatar>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="subtitle2">
                                                        {notification.title}
                                                    </Typography>
                                                    <Chip
                                                        label={notification.type}
                                                        size="small"
                                                        color={getNotificationColor(notification.type)}
                                                    />
                                                </Box>
                                            }
                                            secondary={
                                                <>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {notification.message}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {formatTimeAgo(notification.timestamp)}
                                                    </Typography>
                                                </>
                                            }
                                        />
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {!notification.read && (
                                                <Tooltip title="Mark as read">
                                                    <IconButton 
                                                        size="small"
                                                        onClick={() => handleMarkRead(notification.id)}
                                                    >
                                                        <CheckCircle fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <Tooltip title="Delete">
                                                <IconButton 
                                                    size="small"
                                                    onClick={() => handleDelete(notification.id)}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </ListItem>
                                </motion.div>
                            ))}
                    </AnimatePresence>
                </List>
            )}
        </Box>
    );
}

export default NotificationsPanel;