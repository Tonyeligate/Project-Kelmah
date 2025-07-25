import React, { useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { useAuth } from '../../auth/contexts/AuthContext';
import LoadingScreen from '../../common/components/loading/LoadingScreen';
import { fetchDashboardData } from '../../dashboard/services/dashboardSlice';
import { useDispatch } from 'react-redux';

// Dashboard components based on role
import WorkerDashboard from '../../worker/pages/WorkerDashboardPage';
import HirerDashboard from '../../hirer/pages/HirerDashboardPage';

/**
 * Main dashboard page that renders the appropriate dashboard based on user role
 */
const DashboardPage = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, loading: authLoading } = useAuth();
  // Get data from Redux store
  const { loading: dataLoading, error: dataError } = useSelector(
    (state) => state.dashboard,
  );

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  // Show loading screen if auth or data is loading
  if (authLoading || dataLoading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  // Show error if there was a problem loading data
  if (dataError) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          There was a problem loading your dashboard
        </Typography>
        <Typography variant="body1">{dataError}</Typography>
      </Box>
    );
  }

  // Determine which dashboard to render based on user role
  const renderDashboard = () => {
    if (!user) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Authentication required to view dashboard
          </Typography>
        </Box>
      );
    }

    const userRole = user.role || user.userType || 'worker';

    switch (userRole) {
      case 'worker':
        return <WorkerDashboard user={user} />;
      case 'hirer':
        return <HirerDashboard user={user} />;
      case 'admin':
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Admin Dashboard
            </Typography>
            <Typography variant="body1">
              Admin dashboard is available in the admin section.
            </Typography>
          </Box>
        );
      default:
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="error">
              Unknown user role: {userRole}
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        padding: isMobile ? 2 : 3,
      }}
    >
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          background: 'rgba(25, 25, 25, 0.8)',
          backdropFilter: 'blur(10px)',
          borderLeft: '4px solid #FFD700',
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ color: '#FFF' }}>
          Welcome back, {user?.firstName || 'User'}!
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Here's an overview of your activities and important information.
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          {renderDashboard()}
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
