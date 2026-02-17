import React, { useState } from 'react';
import {
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Collapse,
  Typography,
} from '@mui/material';
import {
  Search,
  FilterList,
  ExpandMore,
  ExpandLess,
  Clear,
} from '@mui/icons-material';

const JOB_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'one_time', label: 'One Time Project' },
];

const PROFESSIONS = [
  'Web Development',
  'Mobile Development',
  'UI/UX Design',
  'Data Science',
  'DevOps',
  'Digital Marketing',
  'Content Writing',
  'Other',
];

function SearchFilters({ filters, onFilterChange }) {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (field) => (event) => {
    onFilterChange({
      ...filters,
      [field]: event.target.value,
    });
  };

  const handleClear = () => {
    onFilterChange({
      search: '',
      profession: '',
      job_type: '',
      min_budget: '',
      max_budget: '',
      location: '',
    });
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some((value) => value !== '');
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Search jobs..."
              value={filters.search}
              onChange={handleChange('search')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              onClick={() => setExpanded(!expanded)}
              endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
              startIcon={<FilterList />}
            >
              Filters
            </Button>
            {hasActiveFilters() && (
              <Button
                variant="text"
                onClick={handleClear}
                startIcon={<Clear />}
              >
                Clear
              </Button>
            )}
          </Box>
        </Grid>
      </Grid>

      <Collapse in={expanded}>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Profession</InputLabel>
              <Select
                value={filters.profession}
                onChange={handleChange('profession')}
                label="Profession"
              >
                <MenuItem value="">All Professions</MenuItem>
                {PROFESSIONS.map((profession) => (
                  <MenuItem key={profession} value={profession}>
                    {profession}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Job Type</InputLabel>
              <Select
                value={filters.job_type}
                onChange={handleChange('job_type')}
                label="Job Type"
              >
                <MenuItem value="">All Types</MenuItem>
                {JOB_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Min Budget"
              type="number"
              value={filters.min_budget}
              onChange={handleChange('min_budget')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">GH₵</InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Max Budget"
              type="number"
              value={filters.max_budget}
              onChange={handleChange('max_budget')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">GH₵</InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Location"
              value={filters.location}
              onChange={handleChange('location')}
              placeholder="Enter location or 'Remote'"
            />
          </Grid>
        </Grid>
      </Collapse>
    </Paper>
  );
}

export default SearchFilters;
