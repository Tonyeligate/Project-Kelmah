import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Switch,
  Button,
  Paper,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { useSettings } from '../../hooks/useSettings';

const NotificationSettings = () => {
  const { settings, loading, updateNotificationPreferences } = useSettings();
  const [localSettings, setLocalSettings] = useState({
    email: false,
    realtime: false,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (settings?.notifications) {
      setLocalSettings(settings.notifications);
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

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Notification Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Manage how you receive notifications from Kelmah.
      </Typography>
      <Divider sx={{ mb: 3 }} />
      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              checked={localSettings.email}
              onChange={handleChange}
              name="email"
            />
          }
          label="Email Notifications"
        />
        <FormControlLabel
          control={
            <Switch
              checked={localSettings.realtime}
              onChange={handleChange}
              name="realtime"
            />
          }
          label="Push Notifications"
        />
      </FormGroup>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Save Changes'}
        </Button>
      </Box>
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
    </Paper>
  );
};

export default NotificationSettings;
