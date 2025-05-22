import React from 'react';
import { Box } from '@mui/material';
import Header from './Header';
import Footer from './Footer';

function Layout({ children }) {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh' 
    }}>
      <Header />
      <Box sx={{ 
        flexGrow: 1,
        p: 3
      }}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
}

export default Layout; 