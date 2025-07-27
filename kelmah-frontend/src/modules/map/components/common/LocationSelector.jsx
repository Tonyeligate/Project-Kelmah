import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Typography,
  CircularProgress,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import mapService from '../../services/mapService';

const LocationSelector = ({
  value = '',
  onChange = () => {},
  onLocationSelect = () => {},
  placeholder = 'Enter location or address',
  showCurrentLocation = true,
  showRecentLocations = true,
  autoFocus = false,
  fullWidth = true,
  variant = 'outlined',
  size = 'medium',
  disabled = false,
  helperText = '',
  error = false,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [recentLocations, setRecentLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const inputRef = useRef();
  const searchTimeout = useRef();

  // Load recent locations from localStorage
  useEffect(() => {
    if (showRecentLocations) {
      const stored = localStorage.getItem('recentLocations');
      if (stored) {
        try {
          setRecentLocations(JSON.parse(stored));
        } catch (error) {
          console.warn('Failed to parse recent locations:', error);
        }
      }
    }
  }, [showRecentLocations]);

  // Get current location on mount
  useEffect(() => {
    if (showCurrentLocation) {
      mapService
        .getCurrentLocation()
        .then((location) => {
          mapService
            .reverseGeocode(location.latitude, location.longitude)
            .then((address) => {
              setCurrentLocation({
                ...location,
                address: address.address,
                city: address.city,
                state: address.state,
              });
            })
            .catch((error) => {
              setCurrentLocation(location);
            });
        })
        .catch((error) => {
          console.warn('Could not get current location:', error);
        });
    }
  }, [showCurrentLocation]);

  // Debounced search function
  const performSearch = useCallback(async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    try {
      const results = await mapService.geocodeAddress(query);
      setSuggestions(results.slice(0, 5));
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change
  const handleInputChange = (event) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    onChange(newValue);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (newValue.length >= 3) {
      setIsLoading(true);
      setIsOpen(true);
      searchTimeout.current = setTimeout(() => {
        performSearch(newValue);
      }, 300);
    } else {
      setSuggestions([]);
      setIsOpen(newValue.length > 0 || recentLocations.length > 0);
    }

    setSelectedIndex(-1);
  };

  // Handle location selection
  const handleLocationSelect = (location, type = 'search') => {
    setInputValue(location.address);
    setIsOpen(false);
    setSelectedIndex(-1);

    // Save to recent locations
    if (type === 'search' || type === 'current') {
      saveToRecent(location);
    }

    onLocationSelect(location);
    onChange(location.address);
  };

  // Save location to recent
  const saveToRecent = (location) => {
    if (!showRecentLocations) return;

    const newRecent = [
      location,
      ...recentLocations.filter((item) => item.address !== location.address),
    ].slice(0, 5);

    setRecentLocations(newRecent);
    localStorage.setItem('recentLocations', JSON.stringify(newRecent));
  };

  // Handle current location click
  const handleCurrentLocationClick = async () => {
    if (currentLocation) {
      handleLocationSelect(currentLocation, 'current');
      return;
    }

    setIsGettingLocation(true);
    try {
      const location = await mapService.getCurrentLocation();
      const address = await mapService.reverseGeocode(
        location.latitude,
        location.longitude,
      );

      const locationData = {
        ...location,
        address: address.address,
        city: address.city,
        state: address.state,
        coordinates: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      };

      setCurrentLocation(locationData);
      handleLocationSelect(locationData, 'current');
    } catch (error) {
      console.error('Failed to get current location:', error);
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Handle input focus
  const handleFocus = () => {
    setIsOpen(
      inputValue.length > 0 || recentLocations.length > 0 || currentLocation,
    );
  };

  // Handle input blur
  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
      setSelectedIndex(-1);
    }, 150);
  };

  // Clear input
  const handleClear = () => {
    setInputValue('');
    setSuggestions([]);
    setIsOpen(false);
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <Box sx={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
      <TextField
        ref={inputRef}
        fullWidth={fullWidth}
        variant={variant}
        size={size}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        helperText={helperText}
        autoFocus={autoFocus}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {isLoading && <CircularProgress size={20} />}
              {inputValue && !isLoading && (
                <IconButton size="small" onClick={handleClear}>
                  <ClearIcon />
                </IconButton>
              )}
            </InputAdornment>
          ),
        }}
      />

      {/* Suggestions dropdown */}
      {isOpen && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1300,
            maxHeight: 300,
            overflow: 'auto',
            mt: 1,
            boxShadow: 3,
          }}
        >
          <List disablePadding>
            {/* Current Location */}
            {currentLocation && (
              <ListItem
                button
                onClick={() => handleLocationSelect(currentLocation, 'current')}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon>
                  {isGettingLocation ? (
                    <CircularProgress size={20} />
                  ) : (
                    <MyLocationIcon color="primary" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary="Current Location"
                  secondary={currentLocation.address || 'Getting location...'}
                  primaryTypographyProps={{ fontWeight: 'medium' }}
                />
              </ListItem>
            )}

            {/* Search Suggestions */}
            {suggestions.map((suggestion, index) => (
              <ListItem
                key={`suggestion-${index}`}
                button
                onClick={() => handleLocationSelect(suggestion, 'search')}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon>
                  <LocationIcon color="action" />
                </ListItemIcon>
                <ListItemText
                  primary={suggestion.address}
                  secondary={`${suggestion.city || ''} ${suggestion.state || ''}`}
                />
              </ListItem>
            ))}

            {/* Recent Locations */}
            {recentLocations.length > 0 &&
              (suggestions.length > 0 || currentLocation) && <Divider />}

            {recentLocations.map((location, index) => (
              <ListItem
                key={`recent-${index}`}
                button
                onClick={() => handleLocationSelect(location, 'recent')}
                sx={{ py: 1 }}
              >
                <ListItemIcon>
                  <HistoryIcon color="action" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={location.address}
                  secondary={location.city}
                  primaryTypographyProps={{ fontSize: '0.875rem' }}
                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                />
              </ListItem>
            ))}

            {/* No results */}
            {!isLoading &&
              inputValue.length >= 3 &&
              suggestions.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No locations found"
                    secondary="Try a different search term"
                    primaryTypographyProps={{ color: 'text.secondary' }}
                  />
                </ListItem>
              )}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default LocationSelector;
