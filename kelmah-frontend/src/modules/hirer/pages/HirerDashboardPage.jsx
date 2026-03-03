import React, { useState, useEffect, useCallback, useRef } from 'react';
import PullToRefresh from '../../../components/common/PullToRefresh';
import {
  Box,
  Container,
  Grid,
  Paper,
  ButtonBase,
  Typography,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress,
  useTheme,
  useMediaQuery,
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
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  PostAdd as PostAddIcon,
  HelpOutline as HelpOutlineIcon,
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
  selectHirerJobs,
  selectHirerApplications,
  selectHirerPendingProposalCount,
  selectHirerError,
} from '../services/hirerSlice';
import RecentActivityFeed from '../components/RecentActivityFeed';

/* ---------- Extracted sub-component (stable reference) ---------- */
const LoadingOverviewSkeleton = () => (
  <Grid container spacing={{ xs: 1.5, sm: 3, md: 2.5, lg: 2 }}>
    {[...Array(4)].map((_, i) => (
      <Grid item xs={6} sm={6} md={3} key={i}>
        <Skeleton variant="rounded" height={180} animation="wave" />
      </Grid>
    ))}
  </Grid>
);

const DASHBOARD_LOADING_TIMEOUT_MS = 10000;
const APPLICATION_REFRESH_TTL_MS = 2 * 60 * 1000; // 2 minutes
const AUTO_REFRESH_INTERVAL_MS = 60 * 1000; // DASH-001: Auto-refresh every 60 seconds

const HirerDashboardPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true); // DASH-001: Auto-refresh state
  const [timeSinceRefresh, setTimeSinceRefresh] = useState('Just now'); // DASH-001: Human-readable time

  const timeoutRef = useRef(null);
  const fetchPromiseRef = useRef(null);
  const isMountedRef = useRef(true);
  const applicationRecordsRef = useRef({});
  const autoRefreshRef = useRef(null); // DASH-001: Auto-refresh interval ref

  // Get data from Redux store using selectors
  const user = useSelector((state) => state.auth.user);
  const hirerProfile = useSelector((state) => state.hirer.profile);
  const activeJobs = useSelector(selectHirerJobs('active'));
  const completedJobs = useSelector(selectHirerJobs('completed'));
  const applicationRecords = useSelector(selectHirerApplications);
  const totalPendingProposals = useSelector(selectHirerPendingProposalCount);
  const payments = useSelector((state) => state.hirer.payments);
  const storeError = useSelector(selectHirerError('profile'));
  const jobsError = useSelector(selectHirerError('jobs'));
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

        const fetchPromises = [
          dispatch(fetchHirerProfile()).unwrap(),
          dispatch(fetchHirerJobs('active')).unwrap(),
          dispatch(fetchHirerJobs('completed')).unwrap(),
        ];

        fetchPromiseRef.current = Promise.all(fetchPromises);
        const [, activePayload] = await fetchPromiseRef.current;

        if (!isMountedRef.current) {
          return;
        }

        clearLoadingTimeout();
        setLoadingTimeout(false);

        const activeList = Array.isArray(activePayload?.jobs)
          ? activePayload.jobs
          : Array.isArray(activePayload)
            ? activePayload
            : [];

        const jobIdsToHydrate = getJobsRequiringApplications(activeList);
        if (jobIdsToHydrate.length > 0) {
          await Promise.allSettled(
            jobIdsToHydrate.map((jobId) =>
              dispatch(
                fetchJobApplications({
                  jobId,
                  status: 'pending',
                }),
              ).unwrap(),
            ),
          );
        }
      } catch (err) {
        // Error captured in state — no console logging in production
        if (!isMountedRef.current) {
          return;
        }
        clearLoadingTimeout();
        setLoadingTimeout(false);
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
    } catch (err) {
      // Error captured in state — no console logging in production
      setError('Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  // DASH-001: Auto-refresh interval for real-time updates
  useEffect(() => {
    if (!autoRefreshEnabled || isHydrating) {
      return;
    }

    autoRefreshRef.current = setInterval(async () => {
      if (!isMountedRef.current || refreshing) {
        return;
      }

      try {
        // Silent background refresh
        await dispatch(fetchHirerJobs('active')).unwrap();
        setLastRefreshed(Date.now());
        setTimeSinceRefresh('Just now');
      } catch (err) {
        // Silent failure on background refresh — intentional
        // Don't show error for background refresh failures
      }
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [autoRefreshEnabled, isHydrating, dispatch, refreshing]);

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
    summaryData.activeJobs === 0 &&
    (summaryData.activeWorkers?.length || 0) === 0 &&
    (summaryData.totalSpent || 0) === 0;

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // LC Portal-inspired Dashboard Overview - IMPROVED with empty state CTAs
  const renderDashboardOverview = () => (
    <Fade in timeout={500}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100dvh', p: { xs: 1.5, sm: 2, md: 3 }, overflowX: 'hidden' }}>
        {/* Breadcrumb - LC Portal Style */}
        <Breadcrumbs sx={{ mb: 3, display: { xs: 'none', md: 'flex' } }} aria-label="breadcrumb">
          <MUILink
            component={RouterLink}
            to="/"
            underline="hover"
            sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            Home
          </MUILink>
          <Typography color="text.primary">Dashboard</Typography>
        </Breadcrumbs>

        {/* SIMPLE GREETING - LC Portal Style */}
        <Typography
          variant="h4"
          sx={{
            mb: 4,
            color: 'text.primary',
            fontWeight: 400,
            fontSize: { xs: '1.5rem', md: '2rem' },
          }}
        >
          {getGreeting()}, {hirerProfile?.firstName || user?.firstName || 'there'}
        </Typography>

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
              Get started by posting your first job to connect with skilled workers in your area.
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

        {/* 4 METRIC CARDS IN ONE ROW - LC Portal Style with Click Actions */}
        <Grid container spacing={{ xs: 1.5, sm: 3, md: 2.5, lg: 2 }} sx={{ mb: 4 }}>
          {/* Card 1 - Orange/Yellow - Active Jobs */}
          <Grid item xs={6} sm={6} md={3}>
            <ButtonBase
              onClick={() => navigate('/hirer/jobs')}
              aria-label={`Active Jobs: ${summaryData.activeJobs}. Click to view jobs.`}
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
                p: { xs: 1.5, sm: 2.5 },
                borderRadius: 2,
                backgroundColor: 'background.paper',
                color: 'text.primary',
                border: '1px solid',
                borderColor: alpha('#F39C12', 0.45),
                height: { xs: 72, sm: 130 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                '@media (hover: hover)': {
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(243, 156, 18, 0.3)',
                  },
                },
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ color: 'text.secondary', mb: 0.5 }}>
                  Active Jobs
                </Typography>
                <Typography variant="h3" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                  {summaryData.activeJobs}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                  {summaryData.activeJobs === 0 ? 'Post a job to get started' : 'Click to manage'}
                </Typography>
              </Box>
              <Box sx={{ position: 'absolute', right: { xs: 8, sm: 16 }, top: '50%', transform: 'translateY(-50%)' }}>
                <WorkIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: alpha('#F39C12', 0.28) }} />
              </Box>
            </Paper>
            </ButtonBase>
          </Grid>

          {/* Card 2 - Teal/Green - Completed Jobs */}
          <Grid item xs={6} sm={6} md={3}>
            <ButtonBase
              onClick={() => navigate('/hirer/jobs')}
              aria-label={`Completed Jobs: ${summaryData.completedJobs}. Click to view progress.`}
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
                p: { xs: 1.5, sm: 2.5 },
                borderRadius: 2,
                backgroundColor: 'background.paper',
                color: 'text.primary',
                border: '1px solid',
                borderColor: alpha('#1ABC9C', 0.45),
                height: { xs: 72, sm: 130 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                '@media (hover: hover)': {
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(26, 188, 156, 0.3)',
                  },
                },
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ color: 'text.secondary', mb: 0.5 }}>
                  Completed Jobs
                </Typography>
                <Typography variant="h3" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                  {summaryData.completedJobs}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                  Click to view progress
                </Typography>
              </Box>
              <Box sx={{ position: 'absolute', right: { xs: 8, sm: 16 }, top: '50%', transform: 'translateY(-50%)' }}>
                <CheckCircleIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: alpha('#1ABC9C', 0.28) }} />
              </Box>
            </Paper>
            </ButtonBase>
          </Grid>

          {/* Card 3 - Blue - Applications */}
          <Grid item xs={6} sm={6} md={3}>
            <ButtonBase
              onClick={() => navigate('/hirer/applications')}
              aria-label={`Applications: ${summaryData.pendingProposals}. Click to review applications.`}
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
                p: { xs: 1.5, sm: 2.5 },
                borderRadius: 2,
                backgroundColor: 'background.paper',
                color: 'text.primary',
                border: '1px solid',
                borderColor: alpha('#3498DB', 0.45),
                height: { xs: 72, sm: 130 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                '@media (hover: hover)': {
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(52, 152, 219, 0.3)',
                  },
                },
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ color: 'text.secondary', mb: 0.5 }}>
                  Applications
                </Typography>
                <Typography variant="h3" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                  {summaryData.pendingProposals}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                  {summaryData.pendingProposals === 0 ? 'No pending reviews' : 'Click to review'}
                </Typography>
              </Box>
              <Box sx={{ position: 'absolute', right: { xs: 8, sm: 16 }, top: '50%', transform: 'translateY(-50%)' }}>
                <ProposalIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: alpha('#3498DB', 0.28) }} />
              </Box>
            </Paper>
            </ButtonBase>
          </Grid>

          {/* Card 4 - Red - Needs Attention */}
          <Grid item xs={6} sm={6} md={3}>
            <ButtonBase
              onClick={() => navigate('/hirer/payments')}
              aria-label={`Needs Attention: ${summaryData.pendingPayments}. Click to view payments.`}
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
                p: { xs: 1.5, sm: 2.5 },
                borderRadius: 2,
                backgroundColor: 'background.paper',
                color: 'text.primary',
                border: '1px solid',
                borderColor: alpha('#E74C3C', 0.45),
                height: { xs: 72, sm: 130 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                '@media (hover: hover)': {
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(231, 76, 60, 0.3)',
                  },
                },
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ color: 'text.secondary', mb: 0.5 }}>
                  Needs Attention
                </Typography>
                <Typography variant="h3" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                  {summaryData.pendingPayments}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                  {summaryData.pendingPayments === 0 ? 'All clear!' : 'Click to resolve'}
                </Typography>
              </Box>
              <Box sx={{ position: 'absolute', right: { xs: 8, sm: 16 }, top: '50%', transform: 'translateY(-50%)' }}>
                <HelpOutlineIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: alpha('#E74C3C', 0.28) }} />
              </Box>
            </Paper>
            </ButtonBase>
          </Grid>
        </Grid>

        {/* TWO CHART SECTIONS - LC Portal Style */}
        <Grid container spacing={{ xs: 1.5, sm: 3, md: 2.5, lg: 2 }}>
          {/* Bills Chart / Spending Chart */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2, md: 3 },
                borderRadius: 2,
                bgcolor: 'background.paper',
                height: { xs: 280, sm: 350 },
              }}
            >
              <Typography variant="h6" fontWeight={600} sx={{ mb: { xs: 1.5, sm: 3 }, color: 'text.primary', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Jobs Overview
              </Typography>
              {/* Recharts BarChart replacing manual Box bars */}
              <Box sx={{ height: 250, width: '100%' }}>
                {summaryData.totalSpent > 0 || summaryData.completedJobs > 0 || summaryData.activeJobs > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Completed', value: summaryData.completedJobs },
                        { name: 'Active', value: summaryData.activeJobs },
                      ]}
                      margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
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
                          { name: 'Completed', fill: '#4CAF50' },
                          { name: 'Active', fill: '#D4AF37' },
                        ].map((entry, index) => (
                          <RechartsCell key={`bar-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="body2" color="text.secondary">
                      No spending data yet
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
                p: { xs: 1.5, sm: 2, md: 3 },
                borderRadius: 2,
                bgcolor: 'background.paper',
                height: { xs: 280, sm: 350 },
              }}
            >
              <Typography variant="h6" fontWeight={600} sx={{ mb: { xs: 1.5, sm: 3 }, color: 'text.primary', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Applications Overview
              </Typography>
              {(() => {
                const appDonutData = [
                  { name: 'Completed', value: summaryData.completedJobs, color: '#4CAF50' },
                  { name: 'Submitted', value: summaryData.pendingProposals, color: '#2196F3' },
                  { name: 'Pending', value: summaryData.pendingPayments, color: '#F44336' },
                ].filter(d => d.value > 0);
                const appTotal = summaryData.activeJobs + summaryData.completedJobs;

                return (
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, height: { xs: 'auto', sm: 250 }, alignItems: 'center' }}>
                    {/* Legend */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center', pr: { xs: 0, sm: 4 }, pb: { xs: 2, sm: 0 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#4CAF50' }} />
                        <Typography variant="body2">Completed: {summaryData.completedJobs}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#2196F3' }} />
                        <Typography variant="body2">Submitted: {summaryData.pendingProposals}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#F44336' }} />
                        <Typography variant="body2">Pending: {summaryData.pendingPayments}</Typography>
                      </Box>
                    </Box>
                    {/* Donut Chart */}
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: { xs: 160, sm: 220 } }}>
                      {appDonutData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie
                              data={appDonutData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={85}
                              paddingAngle={2}
                              stroke="none"
                            >
                              {appDonutData.map((entry, idx) => (
                                <RechartsCell key={`app-cell-${idx}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                              formatter={(value, name) => [`${value}`, name]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box sx={{ width: 170, height: 170, borderRadius: '50%', bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="body2" color="text.secondary">No data</Typography>
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
                            fontSize: { xs: '1.25rem', sm: '2rem' },
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
        <Box sx={{ mt: { xs: 2, sm: 3 } }}>
          <RecentActivityFeed
            jobs={activeJobs || []}
            applications={applicationRecords || {}}
          />
        </Box>
      </Box>
    </Fade>
  );

  if (isHydrating) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Helmet>
          <title>Dashboard | Kelmah</title>
        </Helmet>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <CircularProgress sx={{ color: '#D4AF37' }} />
          <Box textAlign="center">
            <Typography variant="h6" color="text.primary" gutterBottom>
              Loading your dashboard...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Just a moment.
            </Typography>
          </Box>
          <Box sx={{ width: '100%' }}>
            <LoadingOverviewSkeleton />
          </Box>
          {loadingTimeout && (
            <Alert
              severity="warning"
              sx={{ mt: 1, maxWidth: 520 }}
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
              Loading is taking longer than expected. Please check your
              connection or try refreshing the page.
            </Alert>
          )}
        </Box>
      </Container>
    );
  }

  return (
    <PullToRefresh onRefresh={() => fetchDashboardData('manual-refresh')}>
    <Grow in timeout={500}>
      <Box>
        {/* SEO & Document Title */}
        <Helmet>
          <title>Dashboard | Kelmah</title>
        </Helmet>
        {/* Minimal Top Bar - Only shows last updated time */}
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
            <Tooltip title={autoRefreshEnabled ? 'Auto-refresh enabled (every 60s)' : 'Auto-refresh disabled'} arrow>
              <Chip
                size="small"
                label={autoRefreshEnabled ? 'Live' : 'Paused'}
                color={autoRefreshEnabled ? 'success' : 'default'}
                variant="outlined"
                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                sx={{
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  height: 24,
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            </Tooltip>
            <Tooltip title="Refresh Dashboard" arrow>
              <IconButton
                onClick={handleRefresh}
                size="small"
                disabled={refreshing}
                aria-label="Refresh dashboard data"
                sx={{ color: 'text.secondary' }}
              >
                <RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
              </IconButton>
            </Tooltip>
            {/* DASH-001: Human-readable time since refresh */}
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
              {timeSinceRefresh}
            </Typography>
          </Box>
        </Box>
        {/* Main Content (full-width container) */}
        <Container
          maxWidth="xl"
          sx={{
            py: 4,
            px: { xs: 2, sm: 3, md: 4 },
            bgcolor: 'background.default',
            color: 'text.primary',
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          {/* Dashboard Overview - Direct content without tabs (navigation via sidebar) */}
          <Box sx={{ mt: 1 }}>
            {isHydrating ? (
              <LoadingOverviewSkeleton />
            ) : (
              renderDashboardOverview()
            )}
          </Box>
        </Container>
        {/* Floating Quick Actions */}
        {/* SpeedDial - offset for mobile bottom nav */}
        <SpeedDial
          ariaLabel="Quick Actions"
          sx={{
            position: 'fixed',
            bottom: { xs: 80, md: 32 },
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
            onClick={() => navigate('/hirer/find-talent')}
          />
          <SpeedDialAction
            icon={<MessageIcon />}
            tooltipTitle="Messages"
            onClick={() => navigate('/messages')}
          />
          <SpeedDialAction
            icon={<PaymentIcon />}
            tooltipTitle="Payments"
            onClick={() => navigate('/payments')}
          />
        </SpeedDial>
      </Box>
    </Grow>
    </PullToRefresh>
  );
};

export default HirerDashboardPage;
