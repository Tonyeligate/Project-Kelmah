import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  LinearProgress,
  Rating,
  useTheme,
  useMediaQuery,
  Stack,
  Fade,
  Grow,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Breadcrumbs,
  Link as MUILink,
  Skeleton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Work as WorkIcon,
  Payment as PaymentIcon,
  Assignment as ProposalIcon,
  Assessment as ProgressIcon,
  Star as ReviewIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Search as SearchIcon,
  ArrowForward as ArrowForwardIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  AddCircle as AddCircleIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import {
  fetchHirerProfile,
  fetchHirerJobs,
  fetchJobApplications,
  selectHirerJobs,
  selectHirerError,
} from '../services/hirerSlice';
import { selectUnreadCount } from '../../notifications/services/notificationSlice';

// Import all hirer components
import HirerJobManagement from '../components/HirerJobManagement';
import PaymentRelease from '../components/PaymentRelease';
import ProposalReview from '../components/ProposalReview';
import JobProgressTracker from '../components/JobProgressTracker';
import WorkerReview from '../components/WorkerReview';
import WorkerSearch from '../components/WorkerSearch';

// Custom styled components
const StyledTab = ({ icon, label, ...props }) => (
  <Tab
    icon={icon}
    label={label}
    sx={{
      minHeight: 72,
      color: 'text.secondary',
      '&.Mui-selected': {
        color: 'secondary.main',
        fontWeight: 600,
      },
      '& .MuiTab-iconWrapper': {
        marginBottom: 0.5,
      },
      textTransform: 'none',
      fontSize: '0.9rem',
      transition: 'all 0.3s ease',
    }}
    {...props}
  />
);

StyledTab.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.node,
};

// TabPanel component for tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`hirer-dashboard-tabpanel-${index}`}
      aria-labelledby={`hirer-dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Paper
          elevation={2}
          sx={{
            p: 3,
            mt: 2,
            bgcolor: 'background.paper',
          }}
        >
          {children}
        </Paper>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  value: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
};

// Enhanced dashboard card component
const DashboardCard = ({
  icon,
  iconColor,
  title,
  value,
  secondaryLabel,
  secondaryValue,
  secondaryComponent,
  actionText,
  actionIcon,
  actionHandler,
  actionColor = 'primary',
  ...props
}) => {
  return (
    <Card
      elevation={3}
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'visible',
        borderRadius: 3,
        backgroundColor: 'background.paper',
        borderLeft: '4px solid ' + iconColor,
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 12px 20px rgba(0,0,0,0.15)',
        },
        ...props.sx,
      }}
      {...props}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          left: 20,
          width: 60,
          height: 60,
          borderRadius: '50%',
          bgcolor: iconColor || 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.2)',
          border: '4px solid #1a1a1a',
          zIndex: 1,
        }}
      >
        {icon}
      </Box>
      <CardContent sx={{ pt: 6, pb: 3, px: 3 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h3" fontWeight={700} sx={{ mb: 2 }}>
          {value}
        </Typography>

        {(secondaryLabel || secondaryComponent) && (
          <Box sx={{ mt: 2, mb: 2 }}>
            {secondaryLabel && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {secondaryLabel}
              </Typography>
            )}
            {secondaryComponent || (
              <Typography variant="h6" fontWeight={600}>
                {secondaryValue}
              </Typography>
            )}
          </Box>
        )}

        {actionText && (
          <Button
            variant="contained"
            color={actionColor}
            endIcon={actionIcon || <ArrowForwardIcon />}
            onClick={actionHandler}
            sx={{ mt: 2, width: '100%', borderRadius: 2 }}
          >
            {actionText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

DashboardCard.propTypes = {
  icon: PropTypes.node,
  iconColor: PropTypes.string,
  title: PropTypes.node,
  value: PropTypes.node,
  secondaryLabel: PropTypes.node,
  secondaryValue: PropTypes.node,
  secondaryComponent: PropTypes.node,
  actionText: PropTypes.node,
  actionIcon: PropTypes.node,
  actionHandler: PropTypes.func,
  actionColor: PropTypes.string,
  sx: PropTypes.object,
};

const StyledPaper = ({ children, elevation = 3, ...props }) => (
  <Paper
    elevation={elevation}
    sx={{
      borderRadius: 3,
      overflow: 'hidden',
      ...props.sx,
    }}
    {...props}
  >
    {children}
  </Paper>
);

StyledPaper.propTypes = {
  children: PropTypes.node,
  elevation: PropTypes.number,
  sx: PropTypes.object,
};

const DASHBOARD_LOADING_TIMEOUT_MS = 10000;

const HirerDashboardPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);

  const timeoutRef = useRef(null);
  const fetchPromiseRef = useRef(null);
  const isMountedRef = useRef(true);

  // Get data from Redux store using selectors
  const user = useSelector((state) => state.auth.user);
  const hirerProfile = useSelector((state) => state.hirer.profile);
  const activeJobs = useSelector(selectHirerJobs('active'));
  const completedJobs = useSelector(selectHirerJobs('completed'));
  const applications = useSelector((state) => state.hirer.applications);
  const payments = useSelector((state) => state.hirer.payments);
  const storeError = useSelector(selectHirerError('profile'));
  const jobsError = useSelector(selectHirerError('jobs'));
  const unreadNotifications = useSelector(selectUnreadCount);

  // Summary skeleton for overview while data loads
  const LoadingOverviewSkeleton = () => (
    <Grid container spacing={3}>
      {[...Array(4)].map((_, i) => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <Skeleton variant="rounded" height={180} animation="wave" />
        </Grid>
      ))}
    </Grid>
  );

  // Fetch hirer data on component mount
  const clearLoadingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

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

        // ⏱️ Add small delay to ensure auth token is stored and axios interceptors are ready
        await new Promise((resolve) => setTimeout(resolve, 100));

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

        if (activeList.length > 0) {
          await Promise.allSettled(
            activeList.map((job) =>
              dispatch(
                fetchJobApplications({
                  jobId: job.id || job._id,
                  status: 'pending',
                }),
              ).unwrap(),
            ),
          );
        }
      } catch (err) {
        console.error('Error fetching hirer data:', err);
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
        fetchPromiseRef.current = null;
      }
    },
    [clearLoadingTimeout, dispatch],
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
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  // Handler for tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);

    if (newValue === 1) {
      dispatch(fetchHirerJobs('active'));
    } else if (newValue === 2) {
      dispatch(fetchHirerJobs('completed'));
    }
  };

  // Calculate total pending proposals
  const totalPendingProposals = Object.values(applications).reduce(
    (total, jobApplications) => {
      return total + (jobApplications.pending?.length || 0);
    },
    0,
  );

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

  // Dashboard overview component
  const renderDashboardOverview = () => (
    <Fade in timeout={500}>
      <Grid container spacing={3}>
        {/* Welcome banner with stats */}
        <Grid item xs={12}>
          <Paper
            elevation={4}
            sx={{
              p: { xs: 2, md: 4 },
              textAlign: { xs: 'center', md: 'left' },
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 2,
              mb: 4,
              border: '1px solid rgba(255,215,0,0.2)',
              boxShadow:
                '0 15px 35px rgba(0,0,0,0.15), 0 5px 15px rgba(0,0,0,0.1)',
              position: 'relative',
              overflow: 'hidden',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage:
                  'radial-gradient(circle at 20% 30%, rgba(255,215,0,0.07) 0%, transparent 60%)',
                zIndex: 0,
              },
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: { xs: 'center', md: 'center' },
                  justifyContent: { xs: 'center', md: 'space-between' },
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="h3"
                    gutterBottom
                    fontWeight={700}
                    sx={{
                      color: '#FFD700',
                      textShadow: '0px 2px 4px rgba(0,0,0,0.4)',
                      fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
                    }}
                  >
                    Welcome back,{' '}
                    {hirerProfile?.firstName || user?.firstName || 'Hirer'}!
                  </Typography>
                  <Typography
                    variant="h6"
                    color="white"
                    sx={{
                      opacity: 0.9,
                      fontWeight: 400,
                      maxWidth: '90%',
                      lineHeight: 1.5,
                    }}
                  >
                    Manage your jobs, review proposals, and track progress
                  </Typography>
                </Box>

                {/* Stats summary */}
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                    '&::-webkit-scrollbar': { display: 'none' },
                    flexWrap: { xs: 'nowrap', sm: 'wrap' },
                    justifyContent: { xs: 'flex-start', md: 'flex-end' },
                    width: '100%',
                    mt: { xs: 2, md: 0 },
                    py: { xs: 1, md: 0 },
                    px: { xs: 1, md: 0 },
                  }}
                >
                  <Box
                    sx={{
                      scrollSnapAlign: 'start',
                      textAlign: 'center',
                      px: 3,
                      py: 1.5,
                      borderRadius: 3,
                      bgcolor: 'rgba(255,215,0,0.1)',
                      border: '1px solid rgba(255,215,0,0.3)',
                      minWidth: 120,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                      },
                    }}
                  >
                    <Typography
                      variant="h4"
                      fontWeight={700}
                      color="secondary.main"
                    >
                      {summaryData.activeJobs}
                    </Typography>
                    <Typography variant="subtitle2" color="text.primary">
                      Active Jobs
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      scrollSnapAlign: 'start',
                      textAlign: 'center',
                      px: 3,
                      py: 1.5,
                      borderRadius: 3,
                      bgcolor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      minWidth: 120,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                      },
                    }}
                  >
                    <Typography
                      variant="h4"
                      fontWeight={700}
                      color="text.primary"
                    >
                      {summaryData.activeWorkers?.length || 0}
                    </Typography>
                    <Typography variant="subtitle2" color="text.primary">
                      Active Workers
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      scrollSnapAlign: 'start',
                      textAlign: 'center',
                      px: 3,
                      py: 1.5,
                      borderRadius: 3,
                      bgcolor: 'rgba(76,175,80,0.05)',
                      border: '1px solid rgba(76,175,80,0.3)',
                      minWidth: 120,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                      },
                    }}
                  >
                    <Typography
                      variant="h4"
                      fontWeight={700}
                      color="success.main"
                    >
                      ${summaryData.totalSpent?.toLocaleString() || 0}
                    </Typography>
                    <Typography variant="subtitle2" color="text.primary">
                      Total Spent
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {isNewHirer && (
          <Grid item xs={12}>
            <StyledPaper
              elevation={4}
              sx={{
                p: { xs: 3, md: 4 },
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 3,
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,215,0,0.25)',
              }}
            >
              <Box sx={{ maxWidth: 520 }}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Ready to make your first hire?
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Post a detailed job to attract skilled workers or browse the
                  talent pool to invite top professionals.
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                  <Chip
                    label="Tip: Include timeline and budget for stronger matches"
                    color="secondary"
                    variant="outlined"
                  />
                </Stack>
              </Box>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ width: { xs: '100%', md: 'auto' } }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddCircleIcon />}
                  onClick={() => navigate('/hirer/jobs/post')}
                  sx={{ minWidth: 200 }}
                >
                  Post Your First Job
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<SearchIcon />}
                  onClick={() => navigate('/hirer/find-talent')}
                  sx={{ minWidth: 200 }}
                >
                  Find Talented Workers
                </Button>
              </Stack>
            </StyledPaper>
          </Grid>
        )}

        {/* Summary cards */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* Active Jobs Card */}
            <Grid item xs={12} sm={6}>
              <DashboardCard
                icon={
                  <WorkIcon
                    sx={{ fontSize: 30, color: 'primary.contrastText' }}
                  />
                }
                iconColor="primary.main"
                title="Active Jobs"
                value={summaryData.activeJobs}
                secondaryLabel="Pending applications"
                secondaryComponent={
                  <Box sx={{ display: 'flex', alignItems: 'space-between' }}>
                    <Typography variant="h6" fontWeight={600}>
                      {summaryData.pendingProposals}
                    </Typography>
                    <Chip
                      label="Waiting for review"
                      size="small"
                      color="warning"
                      sx={{ borderRadius: 1.5 }}
                    />
                  </Box>
                }
                actionText="Manage Jobs"
                actionHandler={() => setTabValue(1)}
              />
            </Grid>

            {/* Completed Jobs Card */}
            <Grid item xs={12} sm={6}>
              <DashboardCard
                icon={
                  <CheckCircleIcon
                    sx={{ fontSize: 30, color: 'success.contrastText' }}
                  />
                }
                iconColor="success.main"
                title="Completed Jobs"
                value={completedJobs?.length || 0}
                secondaryLabel="Success rate"
                secondaryComponent={
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Box sx={{ flexGrow: 1, mr: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={hirerProfile?.completionRate || 100}
                        color="success"
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'rgba(76,175,80,0.1)',
                        }}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="success.main"
                    >
                      {hirerProfile?.completionRate || 100}%
                    </Typography>
                  </Box>
                }
                actionText="View History"
                actionColor="success"
                actionHandler={() => setTabValue(2)}
              />
            </Grid>

            {/* Worker Management Card */}
            <Grid item xs={12} sm={6}>
              <DashboardCard
                icon={
                  <PeopleIcon
                    sx={{ fontSize: 30, color: 'secondary.contrastText' }}
                  />
                }
                iconColor="secondary.main"
                title="Worker Management"
                value={hirerProfile?.activeWorkers?.length || 0}
                secondaryLabel="Average worker rating"
                secondaryComponent={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Rating
                      value={hirerProfile?.averageWorkerRating || 0}
                      readOnly
                      precision={0.5}
                      size="medium"
                      sx={{ color: '#FFD700' }}
                    />
                    <Typography variant="body1" fontWeight={600} sx={{ ml: 1 }}>
                      {hirerProfile?.averageWorkerRating?.toFixed(1) || 0}
                    </Typography>
                  </Box>
                }
                actionText="Manage Workers"
                actionColor="secondary"
                actionHandler={() => setTabValue(3)}
              />
            </Grid>

            {/* Financial Overview Card */}
            <Grid item xs={12} sm={6}>
              <DashboardCard
                icon={<PaymentIcon sx={{ fontSize: 30, color: 'white' }} />}
                iconColor="info.main"
                title="Financial Overview"
                value={
                  <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                    <Box component="span" sx={{ fontSize: '1.5rem', mr: 0.5 }}>
                      $
                    </Box>
                    {hirerProfile?.totalSpent?.toLocaleString() || 0}
                  </Box>
                }
                secondaryLabel="Current budget"
                secondaryValue={
                  <Typography variant="h6" fontWeight={600} color="info.main">
                    ${hirerProfile?.currentBudget?.toLocaleString() || 0}{' '}
                    available
                  </Typography>
                }
                actionText="Financial Reports"
                actionColor="info"
                actionHandler={() => setTabValue(4)}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Recent activity and notifications */}
        <Grid item xs={12} md={4}>
          <StyledPaper elevation={3} sx={{ height: '100%' }}>
            <CardContent
              sx={{
                p: 0,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box
                sx={{
                  bgcolor: 'background.dark',
                  color: 'white',
                  py: 2,
                  px: 3,
                  background:
                    'linear-gradient(90deg, #1a1a1a 0%, #222222 100%)',
                  borderBottom: '1px solid rgba(255,215,0,0.2)',
                }}
              >
                <Typography variant="h6" fontWeight={600}>
                  Recent Activity
                </Typography>
              </Box>
              <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <List sx={{ py: 0 }}>
                  {hirerProfile?.recentActivity &&
                  hirerProfile.recentActivity.length > 0 ? (
                    hirerProfile.recentActivity
                      .slice(0, 5)
                      .map((activity, index) => (
                        <React.Fragment key={index}>
                          <ListItem
                            alignItems="flex-start"
                            sx={{
                              px: 3,
                              py: 2,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: 'rgba(255,215,0,0.03)',
                              },
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar
                                sx={{
                                  bgcolor:
                                    activity.type === 'job_posted'
                                      ? 'primary.main'
                                      : activity.type === 'worker_hired'
                                        ? 'secondary.main'
                                        : activity.type === 'payment'
                                          ? 'success.main'
                                          : 'info.main',
                                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                }}
                              >
                                {activity.type === 'job_posted' ? (
                                  <WorkIcon />
                                ) : activity.type === 'worker_hired' ? (
                                  <PeopleIcon />
                                ) : activity.type === 'payment' ? (
                                  <PaymentIcon />
                                ) : (
                                  <NotificationsIcon />
                                )}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography
                                  variant="subtitle1"
                                  fontWeight={600}
                                >
                                  {activity.title}
                                </Typography>
                              }
                              secondary={
                                <React.Fragment>
                                  <Typography
                                    sx={{ display: 'block', mt: 0.5, mb: 0.5 }}
                                    component="span"
                                    variant="body2"
                                    color="text.primary"
                                  >
                                    {activity.description}
                                  </Typography>
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {new Date(activity.date).toLocaleDateString(
                                      'en-US',
                                      {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      },
                                    )}
                                  </Typography>
                                </React.Fragment>
                              }
                            />
                          </ListItem>
                          {index <
                            hirerProfile.recentActivity.slice(0, 5).length -
                              1 && (
                            <Divider component="li" sx={{ opacity: 0.6 }} />
                          )}
                        </React.Fragment>
                      ))
                  ) : (
                    <ListItem
                      sx={{
                        px: 3,
                        py: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <NotificationsIcon
                        sx={{
                          fontSize: 40,
                          color: 'text.disabled',
                          mb: 2,
                          opacity: 0.4,
                        }}
                      />
                      <ListItemText
                        primary={
                          <Typography
                            align="center"
                            variant="subtitle1"
                            color="text.secondary"
                            gutterBottom
                          >
                            No recent activity
                          </Typography>
                        }
                        secondary={
                          <Typography
                            align="center"
                            variant="body2"
                            color="text.disabled"
                          >
                            Your activities will appear here
                          </Typography>
                        }
                      />
                    </ListItem>
                  )}
                </List>
              </Box>
              <Box
                sx={{
                  p: 2,
                  textAlign: 'center',
                  borderTop: '1px solid rgba(0,0,0,0.05)',
                }}
              >
                <Button
                  startIcon={<NotificationsIcon />}
                  onClick={() => navigate('/notifications')}
                  variant="text"
                  color="secondary"
                  sx={{
                    py: 1,
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: 'rgba(255,215,0,0.05)',
                    },
                  }}
                >
                  View All Notifications
                  {unreadNotifications > 0 && (
                    <Badge
                      color="error"
                      badgeContent={unreadNotifications}
                      sx={{ ml: 1 }}
                    />
                  )}
                </Button>
              </Box>
            </CardContent>
          </StyledPaper>
        </Grid>
      </Grid>
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
          <CircularProgress sx={{ color: 'secondary.main' }} />
          <Box textAlign="center">
            <Typography variant="h6" color="text.primary" gutterBottom>
              Fetching your jobs, applications, and recent activity...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This usually takes about 2-3 seconds.
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
                  onClick={() => window.location.reload()}
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
    <Grow in timeout={500}>
      <Box>
        {/* SEO & Document Title */}
        <Helmet>
          <title>Dashboard | Kelmah</title>
        </Helmet>
        {/* Topbar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 4,
            py: 2,
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%)',
            boxShadow: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={user?.profileImage}
              alt={user?.firstName}
              sx={{
                width: 48,
                height: 48,
                bgcolor: 'primary.main',
                fontWeight: 700,
                boxShadow: 3,
              }}
            >
              {user?.firstName?.[0] || 'U'}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700} color="secondary.main">
                Welcome back, {user?.firstName || user?.name || 'Hirer'}!
              </Typography>
              <Typography variant="body2" color="text.primary">
                Here&apos;s your hirer dashboard. Manage your jobs and talent!
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Refresh Dashboard">
              <IconButton onClick={handleRefresh} color="secondary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              Last updated:{' '}
              {new Date(lastRefreshed).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>
            <Tooltip title="View Notifications">
              <IconButton
                onClick={() => navigate('/notifications')}
                color="secondary"
              >
                <Badge badgeContent={unreadNotifications} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        {/* Breadcrumbs */}
        <Breadcrumbs
          aria-label="breadcrumb"
          sx={{ px: 4, pt: 1, color: 'text.secondary' }}
        >
          <MUILink
            component={RouterLink}
            to="/"
            color="inherit"
            underline="hover"
          >
            Home
          </MUILink>
          <Typography color="text.primary">Dashboard</Typography>
        </Breadcrumbs>
        {/* Main Content (full-width container) */}
        <Container
          maxWidth={false}
          disableGutters
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
          {/* Tabs Navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant={isMobile ? 'scrollable' : 'fullWidth'}
              scrollButtons="auto"
              textColor="inherit"
              TabIndicatorProps={{ style: { backgroundColor: '#FFD700' } }}
            >
              <StyledTab icon={<DashboardIcon />} label="Overview" />
              <StyledTab icon={<WorkIcon />} label="Jobs" />
              <StyledTab
                icon={
                  <Badge
                    badgeContent={summaryData.pendingProposals}
                    color="warning"
                  >
                    <ProposalIcon />
                  </Badge>
                }
                label="Proposals"
              />
              <StyledTab
                icon={
                  <Badge
                    badgeContent={summaryData.pendingPayments}
                    color="info"
                  >
                    <PaymentIcon />
                  </Badge>
                }
                label="Payments"
              />
              <StyledTab icon={<ProgressIcon />} label="Progress" />
              <StyledTab icon={<ReviewIcon />} label="Reviews" />
              <StyledTab icon={<SearchIcon />} label="Find Talent" />
            </Tabs>
          </Box>
          {/* Tab Panels */}
          <TabPanel value={tabValue} index={0}>
            {isHydrating ? (
              <LoadingOverviewSkeleton />
            ) : (
              renderDashboardOverview()
            )}
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <HirerJobManagement />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <ProposalReview />
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            <PaymentRelease />
          </TabPanel>
          <TabPanel value={tabValue} index={4}>
            <JobProgressTracker />
          </TabPanel>
          <TabPanel value={tabValue} index={5}>
            <WorkerReview />
          </TabPanel>
          <TabPanel value={tabValue} index={6}>
            <WorkerSearch />
          </TabPanel>
        </Container>
        {/* Floating Quick Actions */}
        <SpeedDial
          ariaLabel="Quick Actions"
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            zIndex: (theme) => theme.zIndex.tooltip,
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
  );
};

export default HirerDashboardPage;
