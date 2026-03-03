import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Switch,
  Divider,
  Button,
  Alert,
  Stack,
  CircularProgress,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { notificationService } from '../../notifications/services/notificationService';
import SavedSearches from '../../search/components/SavedSearches';
import { Helmet } from 'react-helmet-async';

const Section = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${theme.palette.divider}`,
}));

const JobAlertsPage = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [prefs, setPrefs] = useState({
    jobAlerts: {
      enabled: true,
      channels: { inApp: true, email: false },
      frequency: 'daily',
    },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await notificationService.getPreferences();
        if (cancelled) return;
        if (data) {
          setPrefs((prev) => ({ ...prev, ...(data || {}) }));
        }
      } catch (e) {
        if (cancelled) return;
        setError('Failed to load notification preferences');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const savePreferences = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await notificationService.updatePreferences(prefs);
      setSuccess('Preferences saved');
    } catch (e) {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 0.5, sm: 2 } }}>
      <Helmet><title>Job Alerts | Kelmah</title></Helmet>
      <Typography
        variant="h4"
        fontWeight={800}
        sx={{ mb: { xs: 2, sm: 3 }, color: 'secondary.main' }}
      >
        Job Alerts
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      <Stack spacing={3}>
        <Section>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Manage job alert notifications and channels.
          </Typography>
          {loading ? (
            <Box sx={{ py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!prefs?.jobAlerts?.enabled}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        jobAlerts: {
                          ...(p.jobAlerts || {}),
                          enabled: e.target.checked,
                        },
                      }))
                    }
                    color="secondary"
                  />
                }
                label="Enable Job Alerts"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={!!prefs?.jobAlerts?.channels?.inApp}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        jobAlerts: {
                          ...(p.jobAlerts || {}),
                          channels: {
                            ...(p.jobAlerts?.channels || {}),
                            inApp: e.target.checked,
                          },
                        },
                      }))
                    }
                    color="secondary"
                  />
                }
                label="In-app Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={!!prefs?.jobAlerts?.channels?.email}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        jobAlerts: {
                          ...(p.jobAlerts || {}),
                          channels: {
                            ...(p.jobAlerts?.channels || {}),
                            email: e.target.checked,
                          },
                        },
                      }))
                    }
                    color="secondary"
                  />
                }
                label="Email Notifications"
              />
            </FormGroup>
          )}
          <Divider sx={{ my: 2 }} />
          <Box>
            <Button
              variant="contained"
              color="secondary"
              disabled={saving}
              onClick={savePreferences}
            >
              {saving ? (
                <CircularProgress size={18} sx={{ color: '#000' }} />
              ) : (
                'Save Preferences'
              )}
            </Button>
          </Box>
        </Section>

        <Section>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            Saved Searches
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Manage and reuse your saved job searches.
          </Typography>
          <SavedSearches compact={false} onSearchSelect={() => {}} />
        </Section>
      </Stack>
    </Container>
  );
};

export default JobAlertsPage;
