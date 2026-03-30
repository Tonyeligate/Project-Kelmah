import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Lock as LockIcon } from '@mui/icons-material';
import LoadingScreen from '../../common/components/loading/LoadingScreen';
import { Helmet } from 'react-helmet-async';
import { getRoleHomePath, getUserRoles } from '../../../utils/userUtils';
import PageCanvas from '../../common/components/PageCanvas';

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
      <PageCanvas disableContainer sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}>
        <Box sx={{ p: 3, textAlign: 'center', minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 0, overflowX: 'hidden' }}>
          <LockIcon sx={{ fontSize: 56, color: 'secondary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Please sign in to continue
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            Sign in to open your dashboard, jobs, and messages.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/login')}
            sx={{
              minHeight: 48,
              px: 4,
              bgcolor: 'secondary.main',
              color: 'secondary.contrastText',
              fontWeight: 600,
              '&:hover': { bgcolor: 'secondary.dark' },
              '&:focus-visible': {
                outline: '3px solid',
                outlineColor: 'primary.main',
                outlineOffset: 2,
              },
            }}
          >
            Sign In
          </Button>
        </Box>
      </PageCanvas>
    );
  }

  const userRole = getUserRoles(user)[0] || 'worker';

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
        <PageCanvas disableContainer sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}>
          <Box sx={{ p: 3, textAlign: 'center', minWidth: 0, overflowX: 'hidden' }}>
            <Typography variant="h5" gutterBottom>Admin Dashboard</Typography>
            <Typography variant="body1">Admin tools are available in the admin section.</Typography>
            <Button
              variant="outlined"
              onClick={() => navigate(getRoleHomePath(user))}
              sx={{
                mt: 2,
                borderColor: 'secondary.main',
                color: 'secondary.main',
                minHeight: 44,
                '&:hover': {
                  borderColor: 'secondary.dark',
                  color: 'secondary.dark',
                },
                '&:focus-visible': {
                  outline: '3px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 2,
                },
              }}
            >
              Go to Admin Panel
            </Button>
          </Box>
        </PageCanvas>
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

