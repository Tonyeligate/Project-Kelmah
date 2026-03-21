import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  FormGroup,
  FormControlLabel,
  Switch,
  Button,
  Divider,
  Grid,
  Skeleton,
  Snackbar,
  Alert,
  Box,
} from '@mui/material';
import notificationService from '../services/notificationService';
import { Helmet } from 'react-helmet-async';

const NotificationSettingsPage = () => {
  const [prefs, setPrefs] = useState({
    channels: { inApp: true, email: false, sms: false },
    types: {
      message_received: true,
      payment_received: true,
      job_application: true,
      job_offer: true,
      contract_update: true,
      system_alert: true,
      review_received: true,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    notificationService
      .getPreferences()
      .then((data) => {
        if (mounted && data) setPrefs((prev) => ({ ...prev, ...data }));
      })
      .catch(() => {
        if (mounted) setToast({ open: true, message: 'Failed to load preferences', severity: 'error' });
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => {
      mounted = false;
    };
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await notificationService.updatePreferences(prefs);
      setToast({ open: true, message: 'Preferences saved successfully', severity: 'success' });
    } catch {
      setToast({ open: true, message: 'Failed to save preferences', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container sx={{ py: { xs: 2, sm: 4 }, px: { xs: 0.5, sm: 2 } }}>
      <Helmet><title>Notification Settings | Kelmah</title></Helmet>
      <Typography variant="h5" gutterBottom>
        Notification Preferences
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Choose where you receive updates and which alerts matter most to you.
      </Typography>
      {loading ? (
        <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Box sx={{ mb: 2 }}>
            <Skeleton variant="text" width={120} height={28} />
            <Skeleton variant="rectangular" height={44} sx={{ mt: 1, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={44} sx={{ mt: 1, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={44} sx={{ mt: 1, borderRadius: 1 }} />
          </Box>
          <Box>
            <Skeleton variant="text" width={80} height={28} />
            {Array.from(new Array(7)).map((_, i) => (
              <Skeleton key={`notification-settings-skeleton-${i}`} variant="rectangular" height={44} sx={{ mt: 1, borderRadius: 1 }} />
            ))}
          </Box>
        </Paper>
      ) : (
      <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">Channels</Typography>
            <Divider sx={{ my: 1 }} />
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(prefs.channels?.inApp)}
                    onChange={(e) =>
                      setPrefs((prev) => ({
                        ...prev,
                        channels: { ...prev.channels, inApp: e.target.checked },
                      }))
                    }
                    inputProps={{ 'aria-label': 'Toggle in-app notifications' }}
                  />
                }
                label="In-app"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(prefs.channels?.email)}
                    onChange={(e) =>
                      setPrefs((prev) => ({
                        ...prev,
                        channels: { ...prev.channels, email: e.target.checked },
                      }))
                    }
                    inputProps={{ 'aria-label': 'Toggle email notifications' }}
                  />
                }
                label="Email"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(prefs.channels?.sms)}
                    onChange={(e) =>
                      setPrefs((prev) => ({
                        ...prev,
                        channels: { ...prev.channels, sms: e.target.checked },
                      }))
                    }
                    inputProps={{ 'aria-label': 'Toggle SMS notifications' }}
                  />
                }
                label="SMS"
              />
            </FormGroup>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">Types</Typography>
            <Divider sx={{ my: 1 }} />
            <FormGroup>
              {Object.keys(prefs.types).map((key) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Switch
                      checked={Boolean(prefs.types[key])}
                      onChange={(e) =>
                        setPrefs((prev) => ({
                          ...prev,
                          types: { ...prev.types, [key]: e.target.checked },
                        }))
                      }
                      inputProps={{ 'aria-label': `Toggle ${key.replace(/_/g, ' ')} notifications` }}
                    />
                  }
                  label={key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                />
              ))}
            </FormGroup>
          </Grid>
        </Grid>
        <Button
          sx={{ mt: 2, minHeight: 44 }}
          variant="contained"
          disabled={saving}
          onClick={save}
          aria-label="Save notification preferences"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </Paper>
      )}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NotificationSettingsPage;
