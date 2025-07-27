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
  useTheme,
  Paper,
  Chip,
  Button,
} from '@mui/material';
import {
  Work as JobIcon,
  Person as WorkerIcon,
  Search as SearchIcon,
  MyLocation as LocationIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import InteractiveMap from '../components/common/InteractiveMap';
import MapSearchOverlay from '../components/common/MapSearchOverlay';
import mapService from '../services/mapService';

const ProfessionalMapPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Map state
  const [mapCenter, setMapCenter] = useState([5.6037, -0.187]); // Accra, Ghana
  const [userLocation, setUserLocation] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchType, setSearchType] = useState('jobs');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // UI state
  const [showSearchOverlay, setShowSearchOverlay] = useState(true);
  const [currentFilters, setCurrentFilters] = useState({
    radius: 25,
    categories: [],
    budget: [0, 10000],
    rating: 0,
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [totalResults, setTotalResults] = useState(0);

  // Get user location and initial data on mount
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setInitializing(true);
        const location = await mapService.getCurrentLocation();
        setUserLocation(location);
        setMapCenter([location.latitude, location.longitude]);

        // Load initial data based on user location
        await loadMapData(searchType, location);
      } catch (error) {
        console.warn('Could not get user location:', error);
        setError(
          'Could not access your location. Using default area (Accra, Ghana).',
        );

        // Load data for default location
        await loadMapData(searchType, { latitude: 5.6037, longitude: -0.187 });
      } finally {
        setInitializing(false);
      }
    };

    initializeMap();
  }, []);

  // Load map data from real APIs
  const loadMapData = async (type, location, filters = currentFilters) => {
    if (!location) return;

    setLoading(true);
    setError(null);

    try {
      const searchParams = {
        latitude: location.latitude,
        longitude: location.longitude,
        radius: filters.radius,
        category: filters.categories.length > 0 ? filters.categories[0] : null,
        skills: filters.categories.length > 1 ? filters.categories : null,
        budget: filters.budget,
        rating: filters.rating,
        page: 1,
        limit: 100,
      };

      let results = [];
      if (type === 'jobs') {
        results = await mapService.searchJobsNearLocation(searchParams);
      } else {
        results = await mapService.searchWorkersNearLocation(searchParams);
      }

      setSearchResults(results);
      setTotalResults(results.length);
    } catch (error) {
      console.error('Search error:', error);
      setError(`Failed to load ${type}. Please try again.`);
      setSearchResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  // Handle search type change
  const handleSearchTypeChange = useCallback(
    (event, newType) => {
      if (newType !== null) {
        setSearchType(newType);
        const location = selectedLocation || userLocation;
        if (location) {
          loadMapData(newType, location);
        }
      }
    },
    [selectedLocation, userLocation, currentFilters],
  );

  // Handle search from overlay
  const handleSearch = useCallback(
    async (searchParams) => {
      const location = selectedLocation ||
        userLocation || {
          latitude: mapCenter[0],
          longitude: mapCenter[1],
        };

      const enhancedParams = {
        ...searchParams,
        latitude: location.latitude,
        longitude: location.longitude,
      };

      setLoading(true);
      setError(null);

      try {
        let results = [];
        if (searchParams.type === 'jobs') {
          results = await mapService.searchJobsNearLocation(enhancedParams);
        } else {
          results = await mapService.searchWorkersNearLocation(enhancedParams);
        }

        // Apply additional filters
        if (searchParams.query) {
          const query = searchParams.query.toLowerCase();
          results = results.filter(
            (item) =>
              item.title?.toLowerCase().includes(query) ||
              item.name?.toLowerCase().includes(query) ||
              item.description?.toLowerCase().includes(query) ||
              item.category?.toLowerCase().includes(query) ||
              item.skills?.some((skill) => skill.toLowerCase().includes(query)),
          );
        }

        setSearchResults(results);
        setTotalResults(results.length);
      } catch (error) {
        console.error('Search error:', error);
        setError('Search failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [selectedLocation, userLocation, mapCenter],
  );

  // Handle filter changes
  const handleFilterChange = useCallback((filters) => {
    setCurrentFilters(filters);
  }, []);

  // Handle location change
  const handleLocationChange = useCallback(
    (location) => {
      setSelectedLocation(location);
      if (location.coordinates) {
        setMapCenter([
          location.coordinates.latitude,
          location.coordinates.longitude,
        ]);
        loadMapData(searchType, location.coordinates, currentFilters);
      }
    },
    [searchType, currentFilters],
  );

  // Handle marker click - navigate to details
  const handleMarkerClick = useCallback(
    (marker) => {
      if (marker.type === 'job') {
        navigate(`/jobs/${marker.id}`);
      } else if (marker.type === 'worker') {
        navigate(`/profiles/user/${marker.id}`);
      }
    },
    [navigate],
  );

  // Refresh data
  const handleRefresh = useCallback(() => {
    const location = selectedLocation || userLocation;
    if (location) {
      loadMapData(searchType, location, currentFilters);
    }
  }, [selectedLocation, userLocation, searchType, currentFilters]);

  // Get current location
  const handleGetCurrentLocation = useCallback(async () => {
    try {
      setLoading(true);
      const location = await mapService.getCurrentLocation();
      setUserLocation(location);
      setSelectedLocation(null);
      setMapCenter([location.latitude, location.longitude]);
      await loadMapData(searchType, location, currentFilters);
    } catch (error) {
      setError('Could not get your location. Please enable location services.');
    }
  }, [searchType, currentFilters]);

  // Close error snackbar
  const handleCloseError = () => {
    setError(null);
  };

  // Get search type label
  const getSearchTypeLabel = () => {
    return searchType === 'jobs' ? 'Vocational Jobs' : 'Skilled Workers';
  };

  // Get vocational categories
  const vocationalCategories = mapService.getVocationalCategories();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: theme.palette.background.default,
        position: 'relative',
      }}
    >
      {/* Loading backdrop for initialization */}
      <Backdrop
        open={initializing}
        sx={{
          zIndex: 9999,
          bgcolor: 'rgba(26, 26, 26, 0.9)',
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Box
            sx={{ textAlign: 'center', color: theme.palette.secondary.main }}
          >
            <CircularProgress color="inherit" size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Initializing Map
            </Typography>
            <Typography variant="body2">
              Finding {getSearchTypeLabel()} near you...
            </Typography>
          </Box>
        </motion.div>
      </Backdrop>

      {/* Header */}
      <Paper
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          bgcolor: theme.palette.background.paper,
          borderBottom: `2px solid ${theme.palette.secondary.main}33`,
          p: 2,
        }}
      >
        <Container maxWidth={false}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="h5"
                sx={{
                  color: theme.palette.secondary.main,
                  fontWeight: 'bold',
                  mb: 0.5,
                }}
              >
                Kelmah Map Search
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                }}
              >
                Find skilled workers and vocational jobs near you
              </Typography>
            </Box>

            {/* Search type toggle */}
            <ToggleButtonGroup
              value={searchType}
              exclusive
              onChange={handleSearchTypeChange}
              size="small"
              sx={{
                bgcolor: theme.palette.background.default,
                '& .MuiToggleButton-root': {
                  border: `1px solid ${theme.palette.secondary.main}33`,
                  color: theme.palette.text.primary,
                  '&.Mui-selected': {
                    bgcolor: theme.palette.secondary.main,
                    color: theme.palette.secondary.contrastText,
                    '&:hover': {
                      bgcolor: theme.palette.secondary.dark,
                    },
                  },
                },
              }}
            >
              <ToggleButton value="jobs">
                <JobIcon sx={{ mr: 1 }} />
                Jobs ({searchResults.filter((r) => r.type === 'job').length})
              </ToggleButton>
              <ToggleButton value="workers">
                <WorkerIcon sx={{ mr: 1 }} />
                Workers (
                {searchResults.filter((r) => r.type === 'worker').length})
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={loading}
                sx={{
                  borderColor: theme.palette.secondary.main,
                  color: theme.palette.secondary.main,
                }}
              >
                Refresh
              </Button>

              {!isMobile && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FilterIcon />}
                  onClick={() => setShowSearchOverlay(!showSearchOverlay)}
                  sx={{
                    borderColor: theme.palette.secondary.main,
                    color: theme.palette.secondary.main,
                  }}
                >
                  {showSearchOverlay ? 'Hide' : 'Show'} Filters
                </Button>
              )}
            </Box>
          </Box>

          {/* Quick category filters */}
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {vocationalCategories.slice(0, 6).map((category) => (
              <Chip
                key={category}
                label={category}
                size="small"
                onClick={() => {
                  const newFilters = {
                    ...currentFilters,
                    categories: currentFilters.categories.includes(category)
                      ? currentFilters.categories.filter((c) => c !== category)
                      : [...currentFilters.categories, category],
                  };
                  setCurrentFilters(newFilters);
                  const location = selectedLocation || userLocation;
                  if (location) {
                    loadMapData(searchType, location, newFilters);
                  }
                }}
                color={
                  currentFilters.categories.includes(category)
                    ? 'secondary'
                    : 'default'
                }
                sx={{
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  },
                }}
              />
            ))}
          </Box>
        </Container>
      </Paper>

      {/* Main content */}
      <Box sx={{ position: 'relative', height: 'calc(100vh - 140px)' }}>
        {/* Map */}
        <InteractiveMap
          center={mapCenter}
          zoom={12}
          markers={searchResults}
          onMarkerClick={handleMarkerClick}
          showUserLocation={true}
          showSearchRadius={true}
          searchRadius={currentFilters.radius}
          height="100%"
          controls={{
            location: true,
            zoom: true,
            layers: true,
            fullscreen: !isMobile,
          }}
        />

        {/* Search overlay */}
        <AnimatePresence>
          {showSearchOverlay && (
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
          )}
        </AnimatePresence>

        {/* Mobile FABs */}
        {isMobile && (
          <Box
            sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 1000 }}
          >
            <AnimatePresence>
              {!showSearchOverlay && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Fab
                    color="secondary"
                    onClick={() => setShowSearchOverlay(true)}
                    sx={{ mb: 1, display: 'block' }}
                  >
                    <SearchIcon />
                  </Fab>
                </motion.div>
              )}
            </AnimatePresence>

            <Fab
              color="primary"
              size="medium"
              onClick={handleGetCurrentLocation}
              disabled={loading}
              sx={{
                bgcolor: theme.palette.background.paper,
                color: theme.palette.secondary.main,
                border: `2px solid ${theme.palette.secondary.main}`,
                '&:hover': {
                  bgcolor: theme.palette.secondary.main + '11',
                },
              }}
            >
              {loading ? <CircularProgress size={24} /> : <LocationIcon />}
            </Fab>
          </Box>
        )}

        {/* Results indicator */}
        <AnimatePresence>
          {totalResults > 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{
                position: 'absolute',
                bottom: isMobile ? 16 : 32,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
              }}
            >
              <Paper
                sx={{
                  px: 3,
                  py: 1.5,
                  bgcolor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.secondary.main}33`,
                  borderRadius: 3,
                  boxShadow: `0 4px 20px rgba(255, 215, 0, 0.2)`,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 'medium',
                    color: theme.palette.secondary.main,
                  }}
                >
                  {totalResults} {getSearchTypeLabel()} found
                  {selectedLocation &&
                    ` near ${selectedLocation.city || 'selected area'}`}
                </Typography>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading overlay */}
        <AnimatePresence>
          {loading && !initializing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Paper
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1000,
                  p: 3,
                  textAlign: 'center',
                  bgcolor: theme.palette.background.paper,
                  border: `2px solid ${theme.palette.secondary.main}33`,
                }}
              >
                <CircularProgress
                  sx={{ color: theme.palette.secondary.main, mb: 2 }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.primary }}
                >
                  Searching for {getSearchTypeLabel()}...
                </Typography>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Error snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseError}
          severity="warning"
          sx={{
            width: '100%',
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.secondary.main}33`,
          }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfessionalMapPage;
