import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Grid, IconButton, Box, SwipeableDrawer, Typography, useTheme, InputAdornment } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useBreakpointDown } from '@/hooks/useResponsive';

const JOB_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Masonry',
  'Welding',
  'Painting',
  'HVAC',
  'Roofing',
  'Tiling',
  'Interior Design',
  'Landscaping',
  'Other',
];

const JOB_TYPES = ['full_time', 'part_time', 'contract', 'one_time'];

function JobFilters({ open, onClose, filters, onApply }) {
  const theme = useTheme();
  const isMobile = useBreakpointDown('sm');
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = (field) => (event) => {
    setLocalFilters({
      ...localFilters,
      [field]: event.target.value,
    });
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      category: '',
      job_type: '',
      min_budget: '',
      max_budget: '',
      status: 'open',
    };
    setLocalFilters(resetFilters);
    onApply(resetFilters);
    onClose();
  };

  // Shared filter field content
  const filterFields = (
    <Grid
      container
      spacing={2}
      sx={{
        '& .MuiInputBase-root': {
          minHeight: 44,
        },
      }}
    >
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Category</InputLabel>
          <Select
            value={localFilters.category}
            onChange={handleChange('category')}
            label="Category"
          >
            <MenuItem value="">All Categories</MenuItem>
            {JOB_CATEGORIES.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Job Type</InputLabel>
          <Select
            value={localFilters.job_type}
            onChange={handleChange('job_type')}
            label="Job Type"
          >
            <MenuItem value="">All Types</MenuItem>
            {JOB_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type.replace('_', ' ').toUpperCase()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={6}>
        <TextField
          fullWidth
          label="Min Budget"
          type="number"
          value={localFilters.min_budget}
          onChange={handleChange('min_budget')}
          inputProps={{ inputMode: 'decimal' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">GH₵</InputAdornment>
            ),
          }}
        />
      </Grid>

      <Grid item xs={6}>
        <TextField
          fullWidth
          label="Max Budget"
          type="number"
          value={localFilters.max_budget}
          onChange={handleChange('max_budget')}
          inputProps={{ inputMode: 'decimal' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">GH₵</InputAdornment>
            ),
          }}
        />
      </Grid>
    </Grid>
  );

  // Mobile: SwipeableDrawer bottom sheet
  if (isMobile) {
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        onOpen={() => {}}
        disableSwipeToOpen
        aria-label="Job filters"
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '90dvh',
          },
        }}
      >
        <Box sx={{ p: 2, pb: `calc(env(safe-area-inset-bottom, 0px) + 16px)`, overflowY: 'auto' }}>
          {/* Drag handle */}
          <Box sx={{ width: 40, height: 4, bgcolor: 'divider', borderRadius: 2, mx: 'auto', mb: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700}>Filter Jobs</Typography>
            <IconButton
              onClick={onClose}
              size="small"
              aria-label="Close filters"
              sx={{
                width: 44,
                height: 44,
                '&:focus-visible': {
                  outline: '3px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: '2px',
                },
              }}
            >
              <Close />
            </IconButton>
          </Box>
          {filterFields}
          <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
            <Button fullWidth variant="outlined" color="inherit" onClick={handleReset} sx={{ minHeight: 44 }}>
              Reset
            </Button>
            <Button fullWidth variant="contained" color="primary" onClick={handleApply} aria-label="Apply selected job filters" sx={{ minHeight: 44 }}>
              Apply Filters
            </Button>
          </Box>
        </Box>
      </SwipeableDrawer>
    );
  }

  // Desktop: standard Dialog
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="job-filters-title">
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <span id="job-filters-title">Filter Jobs</span>
          <IconButton
            onClick={onClose}
            size="small"
            aria-label="Close filters"
            sx={{
              width: 44,
              height: 44,
              '&:focus-visible': {
                outline: '3px solid',
                outlineColor: 'primary.main',
                outlineOffset: '2px',
              },
            }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {filterFields}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleReset} color="inherit" sx={{ minHeight: 44 }}>
          Reset
        </Button>
        <Button onClick={handleApply} variant="contained" color="primary" aria-label="Apply selected job filters" sx={{ minHeight: 44 }}>
          Apply Filters
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default JobFilters;
