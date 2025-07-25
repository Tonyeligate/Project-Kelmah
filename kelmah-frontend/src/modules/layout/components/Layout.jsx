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
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isDashboardPage =
    location.pathname.includes('/dashboard') ||
    location.pathname.startsWith('/worker') ||
    location.pathname.startsWith('/hirer');
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);

  // Dashboard layout
  if (isDashboardPage) {
    // Desktop: permanent sidebar
    if (isMdUp) {
      return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar variant="permanent" />
          <Box component="main" sx={{ flexGrow: 1, p: 2 }}>
            <Container maxWidth="lg">{children}</Container>
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
          overflow: 'hidden',
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
            pt: '64px',
            pb: '56px',
            px: 2,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
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
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header toggleTheme={toggleTheme} mode={mode} />
      <Fade in key={location.pathname} timeout={500}>
        <Box component="main" sx={{ flexGrow: 1, py: { xs: 2, md: 4 } }}>
          <Container maxWidth="lg">{children}</Container>
        </Box>
      </Fade>
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
