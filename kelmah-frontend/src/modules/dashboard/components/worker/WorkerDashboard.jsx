import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Grow,
  useTheme,
  useMediaQuery,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActionArea,
  IconButton,
  Chip,
  Avatar,
  LinearProgress,
  Stack,
  Divider,
  alpha,
  Tooltip,
  Fade,
  Collapse,
  Button,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Star as StarIcon,
  WorkOutline as WorkIcon,
  MonetizationOn as EarningsIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CompletionIcon,
  Search as SearchIcon,
  Message as MessageIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  TrendingFlat as TrendingFlatIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchDashboardData } from '../../services/dashboardSlice';
import { useAuth } from '../../../auth/contexts/AuthContext';
import StatisticsCard from '../common/StatisticsCard';
import QuickActions from '../common/QuickActions';
import Portfolio from './Portfolio';
import Credentials from './Credentials';
import AvailableJobs from './AvailableJobs';
import AvailabilityStatus from './AvailabilityStatus';
import EarningsChart from './EarningsChart';
import UpcomingAppointments from './UpcomingAppointments';
import ProfileCompletion from './ProfileCompletion';

/**
 * Enhanced Worker Dashboard with responsive design and improved UX
 */
const EnhancedWorkerDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, error } = useSelector((state) => state.dashboard);
  const theme = useTheme();
  
  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
  // Local state
  const [expandedSection, setExpandedSection] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllStats, setShowAllStats] = useState(false);

  // Fetch dashboard data on mount
  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  // Refresh data function
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchDashboardData()).unwrap();
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Memoized statistics data
  const statistics = useMemo(() => {
    const metrics = data?.metrics || {};
    
    return [
      {
        id: 'active-jobs',
        title: 'Active Jobs',
        value: metrics.activeJobs || 0,
        subtitle: 'Currently working on',
        color: '#FFD700',
        gradient: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
        icon: <WorkIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />,
        trend: metrics.activeJobsChange || 0,
        trendDirection: metrics.activeJobsChange > 0 ? 'up' : metrics.activeJobsChange < 0 ? 'down' : 'stable',
        onClick: () => navigate('/worker/jobs'),
        priority: 1,
      },
      {
        id: 'pending-applications',
        title: 'Applications',
        value: metrics.pendingApplications || 0,
        subtitle: 'Awaiting response',
        color: '#2196F3',
        gradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
        icon: <AssignmentIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />,
        trend: metrics.applicationsTrend || 0,
        trendDirection: metrics.applicationsTrend > 0 ? 'up' : metrics.applicationsTrend < 0 ? 'down' : 'stable',
        onClick: () => navigate('/worker/applications'),
        priority: 2,
      },
      {
        id: 'monthly-earnings',
        title: 'This Month',
        value: `GH₵${(metrics.earningsThisMonth || 0).toLocaleString()}`,
        subtitle: 'Total earnings',
        color: '#4CAF50',
        gradient: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
        icon: <EarningsIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />,
        trend: metrics.earningsChange || 0,
        trendDirection: metrics.earningsChange > 0 ? 'up' : metrics.earningsChange < 0 ? 'down' : 'stable',
        onClick: () => navigate('/worker/earnings'),
        priority: 1,
      },
      {
        id: 'completion-rate',
        title: 'Success Rate',
        value: `${metrics.completionRate || 0}%`,
        subtitle: 'Jobs completed',
        color: '#9C27B0',
        gradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
        icon: <CompletionIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />,
        trend: metrics.completionRateChange || 0,
        trendDirection: metrics.completionRateChange > 0 ? 'up' : metrics.completionRateChange < 0 ? 'down' : 'stable',
        onClick: () => navigate('/worker/profile'),
        priority: 3,
      },
      {
        id: 'rating',
        title: 'Rating',
        value: (metrics.averageRating || 0).toFixed(1),
        subtitle: 'Average from clients',
        color: '#FF9800',
        gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
        icon: <StarIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />,
        trend: metrics.ratingChange || 0,
        trendDirection: metrics.ratingChange > 0 ? 'up' : metrics.ratingChange < 0 ? 'down' : 'stable',
        onClick: () => navigate('/worker/reviews'),
        priority: 3,
      },
      {
        id: 'profile-views',
        title: 'Profile Views',
        value: metrics.profileViews || 0,
        subtitle: 'This week',
        color: '#00BCD4',
        gradient: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)',
        icon: <VisibilityIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />,
        trend: metrics.profileViewsChange || 0,
        trendDirection: metrics.profileViewsChange > 0 ? 'up' : metrics.profileViewsChange < 0 ? 'down' : 'stable',
        onClick: () => navigate('/worker/profile'),
        priority: 4,
      },
    ];
  }, [data, navigate]);

  // Enhanced quick actions
  const quickActions = useMemo(() => [
    {
      title: 'Find Jobs',
      description: 'Browse available opportunities',
      icon: <SearchIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />,
      path: '/worker/find-work',
      color: '#2196F3',
      gradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
      priority: 1,
    },
    {
      title: 'Applications',
      description: 'Manage job applications',
      icon: <AssignmentIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />,
      path: '/worker/applications',
      color: '#4CAF50',
      gradient: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
      badgeContent: data?.metrics?.newApplications || 0,
      priority: 1,
    },
    {
      title: 'Messages',
      description: 'Chat with clients',
      icon: <MessageIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />,
      path: '/messages',
      color: '#FF9800',
      gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
      badgeContent: data?.metrics?.unreadMessages || 0,
      priority: 1,
    },
    {
      title: 'Schedule',
      description: 'Manage appointments',
      icon: <ScheduleIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />,
      path: '/worker/schedule',
      color: '#9C27B0',
      gradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
      priority: 2,
    },
    {
      title: 'Notifications',
      description: 'View all updates',
      icon: <NotificationsIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />,
      path: '/notifications',
      color: '#F44336',
      gradient: 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)',
      badgeContent: data?.metrics?.unreadNotifications || 0,
      priority: 3,
    },
  ], [data]);

  // Filter statistics for mobile view
  const visibleStats = useMemo(() => {
    if (isMobile && !showAllStats) {
      return statistics.filter(stat => stat.priority <= 2).slice(0, 2);
    }
    return statistics;
  }, [statistics, isMobile, showAllStats]);

  // Enhanced statistics card component
  const EnhancedStatCard = ({ stat, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      style={{ height: '100%' }}
    >
      <Card
        sx={{
          height: '100%',
          background: `linear-gradient(135deg, ${alpha(stat.color, 0.1)} 0%, ${alpha(stat.color, 0.05)} 100%)`,
          border: `1px solid ${alpha(stat.color, 0.2)}`,
          borderRadius: 3,
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 25px ${alpha(stat.color, 0.3)}`,
            border: `1px solid ${alpha(stat.color, 0.4)}`,
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: stat.gradient,
          },
        }}
        onClick={stat.onClick}
      >
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  mb: 0.5,
                }}
              >
                {stat.title}
              </Typography>
              
              <Typography
                variant="h4"
                sx={{
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                  lineHeight: 1.2,
                  mb: 0.5,
                }}
              >
                {stat.value}
              </Typography>
              
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                }}
              >
                {stat.subtitle}
              </Typography>
              
              {stat.trend !== 0 && (
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                  {stat.trendDirection === 'up' && (
                    <TrendingUpIcon sx={{ fontSize: 16, color: '#4CAF50' }} />
                  )}
                  {stat.trendDirection === 'down' && (
                    <TrendingDownIcon sx={{ fontSize: 16, color: '#F44336' }} />
                  )}
                  {stat.trendDirection === 'stable' && (
                    <TrendingFlatIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }} />
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      color: stat.trendDirection === 'up' ? '#4CAF50' : 
                            stat.trendDirection === 'down' ? '#F44336' : 'rgba(255,255,255,0.5)',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    }}
                  >
                    {stat.trend > 0 ? '+' : ''}{stat.trend}%
                  </Typography>
                </Stack>
              )}
            </Box>
            
            <Box
              sx={{
                width: { xs: 48, sm: 56 },
                height: { xs: 48, sm: 56 },
                borderRadius: '50%',
                background: alpha(stat.color, 0.2),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: stat.color,
                flexShrink: 0,
              }}
            >
              {stat.icon}
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Loading state
  if (loading && !data) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Grid container spacing={3}>
          {[...Array(4)].map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          Failed to load dashboard data: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      p: { xs: 1, sm: 2, md: 3 }
    }}>
      {/* Header Section */}
      <Box sx={{ mb: { xs: 2, md: 3 } }}>
        <Stack 
          direction="row" 
          alignItems="center" 
          justifyContent="space-between" 
          flexWrap="wrap"
          spacing={2}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                color: '#FFD700',
                fontWeight: 800,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                mb: 0.5,
              }}
            >
              Welcome back, {user?.firstName || 'Worker'}!
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: { xs: '0.9rem', sm: '1rem' },
              }}
            >
              Here's what's happening with your work today
            </Typography>
          </Box>
          
          <IconButton
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{
              background: alpha('#FFD700', 0.1),
              border: '1px solid rgba(255,215,0,0.3)',
              '&:hover': {
                background: alpha('#FFD700', 0.2),
              },
            }}
          >
            <RefreshIcon 
              sx={{ 
                color: '#FFD700',
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }} 
            />
          </IconButton>
        </Stack>
      </Box>

      {/* Quick Actions - Mobile First */}
      {isMobile && (
        <Box sx={{ mb: 3 }}>
          <QuickActions actions={quickActions.filter(action => action.priority <= 1)} />
        </Box>
      )}

      {/* Statistics Grid */}
      <Box sx={{ mb: { xs: 3, md: 4 } }}>
        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
          {visibleStats.map((stat, index) => (
            <Grid 
              item 
              xs={12} 
              sm={6} 
              md={4} 
              lg={statistics.length > 4 ? 2.4 : 3} 
              key={stat.id}
            >
              <EnhancedStatCard stat={stat} index={index} />
            </Grid>
          ))}
          
          {/* Show more button for mobile */}
          {isMobile && statistics.length > 2 && (
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setShowAllStats(!showAllStats)}
                sx={{
                  borderColor: 'rgba(255,215,0,0.3)',
                  color: '#FFD700',
                  '&:hover': {
                    borderColor: '#FFD700',
                    background: alpha('#FFD700', 0.1),
                  },
                }}
              >
                {showAllStats ? 'Show Less' : `Show ${statistics.length - 2} More`}
                {showAllStats ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Button>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Main Dashboard Grid */}
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Main Content Area */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={{ xs: 2, md: 3 }}>
            <AvailableJobs />
            <EarningsChart />
            {!isTablet && <Portfolio />}
          </Stack>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={{ xs: 2, md: 3 }}>
            <AvailabilityStatus />
            <ProfileCompletion />
            <UpcomingAppointments />
            
            {/* Desktop Quick Actions */}
            {!isMobile && (
              <QuickActions actions={quickActions} />
            )}
            
            <Credentials />
            
            {/* Mobile Portfolio */}
            {isTablet && <Portfolio />}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedWorkerDashboard;
