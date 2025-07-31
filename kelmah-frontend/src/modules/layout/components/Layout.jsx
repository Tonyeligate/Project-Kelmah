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
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './sidebar/Sidebar';
import MobileBottomNav from './MobileBottomNav';

/**
 * Main layout component that wraps the entire application
 * Provides consistent header, footer, and container structure
 */
const Layout = ({ children, toggleTheme, mode }) => {
  const location = useLocation();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md')); // Use actual breakpoint for layout
  const isActualMobile = useMediaQuery('(max-width: 768px)'); // Check actual screen size
  const isDashboardPage =
    location.pathname.includes('/dashboard') ||
    location.pathname.startsWith('/worker') ||
    location.pathname.startsWith('/hirer');
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);

  // Debug logging
  console.log('🔍 Layout Debug:', {
    isDashboardPage,
    isActualMobile,
    isMdUp,
    pathname: location.pathname,
    windowWidth: typeof window !== 'undefined' ? window.innerWidth : 'unknown'
  });

  // Dashboard layout
  if (isDashboardPage) {
    // On actual mobile screens, render children directly (no sidebar/wrapper)
    if (isActualMobile) {
      console.log('✅ Layout: Rendering mobile dashboard layout');
      return (
        <Box sx={{ 
          width: '100%', 
          minHeight: '100vh',
          position: 'relative',
        }}>
          {children}
          <MobileBottomNav />
        </Box>
      );
    }
    
    // Desktop: permanent sidebar
    if (isMdUp) {
      return (
        <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
          <Sidebar variant="permanent" />
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1, 
              width: '100%',
              minWidth: 0, // Prevents flex item from growing beyond container
              p: { xs: 1, sm: 2, md: 3 },
            }}
          >
            {children}
          </Box>
        </Box>
      );
    }

    // Mobile: temporary drawer + AppBar + bottom nav
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
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            zIndex: theme.zIndex.drawer + 1,
            backgroundColor: theme.palette.secondary.main,
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap>
              Kelmah
            </Typography>
          </Toolbar>
        </AppBar>
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
            pt: '64px',
            pb: '56px',
            px: { xs: 1, sm: 2 },
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            // Fix mobile scroll issues
            maxHeight: 'calc(100vh - 120px)',
            position: 'relative',
          }}
        >
          {children}
        </Box>
        <MobileBottomNav />
      </Box>
    );
  }

  // Public/non-dashboard pages
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      width: '100%',
      overflowX: 'hidden', // Prevents horizontal scroll only
      overflowY: 'auto', // Allows vertical scroll
    }}>
      <Header toggleTheme={toggleTheme} mode={mode} />
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
            overflowY: 'auto',
            // Ensure content adapts to all zoom levels
            '@media (min-width: 1px)': {
              maxWidth: '100vw',
              boxSizing: 'border-box',
            },
            // Mobile-specific improvements
            '@media (max-width: 768px)': {
              py: { xs: 0.5, sm: 1 },
              px: { xs: 0.5, sm: 1 },
              minHeight: '100vh', // Full height since footer is now dynamic
            },
            // No bottom padding needed since footer is now dynamic and fixed
            pb: { xs: 1, sm: 2, md: 3 },
          }}
        >
          {children}
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
};

export default Layout;
