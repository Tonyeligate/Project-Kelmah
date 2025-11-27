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
  Menu,
  MenuItem,
  ListItemIcon,
  alpha,
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
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  PostAdd as PostAddIcon,
  PersonSearch as PersonSearchIcon,
  Inbox as InboxIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import {
  fetchHirerProfile,
  fetchHirerJobs,
  fetchJobApplications,
  selectHirerJobs,
  selectHirerApplications,
  selectHirerPendingProposalCount,
  selectHirerError,
} from '../services/hirerSlice';
import { selectUnreadCount } from '../../notifications/services/notificationSlice';
import { logoutUser } from '../../auth/services/authSlice';

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

// LC Portal-inspired Service Action Card for primary actions
const ServiceActionCard = ({ icon, title, description, buttonText, onClick, bgColor, iconBgColor }) => (
  <Card
    elevation={4}
    sx={{
      height: '100%',
      borderRadius: 3,
      background: `linear-gradient(135deg, ${bgColor} 0%, ${alpha(bgColor, 0.85)} 100%)`,
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      '&:hover': {
        transform: 'translateY(-8px)',
        boxShadow: `0 20px 40px ${alpha(bgColor, 0.4)}`,
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
      },
    }}
    onClick={onClick}
  >
    <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: 3,
          bgcolor: iconBgColor || 'rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        {icon}
      </Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.9, mb: 3, minHeight: 48 }}>
        {description}
      </Typography>
      <Button
        variant="contained"
        fullWidth
        endIcon={<ArrowForwardIcon />}
        sx={{
          bgcolor: 'rgba(255,255,255,0.2)',
          color: 'white',
          fontWeight: 600,
          py: 1.5,
          borderRadius: 2,
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.3)',
          },
        }}
      >
        {buttonText}
      </Button>
    </CardContent>
  </Card>
);

ServiceActionCard.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  buttonText: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  bgColor: PropTypes.string.isRequired,
  iconBgColor: PropTypes.string,
};

// Metric Card component for the overview grid - softer colors
const MetricCard = ({ icon, title, value, subtitle, color, trend }) => (
  <Card
    elevation={2}
    sx={{
      borderRadius: 3,
      background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`,
      color: 'white',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 12px 24px ${alpha(color, 0.3)}`,
      },
    }}
  >
    <CardContent sx={{ p: 2.5 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
          {title}
        </Typography>
        <Box sx={{ opacity: 0.8 }}>{icon}</Box>
      </Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          {subtitle}
        </Typography>
      )}
      {trend !== undefined && (
        <Box display="flex" alignItems="center" gap={0.5} mt={1}>
          <TrendingUpIcon sx={{ fontSize: 14 }} />
          <Typography variant="caption">
            {trend > 0 ? '+' : ''}{trend}% this month
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

MetricCard.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  color: PropTypes.string.isRequired,
  trend: PropTypes.number,
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
const APPLICATION_REFRESH_TTL_MS = 2 * 60 * 1000; // 2 minutes

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
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);

  const timeoutRef = useRef(null);
  const fetchPromiseRef = useRef(null);
  const isMountedRef = useRef(true);
  const applicationRecordsRef = useRef({});

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
  const unreadNotifications = useSelector(selectUnreadCount);
  const isProfileMenuOpen = Boolean(profileMenuAnchor);

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleProfileMenuNavigate = (path) => {
    handleProfileMenuClose();
    navigate(path);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await dispatch(logoutUser());
    navigate('/login');
  };

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

  // Softer color palette for metric cards (LC Portal inspired)
  const metricColors = {
    purple: '#6C5CE7',    // Total Jobs Posted
    green: '#00B894',     // Total Amount Spent
    blue: '#0984E3',      // Applications
    orange: '#FDCB6E',    // Success Rate
    teal: '#00CEC9',      // Active Workers
    rose: '#E17055',      // Pending Applications
  };

  // LC Portal-inspired Dashboard Overview
  const renderDashboardOverview = () => (
    <Fade in timeout={500}>
      <Box>
        {/* HERO SECTION - Single clean welcome with stats */}
        <Paper
          elevation={4}
          sx={{
            p: { xs: 3, md: 4 },
            mb: 4,
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(45,45,45,0.95) 100%)',
            border: '1px solid rgba(255,215,0,0.2)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{
                  color: '#FFD700',
                  mb: 1,
                  fontSize: { xs: '1.75rem', md: '2.25rem' },
                }}
              >
                Welcome back, {hirerProfile?.firstName || user?.firstName || 'Hirer'}!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Here&apos;s your dashboard overview. Manage jobs, review applications, and track progress.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack
                direction="row"
                spacing={2}
                justifyContent={{ xs: 'center', md: 'flex-end' }}
                flexWrap="wrap"
                gap={2}
              >
                {[
                  { label: 'Active Jobs', value: summaryData.activeJobs, color: '#FFD700' },
                  { label: 'Active Workers', value: summaryData.activeWorkers?.length || 0, color: '#fff' },
                  { label: 'Total Spent', value: `$${(summaryData.totalSpent || 0).toLocaleString()}`, color: '#00B894' },
                ].map((stat) => (
                  <Box
                    key={stat.label}
                    sx={{
                      textAlign: 'center',
                      px: 3,
                      py: 1.5,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${alpha(stat.color, 0.3)}`,
                      minWidth: 100,
                    }}
                  >
                    <Typography variant="h5" fontWeight={700} sx={{ color: stat.color }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* PRIMARY ACTION GRID - LC Portal Style Service Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <ServiceActionCard
              icon={<PostAddIcon sx={{ fontSize: 32, color: 'white' }} />}
              title="Post a Job"
              description="Create a detailed job posting to attract skilled vocational workers in Ghana."
              buttonText="Post Now"
              onClick={() => navigate('/hirer/jobs/post')}
              bgColor="#6C5CE7"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <ServiceActionCard
              icon={<PersonSearchIcon sx={{ fontSize: 32, color: 'white' }} />}
              title="Find Talent"
              description="Browse our pool of skilled workers and invite top professionals to your jobs."
              buttonText="Find Workers"
              onClick={() => navigate('/hirer/find-talent')}
              bgColor="#0984E3"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <ServiceActionCard
              icon={<InboxIcon sx={{ fontSize: 32, color: 'white' }} />}
              title="Review Applications"
              description="View and manage applications from workers interested in your job postings."
              buttonText="View Applications"
              onClick={() => setTabValue(1)}
              bgColor="#FDCB6E"
              iconBgColor="rgba(0,0,0,0.2)"
            />
          </Grid>
        </Grid>

        {/* METRICS GRID - 2 rows of 3 cards with softer colors */}
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'text.primary' }}>
          Your Statistics
        </Typography>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              icon={<WorkIcon sx={{ fontSize: 24 }} />}
              title="Total Jobs Posted"
              value={summaryData.activeJobs + summaryData.completedJobs}
              subtitle={`${summaryData.activeJobs} active, ${summaryData.completedJobs} completed`}
              color={metricColors.purple}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              icon={<AttachMoneyIcon sx={{ fontSize: 24 }} />}
              title="Total Spent"
              value={`$${(summaryData.totalSpent || 0).toLocaleString()}`}
              subtitle="Lifetime spending"
              color={metricColors.green}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              icon={<ProposalIcon sx={{ fontSize: 24 }} />}
              title="Applications"
              value={summaryData.pendingProposals}
              subtitle="Pending review"
              color={metricColors.blue}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              icon={<CheckCircleIcon sx={{ fontSize: 24 }} />}
              title="Success Rate"
              value={summaryData.completedJobs > 0 ? '100%' : 'N/A'}
              subtitle="Completed jobs"
              color={metricColors.orange}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              icon={<PeopleIcon sx={{ fontSize: 24 }} />}
              title="Active Workers"
              value={summaryData.activeWorkers?.length || 0}
              subtitle="Currently hired"
              color={metricColors.teal}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              icon={<PaymentIcon sx={{ fontSize: 24 }} />}
              title="Pending Payments"
              value={summaryData.pendingPayments}
              subtitle="Awaiting release"
              color={metricColors.rose}
            />
          </Grid>
        </Grid>

        {/* NEW USER ONBOARDING - Only show for new hirers */}
        {isNewHirer && (
          <Paper
            elevation={3}
            sx={{
              p: 4,
              mb: 4,
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(108,92,231,0.1) 0%, rgba(9,132,227,0.1) 100%)',
              border: '1px solid rgba(108,92,231,0.3)',
            }}
          >
            <Typography variant="h5" fontWeight={700} gutterBottom>
              🚀 Get Started with Kelmah
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Follow these steps to make your first successful hire:
            </Typography>
            <Grid container spacing={2}>
              {[
                { step: 1, title: 'Post Your First Job', desc: 'Create a detailed job posting with budget and timeline', icon: <PostAddIcon /> },
                { step: 2, title: 'Review Applications', desc: 'Browse applications and shortlist candidates', icon: <ProposalIcon /> },
                { step: 3, title: 'Hire & Pay Safely', desc: 'Use our secure payment system with escrow protection', icon: <PaymentIcon /> },
                { step: 4, title: 'Complete & Review', desc: 'Finish the job and leave a rating for the worker', icon: <ReviewIcon /> },
              ].map((item) => (
                <Grid item xs={12} sm={6} md={3} key={item.step}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.05)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: '#6C5CE7',
                        width: 48,
                        height: 48,
                        mb: 1,
                      }}
                    >
                      {item.icon}
                    </Avatar>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Step {item.step}: {item.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.desc}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddCircleIcon />}
                onClick={() => navigate('/hirer/jobs/post')}
                sx={{
                  bgcolor: '#6C5CE7',
                  px: 4,
                  py: 1.5,
                  '&:hover': { bgcolor: '#5B4ED6' },
                }}
              >
                Post Your First Job
              </Button>
            </Box>
          </Paper>
        )}

        {/* RECENT ACTIVITY */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {/* Quick Stats Summary */}
            <StyledPaper elevation={3} sx={{ p: 0, mb: 3 }}>
              <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography variant="h6" fontWeight={600}>
                  Active Jobs Overview
                </Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                {activeJobs && activeJobs.length > 0 ? (
                  <List disablePadding>
                    {activeJobs.slice(0, 3).map((job, index) => (
                      <React.Fragment key={job._id || job.id || index}>
                        <ListItem
                          sx={{
                            px: 2,
                            py: 1.5,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                            cursor: 'pointer',
                          }}
                          onClick={() => navigate(`/hirer/jobs/${job._id || job.id}`)}
                        >
                          <ListItemIcon>
                            <WorkIcon color="secondary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={job.title}
                            secondary={`Budget: $${job.budget || 0} • ${job.applicationsCount || 0} applications`}
                          />
                          <Chip
                            label={job.status || 'Active'}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        </ListItem>
                        {index < Math.min(activeJobs.length, 3) - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <WorkIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography color="text.secondary">
                      No active jobs yet. Post your first job to get started!
                    </Typography>
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/hirer/jobs/post')}
                      sx={{ mt: 2 }}
                    >
                      Post a Job
                    </Button>
                  </Box>
                )}
              </Box>
              {activeJobs && activeJobs.length > 3 && (
                <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                  <Button
                    color="secondary"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => setTabValue(1)}
                  >
                    View All {activeJobs.length} Jobs
                  </Button>
                </Box>
              )}
            </StyledPaper>
          </Grid>

          <Grid item xs={12} md={4}>
            {/* Recent Activity */}
            <StyledPaper elevation={3} sx={{ p: 0 }}>
              <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography variant="h6" fontWeight={600}>
                  Recent Activity
                </Typography>
              </Box>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {hirerProfile?.recentActivity && hirerProfile.recentActivity.length > 0 ? (
                  <List disablePadding>
                    {hirerProfile.recentActivity.slice(0, 5).map((activity, index) => (
                      <React.Fragment key={activity.id || index}>
                        <ListItem sx={{ px: 2, py: 1.5 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'rgba(255,215,0,0.2)', width: 36, height: 36 }}>
                              {activity.type === 'job' ? (
                                <WorkIcon sx={{ fontSize: 18, color: '#FFD700' }} />
                              ) : activity.type === 'application' ? (
                                <ProposalIcon sx={{ fontSize: 18, color: '#0984E3' }} />
                              ) : (
                                <NotificationsIcon sx={{ fontSize: 18, color: '#E17055' }} />
                              )}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="body2" fontWeight={500}>
                                {activity.title}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {new Date(activity.date).toLocaleDateString()}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < 4 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <NotificationsIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No recent activity
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                <Button
                  color="secondary"
                  startIcon={<NotificationsIcon />}
                  onClick={() => navigate('/notifications')}
                >
                  View All
                  {unreadNotifications > 0 && (
                    <Badge color="error" badgeContent={unreadNotifications} sx={{ ml: 1 }} />
                  )}
                </Button>
              </Box>
            </StyledPaper>
          </Grid>
        </Grid>
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
                cursor: 'pointer',
              }}
              onClick={handleProfileMenuOpen}
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
        <Menu
          anchorEl={profileMenuAnchor}
          open={isProfileMenuOpen}
          onClose={handleProfileMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <MenuItem disabled sx={{ opacity: 1, cursor: 'default' }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                {user?.fullName ||
                  `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
                  'Account'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem onClick={() => handleProfileMenuNavigate('/profile')}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            View Profile
          </MenuItem>
          <MenuItem
            onClick={() => handleProfileMenuNavigate('/settings/account')}
          >
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            Account Settings
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
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
          {/* Tabs Navigation - Streamlined to 5 tabs */}
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
              <StyledTab
                icon={
                  <Badge
                    badgeContent={summaryData.pendingProposals}
                    color="warning"
                  >
                    <WorkIcon />
                  </Badge>
                }
                label="My Jobs"
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
            </Tabs>
          </Box>
          {/* Tab Panels - 5 streamlined panels */}
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
            <PaymentRelease />
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            <JobProgressTracker />
          </TabPanel>
          <TabPanel value={tabValue} index={4}>
            <WorkerReview />
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
