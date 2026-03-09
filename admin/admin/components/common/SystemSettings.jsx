import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Paper,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  RadioGroup,
  Radio,
  FormLabel,
  Checkbox,
  FormGroup,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Payment as PaymentIcon,
  Notifications as NotificationIcon,
  Security as SecurityIcon,
  Backup as BackupIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Phone as PhoneIcon,
  Storage as StorageIcon,
  CloudUpload as CloudIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../auth/hooks/useAuth';

// Custom TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const SystemSettings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openBackupDialog, setOpenBackupDialog] = useState(false);

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'Kelmah',
    platformDescription: "Ghana's Premier Freelancing Platform",
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    jobPostingRequiresApproval: false,
    enableReviews: true,
    enableMessaging: true,
    enableEscrow: true,
    maxFileUploadSize: 10, // MB
    supportEmail: 'support@kelmah.com',
    supportPhone: '+233 50 123 4567',
    timezone: 'Africa/Accra',
    currency: 'GHS',
  });

  // Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState({
    platformFeePercentage: 5.0,
    minimumWithdrawal: 50,
    withdrawalFee: 2,
    escrowReleaseDelay: 3, // days
    paymentMethods: {
      mobileMoney: true,
      bankTransfer: true,
      creditCard: true,
      cash: false,
    },
    mobileMoneyProviders: {
      mtn: true,
      vodafone: true,
      airtelTigo: true,
    },
    stripeEnabled: true,
    paystackEnabled: true,
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    notificationTemplates: {
      welcomeEmail: true,
      jobPosted: true,
      applicationReceived: true,
      paymentReceived: true,
      disputeOpened: true,
    },
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 8,
    requireSpecialCharacters: true,
    requireNumbers: true,
    requireUppercase: true,
    enableTwoFactor: true,
    sessionTimeout: 60, // minutes
    maxLoginAttempts: 5,
    lockoutDuration: 30, // minutes
  });

  // Backup Settings State
  const [backupSettings, setBackupSettings] = useState({
    autoBackupEnabled: true,
    backupFrequency: 'daily',
    backupRetentionDays: 30,
    backupLocation: 'cloud',
    lastBackupDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    backupSize: '2.4 GB',
    nextBackupDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  const handleGeneralSettingChange = (field, value) => {
    setGeneralSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePaymentSettingChange = (field, value) => {
    setPaymentSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveSettings = async (category) => {
    try {
      setLoading(true);
      setError(null);

      // Mock API call - in real app, this would save to backend
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess(`${category} settings saved successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleBackupNow = async () => {
    try {
      setLoading(true);

      // Mock backup process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setBackupSettings((prev) => ({
        ...prev,
        lastBackupDate: new Date(),
        nextBackupDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }));

      setSuccess('Backup completed successfully!');
      setOpenBackupDialog(false);
    } catch (err) {
      setError('Backup failed');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return (
      new Date(date).toLocaleDateString() +
      ' ' +
      new Date(date).toLocaleTimeString()
    );
  };

  if (!user || user.role !== 'admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" gutterBottom>
          System Settings
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />}>
            Reset
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {/* Settings Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<SettingsIcon />} label="General" />
          <Tab icon={<PaymentIcon />} label="Payment" />
          <Tab icon={<NotificationIcon />} label="Notifications" />
          <Tab icon={<SecurityIcon />} label="Security" />
          <Tab icon={<BackupIcon />} label="Backup" />
        </Tabs>
      </Paper>

      {/* General Settings Tab */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="Platform Configuration" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Platform Name"
                      value={generalSettings.platformName}
                      onChange={(e) =>
                        handleGeneralSettingChange(
                          'platformName',
                          e.target.value,
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Currency</InputLabel>
                      <Select
                        value={generalSettings.currency}
                        label="Currency"
                        onChange={(e) =>
                          handleGeneralSettingChange('currency', e.target.value)
                        }
                      >
                        <MenuItem value="GHS">Ghana Cedi (GHS)</MenuItem>
                        <MenuItem value="USD">US Dollar (USD)</MenuItem>
                        <MenuItem value="EUR">Euro (EUR)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Platform Description"
                      value={generalSettings.platformDescription}
                      onChange={(e) =>
                        handleGeneralSettingChange(
                          'platformDescription',
                          e.target.value,
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Support Email"
                      type="email"
                      value={generalSettings.supportEmail}
                      onChange={(e) =>
                        handleGeneralSettingChange(
                          'supportEmail',
                          e.target.value,
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Support Phone"
                      value={generalSettings.supportPhone}
                      onChange={(e) =>
                        handleGeneralSettingChange(
                          'supportPhone',
                          e.target.value,
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Timezone</InputLabel>
                      <Select
                        value={generalSettings.timezone}
                        label="Timezone"
                        onChange={(e) =>
                          handleGeneralSettingChange('timezone', e.target.value)
                        }
                      >
                        <MenuItem value="Africa/Accra">
                          Africa/Accra (GMT)
                        </MenuItem>
                        <MenuItem value="UTC">UTC</MenuItem>
                        <MenuItem value="America/New_York">
                          America/New_York
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Max File Upload Size (MB)"
                      type="number"
                      value={generalSettings.maxFileUploadSize}
                      onChange={(e) =>
                        handleGeneralSettingChange(
                          'maxFileUploadSize',
                          parseInt(e.target.value),
                        )
                      }
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Feature Toggles" />
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Maintenance Mode"
                      secondary="Temporarily disable platform"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={generalSettings.maintenanceMode}
                        onChange={(e) =>
                          handleGeneralSettingChange(
                            'maintenanceMode',
                            e.target.checked,
                          )
                        }
                        color="warning"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="User Registration"
                      secondary="Allow new user signups"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={generalSettings.registrationEnabled}
                        onChange={(e) =>
                          handleGeneralSettingChange(
                            'registrationEnabled',
                            e.target.checked,
                          )
                        }
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Email Verification"
                      secondary="Require email verification"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={generalSettings.emailVerificationRequired}
                        onChange={(e) =>
                          handleGeneralSettingChange(
                            'emailVerificationRequired',
                            e.target.checked,
                          )
                        }
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Job Approval"
                      secondary="Require admin approval for jobs"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={generalSettings.jobPostingRequiresApproval}
                        onChange={(e) =>
                          handleGeneralSettingChange(
                            'jobPostingRequiresApproval',
                            e.target.checked,
                          )
                        }
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Reviews System"
                      secondary="Enable user reviews"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={generalSettings.enableReviews}
                        onChange={(e) =>
                          handleGeneralSettingChange(
                            'enableReviews',
                            e.target.checked,
                          )
                        }
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Messaging"
                      secondary="Enable user messaging"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={generalSettings.enableMessaging}
                        onChange={(e) =>
                          handleGeneralSettingChange(
                            'enableMessaging',
                            e.target.checked,
                          )
                        }
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Escrow System"
                      secondary="Enable payment escrow"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={generalSettings.enableEscrow}
                        onChange={(e) =>
                          handleGeneralSettingChange(
                            'enableEscrow',
                            e.target.checked,
                          )
                        }
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('General')}
                disabled={loading}
              >
                Save General Settings
              </Button>
            </Box>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Payment Settings Tab */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Fee Configuration" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography gutterBottom>
                      Platform Fee Percentage
                    </Typography>
                    <Slider
                      value={paymentSettings.platformFeePercentage}
                      onChange={(e, newValue) =>
                        handlePaymentSettingChange(
                          'platformFeePercentage',
                          newValue,
                        )
                      }
                      valueLabelDisplay="auto"
                      step={0.5}
                      marks
                      min={0}
                      max={15}
                      valueLabelFormat={(value) => `${value}%`}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Minimum Withdrawal (GHS)"
                      type="number"
                      value={paymentSettings.minimumWithdrawal}
                      onChange={(e) =>
                        handlePaymentSettingChange(
                          'minimumWithdrawal',
                          parseFloat(e.target.value),
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Withdrawal Fee (GHS)"
                      type="number"
                      value={paymentSettings.withdrawalFee}
                      onChange={(e) =>
                        handlePaymentSettingChange(
                          'withdrawalFee',
                          parseFloat(e.target.value),
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Escrow Release Delay (days)"
                      type="number"
                      value={paymentSettings.escrowReleaseDelay}
                      onChange={(e) =>
                        handlePaymentSettingChange(
                          'escrowReleaseDelay',
                          parseInt(e.target.value),
                        )
                      }
                      helperText="Number of days to hold funds in escrow after job completion"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Payment Methods" />
              <CardContent>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={paymentSettings.paymentMethods.mobileMoney}
                        onChange={(e) =>
                          handlePaymentSettingChange('paymentMethods', {
                            ...paymentSettings.paymentMethods,
                            mobileMoney: e.target.checked,
                          })
                        }
                      />
                    }
                    label="Mobile Money"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={paymentSettings.paymentMethods.bankTransfer}
                        onChange={(e) =>
                          handlePaymentSettingChange('paymentMethods', {
                            ...paymentSettings.paymentMethods,
                            bankTransfer: e.target.checked,
                          })
                        }
                      />
                    }
                    label="Bank Transfer"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={paymentSettings.paymentMethods.creditCard}
                        onChange={(e) =>
                          handlePaymentSettingChange('paymentMethods', {
                            ...paymentSettings.paymentMethods,
                            creditCard: e.target.checked,
                          })
                        }
                      />
                    }
                    label="Credit Card"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={paymentSettings.paymentMethods.cash}
                        onChange={(e) =>
                          handlePaymentSettingChange('paymentMethods', {
                            ...paymentSettings.paymentMethods,
                            cash: e.target.checked,
                          })
                        }
                      />
                    }
                    label="Cash Payments"
                  />
                </FormGroup>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Mobile Money Providers
                </Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={paymentSettings.mobileMoneyProviders.mtn}
                        onChange={(e) =>
                          handlePaymentSettingChange('mobileMoneyProviders', {
                            ...paymentSettings.mobileMoneyProviders,
                            mtn: e.target.checked,
                          })
                        }
                      />
                    }
                    label="MTN Mobile Money"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={paymentSettings.mobileMoneyProviders.vodafone}
                        onChange={(e) =>
                          handlePaymentSettingChange('mobileMoneyProviders', {
                            ...paymentSettings.mobileMoneyProviders,
                            vodafone: e.target.checked,
                          })
                        }
                      />
                    }
                    label="Vodafone Cash"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={
                          paymentSettings.mobileMoneyProviders.airtelTigo
                        }
                        onChange={(e) =>
                          handlePaymentSettingChange('mobileMoneyProviders', {
                            ...paymentSettings.mobileMoneyProviders,
                            airtelTigo: e.target.checked,
                          })
                        }
                      />
                    }
                    label="AirtelTigo Money"
                  />
                </FormGroup>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  Payment Gateway Configuration
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardHeader
                        title="Stripe Configuration"
                        action={
                          <Switch
                            checked={paymentSettings.stripeEnabled}
                            onChange={(e) =>
                              handlePaymentSettingChange(
                                'stripeEnabled',
                                e.target.checked,
                              )
                            }
                          />
                        }
                      />
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          International credit card processing
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardHeader
                        title="Paystack Configuration"
                        action={
                          <Switch
                            checked={paymentSettings.paystackEnabled}
                            onChange={(e) =>
                              handlePaymentSettingChange(
                                'paystackEnabled',
                                e.target.checked,
                              )
                            }
                          />
                        }
                      />
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          African payment processing (Mobile Money, Bank Cards)
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('Payment')}
                disabled={loading}
              >
                Save Payment Settings
              </Button>
            </Box>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Notification Settings Tab */}
      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Notification Channels" />
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <EmailIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Email Notifications"
                      secondary="Send notifications via email"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            emailNotifications: e.target.checked,
                          }))
                        }
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <SmsIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="SMS Notifications"
                      secondary="Send notifications via SMS"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={notificationSettings.smsNotifications}
                        onChange={(e) =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            smsNotifications: e.target.checked,
                          }))
                        }
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <PhoneIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Push Notifications"
                      secondary="Send push notifications to mobile app"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={notificationSettings.pushNotifications}
                        onChange={(e) =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            pushNotifications: e.target.checked,
                          }))
                        }
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Notification Templates" />
              <CardContent>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={
                          notificationSettings.notificationTemplates
                            .welcomeEmail
                        }
                        onChange={(e) =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            notificationTemplates: {
                              ...prev.notificationTemplates,
                              welcomeEmail: e.target.checked,
                            },
                          }))
                        }
                      />
                    }
                    label="Welcome Email"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={
                          notificationSettings.notificationTemplates.jobPosted
                        }
                        onChange={(e) =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            notificationTemplates: {
                              ...prev.notificationTemplates,
                              jobPosted: e.target.checked,
                            },
                          }))
                        }
                      />
                    }
                    label="Job Posted Notification"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={
                          notificationSettings.notificationTemplates
                            .applicationReceived
                        }
                        onChange={(e) =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            notificationTemplates: {
                              ...prev.notificationTemplates,
                              applicationReceived: e.target.checked,
                            },
                          }))
                        }
                      />
                    }
                    label="Application Received"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={
                          notificationSettings.notificationTemplates
                            .paymentReceived
                        }
                        onChange={(e) =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            notificationTemplates: {
                              ...prev.notificationTemplates,
                              paymentReceived: e.target.checked,
                            },
                          }))
                        }
                      />
                    }
                    label="Payment Received"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={
                          notificationSettings.notificationTemplates
                            .disputeOpened
                        }
                        onChange={(e) =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            notificationTemplates: {
                              ...prev.notificationTemplates,
                              disputeOpened: e.target.checked,
                            },
                          }))
                        }
                      />
                    }
                    label="Dispute Opened"
                  />
                </FormGroup>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('Notification')}
                disabled={loading}
              >
                Save Notification Settings
              </Button>
            </Box>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Security Settings Tab */}
      <TabPanel value={activeTab} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Password Policy" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Minimum Password Length"
                      type="number"
                      value={securitySettings.passwordMinLength}
                      onChange={(e) =>
                        setSecuritySettings((prev) => ({
                          ...prev,
                          passwordMinLength: parseInt(e.target.value),
                        }))
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={securitySettings.requireSpecialCharacters}
                            onChange={(e) =>
                              setSecuritySettings((prev) => ({
                                ...prev,
                                requireSpecialCharacters: e.target.checked,
                              }))
                            }
                          />
                        }
                        label="Require Special Characters"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={securitySettings.requireNumbers}
                            onChange={(e) =>
                              setSecuritySettings((prev) => ({
                                ...prev,
                                requireNumbers: e.target.checked,
                              }))
                            }
                          />
                        }
                        label="Require Numbers"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={securitySettings.requireUppercase}
                            onChange={(e) =>
                              setSecuritySettings((prev) => ({
                                ...prev,
                                requireUppercase: e.target.checked,
                              }))
                            }
                          />
                        }
                        label="Require Uppercase Letters"
                      />
                    </FormGroup>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Session & Login Security" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={securitySettings.enableTwoFactor}
                          onChange={(e) =>
                            setSecuritySettings((prev) => ({
                              ...prev,
                              enableTwoFactor: e.target.checked,
                            }))
                          }
                        />
                      }
                      label="Enable Two-Factor Authentication"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Session Timeout (minutes)"
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) =>
                        setSecuritySettings((prev) => ({
                          ...prev,
                          sessionTimeout: parseInt(e.target.value),
                        }))
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Max Login Attempts"
                      type="number"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) =>
                        setSecuritySettings((prev) => ({
                          ...prev,
                          maxLoginAttempts: parseInt(e.target.value),
                        }))
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Lockout Duration (minutes)"
                      type="number"
                      value={securitySettings.lockoutDuration}
                      onChange={(e) =>
                        setSecuritySettings((prev) => ({
                          ...prev,
                          lockoutDuration: parseInt(e.target.value),
                        }))
                      }
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('Security')}
                disabled={loading}
              >
                Save Security Settings
              </Button>
            </Box>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Backup Settings Tab */}
      <TabPanel value={activeTab} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="Backup Configuration" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={backupSettings.autoBackupEnabled}
                          onChange={(e) =>
                            setBackupSettings((prev) => ({
                              ...prev,
                              autoBackupEnabled: e.target.checked,
                            }))
                          }
                        />
                      }
                      label="Enable Automatic Backups"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Backup Frequency</InputLabel>
                      <Select
                        value={backupSettings.backupFrequency}
                        label="Backup Frequency"
                        onChange={(e) =>
                          setBackupSettings((prev) => ({
                            ...prev,
                            backupFrequency: e.target.value,
                          }))
                        }
                      >
                        <MenuItem value="hourly">Hourly</MenuItem>
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Retention Period (days)"
                      type="number"
                      value={backupSettings.backupRetentionDays}
                      onChange={(e) =>
                        setBackupSettings((prev) => ({
                          ...prev,
                          backupRetentionDays: parseInt(e.target.value),
                        }))
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <FormLabel>Backup Location</FormLabel>
                      <RadioGroup
                        value={backupSettings.backupLocation}
                        onChange={(e) =>
                          setBackupSettings((prev) => ({
                            ...prev,
                            backupLocation: e.target.value,
                          }))
                        }
                        row
                      >
                        <FormControlLabel
                          value="local"
                          control={<Radio />}
                          label="Local Storage"
                        />
                        <FormControlLabel
                          value="cloud"
                          control={<Radio />}
                          label="Cloud Storage"
                        />
                        <FormControlLabel
                          value="both"
                          control={<Radio />}
                          label="Both"
                        />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Backup Status" />
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CheckIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Last Backup"
                      secondary={formatDate(backupSettings.lastBackupDate)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <StorageIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Backup Size"
                      secondary={backupSettings.backupSize}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Next Backup"
                      secondary={formatDate(backupSettings.nextBackupDate)}
                    />
                  </ListItem>
                </List>

                <Box
                  sx={{
                    mt: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  <Button
                    variant="contained"
                    startIcon={<BackupIcon />}
                    onClick={() => setOpenBackupDialog(true)}
                    disabled={loading}
                  >
                    Backup Now
                  </Button>
                  <Button variant="outlined" startIcon={<CloudIcon />}>
                    Restore Backup
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('Backup')}
                disabled={loading}
              >
                Save Backup Settings
              </Button>
            </Box>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Backup Dialog */}
      <Dialog
        open={openBackupDialog}
        onClose={() => setOpenBackupDialog(false)}
      >
        <DialogTitle>Create System Backup</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            This will create a complete backup of the system including:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="• Database (users, jobs, payments)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• File uploads and documents" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• System configuration" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Application logs" />
            </ListItem>
          </List>
          {loading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Creating backup... This may take several minutes.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBackupDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleBackupNow}
            disabled={loading}
          >
            Start Backup
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemSettings;

