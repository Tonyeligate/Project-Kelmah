import React, { useState } from 'react';
import { IconButton, Badge, Menu, MenuItem, useTheme } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import useNavLinks from '../../../hooks/useNavLinks';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, selectIsAuthenticated, logoutUser } from '../../auth/services/authSlice';
import { useNotifications } from '../../notifications/contexts/NotificationContext';

const MobileNav = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { navLinks } = useNavLinks();
  const { unreadCount } = useNotifications();
  const showAuthButtons = !isAuthenticated;
  const userRole = user?.role || user?.userType || user?.userRole;
  const hasRole = (role) => userRole === role;
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleClose();
    sessionStorage.setItem('dev-logout', 'true');
    dispatch(logoutUser());
    navigate('/login');
  };

  const handleNavigate = (path) => {
    handleClose();
    navigate(path);
  };

  return (
    <>
      <IconButton onClick={handleOpen} sx={{ color: theme.palette.primary.main }}>
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
        {showAuthButtons ? (
          <>
            <MenuItem onClick={() => handleNavigate('/login')}>Login</MenuItem>
            <MenuItem onClick={() => handleNavigate('/register')}>Register</MenuItem>
          </>
        ) : (
          <>
            <MenuItem onClick={() => handleNavigate('/notifications')}>
              <Badge badgeContent={unreadCount} color="error" sx={{ mr: 1 }}>
                <NotificationsIcon />
              </Badge>
              Notifications
            </MenuItem>
            <MenuItem onClick={() => handleNavigate('/dashboard')}>Dashboard</MenuItem>
            <MenuItem onClick={() => handleNavigate(hasRole('worker') ? '/worker/profile' : '/profile')}>Profile</MenuItem>
            <MenuItem onClick={() => handleNavigate('/settings')}>Settings</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </>
        )}
      </Menu>
    </>
  );
};

export default MobileNav; 