/**
 * Compact Search Bar for Jobs Page (Mobile)
 * Minimal search interface that reduces filter height from 240-280px to ~60px
 * Opens full filter drawer when "Filters" button is clicked
 */

import React from 'react';
import { Paper, TextField, Button, Box, InputAdornment } from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import PropTypes from 'prop-types';

const JobsCompactSearchBar = ({
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  onFilterClick,
  placeholder = 'Search jobs...',
}) => {
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit();
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 1,
        mb: 2,
        bgcolor: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(212,175,55,0.2)',
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {/* Search Input */}
        <TextField
          fullWidth
          size="small"
          value={searchValue}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          onKeyPress={handleSearchKeyPress}
          placeholder={placeholder}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#D4AF37' }} />
              </InputAdornment>
            ),
            sx: {
              height: '44px',
              color: 'white',
              '& fieldset': {
                borderColor: 'rgba(212,175,55,0.3)',
              },
              '&:hover fieldset': {
                borderColor: '#D4AF37',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#D4AF37',
              },
            },
          }}
          sx={{
            '& .MuiInputBase-input': {
              fontSize: '0.95rem',
              '&::placeholder': {
                color: 'rgba(255,255,255,0.6)',
                opacity: 1,
              },
            },
          }}
        />

        {/* Filter Button */}
        <Button
          variant="contained"
          onClick={onFilterClick}
          sx={{
            minWidth: '44px',
            width: '44px',
            height: '44px',
            p: 0,
            bgcolor: '#D4AF37',
            color: '#000',
            '&:hover': {
              bgcolor: '#B8941F',
            },
          }}
        >
          <FilterListIcon />
        </Button>
      </Box>
    </Paper>
  );
};

JobsCompactSearchBar.propTypes = {
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  onSearchSubmit: PropTypes.func,
  onFilterClick: PropTypes.func,
  placeholder: PropTypes.string,
};

export default JobsCompactSearchBar;
