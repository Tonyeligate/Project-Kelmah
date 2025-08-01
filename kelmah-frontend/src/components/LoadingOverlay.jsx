/**
 * Loading Overlay Component
 * 
 * Provides a full-screen loading overlay with spinner and message
 * for better user experience during async operations.
 */

import React from 'react';
import {
  Backdrop,
  CircularProgress,
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material';
import { keyframes } from '@mui/system';

// Pulse animation for the loading card
const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.02);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const LoadingOverlay = ({ 
  open = true, 
  message = 'Loading...', 
  subMessage = null,
  progress = null, // If provided, shows progress bar instead of spinner
  variant = 'default' // 'default', 'minimal', 'fullscreen'
}) => {
  if (variant === 'minimal') {
    return (
      <Backdrop
        open={open}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.3)'
        }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    );
  }

  if (variant === 'fullscreen') {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'background.default',
          zIndex: 9999
        }}
      >
        <Box textAlign="center">
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6" gutterBottom>
            {message}
          </Typography>
          {subMessage && (
            <Typography variant="body2" color="text.secondary">
              {subMessage}
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Backdrop
      open={open}
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)'
      }}
    >
      <Card
        sx={{
          minWidth: 300,
          maxWidth: 400,
          animation: `${pulseAnimation} 2s ease-in-out infinite`,
          backdropFilter: 'blur(4px)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)'
        }}
        elevation={8}
      >
        <CardContent>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={2}
            py={2}
          >
            {progress !== null ? (
              <Box sx={{ width: '100%' }}>
                <LinearProgress 
                  variant={progress >= 0 ? "determinate" : "indeterminate"}
                  value={progress >= 0 ? progress : undefined}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    mb: 2
                  }}
                />
                {progress >= 0 && (
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ display: 'block', textAlign: 'center' }}
                  >
                    {Math.round(progress)}%
                  </Typography>
                )}
              </Box>
            ) : (
              <CircularProgress size={50} />
            )}
            
            <Typography
              variant="h6"
              color="text.primary"
              textAlign="center"
              gutterBottom
            >
              {message}
            </Typography>
            
            {subMessage && (
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
                sx={{ maxWidth: '280px' }}
              >
                {subMessage}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </Backdrop>
  );
};

export default LoadingOverlay;