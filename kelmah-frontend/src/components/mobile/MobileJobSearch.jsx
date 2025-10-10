import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Stack,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Slider,
  FormControlLabel,
  Switch,
  Badge,
  useTheme,
  useMediaQuery,
  Fab,
  Collapse,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  Star as StarIcon,
  Verified as VerifiedIcon,
  Phone as PhoneIcon,
  Message as MessageIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Sort as SortIcon,
  Close as CloseIcon,
  MyLocation as MyLocationIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { SwipeableList, PullToRefresh } from './SwipeGestures';

/**
 * Mobile-Optimized Job Search Component for Ghana
 * Features: Touch-friendly interface, location-based search, offline capability
 */
const MobileJobSearch = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [distance, setDistance] = useState(10);
  const [sortBy, setSortBy] = useState('relevance');

  // UI state
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [sortDrawerOpen, setSortDrawerOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [userLocation, setUserLocation] = useState(null);
  const [showLocationAlert, setShowLocationAlert] = useState(false);

  // Ghana-specific job categories
  const categories = [
    { id: 'plumbing', label: 'Plumbing', icon: '🔧', count: 45 },
    { id: 'electrical', label: 'Electrical', icon: '⚡', count: 38 },
    { id: 'carpentry', label: 'Carpentry', icon: '🔨', count: 52 },
    { id: 'painting', label: 'Painting', icon: '🎨', count: 34 },
    { id: 'cleaning', label: 'Cleaning', icon: '🧹', count: 67 },
    { id: 'security', label: 'Security', icon: '🛡️', count: 29 },
    { id: 'gardening', label: 'Gardening', icon: '🌱', count: 41 },
    { id: 'masonry', label: 'Masonry', icon: '🧱', count: 23 },
  ];

  // Ghana locations
  const popularLocations = [
    'Accra',
    'Kumasi',
    'Tema',
    'Tamale',
    'Cape Coast',
    'Sunyani',
    'Koforidua',
    'Ho',
    'Wa',
    'Bolgatanga',
  ];

  // Sort options
  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant', icon: '🎯' },
    { value: 'distance', label: 'Nearest First', icon: '📍' },
    { value: 'price_low', label: 'Price: Low to High', icon: '💰' },
    { value: 'price_high', label: 'Price: High to Low', icon: '💸' },
    { value: 'rating', label: 'Highest Rated', icon: '⭐' },
    { value: 'newest', label: 'Most Recent', icon: '🆕' },
  ];

  // Get user location
  const getUserLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setShowLocationAlert(false);
        },
        (error) => {
          console.error('Location error:', error);
          setShowLocationAlert(true);
        },
        { timeout: 10000, enableHighAccuracy: true },
      );
    } else {
      setShowLocationAlert(true);
    }
  }, []);

  // Mock job data (Ghana context)
  const mockJobs = useMemo(
    () => [
      {
        id: 1,
        title: 'Emergency Plumbing Repair',
        description:
          'Urgent repair needed for blocked kitchen sink in East Legon',
        category: 'plumbing',
        price: 500,
        location: 'East Legon, Accra',
        distance: 2.3,
        worker: {
          name: 'Kwame Asante',
          avatar: '/avatars/kwame.jpg',
          rating: 4.8,
          reviewCount: 127,
          verified: true,
          responseTime: '< 30 min',
        },
        urgent: true,
        postedTime: '15 min ago',
        skills: ['Pipe Repair', 'Emergency Service', 'Weekend Available'],
      },
      {
        id: 2,
        title: 'House Painting - 3 Bedroom',
        description:
          'Interior and exterior painting for a 3-bedroom house in Tema',
        category: 'painting',
        price: 2800,
        location: 'Tema, Greater Accra',
        distance: 8.7,
        worker: {
          name: 'Akosua Mensah',
          avatar: '/avatars/akosua.jpg',
          rating: 4.9,
          reviewCount: 89,
          verified: true,
          responseTime: '< 1 hour',
        },
        urgent: false,
        postedTime: '2 hours ago',
        skills: [
          'Interior Painting',
          'Exterior Painting',
          'Color Consultation',
        ],
      },
      {
        id: 3,
        title: 'Custom Kitchen Cabinets',
        description:
          'Build and install modern kitchen cabinets in Airport City',
        category: 'carpentry',
        price: 4200,
        location: 'Airport City, Accra',
        distance: 5.1,
        worker: {
          name: 'Yaw Boateng',
          avatar: '/avatars/yaw.jpg',
          rating: 4.7,
          reviewCount: 156,
          verified: true,
          responseTime: '< 2 hours',
        },
        urgent: false,
        postedTime: '5 hours ago',
        skills: ['Cabinet Making', 'Installation', 'Modern Design'],
      },
    ],
    [],
  );

  // Perform search
  const performSearch = useCallback(async () => {
    setLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Filter and sort results based on criteria
      let filteredResults = mockJobs.filter((job) => {
        const matchesQuery =
          !searchQuery ||
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
          !selectedCategory || job.category === selectedCategory;
        const matchesPrice =
          job.price >= priceRange[0] && job.price <= priceRange[1];
        const matchesUrgent = !urgentOnly || job.urgent;
        const matchesVerified = !verifiedOnly || job.worker.verified;
        const matchesDistance = !userLocation || job.distance <= distance;

        return (
          matchesQuery &&
          matchesCategory &&
          matchesPrice &&
          matchesUrgent &&
          matchesVerified &&
          matchesDistance
        );
      });

      // Sort results
      switch (sortBy) {
        case 'distance':
          filteredResults.sort((a, b) => a.distance - b.distance);
          break;
        case 'price_low':
          filteredResults.sort((a, b) => a.price - b.price);
          break;
        case 'price_high':
          filteredResults.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          filteredResults.sort((a, b) => b.worker.rating - a.worker.rating);
          break;
        case 'newest':
          filteredResults.sort(
            (a, b) => new Date(b.postedTime) - new Date(a.postedTime),
          );
          break;
        default: // relevance
          break;
      }

      setResults(filteredResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    selectedCategory,
    priceRange,
    urgentOnly,
    verifiedOnly,
    distance,
    sortBy,
    userLocation,
    mockJobs,
  ]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await performSearch();
    setRefreshing(false);
  }, [performSearch]);

  // Toggle saved job
  const toggleSavedJob = useCallback((jobId) => {
    setSavedJobs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  }, []);

  // Initial search
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Get user location on mount
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Render job card
  const renderJobCard = useCallback(
    (job) => (
      <Card
        elevation={2}
        sx={{
          mb: 2,
          borderRadius: 3,
          overflow: 'hidden',
          border: job.urgent ? '2px solid #FF5722' : 'none',
          position: 'relative',
        }}
      >
        {job.urgent && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
              color: 'white',
              px: 2,
              py: 0.5,
              borderRadius: '0 0 0 12px',
              fontSize: '12px',
              fontWeight: 700,
              zIndex: 1,
            }}
          >
            URGENT
          </Box>
        )}

        <CardContent sx={{ p: 3 }}>
          {/* Job Header */}
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Avatar
              src={job.worker.avatar}
              sx={{
                width: 50,
                height: 50,
                border: job.worker.verified ? '2px solid #4CAF50' : 'none',
              }}
            >
              {job.worker.name.charAt(0)}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 0.5 }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: '#FFD700' }}
                >
                  {job.title}
                </Typography>
                {job.worker.verified && (
                  <VerifiedIcon sx={{ fontSize: 16, color: '#4CAF50' }} />
                )}
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                by {job.worker.name}
              </Typography>

              <Stack direction="row" alignItems="center" spacing={1}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <StarIcon sx={{ fontSize: 14, color: '#FFD700' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {job.worker.rating}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({job.worker.reviewCount})
                  </Typography>
                </Stack>

                <Typography variant="caption" color="text.secondary">
                  •
                </Typography>

                <Typography
                  variant="caption"
                  color="success.main"
                  sx={{ fontWeight: 600 }}
                >
                  {job.worker.responseTime}
                </Typography>
              </Stack>
            </Box>

            <IconButton
              size="small"
              onClick={() => toggleSavedJob(job.id)}
              sx={{
                color: savedJobs.has(job.id) ? '#FFD700' : 'text.secondary',
              }}
            >
              {savedJobs.has(job.id) ? (
                <BookmarkIcon />
              ) : (
                <BookmarkBorderIcon />
              )}
            </IconButton>
          </Stack>

          {/* Job Details */}
          <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.5 }}>
            {job.description}
          </Typography>

          {/* Skills */}
          <Stack
            direction="row"
            spacing={1}
            sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}
          >
            {job.skills.map((skill, index) => (
              <Chip
                key={index}
                label={skill}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255,215,0,0.1)',
                  color: '#FFD700',
                  fontWeight: 600,
                  fontSize: '11px',
                }}
              />
            ))}
          </Stack>

          {/* Location and Price */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {job.location}
              </Typography>
              {userLocation && (
                <Typography
                  variant="caption"
                  color="primary.main"
                  sx={{ fontWeight: 600 }}
                >
                  • {job.distance}km away
                </Typography>
              )}
            </Stack>

            <Typography variant="h6" sx={{ color: '#4CAF50', fontWeight: 700 }}>
              ₵{job.price.toLocaleString()}
            </Typography>
          </Stack>

          {/* Actions */}
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              size="small"
              startIcon={<MessageIcon />}
              sx={{
                flex: 1,
                background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                color: '#000',
                fontWeight: 700,
                '&:hover': {
                  background:
                    'linear-gradient(135deg, #FFC000 0%, #FFB300 100%)',
                },
              }}
            >
              Message
            </Button>

            <Button
              variant="outlined"
              size="small"
              startIcon={<PhoneIcon />}
              sx={{
                borderColor: '#FFD700',
                color: '#FFD700',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#FFC000',
                  backgroundColor: 'rgba(255,215,0,0.05)',
                },
              }}
            >
              Call
            </Button>
          </Stack>

          {/* Posted time */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center', mt: 1 }}
          >
            Posted {job.postedTime}
          </Typography>
        </CardContent>
      </Card>
    ),
    [savedJobs, toggleSavedJob, userLocation],
  );

  return (
    <Box sx={{ pb: 10 }}>
      {/* Location Alert */}
      <Collapse in={showLocationAlert}>
        <Alert
          severity="info"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={getUserLocation}
              startIcon={<MyLocationIcon />}
            >
              Enable
            </Button>
          }
          onClose={() => setShowLocationAlert(false)}
          sx={{ mb: 2 }}
        >
          Enable location for better nearby job recommendations
        </Alert>
      </Collapse>

      {/* Search Header */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          mb: 2,
          background:
            'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.95) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,215,0,0.2)',
        }}
      >
        <Stack spacing={2}>
          {/* Search Input */}
          <TextField
            fullWidth
            placeholder="Search jobs, skills, or workers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#FFD700' }} />
                </InputAdornment>
              ),
              sx: {
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,215,0,0.3)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,215,0,0.5)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#FFD700',
                },
              },
            }}
          />

          {/* Quick Filters */}
          <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
            {categories.slice(0, 4).map((category) => (
              <Chip
                key={category.id}
                label={`${category.icon} ${category.label} (${category.count})`}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category.id ? '' : category.id,
                  )
                }
                color={selectedCategory === category.id ? 'primary' : 'default'}
                sx={{
                  minWidth: 'fit-content',
                  backgroundColor:
                    selectedCategory === category.id
                      ? '#FFD700'
                      : 'rgba(255,255,255,0.1)',
                  color: selectedCategory === category.id ? '#000' : '#fff',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor:
                      selectedCategory === category.id
                        ? '#FFC000'
                        : 'rgba(255,255,255,0.2)',
                  },
                }}
              />
            ))}
          </Stack>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFilterDrawerOpen(true)}
              sx={{
                flex: 1,
                borderColor: '#FFD700',
                color: '#FFD700',
                fontWeight: 600,
              }}
            >
              Filters
            </Button>

            <Button
              variant="outlined"
              startIcon={<SortIcon />}
              onClick={() => setSortDrawerOpen(true)}
              sx={{
                flex: 1,
                borderColor: '#FFD700',
                color: '#FFD700',
                fontWeight: 600,
              }}
            >
              Sort
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Results Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2, px: 1 }}
      >
        <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 700 }}>
          {results.length} Jobs Found
        </Typography>

        {loading && <LinearProgress sx={{ width: 100 }} />}
      </Stack>

      {/* Job Results */}
      <PullToRefresh onRefresh={handleRefresh} refreshing={refreshing}>
        <SwipeableList
          items={results}
          renderItem={renderJobCard}
          keyExtractor={(job) => job.id}
          onSwipeLeft={(job) => toggleSavedJob(job.id)}
          onSwipeRight={(job) => console.log('Quick apply to job:', job.id)}
          emptyMessage="No jobs found matching your criteria"
        />
      </PullToRefresh>

      {/* Filter Drawer */}
      <Drawer
        anchor="bottom"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '24px 24px 0 0',
            maxHeight: '80vh',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 3 }}
          >
            <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 700 }}>
              Filter Jobs
            </Typography>
            <IconButton onClick={() => setFilterDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Stack spacing={3}>
            {/* Price Range */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, color: '#FFD700' }}>
                Price Range (₵)
              </Typography>
              <Slider
                value={priceRange}
                onChange={(e, newValue) => setPriceRange(newValue)}
                valueLabelDisplay="auto"
                min={0}
                max={10000}
                step={100}
                sx={{
                  color: '#FFD700',
                  '& .MuiSlider-thumb': {
                    backgroundColor: '#FFD700',
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: '#FFD700',
                  },
                }}
              />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption">₵{priceRange[0]}</Typography>
                <Typography variant="caption">₵{priceRange[1]}</Typography>
              </Stack>
            </Box>

            {/* Distance */}
            {userLocation && (
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 2, color: '#FFD700' }}
                >
                  Distance (km)
                </Typography>
                <Slider
                  value={distance}
                  onChange={(e, newValue) => setDistance(newValue)}
                  valueLabelDisplay="auto"
                  min={1}
                  max={50}
                  sx={{
                    color: '#FFD700',
                    '& .MuiSlider-thumb': {
                      backgroundColor: '#FFD700',
                    },
                    '& .MuiSlider-track': {
                      backgroundColor: '#FFD700',
                    },
                  }}
                />
              </Box>
            )}

            {/* Toggles */}
            <Stack>
              <FormControlLabel
                control={
                  <Switch
                    checked={urgentOnly}
                    onChange={(e) => setUrgentOnly(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#FFD700',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                        {
                          backgroundColor: '#FFD700',
                        },
                    }}
                  />
                }
                label="Urgent jobs only"
                sx={{ color: 'white' }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#FFD700',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                        {
                          backgroundColor: '#FFD700',
                        },
                    }}
                  />
                }
                label="Verified workers only"
                sx={{ color: 'white' }}
              />
            </Stack>

            {/* Apply Button */}
            <Button
              variant="contained"
              fullWidth
              onClick={() => {
                setFilterDrawerOpen(false);
                performSearch();
              }}
              sx={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                color: '#000',
                fontWeight: 700,
                py: 1.5,
              }}
            >
              Apply Filters
            </Button>
          </Stack>
        </Box>
      </Drawer>

      {/* Sort Drawer */}
      <Drawer
        anchor="bottom"
        open={sortDrawerOpen}
        onClose={() => setSortDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '24px 24px 0 0',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 3 }}
          >
            <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 700 }}>
              Sort Jobs
            </Typography>
            <IconButton onClick={() => setSortDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <List>
            {sortOptions.map((option) => (
              <ListItem
                key={option.value}
                button
                onClick={() => {
                  setSortBy(option.value);
                  setSortDrawerOpen(false);
                  performSearch();
                }}
                selected={sortBy === option.value}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(255,215,0,0.1)',
                    color: '#FFD700',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit' }}>
                  <span style={{ fontSize: '20px' }}>{option.icon}</span>
                </ListItemIcon>
                <ListItemText primary={option.label} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Floating Search Button */}
      <Fab
        color="primary"
        onClick={performSearch}
        disabled={loading}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
          color: '#000',
          '&:hover': {
            background: 'linear-gradient(135deg, #FFC000 0%, #FFB300 100%)',
          },
        }}
      >
        <SearchIcon />
      </Fab>
    </Box>
  );
};

export default MobileJobSearch;
