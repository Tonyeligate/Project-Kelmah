import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
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
import { useAuth } from '../../../auth/contexts/AuthContext';
import workersApi from '../../../../api/services/workersApi';

// Ghana-inspired theme
const GhanaTheme = {
  red: '#DC143C',
  gold: '#FFD700',
  green: '#2E7D32',
  trust: '#1976D2',
};

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
  const { user } = useAuth();
  const { data = {}, loading, error } = useSelector((state) => state.dashboard);
  const theme = useTheme();
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
    if (userId && !data.metrics) {
      dispatch(fetchDashboardData());
    }
  }, [dispatch, userId, data.metrics]);

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
          setRecentJobs(jobs || []);
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
  const statistics = useMemo(() => [
    {
      id: 'total-jobs',
      title: 'Total Jobs',
      value: data?.metrics?.totalJobs || 0,
      change: data?.metrics?.jobsChange || 0,
      icon: <WorkIcon />,
      color: GhanaTheme.trust,
    },
    {
      id: 'active-applications',
      title: 'Active Applications',
      value: data?.metrics?.activeApplications || 0,
      change: data?.metrics?.applicationsChange || 0,
      icon: <AssignmentIcon />,
      color: GhanaTheme.green,
    },
    {
      id: 'total-earnings',
      title: 'Total Earnings',
      value: `GH₵ ${data?.metrics?.totalEarnings || 0}`,
      change: data?.metrics?.earningsChange || 0,
      icon: <MoneyIcon />,
      color: GhanaTheme.gold,
    },
    {
      id: 'profile-views',
      title: 'Profile Views',
      value: data?.metrics?.profileViews || 0,
      change: data?.metrics?.viewsChange || 0,
      icon: <VisibilityIcon />,
      color: GhanaTheme.red,
    },
  ], [data?.metrics]);

  // Memoized quick actions to prevent recalculation
  const quickActions = useMemo(() => [
    {
      title: 'Find Jobs',
      description: 'Browse available opportunities',
      icon: <SearchIcon />,
      gradient: `linear-gradient(135deg, ${GhanaTheme.trust} 0%, ${alpha(GhanaTheme.trust, 0.8)} 100%)`,
      onClick: () => navigate('/worker/find-work'),
    },
    {
      title: 'My Applications',
      description: 'Track your job applications',
      icon: <AssignmentIcon />,
      gradient: `linear-gradient(135deg, ${GhanaTheme.green} 0%, ${alpha(GhanaTheme.green, 0.8)} 100%)`,
      onClick: () => navigate('/worker/applications'),
    },
    {
      title: 'Update Profile',
      description: 'Keep your profile current',
      icon: <EditIcon />,
      gradient: `linear-gradient(135deg, ${GhanaTheme.red} 0%, ${alpha(GhanaTheme.red, 0.8)} 100%)`,
      onClick: () => navigate('/worker/profile/edit'),
    },
    {
      title: 'Earnings',
      description: 'View your earnings',
      icon: <EarningsIcon />,
      gradient: `linear-gradient(135deg, ${GhanaTheme.gold} 0%, ${alpha(GhanaTheme.gold, 0.8)} 100%)`,
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
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
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
                  bgcolor: alpha(GhanaTheme.red, 0.1),
                  '&:hover': { bgcolor: alpha(GhanaTheme.red, 0.2) },
                }}
              >
                <RefreshIcon
                  sx={{
                    color: GhanaTheme.red,
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
            {statistics.map((stat, index) => (
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

          {/* Quick Actions */}
          <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {quickActions.map((action, index) => (
              <Grid item xs={6} md={3} key={action.title}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <QuickActionCard {...action} />
                </motion.div>
              </Grid>
            ))}
          </Grid>

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
                      sx={{ color: GhanaTheme.red }}
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
                  ) : recentJobs.length > 0 ? (
                    <List dense>
                      {recentJobs.slice(0, 3).map((job, index) => (
                        <ListItem
                          key={job.id || index}
                          sx={{
                            borderRadius: 2,
                            mb: 1,
                            bgcolor: alpha(GhanaTheme.green, 0.05),
                            '&:hover': { bgcolor: alpha(GhanaTheme.green, 0.1) },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: GhanaTheme.green }}>
                              <WorkIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={job.title || 'Job Opportunity'}
                            secondary={`${job.location || 'Ghana'} • GH₵${job.budget || '0'}`}
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
                      sx={{ color: GhanaTheme.red }}
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
                          bgcolor: alpha(GhanaTheme.trust, 0.1),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            bgcolor: GhanaTheme.trust,
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
                          bgcolor: alpha(GhanaTheme.green, 0.1),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            bgcolor: GhanaTheme.green,
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
                          bgcolor: alpha(GhanaTheme.gold, 0.1),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            bgcolor: GhanaTheme.gold,
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
    </Container>
  );
};

export default EnhancedWorkerDashboard;
