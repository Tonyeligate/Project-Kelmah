import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import PullToRefresh from '../../../components/common/PullToRefresh';
import {
  Box,
  Container,
  Grid,
  Paper,
  ButtonBase,
  Typography,
  Button,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  useTheme,
  Fade,
  Grow,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Breadcrumbs,
  Link as MUILink,
  Skeleton,
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
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell as RechartsCell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
} from 'recharts';
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
import RecentActivityFeed from '../components/RecentActivityFeed';
import dashboardService from '../../dashboard/services/dashboardService';
import { useVisibilityPolling } from '../../../hooks/useVisibilityPolling';
import { TOUCH_TARGET_MIN } from '../../../constants/layout';
import { useBreakpointDown } from '@/hooks/useResponsive';
import { formatGhanaCurrency } from '@/utils/formatters';
import PageCanvas from '@/modules/common/components/PageCanvas';
import { withBottomNavSafeArea } from '@/utils/safeArea';

const DASHBOARD_LOADING_TIMEOUT_MS = 10000;
const APPLICATION_REFRESH_TTL_MS = 2 * 60 * 1000; // 2 minutes
const AUTO_REFRESH_INTERVAL_MS = 60 * 1000; // DASH-001: Auto-refresh every 60 seconds
const MAX_APPLICATION_HYDRATE_PER_CYCLE = 2;

const isGatewayPressureStatus = (status) =>
  [429, 502, 503, 504].includes(status);

const toValidTimestamp = (value) => {
  if (!value) {
    return null;
  }

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

const HirerDashboardPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const dashboardFontFamily =
    '"Plus Jakarta Sans", "Manrope", "Segoe UI", sans-serif';

  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true); // DASH-001: Auto-refresh state
  const [timeSinceRefresh, setTimeSinceRefresh] = useState('Just now'); // DASH-001: Human-readable time
  const [recentActivity, setRecentActivity] = useState([]);
  const [partialLoadWarning, setPartialLoadWarning] = useState('');

  const timeoutRef = useRef(null);
  const fetchPromiseRef = useRef(null);
  const isMountedRef = useRef(true);
  const applicationRecordsRef = useRef({});
  // Memoize curried selectors to prevent new function references every render
  const selectActive = useMemo(() => selectHirerJobs('active'), []);
  const selectCompleted = useMemo(() => selectHirerJobs('completed'), []);

  // Get data from Redux store using selectors
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
  const isCompactMobile = useBreakpointDown('sm');

  // Fetch hirer data on component mount
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
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return [];
    }

    const snapshot = applicationRecordsRef.current || {};
    const now = Date.now();

    return jobs
      .map((job) => job?.id || job?._id)
      .filter((jobId) => {
        if (!jobId) {
          return false;
        }
        const record = snapshot[jobId];
        if (!record) {
          return true;
        }
        if (record.isLoading) {
          return false;
        }
        if (record.error) {
          return true;
        }
        if (!record.fetchedAt) {
          return true;
        }
        return now - record.fetchedAt > APPLICATION_REFRESH_TTL_MS;
      });
  }, []);

  useEffect(() => {
    if (!isHydrating) {
      return;
    }

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
  }, [
    activeJobs,
    completedJobs,
    hirerProfile,
    isHydrating,
    clearLoadingTimeout,
  ]);

  const fetchDashboardData = useCallback(
    async (source = 'initial-load') => {
      const isInitialHydration = source === 'initial-load';
      try {
        if (isInitialHydration) {
          setIsHydrating(true);
        }
        setError(null);
        setLoadingTimeout(false);
        setPartialLoadWarning('');

        clearLoadingTimeout();
        timeoutRef.current = setTimeout(() => {
          if (!isMountedRef.current) {
            return;
          }

          const message = isInitialHydration
            ? 'Loading is taking longer than expected. Please check your connection and try refreshing.'
            : 'Updating your dashboard is taking longer than expected. Please try again.';

          setLoadingTimeout(true);
          setError(message);

          if (isInitialHydration) {
            setIsHydrating(false);
          }
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
        const completedPayload = await runDashboardRequest('completed jobs', () =>
          dispatch(fetchHirerJobs('completed')).unwrap(),
        );
        await runDashboardRequest('payments', () =>
          dispatch(fetchPaymentSummary()).unwrap(),
        );
        const activityPayload = await runDashboardRequest('activity feed', () =>
          dashboardService.getRecentActivity(1, 5),
        );

        fetchPromiseRef.current = null;

        if (!isMountedRef.current) {
          return;
        }

        setRecentActivity(
          Array.isArray(activityPayload?.activities)
            ? activityPayload.activities
            : [],
        );

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
                fetchJobApplications({
                  jobId,
                  status: 'pending',
                }),
              ).unwrap();
            } catch (applicationError) {
              failedModules.add('applications');
              if (isGatewayPressureStatus(applicationError?.response?.status)) {
                gatewayUnderPressure = true;
                break;
              }
            }
          }
        }

        const partialFailureList = Array.from(failedModules);
        const hasAnySnapshot = Boolean(
          profilePayload || activePayload || completedPayload || activityPayload,
        );

        if (partialFailureList.length > 0 && hasAnySnapshot) {
          setPartialLoadWarning(
            `Some sections are showing last available data (${partialFailureList.slice(0, 3).join(', ')}).`,
          );
        }

        if (!profilePayload && !activePayload && !completedPayload) {
          setError(
            'Backend services are temporarily unavailable. Please retry in a few seconds.',
          );
        }
      } catch {
        // Error captured in state — no console logging in production
        if (!isMountedRef.current) {
          return;
        }
        clearLoadingTimeout();
        setLoadingTimeout(false);
        setPartialLoadWarning('');
        setError('Failed to load hirer data. Please try again.');
      } finally {
        if (isMountedRef.current && isInitialHydration) {
          setIsHydrating(false);
        }
        // AUD2-M04 FIX: Update lastRefreshed on every completed fetch (not only manual refresh)
        // so the "time since refresh" display is accurate from the initial load onward.
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
    if (!storeError) {
      return;
    }
    setError(
      typeof storeError === 'string'
        ? storeError
        : 'Failed to load hirer data. Please try again.',
    );
  }, [storeError]);

  useEffect(() => {
    if (!jobsError) {
      return;
    }
    setError((prev) => prev || 'Failed to load hirer jobs. Please try again.');
  }, [jobsError]);

  // Handler for refreshing data
  const handleRefresh = async () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);
    try {
      await fetchDashboardData('manual-refresh');
      setLastRefreshed(Date.now());
      setTimeSinceRefresh('Just now');
    } catch {
      // Error captured in state — no console logging in production
      setError('Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  useVisibilityPolling({
    enabled: autoRefreshEnabled && !isHydrating,
    intervalMs: AUTO_REFRESH_INTERVAL_MS,
    maxIntervalMs: AUTO_REFRESH_INTERVAL_MS * 4,
    shouldPause: () => refreshing || !isMountedRef.current || Boolean(error),
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

  // DASH-001: Update "time since refresh" display
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

    const interval = setInterval(updateTimeSinceRefresh, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [lastRefreshed]);

  // Dashboard summary data
  const summaryData = {
    activeJobs: activeJobs?.length || 0,
    pendingProposals: totalPendingProposals,
    completedJobs: completedJobs?.length || 0,
    totalSpent: hirerProfile?.totalSpent || 0,
    pendingPayments: payments?.pending?.length || 0,
    activeWorkers: hirerProfile?.activeWorkers || [],
  };

  const isNewHirer =
    summaryData.activeJobs === 0 && summaryData.completedJobs === 0;

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const lastRefreshedClockLabel = useMemo(
    () =>
      new Date(lastRefreshed).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [lastRefreshed],
  );

  const overdueActiveJobsCount = useMemo(() => {
    const now = Date.now();
    return (Array.isArray(activeJobs) ? activeJobs : []).filter((job) => {
      const deadline = extractActiveJobDeadline(job);
      return Boolean(deadline && deadline < now);
    }).length;
  }, [activeJobs]);

  const jobsWithoutApplicationsCount = useMemo(() => {
    const records = applicationRecords || {};

    return (Array.isArray(activeJobs) ? activeJobs : []).filter((job) => {
      const jobId = job?.id || job?._id;
      if (!jobId) {
        return false;
      }

      const record = records[jobId];
      if (!record) {
        return true;
      }

      if (typeof record.total === 'number') {
        return record.total <= 0;
      }

      if (record?.buckets && typeof record.buckets === 'object') {
        const bucketTotal = Object.values(record.buckets).reduce(
          (count, bucket) => count + (Array.isArray(bucket) ? bucket.length : 0),
          0,
        );
        return bucketTotal <= 0;
      }

      return true;
    }).length;
  }, [activeJobs, applicationRecords]);

  const todayPriorityQueue = useMemo(() => {
    const items = [];

    if (summaryData.pendingProposals > 0) {
      items.push({
        id: 'priority-applications',
        title: `${summaryData.pendingProposals} pending application${summaryData.pendingProposals > 1 ? 's' : ''} to review`,
        detail: 'Approve or decline quickly to keep workers engaged.',
        ctaLabel: 'Review queue',
        path: '/hirer/applications',
        toneKey: 'warning',
        icon: <ProposalIcon fontSize="small" />,
      });
    }

    if (overdueActiveJobsCount > 0) {
      items.push({
        id: 'priority-overdue',
        title: `${overdueActiveJobsCount} live job${overdueActiveJobsCount > 1 ? 's' : ''} may be overdue`,
        detail: 'Update timelines so workers and applicants see accurate urgency.',
        ctaLabel: 'Update jobs',
        path: '/hirer/jobs?status=active',
        toneKey: 'error',
        icon: <WorkIcon fontSize="small" />,
      });
    }

    if (summaryData.pendingPayments > 0) {
      items.push({
        id: 'priority-payments',
        title: `${summaryData.pendingPayments} payment release${summaryData.pendingPayments > 1 ? 's' : ''} pending`,
        detail: 'Clear pending payouts to maintain worker trust and response speed.',
        ctaLabel: 'Open payments',
        path: '/hirer/payments',
        toneKey: 'info',
        icon: <PaymentIcon fontSize="small" />,
      });
    }

    if (jobsWithoutApplicationsCount > 0) {
      items.push({
        id: 'priority-no-applications',
        title: `${jobsWithoutApplicationsCount} live job${jobsWithoutApplicationsCount > 1 ? 's' : ''} still without applicants`,
        detail: 'Refresh title, scope, or budget to improve match visibility.',
        ctaLabel: 'Improve listings',
        path: '/hirer/jobs?status=active',
        toneKey: 'secondary',
        icon: <PeopleIcon fontSize="small" />,
      });
    }

    if (items.length === 0) {
      items.push({
        id: 'priority-clear',
        title: 'No urgent blockers in your queue',
        detail: 'Post a new role or scout talent while momentum is high.',
        ctaLabel: 'Post new job',
        path: '/hirer/jobs/post',
        toneKey: 'success',
        icon: <CheckCircleIcon fontSize="small" />,
      });
    }

    return items.slice(0, 3);
  }, [
    jobsWithoutApplicationsCount,
    overdueActiveJobsCount,
    summaryData.pendingPayments,
    summaryData.pendingProposals,
  ]);

  const renderTodayPriorityStrip = useCallback(
    (compact = false) => (
      <Paper
        elevation={0}
        sx={{
          mb: compact ? 1.3 : 2,
          p: compact ? 1.1 : 1.4,
          borderRadius: 2.5,
          border: '1px solid',
          borderColor: alpha(theme.palette.warning.main, 0.24),
          background: `linear-gradient(145deg, ${alpha(
            theme.palette.warning.main,
            theme.palette.mode === 'dark' ? 0.16 : 0.08,
          )} 0%, ${alpha(theme.palette.background.paper, 0.96)} 100%)`,
        }}
      >
        <Stack spacing={compact ? 0.75 : 1}>
          <Box
            sx={{
              display: 'flex',
              alignItems: compact ? 'flex-start' : 'center',
              justifyContent: 'space-between',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Box>
              <Typography
                variant={compact ? 'subtitle2' : 'subtitle1'}
                sx={{ fontWeight: 800 }}
              >
                Today Priority Queue
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Handle these items first to keep hiring decisions moving.
              </Typography>
            </Box>
            <Chip
              size="small"
              variant="outlined"
              label={`Last sync ${lastRefreshedClockLabel}`}
              sx={{ fontWeight: 700 }}
            />
          </Box>

          <Stack spacing={0.75}>
            {todayPriorityQueue.map((item, index) => {
              const tone =
                theme.palette[item.toneKey]?.main || theme.palette.primary.main;

              return (
                <Box
                  key={item.id}
                  sx={{
                    p: compact ? 0.8 : 1,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: alpha(tone, 0.3),
                    backgroundColor: alpha(
                      tone,
                      theme.palette.mode === 'dark' ? 0.18 : 0.1,
                    ),
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        color: tone,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, lineHeight: 1.3 }}
                      >
                        {item.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.2 }}
                      >
                        {item.detail}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant={index === 0 ? 'contained' : 'outlined'}
                      onClick={() => navigate(item.path)}
                      sx={{
                        minHeight: TOUCH_TARGET_MIN,
                        textTransform: 'none',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.ctaLabel}
                    </Button>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Stack>
      </Paper>
    ),
    [lastRefreshedClockLabel, navigate, theme, todayPriorityQueue],
  );

  // LC Portal-inspired Dashboard Overview - IMPROVED with empty state CTAs
  const renderDashboardOverview = () =>
    isMobile ? (
      <Fade in timeout={400}>
        <Box
          sx={{
            background:
              theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, rgba(6,10,18,0.98), rgba(10,19,34,0.96))'
                : 'linear-gradient(180deg, #f7f9fd 0%, #eef3fa 100%)',
            minHeight: 'auto',
            fontFamily: dashboardFontFamily,
            p: 1.2,
            pb: withBottomNavSafeArea(14),
            overflowX: 'hidden',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 1.6,
              mb: 1.5,
              borderRadius: 3,
              border: '1px solid',
              borderColor:
                theme.palette.mode === 'dark'
                  ? 'rgba(255,215,0,0.2)'
                  : 'rgba(20,24,35,0.12)',
              background:
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(150deg, rgba(6,10,18,0.97) 0%, rgba(10,19,34,0.96) 100%)'
                  : 'linear-gradient(145deg, #ffffff 0%, #f2f7ff 100%)',
            }}
          >
            <Typography
              variant="h5"
              component="h1"
              sx={{
                fontWeight: 800,
                letterSpacing: -0.3,
                mb: 0.6,
                fontSize: { xs: '1.36rem', sm: '1.5rem' },
              }}
            >
              {getGreeting()},{' '}
              {hirerProfile?.firstName || user?.firstName || 'there'}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1.1, fontSize: '0.83rem', lineHeight: 1.38 }}
            >
              Hiring cockpit: launch opportunities, shortlist top talent, and
              keep every live role moving.
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              sx={{ mb: 1.05 }}
            >
              <Chip
                label={`Active ${summaryData.activeJobs}`}
                size="small"
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label={`Applications ${summaryData.pendingProposals}`}
                size="small"
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label={`Spent ${formatGhanaCurrency(summaryData.totalSpent)}`}
                size="small"
                sx={{ fontWeight: 700 }}
              />
            </Stack>
            <Chip
              size="small"
              label={
                autoRefreshEnabled
                  ? `Live • ${timeSinceRefresh}`
                  : 'Live updates paused'
              }
              color={autoRefreshEnabled ? 'success' : 'default'}
              variant="outlined"
              onClick={() => setAutoRefreshEnabled((prev) => !prev)}
              sx={{
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: TOUCH_TARGET_MIN,
                '& .MuiChip-label': { px: 1.25 },
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.7 }}
            >
              Last sync {lastRefreshedClockLabel}
            </Typography>
          </Paper>

          {renderTodayPriorityStrip(true)}

          <Grid container spacing={1.25} sx={{ mb: 2 }}>
            {[
              {
                title: 'Review queue',
                value: summaryData.pendingProposals,
                helper: 'Pending applications to decide',
                tone: theme.palette.warning.main,
              },
              {
                title: 'Live jobs',
                value: summaryData.activeJobs,
                helper: 'Open listings currently hiring',
                tone: theme.palette.info.main,
              },
              {
                title: 'Completed',
                value: summaryData.completedJobs,
                helper: 'Jobs delivered successfully',
                tone: theme.palette.success.main,
              },
            ].map((item, index) => (
              <Grid
                item
                xs={index < 2 ? 6 : 12}
                key={`mobile-summary-${item.title}`}
              >
                <Box
                  sx={{
                    p: 1.05,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: alpha(item.tone, 0.32),
                    backgroundColor: alpha(
                      item.tone,
                      theme.palette.mode === 'dark' ? 0.12 : 0.08,
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
                      fontSize: { xs: '0.96rem', sm: '1.25rem' },
                    }}
                  >
                    {item.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.helper}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={1} sx={{ mb: 1.5 }}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<PostAddIcon />}
                onClick={() => navigate('/hirer/jobs/post')}
                sx={{
                  minHeight: TOUCH_TARGET_MIN,
                  textTransform: 'none',
                  fontWeight: 700,
                }}
              >
                Post Job
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PeopleIcon />}
                onClick={() => navigate('/hirer/find-talents')}
                sx={{
                  minHeight: TOUCH_TARGET_MIN,
                  textTransform: 'none',
                  fontWeight: 700,
                }}
              >
                Find Talent
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ProposalIcon />}
                onClick={() => navigate('/hirer/applications')}
                sx={{
                  minHeight: TOUCH_TARGET_MIN,
                  textTransform: 'none',
                  fontWeight: 700,
                }}
              >
                Review Queue
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<MessageIcon />}
                onClick={() => navigate('/messages')}
                sx={{
                  minHeight: TOUCH_TARGET_MIN,
                  textTransform: 'none',
                  fontWeight: 700,
                }}
              >
                Open Messages
              </Button>
            </Grid>
          </Grid>

          {isNewHirer && (
            <Paper
              elevation={0}
              sx={{
                p: 1.75,
                mb: 1.5,
                borderRadius: 2,
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.35),
              }}
            >
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{ mb: 0.75 }}
              >
                Welcome to Kelmah! 🎉
              </Typography>
              <Typography variant="body2" sx={{ mb: 1.5, opacity: 0.9 }}>
                Get started by posting your first job to connect with skilled
                workers in your area.
              </Typography>
              <Button
                variant="contained"
                startIcon={<PostAddIcon />}
                onClick={() => navigate('/hirer/jobs/post')}
                sx={{ minHeight: TOUCH_TARGET_MIN }}
              >
                Post Your First Job
              </Button>
            </Paper>
          )}

          <Box sx={{ mb: 2 }}>
            <RecentActivityFeed
              jobs={activeJobs || []}
              applications={applicationRecords || {}}
              activities={recentActivity}
            />
          </Box>
        </Box>
      </Fade>
    ) : (
      <Fade in timeout={500}>
        <Box
          sx={{
            background:
              theme.palette.mode === 'dark'
                ? 'radial-gradient(circle at 10% 4%, rgba(255,215,0,0.16), transparent 45%), radial-gradient(circle at 88% 8%, rgba(56,189,248,0.14), transparent 40%), radial-gradient(circle at 54% 86%, rgba(34,197,94,0.13), transparent 38%), #04060C'
                : 'linear-gradient(180deg, #f7f9fd 0%, #eef3fa 58%, #edf3fb 100%)',
            minHeight: { xs: '100dvh', md: 'auto' },
            fontFamily: dashboardFontFamily,
            p: { xs: 1.1, sm: 2, md: 3 },
            pb: {
              xs: withBottomNavSafeArea(12),
              md: 3,
            },
            overflowX: 'hidden',
          }}
        >
          {/* Breadcrumb - LC Portal Style */}
          <Breadcrumbs
            sx={{ mb: 3, display: { xs: 'none', md: 'flex' } }}
            aria-label="Breadcrumb navigation"
          >
            <MUILink
              component={RouterLink}
              to="/"
              underline="hover"
              sx={{
                color: 'text.secondary',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              Home
            </MUILink>
            <Typography color="text.primary">Dashboard</Typography>
          </Breadcrumbs>

          {/* Command Center Header */}
          <Paper
            elevation={0}
            sx={{
              mb: { xs: 2, md: 4 },
              p: { xs: 1.35, sm: 2.75, md: 3.25 },
              borderRadius: { xs: 2.5, md: 4 },
              border: '1px solid',
              borderColor:
                theme.palette.mode === 'dark'
                  ? 'rgba(255,215,0,0.28)'
                  : 'rgba(20,24,35,0.12)',
              background:
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(150deg, rgba(6,10,18,0.97) 0%, rgba(10,19,34,0.96) 52%, rgba(7,16,28,0.95) 100%)'
                  : 'linear-gradient(145deg, #ffffff 0%, #f2f7ff 52%, #edf4ff 100%)',
              boxShadow:
                theme.palette.mode === 'dark'
                  ? '0 18px 34px rgba(0,0,0,0.42)'
                  : '0 14px 28px rgba(15,23,42,0.10)',
              position: 'relative',
              overflow: 'hidden',
              '&::after': {
                content: '""',
                position: 'absolute',
                width: { xs: 160, md: 250 },
                height: { xs: 160, md: 250 },
                borderRadius: '50%',
                top: -82,
                right: -80,
                background:
                  theme.palette.mode === 'dark'
                    ? 'radial-gradient(circle, rgba(250,204,21,0.24) 0%, rgba(250,204,21,0) 72%)'
                    : 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, rgba(14,165,233,0) 72%)',
                pointerEvents: 'none',
              },
            }}
          >
            <Stack
              spacing={{ xs: 1.15, md: 2.25 }}
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
                    variant="h4"
                    component="h1"
                    sx={{
                      color: 'text.primary',
                      fontWeight: 800,
                      letterSpacing: -0.4,
                      fontSize: { xs: '1.5rem', md: '2rem' },
                    }}
                  >
                    {getGreeting()},{' '}
                    {hirerProfile?.firstName || user?.firstName || 'there'}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      maxWidth: 620,
                      fontSize: { xs: '0.9rem', md: '1rem' },
                      lineHeight: { xs: 1.45, md: 1.5 },
                    }}
                  >
                    {isCompactMobile
                      ? 'Launch jobs, shortlist talent, and keep live roles moving.'
                      : 'Hiring cockpit: launch opportunities, shortlist top talent, and keep every live role moving.'}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 0.75,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    position: 'relative',
                  }}
                >
                  <Chip
                    label={`Active ${summaryData.activeJobs}`}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                  <Chip
                    label={`Applications ${summaryData.pendingProposals}`}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                  <Chip
                    label={`Spent ${formatGhanaCurrency(summaryData.totalSpent)}`}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                  <Chip
                    size="small"
                    label={
                      autoRefreshEnabled
                        ? `Live • ${timeSinceRefresh}`
                        : 'Live updates paused'
                    }
                    color={autoRefreshEnabled ? 'success' : 'default'}
                    variant="outlined"
                    onClick={() => setAutoRefreshEnabled((prev) => !prev)}
                    sx={{ fontWeight: 700, cursor: 'pointer' }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', width: '100%', mt: -0.1 }}
                  >
                    Last sync {lastRefreshedClockLabel}
                  </Typography>
                  <Box
                    component="span"
                    role="status"
                    aria-live="polite"
                    sx={{
                      position: 'absolute',
                      width: 1,
                      height: 1,
                      p: 0,
                      m: -1,
                      overflow: 'hidden',
                      clip: 'rect(0, 0, 0, 0)',
                      whiteSpace: 'nowrap',
                      border: 0,
                    }}
                  >
                    {autoRefreshEnabled
                      ? `Live updates enabled. Last refresh ${timeSinceRefresh}. Last sync ${lastRefreshedClockLabel}.`
                      : 'Live updates are paused.'}
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(2, minmax(0, 1fr))',
                    sm: 'repeat(4, minmax(0, 1fr))',
                  },
                  gap: 1,
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<PostAddIcon />}
                  onClick={() => navigate('/hirer/jobs/post')}
                  sx={{
                    borderRadius: 2.5,
                    minHeight: 44,
                    fontWeight: 700,
                    textTransform: 'none',
                  }}
                >
                  Post Job
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PeopleIcon />}
                  onClick={() => navigate('/hirer/find-talents')}
                  sx={{
                    borderRadius: 2.5,
                    minHeight: 44,
                    fontWeight: 700,
                    textTransform: 'none',
                  }}
                >
                  Find Talent
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ProposalIcon />}
                  onClick={() => navigate('/hirer/applications')}
                  sx={{
                    borderRadius: 2.5,
                    minHeight: 44,
                    fontWeight: 700,
                    textTransform: 'none',
                  }}
                >
                  Review Queue
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
                  Open Messages
                </Button>
              </Box>

              <Grid container spacing={1}>
                {[
                  {
                    title: 'Review queue',
                    value: summaryData.pendingProposals,
                    helper: 'Pending applications to decide',
                    tone: theme.palette.warning.main,
                  },
                  {
                    title: 'Live jobs',
                    value: summaryData.activeJobs,
                    helper: 'Open listings currently hiring',
                    tone: theme.palette.info.main,
                  },
                  {
                    title: 'Completed',
                    value: summaryData.completedJobs,
                    helper: 'Jobs delivered successfully',
                    tone: theme.palette.success.main,
                  },
                ].map((item, index) => (
                  <Fade
                    in
                    timeout={420}
                    style={{ transitionDelay: `${120 + index * 90}ms` }}
                    key={`overview-fade-${item.title}`}
                  >
                    <Grid
                      item
                      xs={index < 2 ? 6 : 12}
                      sm={4}
                      key={`overview-${item.title}`}
                    >
                      <Box
                        sx={{
                          p: { xs: 1.1, sm: 1.5 },
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
                            fontSize: { xs: '1rem', sm: '1.2rem' },
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

          {renderTodayPriorityStrip(false)}

          {/* New Hirer Welcome Banner - Shows when no activity */}
          {isNewHirer && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 4,
                borderRadius: 2,
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
                Get started by posting your first job to connect with skilled
                workers in your area.
              </Typography>
              <Button
                variant="contained"
                startIcon={<PostAddIcon />}
                onClick={() => navigate('/hirer/jobs/post')}
              >
                Post Your First Job
              </Button>
            </Paper>
          )}

          {/* Metric Cards - Futuristic & Mobile-Optimized */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
              gap: { xs: 0.75, sm: 2.25, md: 2, lg: 2 },
              mb: { xs: 1.9, md: 4 },
              pb: { xs: 1, sm: 0 },
            }}
          >
            {[
              {
                title: 'Live Jobs',
                value: summaryData.activeJobs,
                tone: '#F39C12',
                icon: (
                  <WorkIcon
                    sx={{
                      fontSize: { xs: 28, sm: 42 },
                      color: alpha('#F39C12', 0.28),
                    }}
                  />
                ),
                onClick: () => navigate('/hirer/jobs'),
                tooltip: 'Live Jobs: ' + summaryData.activeJobs,
                actionLabel: 'Manage jobs',
              },
              {
                title: 'Completed',
                value: summaryData.completedJobs,
                tone: '#1ABC9C',
                icon: (
                  <CheckCircleIcon
                    sx={{
                      fontSize: { xs: 28, sm: 42 },
                      color: alpha('#1ABC9C', 0.28),
                    }}
                  />
                ),
                onClick: () => navigate('/hirer/jobs?status=completed'),
                tooltip: 'Completed Jobs: ' + summaryData.completedJobs,
                actionLabel: 'View history',
              },
              {
                title: 'Review Queue',
                value: summaryData.pendingProposals,
                tone: '#3498DB',
                icon: (
                  <ProposalIcon
                    sx={{
                      fontSize: { xs: 28, sm: 42 },
                      color: alpha('#3498DB', 0.28),
                    }}
                  />
                ),
                onClick: () => navigate('/hirer/applications'),
                tooltip: 'Pending applications: ' + summaryData.pendingProposals,
                actionLabel: 'Open queue',
              },
              {
                title: 'Budget Spent',
                value: formatGhanaCurrency(summaryData.totalSpent),
                tone: theme.palette.info.main,
                icon: (
                  <PaymentIcon
                    sx={{
                      fontSize: { xs: 28, sm: 42 },
                      color: alpha(theme.palette.info.main, 0.28),
                    }}
                  />
                ),
                onClick: () => navigate('/hirer/payments'),
                tooltip: 'Budget spent: ' + summaryData.totalSpent,
                actionLabel: 'Open payments',
              },
            ].map((card, index) => (
              <Fade
                in
                timeout={420}
                style={{ transitionDelay: `${80 + index * 70}ms` }}
                key={`hirer-metric-${card.title}`}
              >
                <Box
                  sx={{
                    minWidth: 'auto',
                  }}
                >
                  <Tooltip title={card.tooltip} arrow placement="top">
                    <ButtonBase
                      onClick={card.onClick}
                      aria-label={card.tooltip}
                      sx={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        borderRadius: { xs: 4, sm: 2.5 },
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
                          background:
                            theme.palette.mode === 'dark'
                              ? `linear-gradient(155deg, ${alpha(card.tone, 0.2)} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`
                              : `linear-gradient(155deg, ${alpha(card.tone, 0.14)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 62%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
                          backdropFilter:
                            theme.palette.mode === 'dark'
                              ? 'blur(16px)'
                              : 'none',
                          border: '1px solid',
                          borderColor: alpha(
                            card.tone,
                            theme.palette.mode === 'dark' ? 0.3 : 0.44,
                          ),
                          color: 'text.primary',
                          position: 'relative',
                          overflow: 'hidden',
                          minHeight: { xs: 80, sm: 126, md: 132 },
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow:
                            theme.palette.mode === 'dark'
                              ? `inset 0 1px 1px ${alpha('#fff', 0.1)}`
                              : 'none',
                          '@media (hover: hover)': {
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow:
                                theme.palette.mode === 'dark'
                                  ? `0 8px 25px ${alpha(card.tone, 0.25)}`
                                  : '0 8px 25px rgba(0,0,0,0.15)',
                            },
                          },
                        }}
                      >
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
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color:
                              theme.palette.mode === 'dark'
                                ? alpha('#fff', 0.8)
                                : 'text.secondary',
                            mb: 0.55,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            fontSize: { xs: '0.64rem', sm: '0.75rem' },
                            maxWidth: { xs: '66%', sm: '100%' },
                            whiteSpace: { xs: 'nowrap', sm: 'normal' },
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                          }}
                        >
                          {card.title}
                        </Typography>
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 800,
                            letterSpacing: -0.5,
                            fontSize: {
                              xs: '0.94rem',
                              sm: '1.45rem',
                              md: '1.75rem',
                            },
                            lineHeight: 1.2,
                            pr: { xs: 4, sm: 6 },
                          }}
                        >
                          {card.value}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color:
                              theme.palette.mode === 'dark'
                                ? alpha('#fff', 0.5)
                                : 'text.secondary',
                            mt: 0.5,
                            display: { xs: 'none', sm: 'inline' },
                          }}
                        >
                          {card.actionLabel}
                        </Typography>
                      </Paper>
                    </ButtonBase>
                  </Tooltip>
                </Box>
              </Fade>
            ))}
          </Box>
          {/* TWO CHART SECTIONS - LC Portal Style */}
          <Grid container spacing={{ xs: 0.75, sm: 2.5, md: 2, lg: 2 }}>
            {/* Bills Chart / Spending Chart */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 0.9, sm: 2, md: 3 },
                  borderRadius: 2.5,
                  bgcolor: alpha(theme.palette.background.paper, 0.9),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.success.main, 0.24),
                  height: { xs: 198, sm: 350 },
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight={600}
                  sx={{
                    mb: { xs: 1.1, sm: 3 },
                    color: 'text.primary',
                    fontSize: { xs: '0.86rem', sm: '1.25rem' },
                  }}
                >
                  Jobs Overview
                </Typography>
                {/* Recharts BarChart replacing manual Box bars */}
                <Box sx={{ height: { xs: 150, sm: 205 }, width: '100%' }}>
                  {summaryData.totalSpent > 0 ||
                  summaryData.completedJobs > 0 ||
                  summaryData.activeJobs > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            name: 'Completed',
                            value: summaryData.completedJobs,
                          },
                          { name: 'Active', value: summaryData.activeJobs },
                        ]}
                        margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={theme.palette.divider}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{
                            fill: theme.palette.text.secondary,
                            fontSize: isCompactMobile ? 10 : 12,
                          }}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{
                            fill: theme.palette.text.secondary,
                            fontSize: isCompactMobile ? 10 : 12,
                          }}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 8,
                          }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {[
                            {
                              name: 'Completed',
                              fill: theme.palette.success.main,
                            },
                            {
                              name: 'Active',
                              fill: theme.palette.secondary.dark,
                            },
                          ].map((entry, index) => (
                            <RechartsCell
                              key={`bar-${index}`}
                              fill={entry.fill}
                            />
                          ))}
                        </Bar>
                      </BarChart>
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
                      <PaymentIcon
                        sx={{ fontSize: 48, color: 'text.disabled' }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        No jobs yet
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        Post a job to see your overview
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Applications Chart - Donut Style */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 0.9, sm: 2, md: 3 },
                  borderRadius: 2.5,
                  bgcolor: alpha(theme.palette.background.paper, 0.9),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.info.main, 0.24),
                  height: { xs: 198, sm: 350 },
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight={600}
                  sx={{
                    mb: { xs: 1.1, sm: 3 },
                    color: 'text.primary',
                    fontSize: { xs: '0.86rem', sm: '1.25rem' },
                  }}
                >
                  Applications Overview
                </Typography>
                {(() => {
                  const appDonutData = [
                    {
                      name: 'Completed',
                      value: summaryData.completedJobs,
                      color: theme.palette.success.main,
                    },
                    {
                      name: 'Applications',
                      value: summaryData.pendingProposals,
                      color: theme.palette.info.main,
                    },
                    {
                      name: 'Active Jobs',
                      value: summaryData.activeJobs,
                      color: theme.palette.warning.main,
                    },
                  ].filter((d) => d.value > 0);
                  const appTotal =
                    summaryData.activeJobs +
                    summaryData.completedJobs +
                    summaryData.pendingProposals;

                  return (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        height: { xs: 'auto', sm: 236 },
                        alignItems: 'center',
                      }}
                    >
                      {/* Legend */}
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                          justifyContent: 'center',
                          pr: { xs: 0, sm: 4 },
                          pb: { xs: 1, sm: 0 },
                        }}
                      >
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: 'success.main',
                            }}
                          />
                          <Typography variant="body2">
                            Completed: {summaryData.completedJobs}
                          </Typography>
                        </Box>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: 'info.main',
                            }}
                          />
                          <Typography variant="body2">
                            Applications: {summaryData.pendingProposals}
                          </Typography>
                        </Box>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: 'warning.main',
                            }}
                          />
                          <Typography variant="body2">
                            Active Jobs: {summaryData.activeJobs}
                          </Typography>
                        </Box>
                      </Box>
                      {/* Donut Chart */}
                      <Box
                        sx={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          minHeight: { xs: 120, sm: 220 },
                        }}
                      >
                        {appDonutData.length > 0 ? (
                          <ResponsiveContainer
                            width="100%"
                            height={isCompactMobile ? 150 : 220}
                          >
                            <PieChart>
                              <Pie
                                data={appDonutData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={isCompactMobile ? 42 : 55}
                                outerRadius={isCompactMobile ? 67 : 85}
                                paddingAngle={2}
                                stroke="none"
                              >
                                {appDonutData.map((entry, idx) => (
                                  <RechartsCell
                                    key={`app-cell-${idx}`}
                                    fill={entry.color}
                                  />
                                ))}
                              </Pie>
                              <RechartsTooltip
                                contentStyle={{
                                  borderRadius: 8,
                                  border: 'none',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                }}
                                formatter={(value, name) => [`${value}`, name]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <Box
                            sx={{
                              width: 122,
                              height: 122,
                              borderRadius: '50%',
                              bgcolor: 'action.disabledBackground',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 0.5,
                            }}
                          >
                            <ProposalIcon
                              sx={{ fontSize: 36, color: 'text.disabled' }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              No data
                            </Typography>
                          </Box>
                        )}
                        {/* Center label overlaid on donut */}
                        {appDonutData.length > 0 && (
                          <Typography
                            variant="h4"
                            fontWeight={600}
                            color="text.secondary"
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              fontSize: { xs: '1.05rem', sm: '2rem' },
                              pointerEvents: 'none',
                            }}
                          >
                            {appTotal}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })()}
              </Paper>
            </Grid>
          </Grid>

          {/* Recent Activity Feed (Phase 3) */}
          <Box sx={{ mt: { xs: 1, sm: 3 } }}>
            <RecentActivityFeed
              jobs={activeJobs || []}
              applications={applicationRecords || {}}
              activities={recentActivity}
            />
          </Box>
        </Box>
      </Fade>
    );

  if (isHydrating) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Helmet>
          <title>Dashboard | Kelmah</title>
        </Helmet>
        <Skeleton variant="text" width={250} height={40} sx={{ mb: 3 }} />
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={6} md={3} key={`dashboard-skeleton-${i}`}>
              <Skeleton
                variant="rounded"
                height={120}
                sx={{ borderRadius: 2 }}
              />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rounded" height={300} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rounded" height={300} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
        {loadingTimeout && (
          <Alert
            severity="warning"
            sx={{ mt: 3, maxWidth: 520 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                Refresh
              </Button>
            }
          >
            Loading is taking longer than expected. Please check your connection
            or try refreshing the page.
          </Alert>
        )}
      </Container>
    );
  }

  return (
    <PageCanvas
      disableContainer
      sx={{
        pt: { xs: 0.5, md: 4 },
        pb: { xs: withBottomNavSafeArea(24), md: 6 },
        overflowX: 'clip',
      }}
    >
      <PullToRefresh onRefresh={() => fetchDashboardData('manual-refresh')}>
        <Grow in timeout={500}>
          <Box>
            {/* SEO & Document Title */}
            <Helmet>
              <title>Dashboard | Kelmah</title>
            </Helmet>
            {/* Minimal Top Bar - shows live-state and last sync context */}
            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                justifyContent: 'flex-end',
                px: { xs: 2, md: 4 },
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* DASH-001: Auto-refresh indicator */}
                <Tooltip
                  title={
                    autoRefreshEnabled
                      ? 'Auto-refresh enabled (every 60s)'
                      : 'Auto-refresh disabled'
                  }
                  arrow
                >
                  <Chip
                    size="small"
                    label={autoRefreshEnabled ? 'Live' : 'Paused'}
                    color={autoRefreshEnabled ? 'success' : 'default'}
                    variant="outlined"
                    onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                    sx={{
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      minHeight: TOUCH_TARGET_MIN,
                      '& .MuiChip-label': { px: 1.25 },
                    }}
                  />
                </Tooltip>
                <Tooltip title="Refresh Dashboard" arrow>
                  <IconButton
                    onClick={handleRefresh}
                    disabled={refreshing}
                    aria-label="Refresh dashboard data"
                    sx={{
                      minWidth: TOUCH_TARGET_MIN,
                      minHeight: TOUCH_TARGET_MIN,
                      color: 'text.secondary',
                      '&:focus-visible': {
                        outline: '3px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: '2px',
                      },
                    }}
                  >
                    <RefreshIcon
                      sx={{
                        animation: refreshing
                          ? 'spin 1s linear infinite'
                          : 'none',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' },
                        },
                      }}
                    />
                  </IconButton>
                </Tooltip>
                <Box sx={{ minWidth: 120, textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">
                    {timeSinceRefresh}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block' }}
                  >
                    Last sync {lastRefreshedClockLabel}
                  </Typography>
                </Box>
              </Box>
            </Box>
            {/* Main Content (full-width container) */}
            <Container
              maxWidth="xl"
              sx={{
                py: { xs: 1.5, md: 4 },
                px: { xs: 0.5, sm: 3, md: 4 },
                color: 'text.primary',
                width: '100%',
                minWidth: 0,
              }}
            >
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              {partialLoadWarning && (
                <Alert
                  severity="warning"
                  sx={{ mb: 3 }}
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={handleRefresh}
                      disabled={refreshing}
                    >
                      Refresh
                    </Button>
                  }
                >
                  {partialLoadWarning} Last reliable sync: {lastRefreshedClockLabel}.
                </Alert>
              )}
              {/* Dashboard Overview - Direct content without tabs (navigation via sidebar) */}
              <Box sx={{ mt: 1 }}>{renderDashboardOverview()}</Box>
            </Container>
            {/* Floating Quick Actions */}
            {/* SpeedDial - offset for mobile bottom nav */}
            <SpeedDial
              ariaLabel="Quick Actions"
              sx={{
                display: { xs: 'none', sm: 'flex' },
                position: 'fixed',
                bottom: {
                  xs: withBottomNavSafeArea(12),
                  md: 32,
                },
                right: { xs: 16, md: 32 },
                zIndex: 1100,
              }}
              icon={<SpeedDialIcon openIcon={<AddIcon />} />}
            >
              <SpeedDialAction
                icon={<AddIcon />}
                tooltipTitle="Post New Job"
                onClick={() => navigate('/hirer/jobs/post')}
              />
              <SpeedDialAction
                icon={<PeopleIcon />}
                tooltipTitle="Find Talent"
                onClick={() => navigate('/hirer/find-talents')}
              />
              <SpeedDialAction
                icon={<MessageIcon />}
                tooltipTitle="Messages"
                onClick={() => navigate('/messages')}
              />
              <SpeedDialAction
                icon={<PaymentIcon />}
                tooltipTitle="Payments"
                onClick={() => navigate('/hirer/payments')}
              />
            </SpeedDial>

          </Box>
        </Grow>
      </PullToRefresh>
    </PageCanvas>
  );
};

export default HirerDashboardPage;
