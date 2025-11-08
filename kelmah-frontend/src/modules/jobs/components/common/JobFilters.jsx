import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Box,
} from '@mui/material';
import { Close } from '@mui/icons-material';

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
  const [localFilters, setLocalFilters] = useState(filters);

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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          Filter Jobs
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
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
              InputProps={{
                startAdornment: '$',
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
              InputProps={{
                startAdornment: '$',
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleReset} color="inherit">
          Reset
        </Button>
        <Button onClick={handleApply} variant="contained" color="primary">
          Apply Filters
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default JobFilters;
