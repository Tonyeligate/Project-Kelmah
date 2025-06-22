import React from 'react';
import { 
  Paper, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  ClickAwayListener, 
  Typography,
  Box
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  School as SkillIcon
} from '@mui/icons-material';

const SearchSuggestions = ({ 
  suggestions = [],
  onSuggestionSelected,
  onClose 
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
          overflow: 'auto'
        }}
      >
        {suggestions.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No suggestions found
            </Typography>
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
                  secondary={suggestion.subText}
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