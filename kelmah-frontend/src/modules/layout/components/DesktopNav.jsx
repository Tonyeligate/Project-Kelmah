import React, { useState } from 'react';
import { Box, Button, IconButton, Badge, Menu, MenuItem, Avatar, useTheme } from '@mui/material';
import { Link as RouterLink, NavLink, useNavigate } from 'react-router-dom';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import useNavLinks from '../../../hooks/useNavLinks';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, selectIsAuthenticated, logoutUser } from '../../auth/services/authSlice';
import { useNotifications } from '../../notifications/contexts/NotificationContext';
import { useAuth } from '../../auth/contexts/AuthContext';

const DesktopNav = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { logout: contextLogout } = useAuth();
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { navLinks } = useNavLinks();
  const { unreadCount } = useNotifications();
  const showAuthButtons = !isAuthenticated;
  const userRole = user?.role || user?.userType || user?.userRole;
  const hasRole = (role) => userRole === role;
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleMenuClose();
    sessionStorage.setItem('dev-logout', 'true');
    dispatch(logoutUser());
    contextLogout();
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {navLinks.map(({ label, to }) => (
        <NavLink
          key={to}
          to={to}
          style={({ isActive: active }) => ({
            margin: '0 8px',
            color: active ? theme.palette.secondary.dark : theme.palette.primary.main,
            fontWeight: 500,
            borderBottom: active ? `2px solid ${theme.palette.secondary.dark}` : 'none',
            textDecoration: 'none'
          })}
        >
          {label}
        </NavLink>
      ))}
      {!showAuthButtons ? (
        <>
          <IconButton component={RouterLink} to="/notifications" sx={{ mx: 1, color: theme.palette.primary.main }}>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton onClick={handleMenuOpen} sx={{ mx: 1, color: theme.palette.primary.main }}>
            {user?.profileImage ? (
              <Avatar src={user.profileImage} alt={user.firstName} sx={{ width: 32, height: 32 }} />
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
            <MenuItem onClick={() => { handleMenuClose(); navigate('/dashboard'); }}>
              Dashboard
            </MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); navigate(hasRole('worker') ? '/worker/profile' : '/profile'); }}>
              Profile
            </MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              Logout
            </MenuItem>
          </Menu>
        </>
      ) : (
        <>
          <Button component={RouterLink} to="/login" sx={{ mx: 1, color: theme.palette.secondary.contrastText, fontWeight: 500 }}>
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
              '&:hover': { background: theme.palette.primary.light }
            }}
          >
            Register
          </Button>
        </>
      )}
    </Box>
  );
};

export default DesktopNav; 