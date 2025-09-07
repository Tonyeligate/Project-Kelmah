import React, { useEffect, useState, useRef, useCallback } from 'react';
import jobsApi from '../services/jobsApi';
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
  CardMedia,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Breadcrumbs,
  Link,
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
  ShowChart as TimelineIcon,
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
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon,
  StarBorder as StarBorderIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as LanguageIcon,
  Public as PublicIcon,
  Explore as ExploreIcon,
  Rocket as RocketIcon,
  Diamond as DiamondIcon,
  LocalFireDepartment as FireIcon,
  Bolt as BoltIcon,
  AutoGraph as GraphIcon,
  Psychology as BrainIcon,
  Architecture as ArchitectureIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { styled, keyframes } from '@mui/material/styles';
import { format, formatDistanceToNow } from 'date-fns';
import { Helmet } from 'react-helmet-async';
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
import { useAuthCheck } from '../../../hooks/useAuthCheck';

// Advanced Animations with Smooth Transitions
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-10px) rotate(1deg); }
  50% { transform: translateY(-15px) rotate(0deg); }
  75% { transform: translateY(-10px) rotate(-1deg); }
`;

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7); }
  50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(212, 175, 55, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
`;

const slideInFromBottom = keyframes`
  from { transform: translateY(100px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const sparkle = keyframes`
  0%, 100% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1); }
`;

const rotateGlow = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Professional Styled Components with Premium Feel
const HeroSection = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${theme.palette.primary.main} 0%, 
    ${theme.palette.secondary.main} 25%,
    ${theme.palette.primary.dark} 50%,
    ${theme.palette.secondary.main} 75%,
    ${theme.palette.primary.main} 100%)`,
  backgroundSize: '400% 400%',
  // animation: `${gradientShift} 15s ease infinite`,
  color: 'white',
  padding: theme.spacing(12, 0),
  position: 'relative',
  overflow: 'hidden',
  minHeight: '85vh',
  display: 'flex',
  alignItems: 'center',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(circle at 20% 80%, ${alpha('#FFD700', 0.3)} 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, ${alpha('#FFA500', 0.3)} 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, ${alpha('#FF6B6B', 0.2)} 0%, transparent 50%)`,
    // animation: `${float} 20s ease-in-out infinite`,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${alpha('#FFD700', 0.1)} 60deg, transparent 120deg)`,
    animation: `${rotateGlow} 30s linear infinite`,
  },
}));

const categoryData = [
  { 
    name: 'Electrical', 
    icon: <ElectricalIcon />, 
    count: 15420, 
    color: '#FFD700', 
    trending: true,
    description: 'Smart systems, renewable energy & power solutions',
    growth: '+23%',
    avgSalary: '$75,000',
    demandLevel: 'Very High'
  },
  { 
    name: 'Plumbing', 
    icon: <PlumbingIcon />, 
    count: 12890, 
    color: '#4A90E2', 
    hot: true,
    description: 'Water systems, emergency repairs & green solutions',
    growth: '+18%',
    avgSalary: '$68,000',
    demandLevel: 'High'
  },
  { 
    name: 'Construction', 
    icon: <ConstructionIcon />, 
    count: 28560, 
    color: '#E74C3C',
    description: 'Building, renovation & infrastructure projects',
    growth: '+15%',
    avgSalary: '$72,000',
    demandLevel: 'Very High'
  },
  { 
    name: 'HVAC', 
    icon: <HvacIcon />, 
    count: 9340, 
    color: '#2ECC71',
    description: 'Climate control, energy efficiency & smart systems',
    growth: '+20%',
    avgSalary: '$70,000',
    demandLevel: 'High'
  },
  { 
    name: 'Carpentry', 
    icon: <CarpenterIcon />, 
    count: 14230, 
    color: '#8B4513', 
    premium: true,
    description: 'Custom woodwork, furniture & architectural details',
    growth: '+12%',
    avgSalary: '$65,000',
    demandLevel: 'Moderate'
  },
  { 
    name: 'Smart Home', 
    icon: <HomeIcon />, 
    count: 6780, 
    color: '#9B59B6', 
    newest: true,
    description: 'IoT integration, automation & tech installation',
    growth: '+45%',
    avgSalary: '$85,000',
    demandLevel: 'Explosive'
  },
  { 
    name: 'Solar Energy', 
    icon: <WhatshotIcon />, 
    count: 4560, 
    color: '#F39C12', 
    trending: true,
    description: 'Solar installation, battery systems & green tech',
    growth: '+38%',
    avgSalary: '$78,000',
    demandLevel: 'Very High'
  },
  { 
    name: 'Design', 
    icon: <PsychologyIcon />, 
    count: 8920, 
    color: '#E67E22',
    description: 'Interior design, space planning & creative solutions',
    growth: '+16%',
    avgSalary: '$62,000',
    demandLevel: 'High'
  },
];

const platformMetrics = [
  { 
    icon: <WorkIcon sx={{ fontSize: 56 }} />, 
    value: '125,000+', 
    label: 'Active Opportunities',
    subtitle: 'Updated every minute',
    color: '#FFD700',
    trend: '+18% this month',
    description: 'From entry-level to executive positions',
    animation: pulse,
  },
  { 
    icon: <CheckCircle sx={{ fontSize: 56 }} />, 
    value: '99.2%', 
    label: 'Success Rate',
    subtitle: 'Completed projects',
    color: '#2ECC71',
    trend: '+2.3% improvement',
    description: 'Industry-leading completion rate',
    animation: float,
  },
  { 
    icon: <Group sx={{ fontSize: 56 }} />, 
    value: '450K+', 
    label: 'Skilled Professionals',
    subtitle: 'Verified experts worldwide',
    color: '#3498DB',
    trend: '+12% growth',
    description: 'Background-checked talent pool',
    animation: shimmer,
  },
  { 
    icon: <Star sx={{ fontSize: 56 }} />, 
    value: '4.95/5', 
    label: 'Platform Rating',
    subtitle: 'Client satisfaction score',
    color: '#E74C3C',
    trend: '+0.05 this quarter',
    description: 'Consistently excellent reviews',
    animation: sparkle,
  },
  { 
    icon: <AttachMoneyIcon sx={{ fontSize: 56 }} />, 
    value: '$2.8B+', 
    label: 'Total Earnings',
    subtitle: 'Paid to professionals',
    color: '#9C27B0',
    trend: '+34% annually',
    description: 'Life-changing income opportunities',
    animation: rotateGlow,
  },
  { 
    icon: <TrendingUpIcon sx={{ fontSize: 56 }} />, 
    value: '156%', 
    label: 'Career Growth',
    subtitle: 'Average salary increase',
    color: '#FF5722',
    trend: 'Year over year',
    description: 'Accelerated professional development',
    animation: gradientShift,
  },
];

const JobsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const authState = useAuthCheck();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [budgetRange, setBudgetRange] = useState([500, 10000]);
  const [showFilters, setShowFilters] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Helper function to get category icon
  const getCategoryIcon = (category) => {
    const iconMap = {
      'Electrical': ElectricalIcon,
      'Plumbing': PlumbingIcon,
      'Carpentry': CarpenterIcon,
      'HVAC': HvacIcon,
      'Construction': ConstructionIcon,
      'Painting': PaintIcon,
      'General': WorkIcon
    };
    return iconMap[category] || WorkIcon;
  };

  // Fetch jobs from API
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching jobs from API...');
        
        const response = await jobsApi.getJobs({
          status: 'open',
          limit: 50
        });
        
        console.log('📊 API Response:', response);
        
        if (response && response.data) {
          console.log('✅ Jobs loaded from API:', response.data.length);
          setJobs(response.data);
        } else if (response && Array.isArray(response)) {
          console.log('✅ Jobs loaded from API (array):', response.length);
          setJobs(response);
        } else {
          console.warn('⚠️ No jobs data in response');
          setJobs([]);
        }
        setError(null);
      } catch (err) {
        console.error('❌ Error fetching jobs:', err);
        console.error('❌ Error details:', {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data
        });
        setError(`Failed to load jobs: ${err.message}`);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobs();
  }, []);
  
  // Error boundary component for better error handling
  const ErrorBoundary = ({ children, fallback }) => {
    const [hasError, setHasError] = useState(false);
    
    useEffect(() => {
      const handleError = (error) => {
        console.error('JobsPage Error:', error);
        setHasError(true);
      };
      
      window.addEventListener('error', handleError);
      return () => window.removeEventListener('error', handleError);
    }, []);
    
    if (hasError) {
      return fallback || (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" sx={{ color: '#fff', mb: 2 }}>
            Something went wrong
          </Typography>
          <Typography variant="body1" sx={{ color: '#ccc', mb: 3 }}>
            We're having trouble loading jobs. Please try refreshing the page.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
            sx={{ bgcolor: '#D4AF37', color: 'black' }}
          >
            Refresh Page
          </Button>
        </Box>
      );
    }
    
    return children;
  };

  const tradeCategories = [
    { value: '', label: 'All Trades', icon: WorkIcon },
    { value: 'Electrical', label: 'Electrical Work', icon: ElectricalIcon },
    { value: 'Plumbing', label: 'Plumbing Services', icon: PlumbingIcon },
    { value: 'Carpentry', label: 'Carpentry & Woodwork', icon: CarpenterIcon },
    { value: 'HVAC', label: 'HVAC & Climate Control', icon: HvacIcon },
    { value: 'Construction', label: 'Construction & Building', icon: ConstructionIcon },
    { value: 'Painting', label: 'Painting & Decoration', icon: PaintIcon },
    { value: 'Roofing', label: 'Roofing Services', icon: RoofingIcon },
    { value: 'Masonry', label: 'Masonry & Stonework', icon: BuildIcon }
  ];

  const ghanaLocations = [
    { value: '', label: 'All Locations' },
    { value: 'Accra', label: 'Accra, Greater Accra' },
    { value: 'Kumasi', label: 'Kumasi, Ashanti Region' },
    { value: 'Tema', label: 'Tema, Greater Accra' },
    { value: 'Takoradi', label: 'Takoradi, Western Region' },
    { value: 'Cape Coast', label: 'Cape Coast, Central Region' },
    { value: 'Tamale', label: 'Tamale, Northern Region' },
    { value: 'Ho', label: 'Ho, Volta Region' },
    { value: 'Koforidua', label: 'Koforidua, Eastern Region' }
  ];

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchQuery || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.company && job.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (job.skills && job.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesCategory = !selectedCategory || job.category === selectedCategory;
    const matchesLocation = !selectedLocation || 
      (job.location && job.location.includes(selectedLocation)) ||
      (job.location?.city && job.location.city.includes(selectedLocation));
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  return (
    <ErrorBoundary>
    <Box sx={{ bgcolor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
      <Container maxWidth="xl" sx={{ py: 0, pt: 1 }}>
        <Helmet>
          <title>Find Skilled Trade Jobs - Kelmah | Ghana's Premier Job Platform</title>
          <meta name="description" content="Discover high-paying skilled trade opportunities across Ghana. Connect with top employers in electrical, plumbing, carpentry, HVAC, and construction." />
        </Helmet>
        
        {/* Hero Section & Filter System - Directly Below Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ mb: 4, mt: 0 }}> {/* Minimal spacing from header */}
            <Grid container spacing={{ xs: 2, md: 3 }} alignItems="center">
              {/* Left Side - Hero Text */}
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                <Typography
                    variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #D4AF37 30%, #FFD700 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                      mb: 1,
                      fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem', lg: '2.25rem' },
                      lineHeight: { xs: 1.2, md: 1.3 }
              }}
            >
              {isSmallMobile ? 'Find Trade Jobs' : 'Find Your Next Trade Opportunity'}
            </Typography>
            <Typography 
                    variant="h6" 
              sx={{ 
                color: 'rgba(255,255,255,0.8)', 
                      fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                      lineHeight: { xs: 1.4, md: 1.5 },
                      maxWidth: { xs: '100%', md: '90%' }
              }}
            >
              {isSmallMobile 
                ? 'Connect with top employers in Ghana'
                : 'Connect with Ghana\'s top employers and advance your skilled trades career'
              }
                </Typography>
                </Box>
              </Grid>

              {/* Right Side - Expanded Filter System */}
              <Grid item xs={12} md={8}>
            <Paper 
              elevation={8}
              sx={{ 
                    p: 2, 
                bgcolor: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(212,175,55,0.2)',
                    borderRadius: 2
              }}
            >
              <Grid container spacing={{ xs: 1.5, sm: 2 }} alignItems="center">
                    <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                        size={isSmallMobile ? "medium" : "small"}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isSmallMobile ? "Search jobs..." : "Search jobs, skills, companies..."}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        minHeight: { xs: '48px', sm: '40px' },
                        '& fieldset': {
                          borderColor: 'rgba(212,175,55,0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: '#D4AF37',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#D4AF37',
                        },
                      },
                      '& .MuiInputBase-input': {
                        fontSize: { xs: '0.9rem', sm: '0.875rem' },
                        '&::placeholder': {
                          color: 'rgba(255,255,255,0.6)',
                          opacity: 1,
                        },
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                              <SearchIcon sx={{ color: '#D4AF37', fontSize: { xs: '1.2rem', sm: '1rem' } }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                    <Grid item xs={12} sm={2.5}>
                      <FormControl fullWidth size="small">
                        <InputLabel 
                          shrink
                          sx={{ 
                            color: 'rgba(255,255,255,0.7)', 
                            fontSize: '0.75rem',
                            transform: 'translate(14px, -9px) scale(0.85)',
                            '&.Mui-focused': {
                              color: '#D4AF37',
                            }
                          }}
                        >
                          Trade Category
                        </InputLabel>
                  <Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      displayEmpty
                      sx={{
                        color: 'white',
                            fontSize: '0.875rem',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(212,175,55,0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#D4AF37',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#D4AF37',
                        },
                        '& .MuiSvgIcon-root': {
                          color: '#D4AF37',
                        },
                      }}
                    >
                      {tradeCategories.map((category) => (
                        <MenuItem key={category.value} value={category.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <category.icon sx={{ mr: 1, color: '#D4AF37', fontSize: 18 }} />
                                <Typography variant="body2">{category.label}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                    <Grid item xs={12} sm={2.5}>
                      <FormControl fullWidth size="small">
                        <InputLabel 
                          shrink
                          sx={{ 
                            color: 'rgba(255,255,255,0.7)', 
                            fontSize: '0.75rem',
                            transform: 'translate(14px, -9px) scale(0.85)',
                            '&.Mui-focused': {
                              color: '#D4AF37',
                            }
                          }}
                        >
                          Location
                        </InputLabel>
                        <Select
                          value={selectedLocation}
                          onChange={(e) => setSelectedLocation(e.target.value)}
                          displayEmpty
                          sx={{
                            color: 'white',
                            fontSize: '0.875rem',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(212,175,55,0.3)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#D4AF37',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#D4AF37',
                            },
                            '& .MuiSvgIcon-root': {
                              color: '#D4AF37',
                            },
                          }}
                        >
                          {ghanaLocations.map((location) => (
                            <MenuItem key={location.value} value={location.value}>
                              <Typography variant="body2">{location.label}</Typography>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={1}>
                    <Button
                      fullWidth
                      variant="contained"
                        size="small"
                    startIcon={<SearchIcon />}
                    onClick={() => {
                      console.log('🔍 Search button clicked!');
                      console.log('Search params:', { searchQuery, selectedCategory, selectedLocation, budgetRange });
                    }}
                      sx={{
                      bgcolor: '#D4AF37',
                      color: 'black',
                      fontWeight: 'bold',
                          fontSize: '0.875rem',
                        '&:hover': {
                        bgcolor: '#B8941F',
                      },
                    }}
                  >
                        Search
                  </Button>
                </Grid>
              </Grid>
              
                  {/* Advanced Filters Toggle - Compact */}
                  <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Button
                  startIcon={<FilterListIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                      size="small"
                      sx={{ 
                        color: '#D4AF37',
                        fontSize: '0.75rem',
                        '&:hover': {
                          bgcolor: 'rgba(212,175,55,0.1)',
                        }
                      }}
                    >
                      {showFilters ? 'Hide' : 'Show'} Filters
                    </Button>
                  </Box>
              
                  {/* Advanced Filters - Compact */}
              <Collapse in={showFilters}>
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(212,175,55,0.2)' }}>
                  <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" sx={{ mb: 1, color: '#D4AF37', fontWeight: 'bold' }}>
                        Salary Range (GHS)
                      </Typography>
                      <Slider
                        value={budgetRange}
                        onChange={(e, newValue) => setBudgetRange(newValue)}
                        valueLabelDisplay="auto"
                        min={500}
                        max={10000}
                        step={100}
                            size="small"
                        sx={{
                          color: '#D4AF37',
                          '& .MuiSlider-thumb': {
                            bgcolor: '#D4AF37',
                          },
                          '& .MuiSlider-track': {
                            bgcolor: '#D4AF37',
                          },
                          '& .MuiSlider-rail': {
                            bgcolor: 'rgba(212,175,55,0.3)',
                          },
                        }}
                      />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                              GHS {budgetRange[0]}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                              GHS {budgetRange[1]}+
                            </Typography>
                      </Box>
                    </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" sx={{ mb: 1, color: '#D4AF37', fontWeight: 'bold' }}>
                        Quick Filters
                      </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        <Chip 
                              label="Urgent" 
                              size="small"
                          variant="outlined" 
                          sx={{ 
                            borderColor: '#D4AF37', 
                            color: '#D4AF37',
                                fontSize: '0.7rem',
                            '&:hover': { bgcolor: 'rgba(212,175,55,0.1)' }
                          }} 
                        />
                        <Chip 
                              label="Verified" 
                              size="small"
                          variant="outlined" 
                          sx={{ 
                            borderColor: '#D4AF37', 
                            color: '#D4AF37',
                                fontSize: '0.7rem',
                            '&:hover': { bgcolor: 'rgba(212,175,55,0.1)' }
                          }} 
                        />
                        <Chip 
                          label="Full-time" 
                              size="small"
                          variant="outlined" 
                          sx={{ 
                            borderColor: '#D4AF37', 
                            color: '#D4AF37',
                                fontSize: '0.7rem',
                                '&:hover': { bgcolor: 'rgba(212,175,55,0.1)' }
                              }} 
                            />
                            <Chip 
                              label="Contract" 
                              size="small"
                              variant="outlined" 
                              sx={{ 
                                borderColor: '#D4AF37', 
                                color: '#D4AF37',
                                fontSize: '0.7rem',
                            '&:hover': { bgcolor: 'rgba(212,175,55,0.1)' }
                          }} 
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Collapse>
              </Paper>
            </Grid>
                  </Grid>
          </Box>
        </motion.div>
        


        {/* Enhanced Jobs Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ color: '#D4AF37', fontWeight: 'bold' }}>
              Featured Opportunities
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip 
                label={`${filteredJobs.length} Jobs Found`} 
                  sx={{
                  bgcolor: 'rgba(212,175,55,0.2)', 
                  color: '#D4AF37',
                  fontWeight: 'bold'
                }} 
              />
            </Box>
          </Box>

          
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={60} sx={{ color: '#FFD700' }} />
              <Typography variant="h6" sx={{ ml: 2, color: '#fff' }}>
                Loading jobs...
              </Typography>
            </Box>
          )}
          
          {error && (
            <Box sx={{ py: 4 }}>
              <Alert severity="error" sx={{ bgcolor: '#2d1b1b', color: '#fff' }}>
                {error}
              </Alert>
            </Box>
          )}
          
          {!loading && !error && filteredJobs.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h5" sx={{ color: '#fff', mb: 2 }}>
                No jobs found
              </Typography>
              <Typography variant="body1" sx={{ color: '#ccc' }}>
                Try adjusting your search criteria or check back later.
              </Typography>
            </Box>
          )}
          
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {!loading && !error && filteredJobs.map((job, index) => (
              <Grid item xs={12} sm={6} md={6} lg={4} xl={3} key={job.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card 
                      sx={{
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      bgcolor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(212,175,55,0.2)',
                      borderRadius: { xs: 3, sm: 2 },
                      minHeight: { xs: '280px', sm: '320px' },
                      '&:hover': {
                        border: '1px solid #D4AF37',
                        boxShadow: '0 8px 32px rgba(212,175,55,0.3)',
                        transform: { xs: 'none', sm: 'translateY(-2px)' },
                      },
                      transition: 'all 0.3s ease-in-out'
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
                      {/* Job Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          {React.createElement(getCategoryIcon(job.category), { 
                            sx: { mr: 1, color: '#D4AF37', fontSize: { xs: 20, sm: 24 } } 
                          })}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                              variant="h6" 
                              component="h2" 
                              sx={{ 
                                color: 'white', 
                                fontWeight: 'bold',
                                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                                lineHeight: { xs: 1.3, sm: 1.4 },
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: { xs: 2, sm: 1 },
                                WebkitBoxOrient: 'vertical'
                              }}
                            >
                              {job.title}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {job.hirer?.name || 'Unknown Company'}
                            </Typography>
                          </Box>
                </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
                          {job.urgent && (
                            <Chip 
                              label="URGENT" 
                              size="small" 
                              sx={{ 
                                bgcolor: '#ff4444', 
                                color: 'white',
                                fontWeight: 'bold',
                                mb: 1
                              }} 
                            />
                          )}
                          {job.verified && (
                            <Chip 
                              icon={<Verified sx={{ fontSize: 16 }} />}
                              label="Verified" 
                              size="small" 
                              sx={{ 
                                bgcolor: 'rgba(76,175,80,0.2)', 
                                color: '#4CAF50',
                                border: '1px solid #4CAF50'
                              }} 
                            />
                          )}
                        </Box>
                      </Box>
                      
                      {/* Job Details */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationOn fontSize="small" sx={{ mr: 1, color: '#D4AF37' }} />
                          <Typography variant="body2" sx={{ color: 'white' }}>
                            {job.location?.city || job.location || 'Location not specified'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <MonetizationOn fontSize="small" sx={{ mr: 1, color: '#D4AF37' }} />
                          <Typography variant="body2" fontWeight="bold" sx={{ color: '#D4AF37' }}>
                            {job?.budget ? (
                              typeof job?.budget === 'object' ? (
                                job.budget.min === job.budget.max ? (
                                  `${job.budget.currency || 'GHS'} ${job.budget.amount?.toLocaleString() || 0}`
                                ) : (
                                  `${job.budget.currency || 'GHS'} ${job.budget.min?.toLocaleString() || 0} - ${job.budget.max?.toLocaleString() || 0}`
                                )
                              ) : (
                                `${job?.currency || 'GHS'} ${job?.budget?.toLocaleString()}`
                              )
                            ) : 'Budget not specified'}
                          </Typography>
                          <Chip 
                            label={job.paymentType || 'Fixed'} 
                            size="small" 
                            sx={{ 
                              ml: 1, 
                              bgcolor: 'rgba(212,175,55,0.2)', 
                              color: '#D4AF37' 
                            }} 
                />
              </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Star fontSize="small" sx={{ mr: 1, color: '#D4AF37' }} />
                          <Typography variant="body2" sx={{ color: 'white' }}>
                            {job.rating || '4.5'} Rating • {job.proposalCount || 0} Applicants
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255,255,255,0.8)' }}>
                        {job.description}
                      </Typography>
                      
                      {/* Skills */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1, color: '#D4AF37', fontWeight: 'bold' }}>
                          Required Skills:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {job.skills.slice(0, 3).map((skill, index) => (
                            <Chip
                              key={index}
                              label={skill}
                              size="small"
                              sx={{ 
                                bgcolor: 'rgba(255,255,255,0.1)',
                                color: 'white',
                                fontSize: '0.75rem'
                              }}
                            />
                          ))}
                          {job.skills.length > 3 && (
                            <Chip 
                              label={`+${job.skills.length - 3} more`} 
                              size="small" 
                              sx={{ 
                                bgcolor: 'rgba(212,175,55,0.2)',
                                color: '#D4AF37'
                              }} 
                            />
                          )}
                        </Box>
                      </Box>
                      
                      {/* Deadlines */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                          Posted {formatDistanceToNow(job.postedDate, { addSuffix: true })}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#ff6b6b' }}>
                          Apply by {format(job.deadline, 'MMM dd')}
                        </Typography>
                      </Box>
                    </CardContent>
                    
                    <CardActions sx={{ p: 3, pt: 0 }}>
                      <Button 
                        variant="contained" 
                        fullWidth
                        onClick={() => {
                          console.log('📝 Apply Now clicked for job:', job.id);
                          console.log('🔐 Auth state:', { 
                            isAuthenticated: authState.isAuthenticated, 
                            user: authState.user,
                            authState: authState 
                          });
                          
                          if (!authState.isAuthenticated) {
                            console.log('🔒 User not authenticated, redirecting to login');
                            navigate('/login', { 
                              state: { 
                                from: `/jobs/${job.id}/apply`,
                                message: 'Please sign in to apply for this job'
                              } 
                            });
                            return;
                          }
                          
                          console.log('🚀 Navigating to application form:', `/jobs/${job.id}/apply`);
                          navigate(`/jobs/${job.id}/apply`);
                        }}
                        sx={{
                          bgcolor: '#D4AF37',
                          color: 'black',
                          fontWeight: 'bold',
                          '&:hover': {
                            bgcolor: '#B8941F',
                          },
                        }}
                      >
                        Apply Now
                      </Button>
                      <IconButton 
                        onClick={() => {
                          console.log('🔍 View Details clicked for job:', job.id);
                          // Check if this is sample data (numeric ID) or real data (ObjectId)
                          if (typeof job.id === 'number') {
                            alert('This is sample data. Please ensure the API is connected to view real job details.');
                            return;
                          }
                          navigate(`/jobs/${job.id}`);
                        }}
                        sx={{ 
                          color: '#D4AF37',
                          '&:hover': { bgcolor: 'rgba(212,175,55,0.1)' }
                        }}
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton 
                        onClick={() => {
                          console.log('🔖 Bookmark clicked for job:', job.id);
                          if (!authState.isAuthenticated) {
                            navigate('/login', { 
                              state: { 
                                from: `/jobs/${job.id}`,
                                message: 'Please sign in to save jobs'
                              } 
                            });
                            return;
                          }
                          // TODO: Implement bookmark functionality
                          console.log('Bookmark functionality to be implemented');
                        }}
                        sx={{ 
                          color: '#D4AF37',
                          '&:hover': { bgcolor: 'rgba(212,175,55,0.1)' }
                        }}
                      >
                        <BookmarkBorder />
                      </IconButton>
                      <IconButton 
                        onClick={() => {
                          console.log('📤 Share clicked for job:', job.id);
                          if (navigator.share) {
                            navigator.share({
                              title: job.title,
                              text: `Check out this job opportunity: ${job.title} at ${job.company}`,
                              url: window.location.origin + `/jobs/${job.id}`
                            }).catch(err => console.log('Error sharing:', err));
                          } else {
                            // Fallback: copy to clipboard
                            navigator.clipboard.writeText(`${job.title} at ${job.company} - ${window.location.origin}/jobs/${job.id}`);
                            console.log('Job link copied to clipboard');
                          }
                        }}
                        sx={{ 
                          color: '#D4AF37',
                          '&:hover': { bgcolor: 'rgba(212,175,55,0.1)' }
                        }}
                      >
                        <Share />
                      </IconButton>
                    </CardActions>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
        
        {/* Load More Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Button 
              variant="outlined" 
              size="large" 
              startIcon={<RefreshIcon />}
              sx={{
                borderColor: '#D4AF37',
                color: '#D4AF37',
                px: 4,
                py: 1.5,
                '&:hover': {
                  borderColor: '#B8941F',
                  bgcolor: 'rgba(212,175,55,0.1)',
                },
              }}
            >
              Load More Opportunities
            </Button>
          </Box>
        </motion.div>
        
        {/* Stats Section - Moved to Bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Box sx={{ mt: 8, mb: 6 }}>
            <Typography variant="h4" sx={{ color: '#D4AF37', fontWeight: 'bold', textAlign: 'center', mb: 4 }}>
              Platform Statistics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={6} md={3}>
                <Paper 
                  sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(212,175,55,0.2)',
                    '&:hover': {
                      border: '1px solid #D4AF37',
                      boxShadow: '0 8px 32px rgba(212,175,55,0.2)',
                    },
                    transition: 'all 0.3s ease-in-out'
                  }}
                >
                  <Typography variant="h3" sx={{ color: '#D4AF37', fontWeight: 'bold', mb: 1 }}>
                    {filteredJobs.length}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 'medium' }}>
                    Available Jobs
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper 
                  sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(212,175,55,0.2)',
                    '&:hover': {
                      border: '1px solid #D4AF37',
                      boxShadow: '0 8px 32px rgba(212,175,55,0.2)',
                    },
                    transition: 'all 0.3s ease-in-out'
                  }}
                >
                  <Typography variant="h3" sx={{ color: '#D4AF37', fontWeight: 'bold', mb: 1 }}>
                    2,500+
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 'medium' }}>
                    Active Employers
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper 
                  sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(212,175,55,0.2)',
                    '&:hover': {
                      border: '1px solid #D4AF37',
                      boxShadow: '0 8px 32px rgba(212,175,55,0.2)',
                    },
                    transition: 'all 0.3s ease-in-out'
                  }}
                >
                  <Typography variant="h3" sx={{ color: '#D4AF37', fontWeight: 'bold', mb: 1 }}>
                    15K+
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 'medium' }}>
                    Skilled Workers
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper 
                  sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(212,175,55,0.2)',
                    '&:hover': {
                      border: '1px solid #D4AF37',
                      boxShadow: '0 8px 32px rgba(212,175,55,0.2)',
                    },
                    transition: 'all 0.3s ease-in-out'
                  }}
                >
                  <Typography variant="h3" sx={{ color: '#D4AF37', fontWeight: 'bold', mb: 1 }}>
                    98%
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 'medium' }}>
                    Success Rate
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </motion.div>
        
        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Paper
            sx={{
              mt: 4, 
              p: 4, 
              textAlign: 'center',
              bgcolor: 'rgba(212,175,55,0.1)',
              border: '1px solid rgba(212,175,55,0.3)'
            }}
          >
            <Typography variant="h4" sx={{ color: '#D4AF37', fontWeight: 'bold', mb: 2 }}>
              Ready to Take Your Career to the Next Level?
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 3, maxWidth: 600, mx: 'auto' }}>
              Join thousands of skilled professionals who've found their dream jobs through Kelmah. 
              Get personalized job recommendations and connect directly with employers.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                size="large"
                  sx={{
                  bgcolor: '#D4AF37',
                  color: 'black',
                  fontWeight: 'bold',
                  px: 4,
                    '&:hover': {
                    bgcolor: '#B8941F',
                    },
                  }}
                >
                Create Job Alert
                </Button>
                <Button
                variant="outlined" 
                size="large"
                  sx={{
                  borderColor: '#D4AF37',
                  color: '#D4AF37',
                  px: 4,
                    '&:hover': {
                    borderColor: '#B8941F',
                    bgcolor: 'rgba(212,175,55,0.1)',
                    },
                  }}
                >
                Upload CV
                </Button>
              </Box>
          </Paper>
        </motion.div>
      </Container>
        </Box>
      </ErrorBoundary>
  );
};

export default JobsPage;
