import { useState, useRef, useCallback } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { DeleteOutline as DeleteIcon } from '@mui/icons-material';

const SWIPE_THRESHOLD = 80; // px to commit action

/**
 * SwipeToAction — wraps a list item and reveals a delete action on left-swipe (mobile only).
 *
 * @param {Function}  onDelete   – called when swipe completes
 * @param {ReactNode} children   – the list item content
 * @param {boolean}   [disabled] – disable swipe
 */
export default function SwipeToAction({ onDelete, children, disabled = false }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const swiping = useRef(false);

  const onTouchStart = useCallback((e) => {
    if (disabled || !isMobile) return;
    startX.current = e.touches[0].clientX;
    swiping.current = true;
  }, [disabled, isMobile]);

  const onTouchMove = useCallback((e) => {
    if (!swiping.current) return;
    const dx = e.touches[0].clientX - startX.current;
    // Only allow left swipe (negative dx)
    if (dx > 0) { setOffset(0); return; }
    setOffset(Math.max(dx, -140)); // clamp
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!swiping.current) return;
    swiping.current = false;
    if (Math.abs(offset) >= SWIPE_THRESHOLD && onDelete) {
      // Animate off-screen then delete
      setOffset(-300);
      setTimeout(() => {
        onDelete();
        setOffset(0);
      }, 200);
    } else {
      setOffset(0);
    }
  }, [offset, onDelete]);

  if (!isMobile) return children;

  const progress = Math.min(Math.abs(offset) / SWIPE_THRESHOLD, 1);

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background action indicator */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: Math.abs(offset) || 0,
          bgcolor: `rgba(244, 67, 54, ${0.2 + progress * 0.6})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: swiping.current ? 'none' : 'all 0.2s ease',
        }}
      >
        <DeleteIcon
          sx={{
            color: 'error.main',
            opacity: progress,
            transform: `scale(${0.6 + progress * 0.4})`,
          }}
        />
      </Box>

      {/* Sliding content */}
      <Box
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        sx={{
          transform: `translateX(${offset}px)`,
          transition: swiping.current ? 'none' : 'transform 0.2s ease',
          position: 'relative',
          zIndex: 1,
          bgcolor: 'background.paper',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
