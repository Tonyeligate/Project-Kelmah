import React, { useState, useEffect, useCallback } from 'react';
import { Box, TextField, Button, Card, CardContent, Typography, Grid, Divider, 
  Chip, CircularProgress, Slider, MenuItem, FormControl, InputLabel, Select,
  Autocomplete, Paper, IconButton, Alert, Collapse, Pagination } from '@mui/material';
import { Search as SearchIcon, FilterList as FilterListIcon, LocationOn as LocationIcon,
  Close as CloseIcon, Save as SaveIcon, Bookmark as BookmarkIcon } from '@mui/icons-material';
import { useSearch } from '../../contexts/SearchContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import JobCard from '../job/JobCard';

// Categories for jobs
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

const JobSearch = () => {
  const { searchJobs, jobSearchResults, saveSearch } = useSearch();
  const { authState } = useAuth();
  const navigate = useNavigate();
  
  // Filter states
  const [keyword, setKeyword] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [jobType, setJobType] = useState('');
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [distance, setDistance] = useState(50);
  const [sortBy, setSortBy] = useState('createdAt');
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
      budgetMin: budgetMin || null,
      budgetMax: budgetMax || null,
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
    
    await searchJobs(searchParams);
  }, [
    keyword, selectedSkills, selectedCategories, budgetMin, budgetMax,
    jobType, sortBy, sortDirection, location, distance, searchJobs
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
      navigate('/login', { state: { from: '/search/jobs' } });
      return;
    }
    
    if (!saveSearchName.trim()) {
      setSaveSearchError('Please enter a name for your saved search');
      return;
    }
    
    try {
      await saveSearch(saveSearchName, 'job', {
        keyword,
        skills: selectedSkills,
        categories: selectedCategories,
        budgetMin: budgetMin || null,
        budgetMax: budgetMax || null,
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
    setBudgetMin('');
    setBudgetMax('');
    setJobType('');
    setLocation({ latitude: null, longitude: null });
    setDistance(50);
    setSortBy('createdAt');
    setSortDirection('DESC');
  };
  
  // Handle page change
  const handlePageChange = (event, value) => {
    handleSearch(value);
  };
  
  useEffect(() => {
    // Initial search
    handleSearch();
  }, [handleSearch]);
  
  const { jobs, total, loading, error } = jobSearchResults;
  const totalPages = Math.ceil(total / 10) || 1;
  
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Find Jobs
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
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Save this search</Typography>
              <IconButton onClick={() => setSaveSearchOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            {saveSearchError && (
              <Alert severity="error" sx={{ mb: 2 }}>{saveSearchError}</Alert>
            )}
            <TextField
              fullWidth
              label="Search Name"
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              margin="normal"
              placeholder="e.g., Frontend Developer Jobs"
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button 
                variant="outlined" 
                sx={{ mr: 1 }}
                onClick={() => setSaveSearchOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                startIcon={<BookmarkIcon />}
                onClick={handleSaveSearch}
              >
                Save Search
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Collapse>
      
      {/* Filter Panel */}
      <Collapse in={showFilters}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Filter Results</Typography>
              <IconButton onClick={() => setShowFilters(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            
            <Grid container spacing={3}>
              {/* Skills */}
              <Grid item xs={12} md={6}>
                <Autocomplete
                  multiple
                  options={commonSkills.filter(skill => !selectedSkills.includes(skill))}
                  value={selectedSkills}
                  onChange={(_, newValue) => setSelectedSkills(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Skills"
                      placeholder="Select skills"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip label={option} {...getTagProps({ index })} />
                    ))
                  }
                />
              </Grid>
              
              {/* Categories */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    multiple
                    value={selectedCategories}
                    onChange={(e) => setSelectedCategories(e.target.value)}
                    label="Category"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} />
                        ))}
                      </Box>
                    )}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Budget Range */}
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Budget</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TextField
                    label="Min"
                    type="number"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    InputProps={{
                      startAdornment: <Box sx={{ mr: 1 }}>$</Box>,
                    }}
                    variant="outlined"
                    size="small"
                  />
                  <Box>to</Box>
                  <TextField
                    label="Max"
                    type="number"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    InputProps={{
                      startAdornment: <Box sx={{ mr: 1 }}>$</Box>,
                    }}
                    variant="outlined"
                    size="small"
                  />
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
                    <MenuItem value="createdAt">Date Posted</MenuItem>
                    <MenuItem value="budget">Budget</MenuItem>
                    <MenuItem value="relevance">Relevance</MenuItem>
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
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Location</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<LocationIcon />}
                    onClick={handleGetCurrentLocation}
                    disabled={useCurrentLocation}
                  >
                    {useCurrentLocation ? 'Getting location...' : 'Use my location'}
                  </Button>
                  {location.latitude && location.longitude && (
                    <Button
                      size="small"
                      onClick={() => setLocation({ latitude: null, longitude: null })}
                    >
                      Clear
                    </Button>
                  )}
                </Box>
                {location.latitude && location.longitude && (
                  <>
                    <Typography variant="body2" gutterBottom>
                      Distance: {distance} miles
                    </Typography>
                    <Slider
                      value={distance}
                      onChange={(_, newValue) => setDistance(newValue)}
                      aria-labelledby="distance-slider"
                      min={5}
                      max={100}
                      step={5}
                    />
                  </>
                )}
              </Grid>
              
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
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : jobs && jobs.length > 0 ? (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Found {total} jobs{keyword ? ` for "${keyword}"` : ''}
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            {jobs.map((job) => (
              <Grid item xs={12} sm={6} md={4} key={job.id}>
                <JobCard job={job} />
              </Grid>
            ))}
          </Grid>
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Pagination 
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </>
      ) : (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body1">No jobs found</Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search filters
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default JobSearch; 