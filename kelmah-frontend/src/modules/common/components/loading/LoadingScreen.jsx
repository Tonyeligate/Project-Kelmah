import React from 'react';
import { Box, Skeleton, useMediaQuery, useTheme } from '@mui/material';

/**
 * Route-level loading screen used as Suspense fallback.
 * Shows content-shaped skeletons instead of a blocking dark overlay so users
 * perceive faster transitions — especially important on 3G / low-end devices.
 */
const LoadingScreen = ({ isLoading = true }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!isLoading) return null;

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        maxWidth: 1200,
        mx: 'auto',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      {/* Header skeleton */}
      <Skeleton variant="rectangular" height={isMobile ? 56 : 64} sx={{ borderRadius: 1, mb: 3 }} />

      {/* Content area */}
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Sidebar skeleton (desktop) */}
        {!isMobile && (
          <Box sx={{ width: 260, flexShrink: 0 }}>
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 2 }} />
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          </Box>
        )}

        {/* Main content skeletons */}
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="rectangular" height={isMobile ? 44 : 52} sx={{ borderRadius: 1, mb: 2 }} />
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={isMobile ? 100 : 140}
              sx={{ borderRadius: 2, mb: 2 }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default LoadingScreen;
