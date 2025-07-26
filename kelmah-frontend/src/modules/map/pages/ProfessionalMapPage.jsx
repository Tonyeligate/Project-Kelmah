import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Fab,
  Snackbar,
  Alert,
  Backdrop,
  CircularProgress,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Work as JobIcon,
  Person as WorkerIcon,
  Search as SearchIcon,
  MyLocation as LocationIcon
} from '@mui/icons-material';
import InteractiveMap from '../components/common/InteractiveMap';
import MapSearchOverlay from '../components/common/MapSearchOverlay';
import mapService from '../services/mapService';

// Mock data - replace with real API calls
const generateMockData = (type, userLocation, count = 20) => {
  const items = [];
  const categories = ['Development', 'Design', 'Marketing', 'Writing', 'Sales'];
  const names = type === 'jobs' 
    ? ['Web Developer', 'UI Designer', 'Content Writer', 'Marketing Manager', 'Sales Rep']
    : ['John Smith', 'Sarah Johnson', 'Mike Chen', 'Lisa Garcia', 'David Wilson'];

  for (let i = 0; i < count; i++) {
    const lat = userLocation ? 
      userLocation.latitude + (Math.random() - 0.5) * 0.1 : 
      37.7749 + (Math.random() - 0.5) * 0.1;
    const lng = userLocation ? 
      userLocation.longitude + (Math.random() - 0.5) * 0.1 : 
      -122.4194 + (Math.random() - 0.5) * 0.1;

    const distance = userLocation ? 
      mapService.calculateDistance(userLocation.latitude, userLocation.longitude, lat, lng) : 
      Math.random() * 10;

    items.push({
      id: i + 1,
      title: names[i % names.length] + ` ${i + 1}`,
      name: names[i % names.length] + ` ${i + 1}`,
      description: type === 'jobs' 
        ? `Looking for ${categories[i % categories.length]} professional`
        : `Experienced ${categories[i % categories.length]} specialist`,
      bio: `Professional with 5+ years experience in ${categories[i % categories.length]}`,
      coordinates: { latitude: lat, longitude: lng },
      type: type === 'jobs' ? 'job' : 'worker',
      category: categories[i % categories.length],
      rating: 3 + Math.random() * 2,
      reviewCount: Math.floor(Math.random() * 100) + 5,
      budget: Math.floor(Math.random() * 5000) + 500,
      skills: [
        categories[i % categories.length],
        categories[(i + 1) % categories.length],
        categories[(i + 2) % categories.length]
      ],
      distance: distance,
      color: type === 'jobs' ? '#2196f3' : '#ff9800'
    });
  }

  return items.sort((a, b) => a.distance - b.distance);
};

const ProfessionalMapPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Map state
  const [mapCenter, setMapCenter] = useState([37.7749, -122.4194]);
  const [userLocation, setUserLocation] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchType, setSearchType] = useState('jobs');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // UI state
  const [showSearchOverlay, setShowSearchOverlay] = useState(true);
  const [currentFilters, setCurrentFilters] = useState({});
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Get user location on mount
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        setLoading(true);
        const location = await mapService.getCurrentLocation();
        setUserLocation(location);
        setMapCenter([location.latitude, location.longitude]);
        
        // Generate initial mock data around user location
        const mockData = generateMockData(searchType, location);
        setSearchResults(mockData);
      } catch (error) {
        console.warn('Could not get user location:', error);
        setError('Could not access your location. Using default location.');
        
        // Generate mock data for default location
        const mockData = generateMockData(searchType, null);
        setSearchResults(mockData);
      } finally {
        setLoading(false);
      }
    };

    getUserLocation();
  }, []);

  // Update search results when search type changes
  useEffect(() => {
    if (userLocation || mapCenter) {
      const mockData = generateMockData(searchType, userLocation || {
        latitude: mapCenter[0],
        longitude: mapCenter[1]
      });
      setSearchResults(mockData);
    }
  }, [searchType, userLocation, mapCenter]);

  // Handle search type change
  const handleSearchTypeChange = (event, newType) => {
    if (newType !== null) {
      setSearchType(newType);
    }
  };

  // Handle search
  const handleSearch = useCallback(async (searchParams) => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real implementation, make API call here
      console.log('Search params:', searchParams);
      
      // Generate filtered mock data
      let mockData = generateMockData(
        searchParams.type, 
        selectedLocation || userLocation
      );

      // Apply filters
      if (searchParams.query) {
        mockData = mockData.filter(item => 
          item.title.toLowerCase().includes(searchParams.query.toLowerCase()) ||
          item.description.toLowerCase().includes(searchParams.query.toLowerCase())
        );
      }

      if (searchParams.filters?.categories?.length > 0) {
        mockData = mockData.filter(item => 
          searchParams.filters.categories.includes(item.category)
        );
      }

      if (searchParams.filters?.budget) {
        mockData = mockData.filter(item => 
          item.budget >= searchParams.filters.budget[0] && 
          item.budget <= searchParams.filters.budget[1]
        );
      }

      if (searchParams.filters?.rating > 0) {
        mockData = mockData.filter(item => item.rating >= searchParams.filters.rating);
      }

      // Filter by radius
      if (searchParams.radius && (selectedLocation || userLocation)) {
        const center = selectedLocation || userLocation;
        mockData = mapService.filterLocationsByRadius(center, mockData, searchParams.radius);
      }

      setSearchResults(mockData);
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedLocation, userLocation]);

  // Handle filter changes
  const handleFilterChange = useCallback((filters) => {
    setCurrentFilters(filters);
  }, []);

  // Handle location change
  const handleLocationChange = useCallback((location) => {
    setSelectedLocation(location);
    if (location.coordinates) {
      setMapCenter([location.coordinates.latitude, location.coordinates.longitude]);
    }
  }, []);

  // Handle marker click
  const handleMarkerClick = useCallback((marker) => {
    console.log('Marker clicked:', marker);
    // In real implementation, open details modal or navigate to details page
  }, []);

  // Handle map click
  const handleMapClick = useCallback((event) => {
    console.log('Map clicked:', event);
  }, []);

  // Close error snackbar
  const handleCloseError = () => {
    setError(null);
  };

  return (
    <Container maxWidth={false} disableGutters sx={{ height: '100vh', position: 'relative' }}>
      {/* Loading backdrop */}
      <Backdrop open={loading} sx={{ zIndex: 9999 }}>
        <Box sx={{ textAlign: 'center', color: 'white' }}>
          <CircularProgress color="inherit" size={60} sx={{ mb: 2 }} />
          <Typography variant="h6">Finding {searchType} near you...</Typography>
        </Box>
      </Backdrop>

      {/* Search type toggle */}
      <Box sx={{ 
        position: 'absolute', 
        top: 16, 
        right: 16, 
        zIndex: 1000,
        ...(isMobile && showSearchOverlay && { display: 'none' })
      }}>
        <ToggleButtonGroup
          value={searchType}
          exclusive
          onChange={handleSearchTypeChange}
          size="small"
          sx={{ 
            bgcolor: 'background.paper',
            boxShadow: 2,
            '& .MuiToggleButton-root': {
              border: 'none',
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark'
                }
              }
            }
          }}
        >
          <ToggleButton value="jobs">
            <JobIcon sx={{ mr: 1 }} />
            Jobs
          </ToggleButton>
          <ToggleButton value="workers">
            <WorkerIcon sx={{ mr: 1 }} />
            Workers
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Main map */}
      <InteractiveMap
        center={mapCenter}
        zoom={12}
        markers={searchResults}
        onMarkerClick={handleMarkerClick}
        onMapClick={handleMapClick}
        showUserLocation={true}
        showSearchRadius={true}
        searchRadius={currentFilters.radius || 10}
        height="100vh"
        controls={{
          location: true,
          zoom: true,
          layers: true,
          fullscreen: !isMobile
        }}
      />

      {/* Search overlay */}
      <MapSearchOverlay
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onLocationChange={handleLocationChange}
        searchResults={searchResults}
        loading={loading}
        searchType={searchType}
        userLocation={userLocation}
        isVisible={showSearchOverlay}
        onClose={() => setShowSearchOverlay(false)}
      />

      {/* Mobile search toggle FAB */}
      {isMobile && !showSearchOverlay && (
        <Fab
          color="primary"
          sx={{ position: 'absolute', bottom: 16, left: 16, zIndex: 1000 }}
          onClick={() => setShowSearchOverlay(true)}
        >
          <SearchIcon />
        </Fab>
      )}

      {/* Location FAB for mobile */}
      {isMobile && (
        <Fab
          color="secondary"
          size="medium"
          sx={{ 
            position: 'absolute', 
            bottom: showSearchOverlay ? 16 : 80, 
            right: 16, 
            zIndex: 1000 
          }}
          onClick={async () => {
            try {
              setLoading(true);
              const location = await mapService.getCurrentLocation();
              setUserLocation(location);
              setMapCenter([location.latitude, location.longitude]);
            } catch (error) {
              setError('Could not get your location');
            } finally {
              setLoading(false);
            }
          }}
        >
          <LocationIcon />
        </Fab>
      )}

      {/* Error snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="warning" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Results count indicator */}
      {searchResults.length > 0 && (
        <Box sx={{
          position: 'absolute',
          bottom: isMobile ? 16 : 32,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          bgcolor: 'background.paper',
          px: 2,
          py: 1,
          borderRadius: 2,
          boxShadow: 2
        }}>
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {searchResults.length} {searchType} found
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default ProfessionalMapPage; 