import React from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useSelector } from 'react-redux';
import WorkerDashboard from '../../dashboard/components/worker/WorkerDashboard';
import workerImage from '../../../assets/cartoon-worker.jpeg';

const WorkerDashboardPage = () => {
  const theme = useTheme();
  const isSm = false; // Disabled responsive behavior as per user requirement
  const isActualMobile = useMediaQuery('(max-width: 768px)'); // Check actual screen size for styling
  const user = useSelector((state) => state.auth.user);
  const defaultUser = {
    firstName: 'Demo',
    role: 'worker',
    profession: 'Professional Carpenter',
  };

  // Use either the Redux user or a default user if null
  const displayUser = user || defaultUser;

  // Get user's professional title
  const getProfessionalTitle = () => {
    if (displayUser?.profession) return displayUser.profession;
    if (displayUser?.role === 'worker') return 'Professional Carpenter';
    return '';
  };

  // On mobile, render only the WorkerDashboard component (it has its own mobile header)
  if (isActualMobile) {
    return <WorkerDashboard user={displayUser} />;
  }

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: isSm ? 'column' : 'row',
          alignItems: 'center',
          textAlign: isSm ? 'center' : 'left',
          mb: 4,
          pb: 2,
          backgroundColor: 'rgba(255,255,255,0.05)',
          color: theme.palette.common.white,
          borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
          borderRadius: 2,
          p: 2,
        }}
      >
        <Box
          component="img"
          src={workerImage}
          alt="Worker Avatar"
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            mb: isSm ? 2 : 0,
            mr: isSm ? 0 : 2,
          }}
        />
        <Box>
          <Typography
            variant={isSm ? 'h5' : 'h3'}
            fontWeight={800}
            color={theme.palette.secondary.main}
            sx={{ mb: 1, letterSpacing: 0.5 }}
          >
            Welcome back,{' '}
            {displayUser?.firstName || displayUser?.name || 'Demo'}!
          </Typography>
          <Typography
            variant={isSm ? 'body2' : 'subtitle1'}
            color={theme.palette.secondary.main}
            fontWeight={500}
            sx={{ mb: 1, opacity: 0.8 }}
          >
            {getProfessionalTitle()}
          </Typography>
          <Typography
            variant={isSm ? 'body2' : 'h6'}
            color={theme.palette.primary.contrastText}
            sx={{ opacity: 0.9 }}
          >
            Ready to find your next job? Let's get to work.
          </Typography>
        </Box>
      </Box>
      <WorkerDashboard user={displayUser} />
    </>
  );
};

export default WorkerDashboardPage;
