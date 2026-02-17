import { useState, useCallback } from 'react';
import {
  Box,
  SwipeableDrawer,
  Typography,
  IconButton,
  Button,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon, FilterList as FilterIcon } from '@mui/icons-material';

/**
 * MobileFilterSheet — renders a FAB / text-button trigger on mobile that opens a
 * bottom-sheet (SwipeableDrawer anchor=bottom) with filter content.
 * On desktop, renders children inline.
 *
 * @param {ReactNode}  children     – filter form controls
 * @param {string}     [title]      – sheet title (default "Filters")
 * @param {Function}   [onApply]    – called when user taps "Apply"
 * @param {Function}   [onReset]    – called when user taps "Reset"
 * @param {number}     [activeCount] – badge count of active filters
 * @param {boolean}    [renderInline] – always render inline (skip bottom sheet)
 */
export default function MobileFilterSheet({
  children,
  title = 'Filters',
  onApply,
  onReset,
  activeCount = 0,
  renderInline = false,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
      {/* Trigger button */}
      <Button
        variant="outlined"
        startIcon={<FilterIcon />}
        onClick={handleOpen}
        size="small"
        sx={{
          borderColor: activeCount > 0 ? '#D4AF37' : 'divider',
          color: activeCount > 0 ? '#D4AF37' : 'text.secondary',
          minWidth: 'auto',
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
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        {/* Filter content */}
        <Box sx={{ px: 2, py: 2, overflowY: 'auto' }}>{children}</Box>

        <Divider />

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 1, px: 2, py: 1.5 }}>
          {onReset && (
            <Button variant="text" onClick={onReset} sx={{ flex: 1 }}>
              Reset
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleApply}
            sx={{
              flex: 2,
              bgcolor: '#D4AF37',
              color: '#000',
              '&:hover': { bgcolor: '#B8941F' },
            }}
          >
            Apply Filters
          </Button>
        </Box>
      </SwipeableDrawer>
    </>
  );
}
