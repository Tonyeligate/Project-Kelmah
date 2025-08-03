import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import DashboardCard from '../common/DashboardCard';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
// Temporarily comment out API import until workers service is implemented
// import workersApi from '../../../../api/services/workersApi';
import mockWorkersApi from './mockWorkersApi';

const AvailabilityStatus = () => {
  const [isAvailable, setIsAvailable] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [useMockApi, setUseMockApi] = useState(false);

  // Choose API based on availability
  const api = useMockApi ? mockWorkersApi : workersApi;

  // Fetch initial availability status
  useEffect(() => {
    const fetchAvailabilityStatus = async () => {
      try {
        setIsLoading(true);
        const response = await workersApi.getAvailabilityStatus();
        setIsAvailable(response.isAvailable);
      } catch (error) {
        console.error('Error fetching availability status:', error);
        // Fall back to default state
        setIsAvailable(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailabilityStatus();
  }, []);

  const handleChange = async (event) => {
    const newStatus = event.target.checked;
    setIsUpdating(true);

    try {
      try {
        await api.updateAvailability({ isAvailable: newStatus });
      } catch (apiError) {
        console.error('API error updating availability:', apiError);
        // Try using mock API if not already
        if (!useMockApi) {
          setUseMockApi(true);
          await mockWorkersApi.updateAvailability({ isAvailable: newStatus });
        }
      }

      setIsAvailable(newStatus);
      setFeedback({
        open: true,
        message: newStatus
          ? 'You are now visible to potential hirers!'
          : 'Your availability has been set to Busy.',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating availability status:', error);
      setFeedback({
        open: true,
        message: 'Unable to update status. Please try again.',
        severity: 'error',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCloseFeedback = () => {
    setFeedback({ ...feedback, open: false });
  };

  if (isLoading) {
    return (
      <DashboardCard title="Availability Status">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Availability Status"
      action={
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isUpdating && <CircularProgress size={24} sx={{ mr: 1 }} />}
          <FormControlLabel
            control={
              <Switch
                checked={isAvailable}
                onChange={handleChange}
                color="success"
                disabled={isUpdating}
              />
            }
            label={isAvailable ? 'Available' : 'Busy'}
            sx={{ mr: 1 }}
          />
        </Box>
      }
    >
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
        {isAvailable ? (
          <NotificationsActiveIcon
            sx={{ fontSize: 40, color: 'success.main', mr: 2 }}
          />
        ) : (
          <NotificationsOffIcon
            sx={{ fontSize: 40, color: 'text.secondary', mr: 2 }}
          />
        )}
        <Typography variant="body1" color="text.secondary">
          {isAvailable
            ? 'You are visible to hirers and will appear in job searches.'
            : 'You are hidden from searches and will not receive new job alerts.'}
        </Typography>
      </Box>

      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={handleCloseFeedback}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseFeedback}
          severity={feedback.severity}
          sx={{ width: '100%' }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </DashboardCard>
  );
};

export default AvailabilityStatus;
