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
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Avatar,
  alpha,
  useTheme,
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
import { Pagination, FormControlLabel, Switch, Tooltip } from '@mui/material';
import { format, formatDistanceToNow } from 'date-fns';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useBreakpointDown } from '@/hooks/useResponsive';
import { HEADER_HEIGHT_MOBILE, Z_INDEX } from '@/constants/layout';
import { withSafeAreaTop } from '@/utils/safeArea';
import PageCanvas from '../../common/components/PageCanvas';
import {
  isSafeInternalPath,
  isSafeExternalUrl,
  openExternalUrl,
  NOTIFICATION_ALLOWED_HOSTS,
} from '../../../utils/externalNavigation';
import { devWarn } from '@/modules/common/utils/devLogger';

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

const ACTION_REQUIRED_TYPES = new Set([
  'contract_update',
  'payment_received',
  'system_alert',
]);

const NOTIFICATION_TYPE_CHIPS = {
  message_received: { label: 'Message', color: 'info' },
  job_application: { label: 'Job', color: 'primary' },
  job_offer: { label: 'Job Offer', color: 'primary' },
  contract_update: { label: 'Contract', color: 'warning' },
  payment_received: { label: 'Payment', color: 'success' },
  system_alert: { label: 'System', color: 'warning' },
  review_received: { label: 'Review', color: 'secondary' },
  default: { label: 'Update', color: 'default' },
};

const getNotificationTimestamp = (notification) => {
  const value = notification?.createdAt || notification?.date;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getNotificationPriority = (notification) =>
  ACTION_REQUIRED_TYPES.has(notification?.type) ? 0 : 1;

const PageNotificationItem = ({ notification, onMarkRead }) => {
  const navigate = useNavigate();
  const typeChip =
    NOTIFICATION_TYPE_CHIPS[notification.type] ||
    NOTIFICATION_TYPE_CHIPS.default;
  const requiresAction = ACTION_REQUIRED_TYPES.has(notification.type);

  const handleClick = async () => {
    // Mark as read on click
    if (!notification.read && onMarkRead) {
      await Promise.resolve(onMarkRead(notification.id || notification._id));
    }
    // Navigate to the linked page
    const nextLink =
      typeof notification.link === 'string' ? notification.link.trim() : '';
    if (!nextLink) {
      return;
    }

    if (isSafeInternalPath(nextLink)) {
      navigate(nextLink);
      return;
    }

    if (
      isSafeExternalUrl(nextLink, {
        allowedHosts: NOTIFICATION_ALLOWED_HOSTS,
        requireHttps: true,
      })
    ) {
      openExternalUrl(nextLink, {
        allowedHosts: NOTIFICATION_ALLOWED_HOSTS,
        requireHttps: true,
      });
      return;
    }

    devWarn('Blocked unsafe notification link:', nextLink);
  };

  return (
    <ListItem
      component={ListItemButton}
      onClick={handleClick}
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        mb: 1.5,
        alignItems: 'flex-start',
        flexWrap: { xs: 'wrap', sm: 'nowrap' },
        rowGap: 1,
        borderRadius: 2,
        borderLeft: notification.read
          ? 'none'
          : `4px solid ${theme.palette.secondary.main}`,
        border: `1px solid ${theme.palette.divider}`,
        transition: 'background-color 0.2s ease',
        cursor: notification.link ? 'pointer' : 'default',
        '&:hover': {
          backgroundColor: alpha(theme.palette.action.hover, 0.08),
        },
      })}
    >
      <ListItemIcon sx={{ minWidth: { xs: 44, sm: 56 }, mt: 0.25 }}>
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
        sx={{ minWidth: 0, flex: '1 1 0%' }}
        primary={notification.message}
        secondary={
          <Box sx={{ mt: 0.5 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 0.5,
                alignItems: { xs: 'flex-start', sm: 'center' },
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {(() => {
                  try {
                    return formatDistanceToNow(
                      new Date(
                        notification.createdAt ||
                          notification.date ||
                          new Date().toISOString(),
                      ),
                      { addSuffix: true },
                    );
                  } catch {
                    return '';
                  }
                })()}
              </Typography>
              {notification.link ? (
                <Typography
                  variant="body2"
                  color="primary.main"
                  sx={{ '&:hover': { textDecoration: 'underline' } }}
                >
                  View Details
                </Typography>
              ) : null}
            </Box>
            <Box
              sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.75 }}
            >
              <Chip
                label={typeChip.label}
                size="small"
                color={typeChip.color}
                variant="outlined"
              />
              {requiresAction && (
                <Chip
                  label="Action required"
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        }
      />
      {notification.read ? (
        <Chip
          label="Read"
          variant="outlined"
          size="small"
          sx={{ ml: { xs: 0, sm: 2 }, color: 'text.secondary' }}
        />
      ) : (
        <Chip
          label="New"
          color="success"
          size="small"
          sx={{ ml: { xs: 0, sm: 2 }, fontWeight: 'bold' }}
        />
      )}
    </ListItem>
  );
};

// --- Main Notifications Page ---

// Tab filter -> backend type mapping for grouped tabs
const TAB_TYPE_MAP = {
  all: undefined,
  messages: 'message_received',
  jobs: 'job_application', // also covers job_offer
  contracts: 'contract_update',
  payments: 'payment_received',
  system: 'system_alert', // also covers review_received
};

// Types that belong to each tab group (for client-side filtering)
const TAB_TYPE_GROUPS = {
  all: null, // show everything
  messages: ['message_received'],
  jobs: ['job_application', 'job_offer'],
  contracts: ['contract_update'],
  payments: ['payment_received'],
  system: ['system_alert', 'review_received'],
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
  const isMobile = useBreakpointDown('sm');
  const mobileStickyTop = `calc(${withSafeAreaTop(HEADER_HEIGHT_MOBILE)} + var(--kelmah-network-banner-offset, 0px))`;
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
    .sort((a, b) => {
      const priorityDelta =
        getNotificationPriority(a) - getNotificationPriority(b);
      if (priorityDelta !== 0) {
        return priorityDelta;
      }
      return getNotificationTimestamp(b) - getNotificationTimestamp(a);
    });

  return (
    <PageCanvas
      disableContainer
      sx={{ pt: { xs: 1, md: 4 }, pb: { xs: 10, md: 6 }, overflowX: 'clip' }}
    >
      <Container
        maxWidth="md"
        sx={{
          py: { xs: 0, md: 0 },
          px: { xs: 0.75, sm: 2 },
          pb: { xs: 'calc(72px + env(safe-area-inset-bottom, 0px))', md: 0 },
          width: '100%',
          minWidth: 0,
        }}
      >
        <Helmet>
          <title>Notifications | Kelmah</title>
        </Helmet>
        {/* Header - stacks vertically on mobile */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 1.5, sm: 0 },
            mb: { xs: 1.5, md: 4 },
            position: { xs: 'sticky', sm: 'static' },
            top: { xs: mobileStickyTop, sm: 'auto' },
            zIndex: { xs: Z_INDEX.sticky, sm: 'auto' },
            py: { xs: 0.5, sm: 0 },
            backgroundColor: { xs: 'background.default', sm: 'transparent' },
            minWidth: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
            <NotificationsIcon
              sx={{
                fontSize: { xs: 28, md: 36 },
                mr: 1,
                color: 'secondary.main',
              }}
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
                component={RouterLink}
                to="/notifications/settings"
                sx={{ minHeight: 44 }}
              >
                Settings
              </Button>
              <IconButton
                onClick={(e) => setActionsAnchor(e.currentTarget)}
                aria-label="More actions"
                sx={{
                  minWidth: 44,
                  minHeight: 44,
                  '&:focus-visible': {
                    outline: '3px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: '2px',
                  },
                }}
              >
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={actionsAnchor}
                open={Boolean(actionsAnchor)}
                onClose={() => setActionsAnchor(null)}
              >
                <MenuItem
                  onClick={() => {
                    markAllAsRead();
                    setActionsAnchor(null);
                  }}
                  disabled={unreadCount === 0}
                >
                  <MarkChatReadIcon sx={{ mr: 1 }} fontSize="small" />
                  Mark all as read
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    clearAllNotifications();
                    setActionsAnchor(null);
                  }}
                  disabled={notifications.length === 0}
                  sx={{ color: 'error.main' }}
                >
                  <ClearAllIcon sx={{ mr: 1 }} fontSize="small" />
                  Clear all
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                component={RouterLink}
                to="/notifications/settings"
              >
                Settings
              </Button>
              <Button
                variant="outlined"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                Mark all as read
              </Button>
              <Button
                onClick={clearAllNotifications}
                color="error"
                variant="outlined"
                disabled={notifications.length === 0}
              >
                Clear all
              </Button>
            </Box>
          )}
        </Box>

        {/* Summary line for notification counts */}
        <Box
          sx={{
            mb: 2,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Showing {filteredNotifications.length} notifications on this page
            out of {notifications.length} total
          </Typography>
          <Tooltip title="Show only unread notifications">
            <FormControlLabel
              control={
                <Switch
                  checked={unreadOnly}
                  onChange={handleToggleUnread}
                  inputProps={{
                    'aria-label': 'Show unread notifications only',
                  }}
                />
              }
              label="Unread only"
              sx={{
                mr: 0,
                '& .MuiFormControlLabel-label': {
                  fontSize: { xs: '0.85rem', sm: '0.875rem' },
                },
              }}
            />
          </Tooltip>
        </Box>

        <Paper
          elevation={0}
          sx={(theme) => ({
            p: { xs: 1.25, md: 2 },
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
            sx={{
              mb: 1.5,
              '& .MuiTab-root': {
                minHeight: { xs: 38, sm: 48 },
                px: { xs: 1, sm: 2 },
                py: { xs: 0.5, sm: 1.25 },
              },
            }}
          >
            <Tab label="All" value="all" />
            <Tab label="Messages" value="messages" />
            <Tab label="Jobs" value="jobs" />
            <Tab label="Contracts" value="contracts" />
            <Tab label="Payments" value="payments" />
            <Tab label="System" value="system" />
          </Tabs>

          {loading ? (
            <Box sx={{ p: 2 }}>
              {Array.from(new Array(4)).map((_, idx) => (
                <Skeleton
                  key={`notifications-skeleton-${idx}`}
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
                No new notifications right now
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                New messages, job updates, and payment alerts will appear here.
              </Typography>
            </Box>
          )}
        </Paper>

        <Paper
          elevation={8}
          sx={(theme) => ({
            display: { xs: 'flex', sm: 'none' },
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: theme.zIndex.appBar + 2,
            px: 1,
            py: 1,
            gap: 1,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          })}
        >
          <Button
            fullWidth
            variant="outlined"
            color="secondary"
            sx={{ minHeight: 42 }}
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark Read
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="secondary"
            sx={{ minHeight: 42, boxShadow: '0 2px 8px rgba(255,215,0,0.35)' }}
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
          >
            Clear All
          </Button>
        </Paper>
      </Container>
    </PageCanvas>
  );
};

export default NotificationsPage;
