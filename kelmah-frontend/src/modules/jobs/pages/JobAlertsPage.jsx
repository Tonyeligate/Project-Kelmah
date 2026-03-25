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
  Skeleton,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { notificationService } from '../../notifications/services/notificationService';
import SavedSearches from '../../search/components/SavedSearches';
import { Helmet } from 'react-helmet-async';
import PageCanvas from '@/modules/common/components/PageCanvas';
import { useBreakpointDown } from '@/hooks/useResponsive';

const Section = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${theme.palette.divider}`,
}));

const JobAlertsPage = () => {
  const theme = useTheme();
  const isMobile = useBreakpointDown('md');
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
        setError('Could not load alert settings. You can update and save again.');
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
      setSuccess('Job alert settings saved.');
    } catch (e) {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageCanvas disableContainer>
      <Container maxWidth="lg" sx={{ py: { xs: 1.25, sm: 4 }, pb: { xs: 10, sm: 4 }, px: { xs: 0.5, sm: 2 } }}>
        <Helmet><title>Job Alerts | Kelmah</title></Helmet>
        <Typography
        variant="h4"
        fontWeight={800}
        sx={{ mb: { xs: 1.25, sm: 3 }, color: 'secondary.main', fontSize: { xs: '1.15rem', sm: '2rem' } }}
      >
        Job Alerts
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25, display: { xs: 'none', md: 'block' } }}>
        Choose how you want to hear about new jobs.
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
      <Stack spacing={{ xs: 1.5, md: 3 }}>
        <Section sx={{ p: { xs: 1.25, md: 3 }, position: { xs: 'sticky', md: 'static' }, top: { xs: 68, md: 'auto' }, zIndex: { xs: 8, md: 'auto' } }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25, display: { xs: 'none', md: 'block' } }}>
            Manage job alert notifications and channels.
          </Typography>
          {loading ? (
            <Box sx={{ py: 1 }}>
              {[1, 2, 3].map((item) => (
                <Box
                  key={`job-alert-pref-skeleton-${item}`}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.8 }}
                >
                  <Skeleton variant="rounded" width={42} height={24} />
                  <Skeleton variant="text" width="55%" height={24} />
                </Box>
              ))}
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
                    inputProps={{ 'aria-label': 'Turn job alerts on or off' }}
                  />
                }
                label="Turn on job alerts"
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
                    inputProps={{ 'aria-label': 'Show job alerts inside the app' }}
                  />
                }
                label="Show alerts in app"
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
                    inputProps={{ 'aria-label': 'Send job alerts by email' }}
                  />
                }
                label="Send email alerts"
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
              aria-label="Save job alert settings"
              sx={{ display: { xs: 'none', md: 'inline-flex' } }}
            >
              {saving ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} sx={{ color: '#000' }} />
                  Saving...
                </Box>
              ) : (
                'Save alert settings'
              )}
            </Button>
          </Box>
        </Section>

        <Section sx={{ p: { xs: 1.25, md: 3 } }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            Saved Searches
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25, display: { xs: 'none', md: 'block' } }}>
            Manage and reuse your saved job searches.
          </Typography>
          <SavedSearches compact={isMobile} onSearchSelect={() => {}} />
        </Section>
      </Stack>

      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1300,
            p: 1,
            pb: 'calc(8px + env(safe-area-inset-bottom, 0px))',
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            disabled={saving}
            onClick={savePreferences}
            aria-label="Save job alert settings"
            sx={{ minHeight: 44, fontWeight: 700 }}
          >
            {saving ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} sx={{ color: '#000' }} />
                Saving...
              </Box>
            ) : (
              'Save alert settings'
            )}
          </Button>
        </Box>
      )}
      </Container>
    </PageCanvas>
  );
};

export default JobAlertsPage;
