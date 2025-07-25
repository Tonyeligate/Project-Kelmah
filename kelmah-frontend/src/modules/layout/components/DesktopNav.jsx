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
} from '@mui/material';
import { Link as RouterLink, NavLink, useNavigate } from 'react-router-dom';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import useNavLinks from '../../../hooks/useNavLinks';
import { useNotifications } from '../../notifications/contexts/NotificationContext';
import { useAuth } from '../../auth/contexts/AuthContext';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../auth/services/authSlice';
import ChatIcon from '@mui/icons-material/Chat';
import { useMessages } from '../../messaging/contexts/MessageContext';

const DesktopNav = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const {
    user,
    isAuthenticated: isAuthFn,
    hasRole,
    isInitialized,
    logout,
  } = useAuth();
  const isAuthenticated = isAuthFn();
  const { navLinks } = useNavLinks();
  const { unreadCount } = useNotifications();
  const { unreadCount: messageUnreadCount } = useMessages();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  // Only show auth menus after initialization
  const showUserMenu = isInitialized && isAuthenticated;
  const showAuthButtons = isInitialized && !isAuthenticated;

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleMenuClose();
    sessionStorage.setItem('dev-logout', 'true');
    dispatch(logoutUser());
    logout();
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {navLinks.map(({ label, to }) => (
        <NavLink
          key={to}
          to={to}
          style={({ isActive: active }) => ({
            margin: '0 8px',
            color: active
              ? theme.palette.secondary.dark
              : theme.palette.primary.main,
            fontWeight: 500,
            borderBottom: active
              ? `2px solid ${theme.palette.secondary.dark}`
              : 'none',
            textDecoration: 'none',
          })}
        >
          {label}
        </NavLink>
      ))}
      {showUserMenu ? (
        <>
          <IconButton
            component={RouterLink}
            to="/messages"
            sx={{ mx: 1, color: theme.palette.primary.main }}
          >
            <Badge badgeContent={messageUnreadCount} color="secondary">
              <ChatIcon />
            </Badge>
          </IconButton>
          <IconButton
            component={RouterLink}
            to="/notifications"
            sx={{ mx: 1, color: theme.palette.primary.main }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton
            onClick={handleMenuOpen}
            sx={{ mx: 1, color: theme.palette.primary.main }}
          >
            {user?.profileImage ? (
              <Avatar
                src={user.profileImage}
                alt={user.firstName}
                sx={{ width: 32, height: 32 }}
              />
            ) : (
              <AccountCircleIcon />
            )}
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem
              onClick={() => {
                handleMenuClose();
                navigate('/dashboard');
              }}
            >
              Dashboard
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleMenuClose();
                navigate(hasRole('worker') ? '/worker/profile' : '/profile');
              }}
            >
              Profile
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleMenuClose();
                navigate('/settings');
              }}
            >
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </>
      ) : showAuthButtons ? (
        <>
          <Button
            component={RouterLink}
            to="/login"
            sx={{
              mx: 1,
              color: theme.palette.secondary.contrastText,
              fontWeight: 500,
            }}
          >
            Login
          </Button>
          <Button
            variant="contained"
            component={RouterLink}
            to="/register"
            sx={{
              mx: 1,
              background: theme.palette.primary.main,
              color: theme.palette.secondary.main,
              '&:hover': { background: theme.palette.primary.light },
            }}
          >
            Register
          </Button>
        </>
      ) : null}
    </Box>
  );
};

export default DesktopNav;
