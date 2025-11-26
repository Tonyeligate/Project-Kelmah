import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  Button,
  Paper,
  Tabs,
  Tab,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Slider,
  InputAdornment,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Rating,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Stack,
  alpha,
  Grow,
  Collapse,
  Fab,
  Badge,
  Pagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  Person as PersonIcon,
  Star as StarIcon,
  MyLocation as MyLocationIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ArrowForward as ArrowForwardIcon,
  Sort as SortIcon,
  TravelExplore,
  Place,
  CheckCircle,
  Schedule,
  ExpandMore,
  ExpandLess,
  Tune,
  Navigation,
  Room,
  Public,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import { api } from '../../../services/apiClient';
import { Helmet } from 'react-helmet-async';
import { useSelector } from 'react-redux';
import { ListingJobCard as JobCard } from '../../common/components/cards';
import WorkerCard from '../../worker/components/WorkerCard';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`search-tabpanel-${index}`}
      aria-labelledby={`search-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const LocationErrorFallback = ({ onRetry, onManualEntry }) => {
  const theme = useTheme();

  return (
    <Paper
      sx={{
        p: { xs: 4, sm: 6 },
        mb: 4,
        textAlign: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        border: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Place
        sx={{
          fontSize: 80,
          color: theme.palette.secondary.main,
          mb: 3,
        }}
      />
      <Typography
        variant="h4"
        gutterBottom
        fontWeight="bold"
        sx={{
          color: theme.palette.secondary.main,
          fontSize: { xs: '1.5rem', sm: '2rem' },
        }}
      >
        🌍 Let's Find Your Location!
      </Typography>
      <Typography
        variant="h6"
        sx={{
          mb: 4,
          maxWidth: 600,
          mx: 'auto',
          color: theme.palette.text.primary,
          fontSize: { xs: '1rem', sm: '1.1rem' },
          lineHeight: 1.6,
          fontWeight: 500,
        }}
      >
        To show you the most relevant jobs and professionals in your area, we
        need to know your location. You can either allow location access or
        enter your city manually.
      </Typography>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={3}
        justifyContent="center"
        sx={{ mb: 4 }}
      >
        <Button
          variant="contained"
          size="large"
          startIcon={<MyLocationIcon />}
          onClick={onRetry}
          sx={{
            px: 4,
            py: 2,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            backgroundColor: theme.palette.secondary.main,
            color: theme.palette.secondary.contrastText,
            borderRadius: 3,
            '&:hover': {
              backgroundColor: theme.palette.secondary.dark,
              transform: 'translateY(-3px)',
              boxShadow: `0 8px 25px ${alpha(theme.palette.secondary.main, 0.5)}`,
            },
          }}
        >
          Allow Location Access
        </Button>
        <Button
          variant="outlined"
          size="large"
          startIcon={<TravelExplore />}
          onClick={onManualEntry}
          sx={{
            px: 4,
            py: 2,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            borderColor: theme.palette.secondary.main,
            color: theme.palette.secondary.main,
            borderWidth: 2,
            borderRadius: 3,
            '&:hover': {
              borderColor: theme.palette.secondary.light,
              backgroundColor: alpha(theme.palette.secondary.main, 0.1),
              transform: 'translateY(-3px)',
            },
          }}
        >
          Enter Location Manually
        </Button>
      </Stack>

      <Box
        sx={{
          p: 3,
          backgroundColor: alpha(theme.palette.secondary.main, 0.1),
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.primary,
            fontSize: '1rem',
            fontWeight: 500,
            lineHeight: 1.6,
          }}
        >
          💡{' '}
          <Typography
            component="span"
            sx={{ fontWeight: 'bold', color: theme.palette.secondary.main }}
          >
            Why location matters:
          </Typography>{' '}
          We use your location to show nearby opportunities, calculate travel
          distances, and connect you with local professionals and clients.
        </Typography>
      </Box>
    </Paper>
  );
};

// Main GeoLocationSearch component
const GeoLocationSearch = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // Fix: Added missing isMobile definition

  // Component state
  const [searchType, setSearchType] = useState(0); // 0 for jobs, 1 for workers
  const [location, setLocation] = useState('');
  const [suggestedLocations, setSuggestedLocations] = useState([]);
  const [coordinates, setCoordinates] = useState(null);
  const [keywords, setKeywords] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [distance, setDistance] = useState(50);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [searched, setSearched] = useState(false);

  // Job/Worker categories
  const categories = [
    'Construction',
    'Plumbing',
    'Electrical',
    'Carpentry',
    'Painting',
    'Roofing',
    'Landscaping',
    'Cleaning',
    'Moving',
    'Repair Services',
    'Technology',
    'Design',
    'Writing',
    'Marketing',
    'Consulting',
  ];

  const skills = [
    'React',
    'JavaScript',
    'Python',
    'Construction',
    'Plumbing',
    'Electrical Work',
    'Carpentry',
    'Painting',
    'Design',
    'Writing',
  ];

  // Get user's current location
  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoordinates({ lat: latitude, lng: longitude });
          // Reverse geocode to get location name
          reverseGeocode(latitude, longitude);
          setLocationError(false);
          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError(true);
          setLoading(false);
        },
      );
    } else {
      setLocationError(true);
    }
  };

  // Reverse geocoding function
  const reverseGeocode = async (lat, lng) => {
    try {
      // In a real app, you'd use a geocoding service like Google Maps or OpenStreetMap
      setLocation('Current Location');
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      setLocation('Current Location');
    }
  };

  // Handle location suggestions
  const fetchLocationSuggestions = useCallback(
    debounce((query) => {
      if (!query || query.length < 2) {
        setSuggestedLocations([]);
        return;
      }
      // Using real Ghana locations instead of mock
      const ghanaLocations = [
        'Accra, Greater Accra Region, Ghana',
        'Kumasi, Ashanti Region, Ghana',
        'Tema, Greater Accra Region, Ghana',
        'Cape Coast, Central Region, Ghana',
        'Tamale, Northern Region, Ghana',
        'Sekondi-Takoradi, Western Region, Ghana',
        'Koforidua, Eastern Region, Ghana',
        'Ho, Volta Region, Ghana',
        'Sunyani, Bono Region, Ghana',
        'Bolgatanga, Upper East Region, Ghana',
      ]
        .filter((loc) => loc.toLowerCase().includes(query.toLowerCase()))
        .map((loc) => ({ id: loc, description: loc }));
      setSuggestedLocations(ghanaLocations);
    }, 300),
    [],
  );

  useEffect(() => {
    fetchLocationSuggestions(location);
  }, [location, fetchLocationSuggestions]);

  // Handle search for jobs or workers using real API
  const handleSearch = async (page = 1) => {
    if (!location) {
      setError('Please enter a location to search.');
      return;
    }
    setCurrentPage(page);
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const searchParams = {
        location,
        keywords,
        category: category || undefined,
        sortBy,
        distance,
        page,
        limit: 10,
      };

      let response;
      if (searchType === 0) {
        // Search for jobs
        response = await api.get('/jobs/search', {
          params: searchParams,
        });
      } else {
        // Search for workers/professionals
        response = await api.get('/workers/search', {
          params: searchParams,
        });
      }

      const results = response.data.data || response.data.results || [];
      setSearchResults(results);
      setPagination({
        currentPage: response.data.currentPage || page,
        totalPages: response.data.totalPages || 1,
        totalItems: response.data.totalItems || results.length,
      });
    } catch (err) {
      console.error('Error searching:', err);
      setError('Unable to fetch search results. Please try again later.');
      setSearchResults([]);
      setPagination({ currentPage: 1, totalPages: 1, totalItems: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch the user's location on initial load
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Handle tab change (jobs/workers)
  const handleTabChange = (event, newValue) => {
    setSearchType(newValue);
    setCategory('');
    setSearchResults([]);
    setPagination({});
    setSearched(false);
  };

  // Clear search filters
  const clearFilters = () => {
    setKeywords('');
    setCategory('');
    setSortBy('relevance');
    setDistance(50);
  };

  const handleManualLocationEntry = () => {
    setLocationError(false);
    // Logic to focus the location input
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Helmet>
          <title>Location-based Search | Kelmah</title>
        </Helmet>

        {/* Header Section */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            fontWeight="bold"
            sx={{
              color: theme.palette.secondary.main,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              textShadow: `0 2px 4px ${alpha(theme.palette.common.black, 0.3)}`,
              mb: 2,
            }}
          >
            🌍 Find {searchType === 0 ? 'Jobs' : 'Talent'} Near You
          </Typography>
          <Typography
            variant="h5"
            sx={{
              maxWidth: 800,
              mx: 'auto',
              color: theme.palette.text.primary,
              fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
              fontWeight: 500,
              lineHeight: 1.6,
            }}
          >
            Connect with local opportunities and professionals. Distance matters
            - find work and talent that's convenient for everyone.
          </Typography>
        </Box>

        {/* Search Type Tabs */}
        <Paper
          sx={{
            mb: 4,
            borderRadius: 3,
            overflow: 'hidden',
            border: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Tabs
            value={searchType}
            onChange={handleTabChange}
            variant={isMobile ? 'fullWidth' : 'standard'}
            centered={!isMobile}
            aria-label="search type tabs"
            sx={{
              backgroundColor: alpha(theme.palette.secondary.main, 0.1),
              '& .MuiTabs-indicator': {
                backgroundColor: theme.palette.secondary.main,
                height: 4,
              },
            }}
          >
            <Tab
              icon={<WorkIcon />}
              label="Find Jobs"
              iconPosition="start"
              sx={{ fontWeight: 'bold', fontSize: '1.1rem', py: 2 }}
            />
            <Tab
              icon={<PersonIcon />}
              label="Find Talent"
              iconPosition="start"
              sx={{ fontWeight: 'bold', fontSize: '1.1rem', py: 2 }}
            />
          </Tabs>
        </Paper>

        {/* Location Error Fallback */}
        {locationError && !location && (
          <LocationErrorFallback
            onRetry={getCurrentLocation}
            onManualEntry={handleManualLocationEntry}
          />
        )}

        {/* Search Form */}
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <Grid container spacing={2}>
            {/* Location Input */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter city or address"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={getCurrentLocation} size="small">
                        <MyLocationIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Keywords Input */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={searchType === 0 ? 'Job Keywords' : 'Skills'}
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder={
                  searchType === 0
                    ? 'e.g. carpenter, plumber'
                    : 'e.g. React, JavaScript'
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Search Button */}
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => handleSearch()}
                disabled={loading}
                sx={{
                  height: '56px',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Search'
                )}
              </Button>
            </Grid>
          </Grid>

          {/* Filters Row */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="relevance">Relevance</MenuItem>
                  <MenuItem value="date">Date Posted</MenuItem>
                  <MenuItem value="distance">Distance</MenuItem>
                  <MenuItem value="salary">Salary</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ px: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Distance: {distance}km
                </Typography>
                <Slider
                  value={distance}
                  onChange={(e, value) => setDistance(value)}
                  min={5}
                  max={100}
                  step={5}
                  marks={[
                    { value: 5, label: '5km' },
                    { value: 50, label: '50km' },
                    { value: 100, label: '100km' },
                  ]}
                  size="small"
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={clearFilters}
                startIcon={<ClearIcon />}
                sx={{ height: '40px' }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Error Display */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : searched && searchResults.length === 0 ? (
          <TabPanel value={searchType} index={searchType}>
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                px: 3,
              }}
            >
              <Typography variant="h5" gutterBottom color="text.secondary">
                No {searchType === 0 ? 'jobs' : 'workers'} found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {location
                  ? `No results found for "${location}"`
                  : 'Try adjusting your search criteria'}
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() =>
                  navigate(searchType === 0 ? '/jobs' : '/hirer/find-talent')
                }
                startIcon={<SearchIcon />}
              >
                {searchType === 0 ? 'Browse All Jobs' : 'Find Talent'}
              </Button>
            </Box>
          </TabPanel>
        ) : searchResults.length > 0 ? (
          <TabPanel value={searchType} index={searchType}>
            <Box
              sx={{
                mb: 3,
                p: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
              }}
            >
              <Typography variant="h6" fontWeight="bold">
                {searchType === 0 ? '📍' : '👥'} {pagination.totalItems || 0}{' '}
                result{pagination.totalItems !== 1 ? 's' : ''} found
              </Typography>
              <Chip
                label={`Page ${pagination.currentPage || 1}`}
                variant="outlined"
              />
            </Box>
            <Grid container spacing={3}>
              {searchResults.map((item) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={searchType === 0 ? 12 : 4}
                  key={item.id}
                >
                  {searchType === 0 ? (
                    <JobCard job={item} showLocation={true} />
                  ) : (
                    <WorkerCard worker={item} showLocation={true} />
                  )}
                </Grid>
              ))}
            </Grid>
            {pagination.totalPages > 1 && (
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  count={pagination.totalPages}
                  page={pagination.currentPage}
                  onChange={(e, page) => handleSearch(page)}
                  color="primary"
                />
              </Box>
            )}
          </TabPanel>
        ) : null}
      </Container>
    </Box>
  );
};

export default GeoLocationSearch;
