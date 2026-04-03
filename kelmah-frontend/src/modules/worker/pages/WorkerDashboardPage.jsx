import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { normalizeUser } from '../../../utils/userUtils';
import PullToRefresh from '../../../components/common/PullToRefresh';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  ButtonBase,
  Breadcrumbs,
  Link,
  Tooltip,
  IconButton,
  Skeleton,
  Button,
  useTheme,
  Alert,
  AlertTitle,
  Chip,
  LinearProgress,
  Stack,
  Snackbar,
  Fade,
  Grow,
  alpha,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import WorkIcon from '@mui/icons-material/Work';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StarIcon from '@mui/icons-material/Star';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import MessageIcon from '@mui/icons-material/Message';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip,
} from 'recharts';
import {
  fetchWorkerApplications,
  fetchWorkerJobs,
  selectWorkerApplications,
  selectWorkerJobs,
  selectWorkerLoading,
  selectWorkerError,
  clearWorkerErrors,
} from '../services/workerSlice';
import workerService from '../services/workerService';
import jobsService from '../../jobs/services/jobsService';
import ProfileCompletionCard from '../components/ProfileCompletionCard';
import QuickActionsRow from '../components/QuickActionsRow';
import { Helmet } from 'react-helmet-async';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import { useVisibilityPolling } from '../../../hooks/useVisibilityPolling';
import { useBreakpointDown } from '@/hooks/useResponsive';
import { TOUCH_TARGET_MIN, Z_INDEX } from '@/constants/layout';
import PageCanvas from '@/modules/common/components/PageCanvas';
import { withBottomNavSafeArea } from '@/utils/safeArea';

/* ---------- Keyframes for spin animation ---------- */
const spinKeyframes = {
  '@keyframes spin': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
};

/* ---------- Extracted sub-components (stable references) ---------- */

const LoadingSkeleton = () => (
  <Grid container spacing={{ xs: 1.5, sm: 3, md: 2.5, lg: 2 }} sx={{ mb: 4 }}>
    {[1, 2, 3, 4].map((item) => (
      <Grid item xs={6} sm={6} md={3} key={item}>
        <Skeleton variant="rounded" height={120} animation="wave" />
      </Grid>
    ))}
  </Grid>
);

const LoadingTimeoutWarning = ({ onRefresh }) => (
  <Alert
    severity="warning"
    sx={{ mb: 2, borderRadius: 2 }}
    action={
      <Button
        color="inherit"
        size="small"
        onClick={onRefresh}
        sx={{ minHeight: TOUCH_TARGET_MIN }}
      >
        Refresh
      </Button>
    }
  >
    <AlertTitle>Slow Connection</AlertTitle>
    <Typography variant="body2">
      Loading is taking a bit longer. Please wait or tap Refresh.
    </Typography>
  </Alert>
);

const WorkerDashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useBreakpointDown('md');
  const isCompactMobile = useBreakpointDown('sm');
  const dashboardFontFamily =
    '"Plus Jakarta Sans", "Manrope", "Segoe UI", sans-serif';

  const { user: rawUser } = useSelector((state) => state.auth);
  const user = normalizeUser(rawUser);

  // Memoize curried selectors so useSelector receives stable references (prevents selector recreation every render)
  const selectPending = useMemo(() => selectWorkerApplications('pending'), []);
  const selectAccepted = useMemo(
    () => selectWorkerApplications('accepted'),
    [],
  );
  const selectRejected = useMemo(
    () => selectWorkerApplications('rejected'),
    [],
  );
  const selectCompletedJobs = useMemo(() => selectWorkerJobs('completed'), []);

  // Redux selectors for real data
  const pendingApplications = useSelector(selectPending) || [];
  const acceptedApplications = useSelector(selectAccepted) || [];
  const rejectedApplications = useSelector(selectRejected) || [];
  const completedJobs = useSelector(selectCompletedJobs) || [];
  // Memoize curried loading/error selectors to avoid selector recreation on every render
  const selectLoadingApps = useMemo(
    () => selectWorkerLoading('applications'),
    [],
  );
  const selectErrorApps = useMemo(() => selectWorkerError('applications'), []);
  const isLoading = useSelector(selectLoadingApps);
  const error = useSelector(selectErrorApps);

  // U-04 FIX: Default to 0% so incomplete profiles always see the prompt
  const [profileCompletion, setProfileCompletion] = useState({
    percentage: 0,
    missingFields: ['Loading...'],
  });

  // U-01: Job recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);

  // Enhanced state for error handling and loading feedback
  const [retryCount, setRetryCount] = useState(0);
  const retryCountRef = useRef(0);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const loadingTimeoutRef = useRef(null);
  const isRetryingRef = useRef(false);
  const MAX_RETRIES = 3;
  const LOADING_TIMEOUT = 15000; // 15 seconds

  const getAmountValue = useCallback((value, depth = 0) => {
    if (depth > 3) {
      return 0;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value.replace(/[^0-9.-]/g, ''));
      return Number.isFinite(parsed) ? parsed : 0;
    }

    if (value && typeof value === 'object') {
      const candidates = [
        value.amount,
        value.total,
        value.max,
        value.min,
        value.fixed,
        value.value,
      ];

      for (const candidate of candidates) {
        const normalized = getAmountValue(candidate, depth + 1);
        if (normalized > 0) {
          return normalized;
        }
      }
    }

    return 0;
  }, []);

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, []);

  // Fetch data with retry logic
  // NOTE: retryCountRef (not retryCount state) is read inside the callback to
  // keep the function identity stable and avoid an infinite re-render loop where
  // retryCount change → new fetchDashboardData → useEffect re-fires → fail → retry → loop.
  const fetchDashboardData = useCallback(async () => {
    setLoadingTimeout(false);

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    const timeoutId = setTimeout(() => {
      setLoadingTimeout(true);
    }, LOADING_TIMEOUT);
    loadingTimeoutRef.current = timeoutId;

    try {
      const results = await Promise.allSettled([
        dispatch(fetchWorkerApplications('pending')).unwrap(),
        dispatch(fetchWorkerApplications('accepted')).unwrap(),
        dispatch(fetchWorkerApplications('rejected')).unwrap(),
        dispatch(fetchWorkerJobs('completed')).unwrap(),
      ]);
      const hasFailures = results.some(
        (result) => result.status === 'rejected',
      );

      clearTimeout(timeoutId);
      if (loadingTimeoutRef.current === timeoutId) {
        loadingTimeoutRef.current = null;
      }
      setLoadingTimeout(false);
      if (retryCountRef.current > 0 && !hasFailures) {
        setSnackbarMessage('Dashboard data loaded successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else if (retryCountRef.current > 0 && hasFailures) {
        setSnackbarMessage('Some dashboard sections are still unavailable.');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (loadingTimeoutRef.current === timeoutId) {
        loadingTimeoutRef.current = null;
      }
      // Error captured by Redux slice — no manual logging needed
    } finally {
      isRetryingRef.current = false;
    }
  }, [dispatch]);

  // Initial fetch on mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useVisibilityPolling({
    enabled: true,
    intervalMs: 90_000,
    maxIntervalMs: 6 * 60 * 1000,
    shouldPause: () => isLoading || isRetryingRef.current || Boolean(error),
    callback: async () => {
      await fetchDashboardData();
    },
  });

  // Fetch profile completion data (Phase 1)
  useEffect(() => {
    let cancelled = false;
    const loadProfileCompletion = async () => {
      try {
        const userId = user?.id || user?._id || user?.userId;
        if (!userId) return;
        const stats = await workerService.getWorkerStats(userId);
        if (!cancelled) {
          setProfileCompletion({
            percentage: stats?.percentage ?? stats?.completionPercentage ?? 100,
            missingFields: [
              ...(stats?.missingRequired || []),
              ...(stats?.missingOptional || []),
            ],
          });
        }
      } catch (_) {
        // Non-blocking — profile widget will simply not display
        // Intentionally swallowed: profile completion is supplementary data
      }
    };
    loadProfileCompletion();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?._id, user?.userId]);

  // U-01: Fetch job recommendations for the worker
  useEffect(() => {
    let cancelled = false;
    const loadRecs = async () => {
      setRecsLoading(true);
      try {
        const jobs = await jobsService.getPersonalizedJobRecommendations({
          limit: 6,
        });
        if (!cancelled) setRecommendations(Array.isArray(jobs) ? jobs : []);
      } catch (_) {
        // Non-blocking — recommendations section will show empty state
      } finally {
        if (!cancelled) setRecsLoading(false);
      }
    };
    loadRecs();
    return () => {
      cancelled = true;
    };
  }, []);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const earningsSummary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const previousMonth = previousMonthDate.getMonth();
    const previousMonthYear = previousMonthDate.getFullYear();

    const completedTotals = (
      Array.isArray(completedJobs) ? completedJobs : []
    ).reduce(
      (acc, job) => {
        const amount = getAmountValue(
          job?.payment?.amount ||
            job?.paymentAmount ||
            job?.finalAmount ||
            job?.budget,
        );

        const referenceDate = new Date(
          job?.completedAt || job?.updatedAt || job?.createdAt || Date.now(),
        );

        if (
          referenceDate.getMonth() === currentMonth &&
          referenceDate.getFullYear() === currentYear
        ) {
          acc.thisMonth += amount;
        }

        if (
          referenceDate.getMonth() === previousMonth &&
          referenceDate.getFullYear() === previousMonthYear
        ) {
          acc.lastMonth += amount;
        }

        acc.total += amount;
        return acc;
      },
      { total: 0, thisMonth: 0, lastMonth: 0 },
    );

    const pendingEarnings = (
      Array.isArray(pendingApplications) ? pendingApplications : []
    ).reduce(
      (sum, application) => sum + getAmountValue(application?.proposedRate),
      0,
    );

    const fallbackTotal = getAmountValue(user?.totalEarnings);
    const total = Math.max(completedTotals.total, fallbackTotal);

    return {
      total,
      thisMonth: completedTotals.thisMonth,
      lastMonth: completedTotals.lastMonth,
      pending: pendingEarnings,
      // withdrawn is not tracked until a withdrawal API is wired — omit to avoid misleading chart segment
    };
  }, [completedJobs, pendingApplications, user, getAmountValue]);

  // Calculate real stats from Redux state
  const stats = useMemo(
    () => ({
      applications: pendingApplications.length + acceptedApplications.length,
      completedJobs: completedJobs.length,
      earnings: earningsSummary.total,
      // rating is not in the auth user object; sourced from review service at a later point
      rating: user?.rating ?? null,
    }),
    [
      pendingApplications,
      acceptedApplications,
      completedJobs,
      earningsSummary,
      user,
    ],
  );

  // Determine if this is a brand-new worker with no activity
  const isNewWorker =
    stats.applications === 0 &&
    stats.completedJobs === 0 &&
    stats.earnings === 0;

  // Handle refresh with retry logic
  const handleRefresh = useCallback(() => {
    dispatch(clearWorkerErrors());
    retryCountRef.current += 1;
    setRetryCount(retryCountRef.current);
    fetchDashboardData();
  }, [dispatch, fetchDashboardData]);

  // Auto-retry on error (up to MAX_RETRIES) — guarded to prevent re-entrant loops
  useEffect(() => {
    if (
      error &&
      retryCount < MAX_RETRIES &&
      !isLoading &&
      !isRetryingRef.current
    ) {
      isRetryingRef.current = true;
      const retryTimer = setTimeout(
        () => {
          setSnackbarMessage(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
          setSnackbarSeverity('info');
          setSnackbarOpen(true);
          handleRefresh();
        },
        3000 * (retryCount + 1),
      ); // Exponential backoff
      return () => clearTimeout(retryTimer);
    }
  }, [error, retryCount, isLoading, handleRefresh]);

  // Chart data for Earnings Overview — only include segments with non-zero values
  const earningsData = useMemo(
    () =>
      [
        {
          name: 'This Month',
          value: earningsSummary.thisMonth,
          color: theme.palette.success.main,
        },
        {
          name: 'Last Month',
          value: earningsSummary.lastMonth,
          color: theme.palette.info.main,
        },
        {
          name: 'Pending',
          value: earningsSummary.pending,
          color: theme.palette.warning.main,
        },
      ].filter((d) => d.value > 0),
    [earningsSummary, theme],
  );

  // Chart data for Applications Overview - using real data
  const applicationsData = useMemo(
    () => [
      {
        name: 'Accepted',
        value: acceptedApplications.length || 0,
        color: theme.palette.success.main,
      },
      {
        name: 'Pending',
        value: pendingApplications.length || 0,
        color: theme.palette.warning.main,
      },
      {
        name: 'Rejected',
        value: rejectedApplications.length || 0,
        color: theme.palette.error.main,
      },
    ],
    [acceptedApplications, pendingApplications, rejectedApplications],
  );

  const formatGhanaCurrencyLabel = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return 'GH₵0.00';
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  const insightCards = useMemo(
    () => [
      {
        title: 'This month',
        value: formatGhanaCurrencyLabel(earningsSummary.thisMonth || 0),
        helper: 'Earned from completed jobs',
        tone: theme.palette.success.main,
      },
      {
        title: 'Pending offers',
        value: pendingApplications.length,
        helper: 'Applications awaiting response',
        tone: theme.palette.warning.main,
      },
      {
        title: 'Completed jobs',
        value: completedJobs.length,
        helper: 'Jobs you have finished',
        tone: theme.palette.info.main,
      },
    ],
    [
      earningsSummary.thisMonth,
      pendingApplications.length,
      completedJobs.length,
      theme,
    ],
  );

  // Metric cards configuration - LC Portal style with tooltips
  const metricCards = [
    {
      title: 'Active Applications',
      value: stats.applications,
      tone: theme.palette.warning.main,
      icon: (
        <WorkIcon
          sx={{
            fontSize: { xs: 28, sm: 42 },
            color: alpha(theme.palette.warning.main, 0.25),
          }}
        />
      ),
      tooltip: 'Total number of job applications you have submitted',
      onClick: () => navigate('/worker/applications'),
    },
    {
      title: 'Completed Jobs',
      value: stats.completedJobs,
      tone: theme.palette.success.main,
      icon: (
        <AssignmentTurnedInIcon
          sx={{
            fontSize: { xs: 28, sm: 42 },
            color: alpha(theme.palette.success.main, 0.25),
          }}
        />
      ),
      tooltip: 'Jobs you have successfully completed',
      onClick: () => navigate('/worker/contracts'),
    },
    {
      title: 'Total Earnings',
      value: formatGhanaCurrencyLabel(
        Number.isFinite(stats.earnings) ? stats.earnings : 0,
      ),
      tone: theme.palette.info.main,
      icon: (
        <AttachMoneyIcon
          sx={{
            fontSize: { xs: 28, sm: 42 },
            color: alpha(theme.palette.info.main, 0.25),
          }}
        />
      ),
      tooltip: 'Your total earnings from completed jobs',
      onClick: () => navigate('/worker/earnings'),
    },
    {
      title: 'Average Rating',
      value: stats.rating > 0 ? stats.rating.toFixed(1) : 'N/A',
      tone: theme.palette.secondary.main,
      icon: (
        <StarIcon
          sx={{
            fontSize: { xs: 28, sm: 42 },
            color: alpha(theme.palette.secondary.main, 0.25),
          }}
        />
      ),
      tooltip: 'Your average rating from hirers',
      onClick: () => navigate('/worker/reviews'),
    },
  ];

  // Error display with retry functionality (uses closure over state)
  const renderErrorDisplay = () => (
    <Box sx={{ mb: 3 }}>
      <Alert
        severity={retryCount >= MAX_RETRIES ? 'error' : 'warning'}
        icon={<ErrorOutlineIcon />}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={handleRefresh}
            disabled={isLoading}
            sx={{ minHeight: TOUCH_TARGET_MIN }}
            startIcon={
              isLoading ? (
                <RefreshIcon
                  sx={{
                    animation: 'spin 1s linear infinite',
                    ...spinKeyframes,
                  }}
                />
              ) : (
                <RefreshIcon />
              )
            }
            aria-label="Refresh dashboard data"
          >
            {isLoading ? 'Retrying...' : 'Try Again'}
          </Button>
        }
        sx={{
          borderRadius: 2,
          '& .MuiAlert-message': { width: '100%' },
        }}
      >
        <AlertTitle sx={{ fontWeight: 600 }}>
          {retryCount >= MAX_RETRIES
            ? 'Unable to Load Dashboard'
            : 'Loading Issue Detected'}
        </AlertTitle>
        <Typography variant="body2" sx={{ mb: 1 }}>
          {error || 'Could not load your dashboard. Please try again.'}
        </Typography>
        {retryCount < MAX_RETRIES && (
          <Typography variant="caption" color="text.secondary">
            Auto-retry in {3 * (retryCount + 1)} seconds ({retryCount}/
            {MAX_RETRIES} attempts)
          </Typography>
        )}
        {retryCount >= MAX_RETRIES && (
          <Typography variant="caption" color="text.secondary">
            Please check your internet connection or try again later.
          </Typography>
        )}
      </Alert>
    </Box>
  );

  return (
    <PageCanvas
      disableContainer
      sx={{
        pt: { xs: 0, md: 4 },
        pb: { xs: withBottomNavSafeArea(24), md: 6 },
      }}
    >
      <PullToRefresh onRefresh={fetchDashboardData}>
        <Box
          sx={{
            background:
              theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, #05070d 0%, #071424 52%, #08172b 100%)'
                : 'linear-gradient(180deg, #f7f9fd 0%, #eef3fa 55%, #edf2fb 100%)',
            minHeight: '100dvh',
            fontFamily: dashboardFontFamily,
            p: { xs: 0, sm: 1.5, md: 3 },
            pb: withBottomNavSafeArea(56),
          }}
        >
          <Helmet>
            <title>Worker Dashboard | Kelmah</title>
          </Helmet>
          <Container maxWidth="xl" disableGutters>
            {/* Snackbar for notifications */}
            <Snackbar
              open={snackbarOpen}
              autoHideDuration={4000}
              onClose={() => setSnackbarOpen(false)}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
              <Alert
                onClose={() => setSnackbarOpen(false)}
                severity={snackbarSeverity}
                sx={{ width: '100%' }}
                icon={
                  snackbarSeverity === 'success' ? (
                    <CheckCircleIcon />
                  ) : undefined
                }
              >
                {snackbarMessage}
              </Alert>
            </Snackbar>

            {/* Loading Progress Bar */}
            {isLoading && (
              <LinearProgress
                sx={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex: 1200,
                  height: 3,
                }}
              />
            )}

            {/* Breadcrumb Navigation */}
            <Breadcrumbs
              separator={<NavigateNextIcon fontSize="small" />}
              sx={{ mb: 2, display: { xs: 'none', md: 'flex' } }}
              aria-label="Breadcrumb navigation"
            >
              <Link
                component={RouterLink}
                to="/"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  color: 'text.secondary',
                  textDecoration: 'none',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                <HomeIcon sx={{ fontSize: 18, mr: 0.5 }} />
                Home
              </Link>
              <Typography sx={{ color: 'text.primary', fontWeight: 500 }}>
                Dashboard
              </Typography>
            </Breadcrumbs>

            {/* Command Center Header */}
            <Paper
              elevation={0}
              sx={{
                mb: { xs: 0.8, md: 3 },
                p: { xs: 0.9, sm: 2.75, md: 3.25 },
                borderRadius: { xs: 0, md: 4 },
                border: '1px solid',
                borderColor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(56,189,248,0.26)'
                    : 'rgba(20,24,35,0.12)',
                background:
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(165deg, rgba(6,10,18,0.99) 0%, rgba(8,18,35,0.98) 58%, rgba(7,15,28,0.98) 100%)'
                    : 'linear-gradient(145deg, #ffffff 0%, #f2f7ff 54%, #edf4ff 100%)',
                boxShadow:
                  theme.palette.mode === 'dark'
                    ? '0 10px 22px rgba(0,0,0,0.35)'
                    : '0 14px 28px rgba(15,23,42,0.10)',
                position: 'relative',
                top: 'auto',
                zIndex: 1,
                overflow: 'hidden',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  width: { xs: 140, md: 220 },
                  height: { xs: 140, md: 220 },
                  borderRadius: '50%',
                  top: -70,
                  right: -55,
                  background:
                    theme.palette.mode === 'dark'
                      ? 'radial-gradient(circle, rgba(56,189,248,0.2) 0%, rgba(56,189,248,0) 70%)'
                      : 'radial-gradient(circle, rgba(14,165,233,0.16) 0%, rgba(14,165,233,0) 70%)',
                  pointerEvents: 'none',
                },
              }}
            >
              <Stack
                spacing={{ xs: 1, md: 2.25 }}
                sx={{ position: 'relative', zIndex: 1 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 1.5,
                    flexWrap: 'wrap',
                  }}
                >
                  <Box>
                    <Typography
                      variant={isCompactMobile ? 'h5' : 'h4'}
                      component="h1"
                      sx={{
                        color: 'text.primary',
                        fontWeight: 800,
                        letterSpacing: -0.4,
                        lineHeight: 1.1,
                      }}
                    >
                      {getGreeting()}, {user?.firstName || 'Worker'}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 0.35,
                        maxWidth: 620,
                        fontSize: { xs: '0.84rem', md: '1rem' },
                        lineHeight: { xs: 1.4, md: 1.5 },
                      }}
                    >
                      {isCompactMobile
                        ? 'Pipeline, earnings, and the next best jobs at a glance.'
                        : 'Your talent cockpit: watch your pipeline, earnings momentum, and the next best jobs to apply for.'}
                    </Typography>
                  </Box>
                  <Tooltip title="Refresh dashboard data" arrow>
                    <Box component="span" sx={{ display: 'inline-flex' }}>
                      <IconButton
                        onClick={handleRefresh}
                        disabled={isLoading}
                        sx={{
                          minWidth: TOUCH_TARGET_MIN,
                          minHeight: TOUCH_TARGET_MIN,
                          color: 'text.secondary',
                          border: '1px solid',
                          borderColor: alpha(theme.palette.info.main, 0.4),
                          backgroundColor: alpha(theme.palette.info.main, 0.08),
                          '&:focus-visible': {
                            outline: '3px solid',
                            outlineColor: 'primary.main',
                            outlineOffset: '2px',
                          },
                        }}
                        aria-label="Refresh dashboard"
                      >
                        <RefreshIcon
                          sx={{
                            animation: isLoading
                              ? 'spin 1s linear infinite'
                              : 'none',
                            ...spinKeyframes,
                          }}
                        />
                      </IconButton>
                    </Box>
                  </Tooltip>
                </Box>

                <Box sx={{ display: 'flex', gap: 0.65, flexWrap: 'wrap' }}>
                  <Chip
                    label={`Applications ${stats.applications}`}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      border: '1px solid',
                      borderColor: alpha(theme.palette.info.main, 0.24),
                      backgroundColor: alpha(theme.palette.info.main, 0.12),
                    }}
                  />
                  <Chip
                    label={`Completed ${stats.completedJobs}`}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      border: '1px solid',
                      borderColor: alpha(theme.palette.info.main, 0.24),
                      backgroundColor: alpha(theme.palette.info.main, 0.12),
                    }}
                  />
                  <Chip
                    label={formatGhanaCurrencyLabel(
                      Number.isFinite(stats.earnings) ? stats.earnings : 0,
                    )}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      border: '1px solid',
                      borderColor: alpha(theme.palette.info.main, 0.24),
                      backgroundColor: alpha(theme.palette.info.main, 0.12),
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    p: { xs: 0.9, md: 1.25 },
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.info.main, 0.28),
                    backgroundColor: alpha(
                      theme.palette.info.main,
                      theme.palette.mode === 'dark' ? 0.16 : 0.08,
                    ),
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: 0.85,
                    flexWrap: 'nowrap',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.primary',
                      fontWeight: 700,
                      lineHeight: 1.4,
                      fontSize: { xs: '0.81rem', sm: '0.875rem' },
                    }}
                  >
                    Next best action: review pending applications before opening
                    new searches.
                  </Typography>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => navigate('/worker/applications')}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      minHeight: TOUCH_TARGET_MIN,
                      width: { xs: '100%', sm: 'auto' },
                      backgroundColor: '#0ea5e9',
                      color: '#031526',
                      '&:hover': {
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                      },
                    }}
                  >
                    Open Pipeline
                  </Button>
                </Box>

                <Box
                  sx={{
                    display: { xs: 'none', sm: 'grid' },
                    gridTemplateColumns: {
                      xs: 'repeat(2, minmax(0, 1fr))',
                      sm: 'repeat(4, minmax(0, 1fr))',
                    },
                    gap: 1,
                  }}
                >
                  <Button
                    variant="contained"
                    startIcon={<SearchIcon />}
                    onClick={() => navigate('/worker/find-work')}
                    sx={{
                      borderRadius: 2.5,
                      minHeight: 44,
                      fontWeight: 700,
                      textTransform: 'none',
                    }}
                  >
                    Find Work
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AssignmentTurnedInIcon />}
                    onClick={() => navigate('/worker/applications')}
                    sx={{
                      borderRadius: 2.5,
                      minHeight: 44,
                      fontWeight: 700,
                      textTransform: 'none',
                    }}
                  >
                    Applications
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<MessageIcon />}
                    onClick={() => navigate('/messages')}
                    sx={{
                      borderRadius: 2.5,
                      minHeight: 44,
                      fontWeight: 700,
                      textTransform: 'none',
                    }}
                  >
                    Messages
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={
                      <RefreshIcon
                        sx={{
                          animation: isLoading
                            ? 'spin 1s linear infinite'
                            : 'none',
                          ...spinKeyframes,
                        }}
                      />
                    }
                    onClick={handleRefresh}
                    disabled={isLoading}
                    sx={{
                      borderRadius: 2.5,
                      minHeight: 44,
                      fontWeight: 700,
                      textTransform: 'none',
                    }}
                  >
                    Refresh
                  </Button>
                </Box>

                <Grid container spacing={1}>
                  {insightCards.map((item, index) => (
                    <Fade
                      in
                      timeout={420}
                      style={{ transitionDelay: `${120 + index * 90}ms` }}
                      key={`hero-fade-${item.title}`}
                    >
                      <Grid
                        item
                        xs={index < 2 ? 6 : 12}
                        sm={4}
                        key={`hero-${item.title}`}
                      >
                        <Box
                          sx={{
                            p: { xs: 0.95, sm: 1.5 },
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: alpha(item.tone, 0.36),
                            backgroundColor: alpha(
                              item.tone,
                              theme.palette.mode === 'dark' ? 0.1 : 0.08,
                            ),
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              textTransform: 'uppercase',
                              letterSpacing: 0.5,
                              color: 'text.secondary',
                            }}
                          >
                            {item.title}
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 800,
                              mt: 0.2,
                              fontSize: { xs: '0.95rem', sm: '1.2rem' },
                              lineHeight: 1.2,
                            }}
                          >
                            {item.value}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.helper}
                          </Typography>
                        </Box>
                      </Grid>
                    </Fade>
                  ))}
                </Grid>
              </Stack>
            </Paper>

            {/* Error Display - Shows inline instead of blocking */}
            {error && renderErrorDisplay()}

            {/* New Worker Welcome Banner - Shows when no activity */}
            {!isLoading && isNewWorker && (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 3 },
                  mb: { xs: 2, sm: 4 },
                  borderRadius: { xs: 0, sm: 2 },
                  backgroundColor: 'background.paper',
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.35),
                  color: 'text.primary',
                }}
              >
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                  Welcome to Kelmah! 🎉
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                  Start by browsing available jobs and submitting your first
                  application. Skilled workers like you are in high demand!
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={() => navigate('/worker/find-work')}
                  sx={{
                    minHeight: 44,
                    '&:focus-visible': {
                      outline: `3px solid ${theme.palette.primary.main}`,
                      outlineOffset: 2,
                    },
                  }}
                >
                  Find Your First Job
                </Button>
              </Paper>
            )}

            {/* Loading Timeout Warning */}
            {loadingTimeout && isLoading && (
              <LoadingTimeoutWarning onRefresh={handleRefresh} />
            )}

            {/* Profile Completion Widget (Phase 1) */}
            {!isLoading && profileCompletion.percentage < 100 && (
              <Fade in timeout={500}>
                <Box>
                  <ProfileCompletionCard
                    percentage={profileCompletion.percentage}
                    missingFields={profileCompletion.missingFields}
                    onStepClick={(path) => navigate(path)}
                  />
                </Box>
              </Fade>
            )}

            {/* Loading State */}
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <>
                {/* Quick Actions Row (Phase 2) */}
                {!isLoading && (
                  <Box
                    sx={{
                      mb: { xs: 2, sm: 2.5 },
                      p: { xs: 1.05, sm: 2 },
                      borderRadius: { xs: 0, sm: 2.5 },
                      border: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: alpha(
                        theme.palette.background.paper,
                        0.86,
                      ),
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ mb: { xs: 1, sm: 1.5 }, color: 'text.primary' }}
                    >
                      Quick Actions
                    </Typography>
                    <QuickActionsRow />
                  </Box>
                )}

                {/* Metric Cards - 4 colored cards LC Portal style */}
                <Grid
                  container
                  spacing={{ xs: 0.75, sm: 2.25, md: 2, lg: 2 }}
                  sx={{ mb: { xs: 2, sm: 4 } }}
                >
                  {metricCards.map((card, index) => (
                    <Fade
                      in
                      timeout={420}
                      style={{ transitionDelay: `${200 + index * 80}ms` }}
                      key={`metric-fade-${card.title}`}
                    >
                      <Grid item xs={6} sm={6} md={6} lg={3} key={card.title}>
                        <Tooltip title={card.tooltip} arrow placement="top">
                          <ButtonBase
                            onClick={card.onClick}
                            aria-label={`${card.title}: ${card.value}. Click to view details.`}
                            sx={{
                              display: 'block',
                              width: '100%',
                              textAlign: 'left',
                              borderRadius: 2,
                              overflow: 'hidden',
                              '&:focus-visible': {
                                outline: `2px solid ${theme.palette.primary.main}`,
                                outlineOffset: 2,
                              },
                            }}
                          >
                            <Paper
                              elevation={0}
                              sx={{
                                p: { xs: 0.95, sm: 2.25 },
                                borderRadius: { xs: 1.25, sm: 2.5 },
                                background: `linear-gradient(155deg, ${alpha(card.tone, theme.palette.mode === 'dark' ? 0.2 : 0.14)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 62%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
                                border: '1px solid',
                                borderColor: alpha(card.tone, 0.44),
                                color: 'text.primary',
                                position: 'relative',
                                overflow: 'hidden',
                                minHeight: { xs: 78, sm: 124, md: 132 },
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                // ✅ MOBILE-AUDIT P7: hover only on pointer devices
                                '@media (hover: hover)': {
                                  transition: 'transform 0.2s, box-shadow 0.2s',
                                  '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                                  },
                                },
                              }}
                            >
                              {/* Icon positioned on the right */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  right: { xs: 8, sm: 16 },
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                }}
                              >
                                {card.icon}
                              </Box>

                              {/* Text content */}
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: 'text.secondary',
                                  mb: 0.45,
                                  fontSize: { xs: '0.69rem', sm: '0.875rem' },
                                }}
                              >
                                {card.title}
                              </Typography>
                              <Typography
                                variant="h4"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: {
                                    xs: '0.96rem',
                                    sm: '1.5rem',
                                    md: '1.8rem',
                                  },
                                  lineHeight: 1.2,
                                  pr: { xs: 3, sm: 7 },
                                }}
                              >
                                {card.value}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'text.secondary',
                                  display: { xs: 'none', sm: 'inline' },
                                }}
                              >
                                Open details
                              </Typography>
                            </Paper>
                          </ButtonBase>
                        </Tooltip>
                      </Grid>
                    </Fade>
                  ))}
                </Grid>
              </>
            )}

            {/* U-01 FIX: Job Recommendations Section */}
            {!isLoading && (
              <Box
                sx={{
                  mb: { xs: 1.5, sm: 3 },
                  p: { xs: 0.85, sm: 2 },
                  borderRadius: { xs: 0, sm: 2.5 },
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: alpha(theme.palette.background.paper, 0.88),
                  backdropFilter: 'blur(4px)',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: { xs: 0.85, sm: 1.5 },
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color="text.primary"
                  >
                    Recommended Jobs
                  </Typography>
                  <Button
                    size="small"
                    component={RouterLink}
                    to="/jobs"
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Browse All
                  </Button>
                </Box>
                {recsLoading ? (
                  <Grid container spacing={0.75}>
                    {[1, 2, 3].map((i) => (
                      <Grid
                        item
                        xs={6}
                        sm={6}
                        md={4}
                        key={`recommendation-skeleton-${i}`}
                      >
                        <Skeleton variant="rounded" height={98} />
                      </Grid>
                    ))}
                  </Grid>
                ) : recommendations.length > 0 ? (
                  <Grid container spacing={0.75}>
                    {recommendations
                      .slice(0, isCompactMobile ? 4 : 8)
                      .map((job, index) => (
                        <Grid item xs={6} sm={6} md={3} key={job.id}>
                          <Paper
                            elevation={0}
                            component={ButtonBase}
                            sx={{
                              p: { xs: 0.85, sm: 2 },
                              borderRadius: { xs: 1.25, sm: 2 },
                              border: '1px solid',
                              borderColor: 'divider',
                              cursor: 'pointer',
                              transition: 'box-shadow 0.2s',
                              '&:hover': { boxShadow: 2 },
                              '&:focus-visible': {
                                outline: `3px solid ${theme.palette.primary.main}`,
                                outlineOffset: 2,
                              },
                              animation: 'workerCardRise 420ms ease-out both',
                              animationDelay: `${index * 55}ms`,
                              '@keyframes workerCardRise': {
                                from: {
                                  opacity: 0,
                                  transform: 'translateY(12px)',
                                },
                                to: { opacity: 1, transform: 'translateY(0)' },
                              },
                            }}
                            onClick={() => navigate(`/jobs/${job.id}`)}
                          >
                            <Typography
                              variant="subtitle2"
                              fontWeight={600}
                              sx={{
                                lineHeight: 1.15,
                                fontSize: { xs: '0.74rem', sm: '0.875rem' },
                                display: '-webkit-box',
                                WebkitLineClamp: isCompactMobile ? 2 : 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {job.title}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                              sx={{
                                fontSize: { xs: '0.64rem', sm: '0.75rem' },
                              }}
                            >
                              {job.employer?.name || 'Employer'} |{' '}
                              {job.location || 'Remote'}
                            </Typography>
                            <Box
                              sx={{
                                mt: 0.55,
                                display: 'flex',
                                gap: 0.35,
                                flexWrap: 'wrap',
                              }}
                            >
                              {(job.skills || [])
                                .slice(0, isCompactMobile ? 1 : 3)
                                .map((skill) => (
                                  <Box
                                    key={skill}
                                    sx={{
                                      px: 0.7,
                                      py: 0.2,
                                      borderRadius: 1,
                                      bgcolor: 'action.hover',
                                      fontSize: { xs: '0.6rem', sm: '0.7rem' },
                                    }}
                                  >
                                    {skill}
                                  </Box>
                                ))}
                            </Box>
                            {job.budget && (
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                color="primary"
                                sx={{
                                  mt: 0.55,
                                  fontSize: { xs: '0.72rem', sm: '0.875rem' },
                                }}
                              >
                                {job.currency || 'GHS'}{' '}
                                {typeof job.budget === 'object'
                                  ? `${job.budget.min}-${job.budget.max}`
                                  : job.budget}
                              </Typography>
                            )}
                          </Paper>
                        </Grid>
                      ))}
                  </Grid>
                ) : (
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 1.5, sm: 3 },
                      textAlign: 'center',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <SearchIcon
                      sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      No recommendations yet. Complete your profile and add
                      skills to get matched!
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}

            {/* Charts Section - denser desktop analytics row */}
            <Grid container spacing={{ xs: 0.75, sm: 2, md: 2 }}>
              {/* Earnings Overview Chart */}
              <Grid item xs={12} md={4}>
                <Grow in timeout={460}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 0.9, sm: 2, md: 3 },
                      borderRadius: { xs: 0, sm: 2.5 },
                      backgroundColor: alpha(
                        theme.palette.background.paper,
                        0.92,
                      ),
                      border: '1px solid',
                      borderColor: alpha(theme.palette.success.main, 0.24),
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'text.primary',
                        fontWeight: 600,
                        mb: 1.2,
                        fontSize: { xs: '0.86rem', sm: '1.25rem' },
                      }}
                    >
                      Earnings Overview
                    </Typography>
                    <Box sx={{ height: { xs: 158, md: 280 } }}>
                      {earningsData.some((d) => d.value > 0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={earningsData}
                              cx="50%"
                              cy="50%"
                              innerRadius={isCompactMobile ? 36 : 60}
                              outerRadius={isCompactMobile ? 58 : 100}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {earningsData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              formatter={(value) => [
                                formatGhanaCurrencyLabel(value),
                                '',
                              ]}
                              contentStyle={{
                                backgroundColor: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 8,
                              }}
                            />
                            {!isCompactMobile && (
                              <Legend
                                verticalAlign="bottom"
                                height={36}
                                formatter={(value) => (
                                  <span
                                    style={{
                                      color: theme.palette.text.secondary,
                                      fontSize: 12,
                                    }}
                                  >
                                    {value}
                                  </span>
                                )}
                              />
                            )}
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            gap: 1,
                          }}
                        >
                          <TrendingUpIcon
                            sx={{ fontSize: 48, color: 'text.disabled' }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            No earnings yet
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            Complete jobs to start earning
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grow>
              </Grid>

              {/* Applications Overview Chart */}
              <Grid item xs={12} md={4}>
                <Grow in timeout={540}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 0.9, sm: 2, md: 3 },
                      borderRadius: { xs: 0, sm: 2.5 },
                      backgroundColor: alpha(
                        theme.palette.background.paper,
                        0.92,
                      ),
                      border: '1px solid',
                      borderColor: alpha(theme.palette.info.main, 0.24),
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'text.primary',
                        fontWeight: 600,
                        mb: 1.2,
                        fontSize: { xs: '0.86rem', sm: '1.25rem' },
                      }}
                    >
                      Applications Overview
                    </Typography>
                    <Box sx={{ height: { xs: 158, md: 280 } }}>
                      {applicationsData.some((d) => d.value > 0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={applicationsData}
                              cx="50%"
                              cy="50%"
                              innerRadius={isCompactMobile ? 36 : 60}
                              outerRadius={isCompactMobile ? 58 : 100}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {applicationsData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 8,
                              }}
                            />
                            {!isCompactMobile && (
                              <Legend
                                verticalAlign="bottom"
                                height={36}
                                formatter={(value) => (
                                  <span
                                    style={{
                                      color: theme.palette.text.secondary,
                                      fontSize: 12,
                                    }}
                                  >
                                    {value}
                                  </span>
                                )}
                              />
                            )}
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            gap: 1,
                          }}
                        >
                          <InboxOutlinedIcon
                            sx={{ fontSize: 48, color: 'text.disabled' }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            No applications yet
                          </Typography>
                          <Button
                            size="small"
                            onClick={() => navigate('/worker/find-work')}
                          >
                            Browse Jobs
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grow>
              </Grid>

              <Grid item xs={12} md={4}>
                <Grow in timeout={620}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 0.9, sm: 2, md: 3 },
                      borderRadius: { xs: 0, sm: 2.5 },
                      backgroundColor: alpha(
                        theme.palette.background.paper,
                        0.92,
                      ),
                      border: '1px solid',
                      borderColor: alpha(theme.palette.warning.main, 0.24),
                      height: '100%',
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'text.primary',
                        fontWeight: 600,
                        mb: 1.2,
                        fontSize: { xs: '0.86rem', sm: '1.25rem' },
                      }}
                    >
                      Pipeline Health
                    </Typography>
                    <Stack spacing={0.9}>
                      {applicationsData.map((item) => (
                        <Box key={`desktop-${item.name}`}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              mb: 0.5,
                            }}
                          >
                            <Typography variant="body2" fontWeight={600}>
                              {item.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.value}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={
                              stats.applications > 0
                                ? (item.value /
                                    Math.max(stats.applications, 1)) *
                                  100
                                : 0
                            }
                            sx={{
                              height: 8,
                              borderRadius: 999,
                              backgroundColor: alpha(item.color, 0.12),
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: item.color,
                                borderRadius: 999,
                              },
                            }}
                          />
                        </Box>
                      ))}
                      <Paper
                        elevation={0}
                        sx={{
                          mt: 0.5,
                          p: 1.1,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: alpha(theme.palette.primary.main, 0.25),
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.06,
                          ),
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            textTransform: 'uppercase',
                            letterSpacing: 0.4,
                          }}
                        >
                          Conversion snapshot
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{ fontWeight: 800, mt: 0.25 }}
                        >
                          {stats.applications > 0
                            ? `${Math.round((acceptedApplications.length / Math.max(stats.applications, 1)) * 100)}%`
                            : '0%'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Application acceptance ratio
                        </Typography>
                      </Paper>
                    </Stack>
                  </Paper>
                </Grow>
              </Grid>
            </Grid>

            <Paper
              elevation={8}
              sx={(theme) => ({
                display: { xs: 'flex', sm: 'none' },
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: withBottomNavSafeArea(0),
                zIndex: Z_INDEX.stickyCta,
                px: 1,
                py: 1,
                gap: 1,
                borderTop: `1px solid ${theme.palette.divider}`,
                backgroundColor: alpha(theme.palette.background.paper, 0.96),
                backdropFilter: 'blur(6px)',
              })}
            >
              <Button
                fullWidth
                variant="outlined"
                color="info"
                sx={{ minHeight: TOUCH_TARGET_MIN }}
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={isLoading}
              >
                Refresh
              </Button>
              <Button
                fullWidth
                variant="contained"
                color="info"
                sx={{
                  minHeight: TOUCH_TARGET_MIN,
                  boxShadow: '0 2px 8px rgba(14,165,233,0.35)',
                }}
                startIcon={<SearchIcon />}
                onClick={() => navigate('/worker/find-work')}
              >
                Find Work
              </Button>
            </Paper>
          </Container>
        </Box>
      </PullToRefresh>
    </PageCanvas>
  );
};

export default WorkerDashboardPage;
