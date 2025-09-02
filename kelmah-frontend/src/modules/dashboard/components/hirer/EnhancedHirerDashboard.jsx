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
  AvatarGroup,
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
  AccountBalance as PaymentsIcon,
  Group as TeamIcon,
  Business as BusinessIcon,
  PostAdd as PostJobIcon,
  PersonSearch as FindTalentIcon,
  Campaign as CampaignIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchHirerDashboardData } from '../../services/hirerDashboardSlice';
import { useAuth } from '../../../auth/contexts/AuthContext';
import hirersApi from '../../../../api/services/hirersApi';

// Ghana-inspired theme
const GhanaTheme = {
  red: '#DC143C',
  gold: '#FFD700',
  green: '#2E7D32',
  trust: '#1976D2',
  business: '#6A1B9A',
};

// Memoized components to prevent unnecessary re-renders
const HirerStatsCard = React.memo(({ title, value, change, icon, color, loading, subtitle }) => (
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
        background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="white" fill-opacity="0.08"%3E%3Cpath d="M30 30c0-8.3-6.7-15-15-15s-15 6.7-15 15 6.7 15 15 15 15-6.7 15-15zm15 0c0-8.3-6.7-15-15-15s-15 6.7-15 15 6.7 15 15 15 15-6.7 15-15z"/%3E%3C/g%3E%3C/svg%3E")',
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
          {subtitle && (
            <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 1 }}>
              {subtitle}
            </Typography>
          )}
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

const HirerActionCard = React.memo(({ title, description, icon, onClick, gradient, featured }) => (
  <Card
    sx={{
      borderRadius: 3,
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      background: gradient,
      color: 'white',
      position: 'relative',
      border: featured ? `2px solid ${GhanaTheme.gold}` : 'none',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
      },
      '&:active': {
        transform: 'scale(0.98)',
      },
      '&::before': featured ? {
        content: '"RECOMMENDED"',
        position: 'absolute',
        top: -8,
        right: 16,
        bgcolor: GhanaTheme.gold,
        color: 'black',
        fontSize: '0.7rem',
        fontWeight: 'bold',
        px: 1,
        py: 0.5,
        borderRadius: 1,
        zIndex: 2,
      } : {},
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

const EnhancedHirerDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data = {}, loading, error } = useSelector((state) => state.hirerDashboard || {});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State with proper initialization to prevent re-renders
  const [activeJobs, setActiveJobs] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [topTalent, setTopTalent] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Stable user ID to prevent unnecessary effects
  const userId = useMemo(() => 
    user?.id || user?._id || user?.userId, 
    [user?.id, user?._id, user?.userId]
  );

  // Load initial data - properly memoized to prevent infinite re-renders
  useEffect(() => {
    if (userId && !data.metrics) {
      dispatch(fetchHirerDashboardData());
    }
  }, [dispatch, userId, data.metrics]);

  // Load active jobs - with guard to prevent infinite calls
  useEffect(() => {
    let isMounted = true;
    
    const loadActiveJobs = async () => {
      if (!userId || activeJobs.length > 0) return;
      
      try {
        const jobs = await hirersApi.getActiveJobs();
        if (isMounted) {
          setActiveJobs(jobs || []);
        }
      } catch (error) {
        console.warn('Failed to load active jobs:', error);
        if (isMounted) {
          setActiveJobs([]);
        }
      }
    };

    loadActiveJobs();
    
    return () => {
      isMounted = false;
    };
  }, [userId, activeJobs.length]);

  // Load recent applications - with guard to prevent infinite calls
  useEffect(() => {
    let isMounted = true;
    
    const loadRecentApplications = async () => {
      if (!userId || recentApplications.length > 0) return;
      
      try {
        const applications = await hirersApi.getRecentApplications();
        if (isMounted) {
          setRecentApplications(applications || []);
        }
      } catch (error) {
        console.warn('Failed to load recent applications:', error);
        if (isMounted) {
          setRecentApplications([]);
        }
      }
    };

    loadRecentApplications();
    
    return () => {
      isMounted = false;
    };
  }, [userId, recentApplications.length]);

  // Memoized statistics to prevent recalculation on every render
  const statistics = useMemo(() => [
    {
      id: 'active-jobs',
      title: 'Active Jobs',
      value: data?.metrics?.activeJobs || 0,
      subtitle: `${data?.metrics?.totalJobs || 0} total posted`,
      change: data?.metrics?.jobsChange || 0,
      icon: <WorkIcon />,
      color: GhanaTheme.trust,
    },
    {
      id: 'total-applications',
      title: 'Applications Received',
      value: data?.metrics?.totalApplications || 0,
      subtitle: `${data?.metrics?.newApplications || 0} this week`,
      change: data?.metrics?.applicationsChange || 0,
      icon: <AssignmentIcon />,
      color: GhanaTheme.green,
    },
    {
      id: 'total-spent',
      title: 'Total Invested',
      value: `GH₵ ${(data?.metrics?.totalSpent || 0).toLocaleString()}`,
      subtitle: `GH₵ ${data?.metrics?.monthlySpent || 0} this month`,
      change: data?.metrics?.spendingChange || 0,
      icon: <MoneyIcon />,
      color: GhanaTheme.gold,
    },
    {
      id: 'hired-workers',
      title: 'Workers Hired',
      value: data?.metrics?.hiredWorkers || 0,
      subtitle: `${data?.metrics?.activeWorkers || 0} currently active`,
      change: data?.metrics?.hiresChange || 0,
      icon: <TeamIcon />,
      color: GhanaTheme.business,
    },
  ], [data?.metrics]);

  // Memoized quick actions to prevent recalculation
  const quickActions = useMemo(() => [
    {
      title: 'Post New Job',
      description: 'Find the perfect talent',
      icon: <PostJobIcon />,
      gradient: `linear-gradient(135deg, ${GhanaTheme.red} 0%, ${alpha(GhanaTheme.red, 0.8)} 100%)`,
      onClick: () => navigate('/hirer/post-job'),
      featured: true,
    },
    {
      title: 'Find Talent',
      description: 'Browse skilled workers',
      icon: <FindTalentIcon />,
      gradient: `linear-gradient(135deg, ${GhanaTheme.trust} 0%, ${alpha(GhanaTheme.trust, 0.8)} 100%)`,
      onClick: () => navigate('/hirer/find-talent'),
    },
    {
      title: 'Manage Jobs',
      description: 'View and edit your jobs',
      icon: <BusinessIcon />,
      gradient: `linear-gradient(135deg, ${GhanaTheme.green} 0%, ${alpha(GhanaTheme.green, 0.8)} 100%)`,
      onClick: () => navigate('/hirer/jobs'),
    },
    {
      title: 'Payments',
      description: 'Manage transactions',
      icon: <PaymentsIcon />,
      gradient: `linear-gradient(135deg, ${GhanaTheme.gold} 0%, ${alpha(GhanaTheme.gold, 0.8)} 100%)`,
      onClick: () => navigate('/hirer/payments'),
    },
  ], [navigate]);

  // Refresh handler - memoized to prevent recreation
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchHirerDashboardData());
      // Reset data to force reload
      setActiveJobs([]);
      setRecentApplications([]);
      setTopTalent([]);
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
                Welcome, {user?.firstName || user?.name || user?.businessName || 'Hirer'}! 🚀
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage your projects and find the best talent in Ghana.
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

          {/* Quick Start Tip for New Users */}
          {(!data?.metrics?.totalJobs || data.metrics.totalJobs === 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <Alert
                severity="info"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha(GhanaTheme.trust, 0.1)} 0%, ${alpha(GhanaTheme.green, 0.1)} 100%)`,
                }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => navigate('/hirer/post-job')}
                  >
                    Post Job
                  </Button>
                }
              >
                <strong>Get started!</strong> Post your first job to connect with talented workers across Ghana.
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
                  <HirerStatsCard {...stat} loading={loading} />
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
                  <HirerActionCard {...action} />
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {/* Activity Overview */}
          <Grid container spacing={3}>
            {/* Active Jobs */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight={600}>
                      Active Jobs
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => navigate('/hirer/jobs')}
                      sx={{ color: GhanaTheme.red }}
                    >
                      Manage All
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
                  ) : activeJobs.length > 0 ? (
                    <List dense>
                      {activeJobs.slice(0, 3).map((job, index) => (
                        <ListItem
                          key={job.id || index}
                          sx={{
                            borderRadius: 2,
                            mb: 1,
                            bgcolor: alpha(GhanaTheme.trust, 0.05),
                            '&:hover': { bgcolor: alpha(GhanaTheme.trust, 0.1) },
                            cursor: 'pointer',
                          }}
                          onClick={() => navigate(`/hirer/jobs/${job.id}`)}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: GhanaTheme.trust }}>
                              <WorkIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={job.title || 'Job Title'}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {job.applicationsCount || 0} applications • GH₵{job.budget || '0'}
                                </Typography>
                                <Box display="flex" gap={1} mt={0.5}>
                                  <Chip
                                    label={job.status || 'Active'}
                                    size="small"
                                    color={job.status === 'Active' ? 'success' : 'default'}
                                  />
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box textAlign="center" py={4}>
                      <WorkIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        No active jobs yet
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigate('/hirer/post-job')}
                        sx={{ bgcolor: GhanaTheme.red }}
                      >
                        Post Your First Job
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Applications */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight={600}>
                      Recent Applications
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => navigate('/hirer/applications')}
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
                  ) : recentApplications.length > 0 ? (
                    <List dense>
                      {recentApplications.slice(0, 3).map((app, index) => (
                        <ListItem
                          key={app.id || index}
                          sx={{
                            borderRadius: 2,
                            mb: 1,
                            bgcolor: alpha(GhanaTheme.green, 0.05),
                            '&:hover': { bgcolor: alpha(GhanaTheme.green, 0.1) },
                            cursor: 'pointer',
                          }}
                          onClick={() => navigate(`/hirer/applications/${app.id}`)}
                        >
                          <ListItemAvatar>
                            <Avatar
                              src={app.worker?.profilePicture}
                              sx={{ bgcolor: GhanaTheme.green }}
                            >
                              {app.worker?.name?.[0] || 'W'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={app.worker?.name || 'Worker'}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  Applied for: {app.jobTitle || 'Job'}
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                  <Chip
                                    label={`${app.worker?.rating || 0} ⭐`}
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    {app.timeAgo || '1h ago'}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box textAlign="center" py={4}>
                      <AssignmentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        No applications yet. Post a job to start receiving applications!
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </motion.div>
      </AnimatePresence>
    </Container>
  );
};

export default EnhancedHirerDashboard;
