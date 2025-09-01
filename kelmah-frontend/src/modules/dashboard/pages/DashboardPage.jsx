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
  const isMobile = false; // Disabled responsive behavior as per user requirement
  const isActualMobile = useMediaQuery('(max-width: 768px)'); // Check actual screen size
  const { user, loading: authLoading } = useAuth();
  // Get data from Redux store
  const { loading: dataLoading, error: dataError } = useSelector(
    (state) => state.dashboard,
  );

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, []); // Fixed: Remove dispatch dependency to prevent infinite loop

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

  // On mobile, render dashboard component directly without wrapper
  if (isActualMobile) {
    return renderDashboard();
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        width: '100%',
        maxWidth: '100vw',
        padding: isMobile ? 1 : 3,
        boxSizing: 'border-box',
        overflowX: 'hidden',
        overflowY: 'auto',
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
