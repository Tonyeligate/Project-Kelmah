import React, { useEffect, useState } from 'react';
import { Box, Paper, Skeleton, Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useBreakpointDown } from '@/hooks/useResponsive';

/**
 * Route-level loading screen used as Suspense fallback.
 * Shows content-shaped skeletons instead of a blocking dark overlay so users
 * perceive faster transitions — especially important on 3G / low-end devices.
 */
const LoadingScreen = ({ isLoading = true, message }) => {
  const theme = useTheme();
  const isMobile = useBreakpointDown('sm');
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return () => {};
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event) => setReduceMotion(event.matches);
    setReduceMotion(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const skeletonAnimation = reduceMotion ? false : 'wave';

  if (!isLoading) return null;

  return (
    <Box
      role="status"
      aria-busy="true"
      aria-label={message || 'Loading content'}
      sx={{
        p: { xs: 1.5, sm: 3 },
        maxWidth: 1440,
        mx: 'auto',
        minHeight: '100vh',
        bgcolor: 'background.default',
        contain: 'layout paint',
        backgroundImage:
          theme.palette.mode === 'dark'
            ? `radial-gradient(circle at 12% 0%, ${alpha(theme.palette.secondary.main, 0.14)} 0%, transparent 28%), radial-gradient(circle at 90% 10%, ${alpha(theme.palette.info.main, 0.08)} 0%, transparent 24%)`
            : `radial-gradient(circle at 12% 0%, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 28%), linear-gradient(180deg, ${alpha(theme.palette.background.default, 0.98)} 0%, ${theme.palette.background.default} 100%)`,
      }}
    >
      {/* Screen-reader text */}
      <Box sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        {message || 'Loading content, please wait...'}
      </Box>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 5,
          border: '1px solid',
          borderColor: alpha(theme.palette.secondary.main, 0.18),
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(160deg, rgba(14,15,20,0.98) 0%, rgba(21,23,34,0.96) 100%)'
              : 'linear-gradient(160deg, rgba(255,255,255,0.98) 0%, rgba(244,239,227,0.96) 100%)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 28px 70px rgba(0,0,0,0.42)'
            : '0 20px 52px rgba(15,15,23,0.10)',
        }}
      >
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
              Loading your workspace
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {message || 'Preparing your dashboard, cards, and actions...'}
            </Typography>
          </Box>

          {/* Header skeleton */}
          <Skeleton animation={skeletonAnimation} variant="rectangular" height={isMobile ? 56 : 64} sx={{ borderRadius: 2 }} />

          {/* Content area */}
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
            {/* Sidebar skeleton (desktop) */}
            {!isMobile && (
              <Box sx={{ width: 260, flexShrink: 0 }}>
                <Skeleton animation={skeletonAnimation} variant="rectangular" height={200} sx={{ borderRadius: 3, mb: 2 }} />
                <Skeleton animation={skeletonAnimation} variant="rectangular" height={120} sx={{ borderRadius: 3 }} />
              </Box>
            )}

            {/* Main content skeletons */}
            <Box sx={{ flex: 1 }}>
              <Skeleton animation={skeletonAnimation} variant="rectangular" height={isMobile ? 44 : 52} sx={{ borderRadius: 2, mb: 2 }} />
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={`loading-content-skeleton-${i}`}
                  animation={skeletonAnimation}
                  variant="rectangular"
                  height={isMobile ? 100 : 140}
                  sx={{ borderRadius: 3, mb: 2 }}
                />
              ))}
            </Box>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default LoadingScreen;
