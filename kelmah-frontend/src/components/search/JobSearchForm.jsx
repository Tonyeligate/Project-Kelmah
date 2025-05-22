import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  Typography,
  Slider,
  Chip,
  InputAdornment,
  Divider,
  Paper,
  Autocomplete,
  FormControlLabel,
  Switch,
  IconButton,
  Collapse
} from '@mui/material';
import { 
  Search as SearchIcon,
  FilterList as FilterIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Work as WorkIcon,
  Category as CategoryIcon,
  Tune as TuneIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import LocationAutocomplete from './LocationAutocomplete';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
}));

const FilterButton = styled(Button)(({ theme }) => ({
  marginRight: theme.spacing(1),
  marginBottom: theme.spacing(1),
  borderRadius: theme.spacing(4),
  textTransform: 'none',
  fontWeight: 500
}));

// Job categories and types data - in a real app, these would come from an API
const JOB_CATEGORIES = [
  'Software Development',
  'Design',
  'Marketing',
  'Customer Service',
  'Writing',
  'Admin Support',
  'Finance',
  'Legal',
  'Engineering',
  'Sales',
  'Education'
];

const JOB_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Temporary',
  'Internship',
  'Remote'
];

const SKILLS = [
  'JavaScript',
  'React',
  'Python',
  'Design',
  'Marketing',
  'Content Writing',
  'SEO',
  'Project Management',
  'Customer Support',
  'Data Analysis',
  'Mobile Development',
  'WordPress'
];

/**
 * Enhanced job search form with location autocomplete and advanced filters
 * 
 * @param {Object} props
 * @param {Function} props.onSearch - Function to handle the search submission
 * @param {Object} props.initialFilters - Initial filter values
 */
const JobSearchForm = ({ onSearch, initialFilters = {} }) => {
  // Search form state
  const [keyword, setKeyword] = useState(initialFilters.keyword || '');
  const [location, setLocation] = useState(initialFilters.location || null);
  const [distance, setDistance] = useState(initialFilters.distance || 50);
  const [selectedCategories, setSelectedCategories] = useState(initialFilters.categories || []);
  const [selectedSkills, setSelectedSkills] = useState(initialFilters.skills || []);
  const [jobType, setJobType] = useState(initialFilters.jobType || '');
  const [budgetRange, setBudgetRange] = useState(initialFilters.budgetRange || [0, 100]);
  const [experienceLevel, setExperienceLevel] = useState(initialFilters.experienceLevel || '');
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showLocationFilters, setShowLocationFilters] = useState(!!location);
  
  // Handle search submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prepare search parameters
    const searchParams = {
      keyword,
      jobType,
      categories: selectedCategories,
      skills: selectedSkills,
      experienceLevel,
      budgetMin: budgetRange[0] > 0 ? budgetRange[0] : null,
      budgetMax: budgetRange[1] < 100 ? budgetRange[1] : null
    };
    
    // Add location parameters if a location is selected
    if (location) {
      searchParams.location = {
        latitude: location.coordinates?.latitude,
        longitude: location.coordinates?.longitude,
        address: location.formattedAddress,
        city: location.city,
        region: location.region,
        country: location.country
      };
      searchParams.distance = distance;
    }
    
    // Call the parent component's search handler
    if (onSearch) {
      onSearch(searchParams);
    }
  };
  
  // Handle location selection
  const handleLocationSelect = (selectedLocation) => {
    setLocation(selectedLocation);
    setShowLocationFilters(!!selectedLocation);
  };
  
  // Handle category toggles
  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  // Reset all filters
  const handleResetFilters = () => {
    setKeyword('');
    setLocation(null);
    setDistance(50);
    setSelectedCategories([]);
    setSelectedSkills([]);
    setJobType('');
    setBudgetRange([0, 100]);
    setExperienceLevel('');
    setShowLocationFilters(false);
  };
  
  return (
    <StyledPaper elevation={2}>
      <form onSubmit={handleSubmit}>
        {/* Main search bar */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Job title, keywords, or company"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <LocationAutocomplete
              onLocationSelect={handleLocationSelect}
              initialLocation={location}
              placeholder="City, region, or country"
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              size="large"
              startIcon={<SearchIcon />}
              sx={{
                height: '100%',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold'
              }}
            >
              Search
            </Button>
          </Grid>
        </Grid>
        
        {/* Filter toggle button */}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            startIcon={<FilterIcon />}
            endIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ textTransform: 'none' }}
          >
            {showFilters ? 'Hide Filters' : 'Show Advanced Filters'}
          </Button>
          
          {showFilters && (
            <Button 
              size="small" 
              onClick={handleResetFilters}
              sx={{ textTransform: 'none' }}
            >
              Reset Filters
            </Button>
          )}
        </Box>
        
        {/* Advanced filters section */}
        <Collapse in={showFilters}>
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              {/* Location radius filter - only show when location is selected */}
              {showLocationFilters && (
                <Grid item xs={12}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationIcon fontSize="small" sx={{ mr: 1 }} />
                      Distance from {location?.city || location?.formattedAddress}
                    </Typography>
                    <Box sx={{ px: 2 }}>
                      <Slider
                        value={distance}
                        onChange={(_, newValue) => setDistance(newValue)}
                        valueLabelDisplay="auto"
                        min={5}
                        max={100}
                        step={5}
                        marks={[
                          { value: 5, label: '5 km' },
                          { value: 25, label: '25 km' },
                          { value: 50, label: '50 km' },
                          { value: 75, label: '75 km' },
                          { value: 100, label: '100+ km' }
                        ]}
                      />
                    </Box>
                  </Box>
                  <Divider sx={{ mt: 2, mb: 2 }} />
                </Grid>
              )}
              
              {/* Job Type filter */}
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <WorkIcon fontSize="small" sx={{ mr: 1 }} />
                  Job Type
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  variant="outlined"
                  size="small"
                >
                  <MenuItem value="">All Types</MenuItem>
                  {JOB_TYPES.map((type) => (
                    <MenuItem key={type} value={type.toLowerCase()}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              {/* Experience Level filter */}
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <TuneIcon fontSize="small" sx={{ mr: 1 }} />
                  Experience Level
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  variant="outlined"
                  size="small"
                >
                  <MenuItem value="">All Levels</MenuItem>
                  <MenuItem value="entry">Entry Level</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="expert">Expert</MenuItem>
                </TextField>
              </Grid>
              
              {/* Budget Range filter */}
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <MoneyIcon fontSize="small" sx={{ mr: 1 }} />
                  Hourly Rate (USD)
                </Typography>
                <Box sx={{ px: 2 }}>
                  <Slider
                    value={budgetRange}
                    onChange={(_, newValue) => setBudgetRange(newValue)}
                    valueLabelDisplay="auto"
                    min={0}
                    max={100}
                    marks={[
                      { value: 0, label: '$0' },
                      { value: 25, label: '$25' },
                      { value: 50, label: '$50' },
                      { value: 75, label: '$75' },
                      { value: 100, label: '$100+' }
                    ]}
                  />
                </Box>
              </Grid>
              
              {/* Skills filter */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Skills
                </Typography>
                <Autocomplete
                  multiple
                  options={SKILLS.filter(skill => !selectedSkills.includes(skill))}
                  value={selectedSkills}
                  onChange={(_, newValue) => setSelectedSkills(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Add skills"
                      variant="outlined"
                      size="small"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        size="small"
                        {...getTagProps({ index })}
                      />
                    ))
                  }
                />
              </Grid>
              
              {/* Categories filter */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <CategoryIcon fontSize="small" sx={{ mr: 1 }} />
                  Categories
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {JOB_CATEGORIES.map((category) => (
                    <FilterButton
                      key={category}
                      variant={selectedCategories.includes(category) ? "contained" : "outlined"}
                      size="small"
                      onClick={() => handleCategoryToggle(category)}
                    >
                      {category}
                    </FilterButton>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </form>
    </StyledPaper>
  );
};

export default JobSearchForm; 