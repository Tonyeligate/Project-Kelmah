/**
 * HirerDashboardPage — Stitch "Kelmah Elite" desktop design.
 *
 * Layout matches stitch_kelmah_dashboard_redevelopment/hirer_dashboard/code.html:
 *  - Hero: "OVERVIEW" eyebrow + "Welcome back, {firstName}." + Search Workers / Post a New Job
 *  - Bento grid (12-col): left col-span-8 (Financial Overview, Active Projects),
 *    right col-span-4 (Quick Actions, Top Rated Applicants)
 *
 * Backend integration through Redux:
 *  - hirerSlice (profile, jobs, applications, payments) — primary data source
 *  - hirerDashboardSlice (metrics, analytics, activeJobs, featuredWorkers) — enrichment
 *
 * All resilience infra (polling, retry, partial-load warnings, network awareness,
 * skeletons, safe-area) from the previous implementation is preserved.
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
  Avatar,
  AvatarGroup,
  Skeleton,
  Stack,
  alpha,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  PostAdd as PostAddIcon,
  Search as SearchIcon,
  Lock as LockIcon,
  AccountBalance as AccountBalanceIcon,
  Description as DescriptionIcon,
  Star as StarIcon,
  ChevronRight as ChevronRightIcon,
  ArrowForward as ArrowForwardIcon,
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
import {
  fetchHirerDashboardData,
  fetchHirerMetrics,
} from '../../dashboard/services/hirerDashboardSlice';
import { useMessages } from '../../messaging/contexts/MessageContext';
import { useVisibilityPolling } from '../../../hooks/useVisibilityPolling';
import useOnlineStatus from '../../../hooks/useOnlineStatus';
import useNetworkSpeed from '../../../hooks/useNetworkSpeed';
import { useBreakpointDown } from '@/hooks/useResponsive';
import { formatGhanaCurrency } from '@/utils/formatters';
import PageCanvas from '@/modules/common/components/PageCanvas';
import { withBottomNavSafeArea } from '@/utils/safeArea';
import { TOUCH_TARGET_MIN } from '../../../constants/layout';
import {
  STITCH,
  FONT_HEAD,
  FONT_BODY,
  hoverGoldGlow,
  goldButtonSx,
} from '../../dashboard/services/stitchTokens';

const DASHBOARD_LOADING_TIMEOUT_MS = 10000;
const APPLICATION_REFRESH_TTL_MS = 2 * 60 * 1000;
const AUTO_REFRESH_INTERVAL_MS = 60 * 1000;
const LOW_BANDWIDTH_REFRESH_INTERVAL_MS = 3 * 60 * 1000;
const MAX_APPLICATION_HYDRATE_PER_CYCLE = 2;

const isGatewayPressureStatus = (status) =>
  [429, 502, 503, 504].includes(status);

// Status → Stitch badge styling (matches Sourcing / In Progress pills in design).
const getStatusBadge = (job) => {
  const status = String(job?.status || 'open').toLowerCase();
  if (status === 'in-progress' || status === 'in_progress') {
    return {
      label: 'In Progress',
      color: STITCH.success,
      bg: alpha(STITCH.success, 0.1),
      border: alpha(STITCH.success, 0.25),
    };
  }
  if (status === 'completed') {
    return {
      label: 'Completed',
      color: STITCH.success,
      bg: alpha(STITCH.success, 0.1),
      border: alpha(STITCH.success, 0.25),
    };
  }
  // open / sourcing / draft — default "Sourcing"
  return {
    label: 'Sourcing',
    color: STITCH.warning,
    bg: alpha(STITCH.warning, 0.1),
    border: alpha(STITCH.warning, 0.25),
  };
};

const getJobProgress = (job) => {
  const explicit = Number(job?.progress);
  if (Number.isFinite(explicit) && explicit > 0 && explicit <= 100) {
    return Math.round(explicit);
  }
  const milestones = Array.isArray(job?.milestones) ? job.milestones : [];
  if (milestones.length > 0) {
    const completed = milestones.filter(
      (m) => m?.status === 'completed' || m?.status === 'released',
    ).length;
    return Math.round((completed / milestones.length) * 100);
  }
  const status = String(job?.status || '').toLowerCase();
  if (status === 'in-progress' || status === 'in_progress') return 50;
  return 0;
};

const HirerDashboardPage = () => {
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

  // ─── Redux state ───
  const user = useSelector((state) => state.auth.user);
  const hirerProfile = useSelector((state) => state.hirer.profile);
  const activeJobs = useSelector(selectActive);
  const completedJobs = useSelector(selectCompleted);
  const applicationRecords = useSelector(selectHirerApplications);
  const totalPendingProposals = useSelector(selectHirerPendingProposalCount);
  const payments = useSelector((state) => state.hirer.payments);
  const storeError = useSelector(selectHirerError('profile'));
  const jobsError = useSelector(selectHirerError('jobs'));
  // Enrichment from the dedicated dashboard slice (metrics + featured workers).
  const dashboardData = useSelector((state) => state.hirerDashboard?.data);

  const { unreadCount: unreadMessages } = useMessages();
  const isMobile = useBreakpointDown('md');
  const { isOnline } = useOnlineStatus();
  const { isSlow, saveData } = useNetworkSpeed();

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
        // Enrichment: dashboard metrics (counts) + featured workers (Top Rated).
        await runDashboardRequest('dashboard metrics', () =>
          dispatch(fetchHirerMetrics('30d')).unwrap(),
        );
        await runDashboardRequest('dashboard data', () =>
          dispatch(fetchHirerDashboardData()).unwrap(),
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
        const hasAnySnapshot = Boolean(profilePayload || activePayload);
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

  // ─── Derived summary ───
  const summaryData = {
    activeJobs: activeJobs?.length || 0,
    pendingProposals: totalPendingProposals,
    completedJobs: completedJobs?.length || 0,
    // Prefer backend metrics when available, fall back to client counts.
    totalApplications:
      dashboardData?.metrics?.totalApplications ??
      dashboardData?.metrics?.newApplications ??
      totalPendingProposals,
    totalSpent: payments?.totalPaid || hirerProfile?.totalSpent || 0,
    escrowBalance: payments?.escrowBalance || 0,
    availableBalance:
      payments?.wallet?.balance ?? payments?.wallet?.availableBalance ?? 0,
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

  // Top Rated Applicants: prefer featuredWorkers from the dashboard endpoint,
  // fall back to applicants derived from application records.
  const topApplicants = useMemo(() => {
    const featured = Array.isArray(dashboardData?.featuredWorkers)
      ? dashboardData.featuredWorkers
      : [];
    const mapped = featured.map((w) => ({
      id: w?.id || w?._id || w?.userId,
      name:
        w?.name ||
        [w?.firstName, w?.lastName].filter(Boolean).join(' ') ||
        'Applicant',
      title: w?.profession || w?.title || w?.skill || 'Professional',
      rating: Number(w?.rating || w?.averageRating || 0),
      avatar: w?.profilePicture || w?.avatar,
      online: Boolean(w?.isOnline),
    }));
    if (mapped.length > 0) {
      return mapped.sort((a, b) => b.rating - a.rating).slice(0, 3);
    }

    // Fallback: derive from hydrated application buckets.
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
      .slice(0, 3);
  }, [dashboardData, applicationRecords]);

  // Applicant avatars per active job (for the Active Projects stacked avatar row).
  const getApplicantsForJob = useCallback(
    (jobId) => {
      if (!jobId) return [];
      const record = (applicationRecords || {})[jobId];
      if (!record) return [];
      const buckets = record?.buckets || {};
      const all = [];
      Object.values(buckets).forEach((bucket) => {
        if (Array.isArray(bucket)) all.push(...bucket);
      });
      return all.slice(0, 4);
    },
    [applicationRecords],
  );

  const messagesBadge = unreadMessages > 0 ? unreadMessages : null;

  const isLoading = isHydrating && !activeJobs?.length && !hirerProfile;

  // ─── Loading skeleton ───
  if (isLoading) {
    return (
      <PageCanvas>
        <Helmet>
          <title>Hirer Dashboard | Kelmah</title>
        </Helmet>
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1280, mx: 'auto' }}>
          <Skeleton variant="text" width={120} height={24} sx={{ mb: 1 }} />
          <Skeleton
            variant="text"
            width={{ xs: 260, md: 420 }}
            height={56}
            sx={{ mb: 1 }}
          />
          <Skeleton
            variant="text"
            width={{ xs: 300, md: 520 }}
            height={24}
            sx={{ mb: 4 }}
          />
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
                  <Skeleton variant="rounded" height={340} />
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
          fontFamily: FONT_BODY,
          color: STITCH.onSurface,
        }}
      >
        {/* ─── Error / Warning banners ─── */}
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
                    <RefreshIcon sx={{ animation: 'spin 1s linear infinite' }} />
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

        {/* ─── Hero ─── */}
        <Box
          sx={{
            mt: { xs: 2, md: 4 },
            mb: { xs: 4, md: 6 },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'flex-end' },
            gap: 3,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontFamily: FONT_HEAD,
                fontSize: '0.875rem',
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: STITCH.primaryContainer,
                mb: 1,
              }}
            >
              Overview
            </Typography>
            <Typography
              sx={{
                fontFamily: FONT_HEAD,
                fontSize: { xs: '1.9rem', md: '3rem' },
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                color: STITCH.onSurface,
              }}
            >
              Welcome back, {userFirstName}.
            </Typography>
            <Typography
              sx={{
                fontFamily: FONT_BODY,
                fontSize: { xs: '1rem', md: '1.125rem' },
                lineHeight: 1.5,
                color: STITCH.onSurfaceVariant,
                mt: 1,
                maxWidth: 640,
              }}
            >
              You have {summaryData.activeJobs} active project
              {summaryData.activeJobs === 1 ? '' : 's'} and{' '}
              {summaryData.totalApplications} new applicant
              {summaryData.totalApplications === 1 ? '' : 's'} awaiting your
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
                fontFamily: FONT_HEAD,
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  borderColor: STITCH.primaryContainer,
                  color: STITCH.primary,
                  backgroundColor: 'transparent',
                },
              }}
            >
              Search Workers
            </Button>
            <Button
              variant="contained"
              startIcon={<PostAddIcon />}
              onClick={() => navigate('/hirer/jobs/post')}
              sx={{ ...goldButtonSx, py: 1.5, px: 3 }}
            >
              Post a New Job
            </Button>
          </Stack>
        </Box>

        {/* ─── Bento grid ─── */}
        <Grid container spacing={3}>
          {/* ── Left column (span 8) ── */}
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
                      borderRadius: '4px',
                      p: 3,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      ...hoverGoldGlow,
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
                          color: STITCH.primaryContainer,
                        }}
                      >
                        <LockIcon />
                      </Box>
                      <Box
                        sx={{
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          bgcolor: STITCH.surfaceVariant,
                          color: STITCH.onSurfaceVariant,
                          px: 1,
                          py: 0.5,
                          borderRadius: '4px',
                        }}
                      >
                        Secured
                      </Box>
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          fontFamily: FONT_HEAD,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          letterSpacing: '0.03em',
                          color: STITCH.onSurfaceVariant,
                          mb: 0.5,
                        }}
                      >
                        Funds in Escrow
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: FONT_HEAD,
                          fontSize: { xs: '1.5rem', md: '1.75rem' },
                          fontWeight: 700,
                          color: STITCH.onSurface,
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
                      borderRadius: '4px',
                      p: 3,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      ...hoverGoldGlow,
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
                          color: STITCH.primaryContainer,
                        }}
                      >
                        <AccountBalanceIcon />
                      </Box>
                      <Button
                        size="small"
                        onClick={() => navigate('/hirer/wallet')}
                        sx={{
                          color: STITCH.primaryContainer,
                          fontFamily: FONT_HEAD,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          textTransform: 'none',
                          minWidth: 0,
                          '&:hover': {
                            backgroundColor: 'transparent',
                            color: STITCH.primaryFixed,
                          },
                        }}
                      >
                        Top Up <ArrowForwardIcon sx={{ fontSize: 14, ml: 0.5 }} />
                      </Button>
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          fontFamily: FONT_HEAD,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          letterSpacing: '0.03em',
                          color: STITCH.onSurfaceVariant,
                          mb: 0.5,
                        }}
                      >
                        Available Balance
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: FONT_HEAD,
                          fontSize: { xs: '1.5rem', md: '1.75rem' },
                          fontWeight: 700,
                          color: STITCH.onSurface,
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
                  borderRadius: '4px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box
                  sx={{
                    p: 3,
                    borderBottom: `1px solid ${STITCH.borderMuted}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: FONT_HEAD,
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      color: STITCH.onSurface,
                    }}
                  >
                    Active Projects
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => navigate('/hirer/jobs')}
                    sx={{
                      color: STITCH.onSurfaceVariant,
                      fontFamily: FONT_HEAD,
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      textTransform: 'none',
                      minWidth: 0,
                      '&:hover': {
                        backgroundColor: 'transparent',
                        color: STITCH.primaryContainer,
                      },
                    }}
                  >
                    View All
                  </Button>
                </Box>

                {activeJobs && activeJobs.length > 0 ? (
                  <Box>
                    {activeJobs.slice(0, 5).map((job, idx) => {
                      const jobId = job?.id || job?._id;
                      const badge = getStatusBadge(job);
                      const progress = getJobProgress(job);
                      const isInProgress =
                        badge.label === 'In Progress' || progress > 0;
                      const applicants = getApplicantsForJob(jobId);
                      const budget = job?.budget;
                      const budgetLabel = (() => {
                        if (budget && typeof budget === 'object') {
                          const val =
                            budget.min ?? budget.max ?? budget.amount;
                          return val ? formatGhanaCurrency(val) : null;
                        }
                        return budget ? formatGhanaCurrency(budget) : null;
                      })();
                      const location =
                        job?.location?.city ||
                        job?.location?.address ||
                        job?.location ||
                        '';
                      const subtitle =
                        [
                          location,
                          budgetLabel && `${budgetLabel} Budget`,
                        ]
                          .filter(Boolean)
                          .join(' • ') || 'Details on review';

                      return (
                        <Box
                          key={jobId || idx}
                          onClick={() => navigate(`/hirer/jobs/${jobId}`)}
                          sx={{
                            p: 3,
                            borderBottom:
                              idx < Math.min(activeJobs.length, 5) - 1
                                ? `1px solid ${STITCH.borderMuted}`
                                : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            justifyContent: 'space-between',
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            gap: 2,
                            transition: 'background-color 0.2s ease',
                            '&:hover': {
                              backgroundColor: alpha(STITCH.surfaceVariant, 0.3),
                            },
                          }}
                        >
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Stack
                              direction="row"
                              spacing={1.5}
                              alignItems="center"
                              sx={{ mb: 1 }}
                            >
                              <Typography
                                sx={{
                                  fontFamily: FONT_HEAD,
                                  fontSize: '1rem',
                                  fontWeight: 600,
                                  color: STITCH.onSurface,
                                }}
                                noWrap
                              >
                                {job?.title || 'Untitled Project'}
                              </Typography>
                              <Box
                                component="span"
                                sx={{
                                  fontSize: '0.625rem',
                                  fontWeight: 700,
                                  letterSpacing: '0.06em',
                                  textTransform: 'uppercase',
                                  color: badge.color,
                                  bgcolor: badge.bg,
                                  border: `1px solid ${badge.border}`,
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: '4px',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {badge.label}
                              </Box>
                            </Stack>
                            <Typography
                              sx={{
                                fontFamily: FONT_BODY,
                                fontSize: '0.875rem',
                                color: STITCH.onSurfaceVariant,
                              }}
                            >
                              {subtitle}
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
                            {isInProgress ? (
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-end',
                                  gap: 0.75,
                                  minWidth: 128,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: { xs: 120, sm: 128 },
                                    height: 8,
                                    bgcolor: STITCH.surfaceVariant,
                                    borderRadius: 5,
                                    overflow: 'hidden',
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: `${progress}%`,
                                      height: '100%',
                                      bgcolor: STITCH.primaryContainer,
                                      borderRadius: 5,
                                    }}
                                  />
                                </Box>
                                <Typography
                                  sx={{
                                    fontFamily: FONT_HEAD,
                                    fontSize: '0.75rem',
                                    color: STITCH.onSurfaceVariant,
                                  }}
                                >
                                  {progress}% Complete
                                </Typography>
                              </Box>
                            ) : (
                              <AvatarGroup
                                max={4}
                                sx={{
                                  '& .MuiAvatar-root': {
                                    width: 32,
                                    height: 32,
                                    fontSize: '0.75rem',
                                    border: `2px solid ${STITCH.surfaceContainer}`,
                                    bgcolor: STITCH.surfaceVariant,
                                    color: STITCH.onSurfaceVariant,
                                  },
                                }}
                              >
                                {applicants.length > 0 ? (
                                  applicants.map((app, i) => (
                                    <Avatar
                                      key={i}
                                      src={
                                        app?.worker?.profilePicture ||
                                        app?.worker?.avatar
                                      }
                                    >
                                      {(
                                        app?.worker?.firstName ||
                                        app?.applicantName ||
                                        'A'
                                      ).charAt(0)}
                                    </Avatar>
                                  ))
                                ) : (
                                  <Avatar>
                                    <PeopleIcon sx={{ fontSize: 18 }} />
                                  </Avatar>
                                )}
                              </AvatarGroup>
                            )}

                            <Stack
                              direction="row"
                              spacing={0.5}
                              alignItems="center"
                              sx={{
                                color: STITCH.primaryContainer,
                                opacity: { xs: 1, sm: 0 },
                                transition: 'opacity 0.2s ease',
                                '.MuiBox-root:hover &': { opacity: 1 },
                                fontFamily: FONT_HEAD,
                                fontSize: '0.875rem',
                                fontWeight: 600,
                              }}
                            >
                              Review
                              <ChevronRightIcon sx={{ fontSize: 18 }} />
                            </Stack>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography
                      sx={{
                        fontFamily: FONT_BODY,
                        color: STITCH.onSurfaceVariant,
                        fontSize: '0.9rem',
                        mb: 2,
                      }}
                    >
                      No active projects yet. Post your first job to get started.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<PostAddIcon />}
                      onClick={() => navigate('/hirer/jobs/post')}
                      sx={goldButtonSx}
                    >
                      Post a New Job
                    </Button>
                  </Box>
                )}
              </Paper>
            </Stack>
          </Grid>

          {/* ── Right column (span 4) ── */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3} sx={{ height: '100%' }}>
              {/* Quick Actions */}
              <Paper
                elevation={0}
                sx={{
                  bgcolor: STITCH.surfaceContainer,
                  border: `1px solid ${STITCH.borderMuted}`,
                  borderRadius: '4px',
                  p: 3,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: FONT_HEAD,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: STITCH.onSurface,
                    mb: 2,
                  }}
                >
                  Quick Actions
                </Typography>
                <Stack spacing={1.5}>
                  <Paper
                    elevation={0}
                    onClick={() => navigate('/hirer/jobs')}
                    sx={{
                      bgcolor: STITCH.surface,
                      border: `1px solid ${STITCH.borderMuted}`,
                      borderRadius: '4px',
                      p: 1.75,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s ease',
                      '&:hover': { borderColor: STITCH.primaryContainer },
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      sx={{ color: STITCH.onSurface }}
                    >
                      <DescriptionIcon sx={{ color: STITCH.onSurfaceVariant }} />
                      <Typography
                        sx={{
                          fontFamily: FONT_HEAD,
                          fontSize: '0.875rem',
                          fontWeight: 600,
                        }}
                      >
                        Manage Contracts
                      </Typography>
                    </Stack>
                    <ArrowForwardIcon
                      sx={{ color: STITCH.onSurfaceVariant, fontSize: 18 }}
                    />
                  </Paper>
                  <Paper
                    elevation={0}
                    onClick={() => navigate('/messages')}
                    sx={{
                      bgcolor: STITCH.surface,
                      border: `1px solid ${STITCH.borderMuted}`,
                      borderRadius: '4px',
                      p: 1.75,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s ease',
                      '&:hover': { borderColor: STITCH.primaryContainer },
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      sx={{ color: STITCH.onSurface }}
                    >
                      <MessageIcon sx={{ color: STITCH.onSurfaceVariant }} />
                      <Typography
                        sx={{
                          fontFamily: FONT_HEAD,
                          fontSize: '0.875rem',
                          fontWeight: 600,
                        }}
                      >
                        View Messages
                      </Typography>
                      {messagesBadge && (
                        <Box
                          component="span"
                          sx={{
                            bgcolor: STITCH.primaryContainer,
                            color: STITCH.onPrimary,
                            fontSize: '0.625rem',
                            fontWeight: 700,
                            px: 1,
                            py: 0.25,
                            borderRadius: 5,
                            ml: 0.5,
                            minWidth: 18,
                            textAlign: 'center',
                          }}
                        >
                          {messagesBadge}
                        </Box>
                      )}
                    </Stack>
                    <ArrowForwardIcon
                      sx={{ color: STITCH.onSurfaceVariant, fontSize: 18 }}
                    />
                  </Paper>
                </Stack>
              </Paper>

              {/* Top Rated Applicants */}
              <Paper
                elevation={0}
                sx={{
                  bgcolor: STITCH.surfaceContainer,
                  border: `1px solid ${STITCH.borderMuted}`,
                  borderRadius: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                }}
              >
                <Box
                  sx={{ p: 3, borderBottom: `1px solid ${STITCH.borderMuted}` }}
                >
                  <Typography
                    sx={{
                      fontFamily: FONT_HEAD,
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: STITCH.onSurface,
                    }}
                  >
                    Top Rated Applicants
                  </Typography>
                </Box>

                <Box sx={{ p: 1 }}>
                  {topApplicants.length > 0 ? (
                    topApplicants.map((applicant) => {
                      const statusColor = applicant.online
                        ? STITCH.success
                        : STITCH.surfaceVariant;
                      return (
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
                            transition: 'background-color 0.2s ease',
                            '&:hover': {
                              backgroundColor: alpha(STITCH.surfaceVariant, 0.5),
                            },
                          }}
                        >
                          <Box sx={{ position: 'relative' }}>
                            <Avatar
                              src={applicant.avatar}
                              sx={{
                                width: 48,
                                height: 48,
                                bgcolor: STITCH.surfaceVariant,
                                color: STITCH.onSurface,
                                fontWeight: 600,
                                border: `1px solid ${STITCH.borderMuted}`,
                              }}
                            >
                              {applicant.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: -2,
                                right: -2,
                                width: 14,
                                height: 14,
                                bgcolor: statusColor,
                                border: `2px solid ${STITCH.surfaceContainer}`,
                                borderRadius: '50%',
                              }}
                            />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontFamily: FONT_HEAD,
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: STITCH.onSurface,
                              }}
                              noWrap
                            >
                              {applicant.name}
                            </Typography>
                            <Typography
                              sx={{
                                fontFamily: FONT_HEAD,
                                fontSize: '0.75rem',
                                color: STITCH.onSurfaceVariant,
                              }}
                              noWrap
                            >
                              {applicant.title}
                            </Typography>
                          </Box>
                          {applicant.rating > 0 && (
                            <Stack
                              direction="row"
                              spacing={0.5}
                              alignItems="center"
                              sx={{ color: STITCH.primaryContainer }}
                            >
                              <StarIcon sx={{ fontSize: 16 }} />
                              <Typography
                                sx={{
                                  fontFamily: FONT_HEAD,
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                }}
                              >
                                {applicant.rating.toFixed(1)}
                              </Typography>
                            </Stack>
                          )}
                        </Box>
                      );
                    })
                  ) : (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography
                        sx={{
                          fontFamily: FONT_BODY,
                          fontSize: '0.85rem',
                          color: STITCH.onSurfaceVariant,
                          mb: 1.5,
                        }}
                      >
                        Featured applicants will appear here once your jobs
                        receive proposals.
                      </Typography>
                      <Button
                        onClick={() => navigate('/workers')}
                        sx={{
                          color: STITCH.primaryContainer,
                          fontFamily: FONT_HEAD,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          textTransform: 'none',
                        }}
                      >
                        Browse Workers →
                      </Button>
                    </Box>
                  )}
                </Box>

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
                      color: STITCH.primaryContainer,
                      fontFamily: FONT_HEAD,
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        color: STITCH.primaryFixed,
                      },
                    }}
                  >
                    View All Applicants
                  </Button>
                </Box>
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
            Last updated {timeSinceRefresh}
          </Typography>
        </Box>
      </Box>
    </PageCanvas>
  );
};

export default HirerDashboardPage;
