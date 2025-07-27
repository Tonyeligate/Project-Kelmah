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
        p: { xs: 4, sm: 6 },
        mb: 4,
        textAlign: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        border: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 50% 50%, ${alpha(theme.palette.secondary.main, 0.05)} 0%, transparent 70%)`,
          pointerEvents: 'none'
        }
      }}
    >
      <Place sx={{ 
        fontSize: 80, 
        color: theme.palette.secondary.main, 
        mb: 3,
        position: 'relative',
        zIndex: 1
      }} />
      <Typography 
        variant="h4" 
        gutterBottom 
        fontWeight="bold"
        sx={{
          color: theme.palette.secondary.main,
          fontSize: { xs: '1.5rem', sm: '2rem' },
          position: 'relative',
          zIndex: 1
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
          position: 'relative',
          zIndex: 1
        }}
      >
        To show you the most relevant jobs and professionals in your area, we need to know your location. 
        You can either allow location access or enter your city manually.
      </Typography>
      
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        spacing={3} 
        justifyContent="center"
        sx={{ mb: 4, position: 'relative', zIndex: 1 }}
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
              boxShadow: `0 8px 25px ${alpha(theme.palette.secondary.main, 0.5)}`
            }
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
            }
          }}
        >
          Enter Location Manually
        </Button>
      </Stack>
      
      <Box sx={{ 
        p: 3, 
        backgroundColor: alpha(theme.palette.secondary.main, 0.1), 
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
        position: 'relative',
        zIndex: 1
      }}>
        <Typography 
          variant="body1" 
          sx={{
            color: theme.palette.text.primary,
            fontSize: '1rem',
            fontWeight: 500,
            lineHeight: 1.6
          }}
        >
          💡 <Typography component="span" sx={{ fontWeight: 'bold', color: theme.palette.secondary.main }}>
            Why location matters:
          </Typography> We use your location to show nearby opportunities, 
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
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at 50% 50%, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 70%)`,
            pointerEvents: 'none'
          }
        }}
      >
        {searchType === 0 ? (
          <WorkIcon sx={{ 
            fontSize: 100, 
            color: theme.palette.secondary.main, 
            mb: 3,
            position: 'relative',
            zIndex: 1
          }} />
        ) : (
          <PersonIcon sx={{ 
            fontSize: 100, 
            color: theme.palette.secondary.main, 
            mb: 3,
            position: 'relative',
            zIndex: 1
          }} />
        )}
        
        <Typography 
          variant="h3" 
          gutterBottom 
          fontWeight="bold"
          sx={{
            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
            color: theme.palette.secondary.main,
            textShadow: `0 2px 4px ${alpha(theme.palette.common.black, 0.3)}`,
            position: 'relative',
            zIndex: 1
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
            position: 'relative',
            zIndex: 1
          }}
        >
          {searchType === 0 
            ? `We couldn't find any jobs matching your criteria in ${location || 'your area'}. But don't worry - new opportunities are posted daily!`
            : `We couldn't find any professionals matching your criteria in ${location || 'your area'}. Try adjusting your search parameters.`
          }
        </Typography>

        <Typography 
          variant="h5" 
          gutterBottom 
          sx={{
            color: theme.palette.secondary.main,
            fontWeight: 'bold',
            mb: 4,
            position: 'relative',
            zIndex: 1
          }}
        >
          💡 Try These Suggestions:
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {suggestions.map((suggestion, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Box sx={{ 
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
                  boxShadow: `0 8px 25px ${alpha(theme.palette.secondary.main, 0.3)}`
                }
              }}>
                <CheckCircle 
                  sx={{ 
                    color: theme.palette.secondary.main, 
                    mb: 2,
                    fontSize: 32
                  }} 
                />
                <Typography 
                  variant="body1"
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 500,
                    fontSize: '1rem',
                    lineHeight: 1.5
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
            position: 'relative',
            zIndex: 1,
            '&:hover': {
              backgroundColor: theme.palette.secondary.dark,
              transform: 'translateY(-3px)',
              boxShadow: `0 12px 30px ${alpha(theme.palette.secondary.main, 0.5)}`
            }
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

      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography 
          variant="h2" 
          component="h1" 
          gutterBottom 
          fontWeight="bold"
          sx={{
            color: theme.palette.secondary.main,
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            textShadow: `0 2px 4px ${alpha(theme.palette.common.black, 0.3)}`,
            mb: 2
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
            lineHeight: 1.6
          }}
        >
          Connect with local opportunities and professionals in your area. 
          Distance matters - find work and talent that's convenient for everyone.
        </Typography>
      </Box>

      <Paper sx={{ 
        mb: 4, 
        borderRadius: 3, 
        overflow: 'hidden',
        border: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
        backgroundColor: theme.palette.background.paper,
        '&:hover': {
          borderColor: theme.palette.secondary.main,
          boxShadow: `0 8px 32px ${alpha(theme.palette.secondary.main, 0.2)}`
        }
      }}>
        <Tabs
          value={searchType}
          onChange={handleTabChange}
          variant={isMobile ? 'fullWidth' : 'standard'}
          aria-label="search type tabs"
          sx={{
            backgroundColor: alpha(theme.palette.secondary.main, 0.1),
            '& .MuiTab-root': {
              fontWeight: 'bold',
              textTransform: 'none',
              fontSize: { xs: '1rem', sm: '1.2rem' },
              py: 2,
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.secondary.main
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: theme.palette.secondary.main,
              height: 4
            }
          }}
        >
          <Tab 
            icon={<WorkIcon sx={{ fontSize: 28 }} />} 
            label="Find Jobs" 
            iconPosition="start"
          />
          <Tab 
            icon={<PersonIcon sx={{ fontSize: 28 }} />} 
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

      <Paper sx={{ 
        p: { xs: 3, sm: 4, md: 5 }, 
        mb: 4, 
        borderRadius: 3,
        border: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
        backgroundColor: theme.palette.background.paper,
        boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.2)}`,
        '&:hover': {
          borderColor: theme.palette.secondary.main,
          boxShadow: `0 12px 40px ${alpha(theme.palette.secondary.main, 0.2)}`
        }
      }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          fontWeight="bold" 
          sx={{
            color: theme.palette.secondary.main,
            textAlign: 'center',
            mb: 4,
            fontSize: { xs: '1.5rem', sm: '2rem' }
          }}
        >
          🎯 Search Parameters
        </Typography>
        
        <Grid container spacing={4} alignItems="center">
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
                    borderRadius: 3,
                    backgroundColor: alpha(theme.palette.background.default, 0.3),
                    fontSize: '1rem',
                    '& fieldset': { 
                      borderColor: theme.palette.secondary.main,
                      borderWidth: 2
                    },
                    '&:hover fieldset': { 
                      borderColor: theme.palette.secondary.light,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.secondary.main,
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: theme.palette.text.secondary,
                    fontWeight: 600,
                    '&.Mui-focused': {
                      color: theme.palette.secondary.main
                    }
                  },
                  '& .MuiInputBase-input': {
                    color: theme.palette.text.primary,
                    fontSize: '1rem',
                    fontWeight: 500,
                    '&::placeholder': {
                      color: theme.palette.text.secondary,
                      opacity: 0.8
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon sx={{ color: theme.palette.secondary.main, fontSize: 28 }} />
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
                              backgroundColor: alpha(theme.palette.secondary.main, 0.1)
                            }
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
                          setSuggestedLocations([]);
                        }}
                        sx={{
                          py: 1.5,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.secondary.main, 0.1)
                          }
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
                              fontWeight: 500
                            }
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
                  fontSize: '1rem',
                  '& fieldset': { 
                    borderColor: theme.palette.secondary.main,
                    borderWidth: 2
                  },
                  '&:hover fieldset': { 
                    borderColor: theme.palette.secondary.light,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.secondary.main,
                  }
                },
                '& .MuiInputLabel-root': {
                  color: theme.palette.text.secondary,
                  fontWeight: 600,
                  '&.Mui-focused': {
                    color: theme.palette.secondary.main
                  }
                },
                '& .MuiInputBase-input': {
                  color: theme.palette.text.primary,
                  fontSize: '1rem',
                  fontWeight: 500,
                  '&::placeholder': {
                    color: theme.palette.text.secondary,
                    opacity: 0.8
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: theme.palette.secondary.main, fontSize: 28 }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={8} md={2}>
            <Box>
              <Typography 
                variant="h6" 
                gutterBottom 
                fontWeight="bold" 
                sx={{
                  color: theme.palette.secondary.main,
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  textAlign: 'center'
                }}
              >
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
                    backgroundColor: theme.palette.secondary.main,
                    border: `3px solid ${theme.palette.secondary.main}`,
                    width: 24,
                    height: 24,
                    '&:hover': {
                      boxShadow: `0 0 0 8px ${alpha(theme.palette.secondary.main, 0.16)}`
                    }
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: theme.palette.secondary.main,
                    height: 6
                  },
                  '& .MuiSlider-rail': {
                    backgroundColor: alpha(theme.palette.secondary.main, 0.3),
                    height: 6
                  },
                  '& .MuiSlider-mark': {
                    backgroundColor: theme.palette.secondary.main
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
                py: 2.5,
                borderRadius: 3,
                backgroundColor: theme.palette.secondary.main,
                color: theme.palette.secondary.contrastText,
                fontWeight: 'bold',
                fontSize: { xs: '0.9rem', sm: '1rem' },
                '&:hover': {
                  backgroundColor: theme.palette.secondary.dark,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 25px ${alpha(theme.palette.secondary.main, 0.4)}`
                },
                '&:disabled': {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.5)
                }
              }}
              startIcon={
                loading ? (
                  <CircularProgress size={20} sx={{ color: 'currentColor' }} />
                ) : (
                  <SearchIcon />
                )
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
                sx={{ 
                  borderRadius: 3, 
                  fontWeight: 'bold',
                  py: 1.5,
                  borderColor: theme.palette.secondary.main,
                  color: theme.palette.secondary.main,
                  borderWidth: 2,
                  '&:hover': {
                    borderColor: theme.palette.secondary.light,
                    backgroundColor: alpha(theme.palette.secondary.main, 0.1)
                  }
                }}
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
