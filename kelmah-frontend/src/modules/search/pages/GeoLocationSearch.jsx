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
  const [expanded, setExpanded] = useState(false);

  return (
    <Paper
      sx={{
        p: 3,
        mb: 4,
        borderRadius: 3,
        border: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
        backgroundColor: theme.palette.background.paper,
        boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.2)}`,
      }}
    >
      <Typography
        variant="h5"
        gutterBottom
        fontWeight="bold"
        sx={{
          color: theme.palette.secondary.main,
          textAlign: 'center',
          mb: 3,
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
        }}
      >
        🎯 Local Search - Find {searchType === 0 ? 'Jobs' : 'Professionals'}{' '}
        Near You
      </Typography>

      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} md={5}>
          <Box sx={{ position: 'relative' }}>
            <TextField
              fullWidth
              label="Your Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, State, Country"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.background.default, 0.3),
                  '& fieldset': {
                    borderColor: theme.palette.secondary.main,
                    borderWidth: 2,
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.secondary.light,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.secondary.main,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationIcon
                      sx={{ color: theme.palette.secondary.main, fontSize: 28 }}
                    />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Use your current location">
                      <IconButton
                        onClick={getCurrentLocation}
                        edge="end"
                        disabled={loading}
                        sx={{
                          color: theme.palette.secondary.main,
                          '&:hover': {
                            backgroundColor: alpha(
                              theme.palette.secondary.main,
                              0.1,
                            ),
                          },
                        }}
                      >
                        {loading ? (
                          <CircularProgress
                            size={24}
                            sx={{ color: theme.palette.secondary.main }}
                          />
                        ) : (
                          <MyLocationIcon sx={{ fontSize: 28 }} />
                        )}
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
            {suggestedLocations.length > 0 && (
              <Paper
                elevation={12}
                sx={{
                  mt: 1,
                  position: 'absolute',
                  zIndex: 100,
                  width: '100%',
                  maxHeight: 250,
                  overflow: 'auto',
                  borderRadius: 3,
                  border: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <List dense>
                  {suggestedLocations.map((item) => (
                    <ListItem
                      button
                      key={item.id}
                      onClick={() => {
                        setLocation(item.description);
                      }}
                      sx={{
                        py: 1.5,
                        '&:hover': {
                          backgroundColor: alpha(
                            theme.palette.secondary.main,
                            0.1,
                          ),
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <LocationIcon
                          fontSize="small"
                          sx={{ color: theme.palette.secondary.main }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.description}
                        sx={{
                          '& .MuiTypography-root': {
                            color: theme.palette.text.primary,
                            fontWeight: 500,
                          },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label={`Search for ${searchType === 0 ? 'jobs' : 'workers'}`}
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder={
              searchType === 0 ? 'Job title, keywords' : 'Skills, name, title'
            }
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: alpha(theme.palette.background.default, 0.3),
                '& fieldset': {
                  borderColor: theme.palette.secondary.main,
                  borderWidth: 2,
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.secondary.light,
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.secondary.main,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    sx={{ color: theme.palette.secondary.main, fontSize: 28 }}
                  />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={8} md={2}>
          <Box>
            <Typography
              variant="body2"
              gutterBottom
              fontWeight="bold"
              sx={{
                color: theme.palette.secondary.main,
                textAlign: 'center',
              }}
            >
              Radius: {distance} miles
            </Typography>
            <Slider
              value={distance}
              onChange={(e, newValue) => setDistance(newValue)}
              min={5}
              max={100}
              step={5}
              sx={{
                '& .MuiSlider-thumb': {
                  backgroundColor: theme.palette.secondary.main,
                  border: `3px solid ${theme.palette.secondary.main}`,
                  width: 24,
                  height: 24,
                },
                '& .MuiSlider-track': {
                  backgroundColor: theme.palette.secondary.main,
                  height: 6,
                },
                '& .MuiSlider-rail': {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.3),
                  height: 6,
                },
              }}
            />
          </Box>
        </Grid>

        <Grid item xs={4} md={1}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => onSearch(1)}
            disabled={loading}
            sx={{
              py: 2.5,
              borderRadius: 3,
              backgroundColor: theme.palette.secondary.main,
              color: theme.palette.secondary.contrastText,
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: theme.palette.secondary.dark,
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 25px ${alpha(theme.palette.secondary.main, 0.4)}`,
              },
            }}
            startIcon={
              loading ? <CircularProgress size={20} /> : <SearchIcon />
            }
          >
            Search
          </Button>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="text"
          startIcon={<Tune />}
          endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
          onClick={() => setExpanded(!expanded)}
          sx={{
            color: theme.palette.secondary.main,
            fontWeight: 'bold',
          }}
        >
          Advanced Filters
        </Button>
      </Box>

      <Collapse in={expanded}>
        <Divider sx={{ my: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>
                {searchType === 0 ? 'Job Category' : 'Skill Category'}
              </InputLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                label={searchType === 0 ? 'Job Category' : 'Skill Category'}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">
                  <em>All Categories</em>
                </MenuItem>
                {(searchType === 0 ? categories : skills).map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="relevance">Relevance</MenuItem>
                <MenuItem value="distance">Distance</MenuItem>
                <MenuItem value="newest">Date (Newest First)</MenuItem>
                {searchType === 0 ? (
                  <MenuItem value="salary">Salary (Highest First)</MenuItem>
                ) : (
                  <MenuItem value="rating">Rating (Highest First)</MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack
              direction="row"
              spacing={2}
              sx={{ height: '100%', alignItems: 'center' }}
            >
              <Button
                variant="text"
                startIcon={<ClearIcon />}
                onClick={onClearFilters}
                sx={{ fontWeight: 'bold', color: theme.palette.text.secondary }}
              >
                Clear
              </Button>
              <Button
                variant="contained"
                onClick={() => onSearch(1)}
                disabled={loading}
                sx={{
                  backgroundColor: theme.palette.secondary.main,
                  color: theme.palette.secondary.contrastText,
                  fontWeight: 'bold',
                }}
                startIcon={
                  loading ? <CircularProgress size={20} /> : <SortIcon />
                }
              >
                Apply
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Collapse>
    </Paper>
  );
};

const EmptySearchState = ({ searchType, location, onGetStarted }) => {
  const theme = useTheme();

  const suggestions =
    searchType === 0
      ? [
          'Try searching for "plumbing" or "electrical"',
          'Browse by job category using the filters',
          'Expand your search radius',
          'Check out featured opportunities below',
        ]
      : [
          'Try searching for specific skills like "carpenter" or "painter"',
          'Browse by skill category using the filters',
          'Expand your search radius',
          'Check out top professionals below',
        ];

  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          borderRadius: 4,
          p: { xs: 4, sm: 6, md: 8 },
          mb: 6,
          border: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {searchType === 0 ? (
          <WorkIcon
            sx={{
              fontSize: 100,
              color: theme.palette.secondary.main,
              mb: 3,
            }}
          />
        ) : (
          <PersonIcon
            sx={{
              fontSize: 100,
              color: theme.palette.secondary.main,
              mb: 3,
            }}
          />
        )}

        <Typography
          variant="h3"
          gutterBottom
          fontWeight="bold"
          sx={{
            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
            color: theme.palette.secondary.main,
            textShadow: `0 2px 4px ${alpha(theme.palette.common.black, 0.3)}`,
          }}
        >
          {searchType === 0 ? '🔍 No Jobs Found' : '🔍 No Professionals Found'}
        </Typography>

        <Typography
          variant="h6"
          sx={{
            mb: 4,
            maxWidth: 700,
            mx: 'auto',
            color: theme.palette.text.primary,
            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
            lineHeight: 1.6,
            fontWeight: 500,
          }}
        >
          {searchType === 0
            ? `We couldn't find any jobs matching your criteria in ${location || 'your area'}. But don't worry - new opportunities are posted daily!`
            : `We couldn't find any professionals matching your criteria in ${location || 'your area'}. Try adjusting your search parameters.`}
        </Typography>

        <Typography
          variant="h5"
          gutterBottom
          sx={{
            color: theme.palette.secondary.main,
            fontWeight: 'bold',
            mb: 4,
          }}
        >
          💡 Try These Suggestions:
        </Typography>

        <Grid container spacing={3} sx={{ mb: 6 }}>
          {suggestions.map((suggestion, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Box
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  border: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: theme.palette.secondary.main,
                    backgroundColor: alpha(theme.palette.background.paper, 0.9),
                    boxShadow: `0 8px 25px ${alpha(theme.palette.secondary.main, 0.3)}`,
                  },
                }}
              >
                <CheckCircle
                  sx={{
                    color: theme.palette.secondary.main,
                    mb: 2,
                    fontSize: 32,
                  }}
                />
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 500,
                    fontSize: '1rem',
                    lineHeight: 1.5,
                  }}
                >
                  {suggestion}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Button
          variant="contained"
          size="large"
          onClick={onGetStarted}
          sx={{
            px: 5,
            py: 2.5,
            fontSize: '1.2rem',
            fontWeight: 'bold',
            backgroundColor: theme.palette.secondary.main,
            color: theme.palette.secondary.contrastText,
            borderRadius: 3,
            '&:hover': {
              backgroundColor: theme.palette.secondary.dark,
              transform: 'translateY(-3px)',
              boxShadow: `0 12px 30px ${alpha(theme.palette.secondary.main, 0.5)}`,
            },
          }}
        >
          {searchType === 0 ? 'Browse All Jobs' : 'Browse All Professionals'}
        </Button>
      </Box>
    </Box>
  );
};

const GeoLocationSearch = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const user = useSelector((state) => state.auth.user);

  // Search type (jobs or workers)
  const [searchType, setSearchType] = useState(0);

  // Search state
  const [location, setLocation] = useState('');
  const [suggestedLocations, setSuggestedLocations] = useState([]);
  const [distance, setDistance] = useState(50);
  const [keywords, setKeywords] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);

  // Results state
  const [searchResults, setSearchResults] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [locationError, setLocationError] = useState(false);

  // Categories for jobs and skills for workers
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);

  // Load categories and skills
  useEffect(() => {
    // Mock data for categories and skills
    if (searchType === 0) {
      setCategories([
        { id: 'plumbing', name: 'Plumbing & Water Systems' },
        { id: 'electrical', name: 'Electrical & Wiring' },
        { id: 'carpentry', name: 'Carpentry & Woodwork' },
        { id: 'painting', name: 'Painting & Decoration' },
      ]);
    } else {
      setSkills([
        { id: 'construction', name: 'Construction & Building' },
        { id: 'maintenance', name: 'Maintenance & Repair' },
        { id: 'design', name: 'Design & Creative' },
        { id: 'technology', name: 'Technology & Smart Home' },
      ]);
    }
  }, [searchType]);

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      setLocationError(false);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, you would use position.coords.latitude and position.coords.longitude
          // to get the location name from a geocoding service.
          // For this example, we'll use a mock location.
          const mockLocations = [
            'Accra, Ghana',
            'Kumasi, Ghana',
            'Tema, Ghana',
          ];
          const randomLocation =
            mockLocations[Math.floor(Math.random() * mockLocations.length)];
          setLocation(randomLocation);
          setLoading(false);
        },
        (error) => {
          console.error('Error getting current location:', error);
          setLoading(false);
          setLocationError(true);
        },
      );
    } else {
      setLocationError(true);
    }
  };

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
