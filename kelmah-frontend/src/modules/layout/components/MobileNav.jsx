import { useMemo, useRef, useCallback } from 'react';
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
// framer-motion import removed — ✅ MOBILE-AUDIT P3
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Close as CloseIcon,
  Home as HomeIcon,
  SupportAgent as SupportIcon,
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
import { logout, logoutUser } from '../../auth/services/authSlice';
import { BRAND_COLORS } from '../../../theme';
import { useAuthCheck } from '../../../hooks/useAuthCheck';
import { secureStorage } from '../../../utils/secureStorage';

// Styled Components
const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 'min(300px, 76vw)',
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
  padding: theme.spacing(2.25, 2),
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
  const location = useLocation();
  const authState = useAuthCheck();
  const { unreadCount = 0 } = useNotifications();

  // Pending action to run after the Drawer's exit transition completes.
  // This prevents the page-freeze bug: if we navigate() while the Drawer is
  // still closing, MUI Modal never fires its cleanup (removing backdrop,
  // restoring body overflow, clearing aria-hidden). By deferring navigation
  // to SlideProps.onExited, we guarantee MUI finishes first.
  const pendingActionRef = useRef(null);

  const { user, canShowUserFeatures, shouldShowAuthButtons } = authState;

  const showUserMenu = canShowUserFeatures;
  const showAuthButtons = shouldShowAuthButtons;
  const userRole = user?.role || 'user';
  const isWorker = userRole === 'worker';
  const isHirer = userRole === 'hirer';
  const isOnAuthPage =
    location.pathname.includes('/login') ||
    location.pathname.includes('/register') ||
    location.pathname.includes('/forgot-password') ||
    location.pathname.includes('/reset-password') ||
    location.pathname.includes('/verify-email');
  const isLoginPage = location.pathname.includes('/login');
  const isRegisterPage = location.pathname.includes('/register');

  // Close the drawer. Any navigation or logout is stored in pendingActionRef
  // and executed by handleDrawerExited after MUI finishes its modal cleanup.
  const requestClose = () => {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    onClose();

    // Safety net: if SlideProps.onExited somehow doesn't fire (edge case with
    // keepMounted or interrupted transitions), execute the pending action after
    // a generous timeout. Also force-clean body overflow to unfreeze the page.
    if (pendingActionRef.current) {
      setTimeout(() => {
        const action = pendingActionRef.current;
        if (action) {
          pendingActionRef.current = null;
          // Force-clean any stale MUI Modal artifacts on body
          document.body.style.removeProperty('overflow');
          document.body.style.removeProperty('padding-right');
          action();
        }
      }, 350);
    }
  };

  // Called by SlideProps.onExited — the Drawer's slide-out animation has
  // completed and MUI Modal has fully restored body styles & removed backdrop.
  const handleDrawerExited = useCallback(() => {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (typeof action === 'function') {
      action();
    }
  }, []);

  const authCtas = useMemo(() => {
    if (!showAuthButtons) return [];

    if (isOnAuthPage) {
      if (isLoginPage) {
        return [{ label: 'Get Started', path: '/register', tone: 'primary' }];
      }
      if (isRegisterPage) {
        return [{ label: 'Sign In', path: '/login', tone: 'primary' }];
      }
      return [{ label: 'Sign In', path: '/login', tone: 'primary' }];
    }

    return [
      { label: 'Sign In', path: '/login', tone: 'secondary' },
      { label: 'Get Started', path: '/register', tone: 'primary' },
    ];
  }, [showAuthButtons, isOnAuthPage, isLoginPage, isRegisterPage]);

  const formatRoleLabel = () => {
    if (isWorker) return 'Skilled Worker';
    if (isHirer) return 'Hirer';
    const label = user?.roleDisplay || userRole;
    if (!label) {
      return 'Member';
    }
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const handleLogout = () => {
    // Store the logout action; it runs after the drawer fully closes.
    pendingActionRef.current = () => {
      try {
        secureStorage.clear();
      } catch (_) { /* best-effort */ }

      dispatch(logout());
      navigate('/', { replace: true });
      Promise.resolve(dispatch(logoutUser())).catch(() => {});
    };
    requestClose();
  };

  const handleNavigate = (path) => {
    const currentPath = `${location.pathname || ''}${location.search || ''}`;
    if (path && path !== currentPath) {
      // Store navigation; it runs after the drawer fully closes.
      pendingActionRef.current = () => navigate(path);
    }
    requestClose();
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

  // Secondary navigation only — bottom navigation owns the primary app sections.
  const navigationItems = useMemo(() => {
    const baseItems = [];
    
    if (showUserMenu) {
      if (isHirer) {
        baseItems.push(
          { label: 'My Job Posts', icon: <AssignmentIcon />, path: '/hirer/jobs' },
          { label: 'Applications', icon: <AssignmentIcon />, path: '/hirer/applications' },
          { label: 'Find Talent', icon: <SearchIcon />, path: '/hirer/find-talents' },
          { label: 'Profile', icon: <PersonIcon />, path: '/profile' },
        );
      } else if (isWorker) {
        baseItems.push(
          { label: 'My Applications', icon: <AssignmentIcon />, path: '/worker/applications' },
          { label: 'Saved Jobs', icon: <WorkIcon />, path: '/worker/saved-jobs' },
          { label: 'My Schedule', icon: <WalletIcon />, path: '/worker/schedule' },
          { label: 'Profile', icon: <PersonIcon />, path: '/profile' },
        );
      } else {
        baseItems.push(
          { label: 'Profile', icon: <PersonIcon />, path: '/profile' },
          { label: 'Browse Jobs', icon: <WorkIcon />, path: '/jobs' },
        );
      }

      baseItems.push(
        { label: 'Help & Support', icon: <SupportIcon />, path: '/support' },
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
      onClose={requestClose}
      variant="temporary"
      SlideProps={{ onExited: handleDrawerExited }}
      ModalProps={{
        keepMounted: true,
        disableAutoFocus: true,
        disableEnforceFocus: true,
        disableRestoreFocus: true,
      }}
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
            onClick={requestClose}
            aria-label="Close menu"
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
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
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
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                  Account shortcuts and worker tools
                </Typography>
              </Box>
            </Stack>
          </ProfileSection>
        )}

        {/* Navigation Items */}
        <List sx={{ flex: 1, py: 1 }}>
          {/* ✅ MOBILE-AUDIT P3: removed motion.div staggered animation from nav items */}
          {navigationItems.map((item) => (
                <StyledListItemButton key={item.path} onClick={() => handleNavigate(item.path)}>
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
            ))}

          {showUserMenu && (
            <>
              <Divider sx={{ my: 2, mx: 2 }} />

              <StyledListItemButton onClick={() => handleNavigate('/settings')}>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </StyledListItemButton>

              <StyledListItemButton
                onClick={() => handleNavigate('/support')}
              >
                <ListItemIcon>
                  <SupportIcon />
                </ListItemIcon>
                <ListItemText primary="Help & Support" />
              </StyledListItemButton>

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
                  <ListItemText primary="Sign Out" />
                </StyledListItemButton>
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
              {authCtas.map((cta) => (
                <StyledListItemButton
                  key={cta.path}
                  onClick={() => handleNavigate(cta.path)}
                  sx={{
                    justifyContent: 'center',
                    ...(cta.tone === 'primary' && {
                      backgroundColor:
                        theme.palette.mode === 'dark'
                          ? alpha(BRAND_COLORS.gold, 0.15)
                          : alpha(BRAND_COLORS.black, 0.08),
                    }),
                  }}
                >
                  <ListItemText
                    primary={cta.label}
                    primaryTypographyProps={{
                      textAlign: 'center',
                      fontWeight: 600,
                      ...(cta.tone === 'primary' && {
                        color:
                          theme.palette.mode === 'dark'
                            ? BRAND_COLORS.gold
                            : BRAND_COLORS.black,
                      }),
                    }}
                  />
                </StyledListItemButton>
              ))}
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

