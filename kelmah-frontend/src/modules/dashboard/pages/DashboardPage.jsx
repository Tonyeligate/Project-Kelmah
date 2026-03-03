import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Lock as LockIcon } from '@mui/icons-material';
import LoadingScreen from '../../common/components/loading/LoadingScreen';
import { Helmet } from 'react-helmet-async';

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
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSelector((state) => state.auth);

  if (authLoading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  if (!user) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <LockIcon sx={{ fontSize: 56, color: '#D4AF37', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Please sign in
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Sign in to see your dashboard.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/login')}
          sx={{ minHeight: 48, px: 4, bgcolor: '#D4AF37', color: '#000', fontWeight: 600, '&:hover': { bgcolor: '#B8941F' } }}
        >
          Sign In
        </Button>
      </Box>
    );
  }

  const userRole = user.role || user.userType || 'worker';

  let dashboard;
  switch (userRole) {
    case 'worker':
      dashboard = <WorkerDashboard user={user} />;
      break;
    case 'hirer':
      dashboard = <HirerDashboard user={user} />;
      break;
    case 'admin':
      dashboard = (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>Admin Dashboard</Typography>
          <Typography variant="body1">Admin dashboard is available in the admin section.</Typography>
          <Button variant="outlined" onClick={() => navigate('/admin')} sx={{ mt: 2, borderColor: '#D4AF37', color: '#D4AF37' }}>
            Go to Admin Panel
          </Button>
        </Box>
      );
      break;
    default:
      dashboard = <WorkerDashboard user={user} />;
  }

  return (
    <>
      <Helmet><title>Dashboard | Kelmah</title></Helmet>
      {dashboard}
    </>
  );
};

export default DashboardPage;

