import React, { useState, useContext } from 'react';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../auth/services/authSlice';
import {
  Toolbar,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
  MenuItem,
  Tooltip,
  Divider,
  Chip,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  ColorLens as ColorLensIcon,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import DesktopNav from './DesktopNav';
import MobileNav from './MobileNav';
import { useAuthCheck } from '../../../hooks/useAuthCheck';
import { useNotifications } from '../../notifications/contexts/NotificationContext';
import MessageContext from '../../messaging/contexts/MessageContext';
import workerService from '../../worker/services/workerService';
import { secureStorage } from '../../../utils/secureStorage';

// Extracted sub-components & utilities
import {
  StyledAppBar, BrandLogo, LogoIcon, BrandText, TaglineText,
  ActionButton, UserAvatar, ThemeMenu, ThemeOption, AuthButton, StatusIndicator,
} from './header/HeaderStyles';
import UserMenu from './header/UserMenu';
import NotificationBells from './header/NotificationBells';
import BrandSection from './header/BrandSection';
import useAutoHideHeader from './header/useAutoHideHeader';
import getCurrentPageInfo from './header/pageDetection';
import buildMenuItems from './header/menuConfig';

const Header = ({
  toggleTheme,
  setThemeMode,
  mode,
  isDashboardMode = false,
  autoShowMode = false,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  // Use Redux logout action instead of AuthContext
  const dispatch = useDispatch();
  const logout = () => dispatch(logoutUser());
  const authState = useAuthCheck();

  // ✅ FIXED: Enable proper mobile responsiveness based on screen size
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerAvailability, setHeaderAvailability] = useState(null);
  const [headerCompletion, setHeaderCompletion] = useState(null);
  const [themeMenuAnchor, setThemeMenuAnchor] = useState(null);

  // Auto-hide header behaviour (desktop: mouse proximity, mobile: scroll direction)
  const isHeaderVisible = useAutoHideHeader(autoShowMode, isMobile);

  // 🎯 ENHANCED: Comprehensive page type detection
  const isOnAuthPage =
    location.pathname.includes('/login') ||
    location.pathname.includes('/register') ||
    location.pathname.includes('/forgot-password') ||
    location.pathname.includes('/reset-password') ||
    location.pathname.includes('/verify-email');

  const isOnDashboardPage =
    location.pathname.includes('/dashboard') ||
    location.pathname.startsWith('/worker') ||
    location.pathname.startsWith('/hirer');

  const isOnHomePage =
    location.pathname === '/' || location.pathname === '/home';

  // 🚨 CRITICAL FIX: Bulletproof authentication state logic
  const {
    isAuthenticated,
    isInitialized,
    isLoading,
    user,
    hasUser,
    canShowUserFeatures,
    shouldShowAuthButtons,
  } = authState;

  // 🎯 SMART DISPLAY LOGIC: Context-aware element visibility
  const showUserFeatures = React.useMemo(() => {
    // Never show user features on auth pages
    if (isOnAuthPage) return false;

    // Only show if properly authenticated with user data
    if (!isInitialized || isLoading || !isAuthenticated || !hasUser)
      return false;

    // Show user features on dashboard pages and other authenticated areas
    return canShowUserFeatures;
  }, [
    isOnAuthPage,
    isInitialized,
    isLoading,
    isAuthenticated,
    hasUser,
    canShowUserFeatures,
  ]);

  const showAuthButtons = React.useMemo(() => {
    if (isLoading) return false;

    // Show auth buttons on auth pages for clear UX
    if (isOnAuthPage && isInitialized) return true;

    // Show auth buttons on home page and public pages if not authenticated
    if (
      (isOnHomePage || !isOnDashboardPage) &&
      isInitialized &&
      !isAuthenticated
    )
      return true;

    return false;
  }, [
    isOnAuthPage,
    isOnHomePage,
    isOnDashboardPage,
    isInitialized,
    isLoading,
    isAuthenticated,
  ]);

  const authCta = React.useMemo(() => {
    if (!showAuthButtons) return null;

    const isLoginPage = location.pathname.includes('/login');
    const isRegisterPage = location.pathname.includes('/register');

    if (isOnAuthPage) {
      if (isLoginPage) {
        return { primary: { label: 'Get Started', to: '/register' } };
      }
      if (isRegisterPage) {
        return { primary: { label: 'Sign In', to: '/login' } };
      }
      return { primary: { label: 'Sign In', to: '/login' } };
    }

    return {
      secondary: { label: 'Sign In', to: '/login' },
      primary: { label: 'Get Started', to: '/register' },
    };
  }, [showAuthButtons, isOnAuthPage, location.pathname]);

  const showAuthSpinner = !showUserFeatures && !showAuthButtons && isLoading;

  // Load quick worker status for header chips
  React.useEffect(() => {
    const loadHeaderWorkerStatus = async () => {
      try {
        if (!showUserFeatures || user?.role !== 'worker') return;
        const id = user?.id || user?._id || user?.userId;
        if (id) {
          const [avail, comp] = await Promise.all([
            workerService.getWorkerAvailability(id).catch(() => null),
            workerService.getWorkerStats().catch(() => null),
          ]);
          if (avail) setHeaderAvailability(avail);
          if (comp) setHeaderCompletion(comp);
        }
      } catch (e) {
        // Non-blocking: header chips are optional
      }
    };
    loadHeaderWorkerStatus();
  }, [showUserFeatures, user?.role, user?.id, user?._id, user?.userId]);

  const currentPage = getCurrentPageInfo(location.pathname);

  // ✅ ENHANCED: Dynamic data based on user state and current page
  const { unreadCount: notifUnreadCount, notifications: notifList = [], markAllAsRead } =
    useNotifications();
  const unreadNotifications = showUserFeatures ? notifUnreadCount || 0 : 0;
  // H39 fix: Wire to messaging context for real unread message count
  const messageCtx = useContext(MessageContext);
  const unreadMessages = showUserFeatures ? messageCtx?.unreadCount || 0 : 0;
  const isUserOnline = showUserFeatures ? true : false;

  const handleProfileMenuOpen = (event) => {
    if (showUserFeatures) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = (event) => {
    if (showUserFeatures) {
      setNotificationsAnchor(event.currentTarget);
    }
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleThemeMenuOpen = (event) => {
    setThemeMenuAnchor(event.currentTarget);
  };

  const handleThemeMenuClose = () => {
    setThemeMenuAnchor(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    try {
      // Clear all Kelmah storage (scoped removal - never wipe entire localStorage)
      try {
        secureStorage.clear();
        sessionStorage.clear();
      } catch (storageError) {
        // Storage cleanup is non-critical — continue with logout
      }

      // Dispatch logout action
      await logout();

      // Force navigation to home
      navigate('/', { replace: true });
    } catch (error) {
      // Force clear Kelmah data and navigate (scoped removal)
      try {
        secureStorage.clear();
        sessionStorage.clear();
      } catch (clearError) {
        // Ignore — best-effort cleanup
      }

      // Force navigation even if logout fails
      navigate('/', { replace: true });
    }
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const first = user.firstName || '';
    const last = user.lastName || '';
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U';
  };

  // User menu and notifications menu are now rendered via <UserMenu> and <NotificationBells> components

  if (authState.isLoading || !authState.isReady) {
    return (
      <StyledAppBar position="static" elevation={0}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          {' '}
          {/* Reduced from 70/80 to 56/64 */}
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <BrandLogo component={RouterLink} to="/">
              <LogoIcon>K</LogoIcon>
              <Box>
                <BrandText variant="h6">elmah</BrandText>
                <TaglineText>Ghana's Skilled Trades Platform</TaglineText>
              </Box>
            </BrandLogo>
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ActionButton onClick={toggleTheme}>
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </ActionButton>
            </Box>
          </Box>
        </Toolbar>
      </StyledAppBar>
    );
  }

  return (
    <StyledAppBar
      position={autoShowMode || isMobile ? 'fixed' : 'static'}
      elevation={0}
      sx={{
        // ✅ ENHANCED: Auto-hide animation works on mobile too
        transform:
          autoShowMode || isMobile
            ? isHeaderVisible
              ? 'translateY(0)'
              : 'translateY(-100%)'
            : 'translateY(0)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: theme.zIndex.appBar + 1,
        // Fixed positioning for auto-hide mode and mobile
        ...((autoShowMode || isMobile) && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
        }),
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 48, sm: 48, md: 56 }, // ✅ MOBILE-AUDIT FIX: 48px min for touch targets
          px: { xs: 1, sm: 2, md: 3 },
          py: { xs: 0.25, sm: 0.25 },
          gap: { xs: 0.5, sm: 0.75, md: 1 },
          // ✅ MOBILE-AUDIT FIX: Min 48px for touch-target compliance (was 36px)
          '@media (max-width: 899px)': {
            minHeight: '48px',
            px: 1,
            py: 0.25,
          },
        }}
      >
        {/* ✅ ENHANCED: Smart Brand/Page Title Section */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}
        >
          {/* Back Button (Mobile Only) */}
          {isMobile && currentPage.showBackButton && showUserFeatures && (
            <ActionButton
              onClick={() => navigate(-1)}
              aria-label="Go back"
              sx={{
                mr: 1,
                '&:hover': {
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 215, 0, 0.15)'
                      : 'rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              <ArrowBackIcon sx={{ fontSize: '1.2rem' }} />
            </ActionButton>
          )}

          {/* Brand Logo or Page Title */}
          <BrandSection
            isMobile={isMobile}
            showUserFeatures={showUserFeatures}
            isOnAuthPage={isOnAuthPage}
            currentPage={currentPage}
            user={user}
          />
        </Box>

        {/* Desktop Navigation */}
        {!isMobile && <DesktopNav />}

        {/* Action Buttons - Simplified for mobile */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.5, sm: 0.75, md: 1 },
            ml: 'auto',
          }}
        >
          {/* Theme Toggle - Only show on desktop */}
          {!isMobile && (
            <Tooltip title="Theme" arrow>
              <ActionButton onClick={handleThemeMenuOpen}>
                <ColorLensIcon />
              </ActionButton>
            </Tooltip>
          )}

          {/* Show loading state during initialization */}
          {!authState.isReady ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
            </Box>
          ) : showUserFeatures ? (
            <>
              {/* Worker quick status chips - Desktop only (takes too much space on mobile) */}
              {!isMobile && user?.role === 'worker' && (
                <Stack direction="row" spacing={0.75} sx={{ mr: 0.5 }}>
                  {headerAvailability && (
                    <Chip
                      size="small"
                      label={
                        headerAvailability.isAvailable
                          ? 'Available'
                          : headerAvailability.status || 'Busy'
                      }
                      sx={{
                        backgroundColor: headerAvailability.isAvailable
                          ? 'rgba(76, 175, 80, 0.12)'
                          : 'rgba(255, 152, 0, 0.12)',
                        color: headerAvailability.isAvailable
                          ? '#4caf50'
                          : '#ff9800',
                        border:
                          theme.palette.mode === 'dark'
                            ? '1px solid rgba(255, 215, 0, 0.15)'
                            : '1px solid rgba(0, 0, 0, 0.12)',
                      }}
                      onClick={() =>
                        navigate('/worker/profile/edit?section=availability')
                      }
                      clickable
                    />
                  )}
                  {typeof headerCompletion?.completion === 'number' && (
                    <Chip
                      size="small"
                      label={`${Math.round(headerCompletion.completion)}%`}
                      sx={{
                        backgroundColor: 'rgba(255, 215, 0, 0.12)',
                        color: '#FFD700',
                        border:
                          theme.palette.mode === 'dark'
                            ? '1px solid rgba(255, 215, 0, 0.15)'
                            : '1px solid rgba(0, 0, 0, 0.12)',
                      }}
                      onClick={() => navigate('/worker/profile/edit')}
                      clickable
                    />
                  )}
                </Stack>
              )}
              {/* Messages + Notifications bells — Desktop only */}
              {!isMobile && (
                <NotificationBells
                  unreadMessages={unreadMessages}
                  unreadNotifications={unreadNotifications}
                  notifications={notifList}
                  onMessagesClick={() => navigate('/messages')}
                  onNotificationsClick={handleNotificationsOpen}
                  notificationsAnchor={notificationsAnchor}
                  onNotificationsClose={handleNotificationsClose}
                  onMarkAllRead={() => { try { markAllAsRead?.(); } catch (_) {} }}
                  onViewAll={() => navigate('/notifications')}
                />
              )}

              {/* User Avatar */}
              <Tooltip title="Account menu" arrow>
                <Box sx={{ position: 'relative', ml: 1 }}>
                  <UserAvatar onClick={handleProfileMenuOpen}>
                    {getUserInitials()}
                  </UserAvatar>
                  <StatusIndicator online={isUserOnline} />
                </Box>
              </Tooltip>
            </>
          ) : showAuthButtons && authCta ? (
            <Stack direction="row" spacing={1} sx={{ ml: 1 }}>
              {!isMobile && authCta.secondary && (
                <AuthButton
                  component={RouterLink}
                  to={authCta.secondary.to}
                  variant="outlined"
                  size="small"
                >
                  {authCta.secondary.label}
                </AuthButton>
              )}
              {authCta.primary && (
                <AuthButton
                  component={RouterLink}
                  to={authCta.primary.to}
                  variant="contained"
                  size="small"
                  sx={{
                    ...(isMobile && {
                      fontSize: '0.75rem',
                      px: 1.5,
                      py: 0.5,
                      minHeight: '44px',
                    }),
                  }}
                >
                  {isMobile ? 'Sign Up' : authCta.primary.label}
                </AuthButton>
              )}
            </Stack>
          ) : showAuthSpinner ? (
            <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
              <CircularProgress color="inherit" size={24} thickness={5} />
            </Box>
          ) : null}

          {/* Mobile Menu Button — right-aligned */}
          {isMobile && (
            <ActionButton
              aria-label="menu"
              onClick={() => setMobileMenuOpen(true)}
              sx={{
                ml: { xs: 0.5, sm: 1 },
                p: { xs: 1, sm: 1.5 },
                '&:hover': {
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 215, 0, 0.15)'
                      : 'rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              <MenuIcon sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' } }} />
            </ActionButton>
          )}
        </Box>
      </Toolbar>

      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNav
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Menus */}
      <UserMenu
        anchorEl={anchorEl}
        onClose={handleMenuClose}
        user={user}
        menuSections={buildMenuItems(user?.role)}
        currentPage={currentPage}
        isUserOnline={isUserOnline}
        onLogout={handleLogout}
        onNavigate={(path) => {
          handleMenuClose();
          navigate(path === '/support' ? '/support/help-center' : path);
        }}
      />
      <ThemeMenu
        anchorEl={themeMenuAnchor}
        open={Boolean(themeMenuAnchor)}
        onClose={handleThemeMenuClose}
      >
        <ThemeOption
          active={mode === 'light'}
          onClick={() => {
            setThemeMode('light');
            handleThemeMenuClose();
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Brightness7Icon fontSize="small" />
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                Light Mode
              </Typography>
              <Typography variant="caption" color="text.secondary">
                High contrast daytime palette
              </Typography>
            </Box>
          </Stack>
        </ThemeOption>
        <ThemeOption
          active={mode === 'dark'}
          onClick={() => {
            setThemeMode('dark');
            handleThemeMenuClose();
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Brightness4Icon fontSize="small" />
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                Dark Mode
              </Typography>
              <Typography variant="caption" color="text.secondary">
                OLED-friendly evening palette
              </Typography>
            </Box>
          </Stack>
        </ThemeOption>
        <Divider sx={{ my: 1, mx: 2 }} />
        <MenuItem
          onClick={() => {
            toggleTheme();
            handleThemeMenuClose();
          }}
          sx={{ justifyContent: 'center', fontWeight: 600 }}
        >
          Quick Toggle
        </MenuItem>
      </ThemeMenu>
    </StyledAppBar>
  );
};

export default Header;

