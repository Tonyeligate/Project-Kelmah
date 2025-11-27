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
  AttachMoney as AttachMoneyIcon,
  HelpOutline as HelpOutlineIcon,
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

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // LC Portal-inspired Dashboard Overview - EXACT MATCH
  const renderDashboardOverview = () => (
    <Fade in timeout={500}>
      <Box sx={{ bgcolor: '#F5F5F5', minHeight: '100vh', mx: -4, mt: -3, p: 4 }}>
        {/* Breadcrumb - LC Portal Style */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <MUILink
            component={RouterLink}
            to="/"
            underline="hover"
            sx={{ color: '#666', display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            🏠
          </MUILink>
          <Typography color="text.secondary">Dashboard</Typography>
        </Breadcrumbs>

        {/* SIMPLE GREETING - LC Portal Style */}
        <Typography
          variant="h4"
          sx={{
            mb: 4,
            color: '#333',
            fontWeight: 400,
            fontSize: { xs: '1.5rem', md: '2rem' },
          }}
        >
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {hirerProfile?.firstName || user?.firstName || 'there'}
        </Typography>

        {/* 4 METRIC CARDS IN ONE ROW - LC Portal EXACT Style */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Card 1 - Orange/Yellow - Unpaid Bills / Active Jobs */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #F39C12 0%, #E67E22 100%)',
                color: 'white',
                height: 130,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={500} sx={{ opacity: 0.95, mb: 0.5 }}>
                  Active Jobs
                </Typography>
                <Typography variant="h3" fontWeight={700}>
                  {summaryData.activeJobs}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Pending Work
                </Typography>
              </Box>
              <Box sx={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}>
                <WorkIcon sx={{ fontSize: 40, opacity: 0.3 }} />
              </Box>
            </Paper>
          </Grid>

          {/* Card 2 - Teal/Green - Paid Bills / Completed */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #1ABC9C 0%, #16A085 100%)',
                color: 'white',
                height: 130,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={500} sx={{ opacity: 0.95, mb: 0.5 }}>
                  Completed Jobs
                </Typography>
                <Typography variant="h3" fontWeight={700}>
                  {summaryData.completedJobs}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Total Paid Status
                </Typography>
              </Box>
              <Box sx={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}>
                <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.3 }} />
              </Box>
            </Paper>
          </Grid>

          {/* Card 3 - Blue - Submitted Applications */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #3498DB 0%, #2980B9 100%)',
                color: 'white',
                height: 130,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={500} sx={{ opacity: 0.95, mb: 0.5 }}>
                  Applications
                </Typography>
                <Typography variant="h3" fontWeight={700}>
                  {summaryData.pendingProposals}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Pending Review
                </Typography>
              </Box>
              <Box sx={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}>
                <ProposalIcon sx={{ fontSize: 40, opacity: 0.3 }} />
              </Box>
            </Paper>
          </Grid>

          {/* Card 4 - Red - Queried / Needs Attention */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)',
                color: 'white',
                height: 130,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={500} sx={{ opacity: 0.95, mb: 0.5 }}>
                  Needs Attention
                </Typography>
                <Typography variant="h3" fontWeight={700}>
                  {summaryData.pendingPayments}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Action Required
                </Typography>
              </Box>
              <Box sx={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}>
                <HelpOutlineIcon sx={{ fontSize: 40, opacity: 0.3 }} />
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* TWO CHART SECTIONS - LC Portal Style */}
        <Grid container spacing={3}>
          {/* Bills Chart / Spending Chart */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: 'white',
                height: 350,
              }}
            >
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3, color: '#333' }}>
                Spending Overview
              </Typography>
              {/* Simple Chart Placeholder */}
              <Box
                sx={{
                  height: 250,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                {summaryData.totalSpent > 0 ? (
                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 4 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Box
                        sx={{
                          width: 60,
                          height: Math.min(180, (summaryData.completedJobs / (summaryData.activeJobs + summaryData.completedJobs || 1)) * 180 + 20),
                          bgcolor: '#1ABC9C',
                          borderRadius: 1,
                          mb: 1,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">Completed</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Box
                        sx={{
                          width: 60,
                          height: Math.min(180, (summaryData.activeJobs / (summaryData.activeJobs + summaryData.completedJobs || 1)) * 180 + 20),
                          bgcolor: '#F39C12',
                          borderRadius: 1,
                          mb: 1,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">Active</Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No spending data yet
                  </Typography>
                )}
                {/* Legend */}
                <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#1ABC9C' }} />
                    <Typography variant="caption">Completed</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#F39C12' }} />
                    <Typography variant="caption">Active</Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Applications Chart - Donut Style */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: 'white',
                height: 350,
              }}
            >
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3, color: '#333' }}>
                Applications Overview
              </Typography>
              <Box sx={{ display: 'flex', height: 250 }}>
                {/* Legend on left */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center', pr: 4 }}>
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
                {/* Donut Chart Placeholder */}
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box
                    sx={{
                      width: 180,
                      height: 180,
                      borderRadius: '50%',
                      background: `conic-gradient(
                        #4CAF50 0deg ${summaryData.completedJobs * 36}deg,
                        #2196F3 ${summaryData.completedJobs * 36}deg ${(summaryData.completedJobs + summaryData.pendingProposals) * 36}deg,
                        #F44336 ${(summaryData.completedJobs + summaryData.pendingProposals) * 36}deg 360deg
                      )`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <Box
                      sx={{
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        bgcolor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="h4" fontWeight={600} color="#666">
                        {summaryData.activeJobs + summaryData.completedJobs}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Paper>
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
        {/* Simplified Top Actions Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: 4,
            py: 1.5,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Refresh Dashboard">
              <IconButton onClick={handleRefresh} color="secondary" size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="caption" color="text.secondary">
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
                size="small"
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
