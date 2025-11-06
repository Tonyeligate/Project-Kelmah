import React from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  InputAdornment,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  Tune as FilterIcon,
} from '@mui/icons-material';
import PropTypes from 'prop-types';

/**
 * CompactSearchBar - Minimal search bar for mobile
 * Height: ~56px (search) + button = ~60px total
 * Replaces 350-400px filter form on mobile
 */
const CompactSearchBar = ({ onSearchClick, onFilterClick, placeholder = "Search workers..." }) => {
  const theme = useTheme();

  return (
    <Paper elevation={2} sx={{ p: 1, mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {/* Compact Search Input */}
        <TextField
          fullWidth
          placeholder={placeholder}
          variant="outlined"
          size="small"
          onFocus={onSearchClick}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            sx: {
              height: '44px', // Touch-friendly
              borderRadius: 2,
            },
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
          sx={{
            minWidth: '44px',
            width: '44px',
            height: '44px',
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
    </Paper>
  );
};

CompactSearchBar.propTypes = {
  onSearchClick: PropTypes.func.isRequired,
  onFilterClick: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

export default CompactSearchBar;
