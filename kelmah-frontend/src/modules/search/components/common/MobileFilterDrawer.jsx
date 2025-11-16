import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Stack,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon, Search as SearchIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';

/**
 * MobileFilterDrawer - Bottom sheet for mobile filter controls
 * Reduces mobile filter height from 350-400px to ~100px
 */
const MobileFilterDrawer = ({
  open,
  onClose,
  onSearch,
  initialFilters = {},
}) => {
  const theme = useTheme();
  const [keyword, setKeyword] = useState(initialFilters.keyword || '');
  const [location, setLocation] = useState(initialFilters.location || '');
  const [jobType, setJobType] = useState(initialFilters.jobType || '');
  const [category, setCategory] = useState(initialFilters.category || '');

  // Vocational job categories for Ghana's skilled trades
  const jobCategories = [
    'Carpentry',
    'Masonry',
    'Plumbing',
    'Electrical Work',
    'Painting',
    'Welding',
    'Roofing',
    'Flooring',
    'HVAC',
    'Landscaping',
    'General Construction',
    'Maintenance',
  ];

  // Job types relevant to skilled trades
  const jobTypes = [
    'Full-time',
    'Part-time',
    'Contract',
    'Daily Work',
    'Project-based',
  ];

  const handleApplyFilters = () => {
    onSearch({
      keyword,
      location,
      jobType,
      category,
    });
    onClose();
  };

  const handleClearFilters = () => {
    setKeyword('');
    setLocation('');
    setJobType('');
    setCategory('');
    onSearch({});
    onClose();
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
          pb: 2,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          pb: 1,
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Filter & Sort Workers
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
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: 2,
          mx: 'auto',
          mb: 2,
        }}
      />

      <Divider />

      {/* Filter Form */}
      <Box sx={{ p: 2 }}>
        <Stack spacing={2}>
          {/* Search Keyword */}
          <TextField
            fullWidth
            label="What work do you need?"
            variant="outlined"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g., Carpenter, Plumber, Electrician"
            InputProps={{
              sx: { minHeight: '48px' }, // Touch-friendly
            }}
          />

          {/* Location */}
          <TextField
            fullWidth
            label="Where?"
            variant="outlined"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Accra, Kumasi, Tema"
            InputProps={{
              sx: { minHeight: '48px' }, // Touch-friendly
            }}
          />

          {/* Job Type */}
          <FormControl fullWidth variant="outlined">
            <InputLabel>Work Type</InputLabel>
            <Select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              label="Work Type"
              sx={{ minHeight: '48px' }} // Touch-friendly
            >
              <MenuItem value="">Any Type</MenuItem>
              {jobTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Trade Category */}
          <FormControl fullWidth variant="outlined">
            <InputLabel>Trade/Skill</InputLabel>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              label="Trade/Skill"
              sx={{ minHeight: '48px' }} // Touch-friendly
            >
              <MenuItem value="">All Trades</MenuItem>
              {jobCategories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
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
              startIcon={<SearchIcon />}
              fullWidth
              sx={{
                minHeight: '48px',
                bgcolor: theme.palette.mode === 'dark' ? '#FFD700' : '#000000',
                color: theme.palette.mode === 'dark' ? '#000000' : '#FFD700',
                '&:hover': {
                  bgcolor:
                    theme.palette.mode === 'dark' ? '#FFC700' : '#1a1a1a',
                },
              }}
            >
              Apply Filters
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
};

MobileFilterDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  initialFilters: PropTypes.object,
};

export default MobileFilterDrawer;
