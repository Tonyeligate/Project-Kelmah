import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Fade, Typography, useTheme } from '@mui/material';
import { useLocation, Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Sidebar, { SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED } from './sidebar/Sidebar';
import MobileBottomNav from './MobileBottomNav';
// import BreadcrumbNavigation from '../../../components/common/BreadcrumbNavigation'; // ✅ REMOVED: Breadcrumb navigation taking up too much space
import SmartNavigation from '../../../components/common/SmartNavigation';
import { useThemeMode } from '../../../theme/ThemeProvider';
import { BOTTOM_NAV_HEIGHT, HEADER_HEIGHT_MOBILE } from '../../../constants/layout';
import { useBreakpointUp } from '@/hooks/useResponsive';
// Header functionality integrated into Header component

const DASHBOARD_PATH_PREFIXES = [
  '/dashboard',
  '/worker',
  '/hirer',
  '/messages',
  '/chat',
  '/notifications',
  '/settings',
  '/admin',
];

const DASHBOARD_EXACT_PATHS = [
  '/profile',
  '/contracts',
  '/payments',
  '/wallet',
  '/schedule',
  '/reviews',
];

const isDashboardRoute = (path = '') => {
  if (!path || path.startsWith('/worker-profile') || path.startsWith('/workers/')) {
    return false;
  }

  // Worker upload-cv alias is an authenticated workflow and should keep dashboard shell.
  if (path === '/profile/upload-cv') {
    return true;
  }

  // Keep public profile alias outside dashboard shell.
  if (path.startsWith('/profile/')) {
    return false;
  }

  if (DASHBOARD_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )) {
    return true;
  }

  if (DASHBOARD_EXACT_PATHS.includes(path)) {
    return true;
  }

  // Contract sub-routes are protected and should render with dashboard shell.
  if (path.startsWith('/contracts/')) {
    return true;
  }

  // Payment sub-routes are protected and should render with dashboard shell.
  if (path.startsWith('/payment/')) {
    return true;
  }

  return false;
};

/**
 * Main layout component that wraps the entire application
 * Provides consistent header, footer, and container structure
 */
const Layout = ({ children, toggleTheme, mode, setThemeMode }) => {
  const location = useLocation();
  const theme = useTheme();
  const themeModeContext = useThemeMode();

  const resolvedToggleTheme =
    typeof toggleTheme === 'function'
      ? toggleTheme
      : themeModeContext.toggleTheme;
  const resolvedSetThemeMode =
    typeof setThemeMode === 'function'
      ? setThemeMode
      : themeModeContext.setThemeMode;
  const resolvedMode = mode || themeModeContext.mode;

  // Use Outlet for React Router nested routes, fallback to children prop
  const content = children || <Outlet />;

  // Only show footer on homepage
  const isHomePage = location.pathname === '/' || location.pathname === '/home';
  const isMdUp = useBreakpointUp('md');
  // ✅ MOBILE-AUDIT FIX: Use MUI breakpoint instead of custom query to avoid 769-899px dead zone
  const isMobile = !isMdUp;
  const currentPath = location.pathname || '';
  const isAuthPage =
    currentPath === '/login' ||
    currentPath === '/register' ||
    currentPath === '/forgot-password' ||
    currentPath === '/role-selection' ||
    currentPath === '/mfa/setup' ||
    currentPath.startsWith('/reset-password') ||
    currentPath.startsWith('/verify-email');
  // 🎯 ENHANCED: Comprehensive dashboard page detection
  // FIX: Added missing paths that should render with dashboard sidebar layout
  const isMessagesPage =
    currentPath === '/messages' ||
    currentPath.startsWith('/messages') ||
    currentPath === '/chat' ||
    currentPath.startsWith('/chat');
  const isDashboardPage = isDashboardRoute(currentPath);

  // Session expired banner state - moved outside conditional blocks
  const [sessionExpired, setSessionExpired] = useState(false);

  // Sidebar collapse state with localStorage persistence
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kelmah-sidebar-collapsed')) === true; } catch { return false; }
  });
  const handleToggleSidebar = React.useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem('kelmah-sidebar-collapsed', JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  React.useEffect(() => {
    const handler = () => setSessionExpired(true);
    window.addEventListener('auth:tokenExpired', handler);
    return () => window.removeEventListener('auth:tokenExpired', handler);
  }, []);

  const sessionExpiredBanner = (
    <Box
      sx={{
        mb: 2,
        p: 2,
        borderRadius: 1,
        bgcolor: 'warning.light',
        color: 'black',
        border: '1px solid',
        borderColor: 'warning.main',
      }}
    >
      <Typography variant="body2" fontWeight="bold">
        Session expired
      </Typography>
      <Typography variant="caption">
        Please log in again to continue.
      </Typography>
    </Box>
  );

  const skipToContentLink = (
    <Box
      component="a"
      href="#main-content"
      sx={{
        position: 'absolute',
        left: 16,
        top: -48,
        zIndex: 1500,
        px: 2,
        py: 1,
        borderRadius: 1,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        textDecoration: 'none',
        fontWeight: 600,
        '&:focus': {
          top: 12,
        },
      }}
    >
      Skip to main content
    </Box>
  );

  // Dashboard layout
  if (isDashboardPage) {
    // ✅ MOBILE-AUDIT FIX: Two-state layout — mobile (<md) and desktop (>=md)
    // Eliminated the 769-899px "tablet gap" dead zone
    if (isMobile) {
      return (
        <Box
          sx={{
            width: '100%',
            minHeight: '100vh',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: theme.palette.background.default,
            overflowX: 'hidden',
          }}
        >
          {skipToContentLink}
          {!isMessagesPage && (
            <Header
              toggleTheme={resolvedToggleTheme}
              mode={resolvedMode}
              setThemeMode={resolvedSetThemeMode}
            />
          )}
          {/* Main content area — flex-based height, safe-area aware */}
          <Box
            component="main"
            id="main-content"
            tabIndex={-1}
            sx={{
              flex: 1,
              width: '100%',
              pt: isMessagesPage
                ? 0
                : `calc(${HEADER_HEIGHT_MOBILE}px + env(safe-area-inset-top, 0px) + 12px)`,
              // ✅ MOBILE-AUDIT FIX: Account for safe-area-inset-bottom on notched phones
              pb: `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 24px)`,
              px: { xs: 1.5, sm: 2 },
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {sessionExpired && sessionExpiredBanner}
            {content}
          </Box>
          <MobileBottomNav />
        </Box>
      );
    }

    // Desktop (>=md): permanent sidebar + auto-show header
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
          {skipToContentLink}
        <Header
          toggleTheme={resolvedToggleTheme}
          mode={resolvedMode}
          autoShowMode={true}
          setThemeMode={resolvedSetThemeMode}
        />
        <Sidebar variant="permanent" collapsed={sidebarCollapsed} onToggleCollapse={handleToggleSidebar} />
        <Box
          component="main"
          id="main-content"
          tabIndex={-1}
          sx={{
            flexGrow: 1,
            width: '100%',
            minWidth: 0,
            // Dynamic margin to match sidebar width transition
            ml: 0, // Sidebar is already part of flex flow; no manual margin needed
            transition: 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)',
            pt: { md: `${HEADER_HEIGHT_MOBILE}px` }, // Matches header minHeight on desktop
            px: { md: 3 },
            pb: { md: 3 },
          }}
        >
          {sessionExpired && sessionExpiredBanner}
          {content}
        </Box>
        <SmartNavigation />
      </Box>
    );
  }

  // Public/non-dashboard pages
  return (
    <Box
      sx={{
        width: '100%',
        overflowX: 'hidden', // Prevents horizontal scroll only
        overflowY: 'visible', // Let body handle vertical scrolling
      }}
    >
      {skipToContentLink}
      {!isAuthPage && (
        <Header
          toggleTheme={resolvedToggleTheme}
          mode={resolvedMode}
          setThemeMode={resolvedSetThemeMode}
        />
      )}
      <Fade in timeout={500}>
        <Box
          component="main"
          id="main-content"
          tabIndex={-1}
          sx={{
            width: '100%',
            minWidth: 0,
            // Fixed header on mobile (48px) needs padding-top so content isn't hidden
            // Desktop header is static so no compensation needed (except standard spacing)
            pt: isAuthPage
              ? 0
              : isHomePage
              ? 0
              : {
                  xs: `calc(${HEADER_HEIGHT_MOBILE}px + env(safe-area-inset-top, 0px) + 12px)`,
                  sm: `calc(${HEADER_HEIGHT_MOBILE}px + 16px)`,
                  md: 3,
                },
            pb: isAuthPage ? 0 : isHomePage ? 0 : { xs: 2, sm: 2.5, md: 3 },
            px: isAuthPage ? 0 : isHomePage ? 0 : { xs: 1, sm: 2, md: 3 },
            overflowX: 'hidden',
            overflowY: 'visible',
            '@media (min-width: 1px)': {
              maxWidth: '100vw',
              boxSizing: 'border-box',
            },
          }}
        >
          {content}
        </Box>
      </Fade>
      {/* Footer hidden on mobile — bottom nav replaces it (Binance pattern) */}
      {!isMobile && !isAuthPage && <Footer />}
    </Box>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  toggleTheme: PropTypes.func,
  mode: PropTypes.string,
  setThemeMode: PropTypes.func,
};

export default Layout;
