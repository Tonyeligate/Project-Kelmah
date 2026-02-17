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
import JobsCompactSearchBar from '../components/JobsCompactSearchBar';
import JobsMobileFilterDrawer from '../components/JobsMobileFilterDrawer';
import tradeCategoriesData from '../data/tradeCategories.json';
import ghanaLocations from '../data/ghanaLocations.json';
import { useJobsQuery } from '../hooks/useJobsQuery';
import jobsApi from '../services/jobsService';
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
  FormatPaint as PaintingIcon,
  Hardware as WeldingIcon,
  Layers as MasonryIcon,
  Roofing as RoofingIcon,
  GridOn as FlooringIcon,
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
import { useSelector } from 'react-redux';
import {
  selectJobFilters,
} from '../services/jobSlice';
import { InteractiveJobCard as JobCard } from '../../common/components/cards';
import { useNavigate } from 'react-router-dom';
import { useAuthCheck } from '../../../hooks/useAuthCheck';
import { useDebounce } from '../../../hooks/useDebounce';
import BreadcrumbNavigation from '../../../components/common/BreadcrumbNavigation';
import PullToRefresh from '../../../components/common/PullToRefresh';
import usePrefersReducedMotion from '../../../hooks/usePrefersReducedMotion';

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
  padding: theme.spacing(4, 0),
  position: 'relative',
  overflow: 'hidden',
  minHeight: '40vh',
  display: 'flex',
  alignItems: 'center',
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(8, 0),
    minHeight: '60vh',
  },
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(12, 0),
    minHeight: '85vh',
  },
  [theme.breakpoints.up('lg')]: {
    minHeight: '75vh',
    padding: theme.spacing(12, 0),
  },
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
          fontSize: { xs: '0.875rem', sm: '0.9rem', md: '1rem' },
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
              fontSize: '0.7rem',
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

// Ghana vocational trade categories — matches backend Job.requirements.primarySkills enum
const categoryData = [
  {
    name: 'Plumbing',
    icon: <PlumbingIcon />,
    color: '#4A90E2',
    description: 'Pipe fitting, water systems & repairs',
  },
  {
    name: 'Electrical',
    icon: <ElectricalIcon />,
    color: '#FFD700',
    description: 'Wiring, installations & power systems',
  },
  {
    name: 'Carpentry',
    icon: <CarpenterIcon />,
    color: '#8B4513',
    description: 'Woodwork, furniture & fittings',
  },
  {
    name: 'Construction',
    icon: <ConstructionIcon />,
    color: '#E74C3C',
    description: 'Building, renovation & structural work',
  },
  {
    name: 'Painting',
    icon: <PaintingIcon />,
    color: '#9B59B6',
    description: 'Interior & exterior painting',
  },
  {
    name: 'Welding',
    icon: <WeldingIcon />,
    color: '#F39C12',
    description: 'Metal fabrication & welding',
  },
  {
    name: 'Masonry',
    icon: <MasonryIcon />,
    color: '#E67E22',
    description: 'Block laying, tiling & stonework',
  },
  {
    name: 'Roofing',
    icon: <RoofingIcon />,
    color: '#2ECC71',
    description: 'Roof installation & repair',
  },
];

const CATEGORY_ICON_MAP = {
  Plumbing: PlumbingIcon,
  Electrical: ElectricalIcon,
  Carpentry: CarpenterIcon,
  Construction: ConstructionIcon,
  Painting: PaintingIcon,
  Welding: WeldingIcon,
  Masonry: MasonryIcon,
  HVAC: HvacIcon,
  Roofing: RoofingIcon,
  Flooring: FlooringIcon,
  '': WorkIcon,
};

const tradeCategories = tradeCategoriesData.map((category) => ({
  ...category,
  icon: CATEGORY_ICON_MAP[category.value] || WorkIcon,
}));

// Platform metrics are now derived from real data inside the component via platformStats state.
// No hardcoded vanity numbers — stats are computed from actual job counts.

// Class-based Error Boundary — React requires class components for getDerivedStateFromError
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('JobsPage Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" sx={{ color: '#fff', mb: 2 }}>
              Something went wrong
            </Typography>
            <Typography variant="body1" sx={{ color: '#ccc', mb: 3 }}>
              We&apos;re having trouble loading jobs. Please try refreshing the page.
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

    return this.props.children;
  }
}

const JobsPage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const theme = useTheme();
  const navigate = useNavigate();
  const authState = useAuthCheck();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const prefersReducedMotion = usePrefersReducedMotion();
  // When reduced motion is preferred, disable framer-motion transitions
  const motionProps = prefersReducedMotion
    ? { initial: false, animate: false, transition: { duration: 0 } }
    : {};
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 350);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [budgetRange, setBudgetRange] = useState([0, 50000]);
  const [budgetFilterActive, setBudgetFilterActive] = useState(false);
  const debouncedBudgetRange = useDebounce(budgetFilterActive ? budgetRange : null, 500);
  const [sortBy, setSortBy] = useState('relevance');
  const [quickFilters, setQuickFilters] = useState({ urgent: false, verified: false, fullTime: false, contract: false });
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const hasMore = page < totalPages;

  // Infinite scroll sentinel (mobile): ref is placed on the sentinel element
  const { ref: loadMoreRef, inView: loadMoreInView } = useInView({ threshold: 0, rootMargin: '200px' });

  const toggleQuickFilter = useCallback((key) => {
    setQuickFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const hasActiveFilters = Boolean(
    debouncedSearch || selectedCategory || selectedLocation || budgetFilterActive ||
    quickFilters.urgent || quickFilters.verified || quickFilters.fullTime || quickFilters.contract
  );

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLocation('');
    setBudgetRange([0, 50000]);
    setBudgetFilterActive(false);
    setSortBy('relevance');
    setQuickFilters({ urgent: false, verified: false, fullTime: false, contract: false });
    setPage(1);
  }, []);
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

  // Reset page to 1 when any filter changes
  const prevFiltersRef = useRef('');
  useEffect(() => {
    const filterKey = JSON.stringify({ debouncedSearch, selectedCategory, selectedLocation, debouncedBudgetRange, sortBy, quickFilters });
    if (prevFiltersRef.current && prevFiltersRef.current !== filterKey) {
      setPage(1);
    }
    prevFiltersRef.current = filterKey;
  }, [debouncedSearch, selectedCategory, selectedLocation, debouncedBudgetRange, sortBy, quickFilters]);

  const JOBS_PER_PAGE = 12;

  const jobsQueryFilters = useMemo(
    () => {
      const params = {
        status: 'open',
        search: debouncedSearch || undefined,
        category: selectedCategory || undefined,
        location: selectedLocation || undefined,
        sort: sortBy !== 'relevance' ? sortBy : undefined,
        limit: JOBS_PER_PAGE,
        page,
      };
      // Only send budget filter when user explicitly adjusts the slider
      if (debouncedBudgetRange) {
        params.min_budget = debouncedBudgetRange[0];
        params.max_budget = debouncedBudgetRange[1];
      }
      // Quick filters
      if (quickFilters.urgent) params.urgent = 'true';
      if (quickFilters.verified) params.verified = 'true';
      if (quickFilters.fullTime) params.paymentType = 'hourly';
      if (quickFilters.contract) params.paymentType = 'fixed';
      return params;
    },
    [debouncedSearch, selectedCategory, selectedLocation, debouncedBudgetRange, sortBy, quickFilters, page],
  );

  const {
    data: jobsResponse,
    isLoading: isJobsLoading,
    isFetching: isJobsFetching,
    error: jobsQueryError,
    refetch: refetchJobs,
  } = useJobsQuery(jobsQueryFilters, { keepPreviousData: true });

  // Infinite scroll: auto-load next page when sentinel enters viewport (mobile)
  useEffect(() => {
    if (loadMoreInView && hasMore && !isJobsFetching && !isJobsLoading) {
      setPage((p) => p + 1);
    }
  }, [loadMoreInView, hasMore, isJobsFetching, isJobsLoading]);

  useEffect(() => {
    const hasDataArray = (payload) =>
      Array.isArray(payload)
        ? payload
        : payload?.jobs || payload?.data || [];

    if (jobsResponse) {
      const normalizedJobs = hasDataArray(jobsResponse);
      // Extract pagination metadata from the API response
      setTotalPages(jobsResponse.totalPages || 1);
      setTotalJobs(jobsResponse.totalJobs || normalizedJobs.length);

      if (page === 1) {
        // First page: replace jobs
        setJobs(normalizedJobs);
      } else {
        // Subsequent pages: append new jobs
        setJobs((prev) => {
          const existingIds = new Set(prev.map((j) => j.id || j._id));
          const newJobs = normalizedJobs.filter((j) => !existingIds.has(j.id || j._id));
          return [...prev, ...newJobs];
        });
      }
      console.log(`✅ Jobs loaded via React Query (page ${page}):`, normalizedJobs.length);
      return;
    }

    if (!isJobsLoading && !jobsResponse) {
      setJobs([]);
    }
  }, [jobsResponse, isJobsLoading, page]);

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

  // Fetch platform statistics from the real API endpoint
  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      try {
        const data = await jobsApi.getPlatformStats();
        if (!cancelled && data) {
          setPlatformStats({
            availableJobs: data.availableJobs || 0,
            activeEmployers: data.activeEmployers || 0,
            skilledWorkers: data.skilledWorkers || 0,
            successRate: data.successRate || 0,
            loading: false,
          });
        } else if (!cancelled) {
          // API unavailable — derive available-jobs count from loaded data
          setPlatformStats((prev) => ({
            ...prev,
            availableJobs: jobs.length,
            loading: false,
          }));
        }
      } catch {
        if (!cancelled) {
          setPlatformStats((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    fetchStats();

    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []); // Fetch once on mount, refresh via interval

  // Deduplicate jobs by ID (server handles filtering; no redundant client-side filter)
  const uniqueJobs = useMemo(() => {
    const deduped = Array.from(
      new Map(jobs.map((job) => [job.id, job])).values(),
    );

    // Client-side sort when server doesn't support sort param yet
    if (sortBy === 'budget_high') {
      deduped.sort((a, b) => {
        const bBudget = typeof b.budget === 'object' ? (b.budget.amount || b.budget.max || 0) : (b.budget || 0);
        const aBudget = typeof a.budget === 'object' ? (a.budget.amount || a.budget.max || 0) : (a.budget || 0);
        return bBudget - aBudget;
      });
    } else if (sortBy === 'budget_low') {
      deduped.sort((a, b) => {
        const aBudget = typeof a.budget === 'object' ? (a.budget.amount || a.budget.min || 0) : (a.budget || 0);
        const bBudget = typeof b.budget === 'object' ? (b.budget.amount || b.budget.min || 0) : (b.budget || 0);
        return aBudget - bBudget;
      });
    } else if (sortBy === 'newest') {
      deduped.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
    }
    // 'relevance' = server default order (no client re-sort)
    return deduped;
  }, [jobs, sortBy]);

  return (
    <ErrorBoundary>
      <PullToRefresh onRefresh={async () => { setPage(1); await refetchJobs(); }}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', color: 'text.primary' }}>
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

                {/* Right Side - Filter System: Compact on mobile, expanded on desktop */}
                <Grid item xs={12} md={8}>
                  {/* Mobile: compact search bar + bottom-sheet filter drawer (Binance pattern) */}
                  {isMobile ? (
                    <>
                      <JobsCompactSearchBar
                        searchValue={searchQuery}
                        onSearchChange={setSearchQuery}
                        onSearchSubmit={() => {}}
                        onFilterClick={() => setMobileFilterOpen(true)}
                        placeholder={isSmallMobile ? 'Search jobs...' : 'Search jobs, skills...'}
                      />
                      <JobsMobileFilterDrawer
                        open={mobileFilterOpen}
                        onClose={() => setMobileFilterOpen(false)}
                        onApply={(filters) => {
                          if (filters.search !== undefined) setSearchQuery(filters.search);
                          if (filters.category !== undefined) setSelectedCategory(filters.category);
                          if (filters.location !== undefined) setSelectedLocation(filters.location);
                          if (filters.salaryRange) {
                            setBudgetRange(filters.salaryRange);
                            setBudgetFilterActive(true);
                          }
                          setMobileFilterOpen(false);
                        }}
                        initialFilters={{
                          search: searchQuery,
                          category: selectedCategory,
                          location: selectedLocation,
                          salaryRange: budgetRange,
                        }}
                        tradeCategories={tradeCategoriesData}
                        locations={ghanaLocations}
                      />
                    </>
                  ) : (
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
                              fontSize: { xs: '1rem', sm: '0.875rem' }, // ✅ 16px on mobile prevents iOS auto-zoom
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
                              fontSize: { xs: '1rem', sm: '0.875rem' }, // ✅ Larger text on mobile
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
                              fontSize: { xs: '1rem', sm: '0.875rem' }, // ✅ Larger text on mobile
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
                            startIcon={isJobsFetching ? <CircularProgress size={16} sx={{ color: 'black' }} /> : <SearchIcon />}
                            disabled={isJobsFetching}
                            onClick={() => {
                              // Force re-fetch with current filters (debounce will fire immediately if search already settled)
                              if (searchQuery && searchQuery !== debouncedSearch) {
                                // User typed but debounce hasn't fired - search immediately
                                setSearchQuery((prev) => prev); // force effect
                              }
                            }}
                            sx={{
                              bgcolor: '#D4AF37',
                              color: 'black',
                              fontWeight: 'bold',
                              fontSize: { xs: '1rem', sm: '0.875rem' }, // ✅ Slightly larger on mobile
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
                          fontSize: { xs: '0.875rem', sm: '0.75rem' },
                          padding: { xs: '8px 14px', sm: '4px 8px' },
                          minHeight: { xs: '44px', sm: 'auto' },
                          '&:hover': {
                            bgcolor: 'rgba(212,175,55,0.1)',
                          },
                        }}
                      >
                        {showFilters ? 'Hide' : 'Show'} Filters
                        {hasActiveFilters && (
                          <Badge 
                            badgeContent={[debouncedSearch, selectedCategory, selectedLocation, budgetFilterActive, quickFilters.urgent, quickFilters.verified, quickFilters.fullTime, quickFilters.contract].filter(Boolean).length}
                            sx={{ ml: 1, '& .MuiBadge-badge': { bgcolor: '#D4AF37', color: 'black', fontSize: '0.65rem', minWidth: 16, height: 16 } }}
                          />
                        )}
                      </Button>
                    </Box>

                    {/* Fetching indicator */}
                    {isJobsFetching && (
                      <LinearProgress
                        sx={{
                          mt: 1,
                          bgcolor: 'rgba(212,175,55,0.15)',
                          '& .MuiLinearProgress-bar': { bgcolor: '#D4AF37' },
                          height: 2,
                          borderRadius: 1,
                        }}
                      />
                    )}

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
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: '#D4AF37',
                                  fontWeight: 'bold',
                                }}
                              >
                                Budget Range (GHS)
                              </Typography>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={budgetFilterActive}
                                    onChange={(e) => setBudgetFilterActive(e.target.checked)}
                                    size="small"
                                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#D4AF37' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#D4AF37' } }}
                                  />
                                }
                                label={<Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>{budgetFilterActive ? 'On' : 'Off'}</Typography>}
                                sx={{ m: 0 }}
                              />
                            </Box>
                            <Slider
                              value={budgetRange}
                              onChange={(e, newValue) => {
                                setBudgetRange(newValue);
                                if (!budgetFilterActive) setBudgetFilterActive(true);
                              }}
                              valueLabelDisplay="auto"
                              valueLabelFormat={(v) => `GHS ${v.toLocaleString()}`}
                              min={0}
                              max={50000}
                              step={500}
                              disabled={!budgetFilterActive}
                              size="small"
                              sx={{
                                color: budgetFilterActive ? '#D4AF37' : 'grey.600',
                                '& .MuiSlider-thumb': {
                                  bgcolor: budgetFilterActive ? '#D4AF37' : 'grey.500',
                                  width: { xs: 28, sm: 20 },
                                  height: { xs: 28, sm: 20 },
                                  '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    width: 44,
                                    height: 44,
                                    borderRadius: '50%',
                                  },
                                },
                                '& .MuiSlider-track': {
                                  bgcolor: budgetFilterActive ? '#D4AF37' : 'grey.600',
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
                                GHS {budgetRange[0].toLocaleString()}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: 'rgba(255,255,255,0.7)' }}
                              >
                                GHS {budgetRange[1].toLocaleString()}+
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={3}>
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
                              {[
                                { key: 'urgent', label: 'Urgent' },
                                { key: 'verified', label: 'Verified Hirer' },
                                { key: 'fullTime', label: 'Hourly' },
                                { key: 'contract', label: 'Fixed Price' },
                              ].map(({ key, label }) => (
                                <Chip
                                  key={key}
                                  label={label}
                                  size="small"
                                  variant={quickFilters[key] ? 'filled' : 'outlined'}
                                  onClick={() => toggleQuickFilter(key)}
                                  sx={{
                                    borderColor: '#D4AF37',
                                    color: quickFilters[key] ? 'black' : '#D4AF37',
                                    bgcolor: quickFilters[key] ? '#D4AF37' : 'transparent',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    fontWeight: quickFilters[key] ? 'bold' : 'normal',
                                    '&:hover': {
                                      bgcolor: quickFilters[key] ? '#B8941F' : 'rgba(212,175,55,0.15)',
                                    },
                                    transition: 'all 0.2s ease',
                                  }}
                                />
                              ))}
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Typography
                              variant="body2"
                              sx={{
                                mb: 1,
                                color: '#D4AF37',
                                fontWeight: 'bold',
                              }}
                            >
                              Sort By
                            </Typography>
                            <FormControl fullWidth size="small">
                              <Select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                sx={{
                                  color: 'white',
                                  fontSize: '0.875rem',
                                  height: '36px',
                                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(212,175,55,0.3)' },
                                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#D4AF37' },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#D4AF37' },
                                  '& .MuiSvgIcon-root': { color: '#D4AF37' },
                                }}
                              >
                                <MenuItem value="relevance">Most Relevant</MenuItem>
                                <MenuItem value="newest">Newest First</MenuItem>
                                <MenuItem value="budget_high">Budget: High → Low</MenuItem>
                                <MenuItem value="budget_low">Budget: Low → High</MenuItem>
                              </Select>
                            </FormControl>
                            {hasActiveFilters && (
                              <Button
                                size="small"
                                onClick={clearAllFilters}
                                sx={{
                                  mt: 1,
                                  color: '#ff6b6b',
                                  fontSize: '0.75rem',
                                  textTransform: 'none',
                                  '&:hover': { bgcolor: 'rgba(255,107,107,0.1)' },
                                }}
                              >
                                ✕ Clear All Filters
                              </Button>
                            )}
                          </Grid>
                        </Grid>
                      </Box>
                    </Collapse>
                  </Paper>
                  )}
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
                {hasActiveFilters && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
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
                    {budgetFilterActive && (
                      <Chip
                        label={`Budget: GHS ${budgetRange[0].toLocaleString()} – ${budgetRange[1].toLocaleString()}`}
                        size="small"
                        onDelete={() => { setBudgetFilterActive(false); setBudgetRange([0, 50000]); }}
                        sx={{
                          bgcolor: 'rgba(212,175,55,0.2)',
                          color: '#D4AF37',
                          '& .MuiChip-deleteIcon': { color: '#D4AF37' },
                        }}
                      />
                    )}
                    {Object.entries(quickFilters).filter(([, v]) => v).map(([key]) => (
                      <Chip
                        key={key}
                        label={key === 'fullTime' ? 'Hourly' : key === 'contract' ? 'Fixed Price' : key.charAt(0).toUpperCase() + key.slice(1)}
                        size="small"
                        onDelete={() => toggleQuickFilter(key)}
                        sx={{
                          bgcolor: 'rgba(212,175,55,0.2)',
                          color: '#D4AF37',
                          '& .MuiChip-deleteIcon': { color: '#D4AF37' },
                        }}
                      />
                    ))}
                    <Button
                      size="small"
                      onClick={clearAllFilters}
                      sx={{ color: '#ff6b6b', fontSize: '0.75rem', textTransform: 'none', minWidth: 'auto' }}
                    >
                      Clear all
                    </Button>
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
                                    fontSize: { xs: '0.875rem', sm: '0.875rem' },
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
                                    fontSize: { xs: '0.8rem', sm: '0.75rem' },
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
                              fontSize: { xs: '1rem', sm: '0.875rem' }, // ✅ Slightly larger on mobile
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
                            aria-label="View job details"
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
                            aria-label="Save job"
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
                            aria-label="Share job"
                            sx={{
                              color: '#D4AF37',
                              minWidth: { xs: '44px', sm: '40px' },
                              minHeight: { xs: '44px', sm: '40px' },
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

          {/* Infinite-scroll sentinel (mobile) + Load More / Pagination */}
          {!loading && !error && uniqueJobs.length > 0 && (
            <Box sx={{ textAlign: 'center', mt: 4, mb: 2 }}>
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', mb: 2 }}
              >
                Showing {uniqueJobs.length} of {totalJobs} opportunities
              </Typography>

              {/* Mobile: infinite-scroll sentinel */}
              {hasMore && (
                <Box
                  ref={loadMoreRef}
                  sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', py: 3 }}
                >
                  {isJobsFetching ? (
                    <CircularProgress size={28} sx={{ color: '#D4AF37' }} />
                  ) : (
                    <Button
                      variant="outlined"
                      size="medium"
                      onClick={() => setPage((p) => p + 1)}
                      sx={{
                        borderColor: '#D4AF37',
                        color: '#D4AF37',
                        px: 4,
                        py: 1,
                        '&:hover': { borderColor: '#B8941F', bgcolor: 'rgba(212,175,55,0.1)' },
                      }}
                    >
                      Load More
                    </Button>
                  )}
                </Box>
              )}

              {/* Desktop: page numbers */}
              {totalPages > 1 && (
                <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center', mt: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, newPage) => {
                      setPage(newPage);
                      // On desktop pagination, replace jobs instead of append
                      setJobs([]);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    sx={{
                      '& .MuiPaginationItem-root': {
                        color: 'text.primary',
                        '&.Mui-selected': { bgcolor: '#D4AF37', color: '#000' },
                      },
                    }}
                  />
                </Box>
              )}

              {!hasMore && uniqueJobs.length > 0 && (
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                  You&apos;ve seen all available opportunities
                </Typography>
              )}
            </Box>
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
      </PullToRefresh>
    </ErrorBoundary>
  );
};

export default JobsPage;
