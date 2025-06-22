import React, { useState } from 'react';
import {
    Container,
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    Button,
    CircularProgress,
    Skeleton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    Avatar,
    alpha,
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Timeline as TimelineIcon,
    MarkChatRead as MarkChatReadIcon,
    ClearAll as ClearAllIcon,
    Mail as MailIcon,
    Assignment as AssignmentIcon,
    CheckCircle as CheckCircleIcon,
    Info as InfoIcon,
    Message as MessageIcon,
    Work as WorkIcon,
    Gavel as GavelIcon,
    Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';
import { format, formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

// --- Reusable Components ---

const notificationIcons = {
    message: <MessageIcon />,
    job: <WorkIcon />,
    contract: <GavelIcon />,
    default: <NotificationsIcon />,
};

const NotificationItem = ({ notification }) => (
    <ListItem
        sx={{
            backgroundColor: 'background.paper',
            mb: 1.5,
            borderRadius: 2,
            boxShadow: 1,
            transition: 'box-shadow 0.2s, background-color 0.2s',
            '&:hover': {
                boxShadow: 4,
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05),
            },
        }}
        secondaryAction={
            <Typography variant="caption" color="text.secondary" sx={{pr:1}}>
                {formatDistanceToNow(new Date(notification.date), { addSuffix: true })}
            </Typography>
        }
    >
        <ListItemIcon>
            <Avatar
                sx={{
                    bgcolor: notification.read ? 'action.disabled' : 'primary.main',
                    color: '#fff',
                }}
            >
                {notificationIcons[notification.type] || notificationIcons.default}
            </Avatar>
        </ListItemIcon>
        <ListItemText
            primary={notification.message}
            secondary={
                notification.link ? (
                    <Link to={notification.link} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <Typography variant="body2" color="primary.main" sx={{'&:hover': {textDecoration: 'underline'}}}>
                            View Details
                        </Typography>
                    </Link>
                ) : null
            }
        />
        {!notification.read && (
            <Chip label="New" color="success" size="small" sx={{ ml: 2, fontWeight: 'bold' }} />
        )}
    </ListItem>
);

const ActivityFeed = ({ notifications }) => (
    <List>
        {notifications.map(notification => (
            <NotificationItem key={notification.id} notification={notification} />
        ))}
    </List>
);

// --- Main Notifications Page ---

const NotificationsPage = () => {
    const { notifications, loading, unreadCount, markAllAsRead, clearAllNotifications } = useNotifications();
    const [filter, setFilter] = useState('all');

    const handleFilterChange = (event, newValue) => {
        setFilter(newValue);
    };

    const filteredNotifications = notifications
        .filter((n) => filter === 'all' || n.type === filter)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <NotificationsIcon sx={{ fontSize: 36, mr: 1.5, color: 'primary.main' }} />
                    <Typography variant="h4" fontWeight="bold">
                    Notifications
                </Typography>
                </Box>
                <Box>
                    <Button
                        variant="outlined"
                        onClick={markAllAsRead}
                        disabled={unreadCount === 0}
                        sx={{mr: 1}}
                    >
                        Mark All as Read
                    </Button>
                    <Button
                        onClick={clearAllNotifications}
                        color="error"
                        variant="outlined"
                        disabled={notifications.length === 0}
                    >
                        Clear All
                    </Button>
                </Box>
            </Box>

            <Paper elevation={0} sx={{ backgroundColor: 'transparent' }}>
                <Tabs
                    value={filter}
                    onChange={handleFilterChange}
                    indicatorColor="primary"
                    textColor="primary"
                    sx={{ mb: 3 }}
                >
                    <Tab label="All" value="all" />
                    <Tab label="Messages" value="message" />
                    <Tab label="Jobs" value="job" />
                    <Tab label="Contracts" value="contract" />
                </Tabs>

                {loading ? (
                    <Box sx={{ p: 2 }}>
                        {Array.from(new Array(4)).map((_, idx) => (
                            <Skeleton key={idx} variant="rectangular" height={72} sx={{ mb: 2, borderRadius: 2 }} />
                        ))}
                    </Box>
                ) : filteredNotifications.length > 0 ? (
                    <List sx={{p:0}}>
                        {filteredNotifications.map((notification) => (
                            <NotificationItem key={notification.id} notification={notification} />
                        ))}
                    </List>
                ) : (
                    <Box sx={{ textAlign: 'center', p: 5, bgcolor: 'background.paper', borderRadius: 2 }}>
                        <Typography variant="h6" color="text.secondary">
                            You're all caught up!
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default NotificationsPage; 



