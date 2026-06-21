/**
 * WorkerDashboardPage - Stitch-design desktop dashboard
 *
 * Matches the Stitch worker_dashboard design:
 * - Hero section (glass-panel) with greeting + quick stats (Applications, Completed, Earnings)
 * - Next Best Action banner (pending applications prompt)
 * - Two-column layout:
 *   Left: Quick Actions grid + Performance Overview cards
 *   Right: Profile Strength card with progress + Location card
 *
 * Backend integration via workerSlice Redux thunks:
 * - fetchWorkerApplications, fetchWorkerJobs, fetchWorkerProfile
 * Plus workerService.getWorkerStats for profile completion.
 */
import PropTypes from 'prop-types';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { normalizeUser } from '../../../utils/userUtils';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Skeleton,
  Alert,
  AlertTitle,
  Snackbar,
  Stack,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SearchIcon from '@mui/icons-material/Search';
import MessageIcon from '@mui/icons-material/Message';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import PaymentsIcon from '@mui/icons-material/Payments';
import InfoIcon from '@mui/icons-material/Info';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DescriptionIcon from '@mui/icons-material/Description';
import { Helmet } from 'react-helmet-async';
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
import { useVisibilityPolling } from '../../../hooks/useVisibilityPolling';
import { useBreakpointDown } from '@/hooks/useResponsive';
import useOnlineStatus from '@/hooks/useOnlineStatus';
import useNetworkSpeed from '@/hooks/useNetworkSpeed';
import { TOUCH_TARGET_MIN } from '@/constants/layout';
import PageCanvas from '@/modules/common/components/PageCanvas';
import { withBottomNavSafeArea } from '@/utils/safeArea';

// ─── Stitch design tokens ───
const STITCH = {
  primaryContainer: '#d4af37',
  onPrimaryContainer: '#554300',
  surfaceContainer: '#1e1f23',
  surface: '#121317',
  surfaceVariant: '#343539',
  surfaceBright: '#38393d',
  surfaceDim: '#121317',
  borderMuted: '#2C2C2E',
  onSurface: '#e3e2e7',
  onSurfaceVariant: '#d0c5af',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#DC2626',
  primary: '#f2ca50',
  outline: '#99907c',
};

/* ---------- Keyframes for spin animation ---------- */
const spinKeyframes = {
  '@keyframes spin': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
};

const WORKER_DASHBOARD_POLL_INTERVAL_MS = 90_000;
const WORKER_DASHBOARD_LOW_BANDWIDTH_POLL_INTERVAL_MS = 3 * 60 * 1000;
const MAX_RETRIES = 3;
const LOADING_TIMEOUT = 15000;

const WorkerDashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isCompactMobile = useBreakpointDown('sm');
  const { isOnline, wasOffline } = useOnlineStatus();
  const { isSlow, effectiveType, downlink, rtt, saveData } = useNetworkSpeed();
  const lowBandwidthModeActive = isOnline && (isSlow || saveData);
  const dashboardPollingIntervalMs = lowBandwidthModeActive
    ? WORKER_DASHBOARD_LOW_BANDWIDTH_POLL_INTERVAL_MS
    : WORKER_DASHBOARD_POLL_INTERVAL_MS;

  const { user: rawUser } = useSelector((state) => state.auth);
  const user = normalizeUser(rawUser);

  // Memoize curried selectors
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

  const pendingApplications = useSelector(selectPending);
  const acceptedApplications = useSelector(selectAccepted);
  const rejectedApplications = useSelector(selectRejected);
  const completedJobs = useSelector(selectCompletedJobs);

  const selectLoadingApps = useMemo(
    () => selectWorkerLoading('applications'),
    [],
  );
  const selectErrorApps = useMemo(() => selectWorkerError('applications'), []);
  const isLoading = useSelector(selectLoadingApps);
  const error = useSelector(selectErrorApps);

  const [profileCompletion, setProfileCompletion] = useState({
    percentage: 0,
    missingFields: ['Loading...'],
  });
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const retryCountRef = useRef(0);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const loadingTimeoutRef = useRef(null);
  const isRetryingRef = useRef(false);

  const getAmountValue = useCallback((value, depth = 0) => {
    if (depth > 3) return 0;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
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
        if (normalized > 0) return normalized;
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

  const fetchDashboardData = useCallback(async () => {
    setLoadingTimeout(false);
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    const timeoutId = setTimeout(() => setLoadingTimeout(true), LOADING_TIMEOUT);
    loadingTimeoutRef.current = timeoutId;

    try {
      const results = await Promise.allSettled([
        dispatch(fetchWorkerApplications('pending')).unwrap(),
        dispatch(fetchWorkerApplications('accepted')).unwrap(),
        dispatch(fetchWorkerApplications('rejected')).unwrap(),
        dispatch(fetchWorkerJobs('completed')).unwrap(),
      ]);
      const hasFailures = results.some((r) => r.status === 'rejected');

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
    } catch {
      clearTimeout(timeoutId);
      if (loadingTimeoutRef.current === timeoutId) {
        loadingTimeoutRef.current = null;
      }
    } finally {
      isRetryingRef.current = false;
    }
  }, [dispatch]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useVisibilityPolling({
    enabled: isOnline,
    intervalMs: dashboardPollingIntervalMs,
    maxIntervalMs: dashboardPollingIntervalMs * 4,
    shouldPause: () =>
      isLoading || isRetryingRef.current || Boolean(error) || !isOnline,
    callback: async () => {
      await fetchDashboardData();
    },
  });

  // Fetch profile completion data
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
      } catch {
        // Non-blocking
      }
    };
    loadProfileCompletion();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?._id, user?.userId]);

  // Fetch job recommendations
  useEffect(() => {
    let cancelled = false;
    const loadRecs = async () => {
      setRecsLoading(true);
      try {
        const jobs = await jobsService.getPersonalizedJobRecommendations({
          limit: 6,
        });
        if (!cancelled) setRecommendations(Array.isArray(jobs) ? jobs : []);
      } catch {
        // Non-blocking
      } finally {
        if (!cancelled) setRecsLoading(false);
      }
    };
    loadRecs();
    return () => {
      cancelled = true;
    };
  }, []);

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
    };
  }, [completedJobs, pendingApplications, user, getAmountValue]);

  const stats = useMemo(
    () => ({
      applications:
        pendingApplications.length +
        acceptedApplications.length +
        rejectedApplications.length,
      completedJobs: completedJobs.length,
      earnings: earningsSummary.total,
      rating: user?.rating ?? null,
    }),
    [
      pendingApplications,
      acceptedApplications,
      rejectedApplications,
      completedJobs,
      earningsSummary,
      user,
    ],
  );

  const handleRefresh = useCallback(() => {
    dispatch(clearWorkerErrors());
    retryCountRef.current += 1;
    setRetryCount(retryCountRef.current);
    fetchDashboardData();
  }, [dispatch, fetchDashboardData]);

  // Auto-retry on error
  useEffect(() => {
    if (
      error &&
      retryCount < MAX_RETRIES &&
      !isLoading &&
      !isRetryingRef.current
    ) {
      isRetryingRef.current = true;
      const retryTimer = setTimeout(() => {
        setSnackbarMessage(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        setSnackbarSeverity('info');
        setSnackbarOpen(true);
        handleRefresh();
      }, 3000 * (retryCount + 1));
      return () => clearTimeout(retryTimer);
    }
  }, [error, retryCount, isLoading, handleRefresh]);

  const formatGhanaCurrencyLabel = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return 'GH₵0.00';
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  const userFirstName =
    user?.firstName ||
    user?.name?.split(' ')[0] ||
    'there';

  const pendingCount = pendingApplications?.length || 0;

  // Profile completion checklist items
  const profileChecklist = useMemo(() => {
    const missing = profileCompletion.missingFields || [];
    const items = [
      {
        label: 'Upload Professional Avatar',
        done: !missing.some((m) =>
          m.toLowerCase().includes('avatar') ||
          m.toLowerCase().includes('photo') ||
          m.toLowerCase().includes('picture'),
        ),
      },
      {
        label: 'Verify Identity',
        done: !missing.some((m) =>
          m.toLowerCase().includes('identity') ||
          m.toLowerCase().includes('verification') ||
          m.toLowerCase().includes('document'),
        ),
      },
      {
        label: 'Add Skills & Expertise',
        done: !missing.some((m) =>
          m.toLowerCase().includes('skill') ||
          m.toLowerCase().includes('expertise') ||
          m.toLowerCase().includes('specialization'),
        ),
      },
      {
        label: 'Upload Portfolio Pieces',
        done: !missing.some((m) =>
          m.toLowerCase().includes('portfolio') ||
          m.toLowerCase().includes('work sample'),
        ),
        actionable: true,
      },
    ];
    // If profile is 100%, mark all done
    if (profileCompletion.percentage >= 100) {
      return items.map((i) => ({ ...i, done: true }));
    }
    return items;
  }, [profileCompletion]);

  const isInitialLoading = isLoading && !pendingApplications && !completedJobs;

  // ─── Loading skeleton ───
  if (isInitialLoading) {
    return (
      <PageCanvas>
        <Helmet>
          <title>Worker Dashboard | Kelmah</title>
        </Helmet>
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1280, mx: 'auto' }}>
          <Skeleton
            variant="rounded"
            height={280}
            sx={{ mb: 3, borderRadius: 2 }}
          />
          <Skeleton
            variant="rounded"
            height={100}
            sx={{ mb: 3, borderRadius: 2 }}
          />
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Skeleton variant="rounded" height={200} sx={{ mb: 3 }} />
              <Skeleton variant="rounded" height={200} />
            </Grid>
            <Grid item xs={12} lg={4}>
              <Skeleton variant="rounded" height={300} sx={{ mb: 3 }} />
              <Skeleton variant="rounded" height={192} />
            </Grid>
          </Grid>
        </Box>
      </PageCanvas>
    );
  }

  return (
    <PageCanvas>
      <Helmet>
        <title>Worker Dashboard | Kelmah</title>
      </Helmet>
      <Box
        {...withBottomNavSafeArea()}
        sx={{
          maxWidth: 1280,
          mx: 'auto',
          px: { xs: 2, md: 4 },
          py: { xs: 2, md: 4 },
          fontFamily: '"Montserrat", "Roboto Flex", sans-serif',
        }}
      >
        {/* ─── Error display ─── */}
        {error && retryCount >= MAX_RETRIES && (
          <Alert
            severity="error"
            icon={<ErrorOutlineIcon />}
            sx={{ mb: 3, borderRadius: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={handleRefresh}
                disabled={isLoading}
                startIcon={
                  isLoading ? (
                    <RefreshIcon
                      sx={{ animation: 'spin 1s linear infinite' }}
                    />
                  ) : (
                    <RefreshIcon />
                  )
                }
                sx={{ minHeight: TOUCH_TARGET_MIN }}
              >
                Retry
              </Button>
            }
          >
            <AlertTitle>Dashboard Error</AlertTitle>
            {error}
          </Alert>
        )}

        {loadingTimeout && !error && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
            Loading is taking longer than expected. Please wait or tap refresh.
          </Alert>
        )}

        {/* ─── Hero Section (glass-panel, rounded-2xl) ─── */}
        <Paper
          elevation={0}
          sx={{
            position: 'relative',
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: STITCH.surfaceContainer,
            border: `1px solid ${STITCH.borderMuted}`,
            mt: { xs: 1, md: 2 },
            mb: 3,
            p: { xs: 3, md: 5 },
            background: `rgba(26, 26, 26, 0.6)`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            '&:hover': {
              boxShadow: '0 0 15px rgba(212, 175, 55, 0.15)',
            },
          }}
        >
          {/* Decorative glow */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 256,
              height: 256,
              bgcolor: alpha(STITCH.primaryContainer, 0.05),
              borderRadius: '50%',
              filter: 'blur(80px)',
              transform: 'translateY(-50%) translateX(25%)',
              pointerEvents: 'none',
            }}
          />
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography
              sx={{
                fontFamily: '"Montserrat", sans-serif',
                fontWeight: 700,
                color: STITCH.onSurface,
                fontSize: { xs: '1.75rem', md: '3.5rem' },
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                mb: 1,
              }}
            >
              {getGreeting()},{' '}
              <Box component="span" sx={{ color: STITCH.primary }}>
                {userFirstName}
              </Box>
              .
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Roboto Flex", sans-serif',
                fontSize: { xs: '1rem', md: '1.125rem' },
                lineHeight: 1.6,
                color: STITCH.onSurfaceVariant,
                maxWidth: 640,
              }}
            >
              Your talent cockpit. Review your performance, manage active
              contracts, and discover new premium opportunities.
            </Typography>

            {/* Quick Stats inside Hero */}
            <Grid container spacing={3} sx={{ mt: 4 }}>
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    bgcolor: alpha(STITCH.surfaceDim, 0.5),
                    borderRadius: 2,
                    p: 3,
                    border: `1px solid ${alpha(STITCH.borderMuted, 0.5)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: '"Montserrat", sans-serif',
                        fontSize: '0.75rem',
                        color: STITCH.onSurfaceVariant,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: 500,
                        mb: 0.5,
                      }}
                    >
                      Applications
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: '"Montserrat", sans-serif',
                        fontSize: '2rem',
                        fontWeight: 600,
                        color: STITCH.onSurface,
                        lineHeight: 1.2,
                      }}
                    >
                      {stats.applications}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: STITCH.surfaceVariant,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: STITCH.primary,
                    }}
                  >
                    <AssignmentIcon />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    bgcolor: alpha(STITCH.surfaceDim, 0.5),
                    borderRadius: 2,
                    p: 3,
                    border: `1px solid ${alpha(STITCH.borderMuted, 0.5)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: '"Montserrat", sans-serif',
                        fontSize: '0.75rem',
                        color: STITCH.onSurfaceVariant,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: 500,
                        mb: 0.5,
                      }}
                    >
                      Completed
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: '"Montserrat", sans-serif',
                        fontSize: '2rem',
                        fontWeight: 600,
                        color: STITCH.onSurface,
                        lineHeight: 1.2,
                      }}
                    >
                      {stats.completedJobs}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: STITCH.surfaceVariant,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: STITCH.primary,
                    }}
                  >
                    <TaskAltIcon />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    bgcolor: alpha(STITCH.surfaceDim, 0.5),
                    borderRadius: 2,
                    p: 3,
                    border: `1px solid ${alpha(STITCH.borderMuted, 0.5)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: '"Montserrat", sans-serif',
                        fontSize: '0.75rem',
                        color: STITCH.onSurfaceVariant,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: 500,
                        mb: 0.5,
                      }}
                    >
                      Earnings
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: '"Montserrat", sans-serif',
                        fontSize: '2rem',
                        fontWeight: 600,
                        color: STITCH.primary,
                        lineHeight: 1.2,
                      }}
                    >
                      {formatGhanaCurrencyLabel(stats.earnings)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: STITCH.surfaceVariant,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: STITCH.primary,
                    }}
                  >
                    <PaymentsIcon />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* ─── Next Best Action Banner ─── */}
        {pendingCount > 0 && (
          <Paper
            elevation={0}
            sx={{
              bgcolor: alpha(STITCH.surfaceVariant, 0.3),
              border: `1px solid ${alpha(STITCH.primaryContainer, 0.3)}`,
              borderRadius: 2,
              p: 3,
              mb: 3,
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              '&:hover': {
                boxShadow: '0 0 15px rgba(212, 175, 55, 0.15)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: alpha(STITCH.primaryContainer, 0.2),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: STITCH.primary,
                  flexShrink: 0,
                }}
              >
                <InfoIcon />
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontFamily: '"Montserrat", sans-serif',
                    fontWeight: 600,
                    fontSize: '1.125rem',
                    color: STITCH.onSurface,
                  }}
                >
                  Review pending applications
                </Typography>
                <Typography
                  sx={{
                    fontFamily: '"Roboto Flex", sans-serif',
                    fontSize: '0.875rem',
                    color: STITCH.onSurfaceVariant,
                    mt: 0.5,
                  }}
                >
                  You have {pendingCount} offer
                  {pendingCount !== 1 ? 's' : ''} awaiting your response.
                  Securing these can boost your pipeline.
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/worker/applications')}
              sx={{
                bgcolor: STITCH.primary,
                color: STITCH.onPrimaryContainer,
                borderRadius: '8px',
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontFamily: '"Montserrat", sans-serif',
                flexShrink: 0,
                boxShadow: '0 0 15px rgba(212,175,55,0.3)',
                '&:hover': { filter: 'brightness(1.1)' },
              }}
            >
              Open Pipeline
            </Button>
          </Paper>
        )}

        {/* ─── Two-Column Layout ─── */}
        <Grid container spacing={3}>
          {/* ── Left Column (lg:col-span-2) ── */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={3}>
              {/* Quick Actions Grid (2x2) */}
              <Box>
                <Typography
                  sx={{
                    fontFamily: '"Montserrat", sans-serif',
                    fontWeight: 600,
                    fontSize: '1.5rem',
                    color: STITCH.onSurface,
                    mb: 2,
                  }}
                >
                  Quick Actions
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Button
                      fullWidth
                      onClick={() => navigate('/worker/jobs')}
                      sx={{
                        bgcolor: STITCH.primary,
                        color: STITCH.onPrimaryContainer,
                        borderRadius: 2,
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1.5,
                        textTransform: 'none',
                        fontFamily: '"Montserrat", sans-serif',
                        fontWeight: 600,
                        aspectRatio: '1',
                        boxShadow: '0 0 20px rgba(212,175,55,0.2)',
                        '&:hover': { filter: 'brightness(1.1)' },
                      }}
                    >
                      <SearchIcon sx={{ fontSize: 30 }} />
                      Find Work
                    </Button>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Button
                      fullWidth
                      onClick={() => navigate('/worker/applications')}
                      sx={{
                        bgcolor: 'rgba(26, 26, 26, 0.6)',
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${STITCH.borderMuted}`,
                        color: STITCH.onSurface,
                        borderRadius: 2,
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1.5,
                        textTransform: 'none',
                        fontFamily: '"Montserrat", sans-serif',
                        fontWeight: 600,
                        aspectRatio: '1',
                        '&:hover': {
                          borderColor: STITCH.outline,
                          color: STITCH.primary,
                        },
                      }}
                    >
                      <DescriptionIcon
                        sx={{ fontSize: 30, color: STITCH.onSurfaceVariant }}
                      />
                      Applications
                    </Button>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Button
                      fullWidth
                      onClick={() => navigate('/messages')}
                      sx={{
                        bgcolor: 'rgba(26, 26, 26, 0.6)',
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${STITCH.borderMuted}`,
                        color: STITCH.onSurface,
                        borderRadius: 2,
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1.5,
                        textTransform: 'none',
                        fontFamily: '"Montserrat", sans-serif',
                        fontWeight: 600,
                        aspectRatio: '1',
                        position: 'relative',
                        '&:hover': {
                          borderColor: STITCH.outline,
                          color: STITCH.primary,
                        },
                      }}
                    >
                      <MessageIcon
                        sx={{ fontSize: 30, color: STITCH.onSurfaceVariant }}
                      />
                      Messages
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 16,
                          right: 16,
                          width: 12,
                          height: 12,
                          bgcolor: STITCH.primary,
                          borderRadius: '50%',
                        }}
                      />
                    </Button>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Button
                      fullWidth
                      onClick={handleRefresh}
                      disabled={isLoading}
                      sx={{
                        bgcolor: 'rgba(26, 26, 26, 0.6)',
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${STITCH.borderMuted}`,
                        color: STITCH.onSurface,
                        borderRadius: 2,
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1.5,
                        textTransform: 'none',
                        fontFamily: '"Montserrat", sans-serif',
                        fontWeight: 600,
                        aspectRatio: '1',
                        '&:hover': {
                          borderColor: STITCH.outline,
                          color: STITCH.primary,
                        },
                      }}
                    >
                      {isLoading ? (
                        <RefreshIcon
                          sx={{
                            fontSize: 30,
                            color: STITCH.onSurfaceVariant,
                            animation: 'spin 1s linear infinite',
                          }}
                        />
                      ) : (
                        <RefreshIcon
                          sx={{
                            fontSize: 30,
                            color: STITCH.onSurfaceVariant,
                          }}
                        />
                      )}
                      Refresh
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              {/* Performance Overview */}
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 2,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Montserrat", sans-serif',
                      fontWeight: 600,
                      fontSize: '1.5rem',
                      color: STITCH.onSurface,
                    }}
                  >
                    Performance Overview
                  </Typography>
                  <TrendingUpIcon
                    sx={{ fontSize: 18, color: STITCH.onSurfaceVariant }}
                  />
                </Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Paper
                      elevation={0}
                      sx={{
                        bgcolor: 'rgba(26, 26, 26, 0.6)',
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${STITCH.borderMuted}`,
                        borderTop: `2px solid ${STITCH.borderMuted}`,
                        borderRadius: 2,
                        p: 3,
                        transition: 'border-color 0.3s',
                        '&:hover': { borderTopColor: STITCH.primary },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 2,
                        }}
                      >
                        <AttachMoneyIcon
                          sx={{ color: STITCH.onSurfaceVariant }}
                        />
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            bgcolor: STITCH.surfaceVariant,
                            color: STITCH.onSurface,
                            px: 1,
                            py: 0.5,
                            borderRadius: '4px',
                            fontFamily: '"Montserrat", sans-serif',
                          }}
                        >
                          This Month
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontFamily: '"Roboto Flex", sans-serif',
                          fontSize: '0.875rem',
                          color: STITCH.onSurfaceVariant,
                          mb: 0.5,
                        }}
                      >
                        Earnings
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: '"Montserrat", sans-serif',
                          fontSize: '2rem',
                          fontWeight: 600,
                          color: STITCH.primary,
                          lineHeight: 1.2,
                        }}
                      >
                        {formatGhanaCurrencyLabel(earningsSummary.thisMonth)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper
                      elevation={0}
                      sx={{
                        bgcolor: 'rgba(26, 26, 26, 0.6)',
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${STITCH.borderMuted}`,
                        borderTop: `2px solid ${STITCH.borderMuted}`,
                        borderRadius: 2,
                        p: 3,
                        transition: 'border-color 0.3s',
                        '&:hover': { borderTopColor: STITCH.primary },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 2,
                        }}
                      >
                        <AssignmentIcon
                          sx={{ color: STITCH.onSurfaceVariant }}
                        />
                      </Box>
                      <Typography
                        sx={{
                          fontFamily: '"Roboto Flex", sans-serif',
                          fontSize: '0.875rem',
                          color: STITCH.onSurfaceVariant,
                          mb: 0.5,
                        }}
                      >
                        Pending Offers
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: '"Montserrat", sans-serif',
                          fontSize: '2rem',
                          fontWeight: 600,
                          color: STITCH.onSurface,
                          lineHeight: 1.2,
                        }}
                      >
                        {pendingCount}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper
                      elevation={0}
                      sx={{
                        bgcolor: 'rgba(26, 26, 26, 0.6)',
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${STITCH.borderMuted}`,
                        borderTop: `2px solid ${STITCH.borderMuted}`,
                        borderRadius: 2,
                        p: 3,
                        transition: 'border-color 0.3s',
                        '&:hover': { borderTopColor: STITCH.primary },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 2,
                        }}
                      >
                        <CheckCircleIcon
                          sx={{ color: STITCH.onSurfaceVariant }}
                        />
                      </Box>
                      <Typography
                        sx={{
                          fontFamily: '"Roboto Flex", sans-serif',
                          fontSize: '0.875rem',
                          color: STITCH.onSurfaceVariant,
                          mb: 0.5,
                        }}
                      >
                        Completed Jobs
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: '"Montserrat", sans-serif',
                          fontSize: '2rem',
                          fontWeight: 600,
                          color: STITCH.onSurface,
                          lineHeight: 1.2,
                        }}
                      >
                        {stats.completedJobs}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </Stack>
          </Grid>

          {/* ── Right Column (Sidebar) ── */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              {/* Profile Strength Card */}
              <Paper
                elevation={0}
                sx={{
                  bgcolor: 'rgba(26, 26, 26, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${STITCH.borderMuted}`,
                  borderRadius: 2,
                  p: 3,
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    boxShadow: '0 0 15px rgba(212, 175, 55, 0.15)',
                  },
                }}
              >
                {/* Decorative bg */}
                <Box
                  sx={{
                    position: 'absolute',
                    right: -40,
                    top: -40,
                    width: 128,
                    height: 128,
                    bgcolor: alpha(STITCH.primaryContainer, 0.05),
                    borderRadius: '50%',
                    filter: 'blur(40px)',
                    pointerEvents: 'none',
                  }}
                />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Montserrat", sans-serif',
                      fontWeight: 600,
                      fontSize: '1.125rem',
                      color: STITCH.onSurface,
                    }}
                  >
                    Profile Strength
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: '"Montserrat", sans-serif',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: STITCH.primary,
                    }}
                  >
                    {profileCompletion.percentage}%
                  </Typography>
                </Box>
                {/* Progress Bar */}
                <Box
                  sx={{
                    width: '100%',
                    bgcolor: STITCH.surfaceVariant,
                    borderRadius: '50px',
                    height: 8,
                    mb: 3,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: STITCH.primary,
                      height: '100%',
                      borderRadius: '50px',
                      width: `${profileCompletion.percentage}%`,
                      position: 'relative',
                      transition: 'width 0.5s ease',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: 16,
                        bgcolor: 'rgba(255, 255, 255, 0.3)',
                        borderRadius: '50px',
                        filter: 'blur(2px)',
                      }}
                    />
                  </Box>
                </Box>
                <Typography
                  sx={{
                    fontFamily: '"Roboto Flex", sans-serif',
                    fontSize: '0.875rem',
                    color: STITCH.onSurfaceVariant,
                    mb: 2,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  Complete these steps to reach 100% and improve your visibility
                  to premium clients.
                </Typography>
                {/* Checklist */}
                <Stack spacing={1.5} sx={{ position: 'relative', zIndex: 1 }}>
                  {profileChecklist.map((item) => (
                    <Box
                      key={item.label}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1.5,
                        opacity: item.done ? 0.5 : 1,
                      }}
                    >
                      {item.done ? (
                        <CheckCircleIcon
                          sx={{
                            color: STITCH.success,
                            fontSize: 20,
                            mt: 0.5,
                          }}
                        />
                      ) : (
                        <RadioButtonUncheckedIcon
                          sx={{
                            color: STITCH.outline,
                            fontSize: 20,
                            mt: 0.5,
                          }}
                        />
                      )}
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          sx={{
                            fontFamily: '"Roboto Flex", sans-serif',
                            fontSize: '0.875rem',
                            color: item.done
                              ? STITCH.onSurface
                              : STITCH.onSurface,
                            fontWeight: item.done ? 400 : 500,
                            textDecoration: item.done ? 'line-through' : 'none',
                          }}
                        >
                          {item.label}
                        </Typography>
                        {item.actionable && !item.done && (
                          <Button
                            size="small"
                            onClick={() => navigate('/worker/profile')}
                            sx={{
                              color: STITCH.primary,
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              p: 0,
                              minWidth: 'auto',
                              mt: 0.5,
                              '&:hover': {
                                bgcolor: 'transparent',
                                textDecoration: 'underline',
                              },
                            }}
                          >
                            Add Portfolio +
                          </Button>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Paper>

              {/* Location Card */}
              <Paper
                elevation={0}
                sx={{
                  bgcolor: 'rgba(26, 26, 26, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${STITCH.borderMuted}`,
                  borderRadius: 2,
                  overflow: 'hidden',
                  position: 'relative',
                  height: 192,
                  '&:hover': {
                    '& .location-bg': { opacity: 0.8 },
                  },
                }}
              >
                <Box
                  className="location-bg"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'radial-gradient(circle at 50% 50%, rgba(212,175,55,0.08) 0%, transparent 50%), linear-gradient(135deg, #0d0e12 0%, #1e1f23 100%)',
                    opacity: 0.6,
                    transition: 'opacity 0.5s',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(to top, rgba(18,19,23,1) 0%, rgba(18,19,23,0.2) 40%, transparent 100%)',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    left: 16,
                    right: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon
                      sx={{ color: STITCH.primary, fontSize: 18 }}
                    />
                    <Typography
                      sx={{
                        fontFamily: '"Montserrat", sans-serif',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: STITCH.onSurface,
                        letterSpacing: '0.05em',
                      }}
                    >
                      ACCRA REGION
                    </Typography>
                  </Box>
                  <Tooltip title="You are online and available">
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: STITCH.success,
                        animation: 'pulse 2s infinite',
                        boxShadow: '0 0 8px #10B981',
                        '@keyframes pulse': {
                          '0%, 100%': { opacity: 1 },
                          '50%': { opacity: 0.5 },
                        },
                      }}
                    />
                  </Tooltip>
                </Box>
              </Paper>
            </Stack>
          </Grid>
        </Grid>

        {/* ─── Snackbar ─── */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{ borderRadius: 2 }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </PageCanvas>
  );
};

export default WorkerDashboardPage;
