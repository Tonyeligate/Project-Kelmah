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
  Menu as MenuIcon,
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
import workersApi from '../../../../api/services/workersApi';
import NearbyWorkersWidget from '../../../worker/components/NearbyWorkersWidget';

/**
 * Enhanced Worker Dashboard with responsive design and improved UX
 */
const EnhancedWorkerDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data = {}, loading, error } = useSelector((state) => state.dashboard);
  const theme = useTheme();

  // Force mobile design on small screens but maintain desktop functionality
  const isMobile = false; // Disabled responsive behavior as per user requirement
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
  // Check actual screen size for styling (not functionality)
  const isActualMobile = useMediaQuery('(max-width: 768px)');

  // Local state
  const [activeTab, setActiveTab] = useState(0);
  const [showQuickApply, setShowQuickApply] = useState(false);
  const [showAllStats, setShowAllStats] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [completion, setCompletion] = useState(null);
  const [availability, setAvailability] = useState({ status: 'available', isAvailable: true });

  // Load profile completeness
  useEffect(() => {
    const load = async () => {
      try {
        const c = await workersApi.getProfileCompletion();
        setCompletion(c);
      } catch (e) {
        console.warn('Failed to load profile completion', e?.message);
      }
    };
    load();
  }, []);

  // Load availability for header chips
  useEffect(() => {
    const loadAvailability = async () => {
      try {
        const id = user?.id || user?._id || user?.userId;
        if (!id) return;
        const a = await workersApi.getAvailabilityStatus(id);
        setAvailability(a);
      } catch (e) {
        console.warn('Failed to load availability', e?.message);
      }
    };
    loadAvailability();
  }, [user]);

  // Handle refresh functionality
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In a real app, this would dispatch actions to refresh data
      console.log('Dashboard refreshed');
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Dashboard statistics
  const statistics = useMemo(() => [
    {
      id: 'total-jobs',
      title: 'Total Jobs',
      value: data?.metrics?.totalJobs || 0,
      change: data?.metrics?.jobsChange || 0,
      icon: <WorkIcon />,
      color: '#2196F3',
      priority: 1,
    },
    {
      id: 'active-applications',
      title: 'Active Applications',
      value: data?.metrics?.activeApplications || 0,
      change: data?.metrics?.applicationsChange || 0,
      icon: <AssignmentIcon />,
      color: '#4CAF50',
      priority: 1,
    },
    {
      id: 'total-earnings',
      title: 'Total Earnings',
      value: `GH₵ ${data?.metrics?.totalEarnings || 0}`,
      change: data?.metrics?.earningsChange || 0,
      icon: <EarningsIcon />,
      color: '#FF9800',
      priority: 2,
    },
    {
      id: 'completion-rate',
      title: 'Completion Rate',
      value: `${data?.metrics?.completionRate || 0}%`,
      change: data?.metrics?.completionChange || 0,
      icon: <CompletionIcon />,
      color: '#9C27B0',
      priority: 2,
    },
    {
      id: 'profile-views',
      title: 'Profile Views',
      value: data?.metrics?.profileViews || 0,
      change: data?.metrics?.viewsChange || 0,
      icon: <VisibilityIcon />,
      color: '#F44336',
      priority: 3,
    },
    {
      id: 'rating',
      title: 'Average Rating',
      value: `${data?.metrics?.averageRating || 0}/5`,
      change: data?.metrics?.ratingChange || 0,
      icon: <StarIcon />,
      color: '#FFD700',
      priority: 3,
    },
  ], [data]);

  // Enhanced quick actions
  const quickActions = useMemo(
    () => [
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
    ],
    [data],
  );

  // Filter statistics for mobile view
  const visibleStats = useMemo(() => {
    if (isMobile && !showAllStats) {
      return statistics.filter((stat) => stat.priority <= 2).slice(0, 2);
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
          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            spacing={2}
          >
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
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                  sx={{ mt: 1 }}
                >
                  {stat.trendDirection === 'up' && (
                    <TrendingUpIcon sx={{ fontSize: 16, color: '#4CAF50' }} />
                  )}
                  {stat.trendDirection === 'down' && (
                    <TrendingDownIcon sx={{ fontSize: 16, color: '#F44336' }} />
                  )}
                  {stat.trendDirection === 'stable' && (
                    <TrendingFlatIcon
                      sx={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}
                    />
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      color:
                        stat.trendDirection === 'up'
                          ? '#4CAF50'
                          : stat.trendDirection === 'down'
                            ? '#F44336'
                            : 'rgba(255,255,255,0.5)',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    }}
                  >
                    {stat.trend > 0 ? '+' : ''}
                    {stat.trend}%
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

  // Safety check: don't render if user or data is not ready
  if (!user || !data || Object.keys(data).length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  // Loading state
  if (loading && !data) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Grid container spacing={3}>
          {[...Array(4)].map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton
                variant="rectangular"
                height={150}
                sx={{ borderRadius: 3 }}
              />
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

  // Mobile-first design matching the provided template
  if (isActualMobile) {
    return (
      <Box
        sx={{
          width: '100%',
          minHeight: '100vh',
          backgroundColor: '#161513',
          color: 'white',
          fontFamily: 'Manrope, "Noto Sans", sans-serif',
          overflowX: 'hidden',
        }}
      >
        {/* Mobile Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#161513',
            p: 2,
            pb: 1.5,
            pt: 1.5,
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              sx={{
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                color: '#FFD700',
                width: 40,
                height: 40,
                p: 0,
                '&:hover': {
                  backgroundColor: 'rgba(255, 215, 0, 0.2)',
                },
              }}
            >
              <MenuIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <Box>
              <Typography
                sx={{
                  color: '#FFD700',
                  fontSize: '1.125rem',
                  fontWeight: 'bold',
                  letterSpacing: '-0.015em',
                  lineHeight: 1,
                }}
              >
                Kelmah
              </Typography>
              <Typography
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.75rem',
                  lineHeight: 1,
                }}
              >
                Worker Hub
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              sx={{
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                color: '#FFD700',
                width: 40,
                height: 40,
                p: 0,
                '&:hover': {
                  backgroundColor: 'rgba(255, 215, 0, 0.2)',
                },
              }}
            >
              <NotificationsIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Welcome Section */}
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '1rem',
              fontWeight: 500,
              mb: 0.5,
            }}
          >
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.firstName || 'Worker'}! 👋
          </Typography>
          <Typography
            sx={{
              color: '#FFD700',
              fontSize: '0.875rem',
              fontWeight: 600,
              mb: 1.5,
            }}
          >
            Ready to find your next {user?.profession || 'vocational'} job?
          </Typography>
        </Box>





        {/* Quick Actions */}
        <Typography
          variant="h6"
          sx={{
            color: 'white',
            fontSize: '1.125rem',
            fontWeight: 'bold',
            letterSpacing: '-0.015em',
            px: 2,
            pb: 1,
            pt: 2,
          }}
        >
          Quick Actions
        </Typography>

        <Box
          sx={{
            display: 'flex',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'stretch', p: 2, gap: 1.5 }}>
            {[
              {
                title: 'Find Work',
                description: 'Browse carpentry, plumbing & electrical jobs',
                image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&h=200&fit=crop',
                onClick: () => navigate('/worker/find-work'),
              },
              {
                title: 'My Jobs',
                description: 'Manage active projects and applications',
                image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&h=200&fit=crop',
                onClick: () => navigate('/worker/applications'),
              },
              {
                title: 'Messages',
                description: 'Chat with potential clients',
                image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=200&fit=crop',
                onClick: () => navigate('/messages'),
              },
              {
                title: 'My Skills',
                description: 'Update certifications & portfolio',
                image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=300&h=200&fit=crop',
                onClick: () => navigate('/worker/profile'),
              },
            ].map((action, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  height: 'full',
                  flex: 1,
                  flexDirection: 'column',
                  gap: 2,
                  borderRadius: '8px',
                  minWidth: '240px',
                  cursor: 'pointer',
                }}
                onClick={action.onClick}
              >
                <Box
                  sx={{
                    width: '100%',
                    aspectRatio: '16/9',
                    backgroundImage: `url(${action.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    borderRadius: '12px',
                  }}
                />
                <Box>
                  <Typography sx={{ color: 'white', fontSize: '1rem', fontWeight: 500 }}>
                    {action.title}
                  </Typography>
                  <Typography sx={{ color: '#b2afa3', fontSize: '0.875rem' }}>
                    {action.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Top Job Matches */}
        <Typography
          variant="h6"
          sx={{
            color: 'white',
            fontSize: '1.125rem',
            fontWeight: 'bold',
            letterSpacing: '-0.015em',
            px: 2,
            pb: 1,
            pt: 2,
          }}
        >
          Top Job Matches
        </Typography>

        {/* Job Cards */}
        {[
          {
            title: 'Residential Carpenter',
            company: 'Golden Gate Construction | Accra',
            location: 'East Legon, Accra',
            pay: 'GH₵150/day',
            type: 'Full-time',
            image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&h=200&fit=crop',
          },
          {
            title: 'Plumbing Technician',
            company: 'AquaFlow Services | Kumasi',
            location: 'Asokwa, Kumasi',
            pay: 'GH₵120/day',
            type: 'Contract',
            image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
          },
          {
            title: 'Electrical Installer',
            company: 'PowerTech Ghana | Tema',
            location: 'Industrial Area, Tema',
            pay: 'GH₵180/day',
            type: 'Full-time',
            image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=300&h=200&fit=crop',
          },
        ].map((job, index) => (
          <Box key={index} sx={{ p: 2 }}>
            <Paper
              sx={{
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'space-between',
                gap: 2,
                borderRadius: '12px',
                backgroundColor: '#24231e',
                p: 2,
                boxShadow: '0 0 4px rgba(0,0,0,0.1)',
              }}
            >
              <Box sx={{ display: 'flex', flex: '2 2 0px', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography sx={{ color: '#ffd700', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      {job.type?.toUpperCase()}
                    </Typography>
                    <Typography sx={{ color: '#4CAF50', fontSize: '0.875rem', fontWeight: 'bold' }}>
                      {job.pay}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{ color: 'white', fontSize: '1rem', fontWeight: 'bold' }}
                  >
                    {job.title}
                  </Typography>
                  <Typography sx={{ color: '#b2afa3', fontSize: '0.875rem' }}>
                    {job.company}
                  </Typography>
                  <Typography sx={{ color: '#9e9e9e', fontSize: '0.75rem' }}>
                    📍 {job.location}
                  </Typography>
                </Box>
                <Button
                  sx={{
                    minWidth: '84px',
                    maxWidth: '480px',
                    height: '32px',
                    px: 2,
                    display: 'flex',
                    flexDirection: 'row-reverse',
                    backgroundColor: '#35332c',
                    color: 'white',
                    pr: 1,
                    gap: 0.5,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    width: 'fit-content',
                    borderRadius: '16px',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#3a3830',
                    },
                  }}
                >
                  <Box sx={{ color: 'white', fontSize: '18px' }}>→</Box>
                  Apply
                </Button>
              </Box>
              <Box
                sx={{
                  width: '100%',
                  aspectRatio: '16/9',
                  backgroundImage: `url(${job.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  borderRadius: '12px',
                  flex: 1,
                }}
              />
            </Paper>
          </Box>
        ))}

        {/* Add bottom padding to account for bottom navigation */}
        <Box sx={{ height: '100px' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100vw',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        p: { xs: 1, sm: 2, md: 3 },
        boxSizing: 'border-box',
        overflowX: 'hidden',
        overflowY: 'auto',
        // Mobile-specific improvements
        '@media (max-width: 768px)': {
          p: 1,
          minHeight: 'calc(100vh - 120px)', // Account for mobile navigation
        },
      }}
    >
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
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              size="small"
              label={availability?.isAvailable ? 'Available' : (availability?.status || 'Busy')}
              sx={{
                color: availability?.isAvailable ? '#4CAF50' : '#FF9800',
                borderColor: availability?.isAvailable ? 'rgba(76,175,80,0.4)' : 'rgba(255,152,0,0.4)'
              }}
              variant="outlined"
            />
            <Chip
              size="small"
              label={`${completion?.percentage ?? 0}% Complete`}
              sx={{
                color: (completion?.percentage ?? 0) >= 80 ? '#4CAF50' : '#FFD700',
                borderColor: (completion?.percentage ?? 0) >= 80 ? 'rgba(76,175,80,0.4)' : 'rgba(255,215,0,0.3)'
              }}
              variant="outlined"
            />
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
        </Stack>
      </Box>

      {/* Quick Actions - Mobile First */}
      {isMobile && (
        <Box sx={{ mb: 3 }}>
          <QuickActions
            actions={quickActions.filter((action) => action.priority <= 1)}
          />
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
                {showAllStats
                  ? 'Show Less'
                  : `Show ${statistics.length - 2} More`}
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
            <ProfileCompletion
              completion={typeof completion?.completion === 'number' ? completion.completion : 0}
              profileData={{}}
              suggestions={completion?.suggestions || completion?.suggestedNextSteps || []}
            />
            <UpcomingAppointments />

            {/* Desktop Quick Actions */}
            {!isMobile && <QuickActions actions={quickActions} />}

            <Credentials />

            {/* Mobile Portfolio */}
            {isTablet && <Portfolio />}

            {/* Nearby Workers */}
            <NearbyWorkersWidget />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedWorkerDashboard;
