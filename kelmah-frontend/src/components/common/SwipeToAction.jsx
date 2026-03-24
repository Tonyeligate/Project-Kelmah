import { useState, useRef, useCallback } from 'react';
import { Box, IconButton, useTheme } from '@mui/material';
import { DeleteOutline as DeleteIcon } from '@mui/icons-material';
import { useBreakpointDown } from '@/hooks/useResponsive';

const SWIPE_THRESHOLD = 80; // px to commit action

/**
 * SwipeToAction — wraps a list item and reveals a delete action on left-swipe on mobile.
 *
 * Accessibility:
 * - A visible "Delete" icon-button appears as keyboard fallback at the end
 *   of the item for users who cannot perform swipe gestures.
 * - aria-label on the swipe region and the fallback button.
 *
 * @param {Function}  onDelete      - called when swipe completes
 * @param {ReactNode} children      - the list item content
 * @param {boolean}   [disabled]    - disable swipe
 * @param {string}    [deleteLabel] - accessible label for delete action
 */
export default function SwipeToAction({ onDelete, children, disabled = false, deleteLabel = 'Delete' }) {
  const theme = useTheme();
  const isMobile = useBreakpointDown('md');
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

  const renderDeleteButton = () => (
    onDelete && !disabled ? (
      <IconButton
        onClick={onDelete}
        aria-label={deleteLabel}
        size="small"
        sx={{
          color: 'error.main',
          minWidth: 44,
          minHeight: 44,
          ml: isMobile ? 0 : 1,
          mt: isMobile ? 1 : 0,
          opacity: 0.72,
          alignSelf: 'flex-end',
          '&:hover': { opacity: 1, bgcolor: 'rgba(244,67,54,0.08)' },
          '&:focus-visible': {
            outline: '3px solid #D4AF37',
            outlineOffset: '2px',
          },
        }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    ) : null
  );

  // Desktop: render children with an accessible delete button fallback
  if (!isMobile) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ flex: 1 }}>{children}</Box>
        {renderDeleteButton()}
      </Box>
    );
  }

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
        role="group"
        aria-label={`Swipe left to ${deleteLabel.toLowerCase()}`}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.25,
          transform: `translateX(${offset}px)`,
          transition: swiping.current ? 'none' : 'transform 0.2s ease',
          position: 'relative',
          zIndex: 1,
          bgcolor: 'background.paper',
        }}
      >
        {children}
        {renderDeleteButton()}
      </Box>
    </Box>
  );
}
