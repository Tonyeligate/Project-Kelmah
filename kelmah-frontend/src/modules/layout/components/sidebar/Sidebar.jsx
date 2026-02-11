import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Avatar,
  Badge,
  Tooltip,
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useNotifications } from '../../../notifications/contexts/NotificationContext';
import { useMessages } from '../../../messaging/contexts/MessageContext';
import kelmahLogo from '../../../../assets/images/logo.png';

// --- ICONS ---
import DashboardIcon from '@mui/icons-material/Dashboard';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import WorkIcon from '@mui/icons-material/Work';
import PostAddIcon from '@mui/icons-material/PostAdd';
import PeopleIcon from '@mui/icons-material/People';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChatIcon from '@mui/icons-material/Chat';
import SettingsIcon from '@mui/icons-material/Settings';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
// ✅ MOBILE-AUDIT FIX: Removed unused imports (SearchIcon, ClearIcon) — search UI not rendered

// ✅ MOBILE-AUDIT FIX: React-based logo fallback (replaced innerHTML which bypasses React reconciliation)
const KelmahLogo = () => {
  const [logoError, setLogoError] = useState(false);

  return (
    <Box
      sx={{
        width: 64,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
      }}
    >
      {logoError ? (
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 'bold',
            color: '#1C2536',
          }}
        >
          K
        </Box>
      ) : (
        <Box
          component="img"
          src={kelmahLogo}
          alt="Kelmah"
          sx={{
            width: 48,
            height: 48,
            objectFit: 'contain',
          }}
          onError={() => setLogoError(true)}
        />
      )}
    </Box>
  );
};

const Sidebar = ({ variant = 'permanent', open = false, onClose }) => {
  const user = useSelector((state) => state.auth.user);
  const { unreadCount: unreadMessages } = useMessages();
  const { unreadCount: unreadNotifications } = useNotifications();
  const location = useLocation();

  // ✅ MOBILE-AUDIT FIX: Whether tooltips should show (disabled on temporary/mobile drawer)
  const showTooltips = variant === 'permanent';

  // Determine role for navigation
  const navRole =
    user?.role === 'hirer' ||
      user?.userType === 'hirer' ||
      user?.userRole === 'hirer'
      ? 'hirer'
      : user?.role === 'worker' ||
        user?.userType === 'worker' ||
        user?.userRole === 'worker'
        ? 'worker'
        : null;

  // LC Portal style menu items - role specific (mapped to actual routes)
  const menuItems = navRole === 'hirer'
    ? [
      { text: 'Post a Job', icon: <PostAddIcon />, path: '/hirer/jobs/post', tooltip: 'Create a new job posting' },
      { text: 'My Jobs', icon: <WorkIcon />, path: '/hirer/jobs', tooltip: 'Manage your job postings' },
      { text: 'Applications', icon: <AssignmentIcon />, path: '/hirer/applications', tooltip: 'Review worker applications' },
      { text: 'Find Talent', icon: <PeopleIcon />, path: '/hirer/find-talent', tooltip: 'Search for skilled workers' },
      { text: 'Tools', icon: <MiscellaneousServicesIcon />, path: '/hirer/tools', tooltip: 'Hirer tools and utilities' },
      { text: 'Support', icon: <SupportAgentIcon />, path: '/support', tooltip: 'Get help and support' },
    ]
    : [
      { text: 'Find Work', icon: <WorkIcon />, path: '/worker/find-work', tooltip: 'Search for available jobs' },
      { text: 'My Applications', icon: <AssignmentIcon />, path: '/worker/applications', tooltip: 'Track your job applications' },
      { text: 'Contracts', icon: <ReceiptIcon />, path: '/worker/contracts', tooltip: 'View your active contracts' },
      { text: 'Earnings', icon: <ReceiptLongIcon />, path: '/worker/earnings', tooltip: 'Track your earnings' },
      { text: 'Wallet', icon: <CheckCircleIcon />, path: '/worker/wallet', tooltip: 'Manage your wallet' },
      { text: 'Reviews', icon: <TrackChangesIcon />, path: '/worker/reviews', tooltip: 'See your reviews' },
      { text: 'Support', icon: <SupportAgentIcon />, path: '/support', tooltip: 'Get help and support' },
    ];

  // Common items at bottom
  const bottomItems = [
    {
      text: 'Notifications',
      icon: <NotificationsIcon />,
      path: '/notifications',
      badge: unreadNotifications,
      tooltip: 'View your notifications',
    },
    {
      text: 'Messages',
      icon: <ChatIcon />,
      path: '/messages',
      badge: unreadMessages,
      tooltip: 'View your messages',
    },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings', tooltip: 'Account settings' },
  ];

  const dashboardPath = navRole === 'hirer' ? '/hirer/dashboard' : '/worker/dashboard';
  const isDashboardActive = location.pathname === dashboardPath || location.pathname === '/dashboard';

  return (
    <Drawer
      variant={variant}
      open={variant === 'temporary' ? open : undefined}
      onClose={variant === 'temporary' ? onClose : undefined}
      ModalProps={{ keepMounted: true }}
      aria-label="Sidebar navigation"
      sx={{
        width: 260,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: 260,
          boxSizing: 'border-box',
          backgroundColor: (theme) => theme.palette.background.paper,
          color: (theme) => theme.palette.text.primary,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255, 215, 0, 0.2)',
        },
      }}
    >
      {/* Logo Section */}
      <Box sx={{ pt: 2, pb: 1 }}>
        <KelmahLogo />
      </Box>

      {/* User Profile Card - Dark Theme Style */}
      <Box
        sx={{
          mx: 2,
          mb: 2,
          p: 2,
          backgroundColor: 'rgba(255, 215, 0, 0.1)',
          borderRadius: 2,
          border: '1px solid rgba(255, 215, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: '#FFD700',
            color: (theme) => theme.palette.getContrastText('#FFD700'),
            fontWeight: 700,
          }}
        >
          {user?.firstName?.[0] || 'U'}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight={600} sx={{ color: 'text.primary' }}>
            Hi, {user?.firstName || 'User'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <FiberManualRecordIcon sx={{ fontSize: 10, color: 'success.main' }} />
            <Typography variant="caption" sx={{ color: 'success.main' }}>
              Online
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Dashboard Item - Highlighted Gold */}
      <Box sx={{ px: 2, mb: 1 }}>
        <ListItem
          button
          component={RouterLink}
          to={dashboardPath}
          sx={{
            backgroundColor: isDashboardActive ? 'rgba(255, 215, 0, 0.15)' : 'transparent',
            borderRadius: 1,
            py: 1.5,
            '&:hover': {
              backgroundColor: 'rgba(255, 215, 0, 0.1)',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <DashboardIcon sx={{ color: '#FFD700' }} />
          </ListItemIcon>
          <ListItemText
            primary="Dashboard"
            sx={{
              '& .MuiListItemText-primary': {
                color: '#FFD700',
                fontWeight: 600,
                letterSpacing: 'normal',
                wordSpacing: 'normal',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
              },
            }}
          />
        </ListItem>
      </Box>

      {/* MENU Section Header */}
      <Typography
        variant="caption"
        sx={{
          px: 3,
          py: 1,
          color: 'rgba(255, 215, 0, 0.7)',
          fontWeight: 600,
          letterSpacing: 1,
        }}
      >
        MENU
      </Typography>

      {/* Menu Items */}
      <List sx={{ px: 1, flexGrow: 1 }}>
        {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const menuItemElement = (
              <ListItem
                key={item.text}
                button
                component={RouterLink}
                to={item.path}
                aria-label={item.tooltip || item.text}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  py: 1.25,
                  backgroundColor: isActive ? 'rgba(255, 215, 0, 0.15)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 215, 0, 0.08)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.badge && item.badge > 0 ? (
                    <Badge color="error" badgeContent={item.badge} max={99}>
                      {React.cloneElement(item.icon, {
                        sx: { color: isActive ? '#FFD700' : '#9E9E9E' },
                      })}
                    </Badge>
                  ) : (
                    React.cloneElement(item.icon, {
                      sx: { color: isActive ? '#FFD700' : '#9E9E9E' },
                    })
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    '& .MuiListItemText-primary': {
                      color: isActive ? '#FFD700' : '#E0E0E0',
                      fontWeight: isActive ? 600 : 400,
                      fontSize: '0.9rem',
                      letterSpacing: 'normal',
                      wordSpacing: 'normal',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
                    },
                  }}
                />
              </ListItem>
            );

            // ✅ MOBILE-AUDIT FIX: Only wrap in Tooltip on permanent (desktop) sidebar
            return showTooltips && item.tooltip ? (
              <Tooltip
                key={item.text}
                title={item.tooltip}
                placement="right"
                arrow
              >
                {menuItemElement}
              </Tooltip>
            ) : (
              <React.Fragment key={item.text}>
                {menuItemElement}
              </React.Fragment>
            );
          })}
      </List>

      <Divider sx={{ mx: 2, borderColor: 'rgba(255, 215, 0, 0.2)' }} />

      {/* Bottom Items */}
      <List sx={{ px: 1, pb: 2 }}>
        {bottomItems.map((item) => {
          const isActive = location.pathname === item.path;
          const bottomItemElement = (
            <ListItem
              key={item.text}
              button
              component={RouterLink}
              to={item.path}
              aria-label={item.tooltip || item.text}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                py: 1.25,
                backgroundColor: isActive ? 'rgba(255, 215, 0, 0.15)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 215, 0, 0.08)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.badge && item.badge > 0 ? (
                  <Badge color="error" badgeContent={item.badge} max={99}>
                    {React.cloneElement(item.icon, {
                      sx: { color: isActive ? '#FFD700' : '#9E9E9E' },
                    })}
                  </Badge>
                ) : (
                  React.cloneElement(item.icon, {
                    sx: { color: isActive ? '#FFD700' : '#9E9E9E' },
                  })
                )}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  '& .MuiListItemText-primary': {
                    color: isActive ? '#FFD700' : '#E0E0E0',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.9rem',
                    letterSpacing: 'normal',
                    wordSpacing: 'normal',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
                  },
                }}
              />
            </ListItem>
          );

          // ✅ MOBILE-AUDIT FIX: Only wrap in Tooltip on permanent (desktop) sidebar
          return showTooltips && item.tooltip ? (
            <Tooltip
              key={item.text}
              title={item.tooltip}
              placement="right"
              arrow
            >
              {bottomItemElement}
            </Tooltip>
          ) : (
            <React.Fragment key={item.text}>
              {bottomItemElement}
            </React.Fragment>
          );
        })}
      </List>
    </Drawer>
  );
};

export default Sidebar;
