import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  Slider,
  Typography,
  Chip,
  Button,
  IconButton,
  Collapse,
  Card,
  CardContent,
  Avatar,
  Rating,
  Drawer,
  useMediaQuery,
  useTheme,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  TuneRounded as TuneIcon,
  LocationOn as LocationIcon,
  WorkOutline as JobIcon,
  Person as WorkerIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import LocationSelector from './LocationSelector';
import mapService from '../../services/mapService';

const MapSearchOverlay = ({
  onSearch = () => {},
  onFilterChange = () => {},
  onLocationChange = () => {},
  searchResults = [],
  loading = false,
  searchType = 'jobs',
  userLocation = null,
  isVisible = true,
  onClose = () => {}
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState(10);
  const [filters, setFilters] = useState({
    budget: [0, 10000],
    rating: 0,
    experience: '',
    category: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Job categories
  const jobCategories = [
    'Development', 'Design', 'Marketing', 'Writing', 'Video', 'Music',
    'Business', 'Data', 'Translation', 'Legal', 'Engineering', 'Sales'
  ];

  // Handle search
  const handleSearch = useCallback(() => {
    const searchParams = {
      query: searchQuery,
      location,
      radius,
      type: searchType,
      filters: {
        ...filters,
        categories: selectedCategories
      }
    };
    onSearch(searchParams);
  }, [searchQuery, location, radius, searchType, filters, selectedCategories, onSearch]);

  // Handle filter changes
  useEffect(() => {
    onFilterChange({
      ...filters,
      categories: selectedCategories,
      radius
    });
  }, [filters, selectedCategories, radius, onFilterChange]);

  // Handle location selection
  const handleLocationSelect = (locationData) => {
    setLocation(locationData.address);
    onLocationChange(locationData);
  };

  // Handle category toggle
  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Result item component
  const ResultItem = ({ item, onClick }) => (
    <Card 
      sx={{ 
        mb: 1, 
        cursor: 'pointer',
        '&:hover': { boxShadow: 3 },
        transition: 'box-shadow 0.2s'
      }}
      onClick={() => onClick(item)}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Avatar
            sx={{ 
              bgcolor: searchType === 'jobs' ? 'primary.main' : 'secondary.main',
              width: 40,
              height: 40
            }}
          >
            {searchType === 'jobs' ? <JobIcon /> : <WorkerIcon />}
          </Avatar>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {item.title || item.name}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {item.description || item.bio}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              {item.rating && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Rating value={item.rating} readOnly size="small" />
                  <Typography variant="caption">({item.reviewCount || 0})</Typography>
                </Box>
              )}
              
              {item.budget && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <MoneyIcon fontSize="small" color="action" />
                  <Typography variant="caption">${item.budget}</Typography>
                </Box>
              )}
              
              {item.distance && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationIcon fontSize="small" color="action" />
                  <Typography variant="caption">
                    {mapService.formatDistance(item.distance)}
                  </Typography>
                </Box>
              )}
            </Box>
            
            {item.skills && item.skills.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {item.skills.slice(0, 3).map((skill, index) => (
                  <Chip 
                    key={index}
                    label={skill}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
                {item.skills.length > 3 && (
                  <Chip 
                    label={`+${item.skills.length - 3} more`}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                )}
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Search controls component
  const SearchControls = () => (
    <Box sx={{ p: 2 }}>
      {/* Search bar */}
      <TextField
        fullWidth
        placeholder={`Search ${searchType}...`}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <Button 
                variant="contained" 
                size="small"
                onClick={handleSearch}
                disabled={loading}
              >
                Search
              </Button>
            </InputAdornment>
          )
        }}
        sx={{ mb: 2 }}
      />

      {/* Location selector */}
      <LocationSelector
        value={location}
        onChange={setLocation}
        onLocationSelect={handleLocationSelect}
        placeholder="Enter location"
        sx={{ mb: 2 }}
      />

      {/* Search radius */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Search Radius: {radius} km
        </Typography>
        <Slider
          value={radius}
          onChange={(e, newValue) => setRadius(newValue)}
          min={1}
          max={50}
          step={1}
          marks={[
            { value: 1, label: '1km' },
            { value: 10, label: '10km' },
            { value: 25, label: '25km' },
            { value: 50, label: '50km' }
          ]}
        />
      </Box>

      {/* Filter toggle */}
      <Button
        fullWidth
        variant="outlined"
        startIcon={<TuneIcon />}
        onClick={() => setShowFilters(!showFilters)}
        sx={{ mb: 2 }}
      >
        {showFilters ? 'Hide Filters' : 'Show Filters'}
      </Button>

      {/* Advanced filters */}
      <Collapse in={showFilters}>
        <Box sx={{ mt: 2 }}>
          {/* Categories */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Categories
          </Typography>
          <Box sx={{ mb: 2 }}>
            {jobCategories.map((category) => (
              <Chip
                key={category}
                label={category}
                onClick={() => handleCategoryToggle(category)}
                color={selectedCategories.includes(category) ? 'primary' : 'default'}
                variant={selectedCategories.includes(category) ? 'filled' : 'outlined'}
                size="small"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
          </Box>

          {/* Budget range */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Budget Range: ${filters.budget[0]} - ${filters.budget[1]}
          </Typography>
          <Slider
            value={filters.budget}
            onChange={(e, newValue) => setFilters({...filters, budget: newValue})}
            min={0}
            max={10000}
            step={100}
            valueLabelDisplay="auto"
            sx={{ mb: 2 }}
          />

          {/* Minimum rating */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Minimum Rating
          </Typography>
          <Rating
            value={filters.rating}
            onChange={(e, newValue) => setFilters({...filters, rating: newValue})}
            sx={{ mb: 2 }}
          />
        </Box>
      </Collapse>
    </Box>
  );

  // Results section
  const ResultsSection = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Results ({searchResults.length})
      </Typography>
      
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Searching...</Typography>
        </Box>
      ) : searchResults.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            No {searchType} found in this area
          </Typography>
        </Box>
      ) : (
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {searchResults.map((item, index) => (
            <ResultItem 
              key={item.id || index} 
              item={item}
              onClick={() => console.log('Selected:', item)}
            />
          ))}
        </Box>
      )}
    </Box>
  );

  if (!isVisible) return null;

  // Mobile drawer version
  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={isVisible}
        onClose={onClose}
        PaperProps={{
          sx: {
            height: '70vh',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16
          }
        }}
      >
        <Box sx={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            p: 2,
            borderBottom: 1,
            borderColor: 'divider'
          }}>
            <Typography variant="h6">
              Find {searchType === 'jobs' ? 'Jobs' : 'Workers'}
            </Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Box sx={{ height: 'calc(100% - 64px)', overflow: 'auto' }}>
            <SearchControls />
            <Divider />
            <ResultsSection />
          </Box>
        </Box>
      </Drawer>
    );
  }

  // Desktop overlay version
  return (
    <Paper
      sx={{
        position: 'absolute',
        top: 16,
        left: 16,
        width: 400,
        maxHeight: 'calc(100vh - 32px)',
        zIndex: 1000,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
      elevation={3}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 2,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'primary.main',
        color: 'primary.contrastText'
      }}>
        <Typography variant="h6">
          Find {searchType === 'jobs' ? 'Jobs' : 'Workers'}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'inherit' }}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <SearchControls />
        <Divider />
        <ResultsSection />
      </Box>
    </Paper>
  );
};

export default MapSearchOverlay; 