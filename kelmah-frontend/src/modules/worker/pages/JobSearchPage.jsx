import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  Stepper,
  Step,
  StepLabel,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  Search as SearchIcon,
  LocationOn as LocationOnIcon,
  Schedule as ScheduleIcon,
  MonetizationOn as MonetizationOnIcon,
  AttachMoney as AttachMoneyIcon,
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
  FlashOn as ElectricalIcon,
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
  ElectricalServices as ElectricalServicesIcon,
  Plumbing as PlumbingIcon,
  Build as BuildIcon,
  Home as HomeIcon,
  Handyman as CarpenterIcon,
  Thermostat as HvacIcon,
  Rocket as RocketIcon,
  Diamond as DiamondIcon,
  Handshake as HandshakeIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { styled, keyframes } from '@mui/material/styles';
import { format, formatDistanceToNow } from 'date-fns';
import { Helmet } from 'react-helmet-async';
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
  saveJobToServer,
  unsaveJobFromServer,
  selectSavedJobs,
  fetchSavedJobs,
} from '../../jobs/services/jobSlice';
import jobsApi from '../../jobs/services/jobsApi';
// TODO: Integrate bid and user performance functionality into appropriate module services
import EnhancedJobCard from '../components/EnhancedJobCard';
import UserPerformanceDashboard from '../components/UserPerformanceDashboard';
// Removed AuthContext import to prevent dual state management conflicts
// import useAuth from '../../auth/hooks/useAuth';
import { useAuthCheck } from '../../../hooks/useAuthCheck';
import { EXTERNAL_SERVICES } from '../../../config/services';

// Enhanced Animations with Worker-focused Themes
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-12px) rotate(1deg); }
  50% { transform: translateY(-18px) rotate(0deg); }
  75% { transform: translateY(-12px) rotate(-1deg); }
`;

// AnimatedButton styled component
const AnimatedButton = styled(Button)(({ theme }) => ({
  borderRadius: 25,
  padding: '12px 24px',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s ease-in-out',
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[12],
  },
}));

// StatCard styled component for statistics display
const StatCard = styled(motion.div)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: 20,
  padding: theme.spacing(3),
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
    pointerEvents: 'none',
  },
}));

// SearchInterface styled component for search interface wrapper
const SearchInterface = styled(Paper)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  borderRadius: 24,
  padding: theme.spacing(4),
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
    pointerEvents: 'none',
  },
}));

// GlassCard styled component for glass morphism effect
const GlassCard = styled(Card)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.9),
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: 16,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[20],
    background: alpha(theme.palette.background.paper, 0.95),
  },
}));

// JobOpportunityCard styled component for job listings
const JobOpportunityCard = styled(Card)(({ theme, featured, urgent, premium }) => ({
  background: 'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.98) 100%)',
  border: `1px solid ${alpha(featured ? '#FFD700' : urgent ? '#FF5722' : premium ? '#9C27B0' : theme.palette.divider, 0.2)}`,
  borderRadius: 16,
  overflow: 'hidden',
  position: 'relative',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 8px 25px ${alpha(featured ? '#FFD700' : urgent ? '#FF5722' : premium ? '#9C27B0' : theme.palette.primary.main, 0.3)}`,
    border: `1px solid ${alpha(featured ? '#FFD700' : urgent ? '#FF5722' : premium ? '#9C27B0' : theme.palette.primary.main, 0.4)}`,
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: `linear-gradient(90deg, ${featured ? '#FFD700' : urgent ? '#FF5722' : premium ? '#9C27B0' : theme.palette.primary.main} 0%, ${alpha(featured ? '#FFD700' : urgent ? '#FF5722' : premium ? '#9C27B0' : theme.palette.primary.main, 0.8)} 100%)`,
  },
}));

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7); }
  50% { transform: scale(1.08); box-shadow: 0 0 0 15px rgba(212, 175, 55, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
`;

const slideInFromLeft = keyframes`
  from { transform: translateX(-100px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const slideInFromRight = keyframes`
  from { transform: translateX(100px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const sparkle = keyframes`
  0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
  50% { opacity: 1; transform: scale(1) rotate(180deg); }
`;

const rotateGlow = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const heartbeat = keyframes`
  0% { transform: scale(1); }
  14% { transform: scale(1.1); }
  28% { transform: scale(1); }
  42% { transform: scale(1.1); }
  70% { transform: scale(1); }
`;

// Professional Worker-focused Styled Components
const HeroGradientSection = styled(Box)(({ theme }) => {
  return {
    background: `linear-gradient(135deg, 
      ${theme.palette.primary.main} 0%, 
      ${theme.palette.secondary.main} 25%,
      ${theme.palette.primary.dark} 50%,
      ${theme.palette.secondary.dark} 75%,
      ${theme.palette.primary.main} 100%)`,
    backgroundSize: '400% 400%',
    animation: `${gradientShift} 20s ease infinite`,
    color: 'white',
    padding: theme.spacing(12, 0),
    position: 'relative',
    overflow: 'hidden',
    minHeight: '90vh',
    display: 'flex',
    alignItems: 'center',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `radial-gradient(circle at 25% 75%, ${alpha('#4ECDC4', 0.3)} 0%, transparent 50%),
                  radial-gradient(circle at 75% 25%, ${alpha('#FFD700', 0.3)} 0%, transparent 50%),
                  radial-gradient(circle at 50% 50%, ${alpha('#FF6B6B', 0.2)} 0%, transparent 70%)`,
      animation: `${float} 25s ease-in-out infinite`,
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '-30%',
      left: '-20%',
      width: '140%',
      height: '160%',
      background: `conic-gradient(from 45deg at 50% 50%, transparent 0deg, ${alpha('#FFD700', 0.15)} 90deg, transparent 180deg, ${alpha('#4ECDC4', 0.15)} 270deg, transparent 360deg)`,
      animation: `${rotateGlow} 40s linear infinite`,
    }
  };
});

const jobCategories = [
  { 
    name: 'Electrical', 
    icon: <ElectricalIcon />, 
    count: 18450, 
    color: '#FFD700', 
    trending: true,
    description: 'Smart systems, renewable energy & automation',
    avgSalary: '$85,000',
    growth: '+28%',
    demandLevel: 'Explosive',
    topSkills: ['Smart Home Tech', 'Solar Systems', 'Industrial Automation'],
  },
  { 
    name: 'Plumbing', 
    icon: <PlumbingIcon />, 
    count: 14240, 
    color: '#4A90E2', 
    hot: true,
    description: 'Water systems, green solutions & emergency response',
    avgSalary: '$78,000',
    growth: '+22%',
    demandLevel: 'Very High',
    topSkills: ['Green Plumbing', 'Emergency Repair', 'Water Treatment'],
  },
  { 
    name: 'Construction', 
    icon: <ConstructionIcon />, 
    count: 32890, 
    color: '#E74C3C',
    description: 'Smart buildings, infrastructure & sustainable construction',
    avgSalary: '$82,000',
    growth: '+18%',
    demandLevel: 'Very High',
    topSkills: ['Smart Buildings', 'Sustainable Construction', 'Project Management'],
  },
  { 
    name: 'HVAC', 
    icon: <SpeedIcon />, 
    count: 11560, 
    color: '#2ECC71',
    description: 'Climate control, energy efficiency & smart systems',
    avgSalary: '$80,000',
    growth: '+25%',
    demandLevel: 'High',
    topSkills: ['Smart Climate', 'Energy Efficiency', 'System Integration'],
  },
  { 
    name: 'Smart Tech', 
    icon: <HomeIcon />, 
    count: 8780, 
    color: '#9B59B6', 
    newest: true,
    description: 'IoT integration, automation & AI systems',
    avgSalary: '$95,000',
    growth: '+52%',
    demandLevel: 'Explosive',
    topSkills: ['IoT Systems', 'AI Integration', 'Home Automation'],
  },
  { 
    name: 'Design', 
    icon: <PsychologyIcon />, 
    count: 12340, 
    color: '#E67E22',
    description: 'Interior design, space planning & creative solutions',
    avgSalary: '$72,000',
    growth: '+19%',
    demandLevel: 'High',
    topSkills: ['Space Planning', '3D Design', 'Sustainable Design'],
  },
];

const workerStats = [
  { 
    icon: <WorkIcon sx={{ fontSize: 56 }} />, 
    value: '125,000+', 
    label: 'Dream Opportunities',
    subtitle: 'Updated every minute',
    color: '#FFD700',
    trend: '+23% this month',
    description: 'From entry-level to industry-leading positions',
    animation: pulse,
    gradient: 'primary',
  },
  { 
    icon: <AttachMoneyIcon sx={{ fontSize: 56 }} />, 
    value: '$145K', 
    label: 'Average Salary',
    subtitle: 'For skilled professionals',
    color: '#2ECC71',
    trend: '+18% year over year',
    description: 'Industry-leading compensation packages',
    animation: float,
    gradient: 'success',
  },
  { 
    icon: <TrendingUpIcon sx={{ fontSize: 56 }} />, 
    value: '3.2x', 
    label: 'Career Growth Rate',
    subtitle: 'Faster than other industries',
    color: '#3498DB',
    trend: 'Accelerating rapidly',
    description: 'Unmatched professional development',
    animation: shimmer,
    gradient: 'info',
  },
  { 
    icon: <StarIcon sx={{ fontSize: 56 }} />, 
    value: '4.92/5', 
    label: 'Worker Satisfaction',
    subtitle: 'Job fulfillment rating',
    color: '#E74C3C',
    trend: '+0.08 this quarter',
    description: 'Love what you do, every day',
    animation: sparkle,
    gradient: 'error',
  },
  { 
    icon: <RocketIcon sx={{ fontSize: 56 }} />, 
    value: '24hrs', 
    label: 'Average Hire Time',
    subtitle: 'From application to offer',
    color: '#9C27B0',
    trend: '67% faster',
    description: 'Lightning-fast job matching',
    animation: rotateGlow,
    gradient: 'primary',
  },
  { 
    icon: <DiamondIcon sx={{ fontSize: 56 }} />, 
    value: '89%', 
    label: 'Premium Job Rate',
    subtitle: 'High-quality opportunities',
    color: '#FF5722',
    trend: 'Industry leading',
    description: 'Exceptional career opportunities',
    animation: heartbeat,
    gradient: 'error',
  },
];

// Sample creative job opportunities for demonstration
const creativeJobOpportunities = [
  {
    id: 1,
    title: 'Senior Smart Home Integration Specialist',
    company: { name: 'TechHomes Ghana', logo: null },
    location: 'Accra, Ghana',
    type: 'Full-time',
    budget: { min: 8000, max: 12000, type: 'monthly', currency: 'GHS' },
    description: 'Lead smart home automation projects for luxury residential and commercial properties.',
    skills: ['IoT Systems', 'Home Automation', 'Smart Home Integration', 'Project Management'],
    benefits: ['Health Insurance', 'Flexible Hours', 'Professional Development', 'Performance Bonus'],
    featured: true,
    urgent: false,
    premium: true,
    coordinates: { lat: 5.6037, lng: -0.1870 },
    postedDate: new Date('2024-01-15'),
    urgency: 'medium'
  },
  {
    id: 2,
    title: 'Renewable Energy Installation Expert',
    company: { name: 'GreenPower Solutions', logo: null },
    location: 'Kumasi, Ghana',
    type: 'Contract',
    budget: { min: 15000, max: 25000, type: 'project', currency: 'GHS' },
    description: 'Install and maintain solar panel systems for residential and commercial clients.',
    skills: ['Solar Installation', 'Electrical Systems', 'Renewable Energy', 'Safety Protocols'],
    benefits: ['Project Bonuses', 'Equipment Provided', 'Training Opportunities'],
    featured: false,
    urgent: true,
    premium: false,
    coordinates: { lat: 6.6885, lng: -1.6244 },
    postedDate: new Date('2024-01-14'),
    urgency: 'high'
  },
  {
    id: 3,
    title: 'Custom Furniture Designer & Maker',
    company: { name: 'Artisan Craft Co.', logo: null },
    location: 'Cape Coast, Ghana',
    type: 'Part-time',
    budget: { min: 5000, max: 8000, type: 'monthly', currency: 'GHS' },
    description: 'Create bespoke furniture pieces using traditional and modern techniques.',
    skills: ['Woodworking', 'Furniture Design', 'Carpentry', '3D Design'],
    benefits: ['Creative Freedom', 'Flexible Schedule', 'Material Allowance'],
    featured: true,
    urgent: false,
    premium: false,
    coordinates: { lat: 5.1053, lng: -1.2466 },
    postedDate: new Date('2024-01-13'),
    urgency: 'low'
  },
  {
    id: 4,
    title: 'Industrial Automation Technician',
    company: { name: 'Manufacturing Plus', logo: null },
    location: 'Tema, Ghana',
    type: 'Full-time',
    budget: { min: 10000, max: 15000, type: 'monthly', currency: 'GHS' },
    description: 'Maintain and upgrade automated manufacturing systems.',
    skills: ['Industrial Automation', 'PLC Programming', 'Mechanical Systems', 'Troubleshooting'],
    benefits: ['Health Insurance', 'Retirement Plan', 'Overtime Pay', 'Safety Equipment'],
    featured: false,
    urgent: false,
    premium: true,
    coordinates: { lat: 5.6833, lng: -0.0167 },
    postedDate: new Date('2024-01-12'),
    urgency: 'medium'
  },
  {
    id: 5,
    title: 'Sustainable Building Consultant',
    company: { name: 'EcoBuild Ghana', logo: null },
    location: 'Tamale, Ghana',
    type: 'Contract',
    budget: { min: 12000, max: 18000, type: 'monthly', currency: 'GHS' },
    description: 'Advise on sustainable construction practices and green building materials.',
    skills: ['Sustainable Building', 'Construction', 'Environmental Design', 'Project Management'],
    benefits: ['Travel Allowance', 'Professional Development', 'Flexible Hours'],
    featured: true,
    urgent: true,
    premium: false,
    coordinates: { lat: 9.4008, lng: -0.8393 },
    postedDate: new Date('2024-01-11'),
    urgency: 'high'
  },
  {
    id: 6,
    title: 'Advanced HVAC Systems Specialist',
    company: { name: 'Climate Control Pro', logo: null },
    location: 'Takoradi, Ghana',
    type: 'Full-time',
    budget: { min: 9000, max: 13000, type: 'monthly', currency: 'GHS' },
    description: 'Install and maintain advanced heating, ventilation, and air conditioning systems.',
    skills: ['HVAC Systems', 'Climate Control', 'Energy Efficiency', 'System Design'],
    benefits: ['Company Vehicle', 'Tool Allowance', 'Health Insurance', 'Performance Bonus'],
    featured: false,
    urgent: false,
    premium: true,
    coordinates: { lat: 4.8845, lng: -1.7553 },
    postedDate: new Date('2024-01-10'),
    urgency: 'medium'
  }
];

const JobSearchPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // Use ONLY Redux auth state to prevent dual state management conflicts
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const authState = useAuthCheck();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const heroRef = useRef(null);
  const searchRef = useRef(null);
  
  // Redux state with enhanced safety
  const jobs = useSelector(selectJobs) || [];
  const loading = useSelector(selectJobsLoading) || false;
  const error = useSelector(selectJobsError);
  const filters = useSelector(selectJobFilters) || {};
  const { currentPage = 1, totalPages = 0 } = useSelector(selectJobsPagination) || {};
  const savedJobs = useSelector(selectSavedJobs) || [];

  // Enhanced local state for better UX
  const [viewMode, setViewMode] = useState(isMobile ? 'list' : 'grid');
  const [userPosition, setUserPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filterDialog, setFilterDialog] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [salaryRange, setSalaryRange] = useState([0, 200]);
  const [onlyRemote, setOnlyRemote] = useState(false);
  const [onlyUrgent, setOnlyUrgent] = useState(false);
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState('');
  const [jobType, setJobType] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [matchingJobs, setMatchingJobs] = useState([]);
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState([]);
  const [careerInsights, setCareerInsights] = useState(null);
  const [skillGaps, setSkillGaps] = useState([]);
  const [animateCards, setAnimateCards] = useState(false);
  const [showSampleData, setShowSampleData] = useState(true);

  // Enhanced state for new bidding system
  const [userPerformance, setUserPerformance] = useState(null);
  const [myBids, setMyBids] = useState([]);
  const [biddingJobs, setBiddingJobs] = useState([]);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [bidsLoading, setBidsLoading] = useState(false);

  // Enhanced functions for new system
  const fetchUserPerformance = async () => {
    if (!authState.isAuthenticated) return;
    
    setPerformanceLoading(true);
    try {
      // TODO: Integrate into worker service
      // const response = await userPerformanceApi.getMyPerformance();
      setUserPerformance(response.data);
    } catch (error) {
      console.error('Error fetching user performance:', error);
    } finally {
      setPerformanceLoading(false);
    }
  };

  const fetchMyBids = async () => {
    if (!authState.isAuthenticated) return;
    
    setBidsLoading(true);
    try {
      // TODO: Integrate into worker service  
      // const response = await bidApi.getMyBids();
      setMyBids(response.data || []);
    } catch (error) {
      console.error('Error fetching my bids:', error);
    } finally {
      setBidsLoading(false);
    }
  };

  const fetchBiddingJobs = async () => {
    if (!authState.isAuthenticated) return;
    
    try {
      const response = await jobsApi.getPersonalizedJobRecommendations();
      setBiddingJobs(response.data || []);
    } catch (error) {
      console.error('Error fetching bidding jobs:', error);
    }
  };

  // Skill options for autocomplete
  const skillOptions = [
    'Electrical Wiring', 'Smart Home Integration', 'Solar Installation', 'Industrial Automation',
    'Plumbing Repair', 'Water Systems', 'Emergency Response', 'Green Plumbing',
    'Project Management', 'Construction', 'Renovation', 'Sustainable Building',
    'HVAC Systems', 'Climate Control', 'Energy Efficiency', 'Smart Climate',
    'Interior Design', 'Custom Furniture', 'Space Planning', '3D Design',
    'Carpentry', 'Woodworking', 'Cabinet Making', 'Custom Millwork',
    'IoT Systems', 'Home Automation', 'AI Integration', 'Smart Buildings',
    'Welding', 'Fabrication', 'Metal Working', 'Precision Manufacturing',
  ];

  // Get user location for personalized job matching
  useEffect(() => {
    if (navigator.geolocation && authState.isAuthenticated) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }
  }, [isAuthenticated]);

  // Fetch enhanced data when component mounts
  useEffect(() => {
    if (authState.isAuthenticated) {
      fetchUserPerformance();
      fetchMyBids();
      fetchBiddingJobs();
    }
  }, [authState.isAuthenticated]);

  // Responsive view mode adjustment
  useEffect(() => {
    if (isMobile && viewMode === 'grid') {
      setViewMode('list');
    }
  }, [isMobile, viewMode]);

  // Enhanced search with AI-powered matching
  const handleSearch = useCallback(async () => {
    console.log('🔍 Search initiated:', { searchQuery, selectedCategory, sortBy });
    setShowSampleData(false);
    setAnimateCards(true);
    
    const searchParams = {
      search: searchQuery.trim(),
      category: selectedCategory,
      sortBy,
      remote: onlyRemote,
      urgent: onlyUrgent,
      featured: onlyFeatured,
      experience: experienceLevel,
      jobType,
      minSalary: salaryRange[0],
      maxSalary: salaryRange[1],
      skills: selectedSkills,
      location: userPosition,
      page: 1,
    };

    try {
      // For now, let's use the sample data and filter it
      let filteredJobs = [...creativeJobOpportunities];
      
      // Apply search filter
      if (searchQuery.trim()) {
        filteredJobs = filteredJobs.filter(job => 
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      
      // Apply category filter
      if (selectedCategory) {
        filteredJobs = filteredJobs.filter(job => 
          job.skills.some(skill => skill.toLowerCase().includes(selectedCategory.toLowerCase()))
        );
      }
      
      // Apply urgent filter
      if (onlyUrgent) {
        filteredJobs = filteredJobs.filter(job => job.urgency === 'high');
      }
      
      // Apply featured filter
      if (onlyFeatured) {
        filteredJobs = filteredJobs.filter(job => job.featured);
      }
      
      console.log('📊 Filtered jobs:', filteredJobs.length);
      
      // Update the jobs state with filtered results
      // For now, we'll use a simple state update since Redux might not be connected
      setMatchingJobs(filteredJobs);
      
      // Try Redux dispatch if available
      try {
        const newFilters = { ...filters, ...searchParams };
        dispatch(setFilters(newFilters));
        dispatch(fetchJobs(newFilters));
      } catch (reduxError) {
        console.log('Redux not available, using local state:', reduxError);
      }
      
      // Analytics tracking
      if (typeof gtag !== 'undefined') {
        gtag('event', 'job_search', {
          search_term: searchQuery,
          category: selectedCategory,
          skills_count: selectedSkills.length,
          filters_applied: Object.keys(searchParams).filter(key => searchParams[key]).length,
        });
      }
      
      // Personalized recommendations based on user profile
      if (authState.isAuthenticated && user) {
        generatePersonalizedRecommendations();
        analyzeCareerGrowth();
        identifySkillGaps();
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  }, [searchQuery, selectedCategory, sortBy, onlyRemote, onlyUrgent, onlyFeatured, experienceLevel, jobType, salaryRange, selectedSkills, userPosition, filters, dispatch, isAuthenticated, user]);

  // Generate personalized job recommendations
  const generatePersonalizedRecommendations = useCallback(() => {
    if (!user) return;
    
    // Mock AI-powered recommendations based on user profile
    const userSkills = user.skills || [];
    const userExperience = user.experience || 'mid';
    const userLocation = user.location || 'Remote';
    
    const recommendations = creativeJobOpportunities.filter(job => {
      const skillMatch = job.skills.some(skill => 
        userSkills.some(userSkill => 
          skill.toLowerCase().includes(userSkill.toLowerCase()) ||
          userSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      const experienceMatch = job.experience === userExperience || 
        (userExperience === 'expert' && ['senior', 'mid'].includes(job.experience)) ||
        (userExperience === 'senior' && job.experience === 'mid');
      
      return skillMatch && experienceMatch;
    });
    
    setPersonalizedRecommendations(recommendations);
  }, [user]);

  // Analyze career growth opportunities
  const analyzeCareerGrowth = useCallback(() => {
    if (!user) return;
    
    const insights = {
      currentLevel: user.experience || 'mid',
      nextLevel: user.experience === 'entry' ? 'mid' : user.experience === 'mid' ? 'senior' : 'expert',
      avgSalaryIncrease: user.experience === 'entry' ? '35%' : user.experience === 'mid' ? '28%' : '22%',
      timeToPromotion: user.experience === 'entry' ? '18 months' : user.experience === 'mid' ? '2-3 years' : '3-5 years',
      recommendedSkills: ['Smart Home Tech', 'Project Management', 'Advanced Certification'],
      marketDemand: 'Very High',
      growthPotential: user.experience === 'entry' ? 'Excellent' : user.experience === 'mid' ? 'Strong' : 'Moderate',
    };
    
    setCareerInsights(insights);
  }, [user]);

  // Identify skill gaps for career advancement
  const identifySkillGaps = useCallback(() => {
    if (!user) return;
    
    const userSkills = user.skills || [];
    const demandedSkills = ['Smart Home Integration', 'IoT Systems', 'Project Management', 'Renewable Energy', 'AI Integration'];
    
    const gaps = demandedSkills.filter(skill => 
      !userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );
    
    setSkillGaps(gaps);
  }, [user]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('');
    setSortBy('relevance');
    setOnlyRemote(false);
    setOnlyUrgent(false);
    setOnlyFeatured(false);
    setExperienceLevel('');
    setJobType('');
    setSalaryRange([0, 200]);
    setSelectedSkills([]);
    setShowSampleData(true);
    dispatch(setFilters({}));
  }, [dispatch]);

  const toggleSaveJob = useCallback(async (jobId) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/jobs/${jobId}` } });
      return;
    }
    
    try {
      const isCurrentlySaved = savedJobs.some(saved => saved.id === jobId || saved._id === jobId);
      
      if (isCurrentlySaved) {
        await dispatch(unsaveJobFromServer(jobId));
      } else {
        await dispatch(saveJobToServer(jobId));
      }
      
      // Refresh saved jobs list to reflect latest server state
      await dispatch(fetchSavedJobs());
    } catch (error) {
      console.error('Failed to toggle save job:', error);
    }
  }, [isAuthenticated, navigate, savedJobs, dispatch]);

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            searchRef.current?.querySelector('input')?.focus();
            break;
          case 'f':
            e.preventDefault();
            setFilterDialog(true);
            break;
          case 's':
            e.preventDefault();
            handleSearch();
            break;
          default:
            break;
        }
      }
      if (e.key === 'Escape') {
        setFilterDialog(false);
        setShowAdvancedFilters(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleSearch]);

  // Auto-save user preferences
  useEffect(() => {
    if (authState.isAuthenticated) {
      const preferences = {
        viewMode,
        sortBy,
        salaryRange,
        selectedSkills,
        experienceLevel,
        jobType,
      };
      localStorage.setItem('workerJobSearchPreferences', JSON.stringify(preferences));
    }
  }, [viewMode, sortBy, salaryRange, selectedSkills, experienceLevel, jobType, isAuthenticated]);

  // Load saved preferences
  useEffect(() => {
    if (authState.isAuthenticated) {
      try {
        const saved = localStorage.getItem('workerJobSearchPreferences');
        if (saved) {
          const preferences = JSON.parse(saved);
          setViewMode(preferences.viewMode || (isMobile ? 'list' : 'grid'));
          setSortBy(preferences.sortBy || 'relevance');
          setSalaryRange(preferences.salaryRange || [0, 200]);
          setSelectedSkills(preferences.selectedSkills || []);
          setExperienceLevel(preferences.experienceLevel || '');
          setJobType(preferences.jobType || '');
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    }
  }, [authState.isAuthenticated, isMobile]);

  // Initialize personalized features for authenticated users
  useEffect(() => {
    if (authState.isAuthenticated && user && isAuthenticated) {
      generatePersonalizedRecommendations();
      analyzeCareerGrowth();
      identifySkillGaps();
    }
  }, [authState.isAuthenticated, user, isAuthenticated, generatePersonalizedRecommendations, analyzeCareerGrowth, identifySkillGaps]);

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
                      backgroundColor: alpha('#ffffff', 0.1),
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
              <Button
                variant="contained"
                onClick={() => {
                  console.log('🔍 Search button clicked!');
                  handleSearch();
                }}
                fullWidth
                startIcon={<SearchIcon />}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                  },
                }}
              >
                Find Jobs
              </Button>
              
              {/* Test Navigation Button */}
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  console.log('🧪 Test navigation to application form');
                  navigate('/jobs/1/apply');
                }}
                sx={{ mt: 1 }}
              >
                Test Apply
              </Button>
              
              {/* Test Search Button */}
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  console.log('🧪 Test search functionality');
                  setSearchQuery('electrical');
                  handleSearch();
                }}
                sx={{ mt: 1 }}
              >
                Test Search
              </Button>
              
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
          trending={job.matchScore >= 90}
          matchScore={job.matchScore}
          elevation={job.featured ? 12 : 4}
          sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          <CardContent sx={{ 
            p: 3, 
            pt: job.featured && job.premium ? 7 : job.featured || job.premium ? 5 : 3,
            pb: 2,
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column'
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
                    ${job.budget?.min || 'N/A'}-{job.budget?.max || 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    per {job.budget?.type || 'N/A'}
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

          <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<VisibilityIcon />}
                onClick={() => {
                  console.log('🔍 View Details clicked for job:', job.id);
                  navigate(`/jobs/${job.id}`);
                }}
                sx={{ flex: 1 }}
              >
                View Details
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<HandshakeIcon />}
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
                  flex: 1,
                  borderColor: theme.palette.secondary.main,
                  color: theme.palette.secondary.main,
                  '&:hover': {
                    borderColor: theme.palette.secondary.dark,
                    backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                  }
                }}
              >
                {authState.isAuthenticated ? 'Apply Now' : 'Sign In to Apply'}
              </Button>
            </Box>
            <IconButton 
              color="primary"
              size="small"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: job.title,
                    text: `Check out this job opportunity: ${job.title} at ${job.company.name}`,
                    url: window.location.href
                  });
                } else {
                  // Fallback: copy to clipboard
                  navigator.clipboard.writeText(`${job.title} at ${job.company.name} - ${window.location.origin}/jobs/${job.id}`);
                  console.log('Job link copied to clipboard');
                }
              }}
            >
              <ShareIcon />
            </IconButton>
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
          <TileLayer url={EXTERNAL_SERVICES.OPENSTREETMAP.TILES} />
          
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
                      ${job.budget?.min || 'N/A'}-{job.budget?.max || 'N/A'}/{job.budget?.type || 'N/A'}
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
        {/* Authentication Notice */}
        {!authState.isAuthenticated && (
          <Alert 
            severity="info" 
            sx={{ 
              borderRadius: 0,
              '& .MuiAlert-message': {
                width: '100%',
                textAlign: 'center'
              }
            }}
          >
            <Typography variant="body2">
              <strong>Sign in to apply for jobs!</strong> Create an account or log in to start applying for opportunities.
            </Typography>
          </Alert>
        )}
        
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
              Search Results ({matchingJobs.length > 0 ? matchingJobs.length : jobs.length} jobs found)
            </Typography>
            <Grid container spacing={3}>
              {(matchingJobs.length > 0 ? matchingJobs : jobs).map((job, index) => renderJobCard(job, index))}
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
