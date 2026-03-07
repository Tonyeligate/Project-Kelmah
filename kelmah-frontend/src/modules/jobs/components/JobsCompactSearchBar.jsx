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
        bgcolor: 'var(--k-bg-surface)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--k-accent-border)',
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {/* Search Input */}
        <TextField
          fullWidth
          size="small"
          value={searchValue}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          onKeyDown={handleSearchKeyPress}
          placeholder={placeholder}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'var(--k-gold)' }} />
              </InputAdornment>
            ),
            sx: {
              height: '44px',
              color: 'var(--k-text-primary)',
              '& fieldset': {
                borderColor: 'var(--k-accent-border)',
              },
              '&:hover fieldset': {
                borderColor: 'var(--k-gold)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'var(--k-gold)',
              },
            },
          }}
          sx={{
            '& .MuiInputBase-input': {
              fontSize: '0.95rem',
              '&::placeholder': {
                color: 'var(--k-text-muted)',
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
            bgcolor: 'var(--k-gold)',
            color: 'var(--k-text-on-accent)',
            '&:hover': {
              bgcolor: 'var(--k-gold-dark)',
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
