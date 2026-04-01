import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { logout, logoutUser } from '../../auth/services/authSlice';
import {
  Toolbar,
  Typography,
  Box,
  useTheme,
  MenuItem,
  Tooltip,
  Divider,
  Chip,
  Stack,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  ColorLens as ColorLensIcon,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useBreakpointDown } from '@/hooks/useResponsive';
import DesktopNav from './DesktopNav';
import MobileNav from './MobileNav';
import { useAuthCheck } from '../../../hooks/useAuthCheck';
import { useNotifications } from '../../notifications/contexts/NotificationContext';
import MessageContext from '../../messaging/contexts/MessageContext';
import workerService from '../../worker/services/workerService';
import { secureStorage } from '../../../utils/secureStorage';
import { captureRecoverableApiError } from '@/services/errorTelemetry';

// Extracted sub-components & utilities
import {
  StyledAppBar,
  BrandLogo,
  LogoIcon,
  BrandText,
  TaglineText,
  ActionButton,
  UserAvatar,
  ThemeMenu,
  ThemeOption,
  AuthButton,
  StatusIndicator,
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
  autoShowMode = false,
  showPrimaryNav = true,
  disableAutoHide = false,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  // Use Redux auth actions directly
  const dispatch = useDispatch();
  const authState = useAuthCheck();

  // ✅ FIXED: Enable proper mobile responsiveness based on screen size
  const isMobile = useBreakpointDown('md');
  const isCompactDesktop = useBreakpointDown('lg');

  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerAvailability, setHeaderAvailability] = useState(null);
  const [headerCompletion, setHeaderCompletion] = useState(null);
  const [themeMenuAnchor, setThemeMenuAnchor] = useState(null);
  const mobileMenuButtonRef = React.useRef(null);
  const profileMenuButtonRef = React.useRef(null);

  const isMessagesRoute =
    location.pathname === '/messages' ||
    location.pathname.startsWith('/messages/') ||
    location.pathname === '/chat' ||
    location.pathname.startsWith('/chat/');

  // Auto-hide header behaviour (desktop: mouse proximity, mobile: scroll direction)
  const isHeaderVisible = useAutoHideHeader(
    autoShowMode,
    isMobile,
    disableAutoHide,
  );

  const canRenderPrimaryDesktopNav =
    !isMobile && showPrimaryNav && !isMessagesRoute;

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
            workerService.getWorkerStats(id).catch(() => null),
          ]);
          if (avail) setHeaderAvailability(avail);
          if (comp) setHeaderCompletion(comp);
        }
      } catch {
        // Non-blocking: header chips are optional
      }
    };
    loadHeaderWorkerStatus();
  }, [showUserFeatures, user?.role, user?.id, user?._id, user?.userId]);

  const currentPage = getCurrentPageInfo(location.pathname);

  // ✅ ENHANCED: Dynamic data based on user state and current page
  const {
    unreadCount: notifUnreadCount,
    notifications: notifList = [],
    markAllAsRead,
  } = useNotifications();
  const unreadNotifications = showUserFeatures ? notifUnreadCount || 0 : 0;
  // H39 fix: Wire to messaging context for real unread message count
  const messageCtx = useContext(MessageContext);
  const unreadMessages = showUserFeatures ? messageCtx?.unreadCount || 0 : 0;
  const unreadTotal = unreadMessages + unreadNotifications;
  const isUserOnline = showUserFeatures
    ? messageCtx?.isUserOnline?.(user?.id || user?._id || user?.userId) || false
    : false;

  const handleProfileMenuOpen = (event) => {
    if (!showUserFeatures) return;
    blurInteractiveTarget(event);
    if (isMobile) {
      navigate('/profile');
      return;
    }
    setAnchorEl(event.currentTarget);
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

  const blurInteractiveTarget = (event) => {
    const target = event?.currentTarget;
    if (typeof target?.blur === 'function') {
      target.blur();
    }

    const activeElement = document.activeElement;
    if (activeElement && typeof activeElement.blur === 'function') {
      activeElement.blur();
    }
  };

  const handleThemeMenuClose = () => {
    setThemeMenuAnchor(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    // Always clear local auth state first so sign-out feels instant on mobile.
    // Avoid wiping unrelated sessionStorage keys (e.g. UI preferences).
    try {
      secureStorage.clearAuthData();
    } catch (error) {
      captureRecoverableApiError(error, {
        phase: 'logout-local-clear',
        feature: 'header-logout',
        suppressUi: true,
      });
    }

    dispatch(logout());
    navigate('/', { replace: true });

    // Fire-and-forget server-side logout/revocation.
    Promise.resolve(dispatch(logoutUser())).catch((error) => {
      captureRecoverableApiError(error, {
        phase: 'logout-server',
        endpoint: '/auth/logout',
        method: 'post',
        feature: 'header-logout',
      });
    });
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const first = user.firstName || '';
    const last = user.lastName || '';
    return (
      `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() ||
      user.email?.charAt(0).toUpperCase() ||
      'U'
    );
  };

  // User menu and notifications menu are now rendered via <UserMenu> and <NotificationBells> components

  React.useEffect(() => {
    setAnchorEl(null);
    setNotificationsAnchor(null);
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

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
                <TaglineText>Ghana&apos;s Skilled Trades Platform</TaglineText>
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
          minHeight: { xs: 56, sm: 56, md: 56 },
          px: { xs: 1, sm: 2, md: 3 },
          pt: {
            xs: 'calc(env(safe-area-inset-top, 0px) + 4px)',
            sm: 'calc(env(safe-area-inset-top, 0px) + 4px)',
            md: 0.25,
          },
          pb: { xs: 0.5, sm: 0.5, md: 0.25 },
          gap: { xs: 0.5, sm: 0.75, md: 1 },
          // ✅ MOBILE-AUDIT FIX: Ensure safe-area breathing room and 56px mobile header rhythm
          '@media (max-width: 899px)': {
            minHeight: '56px',
            px: 1,
            pb: 0.5,
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
                '&:focus-visible': {
                  outline: `3px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2,
                },
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
        {canRenderPrimaryDesktopNav && <DesktopNav />}

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
            <Tooltip title="Theme options" arrow>
              <ActionButton
                onClick={handleThemeMenuOpen}
                aria-label="Open theme options"
                aria-haspopup="menu"
                aria-expanded={Boolean(themeMenuAnchor)}
                sx={{
                  '&:focus-visible': {
                    outline: `3px solid ${theme.palette.primary.main}`,
                    outlineOffset: 2,
                  },
                }}
              >
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
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  mr: { xs: 0, md: 0.75 },
                }}
              >
                {!isMobile && (
                  <NotificationBells
                    unreadMessages={unreadMessages}
                    unreadNotifications={unreadNotifications}
                    notifications={notifList}
                    onMessagesClick={() => navigate('/messages')}
                    onNotificationsClick={handleNotificationsOpen}
                    notificationsAnchor={notificationsAnchor}
                    onNotificationsClose={handleNotificationsClose}
                    onMarkAllRead={() => {
                      try {
                        markAllAsRead?.();
                      } catch (error) {
                        captureRecoverableApiError(error, {
                          phase: 'notifications-mark-all-read',
                          feature: 'header-notifications',
                          suppressUi: true,
                        });
                      }
                    }}
                    onViewAll={() => navigate('/notifications')}
                  />
                )}

                {!isMobile && unreadTotal > 0 && (
                  <Chip
                    size="small"
                    label={`${unreadTotal} unread`}
                    onClick={() =>
                      navigate(
                        unreadMessages > 0 ? '/messages' : '/notifications',
                      )
                    }
                    clickable
                    sx={{
                      ml: 0.5,
                      height: 24,
                      borderRadius: 1.5,
                      fontWeight: 700,
                      backgroundColor:
                        theme.palette.mode === 'dark'
                          ? 'rgba(255, 215, 0, 0.18)'
                          : 'rgba(18, 24, 39, 0.1)',
                      color:
                        theme.palette.mode === 'dark'
                          ? '#ffe082'
                          : 'rgba(18, 24, 39, 0.9)',
                    }}
                  />
                )}

                {!isMobile && !isCompactDesktop && user?.role === 'worker' && (
                  <Stack direction="row" spacing={0.75} sx={{ ml: 0.25 }}>
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
                            ? theme.palette.mode === 'dark'
                              ? 'rgba(102, 187, 106, 0.22)'
                              : 'rgba(76, 175, 80, 0.2)'
                            : theme.palette.mode === 'dark'
                              ? 'rgba(255, 183, 77, 0.25)'
                              : 'rgba(255, 152, 0, 0.22)',
                          color: headerAvailability.isAvailable
                            ? theme.palette.mode === 'dark'
                              ? '#c8e6c9'
                              : '#1b5e20'
                            : theme.palette.mode === 'dark'
                              ? '#ffe0b2'
                              : '#7a3e00',
                          border:
                            theme.palette.mode === 'dark'
                              ? '1px solid rgba(255, 224, 178, 0.35)'
                              : '1px solid rgba(0, 0, 0, 0.2)',
                          '& .MuiChip-label': {
                            fontSize: '0.76rem',
                            lineHeight: 1.3,
                            fontWeight: 600,
                          },
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
                          backgroundColor:
                            theme.palette.mode === 'dark'
                              ? 'rgba(255, 213, 79, 0.28)'
                              : 'rgba(255, 215, 0, 0.3)',
                          color:
                            theme.palette.mode === 'dark'
                              ? '#fff3c4'
                              : '#6b5200',
                          border:
                            theme.palette.mode === 'dark'
                              ? '1px solid rgba(255, 213, 79, 0.42)'
                              : '1px solid rgba(0, 0, 0, 0.22)',
                          '& .MuiChip-label': {
                            fontSize: '0.76rem',
                            lineHeight: 1.3,
                            fontWeight: 600,
                          },
                        }}
                        onClick={() => navigate('/worker/profile/edit')}
                        clickable
                      />
                    )}
                  </Stack>
                )}
              </Box>

              {/* User Avatar */}
              <Tooltip title={isMobile ? 'Profile' : 'Account menu'} arrow>
                <Box sx={{ position: 'relative', ml: 0.75 }}>
                  <UserAvatar
                    ref={profileMenuButtonRef}
                    onClick={handleProfileMenuOpen}
                    aria-label={isMobile ? 'Open profile' : 'Open account menu'}
                    aria-haspopup={isMobile ? undefined : 'menu'}
                    aria-expanded={isMobile ? undefined : Boolean(anchorEl)}
                  >
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
                  sx={{
                    lineHeight: 1.3,
                    letterSpacing: '0.01em',
                    fontSize: '0.86rem',
                  }}
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
                      fontSize: '0.82rem',
                      lineHeight: 1.3,
                      letterSpacing: '0.01em',
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
          {isMobile && showUserFeatures && (
            <Tooltip title="Sign out" arrow>
              <ActionButton
                aria-label="Sign out"
                onClick={handleLogout}
                sx={{
                  ml: { xs: 0.25, sm: 0.5 },
                  p: { xs: 0.9, sm: 1.1 },
                  color: 'error.main',
                  borderColor: alpha(theme.palette.error.main, 0.5),
                  '&:focus-visible': {
                    outline: `3px solid ${theme.palette.error.main}`,
                    outlineOffset: 2,
                  },
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.error.main, 0.16),
                  },
                }}
              >
                <LogoutIcon
                  sx={{ fontSize: { xs: '1.15rem', sm: '1.25rem' } }}
                />
              </ActionButton>
            </Tooltip>
          )}

          {isMobile && (
            <ActionButton
              ref={mobileMenuButtonRef}
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              onClick={(event) => {
                blurInteractiveTarget(event);
                setMobileMenuOpen(true);
              }}
              sx={{
                ml: { xs: 0.5, sm: 1 },
                p: { xs: 1, sm: 1.5 },
                '&:focus-visible': {
                  outline: `3px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2,
                },
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
      {!isMobile && (
        <UserMenu
          anchorEl={anchorEl}
          onClose={handleMenuClose}
          user={user}
          menuSections={buildMenuItems(user?.role)}
          currentPage={currentPage}
          isUserOnline={isUserOnline}
          onLogout={handleLogout}
          onNavigate={(path) => {
            navigate(path === '/support' ? '/support/help-center' : path);
          }}
        />
      )}
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
              <Typography
                variant="subtitle2"
                fontWeight={600}
                sx={{ lineHeight: 1.3, letterSpacing: '0.01em' }}
              >
                Light Mode
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: '0.78rem', lineHeight: 1.35 }}
              >
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
              <Typography
                variant="subtitle2"
                fontWeight={600}
                sx={{ lineHeight: 1.3, letterSpacing: '0.01em' }}
              >
                Dark Mode
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: '0.78rem', lineHeight: 1.35 }}
              >
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
          sx={{
            justifyContent: 'center',
            fontWeight: 600,
            lineHeight: 1.35,
            letterSpacing: '0.01em',
          }}
        >
          Quick Toggle
        </MenuItem>
      </ThemeMenu>
    </StyledAppBar>
  );
};

Header.propTypes = {
  toggleTheme: PropTypes.func,
  setThemeMode: PropTypes.func,
  mode: PropTypes.string,
  autoShowMode: PropTypes.bool,
  showPrimaryNav: PropTypes.bool,
  disableAutoHide: PropTypes.bool,
};

export default Header;
