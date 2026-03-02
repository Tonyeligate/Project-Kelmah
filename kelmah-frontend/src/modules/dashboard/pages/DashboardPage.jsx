import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useSelector } from 'react-redux';
import LoadingScreen from '../../common/components/loading/LoadingScreen';

// NOTE: dashboardSlice provides shared metrics (profile views, response rate, etc.)
// It is NOT used for role-specific dashboard data.
// Worker data → workerSlice, Hirer data → hirerSlice.
// This slice can be used by a future unified analytics page.

// Dashboard components based on role
import WorkerDashboard from '../../worker/pages/WorkerDashboardPage';
import HirerDashboard from '../../hirer/pages/HirerDashboardPage';

/**
 * Pure routing wrapper — renders the correct role-specific dashboard.
 * Data fetching is handled by each sub-dashboard independently.
 * No dashboardSlice dispatch here — avoids redundant API calls.
 */
const DashboardPage = () => {
  const { user, loading: authLoading } = useSelector((state) => state.auth);

  if (authLoading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  if (!user) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Authentication required to view dashboard
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Please sign in to access your dashboard.
        </Typography>
        <Button variant="contained" href="/login" sx={{ minHeight: 44, px: 4 }}>
          Sign In
        </Button>
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
          <Typography variant="h5" gutterBottom>Admin Dashboard</Typography>
          <Typography variant="body1">Admin dashboard is available in the admin section.</Typography>
        </Box>
      );
    default:
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error">Unknown user role: {userRole}</Typography>
        </Box>
      );
  }
};

export default DashboardPage;

