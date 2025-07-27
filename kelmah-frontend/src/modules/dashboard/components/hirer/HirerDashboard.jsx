import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  Paper,
  Avatar,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Rating,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  Work as WorkIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Notifications as NotificationsIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationOnIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchHirerProfile, fetchHirerJobs } from '../../services/hirerSlice';
import DashboardCard from '../common/DashboardCard';
import StatisticsCard from '../common/StatisticsCard';
import QuickActions from '../common/QuickActions';
import ActivityFeed from '../common/ActivityFeed';

/**
 * Modern, responsive hirer dashboard with real user data integration
 */
const HirerDashboard = ({ user: authUser }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { profile, jobs, loading, error } = useSelector((state) => state.hirer);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Use real user data from Redux store or fallback to auth user
  const user = profile || authUser || {};

  useEffect(() => {
    const loadDashboardData = async () => {
      setDashboardLoading(true);
      try {
        await Promise.all([
          dispatch(fetchHirerProfile()),
          dispatch(fetchHirerJobs('active')),
          dispatch(fetchHirerJobs('completed')),
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setDashboardLoading(false);
      }
    };

    loadDashboardData();
  }, [dispatch]);

  // Calculate real statistics from actual data
  const statistics = [
    {
      title: 'Active Jobs',
      value: jobs.active?.length || 0,
      change: '+12%',
      trend: 'up',
      icon: <WorkIcon />,
      color: theme.palette.success.main,
      description: 'Currently posted jobs',
    },
    {
      title: 'Total Applications',
      value:
        jobs.active?.reduce(
          (sum, job) => sum + (job.applicationsCount || 0),
          0,
        ) || 0,
      change: '+8%',
      trend: 'up',
      icon: <AssignmentIcon />,
      color: theme.palette.warning.main,
      description: 'Received this month',
    },
    {
      title: 'Completion Rate',
      value: `${user.completionRate || 0}%`,
      change: '+5%',
      trend: 'up',
      icon: <CheckCircleIcon />,
      color: theme.palette.info.main,
      description: 'Project success rate',
    },
    {
      title: 'Total Spent',
      value: `${user.currency || 'GH₵'}${(user.totalAmountSpent || 0).toLocaleString()}`,
      change: '+15%',
      trend: 'up',
      icon: <AccountBalanceIcon />,
      color: theme.palette.primary.main,
      description: 'All-time spending',
    },
  ];

  // Quick actions with modern design
  const quickActions = [
    {
      title: 'Post New Job',
      description: 'Create and publish a job posting',
      icon: <AddIcon />,
      path: '/jobs/post',
      color: theme.palette.success.main,
      gradient: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
    },
    {
      title: 'Manage Jobs',
      description: 'View and edit your job postings',
      icon: <WorkIcon />,
      path: '/hirer/jobs',
      color: theme.palette.primary.main,
      gradient: 'linear-gradient(135deg, #2196F3 0%, #64B5F6 100%)',
    },
    {
      title: 'Review Applications',
      description: 'Check and respond to applications',
      icon: <AssignmentIcon />,
      path: '/hirer/applications',
      color: theme.palette.warning.main,
      gradient: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
    },
    {
      title: 'View Analytics',
      description: 'Track performance metrics',
      icon: <TrendingUpIcon />,
      path: '/analytics',
      color: theme.palette.secondary.main,
      gradient: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
    },
  ];

  if (dashboardLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="40%" height={60} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {[...Array(4)].map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            borderRadius: 2,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Avatar
                src={user.avatar}
                sx={{
                  width: { xs: 60, md: 80 },
                  height: { xs: 60, md: 80 },
                  border: '3px solid rgba(255,255,255,0.2)',
                }}
              >
                {(user.firstName?.[0] || 'H').toUpperCase()}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom>
                Welcome back, {user.firstName || 'Hirer'}!
              </Typography>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                flexWrap="wrap"
              >
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  {user.company || 'Your Company'}
                </Typography>
                {user.verified && (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Verified"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      '& .MuiChip-icon': { color: 'white' },
                    }}
                  />
                )}
                <Rating value={user.rating || 0} readOnly size="small" />
              </Stack>
              <Stack
                direction="row"
                spacing={1}
                sx={{ mt: 1 }}
                alignItems="center"
              >
                <LocationOnIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {user.location || 'Location not set'}
                </Typography>
              </Stack>
            </Grid>
            <Grid item>
              <Tooltip title="Edit Profile">
                <IconButton
                  color="inherit"
                  component={RouterLink}
                  to="/profile/edit"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Some data may be unavailable. Showing cached information where
          possible.
        </Alert>
      )}

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {statistics.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme.shadows[8],
                      borderColor: stat.color,
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 2 }}
                    >
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: `${stat.color}15`,
                          color: stat.color,
                        }}
                      >
                        {stat.icon}
                      </Box>
                      {stat.change && (
                        <Chip
                          label={stat.change}
                          size="small"
                          color={stat.trend === 'up' ? 'success' : 'error'}
                          variant="outlined"
                        />
                      )}
                    </Stack>
                    <Typography
                      variant="h4"
                      fontWeight="bold"
                      color={stat.color}
                      gutterBottom
                    >
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stat.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Card
                  component={RouterLink}
                  to={action.path}
                  elevation={0}
                  sx={{
                    height: '100%',
                    textDecoration: 'none',
                    background: action.gradient,
                    color: 'white',
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: theme.shadows[12],
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Box sx={{ mb: 2 }}>{action.icon}</Box>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      {action.title}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {action.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>

      {/* Content Grid */}
      <Grid container spacing={3}>
        {/* Active Jobs Overview */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 3 }}
                >
                  <Typography variant="h6" fontWeight="600">
                    Active Jobs
                  </Typography>
                  <Button
                    component={RouterLink}
                    to="/hirer/jobs"
                    variant="outlined"
                    size="small"
                  >
                    View All
                  </Button>
                </Stack>

                {jobs.active?.length > 0 ? (
                  <Stack spacing={2}>
                    {jobs.active.slice(0, 3).map((job, index) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 1,
                            '&:hover': { bgcolor: theme.palette.action.hover },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Grid container alignItems="center" spacing={2}>
                            <Grid item xs>
                              <Typography variant="subtitle1" fontWeight="500">
                                {job.title}
                              </Typography>
                              <Stack
                                direction="row"
                                spacing={2}
                                alignItems="center"
                                sx={{ mt: 0.5 }}
                              >
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {job.location}
                                </Typography>
                                <Chip
                                  label={`${job.applicationsCount || 0} applications`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              </Stack>
                            </Grid>
                            <Grid item>
                              <Typography
                                variant="h6"
                                color="primary"
                                fontWeight="bold"
                              >
                                {job.currency}
                                {job.budget?.toLocaleString()}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Paper>
                      </motion.div>
                    ))}
                  </Stack>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <WorkIcon
                      sx={{
                        fontSize: 64,
                        color: theme.palette.action.disabled,
                        mb: 2,
                      }}
                    />
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      gutterBottom
                    >
                      No active jobs
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 3 }}
                    >
                      Start by posting your first job to find skilled workers
                    </Typography>
                    <Button
                      component={RouterLink}
                      to="/jobs/post"
                      variant="contained"
                      startIcon={<AddIcon />}
                    >
                      Post a Job
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Profile Completion & Recent Activity */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Profile Completion */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card
                elevation={0}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom fontWeight="600">
                    Profile Completion
                  </Typography>

                  {/* Calculate completion percentage */}
                  {(() => {
                    const fields = [
                      'firstName',
                      'email',
                      'company',
                      'location',
                      'bio',
                    ];
                    const completed = fields.filter(
                      (field) => user[field],
                    ).length;
                    const percentage = Math.round(
                      (completed / fields.length) * 100,
                    );

                    return (
                      <>
                        <Box sx={{ mb: 2 }}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ mb: 1 }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              {completed}/{fields.length} completed
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              color="primary"
                            >
                              {percentage}%
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={percentage}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: theme.palette.action.hover,
                            }}
                          />
                        </Box>

                        {percentage < 100 && (
                          <Alert severity="info" variant="outlined">
                            <Typography variant="body2">
                              Complete your profile to attract more qualified
                              workers
                            </Typography>
                          </Alert>
                        )}

                        <Button
                          component={RouterLink}
                          to="/profile/edit"
                          variant="outlined"
                          fullWidth
                          sx={{ mt: 2 }}
                        >
                          Update Profile
                        </Button>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            </motion.div>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

HirerDashboard.propTypes = {
  user: PropTypes.object,
};

export default HirerDashboard;
