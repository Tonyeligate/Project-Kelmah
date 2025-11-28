import React, { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { normalizeUser } from '../../../utils/userUtils';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Breadcrumbs,
  Link,
  Tooltip,
  IconButton,
  Skeleton,
  Button,
  Chip,
  useTheme,
  useMediaQuery,
  Alert,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import WorkIcon from '@mui/icons-material/Work';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StarIcon from '@mui/icons-material/Star';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import {
  fetchWorkerApplications,
  fetchWorkerJobs,
  selectWorkerApplications,
  selectWorkerJobs,
  selectWorkerLoading,
  selectWorkerError,
} from '../services/workerSlice';

const WorkerDashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { user: rawUser } = useSelector((state) => state.auth);
  const user = normalizeUser(rawUser);

  // Redux selectors for real data
  const pendingApplications = useSelector(selectWorkerApplications('pending')) || [];
  const acceptedApplications = useSelector(selectWorkerApplications('accepted')) || [];
  const rejectedApplications = useSelector(selectWorkerApplications('rejected')) || [];
  const activeJobs = useSelector(selectWorkerJobs('active')) || [];
  const completedJobs = useSelector(selectWorkerJobs('completed')) || [];
  const isLoading = useSelector(selectWorkerLoading('applications'));
  const error = useSelector(selectWorkerError('applications'));

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchWorkerApplications('pending'));
    dispatch(fetchWorkerApplications('accepted'));
    dispatch(fetchWorkerApplications('rejected'));
    dispatch(fetchWorkerJobs('active'));
    dispatch(fetchWorkerJobs('completed'));
  }, [dispatch]);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Calculate real stats from Redux state
  const stats = useMemo(() => ({
    applications: pendingApplications.length + acceptedApplications.length,
    completedJobs: completedJobs.length,
    earnings: user?.totalEarnings || 0,
    rating: user?.rating || 0,
  }), [pendingApplications, acceptedApplications, completedJobs, user]);

  // Handle refresh
  const handleRefresh = () => {
    dispatch(fetchWorkerApplications('pending'));
    dispatch(fetchWorkerApplications('accepted'));
    dispatch(fetchWorkerJobs('completed'));
  };

  // Chart data for Earnings Overview - using real or fallback data
  const earningsData = useMemo(() => [
    { name: 'This Month', value: user?.monthlyEarnings || 0, color: '#4CAF50' },
    { name: 'Last Month', value: user?.lastMonthEarnings || 0, color: '#2196F3' },
    { name: 'Pending', value: user?.pendingEarnings || 0, color: '#FF9800' },
    { name: 'Withdrawn', value: user?.withdrawnEarnings || 0, color: '#9C27B0' },
  ], [user]);

  // Chart data for Applications Overview - using real data
  const applicationsData = useMemo(() => [
    { name: 'Accepted', value: acceptedApplications.length || 0, color: '#4CAF50' },
    { name: 'Pending', value: pendingApplications.length || 0, color: '#FF9800' },
    { name: 'Rejected', value: rejectedApplications.length || 0, color: '#F44336' },
  ], [acceptedApplications, pendingApplications, rejectedApplications]);

  // Metric cards configuration - LC Portal style with tooltips
  const metricCards = [
    {
      title: 'Active Applications',
      value: stats.applications,
      bgGradient: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
      icon: <WorkIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />,
      tooltip: 'Total number of job applications you have submitted',
      onClick: () => navigate('/worker/applications'),
    },
    {
      title: 'Completed Jobs',
      value: stats.completedJobs,
      bgGradient: 'linear-gradient(135deg, #009688 0%, #4DB6AC 100%)',
      icon: <AssignmentTurnedInIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />,
      tooltip: 'Jobs you have successfully completed',
      onClick: () => navigate('/worker/contracts'),
    },
    {
      title: 'Total Earnings',
      value: `GH₵${stats.earnings.toLocaleString()}`,
      bgGradient: 'linear-gradient(135deg, #2196F3 0%, #64B5F6 100%)',
      icon: <AttachMoneyIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />,
      tooltip: 'Your total earnings from completed jobs',
      onClick: () => navigate('/worker/earnings'),
    },
    {
      title: 'Average Rating',
      value: stats.rating > 0 ? stats.rating.toFixed(1) : 'N/A',
      bgGradient: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
      icon: <StarIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />,
      tooltip: 'Your average rating from hirers',
      onClick: () => navigate('/worker/reviews'),
    },
  ];

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {[1, 2, 3, 4].map((item) => (
        <Grid item xs={12} sm={6} md={3} key={item}>
          <Skeleton variant="rounded" height={120} animation="wave" />
        </Grid>
      ))}
    </Grid>
  );

  // Show error alert if there's an error
  if (error) {
    return (
      <Box sx={{ backgroundColor: '#FAFAFA', minHeight: '100vh', p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={handleRefresh}>
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#FAFAFA', minHeight: '100vh', p: 3 }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" sx={{ color: '#999' }} />}
        sx={{ mb: 2 }}
        aria-label="breadcrumb navigation"
      >
        <Link
          component={RouterLink}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: '#666',
            textDecoration: 'none',
            '&:hover': { color: '#1976D2' },
          }}
        >
          <HomeIcon sx={{ fontSize: 18, mr: 0.5 }} />
          Home
        </Link>
        <Typography sx={{ color: '#333', fontWeight: 500 }}>
          Dashboard
        </Typography>
      </Breadcrumbs>

      {/* Header with Greeting and Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography
          variant="h5"
          sx={{
            color: '#333',
            fontWeight: 600,
          }}
        >
          {getGreeting()}, {user?.firstName || 'Worker'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Find new jobs to apply for" arrow>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={() => navigate('/worker/find-work')}
              sx={{
                bgcolor: '#1976D2',
                '&:hover': { bgcolor: '#1565C0' },
              }}
            >
              {isMobile ? 'Find Work' : 'Find New Jobs'}
            </Button>
          </Tooltip>
          <Tooltip title="Refresh dashboard data" arrow>
            <IconButton
              onClick={handleRefresh}
              disabled={isLoading}
              sx={{ color: '#666' }}
              aria-label="Refresh dashboard"
            >
              <RefreshIcon sx={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Loading State */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Metric Cards - 4 colored cards LC Portal style */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {metricCards.map((card, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Tooltip title={card.tooltip} arrow placement="top">
                  <Paper
                    elevation={0}
                    onClick={card.onClick}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      background: card.bgGradient,
                      color: '#fff',
                      position: 'relative',
                      overflow: 'hidden',
                      height: 120,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      },
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${card.title}: ${card.value}. Click to view details.`}
                    onKeyDown={(e) => e.key === 'Enter' && card.onClick()}
                  >
                    {/* Icon positioned on the right */}
                    <Box
                      sx={{
                        position: 'absolute',
                        right: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                    >
                      {card.icon}
                    </Box>

                    {/* Text content */}
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 500, opacity: 0.9, mb: 1 }}
                    >
                      {card.title}
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700 }}
                    >
                      {card.value}
                    </Typography>
                  </Paper>
                </Tooltip>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Charts Section - 2 charts side by side */}
      <Grid container spacing={3}>
        {/* Earnings Overview Chart */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: '#fff',
              border: '1px solid #E0E0E0',
            }}
          >
            <Typography
              variant="h6"
              sx={{ color: '#333', fontWeight: 600, mb: 2 }}
            >
              Earnings Overview
            </Typography>
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={earningsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {earningsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value) => [`GH₵${value}`, '']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E0E0E0',
                      borderRadius: 8,
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span style={{ color: '#666', fontSize: 12 }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Applications Overview Chart */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: '#fff',
              border: '1px solid #E0E0E0',
            }}
          >
            <Typography
              variant="h6"
              sx={{ color: '#333', fontWeight: 600, mb: 2 }}
            >
              Applications Overview
            </Typography>
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={applicationsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {applicationsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E0E0E0',
                      borderRadius: 8,
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span style={{ color: '#666', fontSize: 12 }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WorkerDashboardPage;
