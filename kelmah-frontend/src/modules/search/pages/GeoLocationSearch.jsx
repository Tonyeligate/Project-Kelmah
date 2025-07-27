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
        p: 4,
        mb: 4,
        textAlign: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.1)} 100%)`,
        border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
        borderRadius: 3,
      }}
    >
      <Place sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
      <Typography variant="h5" gutterBottom fontWeight="bold">
        🌍 Let's Find Your Location!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
        To show you the most relevant jobs and professionals in your area, we need to know your location. 
        You can either allow location access or enter your city manually.
      </Typography>
      
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
        <Button
          variant="contained"
          startIcon={<MyLocationIcon />}
          onClick={onRetry}
          sx={{
            background: `linear-gradient(45deg, ${theme.palette.warning.main} 30%, ${theme.palette.info.main} 90%)`,
            fontWeight: 'bold',
            px: 3
          }}
        >
          Allow Location Access
        </Button>
        <Button
          variant="outlined"
          startIcon={<TravelExplore />}
          onClick={onManualEntry}
          sx={{ fontWeight: 'bold', px: 3 }}
        >
          Enter Location Manually
        </Button>
      </Stack>
      
      <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 2 }}>
        <Typography variant="body2" color="info.main">
          💡 <strong>Why location matters:</strong> We use your location to show nearby opportunities, 
          calculate travel distances, and connect you with local professionals and clients.
        </Typography>
      </Box>
    </Paper>
  );
};

const EmptySearchState = ({ searchType, location, onGetStarted }) => {
  const theme = useTheme();
  
  const suggestions = searchType === 0 
    ? [
        'Try searching for "plumbing" or "electrical"',
        'Browse by job category using the filters',
        'Expand your search radius',
        'Check out featured opportunities below'
      ]
    : [
        'Try searching for specific skills like "carpenter" or "painter"',
        'Browse by skill category using the filters',
        'Expand your search radius',
        'Check out top professionals below'
      ];

  return (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          borderRadius: 4,
          p: 6,
          mb: 4,
        }}
      >
        {searchType === 0 ? (
          <WorkIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
        ) : (
          <PersonIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
        )}
        
        <Typography variant="h4" gutterBottom fontWeight="bold">
          {searchType === 0 ? '🔍 No Jobs Found' : '🔍 No Professionals Found'}
        </Typography>
        
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
          {searchType === 0 
            ? `We couldn't find any jobs matching your criteria in ${location || 'your area'}. But don't worry - new opportunities are posted daily!`
            : `We couldn't find any professionals matching your criteria in ${location || 'your area'}. Try adjusting your search parameters.`
          }
        </Typography>

        <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
          💡 Try These Suggestions:
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {suggestions.map((suggestion, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Card sx={{ p: 2, height: '100%', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <CheckCircle color="success" sx={{ mb: 1 }} />
                <Typography variant="body2">{suggestion}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Button
          variant="contained"
          size="large"
          onClick={onGetStarted}
          sx={{
            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
            px: 4,
            py: 1.5,
            fontWeight: 'bold'
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
  const [filtersVisible, setFiltersVisible] = useState(!isMobile);

  // Results state
  const [searchResults, setSearchResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [locationError, setLocationError] = useState(false);

  // Categories for jobs and skills for workers
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);

  // Load categories and skills
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (searchType === 0) {
          // Mock job categories for demo
          setCategories([
            { id: 'plumbing', name: 'Plumbing & Water Systems' },
            { id: 'electrical', name: 'Electrical & Wiring' },
            { id: 'carpentry', name: 'Carpentry & Woodwork' },
            { id: 'painting', name: 'Painting & Decoration' },
            { id: 'hvac', name: 'HVAC & Climate Control' },
            { id: 'roofing', name: 'Roofing & Exterior' },
            { id: 'flooring', name: 'Flooring & Tiling' },
            { id: 'landscaping', name: 'Landscaping & Gardening' }
          ]);
        } else {
          // Mock skill categories for demo
          setSkills([
            { id: 'construction', name: 'Construction & Building' },
            { id: 'maintenance', name: 'Maintenance & Repair' },
            { id: 'design', name: 'Design & Creative' },
            { id: 'technology', name: 'Technology & Smart Home' },
            { id: 'cleaning', name: 'Cleaning & Janitorial' },
            { id: 'security', name: 'Security & Safety' },
            { id: 'automotive', name: 'Automotive & Mechanical' },
            { id: 'wellness', name: 'Health & Wellness' }
          ]);
        }
      } catch (err) {
        console.error('Error loading categories/skills:', err);
      }
    };

    fetchData();
  }, [searchType]);

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      setLocationError(false);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            // For demo purposes, we'll set a default location
            // In production, you would use a real geocoding service
            const mockLocations = [
              'Accra, Ghana',
              'Kumasi, Ghana', 
              'Tema, Ghana',
              'Cape Coast, Ghana',
              'Tamale, Ghana'
            ];
            
            const randomLocation = mockLocations[Math.floor(Math.random() * mockLocations.length)];
            setLocation(randomLocation);
            setLocationError(false);
          } catch (err) {
            console.error('Error getting location name:', err);
            setLocationError(true);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error('Error getting current location:', error);
          setLoading(false);
          setLocationError(true);
        },
        {
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 600000
        }
      );
    } else {
      setLocationError(true);
    }
  };

  // Handle location suggestions
  const fetchLocationSuggestions = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 2) {
        setSuggestedLocations([]);
        return;
      }

      // Mock suggestions for demo
      const mockSuggestions = [
        'Accra, Ghana',
        'Kumasi, Ghana',
        'Tema, Ghana',
        'Cape Coast, Ghana',
        'Tamale, Ghana',
        'Takoradi, Ghana',
        'Koforidua, Ghana',
        'Sunyani, Ghana'
      ].filter(loc => loc.toLowerCase().includes(query.toLowerCase()))
       .map(loc => ({ id: loc, description: loc }));

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
      // Mock search results for demo
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // For demo, we'll return empty results to show the enhanced empty state
      setSearchResults([]);
      setTotalResults(0);
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
    setTotalResults(0);
    setSearched(false);
  };

  // Clear search filters
  const clearFilters = () => {
    setKeywords('');
    setCategory('');
    setSortBy('relevance');
    setSearchResults([]);
    setTotalResults(0);
    setSearched(false);
  };

  // Toggle filters visibility (for mobile)
  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  const handleManualLocationEntry = () => {
    setLocationError(false);
    // Focus on location input
    const locationInput = document.querySelector('input[placeholder*="City"]');
    if (locationInput) {
      locationInput.focus();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Helmet>
        <title>Location-based Search | Kelmah</title>
      </Helmet>

      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          🌍 Find {searchType === 0 ? 'Jobs' : 'Talent'} Near You
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
          Connect with local opportunities and professionals in your area. 
          Distance matters - find work and talent that's convenient for everyone.
        </Typography>
      </Box>

      <Paper sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
        <Tabs
          value={searchType}
          onChange={handleTabChange}
          variant={isMobile ? 'fullWidth' : 'standard'}
          aria-label="search type tabs"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 'bold',
              textTransform: 'none',
              fontSize: '1.1rem'
            }
          }}
        >
          <Tab 
            icon={<WorkIcon />} 
            label="Find Jobs" 
            iconPosition="start"
          />
          <Tab 
            icon={<PersonIcon />} 
            label="Find Talent" 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {locationError && (
        <LocationErrorFallback
          onRetry={getCurrentLocation}
          onManualEntry={handleManualLocationEntry}
        />
      )}

      <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
          🎯 Search Parameters
        </Typography>
        
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={5}>
            <Box sx={{ position: 'relative' }}>
              <TextField
                fullWidth
                label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State, Country"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Use your current location">
                        <IconButton 
                          onClick={getCurrentLocation} 
                          edge="end"
                          disabled={loading}
                          color="primary"
                        >
                          {loading ? <CircularProgress size={20} /> : <MyLocationIcon />}
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
              {suggestedLocations.length > 0 && (
                <Paper
                  elevation={8}
                  sx={{
                    mt: 1,
                    position: 'absolute',
                    zIndex: 100,
                    width: '100%',
                    maxHeight: 200,
                    overflow: 'auto',
                    borderRadius: 2,
                  }}
                >
                  <List dense>
                    {suggestedLocations.map((item) => (
                      <ListItem
                        button
                        key={item.id}
                        onClick={() => {
                          setLocation(item.description);
                          setSuggestedLocations([]);
                        }}
                        sx={{
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.1)
                          }
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <LocationIcon fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={item.description} />
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
                  borderRadius: 2,
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="primary" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={8} md={2}>
            <Box>
              <Typography variant="body2" gutterBottom fontWeight="medium" color="primary">
                Search Radius: {distance} miles
              </Typography>
              <Slider
                value={distance}
                onChange={(e, newValue) => setDistance(newValue)}
                aria-labelledby="distance-slider"
                min={5}
                max={100}
                step={5}
                sx={{
                  '& .MuiSlider-thumb': {
                    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                  }
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={4} md={1}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => handleSearch(1)}
              disabled={loading}
              sx={{
                py: 2,
                borderRadius: 2,
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                fontWeight: 'bold'
              }}
              startIcon={
                loading ? <CircularProgress size={20} /> : <SearchIcon />
              }
            >
              {isMobile ? '' : 'Search'}
            </Button>
          </Grid>

          {isMobile && (
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={toggleFilters}
                sx={{ borderRadius: 2, fontWeight: 'bold' }}
              >
                {filtersVisible ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </Grid>
          )}
        </Grid>

        {filtersVisible && (
          <Grow in>
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3} alignItems="center">
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
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="text"
                      startIcon={<ClearIcon />}
                      onClick={clearFilters}
                      sx={{ fontWeight: 'bold' }}
                    >
                      Clear Filters
                    </Button>

                    <Button
                      variant="contained"
                      onClick={() => handleSearch(1)}
                      disabled={loading}
                      sx={{
                        background: `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.primary.main} 90%)`,
                        fontWeight: 'bold'
                      }}
                      startIcon={
                        loading ? <CircularProgress size={20} /> : <SortIcon />
                      }
                    >
                      Apply Filters
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </Grow>
        )}
      </Paper>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <TabPanel value={searchType} index={0}>
        {/* Jobs search results */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={60} />
          </Box>
        ) : searched && searchResults.length === 0 ? (
          <EmptySearchState 
            searchType={0} 
            location={location}
            onGetStarted={() => navigate('/jobs')}
          />
        ) : (
          <>
            {totalResults > 0 && (
              <Box
                sx={{
                  mb: 3,
                  p: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.1)} 100%)`,
                  borderRadius: 3,
                }}
              >
                <Typography variant="h6" fontWeight="bold">
                  📍 {totalResults} job{totalResults !== 1 ? 's' : ''} found within{' '}
                  {distance} miles of {location}
                </Typography>

                <Chip 
                  label={`Page ${currentPage}`} 
                  variant="outlined" 
                  color="primary"
                />
              </Box>
            )}

            <Grid container spacing={3}>
              {searchResults.map((job) => (
                <Grid item xs={12} key={job.id}>
                  <JobCard job={job} showLocation={true} />
                </Grid>
              ))}
            </Grid>

            {totalResults > 10 && (
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Stack direction="row" spacing={2}>
                  <Button
                    disabled={currentPage === 1 || loading}
                    onClick={() => handleSearch(currentPage - 1)}
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  >
                    Previous Page
                  </Button>

                  <Button
                    disabled={currentPage * 10 >= totalResults || loading}
                    onClick={() => handleSearch(currentPage + 1)}
                    variant="contained"
                    sx={{
                      background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                      borderRadius: 2
                    }}
                  >
                    Next Page
                  </Button>
                </Stack>
              </Box>
            )}
          </>
        )}
      </TabPanel>

      <TabPanel value={searchType} index={1}>
        {/* Workers search results */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={60} />
          </Box>
        ) : searched && searchResults.length === 0 ? (
          <EmptySearchState 
            searchType={1} 
            location={location}
            onGetStarted={() => navigate('/find-talents')}
          />
        ) : (
          <>
            {totalResults > 0 && (
              <Box
                sx={{
                  mb: 3,
                  p: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.1)} 100%)`,
                  borderRadius: 3,
                }}
              >
                <Typography variant="h6" fontWeight="bold">
                  👥 {totalResults} worker{totalResults !== 1 ? 's' : ''} found
                  within {distance} miles of {location}
                </Typography>

                <Chip 
                  label={`Page ${currentPage}`} 
                  variant="outlined" 
                  color="primary"
                />
              </Box>
            )}

            <Grid container spacing={3}>
              {searchResults.map((worker) => (
                <Grid item xs={12} sm={6} md={4} key={worker.id}>
                  <WorkerCard worker={worker} showLocation={true} />
                </Grid>
              ))}
            </Grid>

            {totalResults > 10 && (
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Stack direction="row" spacing={2}>
                  <Button
                    disabled={currentPage === 1 || loading}
                    onClick={() => handleSearch(currentPage - 1)}
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  >
                    Previous Page
                  </Button>

                  <Button
                    disabled={currentPage * 10 >= totalResults || loading}
                    onClick={() => handleSearch(currentPage + 1)}
                    variant="contained"
                    sx={{
                      background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                      borderRadius: 2
                    }}
                  >
                    Next Page
                  </Button>
                </Stack>
              </Box>
            )}
          </>
        )}
      </TabPanel>
    </Container>
  );
};

export default GeoLocationSearch;
