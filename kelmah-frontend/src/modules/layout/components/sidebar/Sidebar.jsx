import React from 'react';
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
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useNotifications } from '../../../notifications/contexts/NotificationContext';
import { useMessages } from '../../../messaging/contexts/MessageContext';

// --- ICONS ---
import DashboardIcon from '@mui/icons-material/Dashboard';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
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

// Kelmah Logo Component
const KelmahLogo = () => (
  <Box
    sx={{
      width: 100,
      height: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto',
    }}
  >
    <Box
      component="img"
      src="/kelmah-logo.png"
      alt="Kelmah"
      sx={{
        width: 80,
        height: 80,
        objectFit: 'contain',
      }}
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.parentElement.innerHTML = `
          <div style="
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: #1C2536;
          ">K</div>
        `;
      }}
    />
  </Box>
);

const Sidebar = ({ variant = 'permanent', open = false, onClose }) => {
  const user = useSelector((state) => state.auth.user);
  const { unreadCount: unreadMessages } = useMessages();
  const { unreadCount: unreadNotifications } = useNotifications();
  const location = useLocation();

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

  // LC Portal style menu items - role specific
  const menuItems = navRole === 'hirer' 
    ? [
        { text: 'Services', icon: <MiscellaneousServicesIcon />, path: '/hirer/services' },
        { text: 'Post a Job', icon: <PostAddIcon />, path: '/hirer/jobs/post' },
        { text: 'Active Jobs', icon: <WorkIcon />, path: '/hirer/jobs' },
        { text: 'Applications', icon: <AssignmentIcon />, path: '/hirer/applications' },
        { text: 'Find Talent', icon: <PeopleIcon />, path: '/hirer/find-talent' },
        { text: 'Completed Jobs', icon: <CheckCircleIcon />, path: '/hirer/completed' },
        { text: 'Track Progress', icon: <TrackChangesIcon />, path: '/hirer/progress' },
        { text: 'Support & Enquiry', icon: <SupportAgentIcon />, path: '/support' },
      ]
    : [
        { text: 'Services', icon: <MiscellaneousServicesIcon />, path: '/worker/services' },
        { text: 'Unpaid Bills', icon: <ReceiptIcon />, path: '/worker/bills/unpaid' },
        { text: 'Paid Bills', icon: <ReceiptLongIcon />, path: '/worker/bills/paid' },
        { text: 'My Applications', icon: <AssignmentIcon />, path: '/worker/applications' },
        { text: 'Queried Applications', icon: <HelpOutlineIcon />, path: '/worker/applications/queried' },
        { text: 'Completed Jobs', icon: <CheckCircleIcon />, path: '/worker/completed' },
        { text: 'Track Job', icon: <TrackChangesIcon />, path: '/worker/track' },
        { text: 'Support & Enquiry', icon: <SupportAgentIcon />, path: '/support' },
      ];

  // Common items at bottom
  const bottomItems = [
    {
      text: 'Notifications',
      icon: <NotificationsIcon />,
      path: '/notifications',
      badge: unreadNotifications,
    },
    {
      text: 'Messages',
      icon: <ChatIcon />,
      path: '/messages',
      badge: unreadMessages,
    },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
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
          backgroundColor: '#FAFAFA',
          color: '#333',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #E0E0E0',
        },
      }}
    >
      {/* Logo Section */}
      <Box sx={{ pt: 2, pb: 1 }}>
        <KelmahLogo />
      </Box>

      {/* User Profile Card - LC Portal Style */}
      <Box
        sx={{
          mx: 2,
          mb: 2,
          p: 2,
          backgroundColor: '#FFFFFF',
          borderRadius: 2,
          border: '1px solid #E0E0E0',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: '#E3F2FD',
            color: '#1976D2',
          }}
        >
          {user?.firstName?.[0] || 'U'}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight={600} sx={{ color: '#333' }}>
            Hi, {user?.firstName || 'User'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <FiberManualRecordIcon sx={{ fontSize: 10, color: '#4CAF50' }} />
            <Typography variant="caption" sx={{ color: '#4CAF50' }}>
              Online
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Dashboard Item - Highlighted Blue */}
      <Box sx={{ px: 2, mb: 1 }}>
        <ListItem
          button
          component={RouterLink}
          to={dashboardPath}
          sx={{
            backgroundColor: isDashboardActive ? '#E3F2FD' : 'transparent',
            borderRadius: 1,
            py: 1.5,
            '&:hover': {
              backgroundColor: '#E3F2FD',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <DashboardIcon sx={{ color: '#1976D2' }} />
          </ListItemIcon>
          <ListItemText
            primary="Dashboard"
            sx={{
              '& .MuiListItemText-primary': {
                color: '#1976D2',
                fontWeight: 600,
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
          color: '#666',
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
          return (
            <ListItem
              key={item.text}
              button
              component={RouterLink}
              to={item.path}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                py: 1.25,
                backgroundColor: isActive ? '#F5F5F5' : 'transparent',
                '&:hover': {
                  backgroundColor: '#F5F5F5',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.badge && item.badge > 0 ? (
                  <Badge color="error" badgeContent={item.badge} max={99}>
                    {React.cloneElement(item.icon, {
                      sx: { color: isActive ? '#1976D2' : '#666' },
                    })}
                  </Badge>
                ) : (
                  React.cloneElement(item.icon, {
                    sx: { color: isActive ? '#1976D2' : '#666' },
                  })
                )}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  '& .MuiListItemText-primary': {
                    color: isActive ? '#1976D2' : '#333',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.9rem',
                  },
                }}
              />
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ mx: 2, borderColor: '#E0E0E0' }} />

      {/* Bottom Items */}
      <List sx={{ px: 1, pb: 2 }}>
        {bottomItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem
              key={item.text}
              button
              component={RouterLink}
              to={item.path}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                py: 1.25,
                backgroundColor: isActive ? '#F5F5F5' : 'transparent',
                '&:hover': {
                  backgroundColor: '#F5F5F5',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.badge && item.badge > 0 ? (
                  <Badge color="error" badgeContent={item.badge} max={99}>
                    {React.cloneElement(item.icon, {
                      sx: { color: isActive ? '#1976D2' : '#666' },
                    })}
                  </Badge>
                ) : (
                  React.cloneElement(item.icon, {
                    sx: { color: isActive ? '#1976D2' : '#666' },
                  })
                )}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  '& .MuiListItemText-primary': {
                    color: isActive ? '#1976D2' : '#333',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.9rem',
                  },
                }}
              />
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
};

export default Sidebar;
