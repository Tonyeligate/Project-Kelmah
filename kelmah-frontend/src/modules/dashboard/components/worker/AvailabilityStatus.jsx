import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Alert,
  Box,
  CircularProgress,
  FormControlLabel,
  Snackbar,
  Switch,
  Typography,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';

import DashboardCard from '../common/DashboardCard';
import workerService from '../../../worker/services/workerService';

const createMetadataState = (metadata = {}) => ({
  active: Boolean(metadata?.fallback),
  reason: metadata?.fallbackReason ?? null,
  receivedAt: metadata?.receivedAt ?? null,
});

const AvailabilityStatus = () => {
  const user = useSelector((state) => state.auth.user);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [metadata, setMetadata] = useState(createMetadataState());
  const [feedback, setFeedback] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const hasFallback = metadata.active;

  const userId = useMemo(() => {
    if (user?.id || user?._id || user?.userId) {
      return user.id || user._id || user.userId;
    }

    try {
      const { secureStorage } = require('../../../../utils/secureStorage');
      const storedUser = secureStorage.getUserData();
      return storedUser?.id || storedUser?._id || storedUser?.userId || null;
    } catch (error) {
      console.warn('Unable to access secureStorage for user data', error);
      return null;
    }
  }, [user]);

  useEffect(() => {
    const loadAvailability = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await workerService.getWorkerAvailability(userId);
        setIsAvailable(Boolean(response?.isAvailable));
        setMetadata(createMetadataState(response?.metadata));
      } catch (error) {
        console.error('Failed to fetch availability status', error);
        setFeedback({
          open: true,
          message:
            'Unable to load your availability. Showing last known state.',
          severity: 'warning',
        });
        setMetadata(
          createMetadataState({
            fallback: true,
            fallbackReason: 'fetch_error',
          }),
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadAvailability();
  }, [userId]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return null;
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch (_) {
      return null;
    }
  };

  const handleChange = async (event) => {
    if (!userId) {
      setFeedback({
        open: true,
        message: 'Missing user information. Please sign in again.',
        severity: 'error',
      });
      return;
    }

    if (hasFallback) {
      setFeedback({
        open: true,
        message:
          'Availability settings are warming up. Please try again shortly.',
        severity: 'info',
      });
      return;
    }

    const newStatus = event.target.checked;
    setIsUpdating(true);

    try {
      const response = await workerService.updateWorkerAvailability(userId, {
        isAvailable: newStatus,
      });

      setIsAvailable(newStatus);
      setMetadata(createMetadataState(response?.metadata));
      setFeedback({
        open: true,
        message: newStatus
          ? 'You are now visible to potential hirers!'
          : 'Your availability has been set to Busy.',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to update availability status', error);
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
    setFeedback((prev) => ({ ...prev, open: false }));
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

  const fallbackTimestamp = formatTimestamp(metadata.receivedAt);

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
                disabled={isUpdating || hasFallback}
              />
            }
            label={isAvailable ? 'Available' : 'Busy'}
            sx={{ mr: 1 }}
          />
        </Box>
      }
    >
      {hasFallback && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Availability data is warming up. We&apos;re showing your last known
          state.
          {metadata.reason && (
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              Reason: {metadata.reason.replace(/_/g, ' ').toLowerCase()}
              {fallbackTimestamp ? ` • Updated ${fallbackTimestamp}` : ''}
            </Typography>
          )}
        </Alert>
      )}

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
