import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Chip,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  History as HistoryIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

/**
 * SearchSuggestions — shows trending searches and recent search history.
 */
const TRENDING_SEARCHES = [
  'Carpenter',
  'Plumber',
  'Electrician',
  'Mason',
  'Painter',
  'Welder',
  'Tiler',
];

const SearchSuggestions = ({ recentSearches = [], onSuggestionClick }) => {
  const handleClick = (term) => {
    if (typeof onSuggestionClick === 'function') {
      onSuggestionClick(term);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Recent searches */}
      {recentSearches.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <HistoryIcon fontSize="small" /> Recent Searches
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mb: 1, lineHeight: 1.4 }}
          >
            Tap any recent search to run it again.
          </Typography>
          <List dense disablePadding>
            {recentSearches.slice(0, 5).map((term, idx) => (
              <ListItemButton
                key={`${term || 'recent-search'}-${idx}`}
                onClick={() => handleClick(term)}
                aria-label={`Use recent search ${term}`}
                sx={{ borderRadius: 1, minHeight: 44 }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <SearchIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={term}
                  primaryTypographyProps={{ sx: { overflowWrap: 'anywhere' } }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      )}

      {/* Trending */}
      <Box>
        <Typography
          variant="subtitle2"
          sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <TrendingIcon fontSize="small" /> Popular Categories
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mb: 1, lineHeight: 1.4 }}
        >
          Start with one category, then add location in the search box.
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {TRENDING_SEARCHES.map((term) => (
            <Chip
              key={term}
              label={term}
              size="small"
              variant="outlined"
              onClick={() => handleClick(term)}
              aria-label={`Use popular category ${term}`}
              sx={{ cursor: 'pointer', minHeight: 36 }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

SearchSuggestions.propTypes = {
  recentSearches: PropTypes.arrayOf(PropTypes.string),
  onSuggestionClick: PropTypes.func,
};

export default SearchSuggestions;
