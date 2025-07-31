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
} from '@mui/material';
import paymentsApi from '../../../api/services/paymentsApi';

// Currency formatter for Ghana Cedi
const currencyFormatter = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: "GHS",
});

const PaymentSettingsPage = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await paymentsApi.getPaymentSettings();
        setSettings(res.data || res);
      } catch (err) {
        setError(err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
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
      await paymentsApi.updatePaymentSettings(settings);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }
  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper
        elevation={3}
        sx={(theme) => ({
          p: 4,
          borderRadius: 2,
          background: `linear-gradient(to right, #28313b, #485461, ${theme.palette.secondary.main})`,
          color: 'white',
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
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Minimum Deposit Amount"
              type="number"
              value={settings.minDepositAmount || ''}
              onChange={handleChange('minDepositAmount')}
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
