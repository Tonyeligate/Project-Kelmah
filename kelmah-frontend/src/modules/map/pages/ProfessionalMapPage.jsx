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
  MyLocation as MyLocationIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Professional vocational job data for Ghana
const mockMapData = {
  jobs: [
    {
      id: 'job-1',
      title: 'Residential Electrical Wiring',
      category: 'Electrical Services',
      location: { lat: 5.5600, lng: -0.2057, address: 'East Legon, Accra' },
      budget: 'GH₵1,200-2,000',
      urgency: 'high',
      status: 'active',
      posted: '2 hours ago',
      views: 45,
      applications: 12,
      client: { name: 'Homeowner - Mr. Asante', rating: 4.8, verified: true },
      skills: ['Electrical Wiring', 'Circuit Installation', 'Safety Compliance'],
      description: 'Complete electrical wiring for 3-bedroom house including lighting, outlets, and safety switches',
      jobType: 'contract',
      duration: '5-7 days',
      experienceLevel: 'intermediate'
    },
    {
      id: 'job-2',
      title: 'Commercial Plumbing Installation',
      category: 'Plumbing Services',
      location: { lat: 5.5700, lng: -0.2157, address: 'Osu, Accra' },
      budget: 'GH₵800-1,500',
      urgency: 'medium',
      status: 'active',
      posted: '4 hours ago',
      views: 32,
      applications: 8,
      client: { name: 'Golden Plaza Hotel', rating: 4.6, verified: true },
      skills: ['Commercial Plumbing', 'Pipe Installation', 'Water Systems'],
      description: 'Install plumbing system for new restaurant including kitchen and bathroom facilities',
      jobType: 'project',
      duration: '3-4 days',
      experienceLevel: 'expert'
    },
    {
      id: 'job-3',
      title: 'Carpentry & Furniture Making',
      category: 'Carpentry',
      location: { lat: 5.5500, lng: -0.1957, address: 'Tema, Greater Accra' },
      budget: 'GH₵600-1,200',
      urgency: 'urgent',
      status: 'active',
      posted: '1 hour ago',
      views: 28,
      applications: 15,
      client: { name: 'Furniture Plus Ltd', rating: 4.9, verified: true },
      skills: ['Custom Furniture', 'Wood Working', 'Design'],
      description: 'Create custom office furniture including desks, chairs, and storage units',
      jobType: 'project',
      duration: '2-3 weeks',
      experienceLevel: 'expert'
    },
    {
      id: 'job-4',
      title: 'Masonry & Bricklaying',
      category: 'Construction',
      location: { lat: 5.5800, lng: -0.2300, address: 'Dansoman, Accra' },
      budget: 'GH₵2,000-3,500',
      urgency: 'medium',
      status: 'active',
      posted: '6 hours ago',
      views: 38,
      applications: 6,
      client: { name: 'BuildRight Construction', rating: 4.7, verified: true },
      skills: ['Bricklaying', 'Concrete Work', 'Foundation'],
      description: 'Build perimeter wall and foundation for residential property',
      jobType: 'contract',
      duration: '2-3 weeks',
      experienceLevel: 'intermediate'
    },
    {
      id: 'job-5',
      title: 'Auto Mechanic Services',
      category: 'Automotive',
      location: { lat: 5.5400, lng: -0.1800, address: 'Spintex, Accra' },
      budget: 'GH₵400-800',
      urgency: 'high',
      status: 'active',
      posted: '3 hours ago',
      views: 52,
      applications: 18,
      client: { name: 'Fleet Manager - TransCorp', rating: 4.5, verified: true },
      skills: ['Engine Repair', 'Diagnostics', 'Maintenance'],
      description: 'Complete engine overhaul and maintenance for company vehicles',
      jobType: 'service',
      duration: '1-2 weeks',
      experienceLevel: 'expert'
    }
  ],
  workers: [
    {
      id: 'worker-1',
      name: 'Kwame Asante',
      profession: 'Master Electrician',
      category: 'Electrical Services',
      location: { lat: 5.5600, lng: -0.2057, address: 'East Legon, Accra' },
      rating: 4.9,
      reviewCount: 127,
      experience: '8 years',
      verified: true,
      available: true,
      hourlyRate: 'GH₵45-65/hr',
      skills: ['Residential Wiring', 'Industrial Electrical', 'Solar Installation', 'Electrical Repairs'],
      certifications: ['Licensed Electrician', 'Safety Certified', 'Solar Installation Certified'],
      completedJobs: 156,
      responseTime: '< 2 hours',
      profileImage: '/api/placeholder/150/150',
      description: 'Certified master electrician with 8+ years experience in residential and commercial electrical work'
    },
    {
      id: 'worker-2',
      name: 'Akosua Mensah',
      profession: 'Professional Plumber',
      category: 'Plumbing Services',
      location: { lat: 5.5700, lng: -0.2157, address: 'Osu, Accra' },
      rating: 4.7,
      reviewCount: 89,
      experience: '6 years',
      verified: true,
      available: true,
      hourlyRate: 'GH₵35-50/hr',
      skills: ['Pipe Installation', 'Water Systems', 'Drain Cleaning', 'Emergency Repairs'],
      certifications: ['Licensed Plumber', 'Water Systems Certified'],
      completedJobs: 134,
      responseTime: '< 1 hour',
      profileImage: '/api/placeholder/150/150',
      description: 'Expert plumber specializing in residential and commercial water systems'
    },
    {
      id: 'worker-3',
      name: 'Kofi Boateng',
      profession: 'Master Carpenter',
      category: 'Carpentry',
      location: { lat: 5.5500, lng: -0.1957, address: 'Tema, Greater Accra' },
      rating: 4.8,
      reviewCount: 102,
      experience: '12 years',
      verified: true,
      available: true,
      hourlyRate: 'GH₵40-60/hr',
      skills: ['Custom Furniture', 'Cabinetry', 'Wood Finishing', 'Restoration'],
      certifications: ['Master Carpenter', 'Wood Working Specialist'],
      completedJobs: 198,
      responseTime: '< 3 hours',
      profileImage: '/api/placeholder/150/150',
      description: 'Master carpenter with 12+ years creating custom furniture and cabinetry'
    },
    {
      id: 'worker-4',
      name: 'Ama Osei',
      profession: 'Construction Mason',
      category: 'Construction',
      location: { lat: 5.5800, lng: -0.2300, address: 'Dansoman, Accra' },
      rating: 4.6,
      reviewCount: 76,
      experience: '10 years',
      verified: true,
      available: true,
      hourlyRate: 'GH₵30-45/hr',
      skills: ['Bricklaying', 'Concrete Work', 'Foundation', 'Block Work'],
      certifications: ['Construction Safety', 'Masonry Specialist'],
      completedJobs: 143,
      responseTime: '< 4 hours',
      profileImage: '/api/placeholder/150/150',
      description: 'Experienced mason specializing in residential and commercial construction'
    }
  ],
  categories: [
    {
      id: 'electrical',
      name: 'Electrical Services',
      icon: 'electrical',
      color: '#FFD700',
      jobCount: 45,
      description: 'Licensed electricians for residential and commercial work'
    },
    {
      id: 'plumbing',
      name: 'Plumbing Services', 
      icon: 'plumbing',
      color: '#4A90E2',
      jobCount: 32,
      description: 'Professional plumbers for all water system needs'
    },
    {
      id: 'carpentry',
      name: 'Carpentry & Woodwork',
      icon: 'carpentry',
      color: '#8B4513',
      jobCount: 28,
      description: 'Master carpenters for custom furniture and construction'
    },
    {
      id: 'construction',
      name: 'Construction & Masonry',
      icon: 'construction',
      color: '#FF6B35',
      jobCount: 38,
      description: 'Skilled masons and construction workers'
    },
    {
      id: 'automotive',
      name: 'Automotive Services',
      icon: 'automotive',
      color: '#1A1A1A',
      jobCount: 24,
      description: 'Certified auto mechanics and technicians'
    },
    {
      id: 'welding',
      name: 'Welding & Metalwork',
      icon: 'welding',
      color: '#FF4500',
      jobCount: 19,
      description: 'Professional welders and metal fabricators'
    },
    {
      id: 'painting',
      name: 'Painting & Decoration',
      icon: 'painting',
      color: '#9B59B6',
      jobCount: 35,
      description: 'House painters and decorative specialists'
    }
  ],
  stats: {
    totalJobs: 234,
    activeWorkers: 1247,
    completedProjects: 5678,
    averageRating: 4.7
  }
};

// Professional styling theme for Kelmah
const theme = {
  colors: {
    primary: '#1A1A1A',    // Black
    secondary: '#D4AF37',   // Gold
    accent: '#FFFFFF',      // White
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3'
  },
  gradients: {
    primary: 'linear-gradient(135deg, #1A1A1A 0%, #333333 100%)',
    gold: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
    professional: 'linear-gradient(135deg, #1A1A1A 0%, #D4AF37 50%, #FFFFFF 100%)'
  }
};

// Enhanced Professional Map Component
const ProfessionalMapPage = () => {
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const isTablet = useMediaQuery(muiTheme.breakpoints.down('lg'));

  // State management
  const [mapData, setMapData] = useState(mockMapData);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('jobs'); // 'jobs' or 'workers'
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    budget: [0, 5000],
    rating: 0,
    experience: 'all',
    availability: 'all'
  });
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 5.5600, lng: -0.2057 });
  const [mapZoom, setMapZoom] = useState(11);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);

  // Filter data based on selected category and search
  const filteredData = useMemo(() => {
    const dataToFilter = viewMode === 'jobs' ? mapData.jobs : mapData.workers;
    
    return dataToFilter.filter(item => {
      const matchesCategory = selectedCategory === 'all' || 
        item.category.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesRating = !filters.rating || item.rating >= filters.rating;
      
      return matchesCategory && matchesSearch && matchesRating;
    });
  }, [mapData, selectedCategory, viewMode, searchQuery, filters]);

  // Professional header component
  const ProfessionalHeader = () => (
    <Box sx={{ 
      background: theme.gradients.primary,
      color: 'white',
      py: 3,
      px: 2,
      borderRadius: 2,
      mb: 3,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Pattern */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '50%',
        height: '100%',
        background: `linear-gradient(45deg, ${theme.colors.secondary}20, transparent)`,
        borderRadius: '50% 0 0 50%'
      }} />
      
      <Container maxWidth="xl">
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ color: theme.colors.secondary }}>
                Find Skilled Professionals in Ghana
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                Connect with verified electricians, plumbers, carpenters, masons, and more
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Chip 
                  icon={<VerifiedIcon />} 
                  label={`${mapData.stats.activeWorkers}+ Verified Workers`}
                  sx={{ bgcolor: theme.colors.secondary, color: 'black', fontWeight: 'bold' }}
                />
                <Chip 
                  icon={<StarIcon />} 
                  label={`${mapData.stats.averageRating} Average Rating`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Chip 
                  icon={<CheckCircleIcon />} 
                  label={`${mapData.stats.completedProjects}+ Completed Jobs`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </Stack>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <BuildIcon sx={{ fontSize: 80, color: theme.colors.secondary, mb: 1 }} />
              </motion.div>
              <Typography variant="h6" sx={{ color: theme.colors.secondary }}>
                Professional Services
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );

  // Professional search and filter bar
  const ProfessionalSearchBar = () => (
    <Paper sx={{ 
      p: 2, 
      mb: 3, 
      background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
      border: `1px solid ${theme.colors.secondary}20`,
      borderRadius: 3,
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
    }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            placeholder="Search for jobs, workers, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: theme.colors.secondary }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: theme.colors.secondary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.colors.secondary,
                  },
                }
              }
            }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: theme.colors.primary }}>Category</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              label="Category"
              sx={{
                borderRadius: 2,
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.colors.secondary,
                }
              }}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {mapData.categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      bgcolor: category.color 
                    }} />
                    {category.name} ({category.jobCount})
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <Stack direction="row" spacing={1}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              sx={{
                '& .MuiToggleButton-root': {
                  border: `1px solid ${theme.colors.secondary}`,
                  color: theme.colors.primary,
                  '&.Mui-selected': {
                    bgcolor: theme.colors.secondary,
                    color: 'white',
                    '&:hover': {
                      bgcolor: theme.colors.secondary,
                    }
                  }
                }
              }}
            >
              <ToggleButton value="jobs" sx={{ px: 3 }}>
                <WorkIcon sx={{ mr: 1 }} />
                Jobs ({mapData.jobs.length})
              </ToggleButton>
              <ToggleButton value="workers" sx={{ px: 3 }}>
                <PersonIcon sx={{ mr: 1 }} />
                Workers ({mapData.workers.length})
              </ToggleButton>
            </ToggleButtonGroup>
            <IconButton 
              onClick={() => setShowFilters(!showFilters)}
              sx={{ 
                border: `1px solid ${theme.colors.secondary}`,
                color: showFilters ? 'white' : theme.colors.primary,
                bgcolor: showFilters ? theme.colors.secondary : 'transparent'
              }}
            >
              <FilterIcon />
            </IconButton>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );

  // Main component return
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <ProfessionalHeader />
      <ProfessionalSearchBar />
      
      <Grid container spacing={3}>
        {/* Map Section */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ 
            height: 600, 
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
            border: `2px solid ${theme.colors.secondary}20`
          }}>
            {/* Map placeholder with professional styling */}
            <Box sx={{
              height: '100%',
              background: `linear-gradient(135deg, ${theme.colors.primary}10 0%, ${theme.colors.secondary}10 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <Box sx={{ textAlign: 'center', color: theme.colors.primary }}>
                <LocationOnIcon sx={{ fontSize: 60, color: theme.colors.secondary, mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Interactive Map View
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.7 }}>
                  Showing {filteredData.length} {viewMode} in Greater Accra Region
                </Typography>
              </Box>
              
              {/* Map controls */}
              <Box sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}>
                <IconButton sx={{ 
                  background: 'rgba(0,0,0,0.8)', 
                  color: 'white',
                  '&:hover': { background: 'rgba(0,0,0,0.9)' }
                }}>
                  <ZoomInIcon />
                </IconButton>
                <IconButton sx={{ 
                  background: 'rgba(0,0,0,0.8)', 
                  color: 'white',
                  '&:hover': { background: 'rgba(0,0,0,0.9)' }
                }}>
                  <ZoomOutIcon />
                </IconButton>
                <IconButton sx={{ 
                  background: `${theme.colors.secondary}`, 
                  color: 'white',
                  '&:hover': { background: `${theme.colors.secondary}dd` }
                }}>
                  <MyLocationIcon />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Results Panel */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ 
            height: 600, 
            borderRadius: 3,
            overflow: 'hidden',
            border: `1px solid ${theme.colors.secondary}20`
          }}>
            <Box sx={{ 
              p: 2, 
              background: theme.gradients.gold,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Typography variant="h6" fontWeight="bold">
                {viewMode === 'jobs' ? 'Available Jobs' : 'Professional Workers'}
              </Typography>
              <Chip 
                label={filteredData.length}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.3)', 
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Box>
            
            <Box sx={{ height: 'calc(100% - 80px)', overflow: 'auto', p: 1 }}>
              {filteredData.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {viewMode === 'jobs' ? (
                    <JobCard job={item} onClick={() => setSelectedItem(item)} />
                  ) : (
                    <WorkerCard worker={item} onClick={() => setSelectedItem(item)} />
                  )}
                </motion.div>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
};

// Professional Job Card Component
const JobCard = ({ job, onClick }) => (
  <Card sx={{ 
    mb: 1, 
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: `1px solid ${theme.colors.secondary}20`,
    '&:hover': { 
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 25px ${theme.colors.secondary}30`,
      borderColor: theme.colors.secondary
    }
  }} onClick={onClick}>
    <CardContent sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ color: theme.colors.primary, flex: 1 }}>
          {job.title}
        </Typography>
        <Chip 
          label={job.urgency}
          size="small"
          sx={{
            bgcolor: job.urgency === 'urgent' ? '#f44336' : job.urgency === 'high' ? '#ff9800' : '#4caf50',
            color: 'white',
            fontWeight: 'bold',
            ml: 1
          }}
        />
      </Box>
      
      <Typography variant="body2" sx={{ color: theme.colors.secondary, fontWeight: 'bold', mb: 1 }}>
        {job.category}
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <LocationOnIcon sx={{ fontSize: 16, color: theme.colors.secondary, mr: 0.5 }} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {job.location.address}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ color: theme.colors.secondary }}>
          {job.budget}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {job.posted}
        </Typography>
      </Box>
      
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.4 }}>
        {job.description}
      </Typography>
      
      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
        {job.skills.slice(0, 3).map((skill, index) => (
          <Chip 
            key={index}
            label={skill}
            size="small"
            sx={{ 
              bgcolor: `${theme.colors.secondary}20`,
              color: theme.colors.primary,
              fontSize: '0.75rem'
            }}
          />
        ))}
      </Stack>
      
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <VisibilityIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
          <Typography variant="body2" sx={{ color: 'text.secondary', mr: 2 }}>
            {job.views} views
          </Typography>
          <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {job.applications} applied
          </Typography>
        </Box>
        {job.client.verified && (
          <VerifiedIcon sx={{ fontSize: 16, color: theme.colors.secondary }} />
        )}
      </Box>
    </CardContent>
  </Card>
);

// Professional Worker Card Component  
const WorkerCard = ({ worker, onClick }) => (
  <Card sx={{ 
    mb: 1, 
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: `1px solid ${theme.colors.secondary}20`,
    '&:hover': { 
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 25px ${theme.colors.secondary}30`,
      borderColor: theme.colors.secondary
    }
  }} onClick={onClick}>
    <CardContent sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
        <Avatar 
          src={worker.profileImage} 
          sx={{ 
            width: 50, 
            height: 50, 
            mr: 2,
            border: `2px solid ${theme.colors.secondary}`
          }}
        >
          {worker.name.charAt(0)}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: theme.colors.primary }}>
              {worker.name}
            </Typography>
            {worker.verified && (
              <VerifiedIcon sx={{ fontSize: 18, color: theme.colors.secondary, ml: 1 }} />
            )}
          </Box>
          <Typography variant="body2" sx={{ color: theme.colors.secondary, fontWeight: 'bold' }}>
            {worker.profession}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <StarIcon sx={{ fontSize: 16, color: '#ffc107', mr: 0.5 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {worker.rating} ({worker.reviewCount} reviews)
            </Typography>
          </Box>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: theme.colors.secondary }}>
            {worker.hourlyRate}
          </Typography>
          <Chip 
            label={worker.available ? 'Available' : 'Busy'}
            size="small"
            sx={{
              bgcolor: worker.available ? '#4caf50' : '#f44336',
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <LocationOnIcon sx={{ fontSize: 16, color: theme.colors.secondary, mr: 0.5 }} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {worker.location.address}
        </Typography>
      </Box>
      
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.4 }}>
        {worker.description}
      </Typography>
      
      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
        {worker.skills.slice(0, 3).map((skill, index) => (
          <Chip 
            key={index}
            label={skill}
            size="small"
            sx={{ 
              bgcolor: `${theme.colors.secondary}20`,
              color: theme.colors.primary,
              fontSize: '0.75rem'
            }}
          />
        ))}
      </Stack>
      
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <WorkIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
          <Typography variant="body2" sx={{ color: 'text.secondary', mr: 2 }}>
            {worker.completedJobs} jobs
          </Typography>
          <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {worker.responseTime}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: theme.colors.secondary, fontWeight: 'bold' }}>
          {worker.experience}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

export default ProfessionalMapPage;
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
              <MyLocationIcon />
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
