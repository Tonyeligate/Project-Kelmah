import React, { useEffect, useState, useRef } from 'react';
import {
  ToggleButton,
  ToggleButtonGroup,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  TextField,
  CircularProgress,
  Box,
  useTheme,
  Paper,
  Button,
  Stack,
  Avatar,
  Rating,
  Divider,
  alpha,
  IconButton,
  Tooltip,
  Badge,
  LinearProgress,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  InputAdornment,
  Skeleton,
  CardActions,
  Collapse,
  Fab,
  AvatarGroup,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Stepper,
  Step,
  StepLabel,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationOnIcon,
  Schedule as ScheduleIcon,
  MonetizationOn as MonetizationOnIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Group as GroupIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  Star as StarIcon,
  Verified as VerifiedIcon,
  AccessTime as AccessTimeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Tune as TuneIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Share as ShareIcon,
  Visibility as VisibilityIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  FlashOn as FlashOnIcon,
  Whatshot as WhatshotIcon,
  AutoAwesome as AutoAwesomeIcon,
  TrendingDown as TrendingDownIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Analytics as AnalyticsIcon,
  Timeline as TimelineGraphIcon,
  Dashboard as DashboardIcon,
  MyLocation as MyLocationIcon,
  Map as MapIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  ViewQuilt as ViewQuiltIcon,
  Sort as SortIcon,
  FilterAlt as FilterAltIcon,
  Refresh as RefreshIcon,
  SaveAlt as SaveAltIcon,
  NotificationsActive as NotificationsActiveIcon,
  Psychology as PsychologyIcon,
  Engineering as EngineeringIcon,
  Construction as ConstructionIcon,
  Electrical as ElectricalIcon,
  Plumbing as PlumbingIcon,
  Build as BuildIcon,
  Home as HomeIcon,
  Carpenter as CarpenterIcon,
  Hvac as HvacIcon,
  EmojiEvents as EmojiEventsIcon,
  School as SchoolIcon,
  Certificate as CertificateIcon,
  Language as LanguageIcon,
  Public as PublicIcon,
  AttachMoney as AttachMoneyIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Chat as ChatIcon,
  VideoCall as VideoCallIcon,
  Handshake as HandshakeIcon,
  ThumbUp as ThumbUpIcon,
  GetApp as GetAppIcon,
  CloudDownload as CloudDownloadIcon,
  Print as PrintIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  CenterFocusStrong as CenterFocusStrongIcon,
  Layers as LayersIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { styled, keyframes } from '@mui/material/styles';
import { format, formatDistanceToNow } from 'date-fns';
import { Helmet } from 'react-helmet';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchJobs,
  selectJobs,
  selectJobsLoading,
  selectJobsError,
  selectJobFilters,
  setFilters,
  selectJobsPagination,
} from '../../jobs/services/jobSlice';

// Animations
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
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

const slideInFromLeft = keyframes`
  from { transform: translateX(-100px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const slideInFromRight = keyframes`
  from { transform: translateX(100px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

// Styled Components
const HeroGradientSection = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${theme.palette.primary.main} 0%, 
    ${theme.palette.secondary.main} 50%, 
    ${theme.palette.primary.dark} 100%)`,
  color: 'white',
  padding: theme.spacing(10, 0),
  position: 'relative',
  overflow: 'hidden',
  minHeight: '75vh',
  display: 'flex',
  alignItems: 'center',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    animation: `${float} 10s ease-in-out infinite`,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '-30%',
    left: '-20%',
    width: '140%',
    height: '160%',
    background: `radial-gradient(circle, ${alpha('#FFD700', 0.15)} 0%, transparent 70%)`,
    animation: `${float} 15s ease-in-out infinite reverse`,
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
    boxShadow: `0 25px 50px ${alpha(theme.palette.secondary.main, 0.3)}`,
    borderColor: theme.palette.secondary.main,
  },
}));

const JobOpportunityCard = styled(GlassCard)(({ theme, featured, urgent, premium }) => ({
  height: '100%',
  position: 'relative',
  background: featured 
    ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.1)})`
    : theme.palette.background.paper,
  border: featured 
    ? `2px solid ${theme.palette.secondary.main}`
    : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '&::before': urgent ? {
    content: '"🔥 URGENT"',
    position: 'absolute',
    top: 15,
    right: -35,
    background: theme.palette.error.main,
    color: 'white',
    padding: '5px 45px',
    fontSize: '0.7rem',
    fontWeight: 700,
    transform: 'rotate(45deg)',
    letterSpacing: '1px',
    zIndex: 2,
  } : {},
  '&::after': premium ? {
    content: '"💎 PREMIUM"',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
    color: 'white',
    textAlign: 'center',
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '4px 0',
    letterSpacing: '1px',
  } : {},
}));

const SearchInterface = styled(Paper)(({ theme }) => ({
  position: 'sticky',
  top: theme.spacing(2),
  zIndex: 1000,
  background: alpha(theme.palette.background.paper, 0.95),
  backdropFilter: 'blur(20px)',
  borderRadius: 25,
  padding: theme.spacing(3),
  border: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
  boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.15)}`,
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
  cursor: 'pointer',
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
    transform: 'translateY(-5px) scale(1.02)',
    boxShadow: `0 20px 40px ${alpha(theme.palette.secondary.main, 0.4)}`,
    borderColor: theme.palette.secondary.main,
  },
}));

// Enhanced sample data with creative job opportunities
const creativeJobOpportunities = [
  {
    id: 'job-1',
    title: '🏠 Smart Home Electrical Installation - Tesla Powerwall Project',
    description: 'Join our elite team installing cutting-edge Tesla Powerwall systems and smart home automation. Work with the latest technology while helping homeowners achieve energy independence.',
    company: {
      name: 'Tesla Energy Solutions',
      logo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
      rating: 4.9,
      verified: true,
      size: 'Large Corporation',
    },
    budget: { min: 85, max: 125, currency: 'USD', type: 'hourly' },
    location: 'San Francisco Bay Area, CA',
    remote: false,
    jobType: 'contract',
    experience: 'senior',
    skills: ['Electrical Installation', 'Smart Home Tech', 'Solar Systems', 'Tesla Certified'],
    urgency: 'high',
    postedDate: '2024-01-20',
    applicants: 12,
    views: 450,
    featured: true,
    premium: true,
    estimatedDuration: '3-6 months',
    benefits: ['Health Insurance', 'Tool Allowance', 'Training Provided', 'Performance Bonus'],
    requirements: ['Tesla Certification Preferred', '5+ years electrical experience', 'Valid driver\'s license'],
    tags: ['High-Tech', 'Clean Energy', 'Career Growth'],
    workSchedule: 'Mon-Fri, 7AM-4PM',
    responseTime: 'Responds within 24 hours',
    matchScore: 95,
  },
  {
    id: 'job-2',
    title: '🔧 Master Plumber - Luxury Resort Construction',
    description: 'Lead plumbing installation for a prestigious 5-star resort development. Work with premium materials and cutting-edge water systems while building your portfolio with luxury projects.',
    company: {
      name: 'Luxury Resorts International',
      logo: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
      rating: 4.8,
      verified: true,
      size: 'Mid-size Company',
    },
    budget: { min: 75, max: 95, currency: 'USD', type: 'hourly' },
    location: 'Miami, FL',
    remote: false,
    jobType: 'full-time',
    experience: 'expert',
    skills: ['Commercial Plumbing', 'Luxury Installations', 'Project Management', 'Team Leadership'],
    urgency: 'medium',
    postedDate: '2024-01-19',
    applicants: 8,
    views: 320,
    featured: false,
    premium: true,
    estimatedDuration: '12-18 months',
    benefits: ['Full Benefits Package', 'Resort Discounts', 'Career Advancement', 'Relocation Assistance'],
    requirements: ['Master Plumber License', '10+ years experience', 'Luxury project portfolio'],
    tags: ['Luxury', 'Full-Time', 'Benefits'],
    workSchedule: 'Mon-Fri, Flexible hours',
    responseTime: 'Responds within 2 hours',
    matchScore: 88,
  },
  {
    id: 'job-3',
    title: '🏗️ Construction Project Manager - Sustainable Building',
    description: 'Lead LEED-certified sustainable construction projects. Make a positive environmental impact while advancing your career with green building technologies.',
    company: {
      name: 'EcoGreen Construction',
      logo: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400',
      rating: 4.7,
      verified: true,
      size: 'Growing Startup',
    },
    budget: { min: 95, max: 130, currency: 'USD', type: 'hourly' },
    location: 'Austin, TX',
    remote: true,
    jobType: 'contract',
    experience: 'senior',
    skills: ['LEED Certification', 'Project Management', 'Sustainable Building', 'Team Leadership'],
    urgency: 'low',
    postedDate: '2024-01-18',
    applicants: 15,
    views: 680,
    featured: true,
    premium: false,
    estimatedDuration: '6-9 months',
    benefits: ['Remote Work', 'Professional Development', 'Stock Options', 'Green Incentives'],
    requirements: ['LEED AP certification', 'PMP preferred', 'Sustainability experience'],
    tags: ['Sustainable', 'Remote', 'Innovation'],
    workSchedule: 'Flexible schedule',
    responseTime: 'Responds within 4 hours',
    matchScore: 92,
  },
  {
    id: 'job-4',
    title: '🎨 Interior Design Specialist - High-End Residential',
    description: 'Create stunning interior spaces for luxury homes. Work with unlimited budgets and premium materials while building your design portfolio.',
    company: {
      name: 'Elite Design Studios',
      logo: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
      rating: 4.9,
      verified: true,
      size: 'Boutique Agency',
    },
    budget: { min: 65, max: 85, currency: 'USD', type: 'hourly' },
    location: 'Los Angeles, CA',
    remote: false,
    jobType: 'freelance',
    experience: 'mid',
    skills: ['Interior Design', 'Space Planning', '3D Visualization', 'Client Relations'],
    urgency: 'medium',
    postedDate: '2024-01-17',
    applicants: 22,
    views: 890,
    featured: false,
    premium: false,
    estimatedDuration: '4-6 months',
    benefits: ['Portfolio Building', 'Networking', 'Creative Freedom', 'High-End Clients'],
    requirements: ['Interior Design degree', 'Portfolio required', '3+ years experience'],
    tags: ['Creative', 'Portfolio Building', 'Luxury'],
    workSchedule: 'Project-based',
    responseTime: 'Responds within 1 hour',
    matchScore: 85,
  },
];

const jobCategories = [
  { 
    name: 'Electrical', 
    icon: <ElectricalIcon />, 
    count: 8450, 
    color: '#FFD700', 
    trending: true,
    description: 'Smart systems & power solutions'
  },
  { 
    name: 'Plumbing', 
    icon: <PlumbingIcon />, 
    count: 6240, 
    color: '#4A90E2', 
    hot: true,
    description: 'Water systems & emergency repairs'
  },
  { 
    name: 'Construction', 
    icon: <ConstructionIcon />, 
    count: 12890, 
    color: '#E74C3C',
    description: 'Building & renovation projects'
  },
  { 
    name: 'HVAC', 
    icon: <SpeedIcon />, 
    count: 4560, 
    color: '#2ECC71',
    description: 'Climate control systems'
  },
  { 
    name: 'Design', 
    icon: <PsychologyIcon />, 
    count: 5670, 
    color: '#9B59B6', 
    premium: true,
    description: 'Interior & architectural design'
  },
  { 
    name: 'Smart Tech', 
    icon: <HomeIcon />, 
    count: 2340, 
    color: '#F39C12', 
    newest: true,
    description: 'IoT & automation systems'
  },
];

const workerStats = [
  { 
    icon: <WorkIcon sx={{ fontSize: 48 }} />, 
    value: '45,000+', 
    label: 'Active Opportunities',
    subtitle: 'Updated every minute',
    color: '#FFD700',
    trend: '+18% this week'
  },
  { 
    icon: <AttachMoneyIcon sx={{ fontSize: 48 }} />, 
    value: '$125K', 
    label: 'Average Annual Salary',
    subtitle: 'For skilled professionals',
    color: '#2ECC71',
    trend: '+12% year over year'
  },
  { 
    icon: <TrendingUpIcon sx={{ fontSize: 48 }} />, 
    value: '2.3x', 
    label: 'Salary Growth Rate',
    subtitle: 'Outpacing inflation',
    color: '#3498DB',
    trend: 'Industry leading'
  },
  { 
    icon: <StarIcon sx={{ fontSize: 48 }} />, 
    value: '4.8/5', 
    label: 'Worker Satisfaction',
    subtitle: 'Job quality rating',
    color: '#E74C3C',
    trend: '+0.3 this quarter'
  },
];

const JobSearchPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const heroRef = useRef(null);
  
  // Redux state
  const jobs = useSelector(selectJobs);
  const loading = useSelector(selectJobsLoading);
  const error = useSelector(selectJobsError);
  const filters = useSelector(selectJobFilters);
  const { currentPage, totalPages } = useSelector(selectJobsPagination);

  // Local state
  const [viewMode, setViewMode] = useState('grid');
  const [userPosition, setUserPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showSampleData, setShowSampleData] = useState(true);
  const [savedJobs, setSavedJobs] = useState([]);
  const [filterDialog, setFilterDialog] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [salaryRange, setSalaryRange] = useState([0, 200]);
  const [onlyRemote, setOnlyRemote] = useState(false);
  const [onlyUrgent, setOnlyUrgent] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState('');
  const [jobType, setJobType] = useState('');

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserPosition([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  }, []);

  // Fetch jobs
  useEffect(() => {
    if (!showSampleData) {
      const searchParams = {
        ...filters,
        page: currentPage,
        search: searchQuery,
        category: selectedCategory,
        sortBy,
        remote: onlyRemote,
        urgent: onlyUrgent,
        experience: experienceLevel,
        jobType,
        minSalary: salaryRange[0],
        maxSalary: salaryRange[1],
      };
      dispatch(fetchJobs(searchParams));
    }
  }, [dispatch, filters, currentPage, searchQuery, selectedCategory, sortBy, onlyRemote, onlyUrgent, experienceLevel, jobType, salaryRange, showSampleData]);

  const handleSearch = () => {
    setShowSampleData(false);
    const newFilters = {
      search: searchQuery.trim(),
      category: selectedCategory,
      sortBy,
      remote: onlyRemote,
      urgent: onlyUrgent,
      experience: experienceLevel,
      jobType,
      minSalary: salaryRange[0],
      maxSalary: salaryRange[1],
      page: 1,
    };
    dispatch(setFilters(newFilters));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSortBy('relevance');
    setOnlyRemote(false);
    setOnlyUrgent(false);
    setExperienceLevel('');
    setJobType('');
    setSalaryRange([0, 200]);
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
    <HeroGradientSection ref={heroRef}>
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} lg={6}>
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
                Find Your Dream Work
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
                💰 Unlock your earning potential with top employers
                <br />
                🌟 Build your career with meaningful work
              </Typography>
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 6 }}>
                <AnimatedButton
                  size="large"
                  startIcon={<SearchIcon />}
                  onClick={() => window.scrollTo({ 
                    top: heroRef.current?.offsetHeight || 600, 
                    behavior: 'smooth' 
                  })}
                >
                  Explore Opportunities
                </AnimatedButton>
                <AnimatedButton
                  variant="outlined"
                  size="large"
                  startIcon={<WorkspacePremiumIcon />}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': {
                      borderColor: theme.palette.secondary.main,
                      backgroundColor: alpha('white', 0.1),
                    },
                  }}
                  onClick={() => navigate('/worker/profile')}
                >
                  Build Your Profile
                </AnimatedButton>
              </Stack>

              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, opacity: 0.8 }}>
                  🏆 Join professionals working with:
                </Typography>
                <Stack direction="row" spacing={3} sx={{ opacity: 0.7, flexWrap: 'wrap' }}>
                  {['Tesla', 'Apple', 'Google', 'Microsoft', 'SpaceX'].map((company) => (
                    <Typography key={company} variant="h6" fontWeight={300}>
                      {company}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} lg={6}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Grid container spacing={3}>
                {workerStats.map((stat, index) => (
                  <Grid item xs={6} key={index}>
                    <StatCard
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                      whileHover={{ scale: 1.05, rotateY: 5 }}
                    >
                      <Box sx={{ color: stat.color, mb: 2 }}>
                        {stat.icon}
                      </Box>
                      <Typography variant="h3" fontWeight={900} sx={{ color: stat.color, mb: 1 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="h6" fontWeight={600} color="white" sx={{ mb: 0.5 }}>
                        {stat.label}
                      </Typography>
                      <Typography variant="body2" color="rgba(255,255,255,0.8)" sx={{ mb: 1 }}>
                        {stat.subtitle}
                      </Typography>
                      <Chip
                        label={stat.trend}
                        size="small"
                        sx={{
                          bgcolor: alpha('white', 0.2),
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
    </HeroGradientSection>
  );

  const renderSearchInterface = () => (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <SearchInterface elevation={12}>
        <Typography variant="h4" fontWeight={700} textAlign="center" sx={{ mb: 4, color: theme.palette.secondary.main }}>
          🎯 Smart Job Discovery Engine
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search jobs by title, company, or skills..."
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
                  '& fieldset': { borderColor: alpha(theme.palette.secondary.main, 0.3) },
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
                  '& fieldset': { borderColor: alpha(theme.palette.secondary.main, 0.3) },
                  bgcolor: alpha(theme.palette.background.default, 0.5),
                }}
              >
                <MenuItem value="relevance">Most Relevant</MenuItem>
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="salary_high">Highest Salary</MenuItem>
                <MenuItem value="salary_low">Lowest Salary</MenuItem>
                <MenuItem value="match">Best Match</MenuItem>
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
                Find Jobs
              </AnimatedButton>
              
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

        {/* Advanced Filters */}
        <Collapse in={showAdvancedFilters}>
          <Divider sx={{ my: 3 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Experience Level</InputLabel>
                <Select
                  value={experienceLevel}
                  label="Experience Level"
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">All Levels</MenuItem>
                  <MenuItem value="entry">Entry Level</MenuItem>
                  <MenuItem value="mid">Mid Level</MenuItem>
                  <MenuItem value="senior">Senior Level</MenuItem>
                  <MenuItem value="expert">Expert Level</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Job Type</InputLabel>
                <Select
                  value={jobType}
                  label="Job Type"
                  onChange={(e) => setJobType(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="full-time">Full Time</MenuItem>
                  <MenuItem value="part-time">Part Time</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                  <MenuItem value="freelance">Freelance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Hourly Rate: ${salaryRange[0]} - ${salaryRange[1]}</Typography>
              <Slider
                value={salaryRange}
                onChange={(e, newValue) => setSalaryRange(newValue)}
                valueLabelDisplay="auto"
                min={0}
                max={300}
                step={5}
                marks={[
                  { value: 0, label: '$0' },
                  { value: 100, label: '$100' },
                  { value: 200, label: '$200' },
                  { value: 300, label: '$300+' },
                ]}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button onClick={clearFilters} startIcon={<ClearIcon />} variant="outlined">
                  Clear All
                </Button>
                <AnimatedButton onClick={handleSearch} startIcon={<SearchIcon />}>
                  Apply Filters
                </AnimatedButton>
              </Stack>
            </Grid>
          </Grid>
        </Collapse>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            endIcon={showAdvancedFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ color: theme.palette.secondary.main }}
          >
            {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
          </Button>
        </Box>
      </SearchInterface>
    </Container>
  );

  const renderCategories = () => (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      <Typography
        variant="h3"
        fontWeight={700}
        textAlign="center"
        sx={{ mb: 6, color: theme.palette.secondary.main }}
      >
        🎯 Explore Job Categories
      </Typography>
      
      <Grid container spacing={3} justifyContent="center">
        {jobCategories.map((category, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={category.name}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, rotateY: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <GlassCard
                sx={{
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: selectedCategory === category.name 
                    ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.2)}, ${alpha(theme.palette.primary.main, 0.1)})`
                    : 'background.paper',
                  border: selectedCategory === category.name 
                    ? `2px solid ${theme.palette.secondary.main}`
                    : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  minHeight: 180,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
                onClick={() => setSelectedCategory(category.name === selectedCategory ? '' : category.name)}
              >
                <Box sx={{ color: category.color, mb: 2, fontSize: 48 }}>
                  {category.icon}
                </Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {category.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {category.description}
                </Typography>
                <Chip
                  label={`${category.count.toLocaleString()} jobs`}
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Box>
                  {category.trending && <Chip label="🔥" size="small" sx={{ m: 0.25 }} />}
                  {category.hot && <Chip label="💎" size="small" sx={{ m: 0.25 }} />}
                  {category.newest && <Chip label="✨" size="small" sx={{ m: 0.25 }} />}
                  {category.premium && <Chip label="👑" size="small" sx={{ m: 0.25 }} />}
                </Box>
              </GlassCard>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Container>
  );

  const renderJobCard = (job, index) => (
    <Grid item xs={12} sm={6} lg={viewMode === 'list' ? 12 : 4} key={job.id}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
      >
        <JobOpportunityCard
          featured={job.featured}
          urgent={job.urgency === 'high'}
          premium={job.premium}
          elevation={job.featured ? 12 : 4}
        >
          <CardContent sx={{ 
            p: 3, 
            pt: job.featured && job.premium ? 7 : job.featured || job.premium ? 5 : 3,
            pb: 2
          }}>
            {/* Job Header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
              <Avatar
                src={job.company.logo}
                sx={{
                  width: 60,
                  height: 60,
                  mr: 2,
                  border: `3px solid ${theme.palette.secondary.main}`,
                  boxShadow: `0 8px 20px ${alpha(theme.palette.secondary.main, 0.3)}`,
                }}
              />
              
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {job.title}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {job.company.name}
                  </Typography>
                  {job.company.verified && (
                    <VerifiedIcon sx={{ fontSize: 16, color: theme.palette.secondary.main }} />
                  )}
                  <Rating value={job.company.rating} precision={0.1} size="small" readOnly />
                </Stack>
                
                {job.matchScore && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ mr: 1 }}>
                      Match Score:
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={job.matchScore}
                      sx={{ 
                        flexGrow: 1, 
                        mr: 1, 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.secondary.main, 0.2),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: job.matchScore >= 90 ? theme.palette.success.main : 
                                   job.matchScore >= 70 ? theme.palette.warning.main : 
                                   theme.palette.error.main,
                          borderRadius: 4,
                        }
                      }}
                    />
                    <Typography variant="body2" fontWeight={600} color="secondary.main">
                      {job.matchScore}%
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <IconButton
                onClick={() => toggleSaveJob(job.id)}
                sx={{
                  color: savedJobs.includes(job.id)
                    ? theme.palette.secondary.main
                    : theme.palette.text.secondary,
                }}
              >
                {savedJobs.includes(job.id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
              </IconButton>
            </Box>

            {/* Job Description */}
            <Typography
              variant="body2"
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

            {/* Skills */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Required Skills
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {job.skills.slice(0, 4).map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    size="small"
                    sx={{
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                      color: theme.palette.secondary.main,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  />
                ))}
                {job.skills.length > 4 && (
                  <Chip
                    label={`+${job.skills.length - 4} more`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Stack>
            </Box>

            {/* Job Details Grid */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700} color="secondary.main">
                    ${job.budget.min}-{job.budget.max}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    per {job.budget.type}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={600}>
                    {job.applicants}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    applicants
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Location & Details */}
            <Stack spacing={1} sx={{ mb: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <LocationOnIcon fontSize="small" color="secondary" />
                <Typography variant="body2">{job.location}</Typography>
                {job.remote && (
                  <Chip label="Remote" size="small" color="success" />
                )}
              </Stack>
              
              <Stack direction="row" spacing={1} alignItems="center">
                <ScheduleIcon fontSize="small" color="secondary" />
                <Typography variant="body2">{job.estimatedDuration}</Typography>
              </Stack>
              
              <Stack direction="row" spacing={1} alignItems="center">
                <AccessTimeIcon fontSize="small" color="secondary" />
                <Typography variant="body2">{job.responseTime}</Typography>
              </Stack>
            </Stack>

            {/* Tags */}
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

            {/* Benefits Preview */}
            {job.benefits && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Benefits & Perks
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  {job.benefits.slice(0, 3).map((benefit) => (
                    <Chip
                      key={benefit}
                      label={benefit}
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        color: theme.palette.success.main,
                        fontSize: '0.7rem',
                      }}
                    />
                  ))}
                  {job.benefits.length > 3 && (
                    <Chip
                      label={`+${job.benefits.length - 3} more`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Stack>
              </Box>
            )}
          </CardContent>

          <CardActions sx={{ p: 3, pt: 0 }}>
            <Stack direction="row" spacing={1} width="100%">
              <AnimatedButton
                variant="contained"
                fullWidth
                startIcon={<VisibilityIcon />}
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                View Details
              </AnimatedButton>
              <AnimatedButton
                variant="outlined"
                startIcon={<HandshakeIcon />}
                onClick={() => navigate(`/jobs/${job.id}/apply`)}
                sx={{
                  borderColor: theme.palette.secondary.main,
                  color: theme.palette.secondary.main,
                }}
              >
                Apply Now
              </AnimatedButton>
              <IconButton color="primary">
                <ShareIcon />
              </IconButton>
            </Stack>
          </CardActions>
        </JobOpportunityCard>
      </motion.div>
    </Grid>
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
          🌟 Premium Opportunities
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
          Hand-picked jobs from top employers with exceptional benefits
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {creativeJobOpportunities.map((job, index) => 
          renderJobCard(job, index)
        )}
      </Grid>
    </Container>
  );

  const renderMapView = () => (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ height: 600, borderRadius: 3, overflow: 'hidden' }}>
        <MapContainer
          center={userPosition || [39.8283, -98.5795]} // Center of USA if no user location
          zoom={userPosition ? 13 : 4}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* User Location Marker */}
          {userPosition && (
            <Marker position={userPosition}>
              <Popup>📍 You are here</Popup>
            </Marker>
          )}
          
          {/* Job Markers */}
          {(showSampleData ? creativeJobOpportunities : jobs)
            .filter(job => job.coordinates)
            .map((job) => (
              <Marker
                key={job.id}
                position={[job.coordinates?.lat || 37.7749, job.coordinates?.lng || -122.4194]}
              >
                <Popup>
                  <Box sx={{ minWidth: 200 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {job.title}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      {job.company?.name || 'Company Name'}
                    </Typography>
                    <Typography variant="body2" color="secondary.main" fontWeight="bold">
                      ${job.budget?.min}-{job.budget?.max}/{job.budget?.type}
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      sx={{ mt: 1 }}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      View Details
                    </Button>
                  </Box>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </Box>
    </Container>
  );

  return (
    <>
      <Helmet>
        <title>Find Your Dream Job - Professional Opportunities for Workers | Kelmah</title>
        <meta name="description" content="Discover high-paying jobs in skilled trades. Find opportunities in electrical, plumbing, construction, HVAC, and specialized fields. Build your career with top employers." />
      </Helmet>

      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {renderHeroSection()}
        {renderSearchInterface()}
        {renderCategories()}
        
        {/* Content Area */}
        {viewMode === 'map' ? (
          renderMapView()
        ) : loading ? (
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <Grid container spacing={3}>
              {Array.from(new Array(6)).map((_, idx) => (
                <Grid item xs={12} sm={6} lg={4} key={idx}>
                  <Skeleton variant="rectangular" height={450} sx={{ borderRadius: 3 }} />
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
              {jobs.map((job, index) => renderJobCard(job, index))}
            </Grid>
          </Container>
        )}

        {/* Floating Actions */}
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
            icon={<BookmarkIcon />}
            tooltipTitle="Saved Jobs"
            onClick={() => navigate('/worker/saved-jobs')}
          />
          <SpeedDialAction
            icon={<NotificationsActiveIcon />}
            tooltipTitle="Job Alerts"
            onClick={() => navigate('/worker/job-alerts')}
          />
          <SpeedDialAction
            icon={<DashboardIcon />}
            tooltipTitle="Dashboard"
            onClick={() => navigate('/worker/dashboard')}
          />
        </SpeedDial>
      </Box>
    </>
  );
};

export default JobSearchPage;
