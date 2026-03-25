import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Skeleton,
  Alert,
  Grid,
  InputAdornment,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import paymentService from '../services/paymentService';
import { currencyFormatter } from '@/modules/common/utils/formatters';
import { toUserMessage } from '@/services/responseNormalizer';
import PageCanvas from '@/modules/common/components/PageCanvas';

const PaymentSettingsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showLoadingHint, setShowLoadingHint] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await paymentService.getPaymentSettings();
      setSettings(res.data || res);
    } catch (err) {
      setError(
        toUserMessage(err, {
          fallback: 'Failed to load settings. Please try again.',
        }),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (!loading) {
      setShowLoadingHint(false);
      return undefined;
    }

    const timer = setTimeout(() => {
      setShowLoadingHint(true);
    }, 12000);

    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleChange = (key) => (e) => {
    setSettings((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      await paymentService.updatePaymentSettings(settings);
      setSuccess(true);
    } catch (err) {
      setError(
        toUserMessage(err, {
          fallback: 'Failed to save settings. Please try again.',
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  const minDepositNumber = Number(settings.minDepositAmount || 0);

  if (loading) {
    return (
      <PageCanvas disableContainer sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}>
        <Container maxWidth="md" sx={{ py: 3 }}>
          {showLoadingHint && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Loading payment settings is taking longer than usual. Please wait or retry.
            </Alert>
          )}
          <Skeleton variant="text" width={200} height={36} sx={{ mb: 3 }} />
          {[1,2,3].map(i => (
            <Skeleton key={`payment-settings-skeleton-${i}`} variant="rounded" height={80} sx={{ borderRadius: 2, mb: 2 }} />
          ))}
        </Container>
      </PageCanvas>
    );
  }
  if (error) {
    return (
      <PageCanvas disableContainer sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}>
        <Container sx={{ py: { xs: 2, sm: 4 } }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={fetchSettings}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        </Container>
      </PageCanvas>
    );
  }

  return (
    <PageCanvas disableContainer sx={{ pt: { xs: 1, md: 4 }, pb: { xs: 10, sm: 6, md: 6 } }}>
      <Container maxWidth="md" sx={{ py: { xs: 1, sm: 4 }, px: { xs: 0.75, sm: 2 } }}>
        <Helmet><title>Payment Settings | Kelmah</title></Helmet>
        <Paper
        elevation={3}
        sx={(theme) => ({
          p: { xs: 1.5, sm: 4 },
          borderRadius: 2,
          background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.action.hover})`,
          color: theme.palette.text.primary,
          border: '2px solid',
          borderColor: 'secondary.main',
        })}
      >
        <Typography
          variant={isMobile ? 'h5' : 'h4'}
          fontWeight="bold"
          sx={{ mb: 1.25, color: 'secondary.main', lineHeight: 1.15 }}
        >
          Payment Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
          Choose the default currency and minimum deposit so payment forms stay clear and consistent.
        </Typography>
        <Grid container spacing={{ xs: 1.25, sm: 2 }}>
          {/* Example setting field: replace with actual settings keys */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              size={isMobile ? 'small' : 'medium'}
              label="Default Currency"
              value={settings.defaultCurrency || ''}
              onChange={handleChange('defaultCurrency')}
              placeholder="e.g. GHS"
              helperText="Use the currency your users see most often."
              inputProps={{ 'aria-label': 'Default currency symbol' }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size={isMobile ? 'small' : 'medium'}
              label="Minimum Deposit Amount"
              type="number"
              value={settings.minDepositAmount || ''}
              onChange={handleChange('minDepositAmount')}
              placeholder="e.g. 100"
              helperText="This helps keep deposits above your lowest supported amount."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {settings.defaultCurrency || ''}
                  </InputAdornment>
                ),
                inputProps: { min: 0, step: 0.01, 'aria-label': 'Minimum deposit amount' },
              }}
            />
          </Grid>
        </Grid>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.25 }}>
          Current minimum deposit preview: {currencyFormatter.format(Number.isFinite(minDepositNumber) ? minDepositNumber : 0)}
        </Typography>
        <Box sx={{ mt: 2.25, display: { xs: 'none', sm: 'block' } }}>
          <Button
            variant="contained"
            color="secondary"
            sx={{ boxShadow: '0 2px 8px rgba(255,215,0,0.4)' }}
            onClick={handleSave}
            aria-label="Save payment settings"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
        {success && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success">Settings saved successfully</Alert>
          </Box>
        )}
        </Paper>

        <Paper
          elevation={8}
          sx={(theme) => ({
            display: { xs: 'flex', sm: 'none' },
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: theme.zIndex.appBar + 2,
            px: 1,
            py: 1,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          })}
        >
          <Button
            fullWidth
            variant="contained"
            color="secondary"
            sx={{ borderRadius: 1.5, minHeight: 42, boxShadow: '0 2px 8px rgba(255,215,0,0.35)' }}
            onClick={handleSave}
            aria-label="Save payment settings"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Paper>
      </Container>
    </PageCanvas>
  );
};

export default PaymentSettingsPage;
