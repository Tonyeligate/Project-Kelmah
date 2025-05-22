import React from 'react';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  IconButton,
  Tooltip,
  ClickAwayListener
} from '@mui/material';
import { 
  Search as SearchIcon,
  Work as WorkIcon,
  LocationOn as LocationIcon,
  Build as SkillIcon,
  Business as CompanyIcon,
  Category as CategoryIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';

// Styled components
const SuggestionsContainer = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  zIndex: 10,
  width: '100%',
  maxWidth: 600,
  maxHeight: 400,
  overflow: 'auto',
  marginTop: theme.spacing(0.5),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  borderRadius: theme.shape.borderRadius,
  left: '50%',
  transform: 'translateX(-50%)',
}));

const SuggestionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1, 2),
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
}));

const SuggestionItem = styled(ListItem)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    cursor: 'pointer'
  },
}));

const NoSuggestionsMessage = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

/**
 * Search Suggestions Component
 * Displays search suggestions as user types
 * 
 * @param {Object} props
 * @param {Array} props.suggestions - Array of suggestion groups
 * @param {Function} props.onSuggestionSelected - Callback when a suggestion is selected
 * @param {Function} props.onClose - Callback to close the suggestions panel
 */
const SearchSuggestions = ({ suggestions = [], onSuggestionSelected, onClose }) => {
  // Get icon for suggestion type
  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'jobTitle':
      case 'jobTitles':
        return <WorkIcon color="primary" />;
      case 'location':
      case 'locations':
        return <LocationIcon color="primary" />;
      case 'skill':
      case 'skills':
        return <SkillIcon color="primary" />;
      case 'company':
      case 'companies':
        return <CompanyIcon color="primary" />;
      case 'category':
      case 'categories':
        return <CategoryIcon color="primary" />;
      default:
        return <SearchIcon color="primary" />;
    }
  };
  
  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    if (onSuggestionSelected) {
      onSuggestionSelected(suggestion);
    }
  };
  
  // Handle close
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };
  
  // If no suggestions, return empty fragment
  if (!suggestions || suggestions.length === 0) {
    return null;
  }
  
  return (
    <ClickAwayListener onClickAway={handleClose}>
      <SuggestionsContainer>
        <SuggestionHeader>
          <Typography variant="subtitle2" color="textSecondary">
            Search Suggestions
          </Typography>
          <Tooltip title="Close">
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </SuggestionHeader>
        
        <Divider />
        
        {suggestions.length > 0 ? (
          <List disablePadding>
            {suggestions.map((group, groupIndex) => (
              <React.Fragment key={`group-${group.type}-${groupIndex}`}>
                {group.items && group.items.length > 0 && (
                  <>
                    <Typography 
                      variant="caption" 
                      color="textSecondary" 
                      sx={{ px: 2, py: 0.5, display: 'block', backgroundColor: alpha('#f5f5f5', 0.5) }}
                    >
                      {group.title}
                    </Typography>
                    
                    {group.items.map((item, index) => (
                      <SuggestionItem 
                        key={`${group.type}-${index}`}
                        onClick={() => handleSuggestionClick(item)}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {getSuggestionIcon(item.type)}
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.text}
                          primaryTypographyProps={{
                            variant: 'body2'
                          }}
                        />
                      </SuggestionItem>
                    ))}
                    
                    {groupIndex < suggestions.length - 1 && <Divider />}
                  </>
                )}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <NoSuggestionsMessage>
            <Typography variant="body2">
              No suggestions found
            </Typography>
          </NoSuggestionsMessage>
        )}
      </SuggestionsContainer>
    </ClickAwayListener>
  );
};

export default SearchSuggestions; 