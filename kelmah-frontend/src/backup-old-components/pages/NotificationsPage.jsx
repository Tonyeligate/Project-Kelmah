import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import NotificationCenter from '../components/common/NotificationCenter';
import {
  selectUnreadCount,
  selectNotificationSettings,
  selectConnectionStatus,
  selectNotifications,
  updateNotificationSettings,
  markAllNotificationsAsRead,
  clearNotifications,
} from '../store/slices/notificationSlice';
import { formatDate } from '../utils/formatters';
import SEO from '../modules/common/components/common/SEO';

const NotificationsPage = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  // Redux state
  const unreadCount = useSelector(selectUnreadCount);
  const notificationSettings = useSelector(selectNotificationSettings);
  const connectionStatus = useSelector(selectConnectionStatus);
  const notifications = useSelector(selectNotifications);

  // Local state
  const [activeTab, setActiveTab] = useState('all');
  const [showSettings, setShowSettings] = useState(false);

  // Statistics
  const stats = {
    total: notifications.length,
    unread: unreadCount,
    today: notifications.filter((n) => {
      const today = new Date().toDateString();
      return new Date(n.timestamp).toDateString() === today;
    }).length,
    thisWeek: notifications.filter((n) => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(n.timestamp) > weekAgo;
    }).length,
  };

  // Handle settings update
  const handleSettingsUpdate = (setting, value) => {
    dispatch(updateNotificationSettings({ [setting]: value }));
    enqueueSnackbar('Settings updated successfully', { variant: 'success' });
  };

  // Handle bulk actions
  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
    enqueueSnackbar('All notifications marked as read', { variant: 'success' });
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        'Are you sure you want to clear all notifications? This action cannot be undone.',
      )
    ) {
      dispatch(clearNotifications());
      enqueueSnackbar('All notifications cleared', { variant: 'success' });
    }
  };

  // Render connection status
  const renderConnectionStatus = () => {
    let severity = 'success';
    let message = 'Connected to real-time notifications';
    let icon = <CheckIcon />;

    if (!connectionStatus.connected) {
      severity = 'error';
      message = 'Disconnected from real-time service';
      icon = <ErrorIcon />;
    } else if (connectionStatus.reconnecting) {
      severity = 'warning';
      message = 'Reconnecting to real-time service...';
      icon = <WarningIcon />;
    }

    return (
      <Alert severity={severity} icon={icon} sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2">{message}</Typography>
          {connectionStatus.lastConnected && (
            <Typography variant="caption" color="text.secondary">
              Last connected: {formatDate(connectionStatus.lastConnected)}
            </Typography>
          )}
        </Box>
      </Alert>
    );
  };

  // Render statistics cards
  const renderStatistics = () => (
    <Grid container spacing={3} mb={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h4" color="primary.main" fontWeight="bold">
              {stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Notifications
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h4" color="error.main" fontWeight="bold">
              {stats.unread}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Unread
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h4" color="info.main" fontWeight="bold">
              {stats.today}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Today
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h4" color="success.main" fontWeight="bold">
              {stats.thisWeek}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This Week
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Render notification settings
  const renderSettings = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography
        variant="h6"
        gutterBottom
        display="flex"
        alignItems="center"
        gap={1}
      >
        <SettingsIcon />
        Notification Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
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
          <br />

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
          <br />

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
          <br />

          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.sms}
                onChange={(e) => handleSettingsUpdate('sms', e.target.checked)}
              />
            }
            label="SMS notifications (Ghana)"
          />
        </Grid>

        <Grid item xs={12} md={6}>
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

          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Receive updates about new features, promotions, and platform
              improvements.
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <>
      <SEO
        title="Notifications | Kelmah"
        description="Manage your real-time notifications and stay updated with jobs, messages, and payments"
      />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Page Header */}
        <Box mb={4}>
          <Typography
            variant="h4"
            gutterBottom
            display="flex"
            alignItems="center"
            gap={2}
          >
            <NotificationsIcon color="primary" />
            Notifications
            {unreadCount > 0 && (
              <Chip label={`${unreadCount} unread`} color="error" />
            )}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Stay updated with real-time notifications about jobs, messages, and
            payments
          </Typography>
        </Box>

        {/* Connection Status */}
        {renderConnectionStatus()}

        {/* Statistics */}
        {renderStatistics()}

        {/* Quick Actions */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Quick Actions</Typography>

            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                onClick={() => setShowSettings(!showSettings)}
                startIcon={<SettingsIcon />}
              >
                {showSettings ? 'Hide' : 'Show'} Settings
              </Button>

              {unreadCount > 0 && (
                <Button
                  variant="contained"
                  onClick={handleMarkAllAsRead}
                  startIcon={<CheckIcon />}
                >
                  Mark All Read
                </Button>
              )}

              {notifications.length > 0 && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleClearAll}
                >
                  Clear All
                </Button>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Settings Panel */}
        {showSettings && renderSettings()}

        {/* Main Notification Center */}
        <Paper sx={{ overflow: 'hidden' }}>
          <NotificationCenter
            showTabs={true}
            showHeader={false}
            maxHeight={800}
            maxWidth="100%"
            defaultTab="all"
          />
        </Paper>

        {/* Help Section */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            About Notifications
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Notification Types
              </Typography>
              <Box mb={2}>
                <Chip
                  label="Messages"
                  color="info"
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
                <Typography variant="body2" display="inline">
                  Chat messages and communication updates
                </Typography>
              </Box>
              <Box mb={2}>
                <Chip
                  label="Jobs"
                  color="success"
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
                <Typography variant="body2" display="inline">
                  New job opportunities and application updates
                </Typography>
              </Box>
              <Box mb={2}>
                <Chip
                  label="Payments"
                  color="warning"
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
                <Typography variant="body2" display="inline">
                  Payment confirmations and transaction updates
                </Typography>
              </Box>
              <Box>
                <Chip
                  label="System"
                  color="secondary"
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
                <Typography variant="body2" display="inline">
                  Platform updates and system announcements
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Delivery Methods
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Desktop:</strong> Browser notifications when the app is
                open
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Email:</strong> Important updates sent to your
                registered email
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>SMS:</strong> Critical alerts sent to your Ghana phone
                number
              </Typography>
              <Typography variant="body2">
                <strong>In-App:</strong> Real-time notifications within the
                platform
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </>
  );
};

export default NotificationsPage;
