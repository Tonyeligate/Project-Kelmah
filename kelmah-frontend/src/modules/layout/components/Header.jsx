import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  Button,
  alpha,
  Divider,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Dashboard as DashboardIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import DesktopNav from './DesktopNav';
import MobileNav from './MobileNav';
import { useAuth } from '../../auth/contexts/AuthContext';

// Styled components
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${alpha(theme.palette.secondary.main, 0.9)})`,
  backdropFilter: 'blur(20px)',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
}));

const LogoBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  color: theme.palette.primary.main,
  fontWeight: 800,
  fontSize: '1.75rem',
  fontFamily: 'Montserrat, sans-serif',
  letterSpacing: '0.02em',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

const NotificationBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    color: theme.palette.primary.contrastText,
    fontWeight: 600,
  },
}));

const Header = ({ toggleTheme, mode }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mock notification data
  const unreadNotifications = 3;
  const unreadMessages = 2;

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/');
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

  const renderUserMenu = () => (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
      onClick={handleMenuClose}
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
      <Box
        sx={{
          px: 2,
          py: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          {user?.firstName} {user?.lastName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.email}
        </Typography>
        <Typography variant="caption" color="primary">
          {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
        </Typography>
      </Box>

      <MenuItem onClick={navigateToDashboard}>
        <ListItemIcon>
          <DashboardIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Dashboard</ListItemText>
      </MenuItem>

      <MenuItem onClick={() => navigate('/profile')}>
        <ListItemIcon>
          <AccountCircleIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Profile</ListItemText>
      </MenuItem>

      <MenuItem onClick={() => navigate('/settings')}>
        <ListItemIcon>
          <SettingsIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Settings</ListItemText>
      </MenuItem>

      <Divider />

      <MenuItem onClick={handleLogout}>
        <ListItemIcon>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Logout</ListItemText>
      </MenuItem>
    </Menu>
  );

  const renderNotificationsMenu = () => (
    <Menu
      anchorEl={notificationsAnchor}
      open={Boolean(notificationsAnchor)}
      onClose={handleNotificationsClose}
      PaperProps={{
        elevation: 8,
        sx: {
          overflow: 'visible',
          filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
          mt: 1.5,
          borderRadius: 2,
          minWidth: 300,
          maxHeight: 400,
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <Box
        sx={{
          px: 2,
          py: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
        <Typography variant="subtitle1" fontWeight={600}>
          Notifications
        </Typography>
      </Box>

      <MenuItem onClick={handleNotificationsClose}>
        <ListItemText
          primary="New job application received"
          secondary="2 minutes ago"
        />
      </MenuItem>

      <MenuItem onClick={handleNotificationsClose}>
        <ListItemText
          primary="Payment processed successfully"
          secondary="1 hour ago"
        />
      </MenuItem>

      <MenuItem onClick={handleNotificationsClose}>
        <ListItemText
          primary="Profile verification approved"
          secondary="3 hours ago"
        />
      </MenuItem>

      <Divider />

      <MenuItem
        onClick={() => {
          handleNotificationsClose();
          navigate('/notifications');
        }}
      >
        <ListItemText
          primary="View all notifications"
          sx={{ textAlign: 'center', color: 'primary.main' }}
        />
      </MenuItem>
    </Menu>
  );

  return (
    <StyledAppBar position="static" elevation={0}>
      <Toolbar sx={{ minHeight: { xs: 64, sm: 70 } }}>
        {/* Mobile Menu Button */}
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => setMobileMenuOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Logo */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <LogoBox component={RouterLink} to="/">
        <Box
          sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            display: 'flex',
            alignItems: 'center',
                justifyContent: 'center',
                mr: 1,
                color: 'white',
                fontWeight: 800,
                fontSize: '1.2rem',
          }}
        >
              K
            </Box>
          <Typography
            variant="h6"
            sx={{
                fontWeight: 800,
              fontFamily: 'Montserrat, sans-serif',
                fontSize: { xs: '1.3rem', sm: '1.5rem' },
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.text.primary})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
            }}
          >
              elmah
          </Typography>
          </LogoBox>
        </motion.div>

        <Box sx={{ flexGrow: 1 }} />

        {/* Desktop Navigation */}
        {!isMobile && <DesktopNav />}

        {/* User Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Theme Toggle */}
          <Tooltip
            title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
          >
            <IconButton
              color="inherit"
              onClick={toggleTheme}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.3s ease-in-out',
              }}
            >
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
          </Tooltip>

          {isAuthenticated ? (
            <>
              {/* Messages */}
              <Tooltip title="Messages">
                <IconButton
                  color="inherit"
                  onClick={() => navigate('/messages')}
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.2),
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <NotificationBadge
                    badgeContent={unreadMessages}
                    color="primary"
                  >
                    <MessageIcon />
                  </NotificationBadge>
                </IconButton>
              </Tooltip>

              {/* Notifications */}
              <Tooltip title="Notifications">
                <IconButton
                  color="inherit"
                  onClick={handleNotificationsOpen}
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.2),
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <NotificationBadge
                    badgeContent={unreadNotifications}
                    color="primary"
                  >
                    <NotificationsIcon />
                  </NotificationBadge>
                </IconButton>
              </Tooltip>

              {/* User Avatar */}
              <Tooltip title="Account menu">
                <IconButton
                  onClick={handleProfileMenuOpen}
                  sx={{
                    p: 0,
                    ml: 1,
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      border: `2px solid ${theme.palette.primary.main}`,
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: 'primary.main',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                    }}
                  >
                    {user?.firstName?.charAt(0)}
                    {user?.lastName?.charAt(0)}
                  </Avatar>
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                size="small"
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                Login
              </Button>
              <Button
                component={RouterLink}
                to="/register"
                variant="contained"
                size="small"
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                Sign Up
              </Button>
            </Box>
          )}
        </Box>

        {/* Dev Mode Indicator */}
        {import.meta.env.DEV && (
          <Box
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              fontSize: '9px',
              padding: '2px 6px',
              background: theme.palette.error.main,
              color: 'white',
              borderRadius: 1,
              fontWeight: 600,
              zIndex: 1000,
            }}
          >
            DEV
          </Box>
        )}
      </Toolbar>

      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNav
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Menus */}
      {renderUserMenu()}
      {renderNotificationsMenu()}
    </StyledAppBar>
  );
};

export default Header;
