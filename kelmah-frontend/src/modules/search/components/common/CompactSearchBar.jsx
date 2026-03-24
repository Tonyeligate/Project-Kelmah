import React from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  InputAdornment,
  IconButton,
  useTheme,
} from '@mui/material';
import { Search as SearchIcon, Tune as FilterIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';

/**
 * CompactSearchBar - Minimal search bar for mobile
 * Height: ~56px (search) + button = ~60px total
 * Replaces 350-400px filter form on mobile
 */
const CompactSearchBar = ({
  keyword = '',
  onKeywordChange,
  onSearchSubmit,
  onFilterClick,
  placeholder = 'Try "plumber Accra" or "welder Tema"',
}) => {
  const theme = useTheme();

  return (
    <Paper elevation={2} sx={{ p: { xs: 0.75, sm: 1 }, mb: 2 }}>
      <Box
        component="form"
        onSubmit={(event) => {
          event.preventDefault();
          onSearchSubmit();
        }}
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: { xs: 'stretch', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        {/* Compact Search Input */}
        <TextField
          fullWidth
          placeholder={placeholder}
          variant="outlined"
          size="small"
          type="search"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={onSearchSubmit}
                  aria-label="Run worker search"
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
                  <SearchIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              height: '44px', // Touch-friendly
              borderRadius: 2,
            },
          }}
          inputProps={{
            'aria-label': 'Search workers by trade and location',
            maxLength: 120,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.paper',
            },
          }}
        />

        {/* Filter Button */}
        <Button
          variant="contained"
          onClick={onFilterClick}
          aria-label="Open advanced worker filters"
          sx={{
            minWidth: { xs: '100%', sm: '48px' },
            width: { xs: '100%', sm: '48px' },
            height: '48px',
            p: 0,
            bgcolor: theme.palette.mode === 'dark' ? '#FFD700' : '#000000',
            color: theme.palette.mode === 'dark' ? '#000000' : '#FFD700',
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? '#FFC700' : '#1a1a1a',
            },
          }}
        >
          <FilterIcon />
        </Button>
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: { xs: 'none', sm: 'block' }, mt: 0.75, px: 0.5 }}
      >
        Tip: combine trade and area first, then use filters to narrow by rate,
        availability, or work type.
      </Typography>
    </Paper>
  );
};

CompactSearchBar.propTypes = {
  keyword: PropTypes.string,
  onKeywordChange: PropTypes.func.isRequired,
  onSearchSubmit: PropTypes.func.isRequired,
  onFilterClick: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

export default CompactSearchBar;
