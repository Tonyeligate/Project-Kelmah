import React, { useState, useEffect, useCallback } from 'react';
import { Box, TextField, Button, Card, CardContent, Typography, Grid, Divider, 
  Chip, Rating, CircularProgress, Slider, MenuItem, FormControl, InputLabel, Select,
  Autocomplete, Paper, IconButton, Alert, Collapse } from '@mui/material';
import { Search as SearchIcon, FilterList as FilterListIcon, LocationOn as LocationIcon,
  Close as CloseIcon, Save as SaveIcon, Bookmark as BookmarkIcon } from '@mui/icons-material';
import { useSearch } from '../../contexts/SearchContext';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import WorkerCard from '../worker/WorkerCard';

// Categories for workers
const categories = [
  'Web Development', 'Mobile Development', 'Design', 'Writing', 'Translation',
  'Marketing', 'Sales', 'Customer Service', 'Admin Support', 'Accounting',
  'Legal', 'Engineering', 'Other'
];

// Skills for autocomplete
const commonSkills = [
  'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'C#', 'PHP', 'HTML', 'CSS',
  'SQL', 'NoSQL', 'MongoDB', 'AWS', 'Azure', 'UI/UX', 'Photoshop', 'Illustrator',
  'Content Writing', 'SEO', 'Social Media Marketing', 'Data Analysis', 'Excel'
];

const WorkerSearch = () => {
  const { searchWorkers, workerSearchResults, saveSearch } = useSearch();
  const { authState } = useAuth();
  const navigate = useNavigate();
  
  // Filter states
  const [keyword, setKeyword] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [ratingRange, setRatingRange] = useState([0, 5]);
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [jobType, setJobType] = useState('');
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [distance, setDistance] = useState(50);
  const [sortBy, setSortBy] = useState('rating');
  const [sortDirection, setSortDirection] = useState('DESC');
  
  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [saveSearchOpen, setSaveSearchOpen] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [saveSearchError, setSaveSearchError] = useState('');
  const [page, setPage] = useState(1);
  
  // Handle search form submission
  const handleSearch = useCallback(async (newPage = 1) => {
    setPage(newPage);
    
    const searchParams = {
      keyword,
      skills: selectedSkills,
      categories: selectedCategories,
      minRating: ratingRange[0],
      maxRating: ratingRange[1],
      priceRange: {
        min: priceRange[0],
        max: priceRange[1]
      },
      jobType,
      sortBy,
      sortDirection,
      page: newPage,
      limit: 10
    };
    
    // Add location if available
    if (location.latitude && location.longitude) {
      searchParams.latitude = location.latitude;
      searchParams.longitude = location.longitude;
      searchParams.distance = distance;
    }
    
    await searchWorkers(searchParams);
  }, [
    keyword, selectedSkills, selectedCategories, ratingRange, priceRange,
    jobType, sortBy, sortDirection, location, distance, searchWorkers
  ]);
  
  // Handle getting user's current location
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setUseCurrentLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setUseCurrentLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setUseCurrentLocation(false);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };
  
  // Handle saving a search
  const handleSaveSearch = async () => {
    if (!authState.isAuthenticated) {
      navigate('/login', { state: { from: '/search/workers' } });
      return;
    }
    
    if (!saveSearchName.trim()) {
      setSaveSearchError('Please enter a name for your saved search');
      return;
    }
    
    try {
      await saveSearch(saveSearchName, 'worker', {
        keyword,
        skills: selectedSkills,
        categories: selectedCategories,
        minRating: ratingRange[0],
        maxRating: ratingRange[1],
        priceRange: {
          min: priceRange[0],
          max: priceRange[1]
        },
        jobType,
        sortBy,
        sortDirection,
        location: location.latitude && location.longitude ? {
          latitude: location.latitude,
          longitude: location.longitude,
          distance
        } : null
      });
      
      setSaveSearchOpen(false);
      setSaveSearchName('');
      setSaveSearchError('');
    } catch (error) {
      setSaveSearchError('Failed to save search. Please try again.');
    }
  };
  
  // Reset all filters
  const handleResetFilters = () => {
    setKeyword('');
    setSelectedSkills([]);
    setSelectedCategories([]);
    setRatingRange([0, 5]);
    setPriceRange([0, 100]);
    setJobType('');
    setLocation({ latitude: null, longitude: null });
    setDistance(50);
    setSortBy('rating');
    setSortDirection('DESC');
  };
  
  // Load more results
  const handleLoadMore = () => {
    handleSearch(page + 1);
  };
  
  useEffect(() => {
    // Initial search
    handleSearch();
  }, [handleSearch]);
  
  const { workers, total, loading, error } = workerSearchResults;
  
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Find Skilled Workers
      </Typography>
      
      {/* Search Bar */}
      <Paper
        component="form"
        sx={{
          p: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          mb: 2
        }}
        elevation={3}
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch(1);
        }}
      >
        <TextField
          sx={{ ml: 1, flex: 1 }}
          placeholder="Search for skills, job titles, or keywords"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          variant="standard"
          InputProps={{ disableUnderline: true }}
        />
        <IconButton 
          onClick={() => handleSearch(1)} 
          sx={{ p: '10px' }}
          aria-label="search"
        >
          <SearchIcon />
        </IconButton>
        <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
        <IconButton 
          color={showFilters ? 'primary' : 'default'}
          sx={{ p: '10px' }}
          aria-label="filters"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FilterListIcon />
        </IconButton>
        <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
        <IconButton
          color="primary"
          sx={{ p: '10px' }}
          aria-label="save search"
          onClick={() => setSaveSearchOpen(true)}
          disabled={!authState.isAuthenticated}
        >
          <SaveIcon />
        </IconButton>
      </Paper>
      
      {/* Save Search Dialog */}
      <Collapse in={saveSearchOpen}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">Save this search</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Search Name"
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              error={!!saveSearchError}
              helperText={saveSearchError}
            />
            <Button
              variant="contained"
              startIcon={<BookmarkIcon />}
              onClick={handleSaveSearch}
              sx={{ ml: 1 }}
            >
              Save
            </Button>
            <IconButton
              size="small"
              onClick={() => {
                setSaveSearchOpen(false);
                setSaveSearchError('');
              }}
              sx={{ ml: 1 }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Paper>
      </Collapse>
      
      {/* Advanced Filters */}
      <Collapse in={showFilters}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Advanced Filters
            </Typography>
            
            <Grid container spacing={2}>
              {/* Skills */}
              <Grid item xs={12} md={6}>
                <Autocomplete
                  multiple
                  options={commonSkills}
                  value={selectedSkills}
                  onChange={(_, newValue) => setSelectedSkills(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      label="Skills"
                      placeholder="Add skills"
                      fullWidth
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        {...getTagProps({ index })}
                        key={option}
                      />
                    ))
                  }
                  freeSolo
                />
              </Grid>
              
              {/* Categories */}
              <Grid item xs={12} md={6}>
                <Autocomplete
                  multiple
                  options={categories}
                  value={selectedCategories}
                  onChange={(_, newValue) => setSelectedCategories(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      label="Categories"
                      placeholder="Select categories"
                      fullWidth
                    />
                  )}
                />
              </Grid>
              
              {/* Rating Range */}
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Rating</Typography>
                <Box sx={{ px: 2 }}>
                  <Slider
                    value={ratingRange}
                    onChange={(_, newValue) => setRatingRange(newValue)}
                    valueLabelDisplay="auto"
                    min={0}
                    max={5}
                    step={0.5}
                    marks={[
                      { value: 0, label: '0' },
                      { value: 5, label: '5' }
                    ]}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    Min: {ratingRange[0]}
                  </Typography>
                  <Typography variant="body2">
                    Max: {ratingRange[1]}
                  </Typography>
                </Box>
              </Grid>
              
              {/* Price Range */}
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Hourly Rate ($)</Typography>
                <Box sx={{ px: 2 }}>
                  <Slider
                    value={priceRange}
                    onChange={(_, newValue) => setPriceRange(newValue)}
                    valueLabelDisplay="auto"
                    min={0}
                    max={100}
                    step={5}
                    marks={[
                      { value: 0, label: '$0' },
                      { value: 100, label: '$100+' }
                    ]}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    Min: ${priceRange[0]}
                  </Typography>
                  <Typography variant="body2">
                    Max: ${priceRange[1]}
                  </Typography>
                </Box>
              </Grid>
              
              {/* Job Type */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Job Type</InputLabel>
                  <Select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    label="Job Type"
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="fullTime">Full Time</MenuItem>
                    <MenuItem value="partTime">Part Time</MenuItem>
                    <MenuItem value="contract">Contract</MenuItem>
                    <MenuItem value="oneTime">One-time Project</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Sort Options */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    label="Sort By"
                  >
                    <MenuItem value="rating">Rating</MenuItem>
                    <MenuItem value="hourlyRate">Hourly Rate</MenuItem>
                    <MenuItem value="relevance">Relevance</MenuItem>
                    <MenuItem value="createdAt">Join Date</MenuItem>
                  </Select>
                </FormControl>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button 
                    size="small"
                    onClick={() => setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC')}
                  >
                    {sortDirection === 'ASC' ? 'Ascending' : 'Descending'}
                  </Button>
                </Box>
              </Grid>
              
              {/* Location */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <LocationIcon sx={{ mt: 1, mr: 1, color: 'action.active' }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" gutterBottom>
                      Location-based Search
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleGetCurrentLocation}
                      disabled={useCurrentLocation}
                      startIcon={useCurrentLocation ? <CircularProgress size={16} /> : null}
                    >
                      Use My Location
                    </Button>
                    {location.latitude && location.longitude && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Using location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <Typography variant="body2" sx={{ mr: 2, minWidth: 80 }}>
                            Distance: {distance} km
                          </Typography>
                          <Slider
                            value={distance}
                            onChange={(_, newValue) => setDistance(newValue)}
                            min={5}
                            max={100}
                            step={5}
                            sx={{ mx: 2, flexGrow: 1 }}
                          />
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Grid>
              
              {/* Filter Action Buttons */}
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button onClick={handleResetFilters} sx={{ mr: 1 }}>
                  Reset Filters
                </Button>
                <Button 
                  variant="contained" 
                  onClick={() => handleSearch(1)}
                  startIcon={<SearchIcon />}
                >
                  Apply Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Collapse>
      
      {/* Search Results */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading && page === 1 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {total} workers found
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            {workers.map((worker) => (
              <Grid item xs={12} sm={6} md={4} key={worker.id}>
                <WorkerCard worker={worker} />
              </Grid>
            ))}
          </Grid>
          
          {workers.length === 0 && !loading && (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="h6">No workers found</Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search criteria
              </Typography>
            </Box>
          )}
          
          {workers.length > 0 && workers.length < total && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button 
                variant="outlined" 
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Load More'}
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default WorkerSearch; 