import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  useTheme,
  alpha,
  styled,
} from '@mui/material';
import { Link as RouterLink, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Chat as ChatIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import useNavLinks from '../../../hooks/useNavLinks';
import { useNotifications } from '../../notifications/contexts/NotificationContext';
import { useAuth } from '../../auth/contexts/AuthContext';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../auth/services/authSlice';
import { useMessages } from '../../messaging/contexts/MessageContext';

// Styled components
const StyledNavLink = styled(NavLink)(({ theme }) => ({
  margin: '0 12px',
  padding: '8px 16px',
  borderRadius: '20px',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '0.95rem',
  transition: 'all 0.3s ease-in-out',
  position: 'relative',
  '&:hover': {
    transform: 'translateY(-1px)',
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
  },
  '&.active': {
    color: theme.palette.secondary.main,
    backgroundColor: alpha(theme.palette.secondary.main, 0.1),
    fontWeight: 700,
  },
  '&:not(.active)': {
    color: theme.palette.text.primary,
  },
}));

const AuthButton = styled(Button)(({ theme }) => ({
  borderRadius: '25px',
  padding: '8px 24px',
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '0.95rem',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
  },
}));

const DesktopNav = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    isAuthenticated,
    hasRole,
    isInitialized,
    logout,
  } = useAuth();
  
  const { navLinks } = useNavLinks();
  const { unreadCount } = useNotifications();
  const { unreadCount: messageUnreadCount } = useMessages();
  const [anchorEl, setAnchorEl] = useState(null);

  // 🚨 CRITICAL FIX: Never show user features on auth pages, regardless of stored data
  const isOnAuthPage = location.pathname.includes('/login') || 
                      location.pathname.includes('/register') ||
                      location.pathname.includes('/forgot-password') ||
                      location.pathname.includes('/reset-password') ||
                      location.pathname.includes('/verify-email');

  // Only show authenticated features if user is actually authenticated and NOT on auth page
  const showUserFeatures = !isOnAuthPage && isInitialized && isAuthenticated && user;
  const showAuthButtons = isInitialized && (isOnAuthPage || !isAuthenticated);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    try {
      await logout();
    dispatch(logoutUser());
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigateToDashboard = () => {
    handleMenuClose();
    if (user?.role === 'worker') {
      navigate('/worker/dashboard');
    } else if (user?.role === 'hirer') {
      navigate('/hirer/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  // Show loading state during initialization
  if (!isInitialized) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: 200, height: 40 }} /> {/* Placeholder */}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* Navigation Links - Show for all users */}
      {navLinks.map(({ label, to }) => (
        <StyledNavLink key={to} to={to}>
          {label}
        </StyledNavLink>
      ))}

      {/* Authenticated User Features */}
      {showUserFeatures && (
        <>
          {/* Messages */}
          <IconButton
            component={RouterLink}
            to="/messages"
            sx={{
              mx: 1,
              color: theme.palette.text.primary,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.2),
                transform: 'scale(1.05)',
              },
              transition: 'all 0.3s ease-in-out',
            }}
          >
            <Badge badgeContent={messageUnreadCount} color="secondary">
              <ChatIcon />
            </Badge>
          </IconButton>

          {/* Notifications */}
          <IconButton
            component={RouterLink}
            to="/notifications"
            sx={{
              mx: 1,
              color: theme.palette.text.primary,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.2),
                transform: 'scale(1.05)',
              },
              transition: 'all 0.3s ease-in-out',
            }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* User Menu */}
          <IconButton
            onClick={handleMenuOpen}
            sx={{
              mx: 1,
              p: 0.5,
              border: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
              '&:hover': {
                border: `2px solid ${theme.palette.secondary.main}`,
                transform: 'scale(1.05)',
              },
              transition: 'all 0.3s ease-in-out',
            }}
          >
            {user?.profileImage ? (
              <Avatar
                src={user.profileImage}
                sx={{ width: 32, height: 32 }}
              />
            ) : (
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: theme.palette.secondary.main,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
                {user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'U'}
              </Avatar>
            )}
          </IconButton>

          {/* User Menu Dropdown */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              elevation: 8,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                borderRadius: 2,
                minWidth: 200,
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
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={navigateToDashboard} sx={{ py: 1.5 }}>
              <DashboardIcon sx={{ mr: 2 }} />
              Dashboard
            </MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }} sx={{ py: 1.5 }}>
              <PersonIcon sx={{ mr: 2 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }} sx={{ py: 1.5 }}>
              <SettingsIcon sx={{ mr: 2 }} />
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
              <LogoutIcon sx={{ mr: 2 }} />
              Logout
            </MenuItem>
          </Menu>
        </>
      )}

      {/* Authentication Buttons for Non-Authenticated Users */}
      {showAuthButtons && (
        <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
          <AuthButton
            component={RouterLink}
            to="/login"
            variant="outlined"
            size="small"
            sx={{
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            Login
          </AuthButton>
          <AuthButton
            component={RouterLink}
            to="/register"
            variant="contained"
            size="small"
            sx={{
              bgcolor: theme.palette.secondary.main,
              color: theme.palette.secondary.contrastText,
              '&:hover': {
                bgcolor: theme.palette.secondary.dark,
              },
            }}
          >
            Sign Up
          </AuthButton>
        </Box>
      )}
    </Box>
  );
};

export default DesktopNav;
