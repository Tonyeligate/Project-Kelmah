/**
 * Mobile Filter Drawer for Jobs Page
 * Bottom sheet with all job filters optimized for mobile touch
 * Replaces bulky inline filters (240-280px) with drawer interface
 */

import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  Slider,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon, Search as SearchIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';

const JobsMobileFilterDrawer = ({
  open,
  onClose,
  onApply,
  initialFilters = {},
  tradeCategories = [],
  locations = [],
}) => {
  const theme = useTheme();
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    location: '',
    salaryRange: [500, 10000],
    ...initialFilters,
  });

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
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '85vh',
          bgcolor: 'background.paper',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Filter & Sort Jobs
        </Typography>
        <IconButton onClick={onClose} size="small">
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
          p: 2,
          overflowY: 'auto',
          maxHeight: 'calc(85vh - 140px)',
        }}
      >
        <Stack spacing={3}>
          {/* Search Input */}
          <TextField
            label="Search jobs, skills, companies..."
            variant="outlined"
            fullWidth
            value={filters.search}
            onChange={(e) => handleFieldChange('search', e.target.value)}
            InputProps={{
              sx: { minHeight: '48px' },
            }}
          />

          {/* Category Filter */}
          <FormControl fullWidth>
            <InputLabel>Trade Category</InputLabel>
            <Select
              value={filters.category}
              label="Trade Category"
              onChange={(e) => handleFieldChange('category', e.target.value)}
              sx={{ minHeight: '48px' }}
            >
              <MenuItem value="">
                <em>All Categories</em>
              </MenuItem>
              {tradeCategories.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {cat.icon && (
                      <cat.icon
                        sx={{ mr: 1, color: '#D4AF37', fontSize: 18 }}
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
              sx={{ minHeight: '48px' }}
            >
              <MenuItem value="">
                <em>All Locations</em>
              </MenuItem>
              {locations.map((loc) => (
                <MenuItem key={loc.value} value={loc.value}>
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
              Salary Range (GHS)
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
                color: '#D4AF37',
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
                GHS {filters.salaryRange[0].toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                GHS {filters.salaryRange[1].toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Box>

      {/* Action Buttons */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          gap: 1,
        }}
      >
        <Button
          variant="outlined"
          onClick={handleClearFilters}
          fullWidth
          sx={{ minHeight: '48px' }}
        >
          Clear All
        </Button>
        <Button
          variant="contained"
          onClick={handleApplyFilters}
          fullWidth
          startIcon={<SearchIcon />}
          sx={{
            minHeight: '48px',
            bgcolor: '#D4AF37',
            color: '#000',
            '&:hover': {
              bgcolor: '#B8941F',
            },
          }}
        >
          Apply Filters
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
