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

const Section = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  border: '1px solid rgba(255,255,255,0.08)',
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
    (async () => {
      try {
        setLoading(true);
        const data = await notificationService.getPreferences();
        if (data) {
          setPrefs((prev) => ({ ...prev, ...(data || {}) }));
        }
      } catch (e) {
        setError('Failed to load notification preferences');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const savePreferences = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await notificationService.updatePreferences(prefs);
      setSuccess('Preferences saved');
    } catch (e) {
      setError(e?.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        fontWeight={800}
        sx={{ mb: 3, color: 'secondary.main' }}
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
