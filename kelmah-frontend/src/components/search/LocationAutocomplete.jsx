import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Typography,
  CircularProgress,
  InputAdornment,
  IconButton,
  Tooltip,
  Button
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { alpha, styled } from '@mui/material/styles';
import axios from 'axios';
import { useDebounce } from '../../hooks/useDebounce';
import { API_BASE_URL } from '../../config/constants';

const SuggestionsContainer = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  zIndex: 10,
  width: '100%',
  maxHeight: 300,
  overflow: 'auto',
  marginTop: theme.spacing(0.5),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  borderRadius: theme.shape.borderRadius,
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '&:last-child': {
    borderBottom: 'none'
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    cursor: 'pointer'
  },
}));

const PopularLocationChip = styled(Button)(({ theme }) => ({
  margin: theme.spacing(0.5),
  fontSize: '0.8rem',
  backgroundColor: alpha(theme.palette.background.paper, 0.9),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(0.5, 1.5),
  textTransform: 'none',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    border: `1px solid ${theme.palette.primary.main}`,
  }
}));

/**
 * Location Autocomplete Component
 * 
 * @param {Object} props
 * @param {function} props.onLocationSelect - Callback when a location is selected
 * @param {Object} props.initialLocation - Initial location value
 * @param {boolean} props.showPopularLocations - Whether to show popular locations
 * @param {string} props.placeholder - Placeholder text for the input
 */
const LocationAutocomplete = ({
  onLocationSelect,
  initialLocation = null,
  showPopularLocations = true,
  placeholder = "Enter a location"
}) => {
  const [query, setQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [popularLocations, setPopularLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gettingCurrentLocation, setGettingCurrentLocation] = useState(false);
  const [error, setError] = useState('');
  
  const debouncedQuery = useDebounce(query, 300);
  const autocompleteRef = useRef(null);
  
  // Set initial location if provided
  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
      setQuery(initialLocation.formattedAddress || '');
    }
  }, [initialLocation]);
  
  // Handle outside clicks to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Fetch location suggestions when query changes
  useEffect(() => {
    const fetchLocationSuggestions = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setLocationSuggestions([]);
        return;
      }
      
      setLoading(true);
      setError('');
      
      try {
        const response = await axios.get(`${API_BASE_URL}/api/locations/suggestions`, {
          params: { query: debouncedQuery }
        });
        
        if (response.data.success) {
          setLocationSuggestions(response.data.data || []);
        } else {
          setError('Failed to fetch suggestions');
          setLocationSuggestions([]);
        }
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
        setError('Failed to fetch suggestions');
        setLocationSuggestions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLocationSuggestions();
  }, [debouncedQuery]);
  
  // Fetch popular locations on component mount
  useEffect(() => {
    if (showPopularLocations) {
      const fetchPopularLocations = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/locations/popular`);
          
          if (response.data.success) {
            setPopularLocations(response.data.data || []);
          }
        } catch (error) {
          console.error('Error fetching popular locations:', error);
        }
      };
      
      fetchPopularLocations();
    }
  }, [showPopularLocations]);
  
  // Handle location selection
  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setQuery(location.formattedAddress);
    setShowSuggestions(false);
    
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };
  
  // Handle using current location
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setGettingCurrentLocation(true);
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            const response = await axios.get(`${API_BASE_URL}/api/locations/reverse-geocode`, {
              params: { latitude, longitude }
            });
            
            if (response.data.success) {
              const locationData = response.data.data;
              handleLocationSelect({
                ...locationData,
                coordinates: { latitude, longitude }
              });
            } else {
              setError('Failed to get location details');
            }
          } catch (error) {
            console.error('Error getting location details:', error);
            setError('Failed to get location details');
          } finally {
            setGettingCurrentLocation(false);
          }
        },
        (error) => {
          console.error('Error getting current location:', error);
          setError('Failed to get your current location');
          setGettingCurrentLocation(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setError('Geolocation is not supported by this browser');
    }
  };
  
  // Handle clear location
  const handleClearLocation = () => {
    setSelectedLocation(null);
    setQuery('');
    
    if (onLocationSelect) {
      onLocationSelect(null);
    }
  };
  
  // Handle input change
  const handleInputChange = (event) => {
    const value = event.target.value;
    setQuery(value);
    
    if (value) {
      setSelectedLocation(null);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      handleClearLocation();
    }
  };

  return (
    <Box ref={autocompleteRef} sx={{ position: 'relative', width: '100%' }}>
      <TextField
        fullWidth
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onClick={() => {
          if (query && locationSuggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        onFocus={() => {
          if (query && locationSuggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        error={!!error}
        helperText={error}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LocationIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                <>
                  {query && (
                    <IconButton 
                      size="small" 
                      onClick={handleClearLocation}
                      edge="end"
                    >
                      <ClearIcon />
                    </IconButton>
                  )}
                  <Tooltip title="Use your current location">
                    <IconButton 
                      size="small" 
                      onClick={handleUseCurrentLocation}
                      disabled={gettingCurrentLocation}
                      edge="end"
                    >
                      <MyLocationIcon color={gettingCurrentLocation ? 'disabled' : 'action'} />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
                borderWidth: 2
              }
            }
          }
        }}
      />
      
      {/* Location suggestions */}
      {showSuggestions && locationSuggestions.length > 0 && (
        <SuggestionsContainer elevation={3}>
          <List disablePadding>
            {locationSuggestions.map((location, index) => (
              <StyledListItem
                key={location.id || index}
                onClick={() => handleLocationSelect(location)}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <LocationIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={location.formattedAddress}
                  secondary={location.displayName}
                  primaryTypographyProps={{
                    variant: 'body1',
                    fontWeight: 500
                  }}
                  secondaryTypographyProps={{
                    variant: 'body2',
                    color: 'textSecondary',
                    noWrap: true
                  }}
                />
              </StyledListItem>
            ))}
          </List>
        </SuggestionsContainer>
      )}
      
      {/* Popular locations */}
      {showPopularLocations && popularLocations.length > 0 && !query && !selectedLocation && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            Popular locations:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {popularLocations.map((location, index) => (
              <PopularLocationChip
                key={index}
                startIcon={<LocationIcon fontSize="small" />}
                onClick={() => {
                  setQuery(location.city + ', ' + location.country);
                  handleLocationSelect({
                    id: `popular-${index}`,
                    formattedAddress: `${location.city}, ${location.country}`,
                    displayName: `${location.city}, ${location.region || ''}, ${location.country}`,
                    city: location.city,
                    region: location.region,
                    country: location.country,
                    coordinates: location.coordinates || { latitude: null, longitude: null }
                  });
                }}
                variant="outlined"
                size="small"
              >
                {location.city}, {location.country}
              </PopularLocationChip>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default LocationAutocomplete; 