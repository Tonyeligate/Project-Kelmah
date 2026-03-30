// IconButton focus-visible styling is enforced globally via MuiIconButton theme overrides.
/**
 * Mobile Filter Drawer for Jobs Page
 * Bottom sheet with all job filters optimized for mobile touch
 * Replaces bulky inline filters (240-280px) with drawer interface
 */
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { formatGhanaCurrency } from '@/utils/formatters';
import useKeyboardVisible from '@/hooks/useKeyboardVisible';
import { withSafeAreaBottom } from '@/utils/safeArea';













const JobsMobileFilterDrawer = ({
  open,
  onClose,
  onApply,
  initialFilters = {},
  tradeCategories = [],
  locations = [],
}) => {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    location: '',
    salaryRange: [500, 10000],
    ...initialFilters,
  });
  const { isKeyboardVisible } = useKeyboardVisible();
  const drawerMaxHeight = isKeyboardVisible ? '92dvh' : '88dvh';

  // Sync with initial filters when drawer opens
  useEffect(() => {
    if (open) {
      setFilters({
        search: initialFilters.search || '',
        category: initialFilters.category || '',
        location: initialFilters.location || '',
        salaryRange: initialFilters.salaryRange || [500, 10000],
      });
    }
  }, [open, initialFilters]);

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      category: '',
      location: '',
      salaryRange: [500, 10000],
    };
    setFilters(clearedFilters);
  };

  const handleApplyFilters = () => {
    onApply(filters);
    onClose();
  };

  const handleFieldChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: drawerMaxHeight,
          minHeight: '56dvh',
          bgcolor: 'var(--k-bg-surface)',
          border: '1px solid var(--k-accent-border)',
          borderBottom: 'none',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 1.5,
          borderBottom: '1px solid',
          borderColor: 'var(--k-accent-border)',
        }}
      >
        <Box sx={{ minWidth: 0, pr: 1 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ wordBreak: 'break-word', fontSize: '1rem', color: 'var(--k-text-primary)' }}>
            Filter & Sort Jobs
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
            Choose simple filters to find suitable jobs faster.
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="Close filters" sx={{ width: 44, height: 44 , '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: '2px' }}}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Swipe Indicator */}
      <Box
        sx={{
          width: 40,
          height: 4,
          bgcolor: 'rgba(0,0,0,0.2)',
          borderRadius: 2,
          mx: 'auto',
          mt: 1,
        }}
      />

      {/* Filter Content */}
      <Box
        sx={{
          p: 1.5,
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          maxHeight: 'none',
        }}
      >
        <Stack spacing={2.25}>
          {/* Search Input */}
          <TextField
            label="Search jobs, skills, or company"
            variant="outlined"
            fullWidth
            value={filters.search}
            onChange={(e) => handleFieldChange('search', e.target.value)}
            inputProps={{ 'aria-label': 'Filter jobs by keyword' }}
            InputProps={{
              sx: { minHeight: '48px' },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
            Example: electrician, roof repair, or painter in Accra.
          </Typography>

          {/* Category Filter */}
          <FormControl fullWidth>
            <InputLabel>Trade Category</InputLabel>
            <Select
              value={filters.category}
              label="Trade Category"
              onChange={(e) => handleFieldChange('category', e.target.value)}
              inputProps={{ 'aria-label': 'Filter jobs by trade category' }}
              sx={{ minHeight: '48px' }}
            >
              <MenuItem value="">
                <em>All Categories</em>
              </MenuItem>
              {tradeCategories.map((cat) => (
                <MenuItem key={cat.value} value={cat.value} sx={{ whiteSpace: 'normal' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {cat.icon && (
                      <cat.icon
                        sx={{ mr: 1, color: 'var(--k-gold)', fontSize: 18 }}
                      />
                    )}
                    {cat.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Location Filter */}
          <FormControl fullWidth>
            <InputLabel>Location</InputLabel>
            <Select
              value={filters.location}
              label="Location"
              onChange={(e) => handleFieldChange('location', e.target.value)}
              inputProps={{ 'aria-label': 'Filter jobs by location' }}
              sx={{ minHeight: '48px' }}
            >
              <MenuItem value="">
                <em>All Locations</em>
              </MenuItem>
              {locations.map((loc) => (
                <MenuItem key={loc.value} value={loc.value} sx={{ whiteSpace: 'normal' }}>
                  {loc.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Salary Range */}
          <Box>
            <Typography
              variant="body2"
              sx={{ mb: 2, fontWeight: 'bold', color: 'text.secondary' }}
            >
              Budget Range (GH₵)
            </Typography>
            <Slider
              value={filters.salaryRange}
              onChange={(e, newValue) =>
                handleFieldChange('salaryRange', newValue)
              }
              valueLabelDisplay="auto"
              min={500}
              max={10000}
              step={100}
              sx={{
                color: 'var(--k-gold)',
                '& .MuiSlider-thumb': {
                  width: 24,
                  height: 24,
                },
              }}
            />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 1,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {formatGhanaCurrency(filters.salaryRange[0])}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatGhanaCurrency(filters.salaryRange[1])}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Box>

      {/* Action Buttons */}
      <Box
        sx={{
          p: 1.25,
          borderTop: '1px solid',
          borderColor: 'var(--k-accent-border)',
          display: 'flex',
          gap: 1,
          position: 'sticky',
          bottom: 0,
          zIndex: 2,
          bgcolor: 'var(--k-bg-surface)',
          pb: withSafeAreaBottom(6),
        }}
      >
        <Button
          variant="outlined"
          onClick={handleClearFilters}
          fullWidth
          sx={{ minHeight: '48px' }}
        >
          Clear Filters
        </Button>
        <Button
          variant="contained"
          onClick={handleApplyFilters}
          fullWidth
          startIcon={<SearchIcon />}
          sx={{
            minHeight: '48px',
            bgcolor: 'var(--k-gold)',
            color: 'var(--k-text-on-accent)',
            '&:hover': {
              bgcolor: 'var(--k-gold-dark)',
            },
          }}
        >
          Show Jobs
        </Button>
      </Box>
    </Drawer>
  );
};

JobsMobileFilterDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  initialFilters: PropTypes.shape({
    search: PropTypes.string,
    category: PropTypes.string,
    location: PropTypes.string,
    salaryRange: PropTypes.arrayOf(PropTypes.number),
  }),
  tradeCategories: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string,
      icon: PropTypes.elementType,
    }),
  ),
  locations: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string,
    }),
  ),
};

export default JobsMobileFilterDrawer;
