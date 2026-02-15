import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Avatar,
  Badge,
  Button,
  Divider,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  Tooltip,
  Chip,
  Alert,
  CircularProgress,
  Fade,
  Collapse,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Message as MessageIcon,
  Work as JobIcon,
  Payment as PaymentIcon,
  System as SystemIcon,
  Settings as SettingsIcon,
  Clear as ClearIcon,
  MoreVert as MoreIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Circle as UnreadIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Star as StarIcon,
  TrendingUp as TrendingIcon,
  Refresh as RefreshIcon,
  VolumeOff as SilentIcon,
  VolumeUp as SoundIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
  selectNotifications,
  selectUnreadCount,
  selectNotificationSettings,
  selectDoNotDisturb,
  selectSoundEnabled,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
  clearNotifications,
  updateNotificationSettings,
  toggleDoNotDisturb,
  toggleSound,
  selectNotificationsByType,
  selectUnreadNotifications,
} from '../../store/slices/notificationSlice';
import { formatRelativeTime, formatDate } from '../../utils/formatters';
import websocketService from '../../services/websocketService';

const NotificationCenter = ({
  open = false,
  onClose = null,
  anchorEl = null,
  maxHeight = 600,
  maxWidth = 400,
  showTabs = true,
  defaultTab = 'all',
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  // Redux state
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const notificationSettings = useSelector(selectNotificationSettings);
  const doNotDisturb = useSelector(selectDoNotDisturb);
  const soundEnabled = useSelector(selectSoundEnabled);
  const unreadNotifications = useSelector(selectUnreadNotifications);

  // Local state
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Notification types and their configurations
  const notificationTypes = {
    all: { label: 'All', icon: <NotificationsIcon />, color: 'primary' },
    message: { label: 'Messages', icon: <MessageIcon />, color: 'info' },
    job: { label: 'Jobs', icon: <JobIcon />, color: 'success' },
    payment: { label: 'Payments', icon: <PaymentIcon />, color: 'warning' },
    system: { label: 'System', icon: <SystemIcon />, color: 'secondary' },
  };

  // Filter notifications by type
  const getFilteredNotifications = () => {
    if (activeTab === 'all') return notifications;
    return notifications.filter((n) => n.type === activeTab);
  };

  // Get notification icon based on type and severity
  const getNotificationIcon = (notification) => {
    const typeConfig = notificationTypes[notification.type];

    if (notification.severity === 'error') {
      return <ErrorIcon color="error" />;
    } else if (notification.severity === 'warning') {
      return <WarningIcon color="warning" />;
    } else if (notification.severity === 'success') {
      return <CheckIcon color="success" />;
    } else if (typeConfig) {
      return React.cloneElement(typeConfig.icon, { color: typeConfig.color });
    }

    return <InfoIcon color="info" />;
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.read) {
      dispatch(markNotificationAsRead(notification.id));
    }

    // Navigate based on notification type and metadata
    if (
      notification.type === 'message' &&
      notification.metadata?.conversationId
    ) {
      navigate(`/messages/${notification.metadata.conversationId}`);
    } else if (notification.type === 'job' && notification.metadata?.jobId) {
      navigate(`/jobs/${notification.metadata.jobId}`);
    } else if (
      notification.type === 'payment' &&
      notification.metadata?.transactionId
    ) {
      navigate(`/payments/${notification.metadata.transactionId}`);
    }

    // Close notification center
    if (onClose) {
      onClose();
    }
  };

  // Handle notification actions
  const handleNotificationAction = (notification, action) => {
    switch (action) {
      case 'mark-read':
        dispatch(markNotificationAsRead(notification.id));
        break;
      case 'remove':
        dispatch(removeNotification(notification.id));
        break;
      case 'snooze':
        // TODO: Implement snooze functionality
        enqueueSnackbar('Notification snoozed for 1 hour', { variant: 'info' });
        break;
      default:
        break;
    }
    setContextMenu(null);
  };

  // Handle bulk actions
  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
    enqueueSnackbar('All notifications marked as read', { variant: 'success' });
  };

  const handleClearAll = () => {
    dispatch(clearNotifications());
    enqueueSnackbar('All notifications cleared', { variant: 'success' });
  };

  // Handle settings update
  const handleSettingsUpdate = (setting, value) => {
    dispatch(updateNotificationSettings({ [setting]: value }));
    enqueueSnackbar('Notification settings updated', { variant: 'success' });
  };

  // Get notification priority color
  const getPriorityColor = (notification) => {
    if (notification.severity === 'error') return theme.palette.error.main;
    if (notification.severity === 'warning') return theme.palette.warning.main;
    if (notification.severity === 'success') return theme.palette.success.main;
    return theme.palette.info.main;
  };

  // Render notification item
  const renderNotificationItem = (notification, index) => {
    const isUnread = !notification.read;
    const priorityColor = getPriorityColor(notification);

    return (
      <React.Fragment key={notification.id}>
        <ListItem
          button
          onClick={() => handleNotificationClick(notification)}
          onContextMenu={(e) => {
            e.preventDefault();
            setSelectedNotification(notification);
            setContextMenu(e.currentTarget);
          }}
          sx={{
            backgroundColor: isUnread
              ? alpha(priorityColor, 0.05)
              : 'transparent',
            borderLeft: isUnread
              ? `4px solid ${priorityColor}`
              : '4px solid transparent',
            '&:hover': {
              backgroundColor: alpha(priorityColor, 0.08),
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <ListItemAvatar>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              badgeContent={
                isUnread ? (
                  <UnreadIcon sx={{ fontSize: 12, color: priorityColor }} />
                ) : null
              }
            >
              <Avatar
                sx={{
                  bgcolor: alpha(priorityColor, 0.1),
                  color: priorityColor,
                  width: 40,
                  height: 40,
                }}
              >
                {getNotificationIcon(notification)}
              </Avatar>
            </Badge>
          </ListItemAvatar>

          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1}>
                <Typography
                  variant="body2"
                  fontWeight={isUnread ? 'bold' : 'normal'}
                  noWrap
                >
                  {notification.title}
                </Typography>
                {notification.priority === 'high' && (
                  <Chip label="High" size="small" color="error" />
                )}
                {notification.priority === 'urgent' && (
                  <Chip
                    label="Urgent"
                    size="small"
                    color="error"
                    variant="filled"
                  />
                )}
              </Box>
            }
            secondary={
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    mb: 0.5,
                  }}
                >
                  {notification.message}
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <ScheduleIcon
                    sx={{ fontSize: 14, color: 'text.secondary' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {formatRelativeTime(notification.timestamp)}
                  </Typography>
                  {notification.metadata?.source && (
                    <Chip
                      label={notification.metadata.source}
                      size="small"
                      variant="outlined"
                      sx={{ height: 16, fontSize: '0.65rem' }}
                    />
                  )}
                </Box>
              </Box>
            }
          />

          <ListItemSecondaryAction>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNotification(notification);
                setContextMenu(e.currentTarget);
              }}
            >
              <MoreIcon fontSize="small" />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>

        {index < getFilteredNotifications().length - 1 && <Divider />}
      </React.Fragment>
    );
  };

  // Render notification tabs
  const renderTabs = () => {
    if (!showTabs) return null;

    return (
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 48 }}
        >
          {Object.entries(notificationTypes).map(([type, config]) => {
            const count =
              type === 'all'
                ? notifications.length
                : notifications.filter((n) => n.type === type).length;

            return (
              <Tab
                key={type}
                value={type}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    {config.icon}
                    {config.label}
                    {count > 0 && (
                      <Chip
                        label={count}
                        size="small"
                        color={config.color}
                        sx={{ height: 16, fontSize: '0.65rem' }}
                      />
                    )}
                  </Box>
                }
                sx={{ minHeight: 48, textTransform: 'none' }}
              />
            );
          })}
        </Tabs>
      </Box>
    );
  };

  // Render header
  const renderHeader = () => (
    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center" gap={1}>
          <NotificationsIcon color="primary" />
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Badge badgeContent={unreadCount} color="error" />
          )}
        </Box>

        <Box display="flex" gap={1}>
          <Tooltip
            title={doNotDisturb ? 'Enable notifications' : 'Do not disturb'}
          >
            <IconButton
              size="small"
              onClick={() => dispatch(toggleDoNotDisturb())}
            >
              {doNotDisturb ? <NotificationsOffIcon /> : <NotificationsIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}>
            <IconButton size="small" onClick={() => dispatch(toggleSound())}>
              {soundEnabled ? <SoundIcon /> : <SilentIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Settings">
            <IconButton size="small" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>

          {onClose && (
            <Tooltip title="Close">
              <IconButton size="small" onClick={onClose}>
                <ClearIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Quick Actions */}
      {notifications.length > 0 && (
        <Box display="flex" gap={1} mt={2}>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<CheckIcon />}
              onClick={handleMarkAllAsRead}
            >
              Mark all read
            </Button>
          )}
          <Button
            size="small"
            startIcon={<ClearIcon />}
            onClick={handleClearAll}
            color="error"
          >
            Clear all
          </Button>
        </Box>
      )}
    </Box>
  );

  // Render empty state
  const renderEmptyState = () => (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={6}
      px={3}
    >
      <NotificationsIcon
        sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
      />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        No notifications
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center">
        You're all caught up! New notifications will appear here.
      </Typography>
    </Box>
  );

  const filteredNotifications = getFilteredNotifications();

  return (
    <>
      <Paper
        sx={{
          width: maxWidth,
          maxHeight,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {renderHeader()}
        {renderTabs()}

        {/* Notifications List */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : filteredNotifications.length === 0 ? (
            renderEmptyState()
          ) : (
            <List sx={{ py: 0 }}>
              {filteredNotifications.map((notification, index) =>
                renderNotificationItem(notification, index),
              )}
            </List>
          )}
        </Box>
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={contextMenu}
        open={Boolean(contextMenu)}
        onClose={() => setContextMenu(null)}
      >
        {selectedNotification && !selectedNotification.read && (
          <MenuItem
            onClick={() =>
              handleNotificationAction(selectedNotification, 'mark-read')
            }
          >
            <CheckIcon sx={{ mr: 1 }} />
            Mark as read
          </MenuItem>
        )}
        <MenuItem
          onClick={() =>
            handleNotificationAction(selectedNotification, 'snooze')
          }
        >
          <ScheduleIcon sx={{ mr: 1 }} />
          Snooze for 1 hour
        </MenuItem>
        <MenuItem
          onClick={() =>
            handleNotificationAction(selectedNotification, 'remove')
          }
        >
          <ClearIcon sx={{ mr: 1 }} />
          Remove
        </MenuItem>
      </Menu>

      {/* Settings Dialog */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Notification Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Notification Types
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.desktop}
                  onChange={(e) =>
                    handleSettingsUpdate('desktop', e.target.checked)
                  }
                />
              }
              label="Desktop notifications"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.sound}
                  onChange={(e) =>
                    handleSettingsUpdate('sound', e.target.checked)
                  }
                />
              }
              label="Sound notifications"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.email}
                  onChange={(e) =>
                    handleSettingsUpdate('email', e.target.checked)
                  }
                />
              }
              label="Email notifications"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.sms}
                  onChange={(e) =>
                    handleSettingsUpdate('sms', e.target.checked)
                  }
                />
              }
              label="SMS notifications"
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Marketing & Updates
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.marketing}
                  onChange={(e) =>
                    handleSettingsUpdate('marketing', e.target.checked)
                  }
                />
              }
              label="Marketing communications"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotificationCenter;
