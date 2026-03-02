import React from 'react';
import {
  Menu,
  Box,
  Typography,
  MenuItem,
  ListItemText,
  Divider,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Message as MessageIcon,
} from '@mui/icons-material';
import { ActionButton, StyledBadge } from './HeaderStyles';
import { BRAND_COLORS } from '../../../../theme';

/**
 * NotificationBells — renders the message and notification icon buttons plus
 * the notifications dropdown menu.
 * Extracted from Header.jsx for maintainability.
 *
 * Props:
 *   unreadMessages        — number
 *   unreadNotifications   — number
 *   notifications         — array of notification objects (for the dropdown)
 *   onMessagesClick       — handler for messages bell click
 *   onNotificationsClick  — handler for notifications bell click (receives event)
 *   notificationsAnchor   — anchor element for the notifications menu
 *   onNotificationsClose  — close handler for the notifications menu
 *   onMarkAllRead         — mark-all-as-read handler
 *   onViewAll             — navigate to /notifications
 */
const NotificationBells = ({
  unreadMessages,
  unreadNotifications,
  notifications = [],
  onMessagesClick,
  onNotificationsClick,
  notificationsAnchor,
  onNotificationsClose,
  onMarkAllRead,
  onViewAll,
}) => {
  const theme = useTheme();

  return (
    <>
      {/* Messages */}
      <Tooltip title="Messages" arrow>
        <ActionButton onClick={onMessagesClick}>
          <StyledBadge badgeContent={unreadMessages} color="primary">
            <MessageIcon />
          </StyledBadge>
        </ActionButton>
      </Tooltip>

      {/* Notifications */}
      <Tooltip title="Notifications" arrow>
        <ActionButton onClick={onNotificationsClick}>
          <StyledBadge badgeContent={unreadNotifications} color="primary">
            <NotificationsIcon />
          </StyledBadge>
        </ActionButton>
      </Tooltip>

      {/* Notifications dropdown */}
      <Menu
        anchorEl={notificationsAnchor}
        open={Boolean(notificationsAnchor)}
        onClose={onNotificationsClose}
        PaperProps={{
          elevation: 12,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 4px 16px rgba(0,0,0,0.2))',
            mt: 1.5,
            borderRadius: 3,
            minWidth: 'min(320px, calc(100vw - 16px))',
            maxHeight: 400,
            border:
              theme.palette.mode === 'dark'
                ? `1px solid rgba(255, 215, 0, 0.3)`
                : `1px solid rgba(0, 0, 0, 0.2)`,
            backgroundColor:
              theme.palette.mode === 'dark'
                ? BRAND_COLORS.blackMedium
                : BRAND_COLORS.gold,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" fontWeight={700}>
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You have {unreadNotifications} unread notifications
          </Typography>
        </Box>

        {(notifications || []).slice(0, 5).map((n) => (
          <MenuItem
            key={n.id || n._id}
            onClick={() => {
              onNotificationsClose();
              onViewAll?.(n.actionUrl || '/notifications');
            }}
            sx={{ py: 1.5 }}
          >
            <ListItemText
              primary={n.title || n.message || 'Notification'}
              secondary={new Date(n.createdAt || n.date).toLocaleString()}
              primaryTypographyProps={{ fontWeight: 500 }}
              secondaryTypographyProps={{ fontSize: '0.75rem' }}
            />
          </MenuItem>
        ))}

        <Divider />

        <MenuItem
          onClick={() => {
            try { onMarkAllRead?.(); } catch (_) {}
            onNotificationsClose();
          }}
          sx={{ py: 1.2, justifyContent: 'center', color: 'text.secondary', fontWeight: 600 }}
        >
          Mark all as read
        </MenuItem>

        <MenuItem
          onClick={() => {
            onNotificationsClose();
            onViewAll?.('/notifications');
          }}
          sx={{ py: 1.5, justifyContent: 'center', color: 'primary.main', fontWeight: 600 }}
        >
          View All Notifications
        </MenuItem>
      </Menu>
    </>
  );
};

export default NotificationBells;
