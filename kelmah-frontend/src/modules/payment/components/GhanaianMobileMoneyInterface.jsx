import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  Card,
  CardContent,
  CardActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon,
  Smartphone as MobileIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Timer as TimerIcon,
  Receipt as ReceiptIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { formatCurrency, formatPhoneNumber } from '../../../utils/formatters';
import paymentService from '../services/paymentService';

const GhanaianMobileMoneyInterface = ({
  amount,
  currency = 'GHS',
  onPaymentSuccess,
  onPaymentError,
  jobId,
  description = 'Payment for services',
}) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, processing, success, failed
  const [transactionId, setTransactionId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [savedNumbers, setSavedNumbers] = useState([]);

  // Mobile Money Providers in Ghana
  const momoProviders = [
    {
      id: 'mtn',
      name: 'MTN Mobile Money',
      shortName: 'MTN MoMo',
      logo: '/assets/images/mtn-logo.png',
      color: '#FFCC00',
      prefixes: ['024', '025', '053', '054', '055', '059'],
      features: ['Instant Transfer', '24/7 Available', 'No Extra Charges'],
      limits: { min: 1, max: 10000, daily: 50000 },
      processingTime: '1-2 minutes',
    },
    {
      id: 'vodafone',
      name: 'Vodafone Cash',
      shortName: 'Vodafone Cash',
      logo: '/assets/images/vodafone-logo.png',
      color: '#E60000',
      prefixes: ['020', '050'],
      features: ['Quick Processing', 'Secure Payments', 'Wide Coverage'],
      limits: { min: 1, max: 8000, daily: 40000 },
      processingTime: '2-3 minutes',
    },
    {
      id: 'airteltigo',
      name: 'AirtelTigo Money',
      shortName: 'AirtelTigo',
      logo: '/assets/images/airteltigo-logo.png',
      color: '#ED1C24',
      prefixes: ['026', '027', '057', '056'],
      features: ['Fast Transfer', 'Low Fees', 'Reliable Service'],
      limits: { min: 1, max: 6000, daily: 30000 },
      processingTime: '2-4 minutes',
    },
  ];

  const steps = [
    'Select Provider',
    'Enter Phone Number',
    'Confirm Payment',
    'Enter PIN',
    'Payment Processing',
  ];

  // Load saved phone numbers
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedMomoNumbers') || '[]');
    setSavedNumbers(saved);
  }, []);

  // Timer countdown
  useEffect(() => {
    let interval;
    if (paymentStatus === 'processing' && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [paymentStatus, timeRemaining]);

  // Get provider by phone number
  const getProviderByPhone = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const prefix = cleanPhone.substring(0, 3);

    return momoProviders.find((provider) => provider.prefixes.includes(prefix));
  };

  // Validate phone number
  const validatePhoneNumber = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length !== 10) {
      return { valid: false, message: 'Phone number must be 10 digits' };
    }

    const provider = getProviderByPhone(cleanPhone);
    if (!provider) {
      return { valid: false, message: 'Invalid mobile money number' };
    }

    return { valid: true, provider };
  };

  // Handle provider selection
  const handleProviderSelect = (providerId) => {
    setSelectedProvider(providerId);
    setActiveStep(1);
  };

  // Handle phone number input
  const handlePhoneChange = (value) => {
    const cleanValue = value.replace(/\D/g, '').substring(0, 10);
    setPhoneNumber(cleanValue);

    // Auto-detect provider
    if (cleanValue.length >= 3) {
      const provider = getProviderByPhone(cleanValue);
      if (provider && provider.id !== selectedProvider) {
        setSelectedProvider(provider.id);
      }
    }
  };

  // Handle proceed to confirmation
  const handleProceedToConfirm = () => {
    const validation = validatePhoneNumber(phoneNumber);

    if (!validation.valid) {
      enqueueSnackbar(validation.message, { variant: 'error' });
      return;
    }

    setActiveStep(2);
  };

  // Handle payment initiation
  const handleInitiatePayment = async () => {
    try {
      setProcessing(true);
      setPaymentStatus('processing');

      const provider = momoProviders.find((p) => p.id === selectedProvider);
      const paymentData = {
        amount,
        currency,
        phoneNumber: `233${phoneNumber.substring(1)}`, // Convert to international format
        provider: selectedProvider,
        jobId,
        description,
      };

      const response =
        await paymentService.initiateMobileMoneyPayment(paymentData);

      if (response.data.success) {
        setTransactionId(response.data.transactionId);
        setActiveStep(3);
        setShowPinDialog(true);

        enqueueSnackbar(
          `Payment request sent to ${formatPhoneNumber(phoneNumber)}. Please enter your ${provider.shortName} PIN to complete.`,
          { variant: 'info', autoHideDuration: 8000 },
        );
      } else {
        throw new Error(response.data.message || 'Payment initiation failed');
      }
    } catch (error) {
      setPaymentStatus('failed');
      enqueueSnackbar(error.message || 'Payment initiation failed', {
        variant: 'error',
      });
      if (onPaymentError) {
        onPaymentError(error);
      }
    } finally {
      setProcessing(false);
    }
  };

  // Handle PIN submission
  const handlePinSubmit = async () => {
    try {
      setProcessing(true);
      setShowPinDialog(false);
      setActiveStep(4);

      const response = await paymentService.confirmMobileMoneyPayment({
        transactionId,
        pin,
        phoneNumber: `233${phoneNumber.substring(1)}`,
      });

      if (response.data.success) {
        setPaymentStatus('success');

        // Save phone number for future use
        const savedNumbers = JSON.parse(
          localStorage.getItem('savedMomoNumbers') || '[]',
        );
        const provider = momoProviders.find((p) => p.id === selectedProvider);
        const numberInfo = {
          phoneNumber,
          provider: selectedProvider,
          providerName: provider.shortName,
          lastUsed: new Date().toISOString(),
        };

        const filtered = savedNumbers.filter(
          (n) => n.phoneNumber !== phoneNumber,
        );
        filtered.unshift(numberInfo);
        localStorage.setItem(
          'savedMomoNumbers',
          JSON.stringify(filtered.slice(0, 5)),
        );

        enqueueSnackbar('Payment completed successfully!', {
          variant: 'success',
        });

        if (onPaymentSuccess) {
          onPaymentSuccess({
            transactionId,
            amount,
            currency,
            phoneNumber,
            provider: selectedProvider,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        throw new Error(response.data.message || 'Payment confirmation failed');
      }
    } catch (error) {
      setPaymentStatus('failed');
      enqueueSnackbar(error.message || 'Payment failed', { variant: 'error' });
      if (onPaymentError) {
        onPaymentError(error);
      }
    } finally {
      setProcessing(false);
      setPin('');
    }
  };

  // Handle retry payment
  const handleRetryPayment = () => {
    setActiveStep(0);
    setPaymentStatus('pending');
    setTransactionId('');
    setPin('');
    setTimeRemaining(300);
  };

  // Handle saved number selection
  const handleSavedNumberSelect = (savedNumber) => {
    setPhoneNumber(savedNumber.phoneNumber);
    setSelectedProvider(savedNumber.provider);
    setActiveStep(2);
  };

  // Format time remaining
  const formatTimeRemaining = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Render provider card
  const renderProviderCard = (provider) => (
    <Card
      key={provider.id}
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        border:
          selectedProvider === provider.id
            ? `2px solid ${provider.color}`
            : '1px solid',
        borderColor:
          selectedProvider === provider.id ? provider.color : 'divider',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        },
      }}
      onClick={() => handleProviderSelect(provider.id)}
    >
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar
            sx={{
              bgcolor: alpha(provider.color, 0.1),
              color: provider.color,
              width: 56,
              height: 56,
            }}
          >
            <MobileIcon />
          </Avatar>
          <Box>
            <Typography variant="h6">{provider.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {provider.processingTime}
            </Typography>
          </Box>
        </Box>

        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Compatible Numbers:
          </Typography>
          <Box display="flex" gap={0.5} flexWrap="wrap">
            {provider.prefixes.map((prefix) => (
              <Chip
                key={prefix}
                label={prefix}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>

        <List dense>
          {provider.features.map((feature, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <ListItemAvatar>
                <CheckIcon color="success" fontSize="small" />
              </ListItemAvatar>
              <ListItemText
                primary={feature}
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
          ))}
        </List>

        <Box mt={2}>
          <Typography variant="caption" color="text.secondary">
            Limits: {formatCurrency(provider.limits.min)} -{' '}
            {formatCurrency(provider.limits.max)} per transaction
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  // Render payment confirmation
  const renderPaymentConfirmation = () => {
    const provider = momoProviders.find((p) => p.id === selectedProvider);

    return (
      <Paper sx={{ p: 3 }}>
        <Typography
          variant="h6"
          gutterBottom
          display="flex"
          alignItems="center"
          gap={1}
        >
          <ReceiptIcon color="primary" />
          Payment Confirmation
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Amount
              </Typography>
              <Typography variant="h5" color="primary" fontWeight="bold">
                {formatCurrency(amount)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Payment Method
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    bgcolor: alpha(provider.color, 0.1),
                  }}
                >
                  <MobileIcon fontSize="small" sx={{ color: provider.color }} />
                </Avatar>
                <Typography variant="body1">{provider.shortName}</Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Phone Number
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatPhoneNumber(phoneNumber)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Description
              </Typography>
              <Typography variant="body1">{description}</Typography>
            </Box>
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            You will receive a payment prompt on your phone. Please check your
            phone and enter your {provider.shortName} PIN to complete the
            payment.
          </Typography>
        </Alert>

        <Box display="flex" gap={2} mt={3}>
          <Button variant="outlined" onClick={() => setActiveStep(1)}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleInitiatePayment}
            disabled={processing}
            startIcon={
              processing ? <CircularProgress size={20} /> : <SendIcon />
            }
          >
            {processing ? 'Initiating...' : 'Initiate Payment'}
          </Button>
        </Box>
      </Paper>
    );
  };

  // Render processing status
  const renderProcessingStatus = () => (
    <Paper sx={{ p: 3, textAlign: 'center' }}>
      {paymentStatus === 'processing' && (
        <>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Processing Payment
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Please complete the payment on your phone
          </Typography>

          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={1}
            mb={2}
          >
            <TimerIcon color="action" />
            <Typography variant="body2">
              Time remaining: {formatTimeRemaining(timeRemaining)}
            </Typography>
          </Box>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Don't close this page. We're waiting for payment confirmation.
            </Typography>
          </Alert>
        </>
      )}

      {paymentStatus === 'success' && (
        <>
          <CheckIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h6" color="success.main" gutterBottom>
            Payment Successful!
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Transaction ID: {transactionId}
          </Typography>
          <Typography variant="body1" paragraph>
            Your payment of {formatCurrency(amount)} has been processed
            successfully.
          </Typography>
        </>
      )}

      {paymentStatus === 'failed' && (
        <>
          <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h6" color="error.main" gutterBottom>
            Payment Failed
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            The payment could not be completed. Please try again.
          </Typography>
          <Button
            variant="contained"
            onClick={handleRetryPayment}
            startIcon={<RefreshIcon />}
          >
            Try Again
          </Button>
        </>
      )}
    </Paper>
  );

  return (
    <Box>
      <Typography
        variant="h5"
        gutterBottom
        display="flex"
        alignItems="center"
        gap={1}
      >
        <MobileIcon color="primary" />
        Mobile Money Payment
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        Pay securely using your mobile money account. Supported providers in
        Ghana.
      </Typography>

      {/* Stepper */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step Content */}
      {activeStep === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Select Your Mobile Money Provider
          </Typography>

          {/* Saved Numbers */}
          {savedNumbers.length > 0 && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Quick Pay - Saved Numbers
              </Typography>
              <List>
                {savedNumbers.map((savedNumber, index) => {
                  const provider = momoProviders.find(
                    (p) => p.id === savedNumber.provider,
                  );
                  return (
                    <ListItem
                      key={index}
                      button
                      onClick={() => handleSavedNumberSelect(savedNumber)}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: alpha(provider.color, 0.1),
                            color: provider.color,
                          }}
                        >
                          <MobileIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={formatPhoneNumber(savedNumber.phoneNumber)}
                        secondary={savedNumber.providerName}
                      />
                      <ListItemSecondaryAction>
                        <Chip label="Quick Pay" size="small" color="primary" />
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
              </List>
              <Divider sx={{ my: 2 }} />
            </Paper>
          )}

          <Grid container spacing={3}>
            {momoProviders.map(renderProviderCard)}
          </Grid>
        </Box>
      )}

      {activeStep === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Enter Your Phone Number
          </Typography>

          <TextField
            fullWidth
            label="Mobile Money Number"
            value={phoneNumber}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="e.g., 0241234567"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon />
                </InputAdornment>
              ),
            }}
            helperText={
              phoneNumber.length >= 3 && selectedProvider
                ? `${momoProviders.find((p) => p.id === selectedProvider)?.shortName} number detected`
                : 'Enter your 10-digit mobile money number'
            }
            sx={{ mb: 3 }}
          />

          {selectedProvider && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Provider:{' '}
                {momoProviders.find((p) => p.id === selectedProvider)?.name}
              </Typography>
            </Alert>
          )}

          <Box display="flex" gap={2}>
            <Button variant="outlined" onClick={() => setActiveStep(0)}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleProceedToConfirm}
              disabled={phoneNumber.length !== 10}
            >
              Continue
            </Button>
          </Box>
        </Paper>
      )}

      {activeStep === 2 && renderPaymentConfirmation()}

      {(activeStep === 3 || activeStep === 4) && renderProcessingStatus()}

      {/* PIN Dialog */}
      <Dialog
        open={showPinDialog}
        onClose={() => setShowPinDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle display="flex" alignItems="center" gap={1}>
          <SecurityIcon color="primary" />
          Enter Your PIN
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Please enter your{' '}
            {momoProviders.find((p) => p.id === selectedProvider)?.shortName}{' '}
            PIN to authorize this payment.
          </Typography>

          <TextField
            fullWidth
            type="password"
            label="Mobile Money PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter 4-digit PIN"
            inputProps={{ maxLength: 4 }}
            sx={{ mt: 2 }}
          />

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Never share your PIN with anyone. We'll never ask for your PIN
              outside of this secure payment process.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPinDialog(false)}>Cancel</Button>
          <Button
            onClick={handlePinSubmit}
            variant="contained"
            disabled={pin.length !== 4 || processing}
            startIcon={
              processing ? <CircularProgress size={20} /> : <SecurityIcon />
            }
          >
            {processing ? 'Confirming...' : 'Confirm Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GhanaianMobileMoneyInterface;
