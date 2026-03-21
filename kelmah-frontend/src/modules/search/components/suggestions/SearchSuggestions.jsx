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
                ? `No close suggestions for "${normalizedQuery}" yet. Try a trade and location, like "plumber Kumasi".`
                : 'Type a trade and location to find workers faster, like "electrician Accra".'}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 1 }}
            >
              Common searches people use:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {popularTerms.slice(0, 6).map((term) => (
                <Chip
                  key={term}
                  label={term}
                  size="small"
                  variant="outlined"
                  aria-label={`Use suggested search ${term}`}
                  onClick={() =>
                    onSuggestionSelected({ type: 'search', text: term })
                  }
                  sx={{
                    minHeight: 36,
                    maxWidth: '100%',
                    '& .MuiChip-label': { overflowWrap: 'anywhere' },
                  }}
                />
              ))}
            </Stack>
          </Box>
        ) : (
          <>
            <Box sx={{ px: 2, pt: 1.25, pb: 0.5 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', lineHeight: 1.4 }}
              >
                Suggestions are ordered by closest keyword and location match.
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', lineHeight: 1.4, mt: 0.25 }}
              >
                Tap any suggestion to run it immediately.
              </Typography>
            </Box>
            <List sx={{ py: 0 }}>
              {suggestions.map((suggestion, index) => (
                <ListItem
                  key={`${suggestion.type}-${index}`}
                  button
                  onClick={() => onSuggestionSelected(suggestion)}
                  aria-label={`Use suggestion ${suggestion.text}`}
                  divider={index < suggestions.length - 1}
                  sx={{ minHeight: 52, alignItems: 'flex-start' }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getIcon(suggestion.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={suggestion.text}
                    primaryTypographyProps={{ sx: { wordBreak: 'break-word' } }}
                    secondary={
                      suggestion.subText ||
                      getSuggestionTypeLabel(suggestion.type)
                    }
                    secondaryTypographyProps={{
                      sx: { wordBreak: 'break-word' },
                    }}
                  />
                  <Chip
                    size="small"
                    label={getSuggestionTypeLabel(suggestion.type)}
                    variant="outlined"
                    sx={{ ml: 1, flexShrink: 0, minHeight: 30 }}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Paper>
    </ClickAwayListener>
  );
};

export default SearchSuggestions;
