import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  PriorityHigh as PriorityHighIcon,
  LocalOffer as LocalOfferIcon,
  Category as CategoryIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TrendingDown as TrendingDownIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Layers as LayersIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Chat as ChatIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Mock data for demonstration
const mockMapData = {
  jobs: [
    {
      id: 'job-1',
      title: 'Catering Service',
      category: 'Food & Hospitality',
      location: { lat: 5.5600, lng: -0.2057, address: 'Accra, Ghana' },
      budget: '$500-800',
      urgency: 'high',
      status: 'active',
      posted: '2 hours ago',
      views: 45,
      applications: 12,
      client: { name: 'Event Pro Ghana', rating: 4.8, verified: true },
      skills: ['Cooking', 'Event Planning', 'Customer Service'],
      description: 'Professional catering service needed for corporate event',
    },
    {
      id: 'job-2',
      title: 'Electrical Installation',
      category: 'Electrical',
      location: { lat: 5.5700, lng: -0.2157, address: 'Kumasi, Ghana' },
      budget: '$300-500',
      urgency: 'medium',
      status: 'active',
      posted: '4 hours ago',
      views: 32,
      applications: 8,
      client: { name: 'Tech Solutions Ltd', rating: 4.6, verified: true },
      skills: ['Electrical Wiring', 'Safety Standards', 'Installation'],
      description: 'Complete electrical installation for new office building',
    },
    {
      id: 'job-3',
      title: 'Plumbing Repair',
      category: 'Plumbing',
      location: { lat: 5.5500, lng: -0.1957, address: 'Tema, Ghana' },
      budget: '$150-300',
      urgency: 'urgent',
      status: 'active',
      posted: '1 hour ago',
      views: 28,
      applications: 15,
      client: { name: 'HomeFix Services', rating: 4.9, verified: true },
      skills: ['Plumbing', 'Repair', 'Maintenance'],
      description: 'Emergency plumbing repair needed immediately',
    },
  ],
  workers: [
    {
      id: 'worker-1',
      name: 'Kwame Asante',
      category: 'Electrical',
      location: { lat: 5.5600, lng: -0.2057, address: 'Accra, Ghana' },
      rating: 4.8,
      hourlyRate: '$25-35',
      status: 'available',
      verified: true,
      skills: ['Electrical Wiring', 'Safety Standards', 'Installation'],
      completedJobs: 156,
      responseTime: '< 2 min',
      portfolio: ['Commercial Projects', 'Residential Wiring'],
      languages: ['English', 'Twi'],
      availability: 'Immediate',
    },
    {
      id: 'worker-2',
      name: 'Ama Osei',
      category: 'Catering',
      location: { lat: 5.5700, lng: -0.2157, address: 'Kumasi, Ghana' },
      rating: 4.9,
      hourlyRate: '$20-30',
      status: 'available',
      verified: true,
      skills: ['Cooking', 'Event Planning', 'Customer Service'],
      completedJobs: 89,
      responseTime: '< 5 min',
      portfolio: ['Weddings', 'Corporate Events', 'Private Parties'],
      languages: ['English', 'Twi', 'Ga'],
      availability: 'Next Week',
    },
  ],
  analytics: {
    responseTime: { value: '< 2 min', trend: -5, color: '#4CAF50' },
    successRate: { value: '94%', trend: 2, color: '#2196F3' },
    avgRating: { value: '4.8', trend: 1, color: '#FFC107' },
    onlineNow: { value: '847', trend: 8, color: '#9C27B0' },
  },
  categories: [
    { name: 'Carpentry', count: 124, percentage: 124, color: '#FF9800' },
    { name: 'Electrical', count: 89, percentage: 89, color: '#FFC107' },
    { name: 'Plumbing', count: 67, percentage: 67, color: '#2196F3' },
    { name: 'Catering', count: 45, percentage: 45, color: '#4CAF50' },
    { name: 'Painting', count: 34, percentage: 34, color: '#9C27B0' },
  ],
  status: {
    active: { count: 0, trend: 15, color: '#4CAF50' },
    verified: { count: 34, trend: 8, color: '#2196F3' },
    urgent: { count: 7, trend: -5, color: '#F44336' },
    topRated: { count: 0, trend: 12, color: '#FFC107' },
  },
};

// Interactive Map Component
const InteractiveMap = ({ 
  data, 
  viewType, 
  onMarkerClick, 
  center, 
  zoom = 12,
  loading = false 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100%',
        width: '100%',
        borderRadius: 2,
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Map Placeholder with Professional Styling */}
      <Box
        sx={{
          height: '100%',
          width: '100%',
          background: `linear-gradient(45deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.main} 100%)`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 80%, ${theme.palette.primary.main}22 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, ${theme.palette.secondary.main}22 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, ${theme.palette.primary.light}11 0%, transparent 50%)
            `,
            animation: 'pulse 4s ease-in-out infinite alternate',
            '@keyframes pulse': {
              '0%': { opacity: 0.3 },
              '100%': { opacity: 0.7 },
            },
          }}
        />

        {/* Map Content */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            color: 'white',
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <LocationOnIcon sx={{ fontSize: 64, mb: 2, color: theme.palette.secondary.main }} />
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
              Kelmah Professional Map
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
              Live tracking • {data.length} {viewType} found
            </Typography>
          </motion.div>

          {/* Interactive Markers */}
          <Box sx={{ position: 'relative', height: 300, width: '100%' }}>
            {data.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                style={{
                  position: 'absolute',
                  left: `${20 + (index * 15) % 60}%`,
                  top: `${30 + (index * 20) % 40}%`,
                }}
              >
                <Tooltip title={`${item.title || item.name} - ${item.location.address}`}>
                  <IconButton
                    onClick={() => onMarkerClick(item)}
                    sx={{
                      background: viewType === 'jobs' ? theme.palette.primary.main : theme.palette.secondary.main,
                      color: 'white',
                      '&:hover': {
                        background: viewType === 'jobs' ? theme.palette.primary.dark : theme.palette.secondary.dark,
                        transform: 'scale(1.1)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {viewType === 'jobs' ? <JobIcon /> : <WorkerIcon />}
                  </IconButton>
                </Tooltip>
              </motion.div>
            ))}
          </Box>

          {/* Map Controls */}
          <Box sx={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <IconButton sx={{ background: 'rgba(0,0,0,0.3)', color: 'white' }}>
              <ZoomInIcon />
            </IconButton>
            <IconButton sx={{ background: 'rgba(0,0,0,0.3)', color: 'white' }}>
              <ZoomOutIcon />
            </IconButton>
            <IconButton sx={{ background: 'rgba(0,0,0,0.3)', color: 'white' }}>
              <MyLocation as LocationIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Loading Overlay */}
      {loading && (
        <Backdrop
          sx={{
            position: 'absolute',
            zIndex: 3,
            color: theme.palette.secondary.main,
            background: 'rgba(0,0,0,0.7)',
          }}
          open={loading}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      )}
    </Box>
  );
};

// Live Analytics Component
const LiveAnalytics = ({ analytics, onClose }) => {
  const theme = useTheme();

  return (
    <Paper
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        width: 320,
        maxHeight: 'calc(100vh - 32px)',
        overflow: 'auto',
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        zIndex: 10,
      }}
    >
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Live Analytics
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {Object.entries(analytics).map(([key, data]) => (
            <Grid item xs={6} key={key}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${data.color}11 100%)`,
                    border: `1px solid ${data.color}33`,
                    borderRadius: 2,
                    p: 2,
                    textAlign: 'center',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: data.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1,
                      }}
                    >
                      {key === 'responseTime' && <SpeedIcon sx={{ color: 'white', fontSize: 20 }} />}
                      {key === 'successRate' && <TimelineIcon sx={{ color: 'white', fontSize: 20 }} />}
                      {key === 'avgRating' && <StarIcon sx={{ color: 'white', fontSize: 20 }} />}
                      {key === 'onlineNow' && <PeopleIcon sx={{ color: 'white', fontSize: 20 }} />}
                    </Box>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {data.value}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {data.trend > 0 ? (
                      <TrendingUpIcon sx={{ color: '#4CAF50', fontSize: 16, mr: 0.5 }} />
                    ) : (
                      <TrendingDownIcon sx={{ color: '#F44336', fontSize: 16, mr: 0.5 }} />
                    )}
                    <Typography
                      variant="caption"
                      sx={{ color: data.trend > 0 ? '#4CAF50' : '#F44336' }}
                    >
                      {Math.abs(data.trend)}%
                    </Typography>
                  </Box>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Category Performance */}
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Category Performance
        </Typography>
        <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
          {mockMapData.categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2">{category.name}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {category.percentage}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={category.percentage}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: `${category.color}22`,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: category.color,
                  },
                }}
              />
            </motion.div>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

// Search and Filter Panel
const SearchFilterPanel = ({ 
  searchQuery, 
  setSearchQuery, 
  filters, 
  setFilters, 
  onSearch,
  onClearFilters,
  viewType,
  setViewType,
  status,
  resultsCount
}) => {
  const theme = useTheme();
  const [expandedFilters, setExpandedFilters] = useState(false);

  return (
    <Paper
      sx={{
        position: 'absolute',
        top: 16,
        left: 16,
        width: 350,
        maxHeight: 'calc(100vh - 32px)',
        overflow: 'auto',
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        zIndex: 10,
      }}
    >
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Search & Filters
        </Typography>
        
        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search jobs, workers, location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={onSearch}>
                  <RefreshIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Status Cards */}
        <Grid container spacing={1} sx={{ mb: 2 }}>
          {Object.entries(status).map(([key, data]) => (
            <Grid item xs={6} key={key}>
              <Card
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${data.color}11 100%)`,
                  border: `1px solid ${data.color}33`,
                  borderRadius: 2,
                  p: 1.5,
                  textAlign: 'center',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: data.color }}>
                  {data.count}
                </Typography>
                <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                  {key}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.5 }}>
                  {data.trend > 0 ? (
                    <TrendingUpIcon sx={{ color: '#4CAF50', fontSize: 12 }} />
                  ) : (
                    <TrendingDownIcon sx={{ color: '#F44336', fontSize: 12 }} />
                  )}
                  <Typography variant="caption" sx={{ color: data.trend > 0 ? '#4CAF50' : '#F44336' }}>
                    {Math.abs(data.trend)}%
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* View Type Toggle */}
        <ToggleButtonGroup
          value={viewType}
          exclusive
          onChange={(e, newValue) => newValue && setViewType(newValue)}
          sx={{ mb: 2, width: '100%' }}
        >
          <ToggleButton value="jobs" sx={{ flex: 1 }}>
            <JobIcon sx={{ mr: 1 }} />
            Jobs
          </ToggleButton>
          <ToggleButton value="workers" sx={{ flex: 1 }}>
            <WorkerIcon sx={{ mr: 1 }} />
            Workers
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Results Summary */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#4CAF50',
              mr: 1,
            }}
          />
          <Typography variant="body2">
            Live Results {resultsCount}
          </Typography>
        </Box>

        {/* Advanced Filters Button */}
        <Button
          fullWidth
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={() => setExpandedFilters(!expandedFilters)}
          sx={{ mb: 2 }}
        >
          Advanced Filters
        </Button>

        {/* Advanced Filters */}
        <Collapse in={expandedFilters}>
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category || ''}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {mockMapData.categories.map((cat) => (
                  <MenuItem key={cat.name} value={cat.name}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Distance</InputLabel>
              <Select
                value={filters.distance || 50}
                onChange={(e) => setFilters({ ...filters, distance: e.target.value })}
                label="Distance"
              >
                <MenuItem value={10}>Within 10km</MenuItem>
                <MenuItem value={25}>Within 25km</MenuItem>
                <MenuItem value={50}>Within 50km</MenuItem>
                <MenuItem value={100}>Within 100km</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sortBy || 'relevance'}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                label="Sort By"
              >
                <MenuItem value="relevance">Relevance</MenuItem>
                <MenuItem value="distance">Distance</MenuItem>
                <MenuItem value="rating">Rating</MenuItem>
                <MenuItem value="price">Price</MenuItem>
                <MenuItem value="date">Date Posted</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={onClearFilters}
              >
                Clear
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={onSearch}
              >
                Apply
              </Button>
            </Box>
          </Box>
        </Collapse>
      </Box>

      {/* Live Results List */}
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Live Results
        </Typography>
        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
          {mockMapData[viewType].slice(0, 5).map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <ListItem
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
                  border: `1px solid ${theme.palette.divider}`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.action.hover} 0%, ${theme.palette.background.paper} 100%)`,
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                    {viewType === 'jobs' ? <JobIcon /> : <WorkerIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={item.title || item.name}
                  secondary={`${item.location.address} • ${item.category}`}
                />
                <ListItemSecondaryAction>
                  <Chip
                    label={viewType === 'jobs' ? item.budget : item.hourlyRate}
                    size="small"
                    color="primary"
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </motion.div>
          ))}
        </List>
      </Box>
    </Paper>
  );
};

// Main Professional Map Page
const ProfessionalMapPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [viewType, setViewType] = useState('jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    distance: 50,
    sortBy: 'relevance',
  });
  const [loading, setLoading] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 5.5600, lng: -0.2057 });
  const [mapZoom, setMapZoom] = useState(12);

  // Computed values
  const currentData = useMemo(() => mockMapData[viewType], [viewType]);
  const resultsCount = currentData.length;

  // Handlers
  const handleSearch = useCallback(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      category: '',
      distance: 50,
      sortBy: 'relevance',
    });
    setSearchQuery('');
  }, []);

  const handleMarkerClick = useCallback((item) => {
    setSelectedItem(item);
  }, []);

  const handleViewTypeChange = useCallback((newType) => {
    setViewType(newType);
    setSelectedItem(null);
  }, []);

  // Effects
  useEffect(() => {
    handleSearch();
  }, [viewType, filters]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
        position: 'relative',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: 'white',
          p: 2,
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: theme.palette.secondary.main, mr: 2 }}>
                K
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  Kelmah Professional Map
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Live tracking • {resultsCount} results found
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Key Metrics */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  label={`${mockMapData.jobs.length} Jobs`}
                  icon={<JobIcon />}
                  sx={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
                />
                <Chip
                  label={`${mockMapData.workers.length} Workers`}
                  icon={<WorkerIcon />}
                  sx={{ 
                    background: viewType === 'workers' ? theme.palette.secondary.main : 'rgba(255,255,255,0.1)',
                    color: 'white'
                  }}
                />
                <Chip
                  label="161 Completed"
                  icon={<CheckCircleIcon />}
                  sx={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
                />
              </Box>

              {/* View Type Toggle */}
              <ToggleButtonGroup
                value={viewType}
                exclusive
                onChange={(e, newValue) => newValue && handleViewTypeChange(newValue)}
                size="small"
              >
                <ToggleButton value="jobs" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
                  Jobs
                  <Badge badgeContent={mockMapData.jobs.length} color="secondary" sx={{ ml: 1 }} />
                </ToggleButton>
                <ToggleButton value="workers" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
                  Workers
                  <Badge badgeContent={mockMapData.workers.length} color="secondary" sx={{ ml: 1 }} />
                </ToggleButton>
              </ToggleButtonGroup>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton sx={{ color: 'white' }}>
                  <RefreshIcon />
                </IconButton>
                <IconButton sx={{ color: 'white' }}>
                  <FullscreenIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Box sx={{ position: 'relative', height: 'calc(100vh - 200px)', minHeight: 600 }}>
          {/* Interactive Map */}
          <InteractiveMap
            data={currentData}
            viewType={viewType}
            onMarkerClick={handleMarkerClick}
            center={mapCenter}
            zoom={mapZoom}
            loading={loading}
          />

          {/* Search and Filter Panel */}
          <SearchFilterPanel
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filters={filters}
            setFilters={setFilters}
            onSearch={handleSearch}
            onClearFilters={handleClearFilters}
            viewType={viewType}
            setViewType={setViewType}
            status={mockMapData.status}
            resultsCount={resultsCount}
          />

          {/* Live Analytics Panel */}
          {showAnalytics && (
            <LiveAnalytics
              analytics={mockMapData.analytics}
              onClose={() => setShowAnalytics(false)}
            />
          )}

          {/* Floating Action Button */}
          <Fab
            color="secondary"
            aria-label="add"
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              zIndex: 10,
            }}
          >
            <AddIcon />
          </Fab>
        </Box>
      </Container>

      {/* Selected Item Dialog */}
      <Dialog
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {selectedItem?.title || selectedItem?.name}
            </Typography>
            <IconButton onClick={() => setSelectedItem(null)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedItem.description || `${selectedItem.category} professional`}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                {selectedItem.skills?.map((skill) => (
                  <Chip key={skill} label={skill} size="small" />
                ))}
              </Box>
              <Typography variant="body2" color="text.secondary">
                Location: {selectedItem.location.address}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedItem(null)}>Close</Button>
          <Button variant="contained">View Details</Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={false}
        autoHideDuration={6000}
        onClose={() => {}}
      >
        <Alert severity="info" sx={{ width: '100%' }}>
          Map data updated successfully
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfessionalMapPage;
