import React, { useEffect, useState } from 'react';
import { Box, Skeleton, useTheme } from '@mui/material';
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
        p: { xs: 2, sm: 3 },
        maxWidth: 1200,
        mx: 'auto',
        minHeight: '100vh',
        bgcolor: 'background.default',
        contain: 'layout paint',
      }}
    >
      {/* Screen-reader text */}
      <Box sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        {message || 'Loading content, please wait...'}
      </Box>
      {/* Header skeleton */}
      <Skeleton animation={skeletonAnimation} variant="rectangular" height={isMobile ? 56 : 64} sx={{ borderRadius: 1, mb: 3 }} />

      {/* Content area */}
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Sidebar skeleton (desktop) */}
        {!isMobile && (
          <Box sx={{ width: 260, flexShrink: 0 }}>
            <Skeleton animation={skeletonAnimation} variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 2 }} />
            <Skeleton animation={skeletonAnimation} variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          </Box>
        )}

        {/* Main content skeletons */}
        <Box sx={{ flex: 1 }}>
          <Skeleton animation={skeletonAnimation} variant="rectangular" height={isMobile ? 44 : 52} sx={{ borderRadius: 1, mb: 2 }} />
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={`loading-content-skeleton-${i}`}
              animation={skeletonAnimation}
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
