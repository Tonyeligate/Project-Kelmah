import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  IconButton,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Switch,
  FormControlLabel,
  Slider,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
  useTheme,
  alpha,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Map as MapIcon,
  Explore as ExploreIcon,
  NearMe as NearMeIcon,
  Place as PlaceIcon,
  TravelExplore as TravelIcon,
  LocationCity as CityIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  DirectionsCar as TransportIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import locationService from '../services/locationService';

const LocationBasedSearch = ({ 
  onLocationSelect, 
  initialLocation = null, 
  radius = 10,
  showMap = true,
  compact = false 
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  // State management
  const [currentLocation, setCurrentLocation] = useState(initialLocation);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchRadius, setSearchRadius] = useState(radius);
  const [nearbyLocations, setNearbyLocations] = useState([]);
  const [popularLocations, setPopularLocations] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Ghana regions and major cities
  const ghanaRegions = [
    {
      name: 'Greater Accra Region',
      cities: [
        { name: 'Accra', type: 'capital', jobs: 245, coordinates: [5.6037, -0.1870] },
        { name: 'Tema', type: 'city', jobs: 89, coordinates: [5.6698, 0.0166] },
        { name: 'Kasoa', type: 'city', jobs: 67, coordinates: [5.5289, -0.4177] },
        { name: 'Madina', type: 'suburb', jobs: 45, coordinates: [5.6819, -0.1676] },
        { name: 'East Legon', type: 'suburb', jobs: 78, coordinates: [5.6504, -0.1615] },
        { name: 'Airport City', type: 'district', jobs: 34, coordinates: [5.6054, -0.1699] },
        { name: 'Spintex', type: 'area', jobs: 56, coordinates: [5.6234, -0.1234] },
        { name: 'Dansoman', type: 'suburb', jobs: 23, coordinates: [5.5397, -0.2618] },
      ]
    },
    {
      name: 'Ashanti Region',
      cities: [
        { name: 'Kumasi', type: 'capital', jobs: 156, coordinates: [6.6885, -1.6244] },
        { name: 'Obuasi', type: 'city', jobs: 34, coordinates: [6.2027, -1.6634] },
        { name: 'Ejisu', type: 'town', jobs: 12, coordinates: [6.7439, -1.3690] },
        { name: 'Mampong', type: 'town', jobs: 18, coordinates: [7.0632, -1.4009] },
      ]
    },
    {
      name: 'Western Region',
      cities: [
        { name: 'Sekondi-Takoradi', type: 'capital', jobs: 98, coordinates: [4.9344, -1.7569] },
        { name: 'Tarkwa', type: 'city', jobs: 45, coordinates: [5.3006, -1.9967] },
        { name: 'Axim', type: 'town', jobs: 15, coordinates: [4.8665, -2.2405] },
      ]
    },
    {
      name: 'Central Region',
      cities: [
        { name: 'Cape Coast', type: 'capital', jobs: 67, coordinates: [5.1340, -1.2811] },
        { name: 'Winneba', type: 'city', jobs: 23, coordinates: [5.3511, -0.6250] },
        { name: 'Swedru', type: 'town', jobs: 19, coordinates: [5.5344, -0.6987] },
      ]
    },
    {
      name: 'Northern Region',
      cities: [
        { name: 'Tamale', type: 'capital', jobs: 78, coordinates: [9.4034, -0.8424] },
        { name: 'Yendi', type: 'town', jobs: 12, coordinates: [9.4427, -0.0093] },
      ]
    },
    {
      name: 'Other Regions',
      cities: [
        { name: 'Ho', type: 'capital', jobs: 34, coordinates: [6.6009, 0.4704] },
        { name: 'Koforidua', type: 'capital', jobs: 45, coordinates: [6.0936, -0.2570] },
        { name: 'Sunyani', type: 'capital', jobs: 28, coordinates: [7.3382, -2.3265] },
        { name: 'Wa', type: 'capital', jobs: 15, coordinates: [10.0606, -2.5057] },
        { name: 'Bolgatanga', type: 'capital', jobs: 18, coordinates: [10.7856, -0.8513] },
      ]
    }
  ];

  // All cities flattened for search
  const allCities = ghanaRegions.flatMap(region => 
    region.cities.map(city => ({
      ...city,
      region: region.name,
      label: `${city.name}, ${region.name}`,
      value: city.name
    }))
  );

  // Load initial data
  useEffect(() => {
    loadPopularLocations();
    loadRecentSearches();
  }, []);

  // Load popular locations
  const loadPopularLocations = async () => {
    try {
      const response = await locationService.getPopularLocations();
      setPopularLocations(response.data || []);
    } catch (error) {
      console.error('Failed to load popular locations:', error);
    }
  };

  // Load recent searches
  const loadRecentSearches = async () => {
    try {
      const response = await locationService.getRecentSearches();
      setRecentSearches(response.data || []);
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  };

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      enqueueSnackbar('Geolocation is not supported by this browser', { variant: 'error' });
      return;
    }

    setGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const location = {
            coordinates: [latitude, longitude],
            name: 'Current Location',
            type: 'current'
          };
          
          // Try to get address from coordinates
          const addressResponse = await locationService.reverseGeocode(latitude, longitude);
          if (addressResponse.data) {
            location.name = addressResponse.data.address;
            location.city = addressResponse.data.city;
            location.region = addressResponse.data.region;
          }
          
          setCurrentLocation(location);
          if (onLocationSelect) {
            onLocationSelect(location, searchRadius);
          }
          
          // Load nearby locations
          loadNearbyLocations(latitude, longitude);
          
          enqueueSnackbar('Location detected successfully', { variant: 'success' });
        } catch (error) {
          enqueueSnackbar('Failed to get location details', { variant: 'error' });
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        setGettingLocation(false);
        let message = 'Failed to get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        
        enqueueSnackbar(message, { variant: 'error' });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, [enqueueSnackbar, onLocationSelect, searchRadius]);

  // Load nearby locations
  const loadNearbyLocations = async (lat, lng) => {
    try {
      setLoading(true);
      const response = await locationService.getNearbyLocations(lat, lng, searchRadius);
      setNearbyLocations(response.data || []);
    } catch (error) {
      console.error('Failed to load nearby locations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle location selection
  const handleLocationSelect = async (location) => {
    setCurrentLocation(location);
    
    // Save to recent searches
    try {
      await locationService.saveRecentSearch(location);
      loadRecentSearches();
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
    
    if (onLocationSelect) {
      onLocationSelect(location, searchRadius);
    }
  };

  // Handle radius change
  const handleRadiusChange = (event, newValue) => {
    setSearchRadius(newValue);
    
    if (currentLocation && onLocationSelect) {
      onLocationSelect(currentLocation, newValue);
    }
    
    // If we have coordinates, reload nearby locations
    if (currentLocation?.coordinates) {
      loadNearbyLocations(currentLocation.coordinates[0], currentLocation.coordinates[1]);
    }
  };

  // Handle search
  const handleSearch = async (query) => {
    if (!query.trim()) return;
    
    try {
      setLoading(true);
      const response = await locationService.searchLocations(query);
      // Handle search results
      if (response.data && response.data.length > 0) {
        handleLocationSelect(response.data[0]);
      }
    } catch (error) {
      enqueueSnackbar('Search failed', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Get location type icon
  const getLocationIcon = (type) => {
    switch (type) {
      case 'capital':
        return <CityIcon color="primary" />;
      case 'city':
        return <BusinessIcon color="action" />;
      case 'current':
        return <MyLocationIcon color="secondary" />;
      default:
        return <PlaceIcon color="action" />;
    }
  };

  // Render location list item
  const renderLocationItem = (location, showJobCount = true) => (
    <ListItem key={location.name} disablePadding>
      <ListItemButton onClick={() => handleLocationSelect(location)}>
        <ListItemIcon>
          {getLocationIcon(location.type)}
        </ListItemIcon>
        <ListItemText
          primary={location.name}
          secondary={
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {location.region || location.city}
              </Typography>
              {showJobCount && location.jobs && (
                <Chip
                  label={`${location.jobs} jobs`}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              )}
            </Box>
          }
        />
      </ListItemButton>
    </ListItem>
  );

  return (
    <Box>
      {!compact && (
        <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
          <LocationIcon color="primary" />
          Location-Based Search
        </Typography>
      )}

      {/* Current Location Section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="subtitle1">Current Location</Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={gettingLocation ? <CircularProgress size={16} /> : <MyLocationIcon />}
            onClick={getCurrentLocation}
            disabled={gettingLocation}
          >
            {gettingLocation ? 'Getting Location...' : 'Use My Location'}
          </Button>
        </Box>

        {currentLocation ? (
          <Alert 
            severity="success" 
            icon={<LocationIcon />}
            action={
              <IconButton size="small" onClick={() => setCurrentLocation(null)}>
                <ClearIcon />
              </IconButton>
            }
          >
            <Typography variant="body2">
              <strong>{currentLocation.name}</strong>
              {currentLocation.region && ` • ${currentLocation.region}`}
            </Typography>
          </Alert>
        ) : (
          <Alert severity="info" icon={<ExploreIcon />}>
            <Typography variant="body2">
              Select a location to find jobs nearby
            </Typography>
          </Alert>
        )}

        {/* Search Radius */}
        {currentLocation && (
          <Box mt={2}>
            <Typography variant="body2" gutterBottom>
              Search Radius: {searchRadius} km
            </Typography>
            <Slider
              value={searchRadius}
              onChange={handleRadiusChange}
              min={1}
              max={50}
              step={1}
              marks={[
                { value: 5, label: '5km' },
                { value: 15, label: '15km' },
                { value: 30, label: '30km' },
                { value: 50, label: '50km' }
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}km`}
            />
          </Box>
        )}
      </Paper>

      {/* Location Search */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Autocomplete
          options={allCities}
          getOptionLabel={(option) => option.label || option.name}
          value={null}
          onChange={(event, newValue) => {
            if (newValue) {
              handleLocationSelect(newValue);
            }
          }}
          onInputChange={(event, newInputValue) => {
            setSearchQuery(newInputValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search Locations"
              placeholder="e.g., Accra, Kumasi, East Legon"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              <Box display="flex" alignItems="center" gap={2} width="100%">
                {getLocationIcon(option.type)}
                <Box flexGrow={1}>
                  <Typography variant="body2" fontWeight="medium">
                    {option.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.region}
                  </Typography>
                </Box>
                {option.jobs && (
                  <Chip
                    label={`${option.jobs} jobs`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                )}
              </Box>
            </Box>
          )}
          loading={loading}
        />
      </Paper>

      <Grid container spacing={2}>
        {/* Popular Locations */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom display="flex" alignItems="center" gap={1}>
                <TravelIcon color="primary" />
                Popular Locations
              </Typography>
              <List dense>
                {allCities
                  .sort((a, b) => (b.jobs || 0) - (a.jobs || 0))
                  .slice(0, 6)
                  .map((location) => renderLocationItem(location))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Regions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom display="flex" alignItems="center" gap={1}>
                <MapIcon color="primary" />
                Browse by Region
              </Typography>
              <List dense>
                {ghanaRegions.map((region) => {
                  const totalJobs = region.cities.reduce((sum, city) => sum + (city.jobs || 0), 0);
                  return (
                    <ListItem key={region.name} disablePadding>
                      <ListItemButton>
                        <ListItemIcon>
                          <CityIcon color="action" />
                        </ListItemIcon>
                        <ListItemText
                          primary={region.name}
                          secondary={
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                              <Typography variant="body2" color="text.secondary">
                                {region.cities.length} cities
                              </Typography>
                              <Chip
                                label={`${totalJobs} jobs`}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom display="flex" alignItems="center" gap={1}>
                  <ExploreIcon color="primary" />
                  Recent Searches
                </Typography>
                <List dense>
                  {recentSearches.slice(0, 5).map((location) => renderLocationItem(location, false))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Nearby Locations */}
        {nearbyLocations.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom display="flex" alignItems="center" gap={1}>
                  <NearMeIcon color="primary" />
                  Nearby Locations
                </Typography>
                <List dense>
                  {nearbyLocations.map((location) => renderLocationItem(location))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Quick Stats */}
      {currentLocation && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Location Insights
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {nearbyLocations.reduce((sum, loc) => sum + (loc.jobs || 0), 0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Nearby Jobs
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="secondary">
                  {searchRadius}km
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Search Radius
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {nearbyLocations.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Areas Covered
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main">
                  <TransportIcon />
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Transport Available
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default LocationBasedSearch;