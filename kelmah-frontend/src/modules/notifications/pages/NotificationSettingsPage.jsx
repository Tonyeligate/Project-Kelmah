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
      <Typography variant="h5" gutterBottom>
        Notification Preferences
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
              <Skeleton key={i} variant="rectangular" height={44} sx={{ mt: 1, borderRadius: 1 }} />
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
                    />
                  }
                  label={key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                />
              ))}
            </FormGroup>
          </Grid>
        </Grid>
        <Button
          sx={{ mt: 2 }}
          variant="contained"
          disabled={saving}
          onClick={save}
        >
          {saving ? 'Saving...' : 'Save'}
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
