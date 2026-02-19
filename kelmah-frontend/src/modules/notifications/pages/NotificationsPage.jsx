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
  useTheme,
  useMediaQuery,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon as MenuListItemIcon,
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
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';
import { Pagination, FormControlLabel, Switch } from '@mui/material';
import { format, formatDistanceToNow } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';

// --- Reusable Components ---

const notificationIcons = {
  message_received: <MessageIcon />,
  job_application: <WorkIcon />,
  job_offer: <WorkIcon />,
  contract_update: <GavelIcon />,
  payment_received: <NotificationsIcon />,
  system_alert: <InfoIcon />,
  review_received: <CheckCircleIcon />,
  default: <NotificationsIcon />,
};

const isExternalLink = (value) =>
  typeof value === 'string' && /^https?:\/\//i.test(value);

const PageNotificationItem = ({ notification, onMarkRead }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Mark as read on click
    if (!notification.read && onMarkRead) {
      onMarkRead(notification.id || notification._id);
    }
    // Navigate to the linked page
    if (notification.link) {
      if (isExternalLink(notification.link)) {
        window.open(notification.link, '_blank', 'noopener,noreferrer');
      } else {
        navigate(notification.link);
      }
    }
  };

  return (
    <ListItem
      onClick={handleClick}
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        mb: 1.5,
        borderRadius: 2,
        borderLeft: notification.read ? 'none' : `4px solid ${theme.palette.secondary.main}`,
        border: `1px solid ${theme.palette.divider}`,
        transition: 'background-color 0.2s ease',
        cursor: notification.link ? 'pointer' : 'default',
        '&:hover': {
          backgroundColor: alpha(theme.palette.action.hover, 0.08),
        },
      })}
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
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 0.5, mt: 0.5, alignItems: { xs: 'flex-start', sm: 'center' } }}>
          <Typography variant="caption" color="text.secondary">
            {formatDistanceToNow(
              new Date(
                notification.createdAt ||
                  notification.date ||
                  new Date().toISOString(),
              ),
              { addSuffix: true },
            )}
          </Typography>
          {notification.link ? (
            isExternalLink(notification.link) ? (
              <Typography
                component="a"
                href={notification.link}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                color="primary.main"
                sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                View Details
              </Typography>
            ) : (
              <Link
                to={notification.link}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Typography
                  variant="body2"
                  color="primary.main"
                  sx={{ '&:hover': { textDecoration: 'underline' } }}
                >
                  View Details
                </Typography>
              </Link>
            )
          ) : null}
        </Box>
      }
    />
    {!notification.read && (
      <Chip
        label="New"
        color="success"
        size="small"
        sx={{ ml: 2, fontWeight: 'bold' }}
      />
    )}
  </ListItem>
  );
};

const ActivityFeed = ({ notifications }) => (
  <List>
    {notifications.map((notification, index) => (
      <PageNotificationItem
        key={notification.id || notification._id || `notif-${index}`}
        notification={notification}
      />
    ))}
  </List>
);

// --- Main Notifications Page ---

// Tab filter → backend type mapping for grouped tabs
const TAB_TYPE_MAP = {
  all: undefined,
  messages: 'message_received',
  jobs: 'job_application', // also covers job_offer
  contracts: 'contract_update',
};

// Types that belong to each tab group (for client-side filtering)
const TAB_TYPE_GROUPS = {
  all: null, // show everything
  messages: ['message_received'],
  jobs: ['job_application', 'job_offer'],
  contracts: ['contract_update'],
};

const NotificationsPage = () => {
  const {
    notifications,
    loading,
    unreadCount,
    pagination,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    refresh,
  } = useNotifications();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [filter, setFilter] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [actionsAnchor, setActionsAnchor] = useState(null);

  const handleFilterChange = (event, newValue) => {
    setFilter(newValue);
    refresh({
      page: 1,
      limit: pagination.limit,
      type: TAB_TYPE_MAP[newValue],
      unreadOnly,
    });
  };

  const handleToggleUnread = (event) => {
    const next = event.target.checked;
    setUnreadOnly(next);
    refresh({
      page: 1,
      limit: pagination.limit,
      unreadOnly: next,
      type: TAB_TYPE_MAP[filter],
    });
  };

  const handlePageChange = (_e, page) => {
    refresh({
      page,
      limit: pagination.limit,
      unreadOnly,
      type: TAB_TYPE_MAP[filter],
    });
  };

  const filteredNotifications = notifications
    .filter((n) => {
      const group = TAB_TYPE_GROUPS[filter];
      if (!group) return true; // 'all' tab
      return group.includes(n.type);
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date),
    );

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 }, pb: { xs: 'calc(72px + env(safe-area-inset-bottom, 0px))', md: 4 } }}>
      {/* Header — stacks vertically on mobile */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: { xs: 1.5, sm: 0 },
          mb: { xs: 2, md: 4 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <NotificationsIcon
            sx={{ fontSize: { xs: 28, md: 36 }, mr: 1, color: 'secondary.main' }}
          />
          <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="bold">
            Notifications
          </Typography>
        </Box>
        {/* Mobile: overflow menu for actions */}
        {isMobile ? (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<SettingsIcon />}
              component={Link}
              to="/notifications/settings"
              sx={{ minHeight: 44 }}
            >
              Settings
            </Button>
            <IconButton
              onClick={(e) => setActionsAnchor(e.currentTarget)}
              aria-label="More actions"
              sx={{ minWidth: 44, minHeight: 44 }}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={actionsAnchor}
              open={Boolean(actionsAnchor)}
              onClose={() => setActionsAnchor(null)}
            >
              <MenuItem
                onClick={() => { markAllAsRead(); setActionsAnchor(null); }}
                disabled={unreadCount === 0}
              >
                <MarkChatReadIcon sx={{ mr: 1 }} fontSize="small" />
                Mark All as Read
              </MenuItem>
              <MenuItem
                onClick={() => { clearAllNotifications(); setActionsAnchor(null); }}
                disabled={notifications.length === 0}
                sx={{ color: 'error.main' }}
              >
                <ClearAllIcon sx={{ mr: 1 }} fontSize="small" />
                Clear All
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              component={Link}
              to="/notifications/settings"
            >
              Settings
            </Button>
            <Button
              variant="outlined"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
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
        )}
      </Box>

      {/* Summary line for notification counts */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Showing {filteredNotifications.length} of {notifications.length}{' '}
          notifications
        </Typography>
        <FormControlLabel
          control={
            <Switch checked={unreadOnly} onChange={handleToggleUnread} />
          }
          label="Unread only"
        />
      </Box>

      <Paper
        elevation={0}
        sx={(theme) => ({
          p: { xs: 1.5, md: 2 },
          backgroundColor: alpha(theme.palette.primary.main, 0.06),
          borderRadius: theme.spacing(2),
          border: `1px solid ${theme.palette.divider}`,
        })}
      >
        <Tabs
          value={filter}
          onChange={handleFilterChange}
          indicatorColor="secondary"
          textColor="secondary"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ mb: 2 }}
        >
          <Tab label="All" value="all" />
          <Tab label="Messages" value="messages" />
          <Tab label="Jobs" value="jobs" />
          <Tab label="Contracts" value="contracts" />
        </Tabs>

        {loading ? (
          <Box sx={{ p: 2 }}>
            {Array.from(new Array(4)).map((_, idx) => (
              <Skeleton
                key={idx}
                variant="rectangular"
                height={72}
                sx={{ mb: 2, borderRadius: 2 }}
              />
            ))}
          </Box>
        ) : filteredNotifications.length > 0 ? (
          <List sx={{ p: 0 }}>
            {filteredNotifications.map((notification, index) => (
              <PageNotificationItem
                key={notification.id || notification._id || `notif-${index}`}
                notification={notification}
                onMarkRead={markAsRead}
              />
            ))}
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <Pagination
                count={pagination.pages || 1}
                page={pagination.page || 1}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          </List>
        ) : (
          <Box
            sx={{
              textAlign: 'center',
              p: 5,
              bgcolor: 'background.paper',
              borderRadius: 2,
            }}
          >
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
