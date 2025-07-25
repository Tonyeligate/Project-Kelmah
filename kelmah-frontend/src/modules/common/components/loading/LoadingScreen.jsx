import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingScreen = ({ isLoading = true, message = 'Loading...' }) => {
  if (!isLoading) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      }}
    >
      <CircularProgress size={60} sx={{ color: 'primary.main' }} />
      <Typography variant="h6" sx={{ mt: 2, color: 'white' }}>
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingScreen;
