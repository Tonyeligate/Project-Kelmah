import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { GHANA_COLORS } from '../../../../theme/index';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Avatar,
  Chip,
  Button,
  LinearProgress,
  Stack,
  useTheme,
  useMediaQuery,
  alpha,
  Paper,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Skeleton,
  Alert,
  Tooltip,
  Badge,
  Container,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Work as WorkIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
  Visibility as VisibilityIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CompletedIcon,
  Schedule as ScheduleIcon,
  Message as MessageIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon,
  AccountBalance as EarningsIcon,
  Group as NetworkIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchDashboardData } from '../../services/dashboardSlice';
// Removed AuthContext import to prevent dual state management conflicts
// import { useAuth } from '../../../auth/contexts/AuthContext';
import workersApi from '../../../../api/services/workersApi';
import VocationalJobCategories from './VocationalJobCategories';
import VisualQuickActions from './VisualQuickActions';
import ErrorBoundary from '../../../../components/common/ErrorBoundary';
import DepthContainer from '../../../../components/common/DepthContainer';

// Memoized components to prevent unnecessary re-renders
const StatsCard = React.memo(({ title, value, change, icon, color, loading }) => (
  <Card
    sx={{
      borderRadius: 3,
      overflow: 'hidden',
      background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`,
      color: 'white',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="white" fill-opacity="0.1"%3E%3Cpath d="M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z"/%3E%3C/g%3E%3C/svg%3E")',
        pointerEvents: 'none',
      },
    }}
  >
    <CardContent sx={{ position: 'relative', zIndex: 1 }}>
      {loading ? (
        <>
          <Skeleton variant="text" width="60%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
          <Skeleton variant="text" width="40%" height={32} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
        </>
      ) : (
        <>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {title}
            </Typography>
            <Box sx={{ opacity: 0.8 }}>
              {icon}
            </Box>
          </Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {value}
          </Typography>
          {change !== undefined && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <TrendingUpIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption">
                {change > 0 ? '+' : ''}{change}% this month
              </Typography>
            </Box>
          )}
        </>
      )}
    </CardContent>
  </Card>
));

const QuickActionCard = React.memo(({ title, description, icon, onClick, gradient }) => (
  <Card
    sx={{
      borderRadius: 3,
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      background: gradient,
      color: 'white',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
      },
      '&:active': {
        transform: 'scale(0.98)',
      },
    }}
    onClick={onClick}
  >
    <CardContent sx={{ textAlign: 'center', py: 3 }}>
      <Box sx={{ fontSize: 48, mb: 2, opacity: 0.9 }}>
        {icon}
      </Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.8 }}>
        {description}
      </Typography>
    </CardContent>
  </Card>
));

const EnhancedWorkerDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Use ONLY Redux auth state to prevent dual state management conflicts
  const { user } = useSelector((state) => state.auth);
  const { data = {}, loading, error } = useSelector((state) => state.dashboard);
  const theme = useTheme();
  const brand = theme.palette; // use brand tokens
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State with proper initialization to prevent re-renders
  const [profileCompletion, setProfileCompletion] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Stable user ID to prevent unnecessary effects
  const userId = useMemo(() => 
    user?.id || user?._id || user?.userId, 
    [user?.id, user?._id, user?.userId]
  );

  // Load initial data - properly memoized to prevent infinite re-renders
  useEffect(() => {
    if (userId) {
      console.log('Loading dashboard data for user:', userId, 'Current data:', data);
      dispatch(fetchDashboardData());
    }
  }, [dispatch, userId]); // Removed data.metrics dependency to always fetch

  // Add comprehensive loading state checks to prevent component crashes
  if (!user) {
    console.log('Dashboard: Waiting for user data...');
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Loading your dashboard...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Show dashboard content immediately - loading states handled by individual components
  console.log('Dashboard: Rendering with data:', { 
    loading, 
    hasData: !!data, 
    hasMetrics: !!data?.metrics,
    metricsKeys: data?.metrics ? Object.keys(data.metrics) : 'none'
  });

  // Load profile completion - with guard to prevent infinite calls
  useEffect(() => {
    let isMounted = true;
    
    const loadProfileCompletion = async () => {
      if (!userId || profileCompletion !== null) return;
      
      try {
        const completion = await workersApi.getProfileCompletion();
        if (isMounted) {
          setProfileCompletion(completion);
        }
      } catch (error) {
        console.warn('Failed to load profile completion:', error);
        if (isMounted) {
          setProfileCompletion({ percentage: 0, missingFields: [] });
        }
      }
    };

    loadProfileCompletion();
    
    return () => {
      isMounted = false;
    };
  }, [userId, profileCompletion]);

  // Load recent jobs - with guard to prevent infinite calls
  useEffect(() => {
    let isMounted = true;
    
    const loadRecentJobs = async () => {
      if (!userId || recentJobs.length > 0) return;
      
      try {
        const jobs = await workersApi.getRecentJobs();
        if (isMounted) {
          // Ensure jobs is always an array
          const jobsArray = Array.isArray(jobs) ? jobs : (jobs?.data ? jobs.data : []);
          setRecentJobs(jobsArray);
        }
      } catch (error) {
        console.warn('Failed to load recent jobs:', error);
        if (isMounted) {
          setRecentJobs([]);
        }
      }
    };

    loadRecentJobs();
    
    return () => {
      isMounted = false;
    };
  }, [userId, recentJobs.length]);

  // Memoized statistics to prevent recalculation on every render
  const statistics = useMemo(() => {
    // Ensure data.metrics exists and has proper structure, provide fallbacks
    const metrics = data?.metrics || {
      totalJobs: 0,
      activeApplications: 0,
      totalEarnings: 0,
      profileViews: 0,
      jobsChange: 0,
      applicationsChange: 0,
      earningsChange: 0,
      viewsChange: 0
    };
    
    // Always return an array to prevent map errors
    try {
      return [
    {
      id: 'total-jobs',
      title: 'Total Jobs',
      value: metrics?.totalJobs || 0,
      change: metrics?.jobsChange || 0,
      icon: <WorkIcon />,
      color: GHANA_COLORS.blue,
    },
    {
      id: 'active-applications',
      title: 'Active Applications',
      value: metrics?.activeApplications || 0,
      change: metrics?.applicationsChange || 0,
      icon: <AssignmentIcon />,
      color: GHANA_COLORS.green,
    },
    {
      id: 'total-earnings',
      title: 'Total Earnings',
      value: `GH₵ ${metrics?.totalEarnings || 0}`,
      change: metrics?.earningsChange || 0,
      icon: <MoneyIcon />,
      color: GHANA_COLORS.gold,
    },
    {
      id: 'profile-views',
      title: 'Profile Views',
      value: metrics?.profileViews || 0,
      change: metrics?.viewsChange || 0,
      icon: <VisibilityIcon />,
      color: GHANA_COLORS.red,
    },
  ];
    } catch (error) {
      console.error('Error creating statistics array:', error);
      return []; // Return empty array on error
    }
  }, [data?.metrics]);

  // Memoized quick actions to prevent recalculation
  const quickActions = useMemo(() => [
    {
      title: 'Find Jobs',
      description: 'Browse available opportunities',
      icon: <SearchIcon />,
      gradient: `linear-gradient(135deg, ${GHANA_COLORS.blue} 0%, ${alpha(GHANA_COLORS.blue, 0.8)} 100%)`,
      onClick: () => navigate('/worker/find-work'),
    },
    {
      title: 'My Applications',
      description: 'Track your job applications',
      icon: <AssignmentIcon />,
      gradient: `linear-gradient(135deg, ${GHANA_COLORS.green} 0%, ${alpha(GHANA_COLORS.green, 0.8)} 100%)`,
      onClick: () => navigate('/worker/applications'),
    },
    {
      title: 'Update Profile',
      description: 'Keep your profile current',
      icon: <EditIcon />,
      gradient: `linear-gradient(135deg, ${GHANA_COLORS.red} 0%, ${alpha(GHANA_COLORS.red, 0.8)} 100%)`,
      onClick: () => navigate('/worker/profile/edit'),
    },
    {
      title: 'Earnings',
      description: 'View your earnings',
      icon: <EarningsIcon />,
      gradient: `linear-gradient(135deg, ${GHANA_COLORS.gold} 0%, ${alpha(GHANA_COLORS.gold, 0.8)} 100%)`,
      onClick: () => navigate('/worker/earnings'),
    },
  ], [navigate]);

  // Refresh handler - memoized to prevent recreation
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchDashboardData());
      // Reset data to force reload
      setProfileCompletion(null);
      setRecentJobs([]);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setTimeout(() => setRefreshing(false), 1000); // Visual feedback
    }
  }, [dispatch]);

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load dashboard data. Please try refreshing the page.
        </Alert>
        <Button
          variant="contained"
          onClick={handleRefresh}
          startIcon={<RefreshIcon />}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Retry'}
        </Button>
      </Container>
    );
  }

  return (
    <DepthContainer depth="low" sx={{ p: { xs: 1, md: 2 } }}>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <ErrorBoundary>
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <Box>
                <Typography
                  variant="h3"
                  fontWeight={700}
                  sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' } }}
                >
                  Welcome back, {user?.firstName || user?.name || 'Worker'}! 👋
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Here's what's happening with your work today.
                </Typography>
              </Box>
              <Tooltip title="Refresh dashboard">
                <IconButton
                  onClick={handleRefresh}
                  disabled={refreshing}
                  sx={{
                    bgcolor: alpha(GHANA_COLORS.red, 0.1),
                    '&:hover': { bgcolor: alpha(GHANA_COLORS.red, 0.2) },
                  }}
                >
                  <RefreshIcon
                    sx={{
                      color: GHANA_COLORS.red,
                      animation: refreshing ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Profile Completion Alert */}
            {profileCompletion && profileCompletion.percentage < 100 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <Alert
                  severity="info"
                  sx={{ mb: 3, borderRadius: 2 }}
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => navigate('/worker/profile/edit')}
                    >
                      Complete
                    </Button>
                  }
                >
                  Your profile is {profileCompletion.percentage}% complete. 
                  Complete your profile to attract more clients!
                </Alert>
              </motion.div>
            )}

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {Array.isArray(statistics) && statistics.map((stat, index) => (
                <Grid item xs={6} md={3} key={stat.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <StatsCard {...stat} loading={loading} />
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            {/* Visual Job Categories for Easy Navigation */}
            <ErrorBoundary>
              <Box sx={{ mb: 4 }}>
                <VocationalJobCategories />
              </Box>
            </ErrorBoundary>

            {/* Visual Quick Actions */}
            <ErrorBoundary>
              <Box sx={{ mb: 4 }}>
                <VisualQuickActions />
              </Box>
            </ErrorBoundary>

            {/* Recent Activity */}
            <Grid container spacing={3}>
              {/* Recent Jobs */}
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" fontWeight={600}>
                        Recent Job Matches
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => navigate('/worker/find-work')}
                        sx={{ color: GHANA_COLORS.red }}
                      >
                        View All
                      </Button>
                    </Box>
                    {loading ? (
                      <Stack spacing={1}>
                        {[...Array(3)].map((_, i) => (
                          <Box key={i} display="flex" alignItems="center" gap={2}>
                            <Skeleton variant="circular" width={40} height={40} />
                            <Box flex={1}>
                              <Skeleton variant="text" width="70%" />
                              <Skeleton variant="text" width="50%" />
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    ) : Array.isArray(recentJobs) && recentJobs.length > 0 ? (
                      <List dense>
                        {recentJobs.slice(0, 3).map((job, index) => (
                          <ListItem
                            key={job.id || index}
                            sx={{
                              borderRadius: 2,
                              mb: 1,
                              bgcolor: alpha(GHANA_COLORS.green, 0.05),
                              '&:hover': { bgcolor: alpha(GHANA_COLORS.green, 0.1) },
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: GHANA_COLORS.green }}>
                                <WorkIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={job.title || 'Job Opportunity'}
                              secondary={`${job.location || 'Ghana'} • GH₵${job?.budget || '0'}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Box textAlign="center" py={4}>
                        <WorkIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                          No recent job matches. Update your skills to see more opportunities!
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Profile Insights */}
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" fontWeight={600}>
                        Profile Insights
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => navigate('/worker/analytics')}
                        sx={{ color: GHANA_COLORS.red }}
                      >
                        View Analytics
                      </Button>
                    </Box>
                    
                    <Stack spacing={3}>
                      {/* Profile Views */}
                      <Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2" color="text.secondary">
                            Profile Views This Week
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {data?.metrics?.weeklyViews || 0}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((data?.metrics?.weeklyViews || 0) * 2, 100)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: alpha(GHANA_COLORS.blue, 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              bgcolor: GHANA_COLORS.blue,
                            },
                          }}
                        />
                      </Box>

                      {/* Response Rate */}
                      <Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2" color="text.secondary">
                            Response Rate
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {data?.metrics?.responseRate || 0}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={data?.metrics?.responseRate || 0}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: alpha(GHANA_COLORS.green, 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              bgcolor: GHANA_COLORS.green,
                            },
                          }}
                        />
                      </Box>

                      {/* Completion Rate */}
                      <Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2" color="text.secondary">
                            Job Completion Rate
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {data?.metrics?.completionRate || 0}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={data?.metrics?.completionRate || 0}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: alpha(GHANA_COLORS.gold, 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              bgcolor: GHANA_COLORS.gold,
                            },
                          }}
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </motion.div>
        </AnimatePresence>
        </ErrorBoundary>
      </Container>
    </DepthContainer>
  );
};

export default EnhancedWorkerDashboard;
