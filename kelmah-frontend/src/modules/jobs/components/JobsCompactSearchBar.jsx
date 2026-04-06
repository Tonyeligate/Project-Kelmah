/**
 * Compact Search Bar for Jobs Page (Mobile)
 * Minimal search interface that reduces filter height from 240-280px to ~60px
 * Opens full filter drawer when "Filters" button is clicked
 */

import React from 'react';
import {
  Paper,
  TextField,
  Button,
  Box,
  InputAdornment,
  Typography,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import PropTypes from 'prop-types';

const JobsCompactSearchBar = ({
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  onFilterClick,
  activeFilterCount = 0,
  sortLabel = 'Most Relevant',
  placeholder = 'Search trade or role, for example plumber in Kumasi',
}) => {
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    onSearchSubmit && onSearchSubmit();
  };

  return (
    <Paper
      elevation={2}
      aria-label="Compact job search"
      sx={{
        p: 1,
        mb: 1.25,
        bgcolor: 'var(--k-bg-surface)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--k-accent-border)',
        borderRadius: 2.5,
      }}
    >
      <Box
        component="form"
        onSubmit={handleSearchSubmit}
        sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
      >
        {/* Search Input */}
        <TextField
          fullWidth
          size="small"
          value={searchValue}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          placeholder={placeholder}
          inputProps={{
            'aria-label': 'Search jobs by trade, skill, or location',
            maxLength: 120,
            autoComplete: 'off',
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'var(--k-gold)' }} />
              </InputAdornment>
            ),
            endAdornment: searchValue?.trim() ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => onSearchChange && onSearchChange('')}
                  aria-label="Clear job search input"
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
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
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
            '& .MuiInputBase-root': {
              minHeight: 44,
            },
            '& .MuiInputBase-input': {
              fontSize: '0.95rem',
              py: '12px',
              lineHeight: 1.2,
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
          type="button"
          aria-label="Open job filters panel"
          title="Open job filters"
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
      <Box
        sx={{
          mt: 0.75,
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          flexWrap: 'wrap',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'var(--k-text-muted)',
            lineHeight: 1.2,
            px: 1,
            py: 0.35,
            borderRadius: 99,
            border: '1px solid var(--k-accent-border)',
            bgcolor: 'var(--k-bg-elevated, rgba(255,255,255,0.02))',
          }}
        >
          Sort: {sortLabel}
        </Typography>
        {activeFilterCount > 0 && (
          <Typography
            variant="caption"
            sx={{
              color: 'var(--k-gold)',
              lineHeight: 1.2,
              px: 1,
              py: 0.35,
              borderRadius: 99,
              border: '1px solid var(--k-accent-border-strong)',
              bgcolor: 'var(--k-accent-soft)',
              fontWeight: 700,
            }}
          >
            {activeFilterCount} active filter
            {activeFilterCount === 1 ? '' : 's'}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

JobsCompactSearchBar.propTypes = {
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  onSearchSubmit: PropTypes.func,
  onFilterClick: PropTypes.func,
  activeFilterCount: PropTypes.number,
  sortLabel: PropTypes.string,
  placeholder: PropTypes.string,
};

export default JobsCompactSearchBar;
