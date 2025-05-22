import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Chip,
  Tooltip,
  Button
} from '@mui/material';
import {
  History as HistoryIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Notifications as NotificationIcon,
  NotificationsOff as NotificationOffIcon
} from '@mui/icons-material';
import { alpha, styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  overflow: 'hidden'
}));

const SearchTypeChip = styled(Chip)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  fontSize: '0.75rem',
  height: 24
}));

const SearchItemButton = styled(ListItem)(({ theme }) => ({
  cursor: 'pointer',
  borderRadius: theme.spacing(1),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05)
  },
  transition: 'background-color 0.2s'
}));

/**
 * SearchSuggestionHistory Component
 * Displays recent searches and allows users to save searches for later
 * 
 * @param {Object} props
 * @param {Function} props.onSelectSearch - Function to handle when a search is selected
 * @param {boolean} props.isAuthenticated - Whether the user is authenticated
 */
const SearchSuggestionHistory = ({ onSelectSearch, isAuthenticated = false }) => {
  const [recentSearches, setRecentSearches] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [activeTab, setActiveTab] = useState('recent');
  const navigate = useNavigate();

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const localRecentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(localRecentSearches);
    
    // If user is authenticated, fetch saved searches from the API
    if (isAuthenticated) {
      fetchSavedSearches();
    }
  }, [isAuthenticated]);

  // Fetch saved searches from the API
  const fetchSavedSearches = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/saved-searches`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setSavedSearches(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching saved searches:', error);
    }
  };

  // Save a search to the user's saved searches
  const saveSearch = async (searchQuery, searchParams) => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/login?redirect=search');
      return;
    }
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/users/saved-searches`, {
        query: searchQuery,
        parameters: searchParams,
        notificationsEnabled: false
      }, {
        withCredentials: true
      });
      
      if (response.data.success) {
        fetchSavedSearches();
      }
    } catch (error) {
      console.error('Error saving search:', error);
    }
  };

  // Delete a saved search
  const deleteSavedSearch = async (searchId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/users/saved-searches/${searchId}`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setSavedSearches(prev => prev.filter(search => search.id !== searchId));
      }
    } catch (error) {
      console.error('Error deleting saved search:', error);
    }
  };

  // Add a search to recent searches in localStorage
  const addToRecentSearches = (searchQuery, searchParams) => {
    const search = {
      id: Date.now().toString(),
      query: searchQuery,
      parameters: searchParams,
      timestamp: new Date().toISOString()
    };
    
    // Add to beginning of array and remove duplicates
    const updatedSearches = [
      search,
      ...recentSearches.filter(item => item.query !== searchQuery)
    ].slice(0, 10); // Keep only the 10 most recent
    
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  // Remove a search from recent searches
  const removeFromRecentSearches = (searchId) => {
    const updatedSearches = recentSearches.filter(search => search.id !== searchId);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  // Toggle notifications for a saved search
  const toggleNotifications = async (searchId, currentStatus) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/users/saved-searches/${searchId}`,
        { notificationsEnabled: !currentStatus },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setSavedSearches(prev => prev.map(search => 
          search.id === searchId 
            ? { ...search, notificationsEnabled: !search.notificationsEnabled } 
            : search
        ));
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
  };

  // Handle click on a search item
  const handleSearchClick = (search) => {
    if (onSelectSearch) {
      onSelectSearch(search.query, search.parameters);
    } else {
      // If no callback provided, navigate to search page
      const queryParams = new URLSearchParams();
      queryParams.append('q', search.query);
      
      if (search.parameters) {
        for (const [key, value] of Object.entries(search.parameters)) {
          if (value !== null && value !== undefined) {
            queryParams.append(key, value.toString());
          }
        }
      }
      
      navigate(`/search?${queryParams.toString()}`);
    }
  };

  // Format timestamp to relative time (e.g., "2 hours ago")
  const formatRelativeTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    
    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    
    return date.toLocaleDateString();
  };

  // Render the "Recent Searches" tab content
  const renderRecentSearches = () => (
    <>
      {recentSearches.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No recent searches
          </Typography>
        </Box>
      ) : (
        <>
          <List sx={{ p: 0 }}>
            {recentSearches.map((search, index) => (
              <React.Fragment key={search.id}>
                <SearchItemButton onClick={() => handleSearchClick(search)}>
                  <ListItemText 
                    primary={search.query}
                    secondary={formatRelativeTime(search.timestamp)}
                    primaryTypographyProps={{
                      noWrap: true,
                      style: { maxWidth: '200px' }
                    }}
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Save search">
                      <IconButton 
                        edge="end" 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          saveSearch(search.query, search.parameters);
                        }}
                      >
                        <BookmarkBorderIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove from history">
                      <IconButton 
                        edge="end" 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromRecentSearches(search.id);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </SearchItemButton>
                {index < recentSearches.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="text" 
              size="small"
              onClick={() => {
                setRecentSearches([]);
                localStorage.removeItem('recentSearches');
              }}
            >
              Clear All History
            </Button>
          </Box>
        </>
      )}
    </>
  );

  // Render the "Saved Searches" tab content
  const renderSavedSearches = () => (
    <>
      {!isAuthenticated ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Log in to save your searches
          </Typography>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => navigate('/login?redirect=search')}
          >
            Log In
          </Button>
        </Box>
      ) : savedSearches.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No saved searches
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {savedSearches.map((search, index) => (
            <React.Fragment key={search.id}>
              <SearchItemButton onClick={() => handleSearchClick(search)}>
                <ListItemText 
                  primary={search.query}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" component="span">
                        Saved {formatRelativeTime(search.createdAt)}
                      </Typography>
                      {search.parameters?.skills?.length > 0 && (
                        <SearchTypeChip 
                          label={search.parameters.skills.join(', ')} 
                          size="small" 
                          color="primary"
                          variant="outlined"
                        />
                      )}
                      {search.parameters?.jobType && (
                        <SearchTypeChip 
                          label={search.parameters.jobType} 
                          size="small" 
                          color="secondary"
                          variant="outlined" 
                        />
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title={search.notificationsEnabled ? "Disable notifications" : "Enable notifications"}>
                    <IconButton 
                      edge="end" 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNotifications(search.id, search.notificationsEnabled);
                      }}
                    >
                      {search.notificationsEnabled ? (
                        <NotificationIcon fontSize="small" color="primary" />
                      ) : (
                        <NotificationOffIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove saved search">
                    <IconButton 
                      edge="end" 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSavedSearch(search.id);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </SearchItemButton>
              {index < savedSearches.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}
    </>
  );

  return (
    <StyledPaper elevation={2}>
      <Box sx={{ display: 'flex', mb: 2 }}>
        <Button
          startIcon={<HistoryIcon />}
          color={activeTab === 'recent' ? 'primary' : 'inherit'}
          onClick={() => setActiveTab('recent')}
          sx={{ flexGrow: 1, borderBottom: activeTab === 'recent' ? 2 : 0 }}
        >
          Recent
        </Button>
        <Button
          startIcon={<BookmarkIcon />}
          color={activeTab === 'saved' ? 'primary' : 'inherit'}
          onClick={() => setActiveTab('saved')}
          sx={{ flexGrow: 1, borderBottom: activeTab === 'saved' ? 2 : 0 }}
        >
          Saved
        </Button>
      </Box>
      
      {activeTab === 'recent' ? renderRecentSearches() : renderSavedSearches()}
    </StyledPaper>
  );
};

export default SearchSuggestionHistory; 