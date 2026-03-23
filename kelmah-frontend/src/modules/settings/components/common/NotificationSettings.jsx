import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Stack,
} from '@mui/material';
import PropTypes from 'prop-types';
import SettingsSection from '../SettingsSection';

const NotificationSettings = ({
  settings = null,
  loading = false,
  updateNotificationPreferences,
}) => {
  const [localSettings, setLocalSettings] = useState({
    email: false,
    push: false,
    sms: false,
    inApp: true,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (settings?.notifications) {
      setLocalSettings((prev) => ({
        ...prev,
        ...settings.notifications,
      }));
    }
  }, [settings]);

  const handleChange = (event) => {
    const { name, checked } = event.target;
    setLocalSettings((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSave = async () => {
    try {
      await updateNotificationPreferences(localSettings);
      setSnackbar({
        open: true,
        message: 'Settings saved successfully!',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error saving settings',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const rows = [
    {
      name: 'email',
      label: 'Email notifications',
      helper: 'Application decisions, contract updates, and important account alerts.',
    },
    {
      name: 'push',
      label: 'Push notifications',
      helper: 'Instant mobile alerts when a hirer messages you or updates a job.',
    },
    {
      name: 'inApp',
      label: 'In-app notifications',
      helper: 'Alerts inside Kelmah for messages, jobs, and workflow reminders.',
    },
    {
      name: 'sms',
      label: 'SMS notifications',
      helper: 'Only use for urgent reminders. SMS delivery may depend on your network.',
    },
  ];

  return (
    <>
      <SettingsSection
        title="Notification Settings"
        description="Choose the channels Kelmah should use when jobs, contracts, or conversations need your attention."
        loading={loading}
      >
        <Stack spacing={1.5}>
          {rows.map((row) => (
            <Box
              key={row.name}
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.default',
              }}
            >
              <FormControlLabel
                sx={{ alignItems: 'flex-start', m: 0, width: '100%', justifyContent: 'space-between' }}
                control={(
                  <Switch
                    checked={Boolean(localSettings[row.name])}
                    onChange={handleChange}
                    name={row.name}
                    inputProps={{
                      'aria-label': `${row.label} toggle`,
                    }}
                  />
                )}
                label={(
                  <Box sx={{ pr: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {row.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                      {row.helper}
                    </Typography>
                  </Box>
                )}
                labelPlacement="start"
              />
            </Box>
          ))}
        </Stack>
        <Alert severity="info" sx={{ mt: 2 }}>
          Notification categories such as jobs, messages, and promotions will use these channel preferences.
        </Alert>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={handleSave} disabled={loading} sx={{ minHeight: 44 }}>
            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </Box>
      </SettingsSection>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

NotificationSettings.propTypes = {
  settings: PropTypes.object,
  loading: PropTypes.bool,
  updateNotificationPreferences: PropTypes.func.isRequired,
};



export default NotificationSettings;
