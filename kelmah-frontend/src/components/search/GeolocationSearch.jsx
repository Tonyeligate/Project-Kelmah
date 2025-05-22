import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  Typography,
  Slider,
  Button,
  CircularProgress,
  Collapse,
  Alert,
  FormControlLabel,
  Switch,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  Search as SearchIcon,
  TravelExplore as ExploreIcon,
  Close as CloseIcon,
  Place as PlaceIcon,
  Save as SaveIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/constants';

/**
 * Geolocation-based search component for finding jobs/workers by location
 */
const GeolocationSearch = ({ onSearch, initialFilters = {} }) => {
  // State for location
  const [location, setLocation] = useState(initialFilters.location || '');
  const [latitude, setLatitude] = useState(initialFilters.latitude || null);
  const [longitude, setLongitude] = useState(initialFilters.longitude || null);
  const [radius, setRadius] = useState(initialFilters.radius || 25); // in km
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  
  // State for UI
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(null);
  const [advanced, setAdvanced] = useState(false);
  const [saveSearch, setSaveSearch] = useState(false);
  const [notifyNew, setNotifyNew] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  
  // Refs and hooks
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const debouncedLocation = useDebounce(location, 500);
  const { isAuthenticated } = useAuth();
  
  // Load Google Maps API
  useEffect(() => {
    if (!window.google && !document.getElementById('google-maps-script')) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initializeMap();
      document.head.appendChild(script);
    } else if (window.google && mapVisible && !mapInstanceRef.current) {
      initializeMap();
    }
  }, [mapVisible]);
  
  // Get location suggestions when user types
  useEffect(() => {
    if (!debouncedLocation || debouncedLocation.length < 2) {
      setLocationSuggestions([]);
      return;
    }
    
    const fetchLocationSuggestions = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/locations/suggestions`, {
          params: { query: debouncedLocation }
        });
        setLocationSuggestions(response.data.suggestions || []);
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
      }
    };
    
    fetchLocationSuggestions();
  }, [debouncedLocation]);
  
  // Initialize Google Maps
  const initializeMap = () => {
    if (!window.google || !mapRef.current) return;
    
    // Create map instance
    const mapOptions = {
      zoom: 12,
      center: { lat: latitude || 5.6037, lng: longitude || -0.1870 }, // Default to Accra if no coordinates
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    };
    
    const map = new window.google.maps.Map(mapRef.current, mapOptions);
    mapInstanceRef.current = map;
    
    // Create marker if we have coordinates
    if (latitude && longitude) {
      createMarkerAndCircle({ lat: latitude, lng: longitude });
    }
    
    // Add click event to map
    map.addListener('click', (event) => {
      const clickedLocation = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      
      // Update marker position
      createMarkerAndCircle(clickedLocation);
      
      // Reverse geocode to get address
      reverseGeocode(clickedLocation.lat, clickedLocation.lng);
      
      // Update state
      setLatitude(clickedLocation.lat);
      setLongitude(clickedLocation.lng);
    });
  };
  
  // Create or update marker and radius circle
  const createMarkerAndCircle = (position) => {
    // Remove previous marker and circle if they exist
    if (markerRef.current) markerRef.current.setMap(null);
    if (circleRef.current) circleRef.current.setMap(null);
    
    // Create new marker
    const marker = new window.google.maps.Marker({
      position,
      map: mapInstanceRef.current,
      animation: window.google.maps.Animation.DROP,
      draggable: true
    });
    
    // Add drag event listener
    marker.addListener('dragend', () => {
      const newPos = marker.getPosition();
      const newLat = newPos.lat();
      const newLng = newPos.lng();
      
      // Update state
      setLatitude(newLat);
      setLongitude(newLng);
      
      // Update circle
      if (circleRef.current) {
        circleRef.current.setCenter(newPos);
      }
      
      // Reverse geocode to get address
      reverseGeocode(newLat, newLng);
    });
    
    // Create radius circle
    const circle = new window.google.maps.Circle({
      map: mapInstanceRef.current,
      center: position,
      radius: radius * 1000, // Convert km to meters
      fillColor: '#FFA50077',
      fillOpacity: 0.2,
      strokeColor: '#FFA500',
      strokeWeight: 2
    });
    
    // Store references
    markerRef.current = marker;
    circleRef.current = circle;
    
    // Center map on the marker
    mapInstanceRef.current.setCenter(position);
  };
  
  // Update circle radius when slider changes
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius * 1000); // Convert km to meters
    }
  }, [radius]);
  
  // Get current location
  const getCurrentLocation = () => {
    setLocating(true);
    setError(null);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          
          // Update map if it exists
          if (mapInstanceRef.current) {
            const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
            createMarkerAndCircle(pos);
          }
          
          // Reverse geocode to get address
          reverseGeocode(position.coords.latitude, position.coords.longitude);
          setLocating(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError('Could not access your location. Please try entering it manually.');
          setLocating(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setLocating(false);
    }
  };
  
  // Reverse geocode coordinates to address
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/locations/reverse`, {
        params: { latitude: lat, longitude: lng }
      });
      
      if (response.data.address) {
        setLocation(response.data.address);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };
  
  // Handle location suggestion click
  const handleSuggestionClick = (suggestion) => {
    setLocation(suggestion.description);
    setLatitude(suggestion.latitude);
    setLongitude(suggestion.longitude);
    setShowLocationSuggestions(false);
    
    // Update map if it exists
    if (mapInstanceRef.current) {
      const pos = { lat: suggestion.latitude, lng: suggestion.longitude };
      createMarkerAndCircle(pos);
    }
  };
  
  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Prepare search parameters
    const searchParams = {
      location,
      latitude,
      longitude,
      radius
    };
    
    // Add notification preferences if enabled
    if (saveSearch) {
      searchParams.saveSearch = true;
      searchParams.notifyNew = notifyNew;
    }
    
    // Call parent search handler
    if (onSearch) {
      onSearch(searchParams);
    }
    
    // Save search preferences if enabled
    if (saveSearch && isAuthenticated) {
      saveSearchPreferences(searchParams);
    }
    
    setLoading(false);
  };
  
  // Save search preferences to user account
  const saveSearchPreferences = async (params) => {
    try {
      await axios.post(`${API_BASE_URL}/api/user/saved-searches`, params);
    } catch (error) {
      console.error('Error saving search preferences:', error);
    }
  };
  
  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        <LocationIcon color="primary" sx={{ mr: 1, verticalAlign: 'middle' }} />
        Location-Based Search
      </Typography>
      
      <form onSubmit={handleSearch}>
        <Box sx={{ position: 'relative' }}>
          <TextField
            fullWidth
            label="Location"
            variant="outlined"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setShowLocationSuggestions(true);
            }}
            onFocus={() => setShowLocationSuggestions(true)}
            placeholder="Enter city, region, or address"
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PlaceIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton 
                    onClick={getCurrentLocation}
                    disabled={locating}
                    title="Use current location"
                  >
                    {locating ? (
                      <CircularProgress size={20} />
                    ) : (
                      <MyLocationIcon color="primary" />
                    )}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          {/* Location suggestions dropdown */}
          {showLocationSuggestions && locationSuggestions.length > 0 && (
            <Paper
              elevation={3}
              sx={{
                position: 'absolute',
                width: '100%',
                maxHeight: 200,
                overflowY: 'auto',
                zIndex: 10,
                mt: -2
              }}
            >
              <List dense>
                {locationSuggestions.map((suggestion, index) => (
                  <ListItem 
                    key={index} 
                    button 
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <LocationIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={suggestion.description}
                      secondary={suggestion.secondaryText}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <IconButton
                color="inherit"
                size="small"
                onClick={() => setError(null)}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
          >
            {error}
          </Alert>
        )}
        
        {/* Radius slider */}
        <Box sx={{ mb: 2 }}>
          <Typography gutterBottom>
            Search Radius: {radius} km
          </Typography>
          <Slider
            value={radius}
            onChange={(e, newValue) => setRadius(newValue)}
            min={1}
            max={100}
            step={1}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value} km`}
          />
        </Box>
        
        {/* Map toggle button */}
        <Button
          variant="outlined"
          startIcon={<ExploreIcon />}
          onClick={() => setMapVisible(!mapVisible)}
          sx={{ mb: 2 }}
        >
          {mapVisible ? 'Hide Map' : 'Show Map'}
        </Button>
        
        {/* Google Maps */}
        <Collapse in={mapVisible}>
          <Box
            ref={mapRef}
            sx={{
              width: '100%',
              height: 300,
              mb: 2,
              borderRadius: 1,
              overflow: 'hidden'
            }}
          />
        </Collapse>
        
        {/* Advanced options toggle */}
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={advanced}
                onChange={(e) => setAdvanced(e.target.checked)}
                color="primary"
              />
            }
            label="Advanced Options"
          />
        </Box>
        
        {/* Advanced options */}
        <Collapse in={advanced}>
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Save this search
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={saveSearch}
                  onChange={(e) => setSaveSearch(e.target.checked)}
                  disabled={!isAuthenticated}
                />
              }
              label="Save this search"
            />
            {saveSearch && (
              <FormControlLabel
                control={
                  <Switch
                    checked={notifyNew}
                    onChange={(e) => setNotifyNew(e.target.checked)}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <NotificationsIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Notify me about new matches
                  </Box>
                }
              />
            )}
            {!isAuthenticated && saveSearch && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Please log in to save searches and get notifications.
              </Alert>
            )}
          </Paper>
        </Collapse>
        
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          disabled={loading || !location}
          startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
        >
          {loading ? 'Searching...' : 'Search by Location'}
        </Button>
      </form>
    </Paper>
  );
};

export default GeolocationSearch; 