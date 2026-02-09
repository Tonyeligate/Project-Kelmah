import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Container,
  Fade,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useLocation, Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './sidebar/Sidebar';
import MobileBottomNav from './MobileBottomNav';
// import BreadcrumbNavigation from '../../../components/common/BreadcrumbNavigation'; // ✅ REMOVED: Breadcrumb navigation taking up too much space
import SmartNavigation from '../../../components/common/SmartNavigation';
// Header functionality integrated into Header component

/**
 * Main layout component that wraps the entire application
 * Provides consistent header, footer, and container structure
 */
const Layout = ({ children, toggleTheme, mode, setThemeMode }) => {
  const location = useLocation();
  const theme = useTheme();

  // Use Outlet for React Router nested routes, fallback to children prop
  const content = children || <Outlet />;

  // Only show footer on homepage
  const isHomePage = location.pathname === '/' || location.pathname === '/home';
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  // ✅ MOBILE-AUDIT FIX: Use MUI breakpoint instead of custom query to avoid 769-899px dead zone
  const isMobile = !isMdUp;
  // 🎯 ENHANCED: Comprehensive dashboard page detection
  // FIX: Added missing paths that should render with dashboard sidebar layout
  const currentPath = location.pathname || '';
  const isPublicWorkerProfile = currentPath.startsWith('/worker-profile');
  const isDashboardPage =
    !isPublicWorkerProfile &&
    (currentPath.includes('/dashboard') ||
      currentPath.startsWith('/worker') ||
      currentPath.startsWith('/hirer') ||
      currentPath === '/dashboard' ||
      // Additional dashboard-related paths
      currentPath.includes('/profile/edit') ||
      currentPath.includes('/applications') ||
      currentPath.includes('/contracts') ||
      currentPath.includes('/payments') ||
      currentPath.includes('/wallet') ||
      currentPath.includes('/schedule') ||
      currentPath.includes('/reviews') ||
      // FIX: Added missing shared routes that need dashboard layout
      currentPath === '/notifications' ||
      currentPath.startsWith('/notifications') ||
      currentPath === '/settings' ||
      currentPath.startsWith('/settings') ||
      currentPath === '/support' ||
      currentPath.startsWith('/support') ||
      currentPath === '/profile' ||
      currentPath === '/messages' ||
      currentPath.startsWith('/messages'));

  // Session expired banner state - moved outside conditional blocks
  const [sessionExpired, setSessionExpired] = useState(false);
  React.useEffect(() => {
    const handler = () => setSessionExpired(true);
    window.addEventListener('auth:tokenExpired', handler);
    return () => window.removeEventListener('auth:tokenExpired', handler);
  }, []);

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
          <Header
            toggleTheme={toggleTheme}
            mode={mode}
            setThemeMode={setThemeMode}
          />
          {/* Main content area — flex-based height, safe-area aware */}
          <Box
            component="main"
            sx={{
              flex: 1,
              width: '100%',
              pt: '48px', // Matches header minHeight on mobile
              // ✅ MOBILE-AUDIT FIX: Account for safe-area-inset-bottom on notched phones
              pb: 'calc(56px + env(safe-area-inset-bottom, 0px) + 16px)',
              px: 1.5,
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {content}
          </Box>
          <MobileBottomNav />
        </Box>
      );
    }

    // Desktop (>=md): permanent sidebar + auto-show header
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
        <Header
          toggleTheme={toggleTheme}
          mode={mode}
          autoShowMode={true}
          setThemeMode={setThemeMode}
        />
        <Sidebar variant="permanent" />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: '100%',
            minWidth: 0,
            pt: { md: '56px' }, // Matches header minHeight on desktop
            px: { md: 3 },
            pb: { md: 3 },
          }}
        >
          {sessionExpired && (
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
          )}
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
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden', // Prevents horizontal scroll only
        overflowY: 'auto', // Allow natural vertical scrolling
      }}
    >
      <Header
        toggleTheme={toggleTheme}
        mode={mode}
        setThemeMode={setThemeMode}
      />
      <Fade in timeout={500}>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: '100%',
            minWidth: 0,
            py: { xs: 1, sm: 2, md: 3 },
            px: { xs: 1, sm: 2, md: 3 },
            overflowX: 'hidden',
            overflowY: 'visible', // Allow content to flow naturally
            // Ensure content adapts to all zoom levels
            '@media (min-width: 1px)': {
              maxWidth: '100vw',
              boxSizing: 'border-box',
            },
            // ✅ MOBILE-AUDIT FIX: Use consistent breakpoint for mobile padding reset
            '@media (max-width: 899px)': {
              py: 0,
              px: 0,
            },
            // No bottom padding needed since footer is now dynamic and fixed
            pb: { xs: 0, sm: 2, md: 3 },
          }}
        >
          {content}
        </Box>
      </Fade>
      {/* Footer only on homepage */}
      {isHomePage && <Footer />}
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
