import React from 'react';
import {
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ClickAwayListener,
  Typography,
  Box,
  Chip,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  School as SkillIcon,
} from '@mui/icons-material';

const SearchSuggestions = ({
  suggestions = [],
  query = '',
  popularTerms = [],
  onSuggestionSelected,
  onClose,
}) => {
  // Get appropriate icon based on suggestion type
  const getIcon = (type) => {
    switch (type) {
      case 'location':
        return <LocationIcon color="action" />;
      case 'job':
        return <WorkIcon color="action" />;
      case 'skill':
        return <SkillIcon color="action" />;
      default:
        return <SearchIcon color="action" />;
    }
  };

  const getSuggestionTypeLabel = (type) => {
    switch (type) {
      case 'location':
        return 'Location match';
      case 'job':
        return 'Trade title';
      case 'skill':
        return 'Skill match';
      default:
        return 'Suggested search';
    }
  };

  const normalizedQuery = String(query || '').trim();

  return (
    <ClickAwayListener onClickAway={onClose}>
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          width: '100%',
          zIndex: 10,
          mt: 1,
          maxHeight: 400,
          overflow: 'auto',
        }}
      >
        {suggestions.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {normalizedQuery
                ? `No direct suggestions for "${normalizedQuery}" yet.`
                : 'Start typing to see search suggestions.'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Try one of the popular searches:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {popularTerms.slice(0, 6).map((term) => (
                <Chip
                  key={term}
                  label={term}
                  size="small"
                  variant="outlined"
                  onClick={() => onSuggestionSelected({ type: 'search', text: term })}
                />
              ))}
            </Stack>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {suggestions.map((suggestion, index) => (
              <ListItem
                key={`${suggestion.type}-${index}`}
                button
                onClick={() => onSuggestionSelected(suggestion)}
                divider={index < suggestions.length - 1}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {getIcon(suggestion.type)}
                </ListItemIcon>
                <ListItemText
                  primary={suggestion.text}
                  secondary={suggestion.subText || getSuggestionTypeLabel(suggestion.type)}
                />
                <Chip
                  size="small"
                  label={getSuggestionTypeLabel(suggestion.type)}
                  variant="outlined"
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </ClickAwayListener>
  );
};

export default SearchSuggestions;
