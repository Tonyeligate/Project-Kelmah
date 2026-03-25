import React from 'react';
import { Box, Typography, Button, Paper, Stack } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Lock as LockIcon } from '@mui/icons-material';
import LoadingScreen from '../../common/components/loading/LoadingScreen';
import { Helmet } from 'react-helmet-async';
import { getRoleHomePath, getUserRoles } from '../../../utils/userUtils';

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
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          textAlign: 'center',
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 0,
          overflowX: 'hidden',
          maxWidth: 1440,
          mx: 'auto',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 560,
            p: { xs: 3, sm: 4 },
            borderRadius: 5,
            border: '1px solid',
            borderColor: alpha('#FFD700', 0.2),
            background:
              'linear-gradient(160deg, rgba(14,15,20,0.98) 0%, rgba(21,23,34,0.94) 100%)',
            boxShadow: '0 28px 70px rgba(0,0,0,0.45)',
          }}
        >
          <Stack spacing={2} alignItems="center">
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: 18,
                display: 'grid',
                placeItems: 'center',
                background: 'linear-gradient(135deg, #FFD700 0%, #FFE55C 100%)',
                color: '#111',
                boxShadow: '0 18px 30px rgba(255, 215, 0, 0.18)',
              }}
            >
              <LockIcon sx={{ fontSize: 36 }} />
            </Box>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 800 }}>
                Please sign in to continue
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 380, mx: 'auto' }}>
                Sign in to open your dashboard, jobs, and messages.
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              sx={{ minHeight: 48, px: 4, fontWeight: 700 }}
            >
              Sign In
            </Button>
          </Stack>
        </Paper>
      </Box>
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
        <Box sx={{ p: 3, textAlign: 'center', minWidth: 0, overflowX: 'hidden' }}>
          <Typography variant="h5" gutterBottom>Admin Dashboard</Typography>
          <Typography variant="body1">Admin tools are available in the admin section.</Typography>
          <Button
            variant="outlined"
            onClick={() => navigate(getRoleHomePath(user))}
            sx={{
              mt: 2,
              borderColor: '#D4AF37',
              color: '#D4AF37',
              minHeight: 44,
              '&:focus-visible': {
                outline: '3px solid #D4AF37',
                outlineOffset: 2,
              },
            }}
          >
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

