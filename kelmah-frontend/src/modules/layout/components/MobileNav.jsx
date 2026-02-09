import { useMemo } from 'react';
import {
  Drawer,
  List,
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
  Chip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
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
import { useNotifications } from '../../notifications/contexts/NotificationContext';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../auth/services/authSlice';
import { BRAND_COLORS } from '../../../theme';
import { useAuthCheck } from '../../../hooks/useAuthCheck';
import { secureStorage } from '../../../utils/secureStorage';

// Styled Components
const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 'min(280px, 85vw)', // ✅ MOBILE-AUDIT FIX: Clamp to 85vw for 320px screens
    background:
      theme.palette.mode === 'dark'
        ? `linear-gradient(180deg, ${BRAND_COLORS.black} 0%, ${BRAND_COLORS.blackLight} 100%)`
        : `linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)`,
    borderRight:
      theme.palette.mode === 'dark'
        ? `1px solid rgba(255, 215, 0, 0.2)`
        : `1px solid rgba(0, 0, 0, 0.1)`,
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 8px 32px rgba(0, 0, 0, 0.8)'
        : '0 4px 20px rgba(0, 0, 0, 0.15)',
  },
}));

const ProfileSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3, 2),
  background:
    theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${alpha(BRAND_COLORS.gold, 0.1)} 0%, ${alpha(BRAND_COLORS.goldLight, 0.05)} 100%)`
      : `linear-gradient(135deg, ${alpha(BRAND_COLORS.black, 0.05)} 0%, ${alpha(BRAND_COLORS.blackLight, 0.02)} 100%)`,
  borderBottom:
    theme.palette.mode === 'dark'
      ? `1px solid rgba(255, 215, 0, 0.1)`
      : `1px solid rgba(0, 0, 0, 0.08)`,
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  margin: theme.spacing(0.5, 1),
  padding: theme.spacing(1.5, 2),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? alpha(BRAND_COLORS.gold, 0.1)
        : alpha(BRAND_COLORS.black, 0.05),
    transform: 'translateX(4px)',
  },
  '&.active': {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? alpha(BRAND_COLORS.gold, 0.15)
        : alpha(BRAND_COLORS.black, 0.08),
    color:
      theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
    '& .MuiListItemIcon-root': {
      color:
        theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
    },
  },
}));

const MobileNav = ({ open, onClose }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authState = useAuthCheck();
  const { unreadCount = 0 } = useNotifications();

  const { user, canShowUserFeatures, shouldShowAuthButtons } = authState;

  const showUserMenu = canShowUserFeatures;
  const showAuthButtons = shouldShowAuthButtons;
  const userRole = user?.role || 'user';
  const isWorker = userRole === 'worker';
  const isHirer = userRole === 'hirer';

  const formatRoleLabel = () => {
    if (isWorker) return 'Skilled Worker';
    if (isHirer) return 'Hirer';
    const label = user?.roleDisplay || userRole;
    if (!label) {
      return 'Member';
    }
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const handleLogout = async () => {
    onClose();

    try {
      secureStorage.clear();
      localStorage.removeItem('kelmah_auth_token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      sessionStorage.clear();
    } catch (storageError) {
      console.warn('⚠️ MobileNav storage cleanup warning:', storageError);
    }

    try {
      await dispatch(logoutUser());
    } catch (error) {
      console.error('Logout dispatch error:', error);
    } finally {
      navigate('/', { replace: true });
      setTimeout(() => {
        window.location.reload();
      }, 100);
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

  // Role-specific navigation items - cleaner, no duplicates
  const navigationItems = useMemo(() => {
    const baseItems = [];
    
    if (showUserMenu) {
      // Authenticated user navigation based on role
      if (isHirer) {
        baseItems.push(
          { label: 'Dashboard', icon: <DashboardIcon />, path: '/hirer/dashboard' },
          { label: 'Post a Job', icon: <WorkIcon />, path: '/hirer/jobs/post' },
          { label: 'My Job Posts', icon: <AssignmentIcon />, path: '/hirer/jobs' },
          { label: 'Applications', icon: <AssignmentIcon />, path: '/hirer/applications' },
          { label: 'Find Workers', icon: <SearchIcon />, path: '/hirer/find-talent' },
        );
      } else if (isWorker) {
        baseItems.push(
          { label: 'Dashboard', icon: <DashboardIcon />, path: '/worker/dashboard' },
          { label: 'Find Jobs', icon: <SearchIcon />, path: '/worker/find-work' },
          { label: 'My Applications', icon: <AssignmentIcon />, path: '/worker/applications' },
          { label: 'My Profile', icon: <PersonIcon />, path: '/worker/profile' },
        );
      } else {
        baseItems.push(
          { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
          { label: 'Browse Jobs', icon: <WorkIcon />, path: '/jobs' },
        );
      }
      
      // Common items for authenticated users
      baseItems.push(
        { label: 'Messages', icon: <MessageIcon />, path: '/messages', badge: unreadCount },
        { label: 'Notifications', icon: <NotificationsIcon />, path: '/notifications', badge: unreadCount },
      );
    } else {
      // Guest navigation
      baseItems.push(
        { label: 'Home', icon: <HomeIcon />, path: '/' },
        { label: 'Browse Jobs', icon: <WorkIcon />, path: '/jobs' },
        { label: 'Find Workers', icon: <SearchIcon />, path: '/find-talents' },
      );
    }
    
    return baseItems;
  }, [showUserMenu, isHirer, isWorker, unreadCount]);

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
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom:
              theme.palette.mode === 'dark'
                ? `1px solid rgba(255, 215, 0, 0.1)`
                : `1px solid rgba(0, 0, 0, 0.08)`,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              background:
                theme.palette.mode === 'dark'
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
              color:
                theme.palette.mode === 'dark'
                  ? BRAND_COLORS.gold
                  : BRAND_COLORS.black,
              minWidth: 44,
              minHeight: 44,
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
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? BRAND_COLORS.gold
                      : BRAND_COLORS.black,
                  color:
                    theme.palette.mode === 'dark'
                      ? BRAND_COLORS.black
                      : BRAND_COLORS.gold,
                  fontWeight: 700,
                }}
              >
                {getUserInitials()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {user?.fullName || user?.displayName || user?.email || 'User'}
                </Typography>
                <Chip
                  label={formatRoleLabel()}
                  size="small"
                  sx={{
                    backgroundColor:
                      theme.palette.mode === 'dark'
                        ? alpha(BRAND_COLORS.gold, 0.2)
                        : alpha(BRAND_COLORS.black, 0.1),
                    color:
                      theme.palette.mode === 'dark'
                        ? BRAND_COLORS.gold
                        : BRAND_COLORS.black,
                    fontWeight: 600,
                  }}
                />
              </Box>
            </Stack>
          </ProfileSection>
        )}

        {/* Navigation Items */}
        <List sx={{ flex: 1, py: 1 }}>
          {navigationItems.map((item, index) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: index * 0.02 }}
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
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: 0.05 }}
              >
                <StyledListItemButton
                  onClick={() => handleNavigate('/settings')}
                >
                  <ListItemIcon>
                    <SettingsIcon />
                  </ListItemIcon>
                  <ListItemText primary="Settings" />
                </StyledListItemButton>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: 0.07 }}
              >
                <StyledListItemButton
                  onClick={() => handleNavigate('/support')}
                >
                  <ListItemIcon>
                    <HomeIcon />
                  </ListItemIcon>
                  <ListItemText primary="Help & Support" />
                </StyledListItemButton>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: 0.09 }}
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
                  <ListItemIcon>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText primary="Logout" />
                </StyledListItemButton>
              </motion.div>
            </>
          )}
        </List>

        {/* Auth Buttons for non-authenticated users */}
        {showAuthButtons && (
          <Box
            sx={{
              p: 2,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Stack spacing={1}>
              <StyledListItemButton
                onClick={() => handleNavigate('/login')}
                sx={{ justifyContent: 'center' }}
              >
                <ListItemText
                  primary="Sign In"
                  primaryTypographyProps={{
                    textAlign: 'center',
                    fontWeight: 600,
                  }}
                />
              </StyledListItemButton>
              <StyledListItemButton
                onClick={() => handleNavigate('/register')}
                sx={{
                  justifyContent: 'center',
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? alpha(BRAND_COLORS.gold, 0.15)
                      : alpha(BRAND_COLORS.black, 0.08),
                }}
              >
                <ListItemText
                  primary="Get Started"
                  primaryTypographyProps={{
                    textAlign: 'center',
                    fontWeight: 600,
                    color:
                      theme.palette.mode === 'dark'
                        ? BRAND_COLORS.gold
                        : BRAND_COLORS.black,
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

MobileNav.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default MobileNav;
