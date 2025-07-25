import React, { useState } from 'react';
import { IconButton, Badge, Menu, MenuItem, useTheme } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import useNavLinks from '../../../hooks/useNavLinks';
import { useNotifications } from '../../notifications/contexts/NotificationContext';
import { useAuth } from '../../auth/contexts/AuthContext';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../auth/services/authSlice';

const MobileNav = () => {
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
  // Only show auth items after initialization
  const showAuthButtons = isInitialized && !isAuthenticated;
  const showUserMenu = isInitialized && isAuthenticated;
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleClose();
    sessionStorage.setItem('dev-logout', 'true');
    dispatch(logoutUser());
    logout();
  };

  const handleNavigate = (path) => {
    handleClose();
    navigate(path);
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={{ color: theme.palette.primary.main }}
      >
        <MenuIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {navLinks.map(({ label, to }) => (
          <MenuItem key={to} onClick={() => handleNavigate(to)}>
            {label}
          </MenuItem>
        ))}
        {showAuthButtons
          ? [
              <MenuItem key="login" onClick={() => handleNavigate('/login')}>
                Login
              </MenuItem>,
              <MenuItem
                key="register"
                onClick={() => handleNavigate('/register')}
              >
                Register
              </MenuItem>,
            ]
          : showUserMenu
            ? [
                <MenuItem
                  key="notifications"
                  onClick={() => handleNavigate('/notifications')}
                >
                  <Badge
                    badgeContent={unreadCount}
                    color="error"
                    sx={{ mr: 1 }}
                  >
                    <NotificationsIcon />
                  </Badge>
                  Notifications
                </MenuItem>,
                <MenuItem
                  key="dashboard"
                  onClick={() => handleNavigate('/dashboard')}
                >
                  Dashboard
                </MenuItem>,
                <MenuItem
                  key="profile"
                  onClick={() =>
                    handleNavigate(
                      hasRole('worker') ? '/worker/profile' : '/profile',
                    )
                  }
                >
                  Profile
                </MenuItem>,
                <MenuItem
                  key="settings"
                  onClick={() => handleNavigate('/settings')}
                >
                  Settings
                </MenuItem>,
                <MenuItem key="logout" onClick={handleLogout}>
                  Logout
                </MenuItem>,
              ]
            : null}
      </Menu>
    </>
  );
};

export default MobileNav;
