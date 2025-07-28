import React, { useEffect, useState, useRef } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Skeleton,
  Pagination,
  Drawer,
  IconButton,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  Stack,
  Rating,
  Divider,
  alpha,
  Grow,
  Collapse,
  Fab,
  Badge,
  Slider,
  Switch,
  FormControlLabel,
  Tooltip,
  LinearProgress,
  Autocomplete,
  InputAdornment,
  Backdrop,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  ToggleButton,
  ToggleButtonGroup,
  Zoom,
  Fade,
  Slide,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  CheckCircle,
  Group,
  WorkspacePremium,
  LocationOn,
  Schedule,
  MonetizationOn,
  Business,
  Star,
  Verified,
  AccessTime,
  ExpandMore,
  ExpandLess,
  Tune,
  Clear,
  BookmarkBorder,
  Bookmark,
  Share,
  Visibility,
  Work as WorkIcon,
  Apartment as ApartmentIcon,
  FlashOn as FlashOnIcon,
  TrendingUp as TrendingIcon,
  LocalOffer as LocalOfferIcon,
  FilterAlt as FilterAltIcon,
  Sort as SortIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  ViewQuilt as ViewQuiltIcon,
  Map as MapIcon,
  MyLocation as MyLocationIcon,
  Refresh as RefreshIcon,
  SaveAlt as SaveAltIcon,
  NotificationsActive as NotificationsActiveIcon,
  TrendingDown as TrendingDownIcon,
  AutoAwesome as AutoAwesomeIcon,
  Whatshot as WhatshotIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Handshake as HandshakeIcon,
  EmojiEvents as EmojiEventsIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  Dashboard as DashboardIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  CenterFocusStrong as CenterFocusStrongIcon,
  Layers as LayersIcon,
  Psychology as PsychologyIcon,
  Engineering as EngineeringIcon,
  Construction as ConstructionIcon,
  ElectricalServices as ElectricalIcon,
  Plumbing as PlumbingIcon,
  Build as BuildIcon,
  Home as HomeIcon,
  Handyman as CarpenterIcon,
  Thermostat as HvacIcon,
  RoofingSharp as RoofingIcon,
  FormatPaint as PaintIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { styled, keyframes } from '@mui/material/styles';
import { format, formatDistanceToNow } from 'date-fns';
import { Helmet } from 'react-helmet';
import useAuth from '../../auth/hooks/useAuth';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchJobs,
  setFilters,
  selectJobs,
  selectJobsLoading,
  selectJobsError,
  selectJobFilters,
  selectJobsPagination,
} from '../services/jobSlice';
import JobCard from '../components/common/JobCard';
import { useNavigate } from 'react-router-dom';

// Animations
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const slideInFromBottom = keyframes`
  from { transform: translateY(100px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

// Styled Components
const HeroSection = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${theme.palette.primary.main} 0%, 
    ${theme.palette.secondary.main} 50%, 
    ${theme.palette.primary.dark} 100%)`,
  color: 'white',
  padding: theme.spacing(8, 0),
  position: 'relative',
  overflow: 'hidden',
  minHeight: '70vh',
  display: 'flex',
  alignItems: 'center',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    animation: `${float} 6s ease-in-out infinite`,
  },
}));

const GlassCard = styled(Card)(({ theme, variant = 'default' }) => ({
  background: variant === 'glass' 
    ? alpha(theme.palette.background.paper, 0.9)
    : theme.palette.background.paper,
  backdropFilter: variant === 'glass' ? 'blur(20px)' : 'none',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: 20,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: `0 20px 40px ${alpha(theme.palette.secondary.main, 0.3)}`,
    borderColor: theme.palette.secondary.main,
  },
  '&::before': variant === 'premium' ? {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
  } : {},
}));

const StatCard = styled(motion.div)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.9),
  backdropFilter: 'blur(20px)',
  borderRadius: 20,
  padding: theme.spacing(3),
  textAlign: 'center',
  border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
  transition: 'all 0.3s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: `0 15px 30px ${alpha(theme.palette.secondary.main, 0.4)}`,
    borderColor: theme.palette.secondary.main,
  },
}));

const FloatingSearchBar = styled(Paper)(({ theme }) => ({
  position: 'sticky',
  top: theme.spacing(2),
  zIndex: 1000,
  background: alpha(theme.palette.background.paper, 0.95),
  backdropFilter: 'blur(20px)',
  borderRadius: 25,
  padding: theme.spacing(2),
  border: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.15)}`,
}));

const CategoryChip = styled(Chip)(({ theme, selected }) => ({
  borderRadius: 25,
  padding: theme.spacing(1, 2),
  margin: theme.spacing(0.5),
  fontWeight: 600,
  fontSize: '0.9rem',
  background: selected 
    ? `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`
    : alpha(theme.palette.background.paper, 0.8),
  color: selected ? 'white' : theme.palette.text.primary,
  border: `2px solid ${selected ? 'transparent' : alpha(theme.palette.secondary.main, 0.3)}`,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 20px ${alpha(theme.palette.secondary.main, 0.4)}`,
    borderColor: theme.palette.secondary.main,
  },
}));

const AnimatedButton = styled(Button)(({ theme, variant = 'contained' }) => ({
  borderRadius: 25,
  padding: theme.spacing(1.5, 4),
  fontWeight: 700,
  fontSize: '1rem',
  textTransform: 'none',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease-in-out',
  background: variant === 'contained' 
    ? `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`
    : 'transparent',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: `0 12px 25px ${alpha(theme.palette.secondary.main, 0.5)}`,
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${alpha('#fff', 0.3)}, transparent)`,
    transition: 'left 0.5s',
  },
  '&:hover::before': {
    left: '100%',
  },
}));

const PremiumJobCard = styled(GlassCard)(({ theme, featured, urgent }) => ({
  position: 'relative',
  background: featured 
    ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.1)})`
    : theme.palette.background.paper,
  border: featured 
    ? `2px solid ${theme.palette.secondary.main}`
    : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '&::after': urgent ? {
    content: '"URGENT"',
    position: 'absolute',
    top: 15,
    right: -30,
    background: theme.palette.error.main,
    color: 'white',
    padding: '5px 40px',
    fontSize: '0.7rem',
    fontWeight: 700,
    transform: 'rotate(45deg)',
    letterSpacing: '1px',
  } : {},
}));

// Sample enhanced data with more creative elements
const enhancedSampleJobs = [
  {
    id: 'featured-1',
    title: '🏠 Modern Smart Home Complete Renovation',
    description: 'Transform this beautiful 4-bedroom home into a cutting-edge smart residence. Includes IoT integration, automated lighting, security systems, and sustainable energy solutions.',
    budget: { min: 45000, max: 75000, currency: 'USD' },
    location: 'Beverly Hills, CA',
    jobType: 'contract',
    experience: 'expert',
    skills: ['Smart Home Tech', 'Electrical', 'Plumbing', 'HVAC', 'Security'],
    urgency: 'high',
    postedDate: '2024-01-20',
    applicants: 23,
    views: 1250,
    featured: true,
    premium: true,
    client: {
      name: 'Tesla Energy Solutions',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
      rating: 4.9,
      jobsPosted: 15,
      verified: true,
      companyType: 'Technology',
    },
    estimatedDuration: '3-4 months',
    benefits: ['Health Insurance', 'Performance Bonus', 'Tool Allowance'],
    tags: ['High-Tech', 'Sustainable', 'Premium Project'],
    requirements: ['10+ years experience', 'Smart home certifications', 'Portfolio required'],
  },
  {
    id: 'trending-1',
    title: '⚡ Commercial Solar Installation Project',
    description: 'Install state-of-the-art solar panel system for a 50,000 sq ft manufacturing facility. Includes battery storage and grid integration.',
    budget: { min: 85000, max: 120000, currency: 'USD' },
    location: 'Austin, TX',
    jobType: 'contract',
    experience: 'senior',
    skills: ['Solar Installation', 'Electrical', 'Project Management'],
    urgency: 'medium',
    postedDate: '2024-01-19',
    applicants: 18,
    views: 890,
    trending: true,
    client: {
      name: 'GreenTech Industries',
      avatar: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
      rating: 4.8,
      jobsPosted: 8,
      verified: true,
      companyType: 'Clean Energy',
    },
    estimatedDuration: '6-8 weeks',
    benefits: ['Travel Allowance', 'Certification Bonus'],
    tags: ['Green Energy', 'Commercial', 'High-Impact'],
  },
  {
    id: 'creative-1',
    title: '🎨 Luxury Spa & Wellness Center Design Build',
    description: 'Create an zen-inspired wellness sanctuary with custom water features, meditation spaces, and therapeutic environments.',
    budget: { min: 35000, max: 55000, currency: 'USD' },
    location: 'Sedona, AZ',
    jobType: 'full-time',
    experience: 'mid',
    skills: ['Interior Design', 'Plumbing', 'Carpentry', 'Lighting'],
    urgency: 'low',
    postedDate: '2024-01-18',
    applicants: 31,
    views: 2100,
    artistic: true,
    client: {
      name: 'Zen Wellness Group',
      avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=400',
      rating: 4.7,
      jobsPosted: 12,
      verified: true,
      companyType: 'Wellness',
    },
    estimatedDuration: '10-12 weeks',
    benefits: ['Wellness Package', 'Creative Freedom'],
    tags: ['Artistic', 'Wellness', 'Custom Design'],
  },
];

const categoryData = [
  { name: 'Electrical', icon: <ElectricalIcon />, count: 1247, color: '#FFD700', trending: true },
  { name: 'Plumbing', icon: <PlumbingIcon />, count: 892, color: '#4A90E2', hot: true },
  { name: 'Construction', icon: <ConstructionIcon />, count: 2156, color: '#E74C3C' },
  { name: 'HVAC', icon: <HvacIcon />, count: 674, color: '#2ECC71' },
  { name: 'Carpentry', icon: <CarpenterIcon />, count: 1089, color: '#8B4513', premium: true },
  { name: 'Smart Home', icon: <HomeIcon />, count: 445, color: '#9B59B6', newest: true },
  { name: 'Solar Energy', icon: <WhatshotIcon />, count: 231, color: '#F39C12', growing: true },
  { name: 'Design', icon: <PsychologyIcon />, count: 678, color: '#E67E22' },
];

const platformMetrics = [
  { 
    icon: <WorkIcon sx={{ fontSize: 40 }} />, 
    value: '50,000+', 
    label: 'Active Jobs',
    subtitle: 'Updated daily',
    color: '#FFD700',
    trend: '+12%'
  },
  { 
    icon: <CheckCircle sx={{ fontSize: 40 }} />, 
    value: '98.5%', 
    label: 'Success Rate',
    subtitle: 'Completed projects',
    color: '#2ECC71',
    trend: '+2.1%'
  },
  { 
    icon: <Group sx={{ fontSize: 40 }} />, 
    value: '125K+', 
    label: 'Professionals',
    subtitle: 'Verified experts',
    color: '#3498DB',
    trend: '+8%'
  },
  { 
    icon: <Star sx={{ fontSize: 40 }} />, 
    value: '4.9/5', 
    label: 'Platform Rating',
    subtitle: 'Client satisfaction',
    color: '#E74C3C',
    trend: '+0.2'
  },
];

const JobsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  // Redux state
  const filters = useSelector(selectJobFilters) || {};
  const { currentPage = 1, totalPages = 0 } = useSelector(selectJobsPagination) || {};
  const jobs = useSelector(selectJobs) || [];
  const loading = useSelector(selectJobsLoading) || false;
  const error = useSelector(selectJobsError);

  // Local state
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [showSampleData, setShowSampleData] = useState(true);
  const [savedJobs, setSavedJobs] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [sortBy, setSortBy] = useState('relevance');
  const [onlyRemote, setOnlyRemote] = useState(false);
  const [onlyUrgent, setOnlyUrgent] = useState(false);
  const [filterDialog, setFilterDialog] = useState(false);
  const [mapView, setMapView] = useState(false);
  
  const heroRef = useRef(null);

  const handleSearch = () => {
    const newFilters = {
      ...filters,
      page: 1,
      search: searchQuery.trim(),
      category: selectedCategory,
      minBudget: priceRange[0],
      maxBudget: priceRange[1],
      sortBy,
      remote: onlyRemote,
      urgent: onlyUrgent,
    };
    dispatch(setFilters(newFilters));
    dispatch(fetchJobs(newFilters));
    setShowSampleData(false);
  };

  const handlePageChange = (event, value) => {
    const newFilters = { ...filters, page: value };
    dispatch(setFilters(newFilters));
    dispatch(fetchJobs(newFilters));
    setShowSampleData(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setPriceRange([0, 100000]);
    setSortBy('relevance');
    setOnlyRemote(false);
    setOnlyUrgent(false);
    setShowSampleData(true);
  };

  const toggleSaveJob = (jobId) => {
    setSavedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const renderHeroSection = () => (
    <HeroSection ref={heroRef}>
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                  fontWeight: 900,
                  mb: 3,
                  background: 'linear-gradient(135deg, #FFD700, #FFA500, #FF6B6B)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                }}
              >
                Find Your Dream Job
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2rem' },
                  fontWeight: 400,
                  mb: 4,
                  opacity: 0.9,
                  lineHeight: 1.4,
                }}
              >
                🚀 Discover amazing opportunities in skilled trades
                <br />
                🌟 Connect with top employers across the globe
              </Typography>
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
                <AnimatedButton
                  size="large"
                  startIcon={<SearchIcon />}
                  onClick={() => window.scrollTo({ 
                    top: heroRef.current?.offsetHeight || 500, 
                    behavior: 'smooth' 
                  })}
                >
                  Start Job Search
                </AnimatedButton>
                <AnimatedButton
                  variant="outlined"
                  size="large"
                  startIcon={<WorkspacePremium />}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': {
                      borderColor: theme.palette.secondary.main,
                      backgroundColor: alpha('#ffffff', 0.1),
                    },
                  }}
                  onClick={() => navigate('/register?type=worker')}
                >
                  Join as Professional
                </AnimatedButton>
              </Stack>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Grid container spacing={2}>
                {platformMetrics.map((metric, index) => (
                  <Grid item xs={6} key={index}>
                    <StatCard
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <Box sx={{ color: metric.color, mb: 1 }}>
                        {metric.icon}
                      </Box>
                      <Typography variant="h3" fontWeight={900} sx={{ color: metric.color }}>
                        {metric.value}
                      </Typography>
                      <Typography variant="h6" fontWeight={600} color="white">
                        {metric.label}
                      </Typography>
                      <Typography variant="body2" color="rgba(255,255,255,0.8)">
                        {metric.subtitle}
                      </Typography>
                      <Chip
                        label={`${metric.trend} this month`}
                        size="small"
                        sx={{
                          mt: 1,
                          bgcolor: alpha('#ffffff', 0.2),
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    </StatCard>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </HeroSection>
  );

  const renderSearchInterface = () => (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <FloatingSearchBar elevation={8}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search jobs, skills, companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: theme.palette.secondary.main }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 3,
                  '& fieldset': { border: 'none' },
                  bgcolor: alpha(theme.palette.background.default, 0.5),
                },
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                displayEmpty
                sx={{
                  borderRadius: 3,
                  '& fieldset': { border: 'none' },
                  bgcolor: alpha(theme.palette.background.default, 0.5),
                }}
              >
                <MenuItem value="relevance">Most Relevant</MenuItem>
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="salary_high">Highest Salary</MenuItem>
                <MenuItem value="salary_low">Lowest Salary</MenuItem>
                <MenuItem value="deadline">Deadline Soon</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Stack direction="row" spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={onlyRemote}
                    onChange={(e) => setOnlyRemote(e.target.checked)}
                    color="secondary"
                  />
                }
                label="Remote Only"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={onlyUrgent}
                    onChange={(e) => setOnlyUrgent(e.target.checked)}
                    color="error"
                  />
                }
                label="Urgent"
              />
            </Stack>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Stack direction="row" spacing={1}>
              <AnimatedButton
                variant="contained"
                onClick={handleSearch}
                fullWidth
                startIcon={<SearchIcon />}
              >
                Search Jobs
              </AnimatedButton>
              
              <Tooltip title="Advanced Filters">
                <IconButton
                  onClick={() => setFilterDialog(true)}
                  sx={{
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    color: theme.palette.secondary.main,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.secondary.main, 0.2),
                    },
                  }}
                >
                  <FilterAltIcon />
                </IconButton>
              </Tooltip>
              
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newView) => newView && setViewMode(newView)}
                size="small"
              >
                <ToggleButton value="grid">
                  <ViewModuleIcon />
                </ToggleButton>
                <ToggleButton value="list">
                  <ViewListIcon />
                </ToggleButton>
                <ToggleButton value="map">
                  <MapIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Grid>
        </Grid>
      </FloatingSearchBar>
    </Container>
  );

  const renderCategories = () => (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography
        variant="h3"
        fontWeight={700}
        textAlign="center"
        sx={{ mb: 4, color: theme.palette.secondary.main }}
      >
        🎯 Explore Job Categories
      </Typography>
      
      <Grid container spacing={2} justifyContent="center">
        {categoryData.map((category, index) => (
          <Grid item key={category.name}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <CategoryChip
                icon={React.cloneElement(category.icon, { 
                  sx: { color: category.color } 
                })}
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {category.name}
                    </Typography>
                    <Typography variant="caption">
                      {category.count.toLocaleString()} jobs
                    </Typography>
                    {category.trending && (
                      <Chip 
                        label="🔥" 
                        size="small" 
                        sx={{ ml: 0.5, height: 16 }} 
                      />
                    )}
                    {category.hot && (
                      <Chip 
                        label="💎" 
                        size="small" 
                        sx={{ ml: 0.5, height: 16 }} 
                      />
                    )}
                    {category.newest && (
                      <Chip 
                        label="✨" 
                        size="small" 
                        sx={{ ml: 0.5, height: 16 }} 
                      />
                    )}
                  </Box>
                }
                selected={selectedCategory === category.name}
                onClick={() => handleCategorySelect(category.name)}
                sx={{
                  height: 'auto',
                  p: 1.5,
                  '& .MuiChip-label': { display: 'block', p: 0 },
                }}
              />
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Container>
  );

  const renderFeaturedJobs = () => (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography
          variant="h2"
          fontWeight={900}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
          }}
        >
          🌟 Featured Opportunities
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
          Hand-picked premium jobs from top employers
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {enhancedSampleJobs.map((job, index) => (
          <Grid item xs={12} lg={4} key={job.id}>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <PremiumJobCard
                featured={job.featured}
                urgent={job.urgency === 'high'}
                elevation={job.featured ? 12 : 4}
              >
                {job.featured && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bgcolor: theme.palette.secondary.main,
                      color: 'white',
                      textAlign: 'center',
                      py: 0.5,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      letterSpacing: 1,
                    }}
                  >
                    ⭐ FEATURED OPPORTUNITY ⭐
                  </Box>
                )}

                <CardContent sx={{ p: 3, pt: job.featured ? 5 : 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                    <Avatar
                      src={job.client.avatar}
                      sx={{
                        width: 60,
                        height: 60,
                        mr: 2,
                        border: `3px solid ${theme.palette.secondary.main}`,
                      }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h5" fontWeight={700} gutterBottom>
                        {job.title}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          by {job.client.name}
                        </Typography>
                        {job.client.verified && (
                          <Verified sx={{ fontSize: 16, color: theme.palette.secondary.main }} />
                        )}
                      </Stack>
                    </Box>
                  </Box>

                  <Typography
                    variant="body1"
                    sx={{
                      mb: 3,
                      lineHeight: 1.6,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {job.description}
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
                      {job.skills.slice(0, 3).map((skill) => (
                        <Chip
                          key={skill}
                          label={skill}
                          size="small"
                          sx={{
                            bgcolor: alpha(theme.palette.secondary.main, 0.1),
                            color: theme.palette.secondary.main,
                            fontWeight: 600,
                          }}
                        />
                      ))}
                      {job.skills.length > 3 && (
                        <Chip
                          label={`+${job.skills.length - 3} more`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight={700} color="secondary.main">
                          ${job.budget.min.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Starting Budget
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight={600}>
                          {job.applicants}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Applicants
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <LocationOn fontSize="small" color="secondary" />
                    <Typography variant="body2">{job.location}</Typography>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <Schedule fontSize="small" color="secondary" />
                    <Typography variant="body2">{job.estimatedDuration}</Typography>
                  </Stack>

                  {job.tags && (
                    <Stack direction="row" spacing={0.5} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
                      {job.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      ))}
                    </Stack>
                  )}
                </CardContent>

                <CardActions sx={{ p: 3, pt: 0 }}>
                  <Stack direction="row" spacing={1} width="100%">
                    <AnimatedButton
                      variant="contained"
                      fullWidth
                      startIcon={<Visibility />}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      View Details
                    </AnimatedButton>
                    <IconButton
                      onClick={() => toggleSaveJob(job.id)}
                      sx={{
                        color: savedJobs.includes(job.id)
                          ? theme.palette.secondary.main
                          : theme.palette.text.secondary,
                      }}
                    >
                      {savedJobs.includes(job.id) ? <Bookmark /> : <BookmarkBorder />}
                    </IconButton>
                    <IconButton color="primary">
                      <Share />
                    </IconButton>
                  </Stack>
                </CardActions>
              </PremiumJobCard>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Container>
  );

  return (
    <>
      <Helmet>
        <title>Find Your Dream Job - Professional Opportunities | Kelmah</title>
        <meta name="description" content="Discover amazing job opportunities in skilled trades. Connect with top employers and advance your career with Kelmah's professional job marketplace." />
      </Helmet>

      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {renderHeroSection()}
        {renderSearchInterface()}
        {renderCategories()}
        
        {loading ? (
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <Grid container spacing={3}>
              {Array.from(new Array(6)).map((_, idx) => (
                <Grid item xs={12} sm={6} lg={4} key={idx}>
                  <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
                </Grid>
              ))}
            </Grid>
          </Container>
        ) : showSampleData ? (
          renderFeaturedJobs()
        ) : (
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
              Search Results ({jobs.length} jobs found)
            </Typography>
            <Grid container spacing={3}>
              {jobs.map((job) => (
                <Grid item xs={12} sm={6} lg={4} key={job.id}>
                  <JobCard job={job} />
                </Grid>
              ))}
            </Grid>
            
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="secondary"
                  size="large"
                />
              </Box>
            )}
          </Container>
        )}

        {/* Advanced Filters Dialog */}
        <Dialog
          open={filterDialog}
          onClose={() => setFilterDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 }
          }}
        >
          <DialogTitle>
            <Typography variant="h5" fontWeight={700}>
              Advanced Job Filters
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography gutterBottom>Budget Range</Typography>
                <Slider
                  value={priceRange}
                  onChange={(e, newValue) => setPriceRange(newValue)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={200000}
                  step={1000}
                  marks={[
                    { value: 0, label: '$0' },
                    { value: 50000, label: '$50K' },
                    { value: 100000, label: '$100K' },
                    { value: 200000, label: '$200K+' },
                  ]}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Experience Level</InputLabel>
                  <Select defaultValue="">
                    <MenuItem value="">All Levels</MenuItem>
                    <MenuItem value="entry">Entry Level</MenuItem>
                    <MenuItem value="mid">Mid Level</MenuItem>
                    <MenuItem value="senior">Senior Level</MenuItem>
                    <MenuItem value="expert">Expert Level</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Job Type</InputLabel>
                  <Select defaultValue="">
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="full-time">Full Time</MenuItem>
                    <MenuItem value="part-time">Part Time</MenuItem>
                    <MenuItem value="contract">Contract</MenuItem>
                    <MenuItem value="freelance">Freelance</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={clearFilters} startIcon={<Clear />}>
              Clear All
            </Button>
            <AnimatedButton
              onClick={() => {
                handleSearch();
                setFilterDialog(false);
              }}
              startIcon={<SearchIcon />}
            >
              Apply Filters
            </AnimatedButton>
          </DialogActions>
        </Dialog>

        {/* Floating Action Buttons */}
        <SpeedDial
          ariaLabel="Quick Actions"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
        >
          <SpeedDialAction
            icon={<RefreshIcon />}
            tooltipTitle="Refresh Jobs"
            onClick={handleSearch}
          />
          <SpeedDialAction
            icon={<BookmarkBorder />}
            tooltipTitle="Saved Jobs"
            onClick={() => navigate('/jobs/saved')}
          />
          <SpeedDialAction
            icon={<NotificationsActiveIcon />}
            tooltipTitle="Job Alerts"
            onClick={() => navigate('/job-alerts')}
          />
        </SpeedDial>
      </Box>
    </>
  );
};

export default JobsPage;
