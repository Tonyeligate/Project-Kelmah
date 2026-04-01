import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Fade, Typography, useTheme, useMediaQuery } from '@mui/material';
import { useLocation, Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './sidebar/Sidebar';
import MobileBottomNav from './MobileBottomNav';
// import BreadcrumbNavigation from '../../../components/common/BreadcrumbNavigation'; // ✅ REMOVED: Breadcrumb navigation taking up too much space
import SmartNavigation from '../../../components/common/SmartNavigation';
import { useThemeMode } from '../../../theme/ThemeProvider';
import { HEADER_HEIGHT_MOBILE } from '../../../constants/layout';
import {
  withBottomNavSafeArea,
  withSafeAreaBottom,
  withSafeAreaTop,
} from '../../../utils/safeArea';
import useKeyboardVisible from '../../../hooks/useKeyboardVisible';
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
  if (
    !path ||
    path.startsWith('/worker-profile') ||
    path.startsWith('/workers/')
  ) {
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

  if (
    DASHBOARD_PATH_PREFIXES.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`),
    )
  ) {
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
  const prefersReducedMotion = useMediaQuery(
    '(prefers-reduced-motion: reduce)',
  );
  // ✅ MOBILE-AUDIT FIX: Use MUI breakpoint instead of custom query to avoid 769-899px dead zone
  const isMobile = !isMdUp;
  const { isKeyboardVisible } = useKeyboardVisible();
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
    try {
      return (
        JSON.parse(localStorage.getItem('kelmah-sidebar-collapsed')) === true
      );
    } catch {
      return false;
    }
  });
  const handleToggleSidebar = React.useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('kelmah-sidebar-collapsed', JSON.stringify(next));
      } catch {
        /* noop */
      }
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

  const handleSkipToContent = (event) => {
    event.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  };

  const skipToContentLink = (
    <Box
      component="a"
      href="#main-content"
      onClick={handleSkipToContent}
      sx={{
        position: 'absolute',
        left: '-9999px',
        top: 'auto',
        zIndex: 1500,
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
        whiteSpace: 'nowrap',
        border: 0,
        textDecoration: 'none',
        fontWeight: 600,
        fontSize: '0.95rem',
        lineHeight: 1.2,
        boxShadow: '0 12px 28px rgba(0, 0, 0, 0.28)',
        transition: 'top 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
        '&:focus, &:focus-visible': {
          position: 'fixed',
          left: 16,
          top: 14,
          width: 'auto',
          height: 'auto',
          overflow: 'visible',
          clip: 'auto',
          whiteSpace: 'normal',
          outline: '3px solid',
          outlineColor: 'primary.contrastText',
          outlineOffset: 3,
          boxShadow: '0 0 0 4px rgba(0,0,0,0.22), 0 16px 32px rgba(0,0,0,0.35)',
          transform: 'translateY(0) scale(1.01)',
          px: 2.5,
          py: 1.25,
          borderRadius: 999,
          bgcolor: 'secondary.main',
          color: 'secondary.contrastText',
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
            <Box component="header">
              <Header
                toggleTheme={resolvedToggleTheme}
                mode={resolvedMode}
                setThemeMode={resolvedSetThemeMode}
              />
            </Box>
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
                : `calc(${withSafeAreaTop(HEADER_HEIGHT_MOBILE + 12)} + var(--kelmah-network-banner-offset, 0px))`,
              pb: isKeyboardVisible
                ? withSafeAreaBottom(12)
                : withBottomNavSafeArea(24),
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
        <Box component="header">
          <Header
            toggleTheme={resolvedToggleTheme}
            mode={resolvedMode}
            autoShowMode={true}
            disableAutoHide={isMessagesPage}
            showPrimaryNav={false}
            setThemeMode={resolvedSetThemeMode}
          />
        </Box>
        <Box
          component="aside"
          aria-label="Sidebar navigation"
          sx={{
            pt: {
              md: `calc(${HEADER_HEIGHT_MOBILE}px + var(--kelmah-network-banner-offset, 0px))`,
            },
          }}
        >
          <Sidebar
            variant="permanent"
            collapsed={sidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
          />
        </Box>
        <Box
          component="main"
          id="main-content"
          tabIndex={-1}
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            minWidth: 0,
            minHeight: 0,
            maxWidth: isMessagesPage ? 'none' : { md: 1440, xl: 1600 },
            mx: isMessagesPage ? 0 : 'auto',
            // Dynamic margin to match sidebar width transition
            ml: 0, // Sidebar is already part of flex flow; no manual margin needed
            transition: 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)',
            pt: {
              md: isMessagesPage
                ? 0
                : `calc(${HEADER_HEIGHT_MOBILE}px + var(--kelmah-network-banner-offset, 0px))`,
            },
            px: isMessagesPage ? { md: 0 } : { md: 3 },
            pb: isMessagesPage ? { md: 0 } : { md: 3 },
            overflow: isMessagesPage ? 'hidden' : 'visible',
            borderLeft: '1px solid',
            borderColor: 'divider',
          }}
        >
          {sessionExpired && sessionExpiredBanner}
          {content}
        </Box>
        {!isMessagesPage && (
          <Box component="nav" aria-label="Quick navigation suggestions">
            <SmartNavigation />
          </Box>
        )}
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
        <Box component="header">
          <Header
            toggleTheme={resolvedToggleTheme}
            mode={resolvedMode}
            showPrimaryNav={true}
            setThemeMode={resolvedSetThemeMode}
          />
        </Box>
      )}
      <Fade in timeout={prefersReducedMotion ? 0 : 500}>
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
                    xs: `calc(${withSafeAreaTop(HEADER_HEIGHT_MOBILE + 16)} + var(--kelmah-network-banner-offset, 0px))`,
                    sm: `calc(${withSafeAreaTop(HEADER_HEIGHT_MOBILE + 20)} + var(--kelmah-network-banner-offset, 0px))`,
                    md: 3,
                  },
            pb: isAuthPage ? 0 : isHomePage ? 0 : { xs: 2.5, sm: 3, md: 3 },
            px: isAuthPage ? 0 : isHomePage ? 0 : { xs: 1.5, sm: 2.5, md: 3 },
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
