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
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Skeleton
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  TuneRounded as TuneIcon,
  LocationOn as LocationIcon,
  WorkOutline as JobIcon,
  Person as WorkerIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
  Build as BuildIcon,
  Schedule as ScheduleIcon,
  Verified as VerifiedIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [radius, setRadius] = useState(25);
  const [filters, setFilters] = useState({
    budget: [500, 10000],
    rating: 0,
    experience: '',
    availability: '',
    urgent: false,
    verified: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [sortBy, setSortBy] = useState('distance');

  // Vocational categories and skills
  const vocationalCategories = mapService.getVocationalCategories();
  const vocationalSkills = {
    'Carpentry': ['Cabinet Making', 'Furniture Building', 'Framing', 'Finish Carpentry', 'Wood Restoration'],
    'Masonry': ['Bricklaying', 'Stone Work', 'Concrete Work', 'Block Work', 'Tile Installation'],
    'Plumbing': ['Pipe Installation', 'Drain Cleaning', 'Water Systems', 'Gas Lines', 'Bathroom Renovation'],
    'Electrical': ['House Wiring', 'Circuit Installation', 'Lighting Systems', 'Generator Installation', 'Security Systems'],
    'Painting': ['Interior Painting', 'Exterior Painting', 'Spray Painting', 'Wall Preparation', 'Decorative Finishes'],
    'Welding': ['Arc Welding', 'Gas Welding', 'Metal Fabrication', 'Repair Welding', 'Structural Welding'],
    'HVAC': ['Air Conditioning', 'Heating Systems', 'Ventilation', 'Refrigeration', 'Duct Installation'],
    'Roofing': ['Roof Installation', 'Roof Repair', 'Gutter Installation', 'Waterproofing', 'Insulation'],
    'Landscaping': ['Garden Design', 'Tree Maintenance', 'Irrigation Systems', 'Lawn Care', 'Hardscaping'],
    'Security': ['CCTV Installation', 'Alarm Systems', 'Access Control', 'Security Consultation', 'Guard Services']
  };

  const sortOptions = [
    { value: 'distance', label: 'Distance' },
    { value: 'rating', label: 'Rating' },
    { value: 'price', label: 'Price' },
    { value: 'recent', label: 'Most Recent' }
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
        categories: selectedCategories,
        skills: selectedSkills,
        sortBy
      }
    };
    onSearch(searchParams);
  }, [searchQuery, location, radius, searchType, filters, selectedCategories, selectedSkills, sortBy, onSearch]);

  // Handle filter changes
  useEffect(() => {
    onFilterChange({
      ...filters,
      categories: selectedCategories,
      skills: selectedSkills,
      radius,
      sortBy
    });
  }, [filters, selectedCategories, selectedSkills, radius, sortBy, onFilterChange]);

  // Handle location selection
  const handleLocationSelect = (locationData) => {
    setLocation(locationData.address);
    onLocationChange(locationData);
  };

  // Handle category toggle
  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => {
      const newCategories = prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category];
      
      // Update available skills based on selected categories
      if (newCategories.length === 0) {
        setSelectedSkills([]);
      } else {
        setSelectedSkills(prev => 
          prev.filter(skill => 
            newCategories.some(cat => vocationalSkills[cat]?.includes(skill))
          )
        );
      }
      
      return newCategories;
    });
  };

  // Get available skills based on selected categories
  const getAvailableSkills = () => {
    if (selectedCategories.length === 0) return [];
    
    const skills = new Set();
    selectedCategories.forEach(category => {
      if (vocationalSkills[category]) {
        vocationalSkills[category].forEach(skill => skills.add(skill));
      }
    });
    
    return Array.from(skills);
  };

  // Result item component
  const ResultItem = ({ item, onClick }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        sx={{ 
          mb: 1.5, 
          cursor: 'pointer',
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.secondary.main}22`,
          '&:hover': { 
            boxShadow: `0 4px 20px rgba(255, 215, 0, 0.3)`,
            borderColor: theme.palette.secondary.main,
            transform: 'translateY(-2px)'
          },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onClick={() => onClick(item)}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Avatar
              src={item.profileImage}
              sx={{ 
                bgcolor: item.type === 'job' ? theme.palette.secondary.main : theme.palette.primary.main,
                color: item.type === 'job' ? theme.palette.secondary.contrastText : theme.palette.primary.contrastText,
                width: 48,
                height: 48,
                border: `2px solid ${theme.palette.secondary.main}33`
              }}
            >
              {item.type === 'job' ? <JobIcon /> : <WorkerIcon />}
            </Avatar>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 'bold',
                  color: theme.palette.secondary.main,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.title || item.name}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                  {item.verified && (
                    <VerifiedIcon sx={{ color: '#4CAF50', fontSize: 16 }} />
                  )}
                  {item.urgent && (
                    <Chip 
                      label="URGENT" 
                      size="small" 
                      sx={{ 
                        bgcolor: '#FF5722', 
                        color: 'white',
                        fontSize: '0.6rem',
                        height: 20
                      }} 
                    />
                  )}
                  {item.online && (
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      bgcolor: '#4CAF50'
                    }} />
                  )}
                </Box>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.3 }}>
                {(item.description || item.bio)?.substring(0, 100)}...
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                {item.rating > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Rating value={item.rating} readOnly size="small" />
                    <Typography variant="caption">({item.reviewCount || 0})</Typography>
                  </Box>
                )}
                
                {(item.budget || item.hourlyRate) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <MoneyIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} />
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      GHS {item.budget?.toLocaleString() || `${item.hourlyRate}/hr`}
                    </Typography>
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
                <Box>
                  {item.skills.slice(0, 3).map((skill, index) => (
                    <Chip 
                      key={index}
                      label={skill}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        mr: 0.5, 
                        mb: 0.5,
                        borderColor: theme.palette.secondary.main + '66',
                        color: theme.palette.secondary.main,
                        fontSize: '0.7rem',
                        height: 24
                      }}
                    />
                  ))}
                  {item.skills.length > 3 && (
                    <Chip 
                      label={`+${item.skills.length - 3}`}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        mr: 0.5, 
                        mb: 0.5,
                        borderColor: theme.palette.secondary.main + '66',
                        color: theme.palette.secondary.main,
                        fontSize: '0.7rem',
                        height: 24
                      }}
                    />
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Search controls component
  const SearchControls = () => (
    <Box sx={{ p: 2.5 }}>
      {/* Search bar */}
      <TextField
        fullWidth
        placeholder={`Search ${searchType === 'jobs' ? 'vocational jobs' : 'skilled workers'}...`}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: theme.palette.secondary.main }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <Button 
                variant="contained" 
                size="small"
                onClick={handleSearch}
                disabled={loading}
                sx={{ 
                  bgcolor: theme.palette.secondary.main,
                  color: theme.palette.secondary.contrastText,
                  '&:hover': {
                    bgcolor: theme.palette.secondary.dark
                  }
                }}
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </InputAdornment>
          )
        }}
        sx={{ 
          mb: 2,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            '& fieldset': {
              borderColor: theme.palette.secondary.main + '44'
            }
          }
        }}
      />

      {/* Location selector */}
      <LocationSelector
        value={location}
        onChange={setLocation}
        onLocationSelect={handleLocationSelect}
        placeholder="Enter location or area"
        sx={{ mb: 2 }}
      />

      {/* Search radius */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ mb: 1, color: theme.palette.secondary.main, fontWeight: 'medium' }}>
          Search Radius: {radius} km
        </Typography>
        <Slider
          value={radius}
          onChange={(e, newValue) => setRadius(newValue)}
          min={1}
          max={100}
          step={1}
          marks={[
            { value: 5, label: '5km' },
            { value: 25, label: '25km' },
            { value: 50, label: '50km' },
            { value: 100, label: '100km' }
          ]}
          sx={{
            color: theme.palette.secondary.main,
            '& .MuiSlider-thumb': {
              backgroundColor: theme.palette.secondary.main
            },
            '& .MuiSlider-track': {
              backgroundColor: theme.palette.secondary.main
            },
            '& .MuiSlider-rail': {
              backgroundColor: theme.palette.secondary.main + '33'
            }
          }}
        />
      </Box>

      {/* Sort by */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel sx={{ color: theme.palette.secondary.main }}>Sort by</InputLabel>
        <Select
          value={sortBy}
          label="Sort by"
          onChange={(e) => setSortBy(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.secondary.main + '44'
            }
          }}
        >
          {sortOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Filter toggle */}
      <Button
        fullWidth
        variant="outlined"
        startIcon={showFilters ? <ArrowUpIcon /> : <ArrowDownIcon />}
        onClick={() => setShowFilters(!showFilters)}
        sx={{ 
          mb: 2,
          borderColor: theme.palette.secondary.main,
          color: theme.palette.secondary.main,
          '&:hover': {
            borderColor: theme.palette.secondary.dark,
            bgcolor: theme.palette.secondary.main + '11'
          }
        }}
      >
        {showFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
      </Button>

      {/* Advanced filters */}
      <Collapse in={showFilters}>
        <Box sx={{ mt: 2 }}>
          {/* Vocational Categories */}
          <Typography variant="subtitle2" sx={{ mb: 1.5, color: theme.palette.secondary.main, fontWeight: 'bold' }}>
            Vocational Categories
          </Typography>
          <Box sx={{ mb: 3 }}>
            {vocationalCategories.map((category) => (
              <Chip
                key={category}
                label={category}
                onClick={() => handleCategoryToggle(category)}
                color={selectedCategories.includes(category) ? 'secondary' : 'default'}
                variant={selectedCategories.includes(category) ? 'filled' : 'outlined'}
                size="small"
                sx={{ 
                  mr: 1, 
                  mb: 1,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  }
                }}
              />
            ))}
          </Box>

          {/* Skills */}
          {selectedCategories.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1.5, color: theme.palette.secondary.main, fontWeight: 'bold' }}>
                Specific Skills
              </Typography>
              <Autocomplete
                multiple
                options={getAvailableSkills()}
                value={selectedSkills}
                onChange={(event, newValue) => setSelectedSkills(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select skills"
                    variant="outlined"
                    size="small"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      key={option}
                      label={option}
                      {...getTagProps({ index })}
                      size="small"
                      color="secondary"
                    />
                  ))
                }
                sx={{ mb: 3 }}
              />
            </>
          )}

          {/* Budget/Rate range */}
          <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.secondary.main, fontWeight: 'bold' }}>
            {searchType === 'jobs' ? 'Budget' : 'Hourly Rate'} Range: GHS {filters.budget[0]} - GHS {filters.budget[1]}
          </Typography>
          <Slider
            value={filters.budget}
            onChange={(e, newValue) => setFilters({...filters, budget: newValue})}
            min={0}
            max={20000}
            step={100}
            valueLabelDisplay="auto"
            sx={{ 
              mb: 3,
              color: theme.palette.secondary.main 
            }}
          />

          {/* Minimum rating */}
          <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.secondary.main, fontWeight: 'bold' }}>
            Minimum Rating
          </Typography>
          <Rating
            value={filters.rating}
            onChange={(e, newValue) => setFilters({...filters, rating: newValue})}
            sx={{ mb: 3 }}
          />

          {/* Additional filters */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label="Verified Only"
              onClick={() => setFilters({...filters, verified: !filters.verified})}
              color={filters.verified ? 'secondary' : 'default'}
              variant={filters.verified ? 'filled' : 'outlined'}
              icon={<VerifiedIcon />}
              size="small"
            />
            
            {searchType === 'jobs' && (
              <Chip
                label="Urgent Jobs"
                onClick={() => setFilters({...filters, urgent: !filters.urgent})}
                color={filters.urgent ? 'error' : 'default'}
                variant={filters.urgent ? 'filled' : 'outlined'}
                icon={<ScheduleIcon />}
                size="small"
              />
            )}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );

  // Results section
  const ResultsSection = () => (
    <Box sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ color: theme.palette.secondary.main, fontWeight: 'bold' }}>
          Results ({searchResults.length})
        </Typography>
        
        {searchResults.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            Sorted by {sortOptions.find(opt => opt.value === sortBy)?.label}
          </Typography>
        )}
      </Box>
      
      {loading ? (
        <Box sx={{ py: 4 }}>
          {[...Array(3)].map((_, index) => (
            <Card key={index} sx={{ mb: 1.5 }}>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Skeleton variant="circular" width={48} height={48} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="80%" height={20} />
                    <Skeleton variant="text" width="40%" height={20} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : searchResults.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Box sx={{ 
            fontSize: 48, 
            mb: 2,
            opacity: 0.3
          }}>
            {searchType === 'jobs' ? '💼' : '👷'}
          </Box>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No {searchType === 'jobs' ? 'jobs' : 'workers'} found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search criteria or expanding the search radius
          </Typography>
        </Box>
      ) : (
        <Box sx={{ maxHeight: isMobile ? 400 : 500, overflow: 'auto' }}>
          <AnimatePresence>
            {searchResults.map((item, index) => (
              <ResultItem 
                key={item.id || index} 
                item={item}
                onClick={() => console.log('Selected:', item)}
              />
            ))}
          </AnimatePresence>
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
            height: '85vh',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            bgcolor: theme.palette.background.default
          }
        }}
      >
        <Box sx={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
          {/* Header */}
          <Paper sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            p: 2,
            borderBottom: `1px solid ${theme.palette.secondary.main}33`,
            bgcolor: theme.palette.background.paper
          }}>
            <Typography variant="h6" sx={{ color: theme.palette.secondary.main, fontWeight: 'bold' }}>
              Find {searchType === 'jobs' ? 'Vocational Jobs' : 'Skilled Workers'}
            </Typography>
            <IconButton onClick={onClose} sx={{ color: theme.palette.secondary.main }}>
              <CloseIcon />
            </IconButton>
          </Paper>
          
          {/* Content */}
          <Box sx={{ height: 'calc(100% - 64px)', overflow: 'auto' }}>
            <SearchControls />
            <Divider sx={{ borderColor: theme.palette.secondary.main + '33' }} />
            <ResultsSection />
          </Box>
        </Box>
      </Drawer>
    );
  }

  // Desktop overlay version
  return (
    <motion.div
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -400, opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Paper
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          width: 420,
          maxHeight: 'calc(100vh - 32px)',
          zIndex: 1000,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.background.default,
          border: `2px solid ${theme.palette.secondary.main}33`,
          borderRadius: 3,
          boxShadow: `0 8px 32px rgba(255, 215, 0, 0.2)`
        }}
        elevation={8}
      >
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 2.5,
          borderBottom: `1px solid ${theme.palette.secondary.main}33`,
          bgcolor: theme.palette.background.paper
        }}>
          <Typography variant="h6" sx={{ color: theme.palette.secondary.main, fontWeight: 'bold' }}>
            Find {searchType === 'jobs' ? 'Vocational Jobs' : 'Skilled Workers'}
          </Typography>
          <IconButton onClick={onClose} sx={{ color: theme.palette.secondary.main }}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <SearchControls />
          <Divider sx={{ borderColor: theme.palette.secondary.main + '33' }} />
          <ResultsSection />
        </Box>
      </Paper>
    </motion.div>
  );
};

export default MapSearchOverlay; 