import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
  useTheme,
  useMediaQuery,
  Alert,
  AlertTitle,
  LinearProgress,
  Snackbar,
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
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import {
  fetchWorkerApplications,
  fetchWorkerJobs,
  selectWorkerApplications,
  selectWorkerJobs,
  selectWorkerLoading,
  selectWorkerError,
  clearWorkerErrors,
} from '../services/workerSlice';

const WorkerDashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { user: rawUser } = useSelector((state) => state.auth);
  const user = normalizeUser(rawUser);

  // Redux selectors for real data
  const pendingApplications = useSelector(selectWorkerApplications('pending')) || [];
  const acceptedApplications = useSelector(selectWorkerApplications('accepted')) || [];
  const rejectedApplications = useSelector(selectWorkerApplications('rejected')) || [];
  const completedJobs = useSelector(selectWorkerJobs('completed')) || [];
  const isLoading = useSelector(selectWorkerLoading('applications'));
  const error = useSelector(selectWorkerError('applications'));

  // Enhanced state for error handling and loading feedback
  const [retryCount, setRetryCount] = useState(0);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const loadingTimeoutRef = useRef(null);
  const MAX_RETRIES = 3;
  const LOADING_TIMEOUT = 15000; // 15 seconds

  const getAmountValue = useCallback((value) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value.replace(/[^0-9.-]/g, ''));
      return Number.isFinite(parsed) ? parsed : 0;
    }

    if (value && typeof value === 'object') {
      const candidates = [
        value.amount,
        value.total,
        value.max,
        value.min,
        value.fixed,
        value.value,
      ];

      for (const candidate of candidates) {
        const normalized = getAmountValue(candidate);
        if (normalized > 0) {
          return normalized;
        }
      }
    }

    return 0;
  }, []);

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, []);

  // Fetch data with retry logic
  const fetchDashboardData = useCallback(async () => {
    setLoadingTimeout(false);

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    const timeoutId = setTimeout(() => {
      setLoadingTimeout(true);
    }, LOADING_TIMEOUT);
    loadingTimeoutRef.current = timeoutId;

    try {
      await Promise.all([
        dispatch(fetchWorkerApplications('pending')),
        dispatch(fetchWorkerApplications('accepted')),
        dispatch(fetchWorkerApplications('rejected')),
        dispatch(fetchWorkerJobs('completed')),
      ]);
      clearTimeout(timeoutId);
      if (loadingTimeoutRef.current === timeoutId) {
        loadingTimeoutRef.current = null;
      }
      setLoadingTimeout(false);
      if (retryCount > 0) {
        setSnackbarMessage('Dashboard data loaded successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (loadingTimeoutRef.current === timeoutId) {
        loadingTimeoutRef.current = null;
      }
      console.error('Dashboard data fetch error:', err);
    }
  }, [dispatch, retryCount]);

  // Initial fetch on mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const earningsSummary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const previousMonth = previousMonthDate.getMonth();
    const previousMonthYear = previousMonthDate.getFullYear();

    const completedTotals = (Array.isArray(completedJobs) ? completedJobs : []).reduce(
      (acc, job) => {
        const amount = getAmountValue(
          job?.payment?.amount ||
            job?.paymentAmount ||
            job?.finalAmount ||
            job?.budget,
        );

        const referenceDate = new Date(
          job?.completedAt || job?.updatedAt || job?.createdAt || Date.now(),
        );

        if (
          referenceDate.getMonth() === currentMonth &&
          referenceDate.getFullYear() === currentYear
        ) {
          acc.thisMonth += amount;
        }

        if (
          referenceDate.getMonth() === previousMonth &&
          referenceDate.getFullYear() === previousMonthYear
        ) {
          acc.lastMonth += amount;
        }

        acc.total += amount;
        return acc;
      },
      { total: 0, thisMonth: 0, lastMonth: 0 },
    );

    const pendingEarnings = (Array.isArray(pendingApplications) ? pendingApplications : []).reduce(
      (sum, application) => sum + getAmountValue(application?.proposedRate),
      0,
    );

    const fallbackTotal = getAmountValue(user?.totalEarnings);
    const total = Math.max(completedTotals.total, fallbackTotal);

    return {
      total,
      thisMonth: completedTotals.thisMonth,
      lastMonth: completedTotals.lastMonth,
      pending: pendingEarnings,
      withdrawn: 0,
    };
  }, [completedJobs, pendingApplications, user, getAmountValue]);

  // Calculate real stats from Redux state
  const stats = useMemo(() => ({
    applications: pendingApplications.length + acceptedApplications.length,
    completedJobs: completedJobs.length,
    earnings: earningsSummary.total,
    rating: user?.rating || 0,
  }), [pendingApplications, acceptedApplications, completedJobs, earningsSummary, user]);

  // Handle refresh with retry logic
  const handleRefresh = useCallback(() => {
    dispatch(clearWorkerErrors());
    setRetryCount(prev => prev + 1);
    fetchDashboardData();
  }, [dispatch, fetchDashboardData]);

  // Auto-retry on error (up to MAX_RETRIES)
  useEffect(() => {
    if (error && retryCount < MAX_RETRIES && !isLoading) {
      const retryTimer = setTimeout(() => {
        setSnackbarMessage(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        setSnackbarSeverity('info');
        setSnackbarOpen(true);
        handleRefresh();
      }, 3000 * (retryCount + 1)); // Exponential backoff
      return () => clearTimeout(retryTimer);
    }
  }, [error, retryCount, isLoading, handleRefresh]);

  // Chart data for Earnings Overview - derived from actual jobs/applications state
  const earningsData = useMemo(() => [
    { name: 'This Month', value: earningsSummary.thisMonth, color: '#4CAF50' },
    { name: 'Last Month', value: earningsSummary.lastMonth, color: '#2196F3' },
    { name: 'Pending', value: earningsSummary.pending, color: '#FF9800' },
    { name: 'Withdrawn', value: earningsSummary.withdrawn, color: '#9C27B0' },
  ], [earningsSummary]);

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

  // Enhanced error display with retry functionality
  const ErrorDisplay = () => (
    <Box sx={{ mb: 3 }}>
      <Alert
        severity={retryCount >= MAX_RETRIES ? "error" : "warning"}
        icon={<ErrorOutlineIcon />}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={handleRefresh}
            disabled={isLoading}
            startIcon={isLoading ? <RefreshIcon sx={{ animation: 'spin 1s linear infinite' }} /> : <RefreshIcon />}
          >
            {isLoading ? 'Retrying...' : 'Try Again'}
          </Button>
        }
        sx={{
          borderRadius: 2,
          '& .MuiAlert-message': { width: '100%' }
        }}
      >
        <AlertTitle sx={{ fontWeight: 600 }}>
          {retryCount >= MAX_RETRIES ? 'Unable to Load Dashboard' : 'Loading Issue Detected'}
        </AlertTitle>
        <Typography variant="body2" sx={{ mb: 1 }}>
          {error || 'Failed to fetch worker applications'}
        </Typography>
        {retryCount < MAX_RETRIES && (
          <Typography variant="caption" color="text.secondary">
            Auto-retry in {3 * (retryCount + 1)} seconds ({retryCount}/{MAX_RETRIES} attempts)
          </Typography>
        )}
        {retryCount >= MAX_RETRIES && (
          <Typography variant="caption" color="text.secondary">
            Please check your internet connection or try again later.
          </Typography>
        )}
      </Alert>
    </Box>
  );

  // Loading timeout warning
  const LoadingTimeoutWarning = () => (
    <Alert
      severity="warning"
      sx={{ mb: 2, borderRadius: 2 }}
      action={
        <Button color="inherit" size="small" onClick={handleRefresh}>
          Refresh
        </Button>
      }
    >
      <AlertTitle>Loading Taking Longer Than Expected</AlertTitle>
      <Typography variant="body2">
        The server might be warming up. Please wait or try refreshing.
      </Typography>
    </Alert>
  );

  return (
    <Box sx={{ backgroundColor: '#FAFAFA', minHeight: '100vh', p: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
          icon={snackbarSeverity === 'success' ? <CheckCircleIcon /> : undefined}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Loading Progress Bar */}
      {isLoading && (
        <LinearProgress
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1200,
            height: 3,
          }}
        />
      )}

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

      {/* Error Display - Shows inline instead of blocking */}
      {error && <ErrorDisplay />}

      {/* Loading Timeout Warning */}
      {loadingTimeout && isLoading && <LoadingTimeoutWarning />}

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
            <Box sx={{ height: { xs: 220, md: 280 } }}>
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
            <Box sx={{ height: { xs: 220, md: 280 } }}>
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
