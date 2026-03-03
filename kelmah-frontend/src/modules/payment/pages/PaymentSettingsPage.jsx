import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
  InputAdornment,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Helmet } from 'react-helmet-async';
import paymentService from '../services/paymentService';
import { currencyFormatter } from '@/modules/common/utils/formatters';

const PaymentSettingsPage = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchSettings = async () => {
      try {
        const res = await paymentService.getPaymentSettings();
        if (cancelled) return;
        setSettings(res.data || res);
      } catch (err) {
        if (cancelled) return;
        setError('Failed to load settings. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSettings();
    return () => { cancelled = true; };
  }, []);

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
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: { xs: 2, sm: 4 } }}>
        <CircularProgress />
      </Container>
    );
  }
  if (error) {
    return (
      <Container sx={{ py: { xs: 2, sm: 4 } }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => { setError(null); setLoading(true); paymentService.getPaymentSettings().then(res => { setSettings(res.data || res); }).catch(() => setError('Failed to load settings. Please try again.')).finally(() => setLoading(false)); }}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 0.5, sm: 2 } }}>
      <Helmet><title>Payment Settings | Kelmah</title></Helmet>
      <Paper
        elevation={3}
        sx={(theme) => ({
          p: { xs: 2, sm: 4 },
          borderRadius: 2,
          background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.action.hover})`,
          color: theme.palette.text.primary,
          border: '2px solid',
          borderColor: 'secondary.main',
        })}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{ mb: 3, color: 'secondary.main' }}
        >
          Payment Settings
        </Typography>
        <Grid container spacing={2}>
          {/* Example setting field: replace with actual settings keys */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Default Currency"
              value={settings.defaultCurrency || ''}
              onChange={handleChange('defaultCurrency')}
              placeholder="e.g. GHS"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Minimum Deposit Amount"
              type="number"
              value={settings.minDepositAmount || ''}
              onChange={handleChange('minDepositAmount')}
              placeholder="e.g. 100"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {settings.defaultCurrency || ''}
                  </InputAdornment>
                ),
                inputProps: { min: 0, step: 0.01 },
              }}
            />
          </Grid>
        </Grid>
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="secondary"
            sx={{ boxShadow: '0 2px 8px rgba(255,215,0,0.4)' }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
        {success && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success">Settings saved successfully</Alert>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default PaymentSettingsPage;
