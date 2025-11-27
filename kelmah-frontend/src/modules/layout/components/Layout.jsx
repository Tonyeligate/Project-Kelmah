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
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isActualMobile = useMediaQuery('(max-width: 768px)');
  // 🎯 ENHANCED: Comprehensive dashboard page detection
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
      currentPath.includes('/reviews'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);

  // Session expired banner state - moved outside conditional blocks
  const [sessionExpired, setSessionExpired] = useState(false);
  React.useEffect(() => {
    const handler = () => setSessionExpired(true);
    window.addEventListener('auth:tokenExpired', handler);
    return () => window.removeEventListener('auth:tokenExpired', handler);
  }, []);

  // Dashboard layout
  if (isDashboardPage) {
    // On mobile, render children directly (no sidebar) + bottom nav + auto-show header
    if (isActualMobile) {
      return (
        <Box
          sx={{
            width: '100%',
            minHeight: '100vh',
            position: 'relative',
          }}
        >
          <Header
            toggleTheme={toggleTheme}
            mode={mode}
            setThemeMode={setThemeMode}
          />
          {content}
          <MobileBottomNav />
        </Box>
      );
    }

    // Desktop: permanent sidebar + auto-show header
    if (isMdUp) {
      return (
        <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
          <Header
            toggleTheme={toggleTheme}
            mode={mode}
            autoShowMode={true}
            setThemeMode={setThemeMode}
          />
          <Sidebar variant="permanent" />
          {/* ✅ REMOVED: BreadcrumbNavigation - sidebar already shows current location */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              width: '100%',
              minWidth: 0, // Prevents flex item from growing beyond container
              pt: { xs: '48px', sm: '52px', md: '56px' }, // Add top padding for fixed header
              px: { xs: 1, sm: 2, md: 3 }, // Only horizontal padding
              pb: { xs: 1, sm: 2, md: 3 }, // Bottom padding
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

    // Mobile: temporary drawer + bottom nav + auto-show header (NO DUPLICATE APP BAR)
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          bgcolor: theme.palette.grey[900],
          color: theme.palette.common.white,
          overflowX: 'hidden',
          overflowY: 'auto',
        }}
      >
        <Header
          toggleTheme={toggleTheme}
          mode={mode}
          setThemeMode={setThemeMode}
        />
        {/* ✅ REMOVED: BreadcrumbNavigation - sidebar already shows current location */}
        <Sidebar
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: '100%',
            minWidth: 0,
            pt: '48px', // Further reduced from 56px to match new header height
            pb: '56px',
            px: { xs: 1, sm: 2 },
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            // Fix mobile scroll issues
            maxHeight: 'calc(100vh - 104px)', // Reduced from 112px
            position: 'relative',
          }}
        >
          {content}
        </Box>
        <MobileBottomNav />
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
      <Fade in key={location.pathname} timeout={500}>
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
            // Mobile-specific improvements - remove all padding for auth pages
            '@media (max-width: 768px)': {
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
      {/* Dynamic footer - only shows when scrolled to bottom */}
      <Footer />
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
