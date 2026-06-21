/**
 * WorkerDashboardPage — Stitch "Kelmah Elite" desktop design.
 *
 * Layout matches stitch_kelmah_dashboard_redevelopment/worker_dashboard/code.html:
 *  - Hero glass-panel card: "Good {Evening}, {firstName}" + 3 inline quick stats
 *  - Next Best Action banner: review pending applications + Open Pipeline
 *  - 3-col grid: left col-span-2 (Quick Actions 2x2, Performance Overview),
 *    right col-span-1 (Profile Strength, Location/Map)
 *
 * Backend integration through Redux (workerSlice):
 *  - fetchWorkerApplications, fetchWorkerJobs, fetchWorkerEarnings
 *  - workerService.getWorkerStats for profile completion %
 *
 * Resilience infra (polling, retry, skeleton, network awareness, snackbar)
 * from the previous implementation is preserved. (The previous build referenced
 * undeclared recommendations state setters — that dead code is removed here.)
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
  Snackbar,
  Stack,
  alpha,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import MessageIcon from '@mui/icons-material/Message';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import PaymentsIcon from '@mui/icons-material/Payments';
import InfoIcon from '@mui/icons-material/Info';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DescriptionIcon from '@mui/icons-material/Description';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { Helmet } from 'react-helmet-async';
import {
  fetchWorkerApplications,
  fetchWorkerJobs,
  fetchWorkerEarnings,
  selectWorkerApplications,
  selectWorkerJobs,
  selectWorkerEarnings,
  selectWorkerLoading,
  selectWorkerError,
  clearWorkerErrors,
} from '../services/workerSlice';
import workerService from '../services/workerService';
import { useVisibilityPolling } from '../../../hooks/useVisibilityPolling';
import { useBreakpointDown } from '@/hooks/useResponsive';
import useOnlineStatus from '@/hooks/useOnlineStatus';
import useNetworkSpeed from '@/hooks/useNetworkSpeed';
import { TOUCH_TARGET_MIN } from '@/constants/layout';
import PageCanvas from '@/modules/common/components/PageCanvas';
import { withBottomNavSafeArea } from '@/utils/safeArea';
import {
  STITCH,
  FONT_HEAD,
  FONT_BODY,
  glassPanel,
  hoverGoldGlow,
  goldButtonSx,
} from '../../dashboard/services/stitchTokens';

// ─── Dashboard constants ───
const WORKER_DASHBOARD_POLL_INTERVAL_MS = 30000;
const WORKER_DASHBOARD_LOW_BANDWIDTH_POLL_INTERVAL_MS = 120000;
const LOADING_TIMEOUT = 8000;
const MAX_RETRIES = 3;

const WorkerDashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isCompactMobile = useBreakpointDown('sm');
  const { isOnline } = useOnlineStatus();
  const { isSlow, saveData } = useNetworkSpeed();
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
  const selectCompletedJobs = useMemo(() => selectWorkerJobs('completed'), []);

  const pendingApplications = useSelector(selectPending);
  const acceptedApplications = useSelector(selectAccepted);
  const completedJobs = useSelector(selectCompletedJobs);
  const earnings = useSelector(selectWorkerEarnings);

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

    const userId = user?.id || user?._id || user?.userId;
    try {
      const requests = [
        dispatch(fetchWorkerApplications('pending')).unwrap(),
        dispatch(fetchWorkerApplications('accepted')).unwrap(),
        dispatch(fetchWorkerJobs('completed')).unwrap(),
      ];
      // Fetch real earnings when we have a worker id; non-blocking on failure.
      if (userId) {
        requests.push(
          dispatch(fetchWorkerEarnings({ workerId: userId, period: 'month' }))
            .unwrap()
            .catch(() => null),
        );
      }

      const results = await Promise.allSettled(requests);
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
  }, [dispatch, user?.id, user?._id, user?.userId]);

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Earnings: prefer backend earnings payload, fall back to client derivation.
  const earningsSummary = useMemo(() => {
    const backendTotal = getAmountValue(
      earnings?.totalEarned ?? earnings?.total ?? earnings?.amount,
    );
    const backendThisMonth = getAmountValue(
      earnings?.monthlyData?.current ??
        earnings?.thisMonth ??
        earnings?.monthlyTotal,
    );

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

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
        acc.total += amount;
        return acc;
      },
      { total: 0, thisMonth: 0 },
    );

    const pendingEarnings = (
      Array.isArray(pendingApplications) ? pendingApplications : []
    ).reduce(
      (sum, application) => sum + getAmountValue(application?.proposedRate),
      0,
    );

    const fallbackTotal = getAmountValue(user?.totalEarnings);
    const total = Math.max(backendTotal, completedTotals.total, fallbackTotal);

    return {
      total,
      thisMonth: backendThisMonth || completedTotals.thisMonth,
      pending: pendingEarnings,
    };
  }, [completedJobs, pendingApplications, earnings, user, getAmountValue]);

  const pendingOffersCount =
    (Array.isArray(pendingApplications) ? pendingApplications.length : 0) +
    (Array.isArray(acceptedApplications) ? acceptedApplications.length : 0);

  const stats = useMemo(
    () => ({
      applications:
        (Array.isArray(pendingApplications) ? pendingApplications.length : 0) +
        (Array.isArray(acceptedApplications) ? acceptedApplications.length : 0),
      completedJobs: Array.isArray(completedJobs) ? completedJobs.length : 0,
      earnings: earningsSummary.total,
    }),
    [pendingApplications, acceptedApplications, completedJobs, earningsSummary],
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

  const userFirstName = user?.firstName || user?.name?.split(' ')[0] || 'there';

  const isNewWorker =
    stats.applications === 0 &&
    stats.completedJobs === 0 &&
    stats.earnings === 0;

  // Profile completion checklist items
  const profileChecklist = useMemo(() => {
    const missing = profileCompletion.missingFields || [];
    const items = [
      {
        label: 'Upload Professional Avatar',
        done: !missing.some(
          (m) =>
            m.toLowerCase().includes('avatar') ||
            m.toLowerCase().includes('photo') ||
            m.toLowerCase().includes('picture'),
        ),
      },
      {
        label: 'Verify Identity',
        done: !missing.some(
          (m) =>
            m.toLowerCase().includes('identity') ||
            m.toLowerCase().includes('verification') ||
            m.toLowerCase().includes('document'),
        ),
      },
      {
        label: 'Add Skills & Expertise',
        done: !missing.some(
          (m) =>
            m.toLowerCase().includes('skill') ||
            m.toLowerCase().includes('expertise') ||
            m.toLowerCase().includes('specialization'),
        ),
      },
      {
        label: 'Upload Portfolio Pieces',
        done: !missing.some(
          (m) =>
            m.toLowerCase().includes('portfolio') ||
            m.toLowerCase().includes('work sample'),
        ),
        actionable: true,
      },
    ];
    if (profileCompletion.percentage >= 100) {
      return items.map((i) => ({ ...i, done: true }));
    }
    return items;
  }, [profileCompletion]);

  const profilePct = Math.max(
    0,
    Math.min(100, Math.round(profileCompletion.percentage || 0)),
  );

  const isInitialLoading = isLoading && !pendingApplications && !completedJobs;

  // ─── Loading skeleton ───
  if (isInitialLoading) {
    return (
      <PageCanvas>
        <Helmet>
          <title>Worker Dashboard | Kelmah</title>
        </Helmet>
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1280, mx: 'auto' }}>
          <Skeleton variant="rounded" height={280} sx={{ mb: 3, borderRadius: 2 }} />
          <Skeleton variant="rounded" height={120} sx={{ mb: 3, borderRadius: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Skeleton variant="rounded" height={180} sx={{ mb: 3, borderRadius: 2 }} />
              <Skeleton variant="rounded" height={140} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rounded" height={260} sx={{ mb: 3, borderRadius: 2 }} />
              <Skeleton variant="rounded" height={192} sx={{ borderRadius: 2 }} />
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
          fontFamily: FONT_BODY,
          color: STITCH.onSurface,
        }}
      >
        {/* ─── Error banner ─── */}
        {error && (
          <Alert
            severity="warning"
            sx={{ mb: 3, borderRadius: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={handleRefresh}
                disabled={isLoading}
                startIcon={<RefreshIcon />}
                sx={{ minHeight: TOUCH_TARGET_MIN }}
              >
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}
        {loadingTimeout && !error && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            Loading is taking longer than expected. Retrying…
          </Alert>
        )}

        {/* ─── Hero glass-panel card ─── */}
        <Paper
          elevation={0}
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '16px',
            p: { xs: 3, md: 6 },
            mb: 3,
            ...glassPanel,
            ...hoverGoldGlow,
          }}
        >
          {/* Decorative gold blur blob */}
          <Box
            sx={{
              position: 'absolute',
              top: -80,
              right: -80,
              width: 256,
              height: 256,
              borderRadius: '50%',
              background: alpha(STITCH.primaryContainer, 0.05),
              filter: 'blur(64px)',
              pointerEvents: 'none',
            }}
          />
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography
              sx={{
                fontFamily: FONT_HEAD,
                fontSize: { xs: '1.9rem', md: '3.5rem' },
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                color: STITCH.onSurface,
                mb: 1.5,
              }}
            >
              {getGreeting()},{' '}
              <Box component="span" sx={{ color: STITCH.primaryContainer }}>
                {userFirstName}
              </Box>
            </Typography>
            <Typography
              sx={{
                fontFamily: FONT_BODY,
                fontSize: { xs: '0.95rem', md: '1.125rem' },
                lineHeight: 1.55,
                color: STITCH.onSurfaceVariant,
                maxWidth: 640,
                mb: 4,
              }}
            >
              Your talent cockpit. Review your performance, manage active
              contracts, and discover new premium opportunities.
            </Typography>

            {/* Inline quick stats */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    backgroundColor: alpha(STITCH.surfaceDim, 0.5),
                    borderRadius: '12px',
                    p: 3,
                    border: `1px solid ${alpha(STITCH.borderMuted, 0.5)}`,
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: STITCH.surfaceVariant,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: STITCH.primaryContainer,
                      mb: 2,
                    }}
                  >
                    <AssignmentIcon />
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: FONT_HEAD,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: STITCH.onSurfaceVariant,
                      mb: 0.5,
                    }}
                  >
                    Applications
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: FONT_HEAD,
                      fontSize: '1.75rem',
                      fontWeight: 700,
                      color: STITCH.onSurface,
                    }}
                  >
                    {stats.applications}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    backgroundColor: alpha(STITCH.surfaceDim, 0.5),
                    borderRadius: '12px',
                    p: 3,
                    border: `1px solid ${alpha(STITCH.borderMuted, 0.5)}`,
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: STITCH.surfaceVariant,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: STITCH.primaryContainer,
                      mb: 2,
                    }}
                  >
                    <TaskAltIcon />
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: FONT_HEAD,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: STITCH.onSurfaceVariant,
                      mb: 0.5,
                    }}
                  >
                    Completed
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: FONT_HEAD,
                      fontSize: '1.75rem',
                      fontWeight: 700,
                      color: STITCH.onSurface,
                    }}
                  >
                    {stats.completedJobs}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    backgroundColor: alpha(STITCH.surfaceDim, 0.5),
                    borderRadius: '12px',
                    p: 3,
                    border: `1px solid ${alpha(STITCH.borderMuted, 0.5)}`,
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: STITCH.surfaceVariant,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: STITCH.primaryContainer,
                      mb: 2,
                    }}
                  >
                    <PaymentsIcon />
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: FONT_HEAD,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: STITCH.onSurfaceVariant,
                      mb: 0.5,
                    }}
                  >
                    Earnings
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: FONT_HEAD,
                      fontSize: '1.75rem',
                      fontWeight: 700,
                      color: STITCH.primaryContainer,
                    }}
                  >
                    {formatGhanaCurrencyLabel(stats.earnings)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* ─── Next Best Action banner ─── */}
        <Box
          sx={{
            backgroundColor: alpha(STITCH.surfaceVariant, 0.3),
            border: `1px solid ${alpha(STITCH.primaryContainer, 0.3)}`,
            borderRadius: '12px',
            p: 3,
            mb: 4,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2.5,
            transition: 'border-color 0.3s ease',
            '&:hover': { borderColor: alpha(STITCH.primaryContainer, 0.6) },
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: alpha(STITCH.primaryContainer, 0.2),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: STITCH.primaryContainer,
              flexShrink: 0,
            }}
          >
            <InfoIcon />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontFamily: FONT_HEAD,
                fontSize: '1.125rem',
                fontWeight: 600,
                color: STITCH.onSurface,
                mb: 0.5,
              }}
            >
              Review pending applications
            </Typography>
            <Typography
              sx={{
                fontFamily: FONT_BODY,
                fontSize: '0.9rem',
                color: STITCH.onSurfaceVariant,
              }}
            >
              You have {pendingOffersCount} offer
              {pendingOffersCount === 1 ? '' : 's'} awaiting your response.
              Securing these can boost your pipeline.
            </Typography>
          </Box>
          <Button
            onClick={() => navigate('/worker/applications')}
            endIcon={<ArrowForwardIcon />}
            sx={{
              ...goldButtonSx,
              px: 3,
              py: 1.5,
              boxShadow: '0 0 15px rgba(212,175,55,0.3)',
              flexShrink: 0,
            }}
          >
            Open Pipeline
          </Button>
        </Box>

        {/* ─── Two-column layout ─── */}
        <Grid container spacing={4}>
          {/* Left column (span 2) */}
          <Grid item xs={12} md={8}>
            <Stack spacing={4}>
              {/* Quick Actions */}
              <Box>
                <Typography
                  sx={{
                    fontFamily: FONT_HEAD,
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    color: STITCH.onSurface,
                    mb: 2.5,
                  }}
                >
                  Quick Actions
                </Typography>
                <Grid container spacing={2}>
                  {/* Find Work — solid gold */}
                  <Grid item xs={6} sm={3}>
                    <Paper
                      elevation={0}
                      onClick={() => navigate('/worker/find-work')}
                      sx={{
                        bgcolor: STITCH.primaryContainer,
                        color: STITCH.onPrimary,
                        borderRadius: '12px',
                        p: 3,
                        aspectRatio: '1 / 1',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1.5,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'filter 0.2s ease, transform 0.15s ease',
                        boxShadow: '0 0 20px rgba(212,175,55,0.2)',
                        '&:hover': { filter: 'brightness(1.05)' },
                        '&:active': { transform: 'scale(0.97)' },
                      }}
                    >
                      <SearchIcon sx={{ fontSize: 30 }} />
                      <Typography
                        sx={{
                          fontFamily: FONT_HEAD,
                          fontSize: '0.85rem',
                          fontWeight: 600,
                        }}
                      >
                        Find Work
                      </Typography>
                    </Paper>
                  </Grid>
                  {/* Applications — glass */}
                  <Grid item xs={6} sm={3}>
                    <Paper
                      elevation={0}
                      onClick={() => navigate('/worker/applications')}
                      sx={{
                        ...glassPanel,
                        borderRadius: '12px',
                        p: 3,
                        aspectRatio: '1 / 1',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1.5,
                        cursor: 'pointer',
                        textAlign: 'center',
                        color: STITCH.onSurface,
                        transition: 'border-color 0.3s ease',
                        '&:hover': { borderColor: STITCH.outlineVariant },
                      }}
                    >
                      <DescriptionIcon
                        sx={{ fontSize: 30, color: STITCH.onSurfaceVariant }}
                      />
                      <Typography
                        sx={{
                          fontFamily: FONT_HEAD,
                          fontSize: '0.85rem',
                          fontWeight: 600,
                        }}
                      >
                        Applications
                      </Typography>
                    </Paper>
                  </Grid>
                  {/* Messages — glass with dot */}
                  <Grid item xs={6} sm={3}>
                    <Paper
                      elevation={0}
                      onClick={() => navigate('/messages')}
                      sx={{
                        ...glassPanel,
                        borderRadius: '12px',
                        p: 3,
                        aspectRatio: '1 / 1',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1.5,
                        cursor: 'pointer',
                        textAlign: 'center',
                        color: STITCH.onSurface,
                        position: 'relative',
                        transition: 'border-color 0.3s ease',
                        '&:hover': { borderColor: STITCH.outlineVariant },
                      }}
                    >
                      {pendingOffersCount > 0 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: STITCH.primaryContainer,
                          }}
                        />
                      )}
                      <MessageIcon
                        sx={{ fontSize: 30, color: STITCH.onSurfaceVariant }}
                      />
                      <Typography
                        sx={{
                          fontFamily: FONT_HEAD,
                          fontSize: '0.85rem',
                          fontWeight: 600,
                        }}
                      >
                        Messages
                      </Typography>
                    </Paper>
                  </Grid>
                  {/* Refresh — glass */}
                  <Grid item xs={6} sm={3}>
                    <Paper
                      elevation={0}
                      onClick={handleRefresh}
                      sx={{
                        ...glassPanel,
                        borderRadius: '12px',
                        p: 3,
                        aspectRatio: '1 / 1',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1.5,
                        cursor: 'pointer',
                        textAlign: 'center',
                        color: STITCH.onSurface,
                        transition: 'border-color 0.3s ease',
                        '&:hover': { borderColor: STITCH.outlineVariant },
                      }}
                    >
                      <RefreshIcon
                        sx={{
                          fontSize: 30,
                          color: STITCH.onSurfaceVariant,
                          ...(isLoading && {
                            animation: 'spin 1s linear infinite',
                          }),
                        }}
                      />
                      <Typography
                        sx={{
                          fontFamily: FONT_HEAD,
                          fontSize: '0.85rem',
                          fontWeight: 600,
                        }}
                      >
                        Refresh
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              {/* Performance Overview */}
              <Box>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 2.5 }}
                >
                  <Typography
                    sx={{
                      fontFamily: FONT_HEAD,
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      color: STITCH.onSurface,
                    }}
                  >
                    Performance Overview
                  </Typography>
                  <TrendingUpIcon sx={{ color: STITCH.primaryContainer }} />
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box
                      sx={{
                        ...glassPanel,
                        borderRadius: '12px',
                        p: 3,
                        borderTop: `2px solid ${STITCH.borderMuted}`,
                        height: '100%',
                        transition: 'border-color 0.3s ease',
                        '&:hover': { borderTopColor: STITCH.primaryContainer },
                      }}
                    >
                      <AccountBalanceIcon
                        sx={{ color: STITCH.onSurfaceVariant, mb: 1.5 }}
                      />
                      <Typography
                        sx={{
                          fontFamily: FONT_HEAD,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: STITCH.onSurfaceVariant,
                          mb: 0.5,
                        }}
                      >
                        Earnings
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: FONT_HEAD,
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          color: STITCH.primaryContainer,
                          mb: 1,
                        }}
                      >
                        {formatGhanaCurrencyLabel(earningsSummary.thisMonth)}
                      </Typography>
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-block',
                          bgcolor: STITCH.surfaceVariant,
                          color: STITCH.onSurface,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          px: 1,
                          py: 0.25,
                          borderRadius: '4px',
                        }}
                      >
                        This Month
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box
                      sx={{
                        ...glassPanel,
                        borderRadius: '12px',
                        p: 3,
                        borderTop: `2px solid ${STITCH.borderMuted}`,
                        height: '100%',
                        transition: 'border-color 0.3s ease',
                        '&:hover': { borderTopColor: STITCH.primaryContainer },
                      }}
                    >
                      <PendingActionsIcon
                        sx={{ color: STITCH.onSurfaceVariant, mb: 1.5 }}
                      />
                      <Typography
                        sx={{
                          fontFamily: FONT_HEAD,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: STITCH.onSurfaceVariant,
                          mb: 0.5,
                        }}
                      >
                        Pending Offers
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: FONT_HEAD,
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          color: STITCH.onSurface,
                        }}
                      >
                        {pendingOffersCount}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box
                      sx={{
                        ...glassPanel,
                        borderRadius: '12px',
                        p: 3,
                        borderTop: `2px solid ${STITCH.borderMuted}`,
                        height: '100%',
                        transition: 'border-color 0.3s ease',
                        '&:hover': { borderTopColor: STITCH.primaryContainer },
                      }}
                    >
                      <CheckCircleIcon
                        sx={{ color: STITCH.onSurfaceVariant, mb: 1.5 }}
                      />
                      <Typography
                        sx={{
                          fontFamily: FONT_HEAD,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: STITCH.onSurfaceVariant,
                          mb: 0.5,
                        }}
                      >
                        Completed Jobs
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: FONT_HEAD,
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          color: STITCH.onSurface,
                        }}
                      >
                        {stats.completedJobs}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Stack>
          </Grid>

          {/* Right column (span 1) */}
          <Grid item xs={12} md={4}>
            <Stack spacing={4}>
              {/* Profile Strength */}
              <Paper
                elevation={0}
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '12px',
                  p: 3,
                  ...glassPanel,
                  ...hoverGoldGlow,
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: -40,
                    right: -40,
                    width: 160,
                    height: 160,
                    borderRadius: '50%',
                    background: alpha(STITCH.primaryContainer, 0.05),
                    filter: 'blur(40px)',
                    pointerEvents: 'none',
                  }}
                />
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 2 }}
                  >
                    <Typography
                      sx={{
                        fontFamily: FONT_HEAD,
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: STITCH.onSurface,
                      }}
                    >
                      Profile Strength
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: FONT_HEAD,
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: STITCH.primaryContainer,
                      }}
                    >
                      {profilePct}%
                    </Typography>
                  </Stack>

                  {/* Progress bar */}
                  <Box
                    sx={{
                      width: '100%',
                      height: 8,
                      bgcolor: STITCH.surfaceVariant,
                      borderRadius: 5,
                      overflow: 'hidden',
                      position: 'relative',
                      mb: 2.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: `${profilePct}%`,
                        height: '100%',
                        bgcolor: STITCH.primaryContainer,
                        borderRadius: 5,
                        position: 'relative',
                        transition: 'width 0.6s ease',
                      }}
                    >
                      {/* White glow highlight at the end */}
                      {profilePct > 0 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            width: 16,
                            height: '100%',
                            bgcolor: alpha('#ffffff', 0.3),
                            borderRadius: 5,
                            filter: 'blur(2px)',
                          }}
                        />
                      )}
                    </Box>
                  </Box>

                  <Typography
                    sx={{
                      fontFamily: FONT_BODY,
                      fontSize: '0.8rem',
                      color: STITCH.onSurfaceVariant,
                      mb: 2,
                      lineHeight: 1.5,
                    }}
                  >
                    Complete these steps to reach 100% and improve your
                    visibility to premium clients.
                  </Typography>

                  {/* Checklist */}
                  <Stack spacing={1.5}>
                    {profileChecklist.map((item) => (
                      <Stack
                        key={item.label}
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                      >
                        {item.done ? (
                          <CheckCircleIcon
                            sx={{
                              fontSize: 20,
                              color: STITCH.success,
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <RadioButtonUncheckedIcon
                            sx={{
                              fontSize: 20,
                              color: STITCH.outline,
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <Typography
                          sx={{
                            fontFamily: FONT_BODY,
                            fontSize: '0.85rem',
                            flex: 1,
                            color: item.done
                              ? STITCH.onSurfaceVariant
                              : STITCH.onSurface,
                            textDecoration: item.done
                              ? 'line-through'
                              : 'none',
                            opacity: item.done ? 0.6 : 1,
                          }}
                        >
                          {item.label}
                        </Typography>
                        {!item.done && item.actionable && (
                          <Button
                            size="small"
                            onClick={() => navigate('/worker/portfolio')}
                            sx={{
                              color: STITCH.primaryContainer,
                              fontFamily: FONT_HEAD,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              textTransform: 'none',
                              minWidth: 0,
                              '&:hover': {
                                backgroundColor: 'transparent',
                                textDecoration: 'underline',
                              },
                            }}
                          >
                            Add Portfolio +
                          </Button>
                        )}
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </Paper>

              {/* Location / Map card */}
              <Paper
                elevation={0}
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '12px',
                  height: 192,
                  border: `1px solid ${STITCH.borderMuted}`,
                  // Ambient dark "map" — no external image dependency.
                  backgroundImage: `
                    linear-gradient(180deg, ${alpha(STITCH.surface, 0)} 0%, ${STITCH.surface} 100%),
                    linear-gradient(120deg, ${STITCH.surfaceContainer} 0%, ${STITCH.surfaceDim} 100%),
                    radial-gradient(circle at 30% 40%, ${alpha(STITCH.primaryContainer, 0.08)}, transparent 40%)
                  `,
                  backgroundColor: STITCH.surfaceDim,
                }}
              >
                {/* Grid lines evoking a minimalist street map */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `
                      linear-gradient(${alpha(STITCH.onSurface, 0.05)} 1px, transparent 1px),
                      linear-gradient(90deg, ${alpha(STITCH.onSurface, 0.05)} 1px, transparent 1px)
                    `,
                    backgroundSize: '32px 32px',
                    opacity: 0.7,
                  }}
                />
                {/* Bottom-left label */}
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    left: 16,
                    zIndex: 1,
                  }}
                >
                  <LocationOnIcon
                    sx={{
                      color: STITCH.primaryContainer,
                      fontSize: 20,
                      filter: 'drop-shadow(0 0 4px rgba(212,175,55,0.4))',
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: FONT_HEAD,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      color: STITCH.onSurface,
                    }}
                  >
                    ACCRA REGION
                  </Typography>
                </Stack>
                {/* Pulsing green status dot */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 20,
                    right: 20,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: STITCH.success,
                    boxShadow: '0 0 8px #10B981',
                    animation: 'pulse 2s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                      '50%': { opacity: 0.5, transform: 'scale(1.3)' },
                    },
                  }}
                />
              </Paper>
            </Stack>
          </Grid>
        </Grid>

        {/* ─── New worker welcome ─── */}
        {isNewWorker && (
          <Paper
            elevation={0}
            sx={{
              mt: 4,
              p: 3,
              borderRadius: '12px',
              backgroundColor: alpha(STITCH.primaryContainer, 0.08),
              border: `1px solid ${alpha(STITCH.primaryContainer, 0.35)}`,
            }}
          >
            <Typography
              sx={{
                fontFamily: FONT_HEAD,
                fontSize: '1.125rem',
                fontWeight: 600,
                color: STITCH.onSurface,
                mb: 0.5,
              }}
            >
              Welcome to Kelmah! 🎉
            </Typography>
            <Typography
              sx={{
                fontFamily: FONT_BODY,
                fontSize: '0.9rem',
                color: STITCH.onSurfaceVariant,
                mb: 2,
              }}
            >
              Start by finding work that matches your skills and building your
              profile to attract premium clients.
            </Typography>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={() => navigate('/worker/find-work')}
              sx={goldButtonSx}
            >
              Find Your First Job
            </Button>
          </Paper>
        )}

        {/* ─── Refresh footer ─── */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1,
            mt: 4,
            color: STITCH.onSurfaceVariant,
          }}
        >
          <Tooltip title="Refresh dashboard data">
            <IconButton
              onClick={handleRefresh}
              disabled={isLoading}
              size="small"
              aria-label="Refresh dashboard data"
              sx={{ color: STITCH.onSurfaceVariant }}
            >
              {isLoading ? (
                <RefreshIcon sx={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <RefreshIcon />
              )}
            </IconButton>
          </Tooltip>
          <Typography
            sx={{
              fontFamily: FONT_BODY,
              fontSize: '0.75rem',
              color: STITCH.onSurfaceVariant,
            }}
          >
            Last updated{' '}
            {new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Typography>
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </PageCanvas>
  );
};

WorkerDashboardPage.propTypes = {
  // No props — page is route-mounted. Placeholder keeps the PropTypes import
  // meaningful for future extension.
};

export default WorkerDashboardPage;
