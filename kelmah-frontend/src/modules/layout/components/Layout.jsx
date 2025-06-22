import React from 'react';
import PropTypes from 'prop-types';
import { Box, Container, Fade } from '@mui/material';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './sidebar/Sidebar';

/**
 * Main layout component that wraps the entire application
 * Provides consistent header, footer, and container structure
 */
const Layout = ({ children }) => {
  const location = useLocation();
  const isDashboardPage = location.pathname.includes('/dashboard') || location.pathname.startsWith('/worker') || location.pathname.startsWith('/hirer');

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      {!isDashboardPage && <Header />}
      <Fade in key={location.pathname} timeout={500}>
      {isDashboardPage ? (
        <Box sx={{ display: 'flex', flexGrow: 1 }}>
          <Sidebar />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              px: 0,
              py: 2,
            }}
          >
            {children}
          </Box>
        </Box>
      ) : (
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            py: { xs: 2, md: 4 },
          }}
        >
          <Container maxWidth="lg" sx={{ px: 0 }}>
            {children}
          </Container>
        </Box>
      )}
      </Fade>
      {!isDashboardPage && <Footer />}
    </Box>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout; 