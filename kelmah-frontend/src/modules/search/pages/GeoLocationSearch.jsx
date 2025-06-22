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
  Tooltip
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
  Sort as SortIcon
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
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const GeoLocationSearch = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const user = useSelector(state => state.auth.user);
  
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
  
  // Categories for jobs and skills for workers
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  
  // Load categories and skills
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (searchType === 0) {
          // Fetch job categories
          const response = await axios.get(`${API_URL}/jobs/categories`);
          setCategories(response.data.data);
        } else {
          // Fetch skill categories
          const response = await axios.get(`${API_URL}/skills/categories`);
          setSkills(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching categories/skills:', err);
      }
    };
    
    fetchData();
  }, [searchType]);
  
  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Use reverse geocoding to get the location name
            const response = await axios.get(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
            );
            
            if (response.data.results.length > 0) {
              // Get city and state/country from result
              const addressComponents = response.data.results[0].address_components;
              let city, state, country;
              
              for (const component of addressComponents) {
                if (component.types.includes('locality')) {
                  city = component.long_name;
                } else if (component.types.includes('administrative_area_level_1')) {
                  state = component.long_name;
                } else if (component.types.includes('country')) {
                  country = component.long_name;
                }
              }
              
              let locationString = '';
              if (city) locationString += city;
              if (state) locationString += (locationString ? ', ' : '') + state;
              if (country && !state) locationString += (locationString ? ', ' : '') + country;
              
              setLocation(locationString);
            }
          } catch (err) {
            console.error('Error getting location name:', err);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error('Error getting current location:', error);
          setLoading(false);
          setError('Unable to get your current location. Please enter a location manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser. Please enter a location manually.');
    }
  };
  
  // Handle location suggestions
  const fetchLocationSuggestions = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 2) {
        setSuggestedLocations([]);
        return;
      }
      
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&types=(cities)&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
        );
        
        setSuggestedLocations(response.data.predictions.map(prediction => ({
          id: prediction.place_id,
          description: prediction.description
        })));
      } catch (err) {
        console.error('Error fetching location suggestions:', err);
      }
    }, 300),
    []
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
      const endpoint = searchType === 0 
        ? `${API_URL}/jobs/search/location` 
        : `${API_URL}/workers/search/location`;
      
      const response = await axios.get(endpoint, {
        params: {
          location,
          distance,
          keywords,
          category,
          sortBy,
          page,
          limit: 10
        },
        headers: { 
          Authorization: localStorage.getItem('token') 
            ? `Bearer ${localStorage.getItem('token')}` 
            : undefined 
        }
      });
      
      setSearchResults(response.data.data);
      setTotalResults(response.data.meta.total);
    } catch (err) {
      console.error('Error searching:', err);
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Auto-fetch the user's location on initial load
  useEffect(() => {
    getCurrentLocation();
  }, []);
  
  // Automatically perform search once location is obtained
  useEffect(() => {
    if (location && !searched) {
      handleSearch(1);
    }
  }, [location]);
  
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
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Helmet>
        <title>Location-based Search | Kelmah</title>
      </Helmet>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Find {searchType === 0 ? 'Jobs' : 'Talent'} Near You
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Search for {searchType === 0 ? 'jobs' : 'workers'} within your area or any location worldwide
        </Typography>
      </Box>
      
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={searchType}
          onChange={handleTabChange}
          variant={isMobile ? "fullWidth" : "standard"}
          aria-label="search type tabs"
        >
          <Tab icon={<WorkIcon />} label="Find Jobs" />
          <Tab icon={<PersonIcon />} label="Find Talent" />
        </Tabs>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, State, Country"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Use your current location">
                      <IconButton onClick={getCurrentLocation} edge="end">
                        <MyLocationIcon />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                )
              }}
            />
            {suggestedLocations.length > 0 && (
              <Paper 
                elevation={3} 
                sx={{ 
                  mt: 1, 
                  position: 'absolute', 
                  zIndex: 100, 
                  width: { xs: 'calc(100% - 48px)', md: 'calc(41.667% - 24px)' } 
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
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <LocationIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={item.description} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label={`Search for ${searchType === 0 ? 'jobs' : 'workers'}`}
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder={searchType === 0 ? "Job title, keywords" : "Skills, name, title"}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={8} md={2}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography id="distance-slider" variant="body2" sx={{ mr: 1, minWidth: 60 }}>
                {distance} miles
              </Typography>
              <Slider
                value={distance}
                onChange={(e, newValue) => setDistance(newValue)}
                aria-labelledby="distance-slider"
                min={5}
                max={100}
                step={5}
              />
            </Box>
          </Grid>
          
          <Grid item xs={4} md={1}>
            <Button 
              fullWidth 
              variant="contained" 
              onClick={() => handleSearch(1)}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
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
              >
                {filtersVisible ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </Grid>
          )}
        </Grid>
        
        {filtersVisible && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>{searchType === 0 ? 'Job Category' : 'Skill Category'}</InputLabel>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    label={searchType === 0 ? 'Job Category' : 'Skill Category'}
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
                <Button 
                  variant="text" 
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
                
                <Button 
                  variant="contained" 
                  sx={{ ml: 2 }}
                  onClick={() => handleSearch(1)}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SortIcon />}
                >
                  Apply Filters
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <TabPanel value={searchType} index={0}>
        {/* Jobs search results */}
        {searched && !loading && searchResults.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            No jobs found matching your search criteria. Try adjusting your filters or search in a different location.
          </Alert>
        ) : (
          <>
            {totalResults > 0 && (
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography>
                  {totalResults} job{totalResults !== 1 ? 's' : ''} found within {distance} miles of {location}
                </Typography>
                
                <Chip 
                  label={`Page ${currentPage}`} 
                  variant="outlined"
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
                <Button 
                  disabled={currentPage === 1 || loading}
                  onClick={() => handleSearch(currentPage - 1)}
                  sx={{ mx: 1 }}
                >
                  Previous Page
                </Button>
                
                <Button 
                  disabled={currentPage * 10 >= totalResults || loading}
                  onClick={() => handleSearch(currentPage + 1)}
                  sx={{ mx: 1 }}
                  variant="contained"
                >
                  Next Page
                </Button>
              </Box>
            )}
          </>
        )}
      </TabPanel>
      
      <TabPanel value={searchType} index={1}>
        {/* Workers search results */}
        {searched && !loading && searchResults.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            No workers found matching your search criteria. Try adjusting your filters or search in a different location.
          </Alert>
        ) : (
          <>
            {totalResults > 0 && (
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography>
                  {totalResults} worker{totalResults !== 1 ? 's' : ''} found within {distance} miles of {location}
                </Typography>
                
                <Chip 
                  label={`Page ${currentPage}`} 
                  variant="outlined"
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
                <Button 
                  disabled={currentPage === 1 || loading}
                  onClick={() => handleSearch(currentPage - 1)}
                  sx={{ mx: 1 }}
                >
                  Previous Page
                </Button>
                
                <Button 
                  disabled={currentPage * 10 >= totalResults || loading}
                  onClick={() => handleSearch(currentPage + 1)}
                  sx={{ mx: 1 }}
                  variant="contained"
                >
                  Next Page
                </Button>
              </Box>
            )}
          </>
        )}
      </TabPanel>
    </Container>
  );
};

export default GeoLocationSearch; 




