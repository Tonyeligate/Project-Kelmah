import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Tooltip,
  Fade,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import NotificationCenter from './NotificationCenter';
import {
  selectUnreadCount,
  selectDoNotDisturb,
  selectSoundEnabled,
  selectConnectionStatus,
  setNotificationPanelOpen,
  selectNotificationPanelOpen,
} from '../../store/slices/notificationSlice';
import websocketService from '../../services/websocketService';

const NotificationTrigger = ({
  size = 'medium',
  showBadge = true,
  autoOpen = false,
  onNotificationClick = null,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  // Refs
  const buttonRef = useRef(null);
  const audioRef = useRef(null);

  // Redux state
  const unreadCount = useSelector(selectUnreadCount);
  const doNotDisturb = useSelector(selectDoNotDisturb);
  const soundEnabled = useSelector(selectSoundEnabled);
  const connectionStatus = useSelector(selectConnectionStatus);
  const notificationPanelOpen = useSelector(selectNotificationPanelOpen);

  // Local state
  const [anchorEl, setAnchorEl] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  // Animation trigger for new notifications
  useEffect(() => {
    if (unreadCount > 0) {
      setHasNewNotifications(true);
      setIsAnimating(true);

      // Play notification sound
      if (soundEnabled && !doNotDisturb && audioRef.current) {
        audioRef.current.play().catch(console.error);
      }

      // Reset animation after 2 seconds
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [unreadCount, soundEnabled, doNotDisturb]);

  // Auto-open functionality
  useEffect(() => {
    if (autoOpen && hasNewNotifications && !notificationPanelOpen) {
      handleOpen();
    }
  }, [autoOpen, hasNewNotifications, notificationPanelOpen]);

  // WebSocket connection status effects
  useEffect(() => {
    if (!connectionStatus.connected && connectionStatus.error) {
      enqueueSnackbar('Lost connection to notification service', {
        variant: 'warning',
        persist: false,
        autoHideDuration: 3000,
      });
    } else if (connectionStatus.connected) {
      enqueueSnackbar('Connected to real-time notifications', {
        variant: 'success',
        persist: false,
        autoHideDuration: 2000,
      });
    }
  }, [connectionStatus.connected, connectionStatus.error, enqueueSnackbar]);

  // Handle notification center open
  const handleOpen = (event) => {
    const target = event?.currentTarget || buttonRef.current;
    setAnchorEl(target);
    dispatch(setNotificationPanelOpen(true));
    setHasNewNotifications(false);

    if (onNotificationClick) {
      onNotificationClick();
    }
  };

  // Handle notification center close
  const handleClose = () => {
    setAnchorEl(null);
    dispatch(setNotificationPanelOpen(false));
  };

  // Get notification icon based on state
  const getNotificationIcon = () => {
    if (doNotDisturb) {
      return <NotificationsOffIcon />;
    }
    return <NotificationsIcon />;
  };

  // Get badge color based on priority of unread notifications
  const getBadgeColor = () => {
    if (unreadCount === 0) return 'default';
    if (hasNewNotifications) return 'error';
    return 'primary';
  };

  // Get connection status indicator color
  const getConnectionColor = () => {
    if (!connectionStatus.connected) return theme.palette.error.main;
    if (connectionStatus.reconnecting) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  return (
    <>
      <Tooltip
        title={
          doNotDisturb
            ? 'Notifications disabled'
            : unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'No new notifications'
        }
        placement="bottom"
      >
        <IconButton
          ref={buttonRef}
          size={size}
          onClick={handleOpen}
          sx={{
            position: 'relative',
            transition: 'all 0.3s ease-in-out',
            transform: isAnimating ? 'scale(1.1)' : 'scale(1)',
            animation: isAnimating ? 'pulse 1s infinite' : 'none',
            '@keyframes pulse': {
              '0%': {
                boxShadow: `0 0 0 0 ${alpha(theme.palette.primary.main, 0.7)}`,
              },
              '70%': {
                boxShadow: `0 0 0 10px ${alpha(theme.palette.primary.main, 0)}`,
              },
              '100%': {
                boxShadow: `0 0 0 0 ${alpha(theme.palette.primary.main, 0)}`,
              },
            },
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
            },
          }}
        >
          <Badge
            badgeContent={showBadge ? unreadCount : 0}
            color={getBadgeColor()}
            max={99}
            overlap="circular"
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            sx={{
              '& .MuiBadge-badge': {
                animation: hasNewNotifications
                  ? 'bounce 0.5s ease-in-out'
                  : 'none',
                '@keyframes bounce': {
                  '0%, 20%, 53%, 80%, 100%': {
                    transform: 'translate3d(0, 0, 0)',
                  },
                  '40%, 43%': {
                    transform: 'translate3d(0, -8px, 0)',
                  },
                  '70%': {
                    transform: 'translate3d(0, -4px, 0)',
                  },
                  '90%': {
                    transform: 'translate3d(0, -2px, 0)',
                  },
                },
              },
            }}
          >
            {getNotificationIcon()}
          </Badge>

          {/* Connection Status Indicator */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: getConnectionColor(),
              border: `2px solid ${theme.palette.background.paper}`,
              opacity: connectionStatus.connected ? 0.8 : 1,
              animation: connectionStatus.reconnecting
                ? 'blink 1s infinite'
                : 'none',
              '@keyframes blink': {
                '0%, 50%': { opacity: 0.3 },
                '51%, 100%': { opacity: 1 },
              },
            }}
          />
        </IconButton>
      </Tooltip>

      {/* Notification Center Popover */}
      <Popover
        open={Boolean(anchorEl)}
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
        PaperProps={{
          elevation: 8,
          sx: {
            overflow: 'hidden',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        TransitionComponent={Fade}
        transitionDuration={200}
      >
        <NotificationCenter
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorEl={anchorEl}
          maxHeight={600}
          maxWidth={400}
          showTabs={true}
        />
      </Popover>

      {/* Notification Sound */}
      <audio ref={audioRef} preload="auto" style={{ display: 'none' }}>
        <source src="/assets/sounds/notification.mp3" type="audio/mpeg" />
        <source src="/assets/sounds/notification.ogg" type="audio/ogg" />
        <source src="/assets/sounds/notification.wav" type="audio/wav" />
      </audio>
    </>
  );
};

export default NotificationTrigger;
