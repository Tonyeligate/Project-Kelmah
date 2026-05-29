import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
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
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const accentColor = theme.palette.primary.main || '#FFD34D';
    
    return (
      <PageCanvas
        disableContainer
        sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}
      >
        <Box
          sx={{
            p: 3,
            textAlign: 'center',
            minHeight: '50vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 0,
            overflowX: 'hidden',
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: alpha(accentColor, 0.15),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              border: `2px solid ${alpha(accentColor, 0.3)}`,
              boxShadow: `0 8px 24px ${alpha(accentColor, 0.2)}`,
            }}
          >
            <LockIcon sx={{ fontSize: 40, color: accentColor }} />
          </Box>
          <Typography 
            variant="h5" 
            gutterBottom 
            sx={{ 
              fontWeight: 700,
              color: 'text.primary',
              mb: 1
            }}
          >
            Please sign in to continue
          </Typography>
          <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
            Sign in to access your dashboard, manage jobs, track contracts, and connect with opportunities.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/login')}
            sx={{
              minHeight: 48,
              px: 4,
              borderRadius: '24px',
              bgcolor: accentColor,
              color: isDarkMode ? '#000' : '#171A1F',
              fontWeight: 700,
              fontSize: '16px',
              textTransform: 'none',
              '&:hover': { 
                bgcolor: isDarkMode ? alpha(accentColor, 0.9) : alpha(accentColor, 0.85),
                boxShadow: `0 8px 16px ${alpha(accentColor, 0.3)}`,
              },
              '&:focus-visible': {
                outline: '3px solid',
                outlineColor: accentColor,
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
      dashboard = (() => {
        const theme = useTheme();
        const isDarkMode = theme.palette.mode === 'dark';
        const accentColor = theme.palette.primary.main || '#FFD34D';
        
        return (
          <PageCanvas
            disableContainer
            sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}
          >
            <Box
              sx={{ 
                p: 4, 
                textAlign: 'center', 
                minWidth: 0, 
                overflowX: 'hidden',
                maxWidth: 600,
                mx: 'auto'
              }}
            >
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  backgroundColor: alpha(accentColor, 0.15),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3,
                  mx: 'auto',
                  border: `2px solid ${alpha(accentColor, 0.3)}`,
                  boxShadow: `0 8px 24px ${alpha(accentColor, 0.2)}`,
                }}
              >
                <LockIcon sx={{ fontSize: 36, color: accentColor }} />
              </Box>
              <Typography 
                variant="h5" 
                gutterBottom 
                sx={{ 
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: 1
                }}
              >
                Admin Dashboard
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'text.secondary',
                  mb: 4,
                  maxWidth: 400,
                  mx: 'auto'
                }}
              >
                Admin tools and management features are available in the dedicated admin panel.
              </Typography>
              <Button
                variant="outlined"
                onClick={() => navigate(getRoleHomePath(user))}
                sx={{
                  mt: 2,
                  borderRadius: '24px',
                  borderColor: accentColor,
                  color: accentColor,
                  minHeight: 48,
                  px: 4,
                  fontWeight: 700,
                  fontSize: '16px',
                  textTransform: 'none',
                  borderWidth: 2,
                  '&:hover': {
                    borderColor: isDarkMode ? alpha(accentColor, 0.9) : alpha(accentColor, 0.85),
                    backgroundColor: alpha(accentColor, 0.08),
                    boxShadow: `0 4px 12px ${alpha(accentColor, 0.2)}`,
                  },
                  '&:focus-visible': {
                    outline: '3px solid',
                    outlineColor: accentColor,
                    outlineOffset: 2,
                  },
                }}
              >
                Go to Admin Panel
              </Button>
            </Box>
          </PageCanvas>
        );
      })();
      break;
    default:
      dashboard = <WorkerDashboard user={user} />;
  }

  return (
    <>
      <Helmet>
        <title>Dashboard | Kelmah</title>
      </Helmet>
      {dashboard}
    </>
  );
};

export default DashboardPage;
