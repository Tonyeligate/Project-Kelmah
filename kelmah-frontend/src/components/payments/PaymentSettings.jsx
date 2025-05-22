import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Info as InfoIcon,
  Save as SaveIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import PaymentService from '../../services/PaymentService';

const PaymentSettings = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    autoWithdraw: false,
    defaultCurrency: 'USD',
    taxInformation: {
      taxId: '',
      businessName: '',
      address: ''
    },
    security: {
      twoFactorAuth: false,
      requireApproval: true,
      maxTransactionAmount: 1000
    },
    notifications: {
      lowBalance: true,
      largeTransactions: true,
      failedTransactions: true,
      escrowUpdates: true
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [taxDialogOpen, setTaxDialogOpen] = useState(false);
  const [taxForm, setTaxForm] = useState({
    taxId: '',
    businessName: '',
    address: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await PaymentService.getPaymentSettings();
      setSettings(response.data);
      setTaxForm(response.data.taxInformation);
    } catch (err) {
      setError('Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await PaymentService.updatePaymentSettings(settings);
      setSuccess('Settings saved successfully');
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTaxFormChange = (field, value) => {
    setTaxForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTaxFormSubmit = () => {
    setSettings(prev => ({
      ...prev,
      taxInformation: taxForm
    }));
    setTaxDialogOpen(false);
  };

  const renderSecuritySettings = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SecurityIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Security Settings</Typography>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.security.twoFactorAuth}
                  onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                />
              }
              label="Enable Two-Factor Authentication"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.security.requireApproval}
                  onChange={(e) => handleSettingChange('security', 'requireApproval', e.target.checked)}
                />
              }
              label="Require Approval for Large Transactions"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Maximum Transaction Amount"
              type="number"
              value={settings.security.maxTransactionAmount}
              onChange={(e) => handleSettingChange('security', 'maxTransactionAmount', parseFloat(e.target.value))}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderNotificationSettings = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <NotificationsIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Notification Settings</Typography>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailNotifications}
                  onChange={(e) => handleSettingChange('', 'emailNotifications', e.target.checked)}
                />
              }
              label="Email Notifications"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.smsNotifications}
                  onChange={(e) => handleSettingChange('', 'smsNotifications', e.target.checked)}
                />
              }
              label="SMS Notifications"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.lowBalance}
                  onChange={(e) => handleSettingChange('notifications', 'lowBalance', e.target.checked)}
                />
              }
              label="Low Balance Alerts"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.largeTransactions}
                  onChange={(e) => handleSettingChange('notifications', 'largeTransactions', e.target.checked)}
                />
              }
              label="Large Transaction Alerts"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.failedTransactions}
                  onChange={(e) => handleSettingChange('notifications', 'failedTransactions', e.target.checked)}
                />
              }
              label="Failed Transaction Alerts"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.escrowUpdates}
                  onChange={(e) => handleSettingChange('notifications', 'escrowUpdates', e.target.checked)}
                />
              }
              label="Escrow Update Notifications"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderTaxSettings = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ReceiptIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Tax Information</Typography>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Tax ID: {settings.taxInformation.taxId || 'Not set'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Business Name: {settings.taxInformation.businessName || 'Not set'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Address: {settings.taxInformation.address || 'Not set'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="outlined"
              onClick={() => setTaxDialogOpen(true)}
            >
              Update Tax Information
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Payment Settings</Typography>
        <Tooltip title="Manage your payment preferences and security settings">
          <IconButton>
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </Box>

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

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            {renderSecuritySettings()}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderNotificationSettings()}
          </Grid>
          <Grid item xs={12}>
            {renderTaxSettings()}
          </Grid>
        </Grid>
      )}

      <Dialog
        open={taxDialogOpen}
        onClose={() => setTaxDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Tax Information</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Tax ID"
            value={taxForm.taxId}
            onChange={(e) => handleTaxFormChange('taxId', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Business Name"
            value={taxForm.businessName}
            onChange={(e) => handleTaxFormChange('businessName', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Address"
            multiline
            rows={3}
            value={taxForm.address}
            onChange={(e) => handleTaxFormChange('address', e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaxDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleTaxFormSubmit}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <CircularProgress size={24} /> : 'Save Settings'}
        </Button>
      </Box>
    </Box>
  );
};

export default PaymentSettings; 