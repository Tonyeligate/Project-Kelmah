import React from 'react';
import { Box, Grid, Typography, CircularProgress, useTheme } from '@mui/material';
import { useSelector } from 'react-redux';
import WorkerDashboard from '../../dashboard/components/worker/WorkerDashboard';
import workerImage from '../../../assets/cartoon-worker.jpeg';

const WorkerDashboardPage = () => {
  const theme = useTheme();
  const user = useSelector(state => state.auth.user);
  const defaultUser = { 
    firstName: 'Demo', 
    role: 'worker',
    profession: 'Professional Carpenter' 
  };
  
  // Use either the Redux user or a default user if null
  const displayUser = user || defaultUser;
  
  // Get user's professional title
  const getProfessionalTitle = () => {
    if (displayUser?.profession) return displayUser.profession;
    if (displayUser?.role === 'worker') return 'Professional Carpenter';
    return '';
  };
  
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, borderBottom: '1px solid rgba(255, 215, 0, 0.1)', pb: 2 }}>
        <Box component="img" src={workerImage} alt="Worker Avatar" sx={{ width: 80, height: 80, borderRadius: '50%', mr: 2 }} />
        <Box>
          <Typography variant="h3" fontWeight={800} color={theme.palette.secondary.main} sx={{ mb: 1, letterSpacing: 0.5 }}>
            Welcome back, {displayUser?.firstName || displayUser?.name || 'Demo'}!
          </Typography>
          <Typography variant="subtitle1" color={theme.palette.secondary.main} fontWeight={500} sx={{ mb: 2, opacity: 0.8 }}>
            {getProfessionalTitle()}
          </Typography>
          <Typography variant="h6" color={theme.palette.primary.contrastText} sx={{ opacity: 0.9 }}>
            Ready to find your next job? Let's get to work.
          </Typography>
        </Box>
      </Box>
      <WorkerDashboard user={displayUser} />
    </>
  );
};

export default WorkerDashboardPage; 





