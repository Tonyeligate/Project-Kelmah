import { useState, useRef, useCallback } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useMediaQuery, useTheme } from '@mui/material';

const THRESHOLD = 80; // px to pull before triggering
const MAX_PULL = 120; // max visual pull distance

/**
 * PullToRefresh — wraps scrollable content and adds pull-to-refresh on mobile.
 *
 * @param {Function}  onRefresh   – async function called on pull release
 * @param {ReactNode} children    – scrollable content
 * @param {boolean}   [disabled]  – disable the gesture
 */
export default function PullToRefresh({ onRefresh, children, disabled = false }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const containerRef = useRef(null);

  const onTouchStart = useCallback((e) => {
    if (disabled || refreshing || !isMobile) return;
    // Only activate when scrolled to top
    const scrollTop = containerRef.current?.scrollTop ?? window.scrollY;
    if (scrollTop > 5) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, [disabled, refreshing, isMobile]);

  const onTouchMove = useCallback((e) => {
    if (!pulling.current) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy < 0) { pulling.current = false; setPullDistance(0); return; }
    // Rubber-band effect: diminish after threshold
    const clamped = Math.min(dy * 0.5, MAX_PULL);
    setPullDistance(clamped);
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDistance >= THRESHOLD && onRefresh) {
      setRefreshing(true);
      try { await onRefresh(); } catch { /* noop */ }
      setRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, onRefresh]);

  if (!isMobile) return children;

  const showIndicator = pullDistance > 10 || refreshing;
  const progress = Math.min((pullDistance / THRESHOLD) * 100, 100);

  return (
    <Box
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      sx={{ position: 'relative', overflow: 'auto' }}
    >
      {/* Pull indicator */}
      {showIndicator && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            height: refreshing ? 48 : pullDistance,
            overflow: 'hidden',
            transition: pulling.current ? 'none' : 'height 0.2s ease',
          }}
        >
          <CircularProgress
            size={24}
            variant={refreshing ? 'indeterminate' : 'determinate'}
            value={progress}
            sx={{ color: '#D4AF37' }}
          />
          {refreshing && (
            <Typography variant="caption" color="text.secondary">
              Refreshing…
            </Typography>
          )}
        </Box>
      )}
      {children}
    </Box>
  );
}
