import React, { useState, useEffect } from 'react';
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
  CardActionArea,
  alpha,
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
  Person as PersonIcon,
  ArrowForward as ArrowForwardIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  AddCircle as AddCircleIcon,
  Business as BusinessIcon,
  EmojiEvents as EmojiEventsIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import {
  fetchHirerProfile,
  fetchHirerJobs,
  fetchJobApplications,
  selectHirerProfile,
  selectHirerJobs,
  selectHirerLoading,
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
  const theme = useTheme();

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

const ActionButton = ({ icon, color, label, onClick, ...props }) => (
  <Button
    fullWidth
    variant="contained"
    color={color}
    startIcon={icon}
    onClick={onClick}
    sx={{
      py: 1.8,
      fontSize: '1rem',
      fontWeight: 600,
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
      borderRadius: 2,
      '&:hover': {
        boxShadow: '0 6px 15px rgba(0,0,0,0.15)',
        transform: 'translateY(-2px)',
      },
      transition: 'all 0.3s ease',
      ...(color === 'primary' && {
        background: 'linear-gradient(45deg, #FFD700, #DAA520)',
        '&:hover': {
          background: 'linear-gradient(45deg, #DAA520, #FFD700)',
          boxShadow: '0 6px 15px rgba(218,165,32,0.4)',
          transform: 'translateY(-2px)',
        },
      }),
      ...props.sx,
    }}
    {...props}
  >
    {label}
  </Button>
);

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

  // Get data from Redux store using selectors
  const user = useSelector((state) => state.auth.user);
  const hirerProfile = useSelector((state) => state.hirer.profile);
  const activeJobs = useSelector(selectHirerJobs('active'));
  const completedJobs = useSelector(selectHirerJobs('completed'));
  const applications = useSelector((state) => state.hirer.applications);
  const payments = useSelector((state) => state.hirer.payments);
  const loading = useSelector(selectHirerLoading('profile'));
  const storeError = useSelector(selectHirerError('profile'));
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
  useEffect(() => {
    let timeoutId;
    
    const fetchHirerData = async () => {
      try {
        setError(null);
        setLoadingTimeout(false);
        
        // Set 10-second timeout for loading state
        timeoutId = setTimeout(() => {
          setLoadingTimeout(true);
          setError('Loading is taking longer than expected. Please check your connection and try refreshing.');
        }, 10000);
        
        // ⏱️ Add small delay to ensure auth token is stored and axios interceptors are ready
        // This prevents race condition where API calls fire before token is attached
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Fetch hirer profile and jobs
        await Promise.all([
          dispatch(fetchHirerProfile()).unwrap(),
          dispatch(fetchHirerJobs('active')).unwrap(),
          dispatch(fetchHirerJobs('completed')).unwrap(),
        ]);

        // Clear timeout if successful
        clearTimeout(timeoutId);
        setLoadingTimeout(false);

        // Fetch applications for each active job
        if (activeJobs && Array.isArray(activeJobs) && activeJobs.length > 0) {
          const applicationPromises = activeJobs.map((job) =>
            dispatch(
              fetchJobApplications({ jobId: job.id, status: 'pending' }),
            ).unwrap(),
          );
          await Promise.all(applicationPromises);
        }
      } catch (err) {
        console.error('Error fetching hirer data:', err);
        clearTimeout(timeoutId);
        setLoadingTimeout(false);
        setError('Failed to load hirer data. Please try again.');
      }
    };

    fetchHirerData();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [dispatch, activeJobs]);

  // Handler for refreshing data
  const handleRefresh = async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchHirerProfile()).unwrap(),
        dispatch(fetchHirerJobs('active')).unwrap(),
        dispatch(fetchHirerJobs('completed')).unwrap(),
      ]);

      // Refresh applications for each active job
      if (activeJobs && Array.isArray(activeJobs) && activeJobs.length > 0) {
        const applicationPromises = activeJobs.map((job) =>
          dispatch(
            fetchJobApplications({ jobId: job.id, status: 'pending' }),
          ).unwrap(),
        );
        await Promise.all(applicationPromises);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
      setLastRefreshed(Date.now());
    }
  };

  // Handler for tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh',
        }}
      >
        <CircularProgress sx={{ mb: 2, color: 'secondary.main' }} />
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Loading your dashboard...
        </Typography>
        
        {/* Show timeout warning after 10 seconds */}
        {loadingTimeout && (
          <Alert 
            severity="warning" 
            sx={{ mt: 3, maxWidth: 500 }}
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
            Loading is taking longer than expected. Please check your connection or try refreshing the page.
          </Alert>
        )}
      </Box>
    );
  }

  return (
    <Grow in timeout={500}>
      <Box>
        {/* SEO & Document Title */}
        <Helmet>
          <title>Hirer Dashboard | Kelmah</title>
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
                Here's your hirer dashboard. Manage your jobs and talent!
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
            {loading ? <LoadingOverviewSkeleton /> : renderDashboardOverview()}
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
