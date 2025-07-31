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
import axios from 'axios';
import { Helmet } from 'react-helmet';
import { useSelector } from 'react-redux';
import JobCard from '../../jobs/components/listing/JobCard';
import WorkerCard from '../../worker/components/WorkerCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

const CompactLocationSearch = ({
  searchType,
  location,
  setLocation,
  keywords,
  setKeywords,
  distance,
  setDistance,
  category,
  setCategory,
  sortBy,
  setSortBy,
  categories,
  skills,
  loading,
  onSearch,
  onClearFilters,
  suggestedLocations,
  getCurrentLocation,
}) => {
  const theme = useTheme();

  // Component uses getCurrentLocation passed as prop

  // Handle location suggestions
  const fetchLocationSuggestions = useCallback(
    debounce((query) => {
      if (!query || query.length < 2) {
        setSuggestedLocations([]);
        return;
      }
      const mockSuggestions = [
        'Accra, Ghana',
        'Kumasi, Ghana',
        'Tema, Ghana',
        'Cape Coast, Ghana',
      ]
        .filter((loc) => loc.toLowerCase().includes(query.toLowerCase()))
        .map((loc) => ({ id: loc, description: loc }));
      setSuggestedLocations(mockSuggestions);
    }, 300),
    [],
  );

  useEffect(() => {
    fetchLocationSuggestions(location);
  }, [location, fetchLocationSuggestions]);

  // Handle search for jobs or workers
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
      // Mocking API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // In a real app, this would be an API call to the backend with all the search parameters
      // For now, we return an empty array to show the empty state.
      setSearchResults([]);
      setPagination({ currentPage: 1, totalPages: 1, totalItems: 0 });
    } catch (err) {
      console.error('Error searching:', err);
      setError('Something went wrong. Please try again.');
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

        {/* Compact Location Search */}
        <CompactLocationSearch
          searchType={searchType}
          location={location}
          setLocation={setLocation}
          keywords={keywords}
          setKeywords={setKeywords}
          distance={distance}
          setDistance={setDistance}
          category={category}
          setCategory={setCategory}
          sortBy={sortBy}
          setSortBy={setSortBy}
          categories={categories}
          skills={skills}
          loading={loading}
          onSearch={handleSearch}
          onClearFilters={clearFilters}
          suggestedLocations={suggestedLocations}
          getCurrentLocation={getCurrentLocation}
        />

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
            <EmptySearchState
              searchType={searchType}
              location={location}
              onGetStarted={() =>
                navigate(searchType === 0 ? '/jobs' : '/find-talents')
              }
            />
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
