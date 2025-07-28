import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Fab,
  Snackbar,
  Alert,
  Backdrop,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Paper,
  Chip,
  Button,
  Card,
  CardContent,
  Grid,
  Avatar,
  Badge,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider,
  Stack,
  Zoom,
  Slide,
  Grow,
} from '@mui/material';
import {
  Work as JobIcon,
  Person as WorkerIcon,
  Search as SearchIcon,
  MyLocation as LocationIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  Speed as SpeedIcon,
  Star as StarIcon,
  Verified as VerifiedIcon,
  LocationOn as LocationOnIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  PeopleAlt as PeopleIcon,
  BusinessCenter as BusinessIcon,
  Assessment as AssessmentIcon,
  FlashOn as FlashOnIcon,
  EmojiNature as EcoIcon,
  Security as SecurityIcon,
  Build as BuildIcon,
  Home as HomeIcon,
  LocalFireDepartment as FireIcon,
  ElectricalServices as ElectricalIcon,
  Palette as PaletteIcon,
  Construction as ConstructionIcon,
  Close as CloseIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import InteractiveMap from '../components/common/InteractiveMap';
import MapSearchOverlay from '../components/common/MapSearchOverlay';
import mapService from '../services/mapService';

// Category icons mapping for visual appeal
const categoryIcons = {
  Carpentry: ConstructionIcon,
  Masonry: HomeIcon,
  Plumbing: BuildIcon,
  Electrical: ElectricalIcon,
  Painting: PaletteIcon,
  Welding: FireIcon,
  HVAC: EcoIcon,
  Security: SecurityIcon,
  Landscaping: EcoIcon,
  Roofing: HomeIcon,
};

// Professional stats component for the right panel
const ProfessionalStatsCard = ({ title, value, trend, icon: IconComponent, color }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <Card
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${color}11 100%)`,
          border: `1px solid ${color}33`,
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${color} 0%, ${color}66 100%)`,
          },
          '&:hover': {
            boxShadow: `0 8px 32px ${color}22`,
            transform: 'translateY(-4px)',
          },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Avatar
              sx={{
                bgcolor: `${color}22`,
                color: color,
                width: 48,
                height: 48,
              }}
            >
              <IconComponent />
            </Avatar>
            {trend && (
              <Chip
                label={`${trend > 0 ? '+' : ''}${trend}%`}
                size="small"
                sx={{
                  bgcolor: trend > 0 ? '#4CAF5022' : '#F4433622',
                  color: trend > 0 ? '#4CAF50' : '#F44336',
                  fontWeight: 'bold',
                }}
              />
            )}
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color, mb: 0.5 }}>
            {value}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            {title}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Real-time activity feed
const ActivityFeedItem = ({ activity, index }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.secondary.main}11`,
          mb: 1,
          '&:hover': {
            bgcolor: theme.palette.secondary.main + '08',
            borderColor: theme.palette.secondary.main + '33',
          },
          transition: 'all 0.3s ease',
        }}
      >
        <Avatar
          sx={{
            bgcolor: activity.color + '22',
            color: activity.color,
            width: 32,
            height: 32,
            mr: 2,
          }}
        >
          {activity.icon}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
            {activity.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {activity.time}
          </Typography>
        </Box>
        {activity.badge && (
          <Chip
            label={activity.badge}
            size="small"
            color="secondary"
            variant="outlined"
          />
        )}
      </Box>
    </motion.div>
  );
};

// Professional heatmap legend
const HeatmapLegend = () => {
  const theme = useTheme();
  
  return (
    <Card
      sx={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        zIndex: 1000,
        bgcolor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.secondary.main}33`,
        borderRadius: 2,
        p: 2,
        minWidth: 200,
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: theme.palette.secondary.main }}>
        Activity Density
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption">Low</Typography>
        <Box
          sx={{
            width: 100,
            height: 8,
            borderRadius: 4,
            background: `linear-gradient(90deg, ${theme.palette.secondary.main}22 0%, ${theme.palette.secondary.main} 100%)`,
          }}
        />
        <Typography variant="caption">High</Typography>
      </Box>
    </Card>
  );
};

const ProfessionalMapPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const isTablet = useMediaQuery(theme.breakpoints.down('xl'));

  // Map state
  const [mapCenter, setMapCenter] = useState([5.6037, -0.187]);
  const [userLocation, setUserLocation] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchType, setSearchType] = useState('jobs');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initializing, setInitializing] = useState(true);
  
  // UI state
  const [showSearchOverlay, setShowSearchOverlay] = useState(!isMobile);
  const [showStatsPanel, setShowStatsPanel] = useState(!isMobile);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({
    radius: 25,
    categories: [],
    budget: [0, 10000],
    rating: 0,
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [realtimeStats, setRealtimeStats] = useState({
    activeJobs: 1247,
    availableWorkers: 892,
    completedToday: 156,
    avgRating: 4.8,
    responseTime: '< 2 min',
    successRate: 94,
  });

  // Mock real-time activities
  const [realtimeActivities, setRealtimeActivities] = useState([
    { id: 1, title: 'New carpenter joined near you', time: '2 min ago', icon: '🔨', color: '#FFD700', badge: 'New' },
    { id: 2, title: 'Plumbing job completed in Accra', time: '5 min ago', icon: '🔧', color: '#2196F3', badge: 'Completed' },
    { id: 3, title: 'Electrical work posted - URGENT', time: '8 min ago', icon: '⚡', color: '#FF5722', badge: 'Urgent' },
    { id: 4, title: 'Mason verified profile updated', time: '12 min ago', icon: '🧱', color: '#4CAF50', badge: 'Verified' },
    { id: 5, title: 'Painting job started in Kumasi', time: '15 min ago', icon: '🎨', color: '#9C27B0', badge: 'Active' },
  ]);

  // Category stats for visualization
  const [categoryStats, setCategoryStats] = useState([
    { name: 'Carpentry', jobs: 234, workers: 189, icon: ConstructionIcon, color: '#8B4513' },
    { name: 'Plumbing', jobs: 189, workers: 156, icon: BuildIcon, color: '#2196F3' },
    { name: 'Electrical', jobs: 156, workers: 134, icon: ElectricalIcon, color: '#FFC107' },
    { name: 'Masonry', jobs: 123, workers: 98, icon: HomeIcon, color: '#795548' },
    { name: 'Painting', jobs: 98, workers: 87, icon: PaletteIcon, color: '#9C27B0' },
  ]);

  // Initialize map and load data
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setInitializing(true);
        const location = await mapService.getCurrentLocation();
        setUserLocation(location);
        setMapCenter([location.latitude, location.longitude]);
        
        await loadMapData(searchType, location);
        
        // Simulate real-time updates
        const interval = setInterval(() => {
          setRealtimeStats(prev => ({
            ...prev,
            activeJobs: prev.activeJobs + Math.floor(Math.random() * 3) - 1,
            availableWorkers: prev.availableWorkers + Math.floor(Math.random() * 5) - 2,
            completedToday: prev.completedToday + Math.floor(Math.random() * 2),
          }));
        }, 30000);

        return () => clearInterval(interval);
      } catch (error) {
        console.warn('Could not get user location:', error);
        setError('Could not access your location. Using default area (Accra, Ghana).');
        await loadMapData(searchType, { latitude: 5.6037, longitude: -0.187 });
      } finally {
        setInitializing(false);
      }
    };

    initializeMap();
  }, []);

  // Load map data from APIs
  const loadMapData = async (type, location, filters = currentFilters) => {
    if (!location) return;

    setLoading(true);
    setError(null);

    try {
      const searchParams = {
        latitude: location.latitude,
        longitude: location.longitude,
        radius: filters.radius,
        category: filters.categories.length > 0 ? filters.categories[0] : null,
        skills: filters.categories.length > 1 ? filters.categories : null,
        budget: filters.budget,
        rating: filters.rating,
        page: 1,
        limit: 100,
      };

      let results = [];
      if (type === 'jobs') {
        results = await mapService.searchJobsNearLocation(searchParams);
      } else {
        results = await mapService.searchWorkersNearLocation(searchParams);
      }

      setSearchResults(results);
      setTotalResults(results.length);
    } catch (error) {
      console.error('Search error:', error);
      setError(`Failed to load ${type}. Please try again.`);
      setSearchResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  // Handle search type change
  const handleSearchTypeChange = useCallback((event, newType) => {
    if (newType !== null) {
      setSearchType(newType);
      const location = selectedLocation || userLocation;
      if (location) {
        loadMapData(newType, location);
      }
    }
  }, [selectedLocation, userLocation, currentFilters]);

  // Handle search
  const handleSearch = useCallback(async (searchParams) => {
    const location = selectedLocation || userLocation || { 
      latitude: mapCenter[0], 
      longitude: mapCenter[1] 
    };

    const enhancedParams = {
      ...searchParams,
      latitude: location.latitude,
      longitude: location.longitude,
    };

    setLoading(true);
    setError(null);

    try {
      let results = [];
      if (searchParams.type === 'jobs') {
        results = await mapService.searchJobsNearLocation(enhancedParams);
      } else {
        results = await mapService.searchWorkersNearLocation(enhancedParams);
      }

      if (searchParams.query) {
        const query = searchParams.query.toLowerCase();
        results = results.filter(
          (item) =>
            item.title?.toLowerCase().includes(query) ||
            item.name?.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query) ||
            item.category?.toLowerCase().includes(query) ||
            item.skills?.some((skill) => skill.toLowerCase().includes(query)),
        );
      }

      setSearchResults(results);
      setTotalResults(results.length);
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedLocation, userLocation, mapCenter]);

  // Handle filter changes
  const handleFilterChange = useCallback((filters) => {
    setCurrentFilters(filters);
  }, []);

  // Handle location change
  const handleLocationChange = useCallback((location) => {
    setSelectedLocation(location);
    if (location.coordinates) {
      setMapCenter([location.coordinates.latitude, location.coordinates.longitude]);
      loadMapData(searchType, location.coordinates, currentFilters);
    }
  }, [searchType, currentFilters]);

  // Handle marker click
  const handleMarkerClick = useCallback((marker) => {
    if (marker.type === 'job') {
      navigate(`/jobs/${marker.id}`);
    } else if (marker.type === 'worker') {
      navigate(`/profiles/user/${marker.id}`);
    }
  }, [navigate]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Get search type label
  const getSearchTypeLabel = () => {
    return searchType === 'jobs' ? 'Vocational Jobs' : 'Skilled Workers';
  };

  return (
    <Box sx={{ 
      height: '100vh',
      overflow: 'hidden',
      bgcolor: theme.palette.background.default,
      position: 'relative',
    }}>
      {/* Professional Loading Backdrop */}
      <Backdrop 
        open={initializing} 
        sx={{ 
          zIndex: 9999,
          bgcolor: 'rgba(26, 26, 26, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Box sx={{ textAlign: 'center', color: theme.palette.secondary.main }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <CircularProgress color="inherit" size={80} thickness={2} sx={{ mb: 3 }} />
            </motion.div>
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
              Kelmah Professional Map
            </Typography>
            <Typography variant="h6" sx={{ mb: 1, opacity: 0.8 }}>
              Initializing Advanced Location Services
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.6 }}>
              Finding {getSearchTypeLabel()} near you...
            </Typography>
            <Box sx={{ width: 300, mt: 3 }}>
              <LinearProgress 
                color="secondary" 
                sx={{ 
                  height: 4, 
                  borderRadius: 2,
                  bgcolor: theme.palette.secondary.main + '22'
                }} 
              />
            </Box>
          </Box>
        </motion.div>
      </Backdrop>

      {/* Professional Header Bar */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <Paper 
          elevation={8}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1200,
            background: `linear-gradient(135deg, ${theme.palette.background.paper}ee 0%, ${theme.palette.background.paper}cc 100%)`,
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${theme.palette.secondary.main}33`,
            p: 2,
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2
          }}>
            {/* Brand Section */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: theme.palette.secondary.main,
                    color: theme.palette.secondary.contrastText,
                    width: 48,
                    height: 48,
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                  }}
                >
                  K
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ 
                    color: theme.palette.secondary.main,
                    fontWeight: 'bold',
                    lineHeight: 1,
                  }}>
                    Kelmah Professional Map
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: theme.palette.text.secondary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}>
                    <FlashOnIcon fontSize="small" />
                    Live tracking • {totalResults} results found
                  </Typography>
                </Box>
              </Box>
            </motion.div>

            {/* Real-time Stats Bar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
              <motion.div whileHover={{ scale: 1.1 }}>
                <Tooltip title="Active Jobs">
                  <Chip
                    icon={<BusinessIcon />}
                    label={`${realtimeStats.activeJobs} Jobs`}
                    color="secondary"
                    variant="outlined"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Tooltip>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.1 }}>
                <Tooltip title="Available Workers">
                  <Chip
                    icon={<PeopleIcon />}
                    label={`${realtimeStats.availableWorkers} Workers`}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Tooltip>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }}>
                <Tooltip title="Completed Today">
                  <Chip
                    icon={<VerifiedIcon />}
                    label={`${realtimeStats.completedToday} Completed`}
                    sx={{ 
                      bgcolor: '#4CAF5022',
                      color: '#4CAF50',
                      fontWeight: 'bold',
                      border: '1px solid #4CAF5033'
                    }}
                  />
                </Tooltip>
              </motion.div>
            </Box>

            {/* Search Type Toggle */}
            <ToggleButtonGroup
              value={searchType}
              exclusive
              onChange={handleSearchTypeChange}
              size="small"
              sx={{ 
                bgcolor: theme.palette.background.default,
                borderRadius: 3,
                '& .MuiToggleButton-root': {
                  border: `1px solid ${theme.palette.secondary.main}33`,
                  color: theme.palette.text.primary,
                  px: 3,
                  py: 1.5,
                  '&.Mui-selected': {
                    bgcolor: theme.palette.secondary.main,
                    color: theme.palette.secondary.contrastText,
                    '&:hover': {
                      bgcolor: theme.palette.secondary.dark,
                    },
                  },
                  '&:hover': {
                    bgcolor: theme.palette.secondary.main + '11',
                  },
                },
              }}
            >
              <ToggleButton value="jobs">
                <JobIcon sx={{ mr: 1 }} />
                <Badge badgeContent={searchResults.filter((r) => r.type === 'job').length} color="secondary">
                  <span>Jobs</span>
                </Badge>
              </ToggleButton>
              <ToggleButton value="workers">
                <WorkerIcon sx={{ mr: 1 }} />
                <Badge badgeContent={searchResults.filter((r) => r.type === 'worker').length} color="primary">
                  <span>Workers</span>
                </Badge>
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Action Controls */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Tooltip title="Refresh Data">
                <IconButton
                  onClick={() => {
                    const location = selectedLocation || userLocation;
                    if (location) loadMapData(searchType, location, currentFilters);
                  }}
                  disabled={loading}
                  sx={{
                    bgcolor: theme.palette.background.default,
                    border: `1px solid ${theme.palette.secondary.main}33`,
                    '&:hover': {
                      bgcolor: theme.palette.secondary.main + '11',
                    },
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                <IconButton
                  onClick={toggleFullscreen}
                  sx={{
                    bgcolor: theme.palette.background.default,
                    border: `1px solid ${theme.palette.secondary.main}33`,
                    '&:hover': {
                      bgcolor: theme.palette.secondary.main + '11',
                    },
                  }}
                >
                  {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {/* Main Content Container */}
      <Box sx={{ 
        display: 'flex',
        height: '100vh',
        pt: '88px', // Account for header
        ...(isFullscreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9998,
          pt: 0,
        }),
      }}>
        {/* Left Search Panel */}
        <AnimatePresence>
          {showSearchOverlay && !isFullscreen && (
            <motion.div
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ position: 'relative', zIndex: 1000 }}
            >
              <Paper
                elevation={12}
                sx={{
                  width: isMobile ? '100vw' : isTablet ? 380 : 420,
                  height: '100%',
                  background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
                  borderRight: `2px solid ${theme.palette.secondary.main}33`,
                  borderRadius: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <MapSearchOverlay
                  onSearch={handleSearch}
                  onFilterChange={handleFilterChange}
                  onLocationChange={handleLocationChange}
                  searchResults={searchResults}
                  loading={loading}
                  searchType={searchType}
                  userLocation={userLocation}
                  isVisible={true}
                  onClose={() => setShowSearchOverlay(false)}
                />
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Map Container */}
        <Box sx={{ 
          flex: 1, 
          position: 'relative',
          height: '100%',
          overflow: 'hidden',
        }}>
          <InteractiveMap
            center={mapCenter}
            zoom={12}
            markers={searchResults}
            onMarkerClick={handleMarkerClick}
            showUserLocation={true}
            showSearchRadius={true}
            searchRadius={currentFilters.radius}
            height="100%"
            controls={{
              location: true,
              zoom: true,
              layers: true,
              fullscreen: false,
            }}
          />

          {/* Professional Heatmap Legend */}
          <HeatmapLegend />

          {/* Floating Search Button for Mobile */}
          {(isMobile || isFullscreen) && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Fab
                color="secondary"
                onClick={() => setShowSearchOverlay(!showSearchOverlay)}
                sx={{
                  position: 'absolute',
                  top: 20,
                  left: 20,
                  background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                  boxShadow: `0 8px 32px ${theme.palette.secondary.main}44`,
                }}
              >
                {showSearchOverlay ? <CloseIcon /> : <SearchIcon />}
              </Fab>
            </motion.div>
          )}

          {/* Professional Results Counter */}
          <AnimatePresence>
            {totalResults > 0 && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                style={{
                  position: 'absolute',
                  bottom: 20,
                  right: showStatsPanel && !isMobile && !isFullscreen ? 420 : 20,
                  zIndex: 1000,
                }}
              >
                <Paper
                  elevation={8}
                  sx={{
                    px: 3,
                    py: 2,
                    background: `linear-gradient(135deg, ${theme.palette.background.paper}ee 0%, ${theme.palette.background.paper}cc 100%)`,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${theme.palette.secondary.main}33`,
                    borderRadius: 4,
                    boxShadow: `0 8px 32px rgba(255, 215, 0, 0.2)`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <VisibilityIcon sx={{ color: theme.palette.secondary.main }} />
                    <Box>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 'bold',
                        color: theme.palette.secondary.main,
                        lineHeight: 1,
                      }}>
                        {totalResults} {getSearchTypeLabel()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        {selectedLocation ? `near ${selectedLocation.city || 'selected area'}` : 'in your area'}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        {/* Right Analytics Panel */}
        <AnimatePresence>
          {showStatsPanel && !isMobile && !isFullscreen && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <Paper
                elevation={12}
                sx={{
                  width: 400,
                  height: '100%',
                  background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
                  borderLeft: `2px solid ${theme.palette.secondary.main}33`,
                  borderRadius: 0,
                  overflow: 'auto',
                  p: 3,
                }}
              >
                {/* Analytics Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" sx={{ 
                    color: theme.palette.secondary.main,
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}>
                    <AnalyticsIcon />
                    Live Analytics
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setShowStatsPanel(false)}
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>

                {/* Professional Stats Grid */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <ProfessionalStatsCard
                      title="Response Time"
                      value={realtimeStats.responseTime}
                      trend={-5}
                      icon={SpeedIcon}
                      color="#4CAF50"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <ProfessionalStatsCard
                      title="Success Rate"
                      value={`${realtimeStats.successRate}%`}
                      trend={2}
                      icon={TrendingUpIcon}
                      color="#2196F3"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <ProfessionalStatsCard
                      title="Avg Rating"
                      value={realtimeStats.avgRating}
                      trend={1}
                      icon={StarIcon}
                      color="#FF9800"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <ProfessionalStatsCard
                      title="Online Now"
                      value="847"
                      trend={8}
                      icon={PeopleIcon}
                      color="#9C27B0"
                    />
                  </Grid>
                </Grid>

                {/* Category Performance */}
                <Paper
                  sx={{
                    p: 2.5,
                    mb: 3,
                    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.secondary.main}08 100%)`,
                    border: `1px solid ${theme.palette.secondary.main}22`,
                    borderRadius: 3,
                  }}
                >
                  <Typography variant="subtitle1" sx={{ 
                    mb: 2, 
                    fontWeight: 'bold',
                    color: theme.palette.secondary.main,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}>
                    <AssessmentIcon />
                    Category Performance
                  </Typography>
                  <Stack spacing={2}>
                    {categoryStats.map((category, index) => {
                      const IconComponent = category.icon;
                      return (
                        <motion.div
                          key={category.name}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            p: 1.5,
                            borderRadius: 2,
                            '&:hover': {
                              bgcolor: category.color + '11',
                            },
                            transition: 'all 0.3s ease',
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar
                                sx={{
                                  bgcolor: category.color + '22',
                                  color: category.color,
                                  width: 32,
                                  height: 32,
                                }}
                              >
                                <IconComponent fontSize="small" />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {category.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {category.jobs} jobs • {category.workers} workers
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: category.color }}>
                                {Math.round((category.jobs / category.workers) * 100)}%
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                match rate
                              </Typography>
                            </Box>
                          </Box>
                        </motion.div>
                      );
                    })}
                  </Stack>
                </Paper>

                {/* Live Activity Feed */}
                <Paper
                  sx={{
                    p: 2.5,
                    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.primary.main}08 100%)`,
                    border: `1px solid ${theme.palette.primary.main}22`,
                    borderRadius: 3,
                  }}
                >
                  <Typography variant="subtitle1" sx={{ 
                    mb: 2, 
                    fontWeight: 'bold',
                    color: theme.palette.primary.main,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}>
                    <TimelineIcon />
                    Live Activity
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#4CAF50',
                          ml: 1,
                        }}
                      />
                    </motion.div>
                  </Typography>
                  <Stack spacing={1}>
                    {realtimeActivities.map((activity, index) => (
                      <ActivityFeedItem key={activity.id} activity={activity} index={index} />
                    ))}
                  </Stack>
                </Paper>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Stats Panel Button */}
        {!isMobile && !isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'absolute',
              right: showStatsPanel ? 410 : 20,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1100,
            }}
          >
            <Tooltip title={showStatsPanel ? "Hide Analytics" : "Show Analytics"}>
              <Fab
                size="medium"
                onClick={() => setShowStatsPanel(!showStatsPanel)}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  color: 'white',
                  boxShadow: `0 8px 32px ${theme.palette.primary.main}44`,
                  '&:hover': {
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <AnalyticsIcon />
              </Fab>
            </Tooltip>
          </motion.div>
        )}
      </Box>

      {/* Professional Loading Overlay */}
      <AnimatePresence>
        {loading && !initializing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Paper
              elevation={16}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1300,
                p: 4,
                textAlign: 'center',
                background: `linear-gradient(135deg, ${theme.palette.background.paper}ee 0%, ${theme.palette.background.paper}cc 100%)`,
                backdropFilter: 'blur(20px)',
                border: `2px solid ${theme.palette.secondary.main}33`,
                borderRadius: 4,
                minWidth: 300,
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              >
                <CircularProgress 
                  sx={{ color: theme.palette.secondary.main, mb: 2 }} 
                  size={60}
                  thickness={3}
                />
              </motion.div>
              <Typography variant="h6" sx={{ 
                color: theme.palette.secondary.main,
                fontWeight: 'bold',
                mb: 1,
              }}>
                Searching {getSearchTypeLabel()}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Analyzing {currentFilters.radius}km radius for best matches...
              </Typography>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Professional Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="warning" 
          elevation={8}
          sx={{ 
            width: '100%',
            background: `linear-gradient(135deg, ${theme.palette.background.paper}ee 0%, ${theme.palette.background.paper}cc 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.secondary.main}33`,
            borderRadius: 3,
          }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfessionalMapPage;
