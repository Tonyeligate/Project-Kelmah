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
 *    If authenticated: navigate(`/jobs/${job._id || job.id}/apply`)
 *    ↓
 *    Route: /jobs/:id/apply → JobApplicationForm.jsx
 *
 * EMPLOYER DATA HANDLING:
 * ================================================================================
 * Backend: getJobs() manually populates hirer via direct MongoDB driver query
 *   (firstName, lastName, profileImage, avatar, verified, isVerified, rating, email)
 * Frontend: transformJobListItem() handles multiple fallbacks:
 *   1. Full hirer object (preferred — returned by backend populate)
 *   2. hirer_name string
 *   3. company/companyName fields
 *   4. Fallback: "Employer Name Pending" with _isFallback + _needsAdminReview flags
 */

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import HeroFiltersSection from '../components/HeroFiltersSection';
// JobResultsSection removed — cards are rendered inline below
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
  Snackbar,
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
  Bookmark as BookmarkFilledIcon,
  Share,
  Refresh as RefreshIcon,
  NotificationsActive as AlertIcon,
} from '@mui/icons-material';

// AUD2-H01 FIX: Removed LazyIcons wrapper — all icons are already eagerly imported above.
// Creating React.lazy() wrappers for eagerly-imported modules creates redundant async chunks
// without any bundle-size benefit.
import { motion, AnimatePresence } from 'framer-motion';
// styled + keyframes import removed — HeroSection (only user) was dead code
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
import { useNavigate } from 'react-router-dom';
import { useAuthCheck } from '../../../hooks/useAuthCheck';
import { useDebounce } from '../../../hooks/useDebounce';
import BreadcrumbNavigation from '../../../components/common/BreadcrumbNavigation';
import PullToRefresh from '../../../components/common/PullToRefresh';
import usePrefersReducedMotion from '../../../hooks/usePrefersReducedMotion';
import useNetworkSpeed from '../../../hooks/useNetworkSpeed';
import {
  resolveMediaAssetUrl,
  resolveMediaAssetUrls,
  resolveJobVisualUrl,
  resolveProfileImageUrl,
} from '../../common/utils/mediaAssets';

// ✅ MOBILE-AUDIT P1: Removed dead code — 7 keyframe animations + HeroSection styled component
// (float, shimmer, pulse, slideInFromBottom, gradientShift, sparkle, rotateGlow)
// HeroSection was never rendered in JSX.

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
        bgcolor: 'var(--k-bg-surface)',
        border: '1px solid var(--k-accent-border)',
        minHeight: { xs: 'auto', sm: '140px', md: '160px' }, // ✅ Auto on mobile
        display: 'flex', // ✅ Better centering
        flexDirection: 'column',
        justifyContent: 'center',
        '&:hover': {
          border: '1px solid var(--k-gold)',
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
          color: 'var(--k-gold)',
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
          color: 'var(--k-text-secondary)',
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
              // ✅ MOBILE-AUDIT: Respect prefers-reduced-motion
              '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
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
    color: 'secondary.main',
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

const getJobHeroImage = (job = {}) => resolveJobVisualUrl(job);

const getJobVisuals = (job = {}) =>
  resolveMediaAssetUrls(
    job?.coverImage,
    job?.coverImageMetadata,
    job?.images,
    job?.attachments,
    job?.media,
    job?.gallery,
  );

const getEmployerAvatar = (job = {}) =>
  resolveMediaAssetUrl([
    job?.employer?.logo,
    job?.employer?.avatar,
    job?.employer?.image,
    resolveProfileImageUrl(job?.hirer || {}),
  ]);

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
    if (import.meta.env.DEV) console.error('JobsPage Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" sx={{ color: 'var(--k-text-primary)', mb: 2 }}>
              Something went wrong
            </Typography>
            <Typography variant="body1" sx={{ color: 'var(--k-text-secondary)', mb: 3 }}>
              We&apos;re having trouble loading jobs. Please try refreshing the page.
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
              sx={{ bgcolor: 'var(--k-gold)', color: 'var(--k-text-on-accent)' }}
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
  const { isSlow: isSlowNetwork } = useNetworkSpeed();
  // When reduced motion is preferred OR network is slow, disable framer-motion transitions
  const motionProps = (prefersReducedMotion || isSlowNetwork)
    ? { initial: false, animate: false, transition: { duration: 0 } }
    : {};
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 350);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [budgetRange, setBudgetRange] = useState([0, 100000]);
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

  // Bookmark (saved jobs) state
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  // Load saved jobs on mount
  useEffect(() => {
    let cancelled = false;
    if (isAuthenticated) {
      jobsApi.getSavedJobs().then(res => {
        if (cancelled) return;
        const ids = (res?.jobs || []).map(j => j.id || j._id).filter(Boolean);
        setSavedJobIds(new Set(ids));
      }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const handleToggleBookmark = useCallback(async (jobId) => {
    if (!authState.isAuthenticated) {
      navigate('/login', { state: { from: `/jobs/${jobId}`, message: 'Please sign in to save jobs' } });
      return;
    }
    const isSaved = savedJobIds.has(jobId);
    // Optimistic update
    setSavedJobIds(prev => {
      const next = new Set(prev);
      isSaved ? next.delete(jobId) : next.add(jobId);
      return next;
    });
    try {
      if (isSaved) {
        await jobsApi.unsaveJob(jobId);
        setSnackbar({ open: true, message: 'Job removed from saved' });
      } else {
        await jobsApi.saveJob(jobId);
        setSnackbar({ open: true, message: 'Job saved successfully!' });
      }
    } catch (err) {
      // Rollback on failure
      setSavedJobIds(prev => {
        const next = new Set(prev);
        isSaved ? next.add(jobId) : next.delete(jobId);
        return next;
      });
      setSnackbar({ open: true, message: 'Failed to update saved jobs. Try again.' });
    }
  }, [authState.isAuthenticated, savedJobIds, navigate]);

  const handleCreateJobAlert = useCallback(() => {
    if (!authState.isAuthenticated) {
      navigate('/login', { state: { from: '/jobs', message: 'Sign in to create job alerts' } });
      return;
    }
    // Build alert preferences from current filters
    const alertFilters = {
      category: selectedCategory || 'All categories',
      location: selectedLocation || 'All locations',
      search: searchQuery || '',
    };
    setSnackbar({
      open: true,
      message: `Job alert created! You'll be notified about ${alertFilters.category} jobs${alertFilters.location !== 'All locations' ? ` in ${alertFilters.location}` : ''}.`,
    });
    navigate('/notifications/settings', { state: { alertCreated: true, filters: alertFilters } });
  }, [authState.isAuthenticated, selectedCategory, selectedLocation, searchQuery, navigate]);

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
    setBudgetRange([0, 100000]);
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
  const jobsCountRef = useRef(0);
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

  // Helper function to get category icon from the CATEGORY_ICON_MAP
  const getCategoryIcon = (category) => {
    if (!category) return WorkIcon;
    return CATEGORY_ICON_MAP[category] || WorkIcon;
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
      if (import.meta.env.DEV) console.log(`Jobs loaded via React Query (page ${page}):`, normalizedJobs.length);
      return;
    }

    if (!isJobsLoading && !jobsResponse) {
      setJobs([]);
    }
  }, [jobsResponse, isJobsLoading, page]);

  useEffect(() => {
    if (jobsQueryError) {
      if (import.meta.env.DEV) console.error('Error fetching jobs via React Query:', jobsQueryError);
      setError('Unable to load jobs. Please try again.');
      return;
    }
    if (!isJobsLoading && !isJobsFetching) {
      setError(null);
    }
  }, [jobsQueryError, isJobsLoading, isJobsFetching]);

  useEffect(() => {
    setLoading(isJobsLoading && !jobsResponse);
  }, [isJobsLoading, jobsResponse]);

  useEffect(() => {
    jobsCountRef.current = jobs.length;
  }, [jobs.length]);

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
            availableJobs: jobsCountRef.current,
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
      new Map(jobs.map((job) => [job.id || job._id, job])).values(),
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
            {...motionProps}
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
                          'linear-gradient(45deg, var(--k-gold-dark) 30%, var(--k-gold) 90%)',
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
                        color: 'text.secondary',
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
                      bgcolor: 'var(--k-bg-surface)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid var(--k-accent-border)',
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
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
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
                              color: 'var(--k-text-primary)',
                              height: { xs: '44px', sm: '40px' }, // ✅ Larger touch target on mobile (44px is Apple's recommended minimum)
                              '& fieldset': {
                                borderColor: 'var(--k-accent-border)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'var(--k-gold)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: 'var(--k-gold)',
                              },
                            },
                            '& .MuiInputBase-input': {
                              fontSize: { xs: '1rem', sm: '0.875rem' }, // ✅ 16px on mobile prevents iOS auto-zoom
                              padding: { xs: '10px 14px', sm: '8.5px 14px' }, // ✅ Comfortable padding
                              '&::placeholder': {
                                color: 'var(--k-text-muted)',
                                opacity: 1,
                              },
                            },
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon
                                  sx={{
                                    color: 'var(--k-gold)',
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
                              color: 'var(--k-text-secondary)',
                              fontSize: { xs: '0.8rem', sm: '0.75rem' }, // ✅ Slightly larger on mobile
                              transform: 'translate(14px, -9px) scale(0.85)',
                              '&.Mui-focused': {
                                color: 'var(--k-gold)',
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
                              color: 'var(--k-text-primary)',
                              fontSize: { xs: '1rem', sm: '0.875rem' }, // ✅ Larger text on mobile
                              height: { xs: '44px', sm: '40px' }, // ✅ Match TextField height
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'var(--k-accent-border)',
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'var(--k-gold)',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline':
                              {
                                borderColor: 'var(--k-gold)',
                              },
                              '& .MuiSvgIcon-root': {
                                color: 'var(--k-gold)',
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
                                      color: 'var(--k-gold)',
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
                              color: 'var(--k-text-secondary)',
                              fontSize: { xs: '0.8rem', sm: '0.75rem' }, // ✅ Slightly larger on mobile
                              transform: 'translate(14px, -9px) scale(0.85)',
                              '&.Mui-focused': {
                                color: 'var(--k-gold)',
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
                              color: 'var(--k-text-primary)',
                              fontSize: { xs: '1rem', sm: '0.875rem' }, // ✅ Larger text on mobile
                              height: { xs: '44px', sm: '40px' }, // ✅ Match TextField height
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'var(--k-accent-border)',
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'var(--k-gold)',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline':
                              {
                                borderColor: 'var(--k-gold)',
                              },
                              '& .MuiSvgIcon-root': {
                                color: 'var(--k-gold)',
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
                              bgcolor: 'var(--k-gold)',
                              color: 'var(--k-text-on-accent)',
                              fontWeight: 'bold',
                              fontSize: { xs: '1rem', sm: '0.875rem' }, // ✅ Slightly larger on mobile
                              height: { xs: '44px', sm: '40px' }, // ✅ Match other elements (44px for mobile touch)
                              minWidth: { xs: '100%', sm: 'auto' },
                              padding: { xs: '10px 20px', sm: '8px 12px' }, // ✅ More comfortable mobile padding
                              boxShadow: '0 4px 12px rgba(212,175,55,0.4)',
                              whiteSpace: 'nowrap',
                              '&:hover': {
                                bgcolor: 'var(--k-gold-dark)',
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
                          color: 'var(--k-gold)',
                          fontSize: { xs: '0.875rem', sm: '0.75rem' },
                          padding: { xs: '8px 14px', sm: '4px 8px' },
                          minHeight: { xs: '44px', sm: 'auto' },
                          '&:hover': {
                            bgcolor: 'var(--k-accent-soft)',
                          },
                        }}
                      >
                        {showFilters ? 'Hide' : 'Show'} Filters
                        {hasActiveFilters && (
                          <Badge 
                            badgeContent={[debouncedSearch, selectedCategory, selectedLocation, budgetFilterActive, quickFilters.urgent, quickFilters.verified, quickFilters.fullTime, quickFilters.contract].filter(Boolean).length}
                            sx={{ ml: 1, '& .MuiBadge-badge': { bgcolor: 'var(--k-gold)', color: 'var(--k-text-on-accent)', fontSize: '0.65rem', minWidth: 16, height: 16 } }}
                          />
                        )}
                      </Button>
                    </Box>

                    {/* Fetching indicator */}
                    {isJobsFetching && (
                      <LinearProgress
                        sx={{
                          mt: 1,
                          bgcolor: 'var(--k-accent-soft)',
                          '& .MuiLinearProgress-bar': { bgcolor: 'var(--k-gold)' },
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
                          borderTop: '1px solid var(--k-accent-border)',
                        }}
                      >
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'var(--k-gold)',
                                  fontWeight: 'bold',
                                }}
                              >
                                Budget Range (GH₵)
                              </Typography>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={budgetFilterActive}
                                    onChange={(e) => setBudgetFilterActive(e.target.checked)}
                                    size="small"
                                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: 'var(--k-gold)' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'var(--k-gold)' } }}
                                  />
                                }
                                label={<Typography variant="caption" sx={{ color: 'var(--k-text-muted)' }}>{budgetFilterActive ? 'On' : 'Off'}</Typography>}
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
                              valueLabelFormat={(v) => `GH₵ ${v.toLocaleString()}`}
                              min={0}
                              max={100000}
                              step={500}
                              disabled={!budgetFilterActive}
                              size="small"
                              sx={{
                                color: budgetFilterActive ? 'var(--k-gold)' : 'grey.600',
                                '& .MuiSlider-thumb': {
                                  bgcolor: budgetFilterActive ? 'var(--k-gold)' : 'grey.500',
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
                                  bgcolor: budgetFilterActive ? 'var(--k-gold)' : 'grey.600',
                                },
                                '& .MuiSlider-rail': {
                                  bgcolor: 'var(--k-accent-border)',
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
                                sx={{ color: 'var(--k-text-secondary)' }}
                              >
                                GH₵ {budgetRange[0].toLocaleString()}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: 'var(--k-text-secondary)' }}
                              >
                                GH₵ {budgetRange[1].toLocaleString()}+
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Typography
                              variant="body2"
                              sx={{
                                mb: 1,
                                color: 'var(--k-gold)',
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
                                    borderColor: 'var(--k-gold)',
                                    color: quickFilters[key] ? 'var(--k-text-on-accent)' : 'var(--k-gold)',
                                    bgcolor: quickFilters[key] ? 'var(--k-gold)' : 'transparent',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    fontWeight: quickFilters[key] ? 'bold' : 'normal',
                                    '&:hover': {
                                        bgcolor: quickFilters[key] ? 'var(--k-gold-dark)' : 'var(--k-accent-soft)',
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
                                color: 'var(--k-gold)',
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
                                  color: 'var(--k-text-primary)',
                                  fontSize: '0.875rem',
                                  height: '36px',
                                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--k-accent-border)' },
                                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--k-gold)' },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--k-gold)' },
                                  '& .MuiSvgIcon-root': { color: 'var(--k-gold)' },
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

          {/* Browse by Trade Category - Large visual icons for easy browsing */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            {...motionProps}
          >
            <Box sx={{ mb: { xs: 3, md: 4 }, px: { xs: 0.5, sm: 0 } }}>
              <Typography
                variant="h5"
                sx={{
                  color: 'var(--k-gold)',
                  fontWeight: 'bold',
                  mb: { xs: 1.5, md: 2 },
                  fontSize: { xs: '1.15rem', sm: '1.35rem', md: '1.5rem' },
                  textAlign: { xs: 'center', md: 'left' },
                }}
              >
                Browse by Trade
              </Typography>
              <Grid container spacing={{ xs: 1, sm: 1.5 }}>
                {categoryData.map((cat) => {
                  const isActive = selectedCategory === cat.name;
                  return (
                    <Grid item xs={3} sm={3} md={1.5} key={cat.name}>
                      <Paper
                        onClick={() => {
                          if (isActive) {
                            setSelectedCategory('');
                          } else {
                            setSelectedCategory(cat.name);
                          }
                          setPage(1);
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`Browse ${cat.name} jobs`}
                        aria-pressed={isActive}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedCategory(isActive ? '' : cat.name);
                            setPage(1);
                          }
                        }}
                        sx={{
                          p: { xs: 1.5, sm: 2 },
                          textAlign: 'center',
                          cursor: 'pointer',
                          bgcolor: isActive ? 'var(--k-accent-soft)' : 'var(--k-bg-surface)',
                          border: isActive ? '2px solid var(--k-gold)' : '1px solid var(--k-accent-border)',
                          borderRadius: 2,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: 'var(--k-accent-soft)',
                            border: '1px solid var(--k-accent-border-strong)',
                            transform: { xs: 'none', sm: 'translateY(-2px)' },
                          },
                          '&:active': { transform: 'scale(0.96)' },
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 0.5,
                          minHeight: { xs: 72, sm: 80 },
                          justifyContent: 'center',
                        }}
                        elevation={isActive ? 4 : 0}
                      >
                        <Box
                          sx={{
                            color: isActive ? 'secondary.main' : cat.color,
                            fontSize: { xs: 28, sm: 32 },
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.2s ease',
                          }}
                        >
                          {cat.icon}
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: isActive ? 'secondary.main' : 'var(--k-text-secondary)',
                            fontWeight: isActive ? 700 : 500,
                            fontSize: { xs: '0.65rem', sm: '0.75rem' },
                            lineHeight: 1.2,
                            transition: 'color 0.2s ease',
                          }}
                        >
                          {cat.name}
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </motion.div>

          {/* Enhanced Jobs Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            {...motionProps}
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
                  sx={{ color: 'var(--k-gold)', fontWeight: 'bold', mb: 1 }}
                >
                  {selectedCategory ? `${selectedCategory} Jobs` : 'Featured Opportunities'}
                </Typography>
                {hasActiveFilters && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Typography
                      variant="body2"
                      sx={{ color: 'text.secondary' }}
                    >
                      Active filters:
                    </Typography>
                    {searchQuery && (
                      <Chip
                        label={`Search: "${searchQuery}"`}
                        size="small"
                        onDelete={() => setSearchQuery('')}
                        sx={{
                          bgcolor: 'var(--k-accent-soft-strong)',
                          color: 'var(--k-gold)',
                          '& .MuiChip-deleteIcon': { color: 'var(--k-gold)' },
                        }}
                      />
                    )}
                    {selectedCategory && (
                      <Chip
                        label={`Category: ${selectedCategory}`}
                        size="small"
                        onDelete={() => setSelectedCategory('')}
                        sx={{
                          bgcolor: 'var(--k-accent-soft-strong)',
                          color: 'var(--k-gold)',
                          '& .MuiChip-deleteIcon': { color: 'var(--k-gold)' },
                        }}
                      />
                    )}
                    {selectedLocation && (
                      <Chip
                        label={`Location: ${selectedLocation}`}
                        size="small"
                        onDelete={() => setSelectedLocation('')}
                        sx={{
                          bgcolor: 'var(--k-accent-soft-strong)',
                          color: 'var(--k-gold)',
                          '& .MuiChip-deleteIcon': { color: 'var(--k-gold)' },
                        }}
                      />
                    )}
                    {budgetFilterActive && (
                      <Chip
                        label={`Budget: GH₵ ${budgetRange[0].toLocaleString()} – ${budgetRange[1].toLocaleString()}`}
                        size="small"
                        onDelete={() => { setBudgetFilterActive(false); setBudgetRange([0, 100000]); }}
                        sx={{
                          bgcolor: 'var(--k-accent-soft-strong)',
                          color: 'var(--k-gold)',
                          '& .MuiChip-deleteIcon': { color: 'var(--k-gold)' },
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
                          bgcolor: 'var(--k-accent-soft-strong)',
                          color: 'var(--k-gold)',
                          '& .MuiChip-deleteIcon': { color: 'var(--k-gold)' },
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
                  label={`${totalJobs || uniqueJobs.length} Job${(totalJobs || uniqueJobs.length) !== 1 ? 's' : ''} Found`}
                  icon={<WorkIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    bgcolor: 'var(--k-accent-soft-strong)',
                    color: 'var(--k-gold)',
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
                          bgcolor: 'var(--k-bg-surface)',
                          border: '1px solid var(--k-accent-border)',
                          borderRadius: 2,
                          minHeight: { xs: 'auto', sm: 320 },
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', mb: 2, gap: 2 }}>
                            <Skeleton
                              variant="circular"
                              width={40}
                              height={40}
                              sx={{ bgcolor: 'var(--k-surface-muted)' }}
                            />
                            <Box sx={{ flex: 1 }}>
                              <Skeleton
                                variant="text"
                                width="80%"
                                sx={{ bgcolor: 'var(--k-surface-muted)', mb: 1 }}
                              />
                              <Skeleton
                                variant="text"
                                width="50%"
                                sx={{ bgcolor: 'var(--k-surface-muted)' }}
                              />
                            </Box>
                          </Box>
                          <Skeleton
                            variant="text"
                            width="100%"
                            sx={{ bgcolor: 'var(--k-surface-muted)', mb: 1 }}
                          />
                          <Skeleton
                            variant="text"
                            width="90%"
                            sx={{ bgcolor: 'var(--k-surface-muted)', mb: 2 }}
                          />
                          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Skeleton
                              variant="rectangular"
                              width={70}
                              height={24}
                              sx={{
                                bgcolor: 'var(--k-surface-muted)',
                                borderRadius: 1,
                              }}
                            />
                            <Skeleton
                              variant="rectangular"
                              width={70}
                              height={24}
                              sx={{
                                bgcolor: 'var(--k-surface-muted)',
                                borderRadius: 1,
                              }}
                            />
                            <Skeleton
                              variant="rectangular"
                              width={70}
                              height={24}
                              sx={{
                                bgcolor: 'var(--k-surface-muted)',
                                borderRadius: 1,
                              }}
                            />
                          </Box>
                          <Skeleton
                            variant="rectangular"
                            width="100%"
                            height={40}
                            sx={{
                              bgcolor: 'var(--k-surface-muted)',
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
                    bgcolor: 'var(--k-danger-soft)',
                    border: '1px solid var(--k-danger-border)',
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
                    sx={{ color: 'var(--k-danger-text)', mb: 2, fontWeight: 'bold' }}
                  >
                    Unable to Load Jobs
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: 'text.secondary', mb: 3 }}
                  >
                    {error}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => window.location.reload()}
                    sx={{
                      bgcolor: 'var(--k-gold)',
                      color: 'var(--k-text-on-accent)',
                      fontWeight: 'bold',
                      '&:hover': { bgcolor: 'var(--k-gold-dark)' },
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
                    bgcolor: 'var(--k-bg-surface)',
                    border: '2px dashed var(--k-accent-border-strong)',
                    borderRadius: 3,
                    p: 6,
                    maxWidth: 600,
                    mx: 'auto',
                  }}
                >
                  <SearchIcon
                    sx={{ fontSize: 80, color: 'var(--k-gold)', mb: 2, opacity: 0.5 }}
                  />
                  <Typography
                    variant="h5"
                    sx={{ color: 'var(--k-gold)', mb: 2, fontWeight: 'bold' }}
                  >
                    No Jobs Found
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: 'text.secondary', mb: 3 }}
                  >
                    {searchQuery || selectedCategory || selectedLocation
                      ? "We couldn't find any jobs matching your filters. Clear a filter or widen your search to see more work."
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
                          bgcolor: 'var(--k-gold)',
                          color: 'var(--k-text-on-accent)',
                          fontWeight: 'bold',
                          '&:hover': { bgcolor: 'var(--k-gold-dark)' },
                        }}
                      >
                        Clear All Filters
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setPage(1);
                        fetchJobs(1, false);
                      }}
                      sx={{
                        borderColor: 'var(--k-gold)',
                        color: 'var(--k-gold)',
                        '&:hover': {
                          borderColor: 'var(--k-gold-dark)',
                          bgcolor: 'var(--k-accent-soft)',
                        },
                      }}
                    >
                      Refresh Jobs
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}

            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {!loading &&
                !error &&
                uniqueJobs.map((job, index) => {
                  const jobHeroImage = getJobHeroImage(job);
                  const jobVisuals = getJobVisuals(job);
                  const employerAvatar = getEmployerAvatar(job);

                  return (
                  <Grid item xs={12} sm={6} md={6} lg={4} xl={3} key={job.id || job._id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index < 8 ? index * 0.1 : 0 }}
                      whileHover={{ scale: isSmallMobile ? 1 : 1.02 }}
                      {...motionProps} // ✅ Disable scale on mobile
                    >
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          bgcolor: 'var(--k-bg-surface)',
                          border: '1px solid var(--k-accent-border)',
                          borderRadius: { xs: 2, sm: 2 }, // ✅ Consistent border radius
                          minHeight: { xs: 'auto', sm: '320px' }, // ✅ Auto on mobile
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
                              'linear-gradient(90deg, var(--k-gold-dark), var(--k-gold))',
                            transform: 'scaleX(0)',
                            transformOrigin: 'left',
                            transition: 'transform 0.3s ease',
                          },
                          '&:hover': {
                            border: '1px solid var(--k-gold)',
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
                        <Box
                          sx={{
                            position: 'relative',
                            height: 148,
                            background: jobHeroImage
                              ? `linear-gradient(180deg, rgba(15,23,42,0.18) 0%, rgba(15,23,42,0.72) 100%), url(${jobHeroImage})`
                              : 'linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(15,118,110,0.35) 100%)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex',
                            alignItems: 'flex-end',
                            p: 2,
                          }}
                        >
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 12,
                              left: 12,
                              right: 12,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 1,
                            }}
                          >
                            <Chip
                              label={job.category || 'Trade job'}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(255,255,255,0.92)',
                                color: 'text.primary',
                                fontWeight: 700,
                              }}
                            />
                            {jobVisuals.length > 1 && (
                              <Chip
                                label={`${jobVisuals.length} visuals`}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(15,23,42,0.74)',
                                  color: 'white',
                                  fontWeight: 700,
                                }}
                              />
                            )}
                          </Box>

                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              bgcolor: 'rgba(15,23,42,0.64)',
                              color: 'white',
                              px: 1.25,
                              py: 0.75,
                              borderRadius: 2,
                              maxWidth: '100%',
                            }}
                          >
                            {React.createElement(getCategoryIcon(job.category), {
                              sx: { color: 'var(--k-gold)', fontSize: 18 },
                            })}
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 700, letterSpacing: 0.2 }}
                            >
                              {jobHeroImage
                                ? 'Image-backed job brief ready for quick review'
                                : 'Clear trade context helps workers decide faster'}
                            </Typography>
                          </Box>
                        </Box>
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
                                    color: 'var(--k-gold)',
                                    fontSize: { xs: 20, sm: 24 },
                                  },
                                },
                              )}
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant="h6"
                                  component="h2"
                                  sx={{
                                    color: 'text.primary',
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
                                    color: 'text.secondary',
                                    fontSize: { xs: '0.875rem', sm: '0.875rem' },
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                  }}
                                >
                                  {employerAvatar && (
                                    <Avatar
                                      src={employerAvatar}
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
                                        color: 'success.main',
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
                                        : 'warning.main',
                                      color: 'white',
                                      fontWeight: 'bold',
                                      fontSize: '0.7rem',
                                      animation: 'pulse 2s infinite',
                                      '@keyframes pulse': {
                                        '0%, 100%': { opacity: 1 },
                                        '50%': { opacity: 0.7 },
                                      },
                                      // ✅ MOBILE-AUDIT: Respect prefers-reduced-motion
                                      '@media (prefers-reduced-motion: reduce)': {
                                        animation: 'none',
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
                                      color: 'success.main',
                                      border: `1px solid ${theme.palette.success.main}`,
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
                                sx={{ mr: 1, color: 'var(--k-gold)' }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'text.primary',
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
                                sx={{ mr: 1, color: 'var(--k-gold)' }}
                              />
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                sx={{
                                  color: 'var(--k-gold)',
                                  fontSize: { xs: '0.875rem', sm: '0.95rem' },
                                }}
                              >
                                {job?.budget
                                  ? typeof job?.budget === 'object'
                                    ? job.budget.min === job.budget.max ||
                                      !job.budget.max
                                      ? `GH₵ ${(job.budget.amount || job.budget.min)?.toLocaleString()}`
                                      : `GH₵ ${job.budget.min?.toLocaleString()} - ${job.budget.max?.toLocaleString()}`
                                    : `GH₵ ${job?.budget?.toLocaleString()}`
                                  : 'Negotiable'}
                              </Typography>
                              <Chip
                                label={job.paymentType || 'Fixed'}
                                size="small"
                                sx={{
                                  ml: 1,
                                  bgcolor: 'var(--k-accent-soft-strong)',
                                  color: 'var(--k-gold)',
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
                                sx={{ mr: 1, color: 'var(--k-gold)' }}
                              />
                              <Typography
                                variant="body2"
                                sx={{ color: 'text.primary' }}
                              >
                                {job.rating ? `${job.rating} Rating` : 'New Listing'} •{' '}
                                {job.proposalCount || 0} Applicants
                              </Typography>
                            </Box>
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              mb: 2,
                              color: 'text.secondary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              lineHeight: 1.5,
                              fontSize: { xs: '0.85rem', sm: '0.875rem' },
                            }}
                          >
                            {job.description}
                          </Typography>
                          {/* Skills */}
                          {Array.isArray(job.skills) && job.skills.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                mb: 1,
                                color: 'var(--k-gold)',
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
                              {(job.skills || []).slice(0, 3).map((skill, index) => (
                                <Chip
                                  key={skill}
                                  label={skill}
                                  size="small"
                                  sx={{
                                    bgcolor: 'action.hover',
                                    color: 'text.primary',
                                    fontSize: { xs: '0.8rem', sm: '0.75rem' },
                                  }}
                                />
                              ))}
                              {job.skills.length > 3 && (
                                <Chip
                                  label={`+${job.skills.length - 3} more`}
                                  size="small"
                                  sx={{
                                    bgcolor: 'var(--k-accent-soft-strong)',
                                    color: 'var(--k-gold)',
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                          )}
                          {/* Deadlines */}
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 1,
                              flexWrap: 'wrap',
                            }}
                          >
                            <Chip
                              size="small"
                              label={job.postedDate ? (() => { try { return `Posted ${formatDistanceToNow(new Date(job.postedDate), { addSuffix: true })}`; } catch { return 'Recently posted'; } })() : 'Recently posted'}
                              sx={{ bgcolor: 'action.hover', color: 'text.secondary' }}
                            />
                            <Chip
                              size="small"
                              label={job.deadline ? (() => { try { return `Apply by ${format(new Date(job.deadline), 'MMM dd')}`; } catch { return 'Applications open'; } })() : 'Applications open'}
                              sx={{ bgcolor: 'rgba(244,67,54,0.08)', color: 'var(--k-danger-text)' }}
                            />
                          </Box>
                        </CardContent>

                        <CardActions
                          sx={{
                            p: { xs: 2, sm: 3 }, // ✅ Better mobile padding
                            pt: 0,
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            gap: 1,
                          }}
                        >
                          <Button
                            variant="contained"
                            fullWidth
                            onClick={() => {
                              const jobId = job._id || job.id;
                              if (!authState.isAuthenticated) {
                                navigate('/login', {
                                  state: {
                                    from: `/jobs/${jobId}/apply`,
                                    message:
                                      'Please sign in to apply for this job',
                                  },
                                });
                                return;
                              }

                              navigate(`/jobs/${jobId}/apply`);
                            }}
                            sx={{
                              bgcolor: 'var(--k-gold)',
                              color: 'var(--k-text-on-accent)',
                              fontWeight: 'bold',
                              fontSize: { xs: '1rem', sm: '0.875rem' }, // ✅ Slightly larger on mobile
                              padding: { xs: '10px 16px', sm: '8px 16px' }, // ✅ Better mobile padding
                              minHeight: { xs: '44px', sm: '40px' }, // ✅ Touch-friendly height
                              '&:hover': {
                                bgcolor: 'var(--k-gold-dark)',
                              },
                              // ✅ Mobile active feedback
                              '&:active': {
                                transform: 'scale(0.98)',
                              },
                            }}
                          >
                            Apply Now
                          </Button>
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
                            <Button
                              variant="outlined"
                              onClick={() => navigate(`/jobs/${job._id || job.id}`)}
                              startIcon={<Visibility />}
                              sx={{ flex: 1, minHeight: 44 }}
                            >
                              Details
                            </Button>
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleBookmark(job.id || job._id);
                              }}
                              aria-label={savedJobIds.has(job.id || job._id) ? 'Remove saved job' : 'Save job'}
                              sx={{
                                color: savedJobIds.has(job.id || job._id) ? 'secondary.main' : 'secondary.dark',
                                minWidth: 44,
                                minHeight: 44,
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              {savedJobIds.has(job.id || job._id) ? <BookmarkFilledIcon /> : <BookmarkBorder />}
                            </IconButton>
                            <IconButton
                              onClick={() => {
                                if (navigator.share) {
                                  navigator
                                    .share({
                                      title: job.title,
                                      text: `Check out this job opportunity: ${job.title} at ${job.employer?.name || 'Kelmah'}`,
                                      url:
                                        window.location.origin +
                                        `/jobs/${job._id || job.id}`,
                                    })
                                    .catch(() => {});
                                } else {
                                  navigator.clipboard.writeText(
                                    `${window.location.origin}/jobs/${job._id || job.id}`,
                                  ).catch(() => {});
                                }
                              }}
                              aria-label="Share job"
                              sx={{
                                color: 'var(--k-gold)',
                                minWidth: 44,
                                minHeight: 44,
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              <Share />
                            </IconButton>
                          </Box>
                        </CardActions>
                      </Card>
                    </motion.div>
                  </Grid>
                  );
                })}
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
                    <CircularProgress size={28} sx={{ color: 'var(--k-gold)' }} />
                  ) : (
                    <Button
                      variant="outlined"
                      size="medium"
                      onClick={() => setPage((p) => p + 1)}
                      sx={{
                        borderColor: 'var(--k-gold)',
                        color: 'var(--k-gold)',
                        px: 4,
                        py: 1,
                        '&:hover': { borderColor: 'var(--k-gold-dark)', bgcolor: 'var(--k-accent-soft)' },
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
                        '&.Mui-selected': { bgcolor: 'var(--k-gold)', color: 'var(--k-text-on-accent)' },
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
            {...motionProps}
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
                  color: 'var(--k-gold)',
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
            {...motionProps}
          >
            <Paper
              sx={{
                mt: { xs: 3, md: 4 }, // ✅ Reduced mobile margin
                p: { xs: 2.5, sm: 3, md: 4 }, // ✅ Responsive padding
                mx: { xs: 1, sm: 0 }, // ✅ Mobile horizontal spacing
                textAlign: 'center',
                bgcolor: 'var(--k-accent-soft)',
                border: '1px solid var(--k-accent-border-strong)',
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  color: 'var(--k-gold)',
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
                  color: 'text.secondary',
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
                    handleCreateJobAlert();
                  }}
                  sx={{
                    bgcolor: 'var(--k-gold)',
                    color: 'var(--k-text-on-accent)',
                    fontWeight: 'bold',
                    fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' }, // ✅ Responsive font
                    px: { xs: 3, sm: 3.5, md: 4 }, // ✅ Responsive padding
                    minHeight: { xs: '44px', sm: '48px' }, // ✅ Touch target
                    '&:hover': {
                      bgcolor: 'var(--k-gold-dark)',
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
                    borderColor: 'var(--k-gold)',
                    color: 'var(--k-gold)',
                    fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' }, // ✅ Responsive font
                    px: { xs: 3, sm: 3.5, md: 4 }, // ✅ Responsive padding
                    minHeight: { xs: '44px', sm: '48px' }, // ✅ Touch target
                    '&:hover': {
                      borderColor: 'var(--k-gold-dark)',
                      bgcolor: 'var(--k-accent-soft)',
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
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
      </PullToRefresh>
    </ErrorBoundary>
  );
};

export default JobsPage;
