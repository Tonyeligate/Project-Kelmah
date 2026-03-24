import { useState, useCallback } from 'react';
import {
  Box,
  SwipeableDrawer,
  Typography,
  IconButton,
  Button,
  Divider,
} from '@mui/material';
import { Close as CloseIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { useBreakpointDown } from '@/hooks/useResponsive';

/**
 * MobileFilterSheet — renders a FAB / text-button trigger on mobile that opens a
 * bottom-sheet (SwipeableDrawer anchor=bottom) with filter content.
 * On desktop, renders children inline.
 *
 * @param {ReactNode}  children     - filter form controls
 * @param {string}     [title]      - sheet title (default "Filters")
 * @param {Function}   [onApply]    - called when user taps "Apply"
 * @param {Function}   [onReset]    - called when user taps "Reset"
 * @param {number}     [activeCount] - badge count of active filters
 * @param {boolean}    [renderInline] - always render inline (skip bottom sheet)
 */
export default function MobileFilterSheet({
  children,
  title = 'Filters',
  onApply,
  onReset,
  activeCount = 0,
  renderInline = false,
}) {
  const isMobile = useBreakpointDown('md');
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);
  const handleApply = useCallback(() => {
    onApply?.();
    setOpen(false);
  }, [onApply]);

  // Desktop: render inline
  if (!isMobile || renderInline) return children;

  return (
    <>
      {/* Trigger button — 48px min touch target */}
      <Button
        variant="outlined"
        startIcon={<FilterIcon />}
        onClick={handleOpen}
        aria-label={activeCount > 0 ? `${title}: ${activeCount} active filters` : title}
        aria-haspopup="dialog"
        aria-expanded={open}
        sx={{
          borderColor: activeCount > 0 ? '#D4AF37' : 'divider',
          color: activeCount > 0 ? '#D4AF37' : 'text.secondary',
          minHeight: 48,
          minWidth: 48,
          fontSize: '0.9rem',
          '&:focus-visible': {
            outline: '3px solid #D4AF37',
            outlineOffset: '2px',
          },
        }}
      >
        {title} {activeCount > 0 && `(${activeCount})`}
      </Button>

      {/* Bottom sheet */}
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={handleClose}
        onOpen={handleOpen}
        disableSwipeToOpen
        ModalProps={{
          'aria-labelledby': 'filter-sheet-title',
          'aria-modal': true,
        }}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '75vh',
            pb: 'env(safe-area-inset-bottom, 0px)',
          },
        }}
      >
        {/* Drag handle */}
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 4,
              borderRadius: 2,
              bgcolor: 'grey.400',
            }}
          />
        </Box>

        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1,
          }}
        >
          <Typography variant="h6" component="h2" fontWeight={600} id="filter-sheet-title">
            {title}
          </Typography>
          <IconButton
            onClick={handleClose}
            aria-label="Close filters"
            sx={{
              minWidth: 48,
              minHeight: 48,
              '&:focus-visible': {
                outline: '3px solid #D4AF37',
                outlineOffset: '2px',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        {/* Filter content */}
        <Box sx={{ px: 2, py: 2, overflowY: 'auto' }}>{children}</Box>

        <Divider />

        {/* Action buttons — 54px min touch target */}
        <Box sx={{ display: 'flex', gap: 1, px: 2, py: 1.5 }}>
          {onReset && (
            <Button
              variant="text"
              onClick={onReset}
              sx={{
                flex: 1,
                minHeight: 54,
                fontSize: '0.95rem',
                '&:focus-visible': {
                  outline: '3px solid #D4AF37',
                  outlineOffset: '2px',
                },
              }}
            >
              Reset
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleApply}
            sx={{
              flex: 2,
              minHeight: 54,
              fontSize: '1rem',
              fontWeight: 700,
              bgcolor: '#D4AF37',
              color: '#000',
              '&:hover': { bgcolor: '#B8941F' },
              '&:focus-visible': {
                outline: '3px solid #D4AF37',
                outlineOffset: '3px',
              },
            }}
          >
            Apply Filters
          </Button>
        </Box>
      </SwipeableDrawer>
    </>
  );
}
