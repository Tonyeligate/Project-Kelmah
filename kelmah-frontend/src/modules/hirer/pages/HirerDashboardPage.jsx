/**
 * HirerDashboardPage - Stitch-design desktop dashboard
 *
 * Matches the Stitch hirer_dashboard design:
 * - Hero section with greeting + action buttons
 * - Bento grid: Financial overview (escrow + balance), Active Projects
 * - Right column: Quick Actions, Top Rated Applicants
 *
 * Backend integration via hirerSlice Redux thunks:
 * - fetchHirerProfile, fetchHirerJobs, fetchJobApplications, fetchPaymentSummary
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  Avatar,
  AvatarGroup,
  LinearProgress,
  Skeleton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Work as WorkIcon,
  Payment as PaymentIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  PostAdd as PostAddIcon,
  Assignment as ProposalIcon,
  Search as SearchIcon,
  Lock as LockIcon,
  AccountBalance as AccountBalanceIcon,
  Description as DescriptionIcon,
  Star as StarIcon,
  ChevronRight as ChevronRightIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  ErrorOutline as ErrorOutlineIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import {
  fetchHirerProfile,
  fetchHirerJobs,
  fetchJobApplications,
  fetchPaymentSummary,
  selectHirerJobs,
  selectHirerApplications,
  selectHirerPendingProposalCount,
  selectHirerError,
} from '../services/hirerSlice';
import { useVisibilityPolling } from '../../../hooks/useVisibilityPolling';
import useOnlineStatus from '../../../hooks/useOnlineStatus';
import useNetworkSpeed from '../../../hooks/useNetworkSpeed';
import { useBreakpointDown } from '@/hooks/useResponsive';
import { formatGhanaCurrency } from '@/utils/formatters';
import PageCanvas from '@/modules/common/components/PageCanvas';
import { withBottomNavSafeArea } from '@/utils/safeArea';
import { TOUCH_TARGET_MIN } from '../../../constants/layout';

const DASHBOARD_LOADING_TIMEOUT_MS = 10000;
const APPLICATION_REFRESH_TTL_MS = 2 * 60 * 1000;
const AUTO_REFRESH_INTERVAL_MS = 60 * 1000;
const LOW_BANDWIDTH_REFRESH_INTERVAL_MS = 3 * 60 * 1000;
const MAX_APPLICATION_HYDRATE_PER_CYCLE = 2;

const isGatewayPressureStatus = (status) =>
  [429, 502, 503, 504].includes(status);

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
};

const toValidTimestamp = (value) => {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
};

const extractActiveJobDeadline = (job = {}) => {
  const candidate =
    job?.deadline ||
    job?.dueDate ||
    job?.expectedCompletionDate ||
    job?.timeline?.deadline ||
    job?.timeline?.endDate ||
    null;
  return toValidTimestamp(candidate);
};

const getJobStatusBadge = (job) => {
  const status = String(job?.status || 'open').toLowerCase();
  if (status === 'in-progress' || status === 'in_progress') {
    return { label: 'In Progress', color: STITCH.success };
  }
  if (status === 'completed') {
    return { label: 'Completed', color: STITCH.success };
  }
  if (status === 'sourcing' || status === 'open') {
    return { label: 'Sourcing', color: STITCH.warning };
  }
  if (status === 'draft') {
    return { label: 'Draft', color: STITCH.onSurfaceVariant };
  }
  if (status === 'cancelled' || status === 'closed') {
    return { label: 'Closed', color: STITCH.error };
  }
  return { label: 'Active', color: STITCH.primary };
};

const HirerDashboardPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [autoRefreshEnabled] = useState(true);
  const [timeSinceRefresh, setTimeSinceRefresh] = useState('Just now');
  const [partialLoadWarning, setPartialLoadWarning] = useState('');

  const timeoutRef = useRef(null);
  const fetchPromiseRef = useRef(null);
  const isMountedRef = useRef(true);
  const applicationRecordsRef = useRef({});

  const selectActive = useMemo(() => selectHirerJobs('active'), []);
  const selectCompleted = useMemo(() => selectHirerJobs('completed'), []);

  // Redux state
  const user = useSelector((state) => state.auth.user);
  const hirerProfile = useSelector((state) => state.hirer.profile);
  const activeJobs = useSelector(selectActive);
  const completedJobs = useSelector(selectCompleted);
  const applicationRecords = useSelector(selectHirerApplications);
  const totalPendingProposals = useSelector(selectHirerPendingProposalCount);
  const payments = useSelector((state) => state.hirer.payments);
  const storeError = useSelector(selectHirerError('profile'));
  const jobsError = useSelector(selectHirerError('jobs'));

  const isMobile = useBreakpointDown('md');
  const { isOnline, wasOffline } = useOnlineStatus();
  const { isSlow, effectiveType, downlink, rtt, saveData } = useNetworkSpeed();

  const clearLoadingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    applicationRecordsRef.current = applicationRecords;
  }, [applicationRecords]);

  const getJobsRequiringApplications = useCallback((jobs = []) => {
    if (!Array.isArray(jobs) || jobs.length === 0) return [];
    const snapshot = applicationRecordsRef.current || {};
    const now = Date.now();
    return jobs
      .map((job) => job?.id || job?._id)
      .filter((jobId) => {
        if (!jobId) return false;
        const record = snapshot[jobId];
        if (!record) return true;
        if (record.isLoading) return false;
        if (record.error) return true;
        if (!record.fetchedAt) return true;
        return now - record.fetchedAt > APPLICATION_REFRESH_TTL_MS;
      });
  }, []);

  useEffect(() => {
    if (!isHydrating) return;
    const hasRenderableSnapshot = Boolean(
      (Array.isArray(activeJobs) && activeJobs.length > 0) ||
        hirerProfile ||
        (Array.isArray(completedJobs) && completedJobs.length > 0),
    );
    if (hasRenderableSnapshot) {
      clearLoadingTimeout();
      setIsHydrating(false);
      setLoadingTimeout(false);
    }
  }, [activeJobs, completedJobs, hirerProfile, isHydrating, clearLoadingTimeout]);

  const fetchDashboardData = useCallback(
    async (source = 'initial-load') => {
      const isInitialHydration = source === 'initial-load';
      try {
        if (isInitialHydration) setIsHydrating(true);
        setError(null);
        setLoadingTimeout(false);
        setPartialLoadWarning('');

        clearLoadingTimeout();
        timeoutRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          const message = isInitialHydration
            ? 'Loading is taking longer than expected. Please check your connection and try refreshing.'
            : 'Updating your dashboard is taking longer than expected. Please try again.';
          setLoadingTimeout(true);
          setError(message);
          if (isInitialHydration) setIsHydrating(false);
        }, DASHBOARD_LOADING_TIMEOUT_MS);

        let gatewayUnderPressure = false;
        const failedModules = new Set();

        const runDashboardRequest = async (moduleLabel, requestFactory) => {
          if (gatewayUnderPressure) {
            failedModules.add(moduleLabel);
            return null;
          }
          try {
            return await requestFactory();
          } catch (requestError) {
            failedModules.add(moduleLabel);
            if (isGatewayPressureStatus(requestError?.response?.status)) {
              gatewayUnderPressure = true;
            }
            return null;
          }
        };

        const profilePayload = await runDashboardRequest('profile', () =>
          dispatch(fetchHirerProfile()).unwrap(),
        );
        const activePayload = await runDashboardRequest('active jobs', () =>
          dispatch(fetchHirerJobs('active')).unwrap(),
        );
        await runDashboardRequest('completed jobs', () =>
          dispatch(fetchHirerJobs('completed')).unwrap(),
        );
        await runDashboardRequest('payments', () =>
          dispatch(fetchPaymentSummary()).unwrap(),
        );

        fetchPromiseRef.current = null;
        if (!isMountedRef.current) return;

        clearLoadingTimeout();
        setLoadingTimeout(false);

        const activeList = Array.isArray(activePayload?.jobs)
          ? activePayload.jobs
          : Array.isArray(activePayload)
            ? activePayload
            : [];

        const jobIdsToHydrate = getJobsRequiringApplications(activeList);
        if (!gatewayUnderPressure && jobIdsToHydrate.length > 0) {
          const limitedJobIds = jobIdsToHydrate.slice(
            0,
            MAX_APPLICATION_HYDRATE_PER_CYCLE,
          );
          for (const jobId of limitedJobIds) {
            try {
              await dispatch(
                fetchJobApplications({ jobId, status: 'pending' }),
              ).unwrap();
            } catch (applicationError) {
              failedModules.add('applications');
              if (
                isGatewayPressureStatus(applicationError?.response?.status)
              ) {
                gatewayUnderPressure = true;
                break;
              }
            }
          }
        }

        const partialFailureList = Array.from(failedModules);
        const hasAnySnapshot = Boolean(
          profilePayload || activePayload,
        );
        if (partialFailureList.length > 0 && hasAnySnapshot) {
          setPartialLoadWarning(
            `Some sections are showing last available data (${partialFailureList.slice(0, 3).join(', ')}).`,
          );
        }
        if (!profilePayload && !activePayload) {
          setError(
            'Backend services are temporarily unavailable. Please retry in a few seconds.',
          );
        }
      } catch {
        if (!isMountedRef.current) return;
        clearLoadingTimeout();
        setLoadingTimeout(false);
        setPartialLoadWarning('');
        setError('Failed to load hirer data. Please try again.');
      } finally {
        if (isMountedRef.current && isInitialHydration) setIsHydrating(false);
        if (isMountedRef.current) {
          setLastRefreshed(Date.now());
          setTimeSinceRefresh('Just now');
        }
        fetchPromiseRef.current = null;
      }
    },
    [clearLoadingTimeout, dispatch, getJobsRequiringApplications],
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchDashboardData('initial-load');
    return () => {
      isMountedRef.current = false;
      clearLoadingTimeout();
      fetchPromiseRef.current = null;
    };
  }, [clearLoadingTimeout, fetchDashboardData]);

  useEffect(() => {
    if (!storeError) return;
    setError(
      typeof storeError === 'string'
        ? storeError
        : 'Failed to load hirer data. Please try again.',
    );
  }, [storeError]);

  useEffect(() => {
    if (!jobsError) return;
    setError((prev) => prev || 'Failed to load hirer jobs. Please try again.');
  }, [jobsError]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await fetchDashboardData('manual-refresh');
      setLastRefreshed(Date.now());
      setTimeSinceRefresh('Just now');
    } catch {
      setError('Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const updateTimeSinceRefresh = () => {
      const seconds = Math.floor((Date.now() - lastRefreshed) / 1000);
      if (seconds < 60) {
        setTimeSinceRefresh('Just now');
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        setTimeSinceRefresh(`${minutes} min${minutes > 1 ? 's' : ''} ago`);
      } else {
        const hours = Math.floor(seconds / 3600);
        setTimeSinceRefresh(`${hours} hour${hours > 1 ? 's' : ''} ago`);
      }
    };
    const interval = setInterval(updateTimeSinceRefresh, 30000);
    return () => clearInterval(interval);
  }, [lastRefreshed]);

  // Summary data from Redux
  const summaryData = {
    activeJobs: activeJobs?.length || 0,
    pendingProposals: totalPendingProposals,
    completedJobs: completedJobs?.length || 0,
    totalSpent: payments?.totalPaid || hirerProfile?.totalSpent || 0,
    pendingPayments: payments?.pending?.length || 0,
    escrowBalance: payments?.escrowBalance || 0,
    availableBalance: payments?.wallet?.balance || 0,
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const userFirstName =
    hirerProfile?.firstName ||
    user?.firstName ||
    user?.name?.split(' ')[0] ||
    'there';

  const lowBandwidthModeActive = isOnline && (isSlow || saveData);
  const dashboardRefreshIntervalMs = lowBandwidthModeActive
    ? LOW_BANDWIDTH_REFRESH_INTERVAL_MS
    : AUTO_REFRESH_INTERVAL_MS;

  useVisibilityPolling({
    enabled: autoRefreshEnabled && !isHydrating && isOnline,
    intervalMs: dashboardRefreshIntervalMs,
    maxIntervalMs: dashboardRefreshIntervalMs * 4,
    shouldPause: () =>
      refreshing || !isMountedRef.current || Boolean(error) || !isOnline,
    immediate: false,
    resumeImmediately: false,
    callback: async () => {
      await dispatch(fetchHirerJobs('active')).unwrap();
      if (isMountedRef.current) {
        setLastRefreshed(Date.now());
        setTimeSinceRefresh('Just now');
      }
    },
  });

  // Featured workers / top applicants from dashboard data
  const topApplicants = useMemo(() => {
    // Derive from application records — collect unique applicants across jobs
    const records = applicationRecords || {};
    const applicantsMap = new Map();
    Object.values(records).forEach((record) => {
      if (!record?.buckets) return;
      Object.values(record.buckets).forEach((bucket) => {
        if (!Array.isArray(bucket)) return;
        bucket.forEach((app) => {
          const id = app?.worker?.id || app?.workerId || app?.id;
          if (id && !applicantsMap.has(id)) {
            applicantsMap.set(id, {
              id,
              name:
                app?.worker?.name ||
                [app?.worker?.firstName, app?.worker?.lastName]
                  .filter(Boolean)
                  .join(' ') ||
                app?.applicantName ||
                'Applicant',
              title:
                app?.worker?.profession ||
                app?.worker?.title ||
                app?.skill ||
                'Professional',
              rating: Number(app?.worker?.rating || app?.rating || 0),
              avatar: app?.worker?.profilePicture || app?.worker?.avatar,
              online: Boolean(app?.worker?.isOnline),
            });
          }
        });
      });
    });
    return Array.from(applicantsMap.values())
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4);
  }, [applicationRecords]);

  const isLoading = isHydrating && !activeJobs?.length && !hirerProfile;

  // ─── Loading skeleton ───
  if (isLoading) {
    return (
      <PageCanvas>
        <Helmet>
          <title>Hirer Dashboard | Kelmah</title>
        </Helmet>
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Skeleton variant="text" width={200} height={40} sx={{ mb: 1 }} />
          <Skeleton variant="text" width={300} height={56} sx={{ mb: 3 }} />
          <Skeleton variant="text" width={400} height={24} sx={{ mb: 4 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Skeleton variant="rounded" height={180} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Skeleton variant="rounded" height={180} />
                </Grid>
                <Grid item xs={12}>
                  <Skeleton variant="rounded" height={320} />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rounded" height={200} sx={{ mb: 3 }} />
              <Skeleton variant="rounded" height={340} />
            </Grid>
          </Grid>
        </Box>
      </PageCanvas>
    );
  }

  return (
    <PageCanvas>
      <Helmet>
        <title>Hirer Dashboard | Kelmah</title>
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
        {/* ─── Error / Warning Banners ─── */}
        {error && (
          <Alert
            severity="warning"
            icon={<ErrorOutlineIcon />}
            sx={{
              mb: 3,
              borderRadius: 2,
              '& .MuiAlert-action': { alignItems: 'center' },
            }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={handleRefresh}
                disabled={refreshing}
                startIcon={
                  refreshing ? (
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
            {error}
          </Alert>
        )}
        {partialLoadWarning && !error && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            {partialLoadWarning}
          </Alert>
        )}

        {/* ─── Hero Section ─── */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'flex-end' },
            gap: 3,
            mt: { xs: 1, md: 2 },
            mb: { xs: 4, md: 6 },
          }}
        >
          <Box>
            <Typography
              variant="overline"
              sx={{
                color: STITCH.primary,
                letterSpacing: '0.15em',
                fontWeight: 600,
                mb: 1,
                display: 'block',
              }}
            >
              Overview
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontFamily: '"Montserrat", sans-serif',
                fontWeight: 700,
                color: STITCH.onSurface,
                fontSize: { xs: '1.75rem', md: '3rem' },
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
              }}
            >
              Welcome back, {userFirstName}.
            </Typography>
            <Typography
              sx={{
                color: STITCH.onSurfaceVariant,
                fontSize: { xs: '1rem', md: '1.125rem' },
                lineHeight: 1.6,
                mt: 1,
                maxWidth: 600,
                fontFamily: '"Roboto Flex", sans-serif',
              }}
            >
              You have {summaryData.activeJobs} active project
              {summaryData.activeJobs !== 1 ? 's' : ''} and{' '}
              {summaryData.pendingProposals} new applicant
              {summaryData.pendingProposals !== 1 ? 's' : ''} awaiting your
              review.
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={() => navigate('/workers')}
              sx={{
                borderColor: STITCH.borderMuted,
                color: STITCH.onSurface,
                borderRadius: '4px',
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontFamily: '"Montserrat", sans-serif',
                '&:hover': {
                  borderColor: STITCH.primaryContainer,
                  color: STITCH.primary,
                  bgcolor: 'transparent',
                },
              }}
            >
              Search Workers
            </Button>
            <Button
              variant="contained"
              startIcon={<PostAddIcon />}
              onClick={() => navigate('/hirer/jobs/post')}
              sx={{
                bgcolor: STITCH.primaryContainer,
                color: STITCH.onPrimaryContainer,
                borderRadius: '4px',
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontFamily: '"Montserrat", sans-serif',
                boxShadow: '0 4px 14px rgba(212,175,55,0.25)',
                '&:hover': {
                  bgcolor: STITCH.primary,
                  boxShadow: '0 6px 20px rgba(212,175,55,0.4)',
                },
              }}
            >
              Post a New Job
            </Button>
          </Stack>
        </Box>

        {/* ─── Bento Grid Layout ─── */}
        <Grid container spacing={3}>
          {/* ── Left Column (span 8) ── */}
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              {/* Financial Overview */}
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      bgcolor: STITCH.surfaceContainer,
                      border: `1px solid ${STITCH.borderMuted}`,
                      borderRadius: '8px',
                      p: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: 180,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: STITCH.primaryContainer,
                        boxShadow:
                          'inset 0 0 20px rgba(212,175,55,0.05), 0 4px 20px rgba(0,0,0,0.5)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 3,
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: STITCH.surfaceVariant,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: STITCH.primary,
                        }}
                      >
                        <LockIcon />
                      </Box>
                      <Chip
                        label="Secured"
                        size="small"
                        sx={{
                          bgcolor: STITCH.surfaceVariant,
                          color: STITCH.onSurfaceVariant,
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          height: 24,
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          color: STITCH.onSurfaceVariant,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          mb: 0.5,
                          fontFamily: '"Montserrat", sans-serif',
                        }}
                      >
                        Funds in Escrow
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: '"Montserrat", sans-serif',
                          fontWeight: 700,
                          color: STITCH.onSurface,
                          fontSize: '2rem',
                          lineHeight: 1.2,
                        }}
                      >
                        {formatGhanaCurrency(summaryData.escrowBalance)}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      bgcolor: STITCH.surfaceContainer,
                      border: `1px solid ${STITCH.borderMuted}`,
                      borderRadius: '8px',
                      p: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: 180,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: STITCH.primaryContainer,
                        boxShadow:
                          'inset 0 0 20px rgba(212,175,55,0.05), 0 4px 20px rgba(0,0,0,0.5)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 3,
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: STITCH.surfaceVariant,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: STITCH.primary,
                        }}
                      >
                        <AccountBalanceIcon />
                      </Box>
                      <Button
                        size="small"
                        endIcon={<ChevronRightIcon sx={{ fontSize: 16 }} />}
                        onClick={() => navigate('/hirer/wallet')}
                        sx={{
                          color: STITCH.primary,
                          textTransform: 'none',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          fontFamily: '"Montserrat", sans-serif',
                          minWidth: 'auto',
                          '&:hover': { bgcolor: 'transparent' },
                        }}
                      >
                        Top Up
                      </Button>
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          color: STITCH.onSurfaceVariant,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          mb: 0.5,
                          fontFamily: '"Montserrat", sans-serif',
                        }}
                      >
                        Available Balance
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: '"Montserrat", sans-serif',
                          fontWeight: 700,
                          color: STITCH.onSurface,
                          fontSize: '2rem',
                          lineHeight: 1.2,
                        }}
                      >
                        {formatGhanaCurrency(summaryData.availableBalance)}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              {/* Active Projects */}
              <Paper
                elevation={0}
                sx={{
                  bgcolor: STITCH.surfaceContainer,
                  border: `1px solid ${STITCH.borderMuted}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    p: 3,
                    borderBottom: `1px solid ${STITCH.borderMuted}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: alpha(STITCH.surfaceContainer, 0.5),
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
                    Active Projects
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => navigate('/hirer/jobs?status=active')}
                    sx={{
                      color: STITCH.onSurfaceVariant,
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      '&:hover': { color: STITCH.primary, bgcolor: 'transparent' },
                    }}
                  >
                    View All
                  </Button>
                </Box>
                <Box>
                  {activeJobs && activeJobs.length > 0 ? (
                    activeJobs.slice(0, 5).map((job, index) => {
                      const badge = getJobStatusBadge(job);
                      const jobId = job?.id || job?._id;
                      const jobApps = applicationRecords?.[jobId];
                      const appCount =
                        jobApps?.total ||
                        Object.values(jobApps?.buckets || {}).reduce(
                          (sum, b) => sum + (Array.isArray(b) ? b.length : 0),
                          0,
                        ) ||
                        job?.applicationCount ||
                        0;
                      const budget =
                        job?.budget ||
                        job?.paymentAmount ||
                        job?.compensation?.amount ||
                        0;
                      const location =
                        job?.location?.address ||
                        job?.location?.city ||
                        job?.location ||
                        'Location not specified';
                      return (
                        <Box
                          key={jobId || index}
                          onClick={() => navigate(`/hirer/jobs/${jobId}/applicants`)}
                          sx={{
                            p: 3,
                            borderBottom:
                              index < Math.min(activeJobs.length, 5) - 1
                                ? `1px solid ${STITCH.borderMuted}`
                                : 'none',
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            justifyContent: 'space-between',
                            alignItems: {
                              xs: 'flex-start',
                              sm: 'center',
                            },
                            gap: 2,
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            '&:hover': {
                              bgcolor: alpha(STITCH.surfaceVariant, 0.3),
                            },
                          }}
                        >
                          <Box>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                mb: 1,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontFamily: '"Montserrat", sans-serif',
                                  fontWeight: 600,
                                  fontSize: '1rem',
                                  color: STITCH.onSurface,
                                }}
                              >
                                {job?.title || 'Untitled Project'}
                              </Typography>
                              <Chip
                                label={badge.label}
                                size="small"
                                sx={{
                                  bgcolor: alpha(badge.color, 0.1),
                                  color: badge.color,
                                  border: `1px solid ${alpha(badge.color, 0.2)}`,
                                  fontSize: '0.625rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                  height: 20,
                                }}
                              />
                            </Box>
                            <Typography
                              sx={{
                                fontFamily: '"Roboto Flex", sans-serif',
                                fontSize: '0.875rem',
                                color: STITCH.onSurfaceVariant,
                              }}
                            >
                              {typeof location === 'string'
                                ? location
                                : 'Ghana'}
                              {budget > 0 &&
                                ` • ${formatGhanaCurrency(budget)} Budget`}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              width: { xs: '100%', sm: 'auto' },
                              justifyContent: {
                                xs: 'space-between',
                                sm: 'flex-end',
                              },
                            }}
                          >
                            {appCount > 0 && (
                              <AvatarGroup
                                max={4}
                                sx={{
                                  '& .MuiAvatar-root': {
                                    width: 32,
                                    height: 32,
                                    fontSize: '0.75rem',
                                    border: `2px solid ${STITCH.surfaceContainer}`,
                                    bgcolor: STITCH.surfaceVariant,
                                  },
                                }}
                              >
                                {Array.from({ length: Math.min(appCount, 3) }).map(
                                  (_, i) => (
                                    <Avatar key={i}>
                                      {String.fromCharCode(65 + i)}
                                    </Avatar>
                                  ),
                                )}
                                {appCount > 3 && (
                                  <Avatar
                                    sx={{
                                      bgcolor: STITCH.surfaceVariant,
                                      color: STITCH.onSurfaceVariant,
                                      fontSize: '0.75rem',
                                    }}
                                  >
                                    +{appCount - 3}
                                  </Avatar>
                                )}
                              </AvatarGroup>
                            )}
                            <Button
                              size="small"
                              endIcon={<ChevronRightIcon sx={{ fontSize: 16 }} />}
                              sx={{
                                color: STITCH.primary,
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                fontFamily: '"Montserrat", sans-serif',
                                minWidth: 'auto',
                                '&:hover': { bgcolor: 'transparent' },
                              }}
                            >
                              Review
                            </Button>
                          </Box>
                        </Box>
                      );
                    })
                  ) : (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <WorkIcon
                        sx={{ fontSize: 48, color: STITCH.onSurfaceVariant, mb: 1 }}
                      />
                      <Typography
                        sx={{ color: STITCH.onSurfaceVariant, mb: 2 }}
                      >
                        No active projects yet
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/hirer/jobs/post')}
                        sx={{
                          bgcolor: STITCH.primaryContainer,
                          color: STITCH.onPrimaryContainer,
                          textTransform: 'none',
                          '&:hover': { bgcolor: STITCH.primary },
                        }}
                      >
                        Post Your First Job
                      </Button>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Stack>
          </Grid>

          {/* ── Right Column (span 4) ── */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* Quick Actions */}
              <Paper
                elevation={0}
                sx={{
                  bgcolor: STITCH.surfaceContainer,
                  border: `1px solid ${STITCH.borderMuted}`,
                  borderRadius: '8px',
                  p: 3,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Montserrat", sans-serif',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: STITCH.onSurface,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    mb: 2,
                  }}
                >
                  Quick Actions
                </Typography>
                <Stack spacing={1.5}>
                  <Button
                    fullWidth
                    onClick={() => navigate('/hirer/contracts')}
                    sx={{
                      bgcolor: STITCH.surface,
                      border: `1px solid ${STITCH.borderMuted}`,
                      color: STITCH.onSurface,
                      borderRadius: '4px',
                      py: 1.5,
                      px: 2,
                      justifyContent: 'space-between',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontFamily: '"Montserrat", sans-serif',
                      '&:hover': {
                        borderColor: STITCH.primaryContainer,
                        bgcolor: STITCH.surface,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <DescriptionIcon
                        sx={{ color: STITCH.onSurfaceVariant }}
                      />
                      Manage Contracts
                    </Box>
                    <ChevronRightIcon
                      sx={{ color: STITCH.onSurfaceVariant, fontSize: 18 }}
                    />
                  </Button>
                  <Button
                    fullWidth
                    onClick={() => navigate('/messages')}
                    sx={{
                      bgcolor: STITCH.surface,
                      border: `1px solid ${STITCH.borderMuted}`,
                      color: STITCH.onSurface,
                      borderRadius: '4px',
                      py: 1.5,
                      px: 2,
                      justifyContent: 'space-between',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontFamily: '"Montserrat", sans-serif',
                      '&:hover': {
                        borderColor: STITCH.primaryContainer,
                        bgcolor: STITCH.surface,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <MessageIcon sx={{ color: STITCH.onSurfaceVariant }} />
                      View Messages
                      {summaryData.pendingProposals > 0 && (
                        <Chip
                          label={summaryData.pendingProposals}
                          size="small"
                          sx={{
                            bgcolor: STITCH.primaryContainer,
                            color: STITCH.onPrimaryContainer,
                            fontSize: '0.625rem',
                            fontWeight: 700,
                            height: 18,
                            minWidth: 18,
                          }}
                        />
                      )}
                    </Box>
                    <ChevronRightIcon
                      sx={{ color: STITCH.onSurfaceVariant, fontSize: 18 }}
                    />
                  </Button>
                </Stack>
              </Paper>

              {/* Top Rated Applicants */}
              <Paper
                elevation={0}
                sx={{
                  bgcolor: STITCH.surfaceContainer,
                  border: `1px solid ${STITCH.borderMuted}`,
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                }}
              >
                <Box
                  sx={{
                    p: 3,
                    borderBottom: `1px solid ${STITCH.borderMuted}`,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Montserrat", sans-serif',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: STITCH.onSurface,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    Top Rated Applicants
                  </Typography>
                </Box>
                <Box sx={{ p: 1 }}>
                  {topApplicants.length > 0 ? (
                    topApplicants.map((applicant) => (
                      <Box
                        key={applicant.id}
                        onClick={() => navigate(`/workers/${applicant.id}`)}
                        sx={{
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                          '&:hover': {
                            bgcolor: alpha(STITCH.surfaceVariant, 0.5),
                          },
                        }}
                      >
                        <Box sx={{ position: 'relative' }}>
                          {applicant.avatar ? (
                            <Avatar
                              src={applicant.avatar}
                              sx={{
                                width: 48,
                                height: 48,
                                border: `1px solid ${STITCH.borderMuted}`,
                              }}
                            />
                          ) : (
                            <Avatar
                              sx={{
                                width: 48,
                                height: 48,
                                bgcolor: STITCH.surfaceVariant,
                                color: STITCH.onSurface,
                                border: `1px solid ${STITCH.borderMuted}`,
                              }}
                            >
                              {applicant.name?.charAt(0) || 'A'}
                            </Avatar>
                          )}
                          {applicant.online && (
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: -2,
                                right: -2,
                                width: 14,
                                height: 14,
                                bgcolor: STITCH.success,
                                border: `2px solid ${STITCH.surfaceContainer}`,
                                borderRadius: '50%',
                              }}
                            />
                          )}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            noWrap
                            sx={{
                              fontFamily: '"Montserrat", sans-serif',
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              color: STITCH.onSurface,
                            }}
                          >
                            {applicant.name}
                          </Typography>
                          <Typography
                            noWrap
                            sx={{
                              fontFamily: '"Montserrat", sans-serif',
                              fontSize: '0.75rem',
                              color: STITCH.onSurfaceVariant,
                            }}
                          >
                            {applicant.title}
                          </Typography>
                        </Box>
                        {applicant.rating > 0 && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              color: STITCH.primary,
                            }}
                          >
                            <StarIcon
                              sx={{ fontSize: 16 }}
                              fontSize="small"
                            />
                            <Typography
                              sx={{
                                fontFamily: '"Montserrat", sans-serif',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                              }}
                            >
                              {applicant.rating.toFixed(1)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <PeopleIcon
                        sx={{ fontSize: 40, color: STITCH.onSurfaceVariant, mb: 1 }}
                      />
                      <Typography
                        sx={{
                          color: STITCH.onSurfaceVariant,
                          fontSize: '0.875rem',
                        }}
                      >
                        No applicants yet
                      </Typography>
                    </Box>
                  )}
                </Box>
                {topApplicants.length > 0 && (
                  <Box
                    sx={{
                      p: 2,
                      mt: 'auto',
                      borderTop: `1px solid ${STITCH.borderMuted}`,
                    }}
                  >
                    <Button
                      fullWidth
                      onClick={() => navigate('/hirer/applications')}
                      sx={{
                        color: STITCH.primary,
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        fontFamily: '"Montserrat", sans-serif',
                        '&:hover': { bgcolor: 'transparent' },
                      }}
                    >
                      View All Applicants
                    </Button>
                  </Box>
                )}
              </Paper>
            </Stack>
          </Grid>
        </Grid>

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
              disabled={refreshing}
              size="small"
              aria-label="Refresh dashboard data"
              sx={{ color: STITCH.onSurfaceVariant }}
            >
              {refreshing ? (
                <RefreshIcon
                  sx={{ animation: 'spin 1s linear infinite' }}
                />
              ) : (
                <RefreshIcon />
              )}
            </IconButton>
          </Tooltip>
          <Typography
            variant="caption"
            sx={{ color: STITCH.onSurfaceVariant }}
          >
            Last updated {timeSinceRefresh}
          </Typography>
        </Box>
      </Box>
    </PageCanvas>
  );
};

export default HirerDashboardPage;
