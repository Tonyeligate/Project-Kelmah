/**
 * JobsPage - Main Jobs Listing Page
 *
 * DATA FLOW MAP:
 * ================================================================================
 *
 * 1. JOB LISTINGS FETCH
 *    UI Component: JobsPage.jsx (this file)
 *    ↓
 *    Service: jobsService.getJobs()
 *    Location: kelmah-frontend/src/modules/jobs/services/jobsService.js
 *    ↓
 *    API Call: GET /api/jobs?status=open&category={}&location={}&search={}
 *    Backend: kelmah-backend/services/job-service/routes/jobRoutes.js
 *    ↓
 *    Response: { success: true, items: [...], total: 12, page: 1 }
 *    ↓
 *    Transform: transformJobListItem() - handles employer data mapping
 *    ↓
 *    State Update: setJobs(transformedData)
 *    ↓
 *    UI Render: Job cards displayed with employer info, badges, filters
 *
 * 2. SEARCH/FILTER FLOW
 *    User Input: SearchFilters component (search bar, dropdowns)
 *    ↓
 *    State: searchQuery, selectedCategory, selectedLocation
 *    ↓
 *    useEffect: Triggers API refetch when filters change
 *    ↓
 *    Re-renders: filteredJobs → uniqueJobs (deduplicated) → UI
 *
 * 3. JOB CARD CLICK
 *    User Action: Click on job card
 *    ↓
 *    Navigation: navigate(`/jobs/${job._id}`)
 *    ↓
 *    Route: /jobs/:id → JobDetailsPage.jsx
 *
 * 4. APPLY BUTTON CLICK
 *    User Action: Click "Apply Now"
 *    ↓
 *    Auth Check: useAuthCheck() hook
 *    ↓
 *    If not authenticated: navigate('/login', { state: { from, message } })
 *    If authenticated: navigate(`/jobs/${job.id}/apply`)
 *    ↓
 *    Route: /jobs/:id/apply → JobApplicationForm.jsx
 *
 * EMPLOYER DATA ISSUE TRACKING:
 * ================================================================================
 * Issue: API returns "hirer": null and "hirer_name": "Unknown"
 * Root Cause: Backend database lacks employer population
 * Frontend Fix: transformJobListItem() now handles multiple fallbacks:
 *   1. Full hirer object (preferred)
 *   2. hirer_name string
 *   3. company/companyName fields
 *   4. Fallback: "Employer Name Pending" with _isFallback + _needsAdminReview flags
 *
 * Backend TODO: Add .populate('hirer') in job-service jobController.js
 * Location: kelmah-backend/services/job-service/controllers/jobController.js
 * Action: Add .populate('hirer', 'name logo verified rating') to Job.find()
 */

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import prefetchLazyIcons from '@/utils/prefetchLazyIcons';
import HeroFiltersSection from '../components/HeroFiltersSection';
import JobResultsSection from '../components/JobResultsSection';
import tradeCategoriesData from '../data/tradeCategories.json';
import ghanaLocations from '../data/ghanaLocations.json';
import { useJobsQuery } from '../hooks/useJobsQuery';
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
// Core icons loaded immediately for first paint
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Work as WorkIcon,
  CheckCircle,
  Group,
  Star,
  LocationOn,
  MonetizationOn,
  Verified,
  ElectricalServices as ElectricalIcon,
  Plumbing as PlumbingIcon,
  Construction as ConstructionIcon,
  Thermostat as HvacIcon,
  Handyman as CarpenterIcon,
  Home as HomeIcon,
  LocalFireDepartment as WhatshotIcon,
  Psychology as PsychologyIcon,
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon,
  FlashOn as FlashOnIcon,
  LocalFireDepartment as FireIcon,
  Visibility,
  BookmarkBorder,
  Share,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

// Lazy-load non-critical icons to reduce initial bundle
const LazyIcons = {
  ElectricalServices: React.lazy(
    () => import('@mui/icons-material/ElectricalServices'),
  ),
  Plumbing: React.lazy(() => import('@mui/icons-material/Plumbing')),
  Handyman: React.lazy(() => import('@mui/icons-material/Handyman')),
  Construction: React.lazy(() => import('@mui/icons-material/Construction')),
  Thermostat: React.lazy(() => import('@mui/icons-material/Thermostat')),
  RoofingSharp: React.lazy(() => import('@mui/icons-material/RoofingSharp')),
  FormatPaint: React.lazy(() => import('@mui/icons-material/FormatPaint')),
  Build: React.lazy(() => import('@mui/icons-material/Build')),
  Refresh: React.lazy(() => import('@mui/icons-material/Refresh')),
  FlashOn: React.lazy(() => import('@mui/icons-material/FlashOn')),
  LocalFireDepartment: React.lazy(
    () => import('@mui/icons-material/LocalFireDepartment'),
  ),
  Visibility: React.lazy(() => import('@mui/icons-material/Visibility')),
  BookmarkBorder: React.lazy(
    () => import('@mui/icons-material/BookmarkBorder'),
  ),
  Share: React.lazy(() => import('@mui/icons-material/Share')),
};
import { motion, AnimatePresence } from 'framer-motion';
import { styled, keyframes } from '@mui/material/styles';
import { format, formatDistanceToNow } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
// Auth state via Redux only
// import useAuth from '../../auth/hooks/useAuth';
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
import { InteractiveJobCard as JobCard } from '../../common/components/cards';
import { useNavigate } from 'react-router-dom';
import { useAuthCheck } from '../../../hooks/useAuthCheck';
import BreadcrumbNavigation from '../../../components/common/BreadcrumbNavigation';

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

// Animated Stat Card Component with CountUp
const AnimatedStatCard = ({ value, suffix = '', label, isLive = false }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <Paper
      ref={ref}
      sx={{
        p: { xs: 2, sm: 2.5, md: 3 }, // ✅ Responsive padding
        textAlign: 'center',
        bgcolor: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(212,175,55,0.2)',
        minHeight: { xs: '120px', sm: '140px', md: '160px' }, // ✅ Responsive min-height
        display: 'flex', // ✅ Better centering
        flexDirection: 'column',
        justifyContent: 'center',
        '&:hover': {
          border: '1px solid #D4AF37',
          boxShadow: '0 8px 32px rgba(212,175,55,0.2)',
          transform: { xs: 'none', sm: 'translateY(-4px)' }, // ✅ Desktop-only hover
        },
        transition: 'all 0.3s ease-in-out',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated glow effect on hover */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background:
            'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)',
          transition: 'left 0.5s ease-in-out',
          '.MuiPaper-root:hover &': {
            left: '100%',
          },
        }}
      />

      <Typography
        variant="h3"
        sx={{
          color: '#D4AF37',
          fontWeight: 'bold',
          mb: { xs: 0.5, sm: 0.75, md: 1 }, // ✅ Responsive margin
          fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' }, // ✅ Responsive font size
          position: 'relative',
          zIndex: 1,
        }}
      >
        {inView ? (
          <CountUp
            end={value}
            duration={2.5}
            separator=","
            suffix={suffix}
            useEasing={true}
          />
        ) : (
          '0'
        )}
      </Typography>

      <Typography
        variant="body1"
        sx={{
          color: 'rgba(255,255,255,0.8)',
          fontWeight: 'medium',
          fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }, // ✅ Responsive font size
          position: 'relative',
          zIndex: 1,
        }}
      >
        {label}
      </Typography>

      {/* Live indicator for real-time stats */}
      {isLive && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: '#4ade80',
              boxShadow: '0 0 8px #4ade80',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  opacity: 1,
                },
                '50%': {
                  opacity: 0.5,
                },
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: '#4ade80',
              fontSize: '0.65rem',
              fontWeight: 'medium',
            }}
          >
            LIVE
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

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
    demandLevel: 'Very High',
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
    demandLevel: 'High',
  },
  {
    name: 'Construction',
    icon: <ConstructionIcon />,
    count: 28560,
    color: '#E74C3C',
    description: 'Building, renovation & infrastructure projects',
    growth: '+15%',
    avgSalary: '$72,000',
    demandLevel: 'Very High',
  },
  {
    name: 'HVAC',
    icon: <HvacIcon />,
    count: 9340,
    color: '#2ECC71',
    description: 'Climate control, energy efficiency & smart systems',
    growth: '+20%',
    avgSalary: '$70,000',
    demandLevel: 'High',
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
    demandLevel: 'Moderate',
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
    demandLevel: 'Explosive',
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
    demandLevel: 'Very High',
  },
  {
    name: 'Design',
    icon: <PsychologyIcon />,
    count: 8920,
    color: '#E67E22',
    description: 'Interior design, space planning & creative solutions',
    growth: '+16%',
    avgSalary: '$62,000',
    demandLevel: 'High',
  },
];

const CATEGORY_ICON_MAP = {
  Electrical: ElectricalIcon,
  Plumbing: PlumbingIcon,
  Carpentry: CarpenterIcon,
  HVAC: HvacIcon,
  Construction: ConstructionIcon,
  Painting: WorkIcon,
  Roofing: WorkIcon,
  Masonry: WorkIcon,
  '': WorkIcon,
};

const tradeCategories = tradeCategoriesData.map((category) => ({
  ...category,
  icon: CATEGORY_ICON_MAP[category.value] || WorkIcon,
}));

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
  const { isAuthenticated, user } = useSelector((state) => state.auth);
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
  const [platformStats, setPlatformStats] = useState({
    availableJobs: 0,
    activeEmployers: 0,
    skilledWorkers: 0,
    successRate: 0,
    loading: true,
  });
  const hasPrefetchedLazyIcons = useRef(false);
  // Ghana-aware helpers for better UX and ranking
  const GHANA_REGIONS = [
    'Greater Accra',
    'Ashanti',
    'Western',
    'Eastern',
    'Central',
    'Volta',
    'Northern',
    'Upper East',
    'Upper West',
    'Bono',
  ];
  const GHANA_CITIES = [
    'Accra',
    'Kumasi',
    'Tema',
    'Takoradi',
    'Tamale',
    'Ho',
    'Koforidua',
    'Cape Coast',
    'Sunyani',
    'Wa',
  ];
  const SKILL_MATCHING_WEIGHTS = {
    exact: 100,
    related: 60,
    category: 40,
    location: 30,
  };

  // Helper function to get category icon (using WorkIcon as universal fallback for now)
  // Lazy-loaded icons are handled by JobResultsSection component
  const getCategoryIcon = (category) => {
    // Use WorkIcon as default to ensure fast first paint
    return WorkIcon;
  };

  const jobsQueryFilters = useMemo(
    () => ({
      status: 'open',
      search: searchQuery || undefined,
      category: selectedCategory || undefined,
      location: selectedLocation || undefined,
      min_budget: budgetRange?.[0],
      max_budget: budgetRange?.[1],
      limit: 50,
    }),
    [searchQuery, selectedCategory, selectedLocation, budgetRange],
  );

  const {
    data: jobsResponse,
    isLoading: isJobsLoading,
    isFetching: isJobsFetching,
    error: jobsQueryError,
  } = useJobsQuery(jobsQueryFilters, { keepPreviousData: true });

  useEffect(() => {
    const hasDataArray = (payload) =>
      Array.isArray(payload)
        ? payload
        : payload?.jobs || payload?.data || [];

    if (jobsResponse) {
      const normalizedJobs = hasDataArray(jobsResponse);
      console.log('✅ Jobs loaded via React Query:', normalizedJobs.length);
      setJobs(normalizedJobs);
      return;
    }

    if (!isJobsLoading && !jobsResponse) {
      setJobs([]);
    }
  }, [jobsResponse, isJobsLoading]);

  useEffect(() => {
    if (jobsQueryError) {
      console.error('❌ Error fetching jobs via React Query:', jobsQueryError);
      setError(
        `Failed to load jobs: ${jobsQueryError.message || 'Unknown error'}`,
      );
      return;
    }
    if (!isJobsLoading && !isJobsFetching) {
      setError(null);
    }
  }, [jobsQueryError, isJobsLoading, isJobsFetching]);

  useEffect(() => {
    setLoading(isJobsLoading && !jobsResponse);
  }, [isJobsLoading, jobsResponse]);

  // Warm non-critical icon bundles once hero content settles to avoid accordion flashes later
  useEffect(() => {
    if (hasPrefetchedLazyIcons.current || loading) {
      return undefined;
    }

    const cancelPrefetch = prefetchLazyIcons(LazyIcons);
    hasPrefetchedLazyIcons.current = true;
    return () => cancelPrefetch?.();
  }, [loading]);

  // Fetch platform statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('📊 Fetching platform statistics...');
        // Use hardcoded fallback stats since /jobs/stats endpoint may not exist on backend
        // TODO: Implement proper /jobs/stats endpoint on job-service
        setPlatformStats({
          availableJobs: jobs?.length || 0,
          activeEmployers: 50,
          skilledWorkers: 200,
          successRate: 95,
          loading: false,
        });
      } catch (err) {
        console.error('❌ Failed to fetch platform stats:', err);
        // Fallback to reasonable defaults if API fails
        setPlatformStats({
          availableJobs: 0,
          activeEmployers: 0,
          skilledWorkers: 0,
          successRate: 0,
          loading: false,
        });
      }
    };

    fetchStats();

    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // Empty dependency - only fetch once on mount and then refresh via interval

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
      return (
        fallback || (
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
        )
      );
    }

    return children;
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.employer?.name &&
        job.employer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (job.skills &&
        job.skills.some((skill) =>
          skill.toLowerCase().includes(searchQuery.toLowerCase()),
        ));

    const matchesCategory =
      !selectedCategory || job.category === selectedCategory;
    const matchesLocation =
      !selectedLocation ||
      (job.location?.city && job.location.city.includes(selectedLocation)) ||
      (typeof job.location === 'string' &&
        job.location.includes(selectedLocation));

    return matchesSearch && matchesCategory && matchesLocation;
  });

  // Deduplicate jobs by ID to prevent showing same job multiple times
  const uniqueJobs = Array.from(
    new Map(filteredJobs.map((job) => [job.id, job])).values(),
  );

  return (
    <ErrorBoundary>
      <Box sx={{ bgcolor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation />

        <Container maxWidth="xl" sx={{ py: 0, pt: 1 }}>
          <Helmet>
            <title>
              Find Skilled Trade Jobs - Kelmah | Ghana's Premier Job Platform
            </title>
            <meta
              name="description"
              content="Discover high-paying skilled trade opportunities across Ghana. Connect with top employers in electrical, plumbing, carpentry, HVAC, and construction."
            />
          </Helmet>

          {/* Hero Section & Filter System - Directly Below Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Box
              sx={{
                mb: { xs: 2, md: 4 },
                mt: { xs: 1, md: 0 },
                px: { xs: 1, sm: 0 },
              }}
            >
              {/* Mobile-optimized hero section */}
              <Grid container spacing={{ xs: 2, md: 3 }} alignItems="center">
                {/* Left Side - Hero Text */}
                <Grid item xs={12} md={4}>
                  <Box
                    sx={{
                      textAlign: { xs: 'center', md: 'left' },
                      px: { xs: 1, sm: 0 },
                    }}
                  >
                    <Typography
                      variant="h4"
                      component="h1"
                      sx={{
                        fontWeight: 'bold',
                        background:
                          'linear-gradient(45deg, #D4AF37 30%, #FFD700 90%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: { xs: 0.5, md: 1 },
                        fontSize: {
                          xs: '1.35rem', // ✅ Increased from 1.25rem for better mobile readability
                          sm: '1.65rem', // ✅ Increased from 1.5rem
                          md: '2rem',
                          lg: '2.25rem',
                        },
                        lineHeight: { xs: 1.3, md: 1.3 }, // ✅ Better line spacing on mobile
                        wordWrap: 'break-word', // ✅ Prevent text overflow
                      }}
                    >
                      {isSmallMobile
                        ? 'Find Trade Jobs'
                        : 'Find Your Next Trade Opportunity'}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' }, // ✅ Improved readability
                        lineHeight: { xs: 1.5, md: 1.5 }, // ✅ Better line spacing
                        maxWidth: { xs: '100%', md: '90%' },
                        wordWrap: 'break-word', // ✅ Prevent overflow
                      }}
                    >
                      {isSmallMobile
                        ? 'Connect with top employers in Ghana'
                        : "Connect with Ghana's top employers and advance your skilled trades career"}
                    </Typography>
                  </Box>
                </Grid>

                {/* Right Side - Expanded Filter System */}
                <Grid item xs={12} md={8}>
                  <Paper
                    elevation={8}
                    sx={{
                      p: { xs: 1.5, sm: 2 }, // ✅ Reduced padding on mobile
                      bgcolor: 'rgba(255,255,255,0.05)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(212,175,55,0.2)',
                      borderRadius: { xs: 2, sm: 2 },
                      mx: { xs: 1, sm: 0 }, // ✅ Add horizontal margin on mobile
                    }}
                  >
                    <Grid
                      container
                      spacing={{ xs: 1.5, sm: 2 }}
                      alignItems="stretch"
                      sx={{
                        // Ensure proper alignment and prevent overflow
                        width: '100%',
                        margin: 0,
                      }}
                    >
                      <Grid item xs={12} sm={5}>
                        <TextField
                          fullWidth
                          size="small" // ✅ Changed from conditional to always "small" for consistency
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              console.log('🔍 Search triggered via Enter key!');
                              // Search is already triggered by state change
                            }
                          }}
                          placeholder={
                            isSmallMobile
                              ? 'Search jobs...'
                              : 'Search jobs, skills, companies...'
                          }
                          inputProps={{
                            'aria-label':
                              'Search for jobs, skills, or companies',
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              height: { xs: '44px', sm: '40px' }, // ✅ Larger touch target on mobile (44px is Apple's recommended minimum)
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
                              fontSize: { xs: '0.95rem', sm: '0.875rem' }, // ✅ Larger text on mobile
                              padding: { xs: '10px 14px', sm: '8.5px 14px' }, // ✅ Comfortable padding
                              '&::placeholder': {
                                color: 'rgba(255,255,255,0.6)',
                                opacity: 1,
                              },
                            },
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon
                                  sx={{
                                    color: '#D4AF37',
                                    fontSize: { xs: '1.2rem', sm: '1rem' },
                                  }}
                                />
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
                              fontSize: { xs: '0.8rem', sm: '0.75rem' }, // ✅ Slightly larger on mobile
                              transform: 'translate(14px, -9px) scale(0.85)',
                              '&.Mui-focused': {
                                color: '#D4AF37',
                              },
                            }}
                          >
                            Trade Category
                          </InputLabel>
                          <Select
                            value={selectedCategory}
                            onChange={(e) =>
                              setSelectedCategory(e.target.value)
                            }
                            displayEmpty
                            inputProps={{
                              'aria-label': 'Select trade category',
                            }}
                            sx={{
                              color: 'white',
                              fontSize: { xs: '0.9rem', sm: '0.875rem' }, // ✅ Larger text on mobile
                              height: { xs: '44px', sm: '40px' }, // ✅ Match TextField height
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(212,175,55,0.3)',
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#D4AF37',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline':
                              {
                                borderColor: '#D4AF37',
                              },
                              '& .MuiSvgIcon-root': {
                                color: '#D4AF37',
                              },
                              '& .MuiSelect-select': {
                                // ✅ Proper padding for mobile touch
                                padding: { xs: '10px 14px', sm: '8.5px 14px' },
                              },
                            }}
                          >
                            {tradeCategories.map((category) => (
                              <MenuItem
                                key={category.value}
                                value={category.value}
                              >
                                <Box
                                  sx={{ display: 'flex', alignItems: 'center' }}
                                >
                                  <category.icon
                                    sx={{
                                      mr: 1,
                                      color: '#D4AF37',
                                      fontSize: 18,
                                    }}
                                  />
                                  <Typography variant="body2">
                                    {category.label}
                                  </Typography>
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
                              fontSize: { xs: '0.8rem', sm: '0.75rem' }, // ✅ Slightly larger on mobile
                              transform: 'translate(14px, -9px) scale(0.85)',
                              '&.Mui-focused': {
                                color: '#D4AF37',
                              },
                            }}
                          >
                            Location
                          </InputLabel>
                          <Select
                            value={selectedLocation}
                            onChange={(e) =>
                              setSelectedLocation(e.target.value)
                            }
                            displayEmpty
                            inputProps={{
                              'aria-label': 'Select location',
                            }}
                            sx={{
                              color: 'white',
                              fontSize: { xs: '0.9rem', sm: '0.875rem' }, // ✅ Larger text on mobile
                              height: { xs: '44px', sm: '40px' }, // ✅ Match TextField height
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(212,175,55,0.3)',
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#D4AF37',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline':
                              {
                                borderColor: '#D4AF37',
                              },
                              '& .MuiSvgIcon-root': {
                                color: '#D4AF37',
                              },
                              '& .MuiSelect-select': {
                                // ✅ Proper padding for mobile touch
                                padding: { xs: '10px 14px', sm: '8.5px 14px' },
                              },
                            }}
                          >
                            {ghanaLocations.map((location) => (
                              <MenuItem
                                key={location.value}
                                value={location.value}
                              >
                                <Typography variant="body2">
                                  {location.label}
                                </Typography>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={2}
                        sx={{
                          display: 'flex',
                          alignItems: 'stretch', // Stretch to match height
                        }}
                      >
                        <Tooltip title="Search for jobs" placement="top">
                          <Button
                            fullWidth
                            variant="contained"
                            size="medium"
                            startIcon={<SearchIcon />}
                            onClick={() => {
                              console.log('🔍 Search triggered!');
                              // Trigger re-fetch with current filters
                              // The useEffect will automatically trigger with updated state
                            }}
                            sx={{
                              bgcolor: '#D4AF37',
                              color: 'black',
                              fontWeight: 'bold',
                              fontSize: { xs: '0.9rem', sm: '0.875rem' }, // ✅ Slightly larger on mobile
                              height: { xs: '44px', sm: '40px' }, // ✅ Match other elements (44px for mobile touch)
                              minWidth: { xs: '100%', sm: 'auto' },
                              padding: { xs: '10px 20px', sm: '8px 12px' }, // ✅ More comfortable mobile padding
                              boxShadow: '0 4px 12px rgba(212,175,55,0.4)',
                              whiteSpace: 'nowrap',
                              '&:hover': {
                                bgcolor: '#B8941F',
                                boxShadow: '0 6px 16px rgba(212,175,55,0.6)',
                                transform: {
                                  xs: 'none',
                                  sm: 'translateY(-2px)',
                                }, // ✅ Disable transform on mobile
                              },
                              transition: 'all 0.3s ease',
                              // Ensure button stays within bounds
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              // ✅ Better mobile touch feedback
                              '&:active': {
                                transform: 'scale(0.98)',
                              },
                            }}
                          >
                            Search
                          </Button>
                        </Tooltip>
                      </Grid>
                    </Grid>

                    {/* Advanced Filters Toggle - Compact */}
                    <Box sx={{ mt: { xs: 1, sm: 1 }, textAlign: 'center' }}>
                      <Button
                        startIcon={<FilterListIcon />}
                        onClick={() => setShowFilters(!showFilters)}
                        size="small"
                        sx={{
                          color: '#D4AF37',
                          fontSize: { xs: '0.8rem', sm: '0.75rem' }, // ✅ Responsive font size
                          padding: { xs: '6px 12px', sm: '4px 8px' }, // ✅ Better mobile padding
                          minHeight: { xs: '36px', sm: 'auto' }, // ✅ Minimum touch target
                          '&:hover': {
                            bgcolor: 'rgba(212,175,55,0.1)',
                          },
                        }}
                      >
                        {showFilters ? 'Hide' : 'Show'} Filters
                      </Button>
                    </Box>

                    {/* Advanced Filters - Compact */}
                    <Collapse in={showFilters}>
                      <Box
                        sx={{
                          mt: 2,
                          pt: 2,
                          borderTop: '1px solid rgba(212,175,55,0.2)',
                        }}
                      >
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography
                              variant="body2"
                              sx={{
                                mb: 1,
                                color: '#D4AF37',
                                fontWeight: 'bold',
                              }}
                            >
                              Salary Range (GHS)
                            </Typography>
                            <Slider
                              value={budgetRange}
                              onChange={(e, newValue) =>
                                setBudgetRange(newValue)
                              }
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
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                mt: 0.5,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ color: 'rgba(255,255,255,0.7)' }}
                              >
                                GHS {budgetRange[0]}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: 'rgba(255,255,255,0.7)' }}
                              >
                                GHS {budgetRange[1]}+
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography
                              variant="body2"
                              sx={{
                                mb: 1,
                                color: '#D4AF37',
                                fontWeight: 'bold',
                              }}
                            >
                              Quick Filters
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 0.5,
                              }}
                            >
                              <Chip
                                label="Urgent"
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: '#D4AF37',
                                  color: '#D4AF37',
                                  fontSize: '0.7rem',
                                  '&:hover': {
                                    bgcolor: 'rgba(212,175,55,0.1)',
                                  },
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
                                  '&:hover': {
                                    bgcolor: 'rgba(212,175,55,0.1)',
                                  },
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
                                  '&:hover': {
                                    bgcolor: 'rgba(212,175,55,0.1)',
                                  },
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
                                  '&:hover': {
                                    bgcolor: 'rgba(212,175,55,0.1)',
                                  },
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
            <Box
              sx={{
                mb: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  variant="h5"
                  sx={{ color: '#D4AF37', fontWeight: 'bold', mb: 1 }}
                >
                  Featured Opportunities
                </Typography>
                {(searchQuery || selectedCategory || selectedLocation) && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Typography
                      variant="body2"
                      sx={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      Active filters:
                    </Typography>
                    {searchQuery && (
                      <Chip
                        label={`Search: "${searchQuery}"`}
                        size="small"
                        onDelete={() => setSearchQuery('')}
                        sx={{
                          bgcolor: 'rgba(212,175,55,0.2)',
                          color: '#D4AF37',
                          '& .MuiChip-deleteIcon': { color: '#D4AF37' },
                        }}
                      />
                    )}
                    {selectedCategory && (
                      <Chip
                        label={`Category: ${selectedCategory}`}
                        size="small"
                        onDelete={() => setSelectedCategory('')}
                        sx={{
                          bgcolor: 'rgba(212,175,55,0.2)',
                          color: '#D4AF37',
                          '& .MuiChip-deleteIcon': { color: '#D4AF37' },
                        }}
                      />
                    )}
                    {selectedLocation && (
                      <Chip
                        label={`Location: ${selectedLocation}`}
                        size="small"
                        onDelete={() => setSelectedLocation('')}
                        sx={{
                          bgcolor: 'rgba(212,175,55,0.2)',
                          color: '#D4AF37',
                          '& .MuiChip-deleteIcon': { color: '#D4AF37' },
                        }}
                      />
                    )}
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip
                  label={`${uniqueJobs.length} Job${uniqueJobs.length !== 1 ? 's' : ''} Found`}
                  icon={<WorkIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    bgcolor: 'rgba(212,175,55,0.2)',
                    color: '#D4AF37',
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    px: 1,
                  }}
                />
              </Box>
            </Box>

            {loading && (
              <Box>
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <Grid item xs={12} sm={6} md={6} lg={4} xl={3} key={item}>
                      <Card
                        sx={{
                          height: '100%',
                          bgcolor: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(212,175,55,0.2)',
                          borderRadius: 2,
                          minHeight: 320,
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', mb: 2, gap: 2 }}>
                            <Skeleton
                              variant="circular"
                              width={40}
                              height={40}
                              sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                            />
                            <Box sx={{ flex: 1 }}>
                              <Skeleton
                                variant="text"
                                width="80%"
                                sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 1 }}
                              />
                              <Skeleton
                                variant="text"
                                width="50%"
                                sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                              />
                            </Box>
                          </Box>
                          <Skeleton
                            variant="text"
                            width="100%"
                            sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 1 }}
                          />
                          <Skeleton
                            variant="text"
                            width="90%"
                            sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 2 }}
                          />
                          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Skeleton
                              variant="rectangular"
                              width={70}
                              height={24}
                              sx={{
                                bgcolor: 'rgba(255,255,255,0.1)',
                                borderRadius: 1,
                              }}
                            />
                            <Skeleton
                              variant="rectangular"
                              width={70}
                              height={24}
                              sx={{
                                bgcolor: 'rgba(255,255,255,0.1)',
                                borderRadius: 1,
                              }}
                            />
                            <Skeleton
                              variant="rectangular"
                              width={70}
                              height={24}
                              sx={{
                                bgcolor: 'rgba(255,255,255,0.1)',
                                borderRadius: 1,
                              }}
                            />
                          </Box>
                          <Skeleton
                            variant="rectangular"
                            width="100%"
                            height={40}
                            sx={{
                              bgcolor: 'rgba(255,255,255,0.1)',
                              borderRadius: 1,
                              mt: 2,
                            }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {error && (
              <Box sx={{ py: 4 }}>
                <Paper
                  sx={{
                    p: 4,
                    bgcolor: 'rgba(244,67,54,0.1)',
                    border: '1px solid rgba(244,67,54,0.3)',
                    borderRadius: 2,
                    textAlign: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: 'rgba(244,67,54,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <Typography sx={{ fontSize: 48 }}>⚠️</Typography>
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ color: '#ff6b6b', mb: 2, fontWeight: 'bold' }}
                  >
                    Unable to Load Jobs
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}
                  >
                    {error}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => window.location.reload()}
                    sx={{
                      bgcolor: '#D4AF37',
                      color: 'black',
                      fontWeight: 'bold',
                      '&:hover': { bgcolor: '#B8941F' },
                    }}
                  >
                    Retry
                  </Button>
                </Paper>
              </Box>
            )}

            {!loading && !error && uniqueJobs.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Box
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.05)',
                    border: '2px dashed rgba(212,175,55,0.3)',
                    borderRadius: 3,
                    p: 6,
                    maxWidth: 600,
                    mx: 'auto',
                  }}
                >
                  <SearchIcon
                    sx={{ fontSize: 80, color: '#D4AF37', mb: 2, opacity: 0.5 }}
                  />
                  <Typography
                    variant="h5"
                    sx={{ color: '#D4AF37', mb: 2, fontWeight: 'bold' }}
                  >
                    No Jobs Found
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}
                  >
                    {searchQuery || selectedCategory || selectedLocation
                      ? "We couldn't find any jobs matching your search criteria. Try adjusting your filters or search terms."
                      : 'No jobs are currently available. Check back soon for new opportunities!'}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 2,
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    {(searchQuery || selectedCategory || selectedLocation) && (
                      <Button
                        variant="contained"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('');
                          setSelectedLocation('');
                        }}
                        sx={{
                          bgcolor: '#D4AF37',
                          color: 'black',
                          fontWeight: 'bold',
                          '&:hover': { bgcolor: '#B8941F' },
                        }}
                      >
                        Clear All Filters
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/hirer/jobs/post')}
                      sx={{
                        borderColor: '#D4AF37',
                        color: '#D4AF37',
                        '&:hover': {
                          borderColor: '#B8941F',
                          bgcolor: 'rgba(212,175,55,0.1)',
                        },
                      }}
                    >
                      Post a Job
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}

            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {!loading &&
                !error &&
                uniqueJobs.map((job, index) => (
                  <Grid item xs={12} sm={6} md={6} lg={4} xl={3} key={job.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ scale: isSmallMobile ? 1 : 1.02 }} // ✅ Disable scale on mobile
                    >
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          bgcolor: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(212,175,55,0.2)',
                          borderRadius: { xs: 2, sm: 2 }, // ✅ Consistent border radius
                          minHeight: { xs: '300px', sm: '320px' }, // ✅ Better mobile min-height
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                          mx: { xs: 1, sm: 0 }, // ✅ Add horizontal margin on mobile for better spacing
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background:
                              'linear-gradient(90deg, #D4AF37, #FFD700)',
                            transform: 'scaleX(0)',
                            transformOrigin: 'left',
                            transition: 'transform 0.3s ease',
                          },
                          '&:hover': {
                            border: '1px solid #D4AF37',
                            boxShadow: '0 12px 40px rgba(212,175,55,0.4)',
                            transform: { xs: 'none', sm: 'translateY(-4px)' }, // ✅ Disable transform on mobile
                            '&::before': {
                              transform: 'scaleX(1)',
                            },
                          },
                          // ✅ Mobile active state for better feedback
                          '&:active': {
                            transform: {
                              xs: 'scale(0.98)',
                              sm: 'translateY(-4px)',
                            },
                          },
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onClick={() => navigate(`/jobs/${job._id || job.id}`)}
                        role="article"
                        aria-label={`Job posting: ${job.title}`}
                      >
                        <CardContent
                          sx={{ flexGrow: 1, p: { xs: 2.5, sm: 3 } }}
                        >
                          {' '}
                          {/* ✅ Better mobile padding */}
                          {/* Job Header */}
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              mb: 2,
                              flexDirection: { xs: 'column', sm: 'row' },
                              gap: { xs: 1, sm: 0 },
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                flex: 1,
                              }}
                            >
                              {React.createElement(
                                getCategoryIcon(job.category),
                                {
                                  sx: {
                                    mr: 1,
                                    color: '#D4AF37',
                                    fontSize: { xs: 20, sm: 24 },
                                  },
                                },
                              )}
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant="h6"
                                  component="h2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: {
                                      xs: '1rem',
                                      sm: '1.1rem',
                                      md: '1.25rem',
                                    },
                                    lineHeight: { xs: 1.3, sm: 1.4 },
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: { xs: 2, sm: 1 },
                                    WebkitBoxOrient: 'vertical',
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
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                  }}
                                >
                                  {job.employer?.logo && (
                                    <Avatar
                                      src={job.employer.logo}
                                      alt={job.employer.name}
                                      sx={{
                                        width: 16,
                                        height: 16,
                                        mr: 0.5,
                                      }}
                                    />
                                  )}
                                  {job.employer?.name ||
                                    'Employer Name Pending'}
                                  {job.employer?.verified && (
                                    <Verified
                                      sx={{
                                        fontSize: 12,
                                        color: '#4CAF50',
                                        ml: 0.5,
                                      }}
                                    />
                                  )}
                                </Typography>
                              </Box>
                            </Box>
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'end',
                                gap: 0.5,
                              }}
                            >
                              {(job.urgent || job.proposalCount > 10) && (
                                <Tooltip
                                  title={
                                    job.urgent
                                      ? 'This job needs immediate attention'
                                      : 'High competition - many applicants'
                                  }
                                  arrow
                                  placement="left"
                                >
                                  <Chip
                                    label={job.urgent ? 'URGENT' : 'HOT'}
                                    size="small"
                                    icon={
                                      job.urgent ? (
                                        <FlashOnIcon sx={{ fontSize: 16 }} />
                                      ) : (
                                        <FireIcon sx={{ fontSize: 16 }} />
                                      )
                                    }
                                    sx={{
                                      bgcolor: job.urgent
                                        ? '#ff4444'
                                        : '#ff9800',
                                      color: 'white',
                                      fontWeight: 'bold',
                                      fontSize: '0.7rem',
                                      animation: 'pulse 2s infinite',
                                      '@keyframes pulse': {
                                        '0%, 100%': { opacity: 1 },
                                        '50%': { opacity: 0.7 },
                                      },
                                      cursor: 'help',
                                    }}
                                  />
                                </Tooltip>
                              )}
                              {job.verified && (
                                <Tooltip
                                  title="This employer has been verified by Kelmah"
                                  arrow
                                  placement="left"
                                >
                                  <Chip
                                    icon={<Verified sx={{ fontSize: 14 }} />}
                                    label="Verified"
                                    size="small"
                                    sx={{
                                      bgcolor: 'rgba(76,175,80,0.2)',
                                      color: '#4CAF50',
                                      border: '1px solid #4CAF50',
                                      fontSize: '0.7rem',
                                      cursor: 'help',
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          </Box>
                          {/* Job Details */}
                          <Box sx={{ mb: 2 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 1,
                              }}
                            >
                              <LocationOn
                                fontSize="small"
                                sx={{ mr: 1, color: '#D4AF37' }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'white',
                                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                }}
                              >
                                {job.location?.city
                                  ? `${job.location.city}${job.location.country ? ', ' + job.location.country : ''}`
                                  : typeof job.location === 'string'
                                    ? job.location
                                    : 'Remote/Flexible'}
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 1,
                              }}
                            >
                              <MonetizationOn
                                fontSize="small"
                                sx={{ mr: 1, color: '#D4AF37' }}
                              />
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                sx={{
                                  color: '#D4AF37',
                                  fontSize: { xs: '0.875rem', sm: '0.95rem' },
                                }}
                              >
                                {job?.budget
                                  ? typeof job?.budget === 'object'
                                    ? job.budget.min === job.budget.max ||
                                      !job.budget.max
                                      ? `GHS ${(job.budget.amount || job.budget.min)?.toLocaleString()}`
                                      : `GHS ${job.budget.min?.toLocaleString()} - ${job.budget.max?.toLocaleString()}`
                                    : `GHS ${job?.budget?.toLocaleString()}`
                                  : 'Negotiable'}
                              </Typography>
                              <Chip
                                label={job.paymentType || 'Fixed'}
                                size="small"
                                sx={{
                                  ml: 1,
                                  bgcolor: 'rgba(212,175,55,0.2)',
                                  color: '#D4AF37',
                                }}
                              />
                            </Box>

                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2,
                              }}
                            >
                              <Star
                                fontSize="small"
                                sx={{ mr: 1, color: '#D4AF37' }}
                              />
                              <Typography
                                variant="body2"
                                sx={{ color: 'white' }}
                              >
                                {job.rating || '4.5'} Rating •{' '}
                                {job.proposalCount || 0} Applicants
                              </Typography>
                            </Box>
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{ mb: 2, color: 'rgba(255,255,255,0.8)' }}
                          >
                            {job.description}
                          </Typography>
                          {/* Skills */}
                          <Box sx={{ mb: 2 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                mb: 1,
                                color: '#D4AF37',
                                fontWeight: 'bold',
                              }}
                            >
                              Required Skills:
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 0.5,
                              }}
                            >
                              {job.skills.slice(0, 3).map((skill, index) => (
                                <Chip
                                  key={index}
                                  label={skill}
                                  size="small"
                                  sx={{
                                    bgcolor: 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                  }}
                                />
                              ))}
                              {job.skills.length > 3 && (
                                <Chip
                                  label={`+${job.skills.length - 3} more`}
                                  size="small"
                                  sx={{
                                    bgcolor: 'rgba(212,175,55,0.2)',
                                    color: '#D4AF37',
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                          {/* Deadlines */}
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ color: 'rgba(255,255,255,0.6)' }}
                            >
                              Posted{' '}
                              {formatDistanceToNow(job.postedDate, {
                                addSuffix: true,
                              })}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: '#ff6b6b' }}
                            >
                              Apply by {format(job.deadline, 'MMM dd')}
                            </Typography>
                          </Box>
                        </CardContent>

                        <CardActions
                          sx={{
                            p: { xs: 2, sm: 3 }, // ✅ Better mobile padding
                            pt: 0,
                            gap: { xs: 1, sm: 0 }, // ✅ Add gap between buttons on mobile
                            flexWrap: { xs: 'wrap', sm: 'nowrap' }, // ✅ Allow wrapping on very small screens
                          }}
                        >
                          <Button
                            variant="contained"
                            fullWidth
                            onClick={() => {
                              console.log(
                                '📝 Apply Now clicked for job:',
                                job.id,
                              );
                              console.log('🔐 Auth state:', {
                                isAuthenticated: authState.isAuthenticated,
                                user: authState.user,
                                authState: authState,
                              });

                              if (!authState.isAuthenticated) {
                                console.log(
                                  '🔒 User not authenticated, redirecting to login',
                                );
                                navigate('/login', {
                                  state: {
                                    from: `/jobs/${job.id}/apply`,
                                    message:
                                      'Please sign in to apply for this job',
                                  },
                                });
                                return;
                              }

                              console.log(
                                '🚀 Navigating to application form:',
                                `/jobs/${job.id}/apply`,
                              );
                              navigate(`/jobs/${job.id}/apply`);
                            }}
                            sx={{
                              bgcolor: '#D4AF37',
                              color: 'black',
                              fontWeight: 'bold',
                              fontSize: { xs: '0.9rem', sm: '0.875rem' }, // ✅ Slightly larger on mobile
                              padding: { xs: '10px 16px', sm: '8px 16px' }, // ✅ Better mobile padding
                              minHeight: { xs: '44px', sm: '40px' }, // ✅ Touch-friendly height
                              '&:hover': {
                                bgcolor: '#B8941F',
                              },
                              // ✅ Mobile active feedback
                              '&:active': {
                                transform: 'scale(0.98)',
                              },
                            }}
                          >
                            Apply Now
                          </Button>
                          <IconButton
                            onClick={() => {
                              console.log(
                                '🔍 View Details clicked for job:',
                                job.id,
                              );
                              // Check if this is sample data (numeric ID) or real data (ObjectId)
                              if (typeof job.id === 'number') {
                                alert(
                                  'This is sample data. Please ensure the API is connected to view real job details.',
                                );
                                return;
                              }
                              navigate(`/jobs/${job.id}`);
                            }}
                            sx={{
                              color: '#D4AF37',
                              minWidth: { xs: '44px', sm: '40px' }, // ✅ Touch-friendly size
                              minHeight: { xs: '44px', sm: '40px' }, // ✅ Touch-friendly size
                              '&:hover': { bgcolor: 'rgba(212,175,55,0.1)' },
                              '&:active': { transform: 'scale(0.95)' }, // ✅ Active feedback
                            }}
                          >
                            <Visibility />
                          </IconButton>
                          <IconButton
                            onClick={() => {
                              console.log(
                                '🔖 Bookmark clicked for job:',
                                job.id,
                              );
                              if (!authState.isAuthenticated) {
                                navigate('/login', {
                                  state: {
                                    from: `/jobs/${job.id}`,
                                    message: 'Please sign in to save jobs',
                                  },
                                });
                                return;
                              }
                              // TODO: Implement bookmark functionality
                              console.log(
                                'Bookmark functionality to be implemented',
                              );
                            }}
                            sx={{
                              color: '#D4AF37',
                              minWidth: { xs: '44px', sm: '40px' }, // ✅ Touch-friendly size
                              minHeight: { xs: '44px', sm: '40px' }, // ✅ Touch-friendly size
                              '&:hover': { bgcolor: 'rgba(212,175,55,0.1)' },
                              '&:active': { transform: 'scale(0.95)' }, // ✅ Active feedback
                            }}
                          >
                            <BookmarkBorder />
                          </IconButton>
                          <IconButton
                            onClick={() => {
                              console.log('📤 Share clicked for job:', job.id);
                              if (navigator.share) {
                                navigator
                                  .share({
                                    title: job.title,
                                    text: `Check out this job opportunity: ${job.title} at ${job.company}`,
                                    url:
                                      window.location.origin +
                                      `/jobs/${job.id}`,
                                  })
                                  .catch((err) =>
                                    console.log('Error sharing:', err),
                                  );
                              } else {
                                // Fallback: copy to clipboard
                                navigator.clipboard.writeText(
                                  `${job.title} at ${job.company} - ${window.location.origin}/jobs/${job.id}`,
                                );
                                console.log('Job link copied to clipboard');
                              }
                            }}
                            sx={{
                              color: '#D4AF37',
                              '&:hover': { bgcolor: 'rgba(212,175,55,0.1)' },
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
          {!loading && !error && uniqueJobs.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Box sx={{ textAlign: 'center', mt: 6 }}>
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}
                >
                  Showing {uniqueJobs.length} of 12 total opportunities
                </Typography>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<RefreshIcon />}
                  onClick={() => {
                    // TODO: Implement pagination/load more
                    console.log('Load more functionality - to be implemented');
                  }}
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
          )}

          {/* Stats Section - Moved to Bottom */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Box
              sx={{
                mt: { xs: 6, md: 8 }, // ✅ Reduced top margin on mobile
                mb: { xs: 4, md: 6 }, // ✅ Reduced bottom margin on mobile
                px: { xs: 1, sm: 0 }, // ✅ Add horizontal padding on mobile
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  color: '#D4AF37',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  mb: { xs: 3, md: 4 }, // ✅ Responsive margin
                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }, // ✅ Responsive font size
                }}
              >
                Platform Statistics
              </Typography>
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                {' '}
                {/* ✅ Responsive spacing */}
                {/* Available Jobs Stat */}
                <Grid item xs={6} sm={6} md={3}>
                  {' '}
                  {/* ✅ 2 columns on mobile, 4 on desktop */}
                  <AnimatedStatCard
                    value={
                      platformStats.loading
                        ? uniqueJobs.length
                        : platformStats.availableJobs
                    }
                    label="Available Jobs"
                    isLive={true}
                  />
                </Grid>
                {/* Active Employers Stat */}
                <Grid item xs={6} sm={6} md={3}>
                  {' '}
                  {/* ✅ 2 columns on mobile, 4 on desktop */}
                  <AnimatedStatCard
                    value={
                      platformStats.loading ? 0 : platformStats.activeEmployers
                    }
                    suffix="+"
                    label="Active Employers"
                  />
                </Grid>
                {/* Skilled Workers Stat */}
                <Grid item xs={6} sm={6} md={3}>
                  {' '}
                  {/* ✅ 2 columns on mobile, 4 on desktop */}
                  <AnimatedStatCard
                    value={
                      platformStats.loading ? 0 : platformStats.skilledWorkers
                    }
                    suffix="+"
                    label="Skilled Workers"
                  />
                </Grid>
                {/* Success Rate Stat */}
                <Grid item xs={6} sm={6} md={3}>
                  {' '}
                  {/* ✅ 2 columns on mobile, 4 on desktop */}
                  <AnimatedStatCard
                    value={
                      platformStats.loading ? 0 : platformStats.successRate
                    }
                    suffix="%"
                    label="Success Rate"
                  />
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
                mt: { xs: 3, md: 4 }, // ✅ Reduced mobile margin
                p: { xs: 2.5, sm: 3, md: 4 }, // ✅ Responsive padding
                mx: { xs: 1, sm: 0 }, // ✅ Mobile horizontal spacing
                textAlign: 'center',
                bgcolor: 'rgba(212,175,55,0.1)',
                border: '1px solid rgba(212,175,55,0.3)',
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  color: '#D4AF37',
                  fontWeight: 'bold',
                  mb: { xs: 1.5, md: 2 }, // ✅ Responsive margin
                  fontSize: { xs: '1.35rem', sm: '1.75rem', md: '2rem' }, // ✅ Responsive font
                  px: { xs: 1, sm: 0 }, // ✅ Mobile padding
                }}
              >
                Ready to Take Your Career to the Next Level?
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255,255,255,0.8)',
                  mb: { xs: 2.5, md: 3 }, // ✅ Responsive margin
                  fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' }, // ✅ Responsive font
                  lineHeight: { xs: 1.5, md: 1.6 }, // ✅ Better readability
                  maxWidth: 600,
                  mx: 'auto',
                  px: { xs: 1, sm: 0 }, // ✅ Mobile padding
                }}
              >
                Join thousands of skilled professionals who've found their dream
                jobs through Kelmah. Get personalized job recommendations and
                connect directly with employers.
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: { xs: 1.5, sm: 2 }, // ✅ Responsive gap
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  px: { xs: 1, sm: 0 }, // ✅ Mobile padding
                }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => {
                    if (!authState.isAuthenticated) {
                      navigate('/login', {
                        state: {
                          from: '/jobs',
                          message: 'Sign in to create job alerts',
                        },
                      });
                      return;
                    }
                    // TODO: Implement job alert creation
                    console.log('Create job alert feature - to be implemented');
                  }}
                  sx={{
                    bgcolor: '#D4AF37',
                    color: 'black',
                    fontWeight: 'bold',
                    fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' }, // ✅ Responsive font
                    px: { xs: 3, sm: 3.5, md: 4 }, // ✅ Responsive padding
                    minHeight: { xs: '44px', sm: '48px' }, // ✅ Touch target
                    '&:hover': {
                      bgcolor: '#B8941F',
                    },
                    '&:active': {
                      transform: 'scale(0.98)', // ✅ Touch feedback
                    },
                  }}
                >
                  Create Job Alert
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => {
                    if (!authState.isAuthenticated) {
                      navigate('/login', {
                        state: {
                          from: '/profile/upload-cv',
                          message: 'Sign in to upload your CV',
                        },
                      });
                      return;
                    }
                    navigate('/profile/upload-cv');
                  }}
                  sx={{
                    borderColor: '#D4AF37',
                    color: '#D4AF37',
                    fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' }, // ✅ Responsive font
                    px: { xs: 3, sm: 3.5, md: 4 }, // ✅ Responsive padding
                    minHeight: { xs: '44px', sm: '48px' }, // ✅ Touch target
                    '&:hover': {
                      borderColor: '#B8941F',
                      bgcolor: 'rgba(212,175,55,0.1)',
                    },
                    '&:active': {
                      transform: 'scale(0.98)', // ✅ Touch feedback
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
