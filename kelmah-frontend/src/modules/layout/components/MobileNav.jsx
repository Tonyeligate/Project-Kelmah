import React, { useState } from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  ListItemButton,
  Box, 
  Typography, 
  Avatar, 
  Divider,
  IconButton,
  Badge,
  useTheme,
  alpha,
  Stack,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  Search as SearchIcon,
  Message as MessageIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  AccountBalance as WalletIcon,
} from '@mui/icons-material';
import useNavLinks from '../../../hooks/useNavLinks';
import { useNotifications } from '../../notifications/contexts/NotificationContext';
import { useAuth } from '../../auth/contexts/AuthContext';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../auth/services/authSlice';
import { BRAND_COLORS } from '../../../theme';

// Styled Components
const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 280,
    background: theme.palette.mode === 'dark'
      ? `linear-gradient(180deg, ${BRAND_COLORS.black} 0%, ${BRAND_COLORS.blackLight} 100%)`
      : `linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)`,
    borderRight: theme.palette.mode === 'dark'
      ? `1px solid rgba(255, 215, 0, 0.2)`
      : `1px solid rgba(0, 0, 0, 0.1)`,
    boxShadow: theme.palette.mode === 'dark'
      ? '0 8px 32px rgba(0, 0, 0, 0.8)'
      : '0 4px 20px rgba(0, 0, 0, 0.15)',
  },
}));

const ProfileSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3, 2),
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${alpha(BRAND_COLORS.gold, 0.1)} 0%, ${alpha(BRAND_COLORS.goldLight, 0.05)} 100%)`
    : `linear-gradient(135deg, ${alpha(BRAND_COLORS.black, 0.05)} 0%, ${alpha(BRAND_COLORS.blackLight, 0.02)} 100%)`,
  borderBottom: theme.palette.mode === 'dark'
    ? `1px solid rgba(255, 215, 0, 0.1)`
    : `1px solid rgba(0, 0, 0, 0.08)`,
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  margin: theme.spacing(0.5, 1),
  padding: theme.spacing(1.5, 2),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark'
      ? alpha(BRAND_COLORS.gold, 0.1)
      : alpha(BRAND_COLORS.black, 0.05),
    transform: 'translateX(4px)',
  },
  '&.active': {
    backgroundColor: theme.palette.mode === 'dark'
      ? alpha(BRAND_COLORS.gold, 0.15)
      : alpha(BRAND_COLORS.black, 0.08),
    color: theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
    '& .MuiListItemIcon-root': {
      color: theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
    },
  },
}));

const MobileNav = ({ open, onClose }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated: isAuthFn,
    hasRole,
    isInitialized,
    logout,
  } = useAuth();
  const isAuthenticated = isAuthFn();
  const { unreadCount } = useNotifications();
  
  const showAuthButtons = isInitialized && !isAuthenticated;
  const showUserMenu = isInitialized && isAuthenticated;

  const handleLogout = async () => {
    onClose();
    try {
    sessionStorage.setItem('dev-logout', 'true');
    dispatch(logoutUser());
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/');
    }
  };

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const navigationItems = [
    { 
      label: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: user?.role === 'worker' ? '/worker/dashboard' : '/hirer/dashboard',
      show: showUserMenu 
    },
    { 
      label: 'Find Work', 
      icon: <SearchIcon />, 
      path: '/jobs',
      show: showUserMenu && user?.role === 'worker'
    },
    { 
      label: 'Find Workers', 
      icon: <WorkIcon />, 
      path: '/search',
      show: showUserMenu && user?.role === 'hirer'
    },
    { 
      label: 'Applications', 
      icon: <AssignmentIcon />, 
      path: user?.role === 'worker' ? '/worker/applications' : '/hirer/applications',
      show: showUserMenu 
    },
    { 
      label: 'Messages', 
      icon: <MessageIcon />, 
      path: '/messages',
      badge: 2,
      show: showUserMenu 
    },
    { 
      label: 'Notifications', 
      icon: <NotificationsIcon />, 
      path: '/notifications',
      badge: unreadCount,
      show: showUserMenu 
    },
    { 
      label: 'Wallet', 
      icon: <WalletIcon />, 
      path: '/wallet',
      show: showUserMenu 
    },
  ];

  return (
    <StyledDrawer
      anchor="left"
      open={open}
      onClose={onClose}
      variant="temporary"
      ModalProps={{ keepMounted: true }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 2,
          borderBottom: theme.palette.mode === 'dark'
            ? `1px solid rgba(255, 215, 0, 0.1)`
            : `1px solid rgba(0, 0, 0, 0.08)`,
        }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${BRAND_COLORS.gold} 0%, ${BRAND_COLORS.goldLight} 100%)`
                : `linear-gradient(135deg, ${BRAND_COLORS.black} 0%, ${BRAND_COLORS.blackLight} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Kelmah
          </Typography>
      <IconButton
            onClick={onClose}
            sx={{
              color: theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
            }}
          >
            <CloseIcon />
      </IconButton>
        </Box>

        {/* Profile Section */}
        {showUserMenu && (
          <ProfileSection>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  width: 50,
                  height: 50,
                  backgroundColor: theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
                  color: theme.palette.mode === 'dark' ? BRAND_COLORS.black : BRAND_COLORS.gold,
                  fontWeight: 700,
                }}
              >
                {getUserInitials()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.username || 'User'}
                </Typography>
                <Chip
                  label={user?.role === 'worker' ? 'Skilled Worker' : 'Hirer'}
                  size="small"
                  sx={{
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? alpha(BRAND_COLORS.gold, 0.2) 
                      : alpha(BRAND_COLORS.black, 0.1),
                    color: theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
                    fontWeight: 600,
                  }}
                />
              </Box>
            </Stack>
          </ProfileSection>
        )}

        {/* Navigation Items */}
        <List sx={{ flex: 1, py: 1 }}>
          {navigationItems.filter(item => item.show).map((item) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <StyledListItemButton onClick={() => handleNavigate(item.path)}>
                <ListItemIcon>
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: 500,
                  }}
                />
              </StyledListItemButton>
            </motion.div>
          ))}

          {showUserMenu && (
            <>
              <Divider sx={{ my: 2, mx: 2 }} />
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <StyledListItemButton onClick={() => handleNavigate('/profile')}>
                  <ListItemIcon><PersonIcon /></ListItemIcon>
                  <ListItemText primary="Profile" />
                </StyledListItemButton>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <StyledListItemButton onClick={() => handleNavigate('/settings')}>
                  <ListItemIcon><SettingsIcon /></ListItemIcon>
                  <ListItemText primary="Settings" />
                </StyledListItemButton>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <StyledListItemButton 
                  onClick={handleLogout}
                  sx={{
                    color: '#f44336',
                    '&:hover': {
                      backgroundColor: alpha('#f44336', 0.1),
                    },
                    '& .MuiListItemIcon-root': {
                      color: '#f44336',
                    },
                  }}
                >
                  <ListItemIcon><LogoutIcon /></ListItemIcon>
                  <ListItemText primary="Logout" />
                </StyledListItemButton>
              </motion.div>
            </>
          )}
        </List>

        {/* Auth Buttons for non-authenticated users */}
        {showAuthButtons && (
          <Box sx={{ p: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Stack spacing={1}>
              <StyledListItemButton 
                onClick={() => handleNavigate('/login')}
                sx={{ justifyContent: 'center' }}
              >
                <ListItemText 
                  primary="Sign In" 
                  primaryTypographyProps={{ textAlign: 'center', fontWeight: 600 }}
                />
              </StyledListItemButton>
              <StyledListItemButton 
                onClick={() => handleNavigate('/register')}
                sx={{ 
                  justifyContent: 'center',
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? alpha(BRAND_COLORS.gold, 0.15) 
                    : alpha(BRAND_COLORS.black, 0.08),
                }}
              >
                <ListItemText 
                  primary="Get Started" 
                  primaryTypographyProps={{ 
                    textAlign: 'center', 
                    fontWeight: 600,
                    color: theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
                  }}
                />
              </StyledListItemButton>
            </Stack>
          </Box>
        )}
      </Box>
    </StyledDrawer>
  );
};

export default MobileNav;
