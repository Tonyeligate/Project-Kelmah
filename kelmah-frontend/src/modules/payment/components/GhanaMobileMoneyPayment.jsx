import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  AccountBalanceWallet as WalletIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { styled } from '@mui/material/styles';
import paymentService from '../services/paymentService';

// Custom styled components
const PaymentMethodCard = styled(Paper)(({ theme, selected }) => ({
  padding: theme.spacing(2),
  border: `2px solid ${selected ? '#FFD700' : 'transparent'}`,
  backgroundColor: selected ? 'rgba(255, 215, 0, 0.05)' : 'transparent',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.02)',
  },
}));

const ProviderLogo = styled(Box)(({ theme }) => ({
  width: 60,
  height: 40,
  borderRadius: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  fontSize: '12px',
  marginRight: theme.spacing(2),
}));

const GhanaMobileMoneyPayment = ({
  amount,
  onPaymentSuccess,
  onPaymentError,
  loading = false,
}) => {
  const theme = useTheme();
  const [selectedProvider, setSelectedProvider] = useState('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});
  const [paymentStep, setPaymentStep] = useState('details'); // details, processing, success, error

  // Ghana Mobile Money providers
  const providers = [
    {
      id: 'mtn',
      name: 'MTN Mobile Money',
      color: '#FFCB05',
      textColor: '#000',
      marketShare: '60%',
      prefixes: ['024', '054', '055', '059'],
      description: "Ghana's largest mobile money service",
    },
    {
      id: 'vodafone',
      name: 'Vodafone Cash',
      color: '#E60000',
      textColor: '#FFF',
      marketShare: '25%',
      prefixes: ['020', '050'],
      description: 'Fast and secure mobile payments',
    },
    {
      id: 'airteltigo',
      name: 'AirtelTigo Money',
      color: '#FF6600',
      textColor: '#FFF',
      marketShare: '10%',
      prefixes: ['027', '057', '026', '056'],
      description: 'Reliable mobile money service',
    },
  ];

  // Format amount for Ghana Cedis
  const formatGHSAmount = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  // Validate Ghana phone number
  const validatePhoneNumber = (number) => {
    const cleaned = number.replace(/\D/g, '');

    // Check if it's a valid Ghana number (10 digits starting with 0, or 12 digits starting with 233)
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
      return { isValid: true, formatted: cleaned };
    }
    if (cleaned.length === 12 && cleaned.startsWith('233')) {
      return { isValid: true, formatted: '0' + cleaned.substring(3) };
    }

    return { isValid: false, formatted: number };
  };

  // Check if phone number matches selected provider
  const isNumberValidForProvider = (number, providerId) => {
    const cleaned = number.replace(/\D/g, '');
    const prefix = cleaned.substring(0, 3);
    const provider = providers.find((p) => p.id === providerId);
    return provider?.prefixes.includes(prefix);
  };

  // Handle form submission
  const handlePayment = async () => {
    setErrors({});

    // Validate phone number
    const phoneValidation = validatePhoneNumber(phoneNumber);
    if (!phoneValidation.isValid) {
      setErrors({ phone: 'Please enter a valid Ghana mobile number' });
      return;
    }

    // Check if number matches provider
    if (!isNumberValidForProvider(phoneNumber, selectedProvider)) {
      const provider = providers.find((p) => p.id === selectedProvider);
      setErrors({
        phone: `This number doesn't match ${provider.name}. Expected prefixes: ${provider.prefixes.join(', ')}`,
      });
      return;
    }

    setIsProcessing(true);
    setPaymentStep('processing');

    try {
      // Call payment service
      const paymentData = {
        provider: selectedProvider,
        phoneNumber: phoneValidation.formatted,
        amount: amount,
        currency: 'GHS',
        description: 'Kelmah platform payment',
      };

      // Process payment with Ghana Mobile Money service
      const result =
        await paymentService.processMobileMoneyPayment(paymentData);

      if (result.success) {
        setPaymentStep('success');
        setTimeout(() => {
          onPaymentSuccess?.({
            transactionId: result.data.referenceId,
            provider: selectedProvider,
            amount: amount,
            phoneNumber: phoneValidation.formatted,
            status: result.data.status,
            message: result.data.message,
          });
        }, 1000);
      } else {
        throw new Error(result.error || 'Payment processing failed');
      }
    } catch (error) {
      console.error('Mobile Money payment error:', error);
      setPaymentStep('error');
      setErrors({
        general: error.message || 'Payment failed. Please try again.',
      });
      onPaymentError?.(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Render payment step content
  const renderPaymentContent = () => {
    switch (paymentStep) {
      case 'processing':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} sx={{ color: '#FFD700', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Processing Payment...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please check your phone for the payment prompt and confirm the
              transaction.
            </Typography>
            <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
              <strong>Next Steps:</strong>
              <br />
              1. Check your phone for the payment request
              <br />
              2. Enter your Mobile Money PIN
              <br />
              3. Confirm the payment amount: {formatGHSAmount(amount)}
            </Alert>
          </Box>
        );

      case 'success':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon
              sx={{ fontSize: 60, color: 'success.main', mb: 2 }}
            />
            <Typography variant="h6" gutterBottom color="success.main">
              Payment Successful!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your Mobile Money payment has been processed successfully.
            </Typography>
            <Chip
              label={`${formatGHSAmount(amount)} paid via ${providers.find((p) => p.id === selectedProvider)?.name}`}
              color="success"
              sx={{ mt: 2 }}
            />
          </Box>
        );

      case 'error':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.general || 'Payment failed. Please try again.'}
            </Alert>
            <Button
              variant="outlined"
              onClick={() => setPaymentStep('details')}
              sx={{ mt: 2 }}
            >
              Try Again
            </Button>
          </Box>
        );

      default: // details
        return (
          <>
            {/* Provider Selection */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <WalletIcon sx={{ mr: 1, color: '#FFD700' }} />
                Select Mobile Money Provider
              </Typography>

              <Grid container spacing={2}>
                {providers.map((provider) => (
                  <Grid item xs={12} key={provider.id}>
                    <PaymentMethodCard
                      elevation={selectedProvider === provider.id ? 2 : 1}
                      selected={selectedProvider === provider.id}
                      onClick={() => setSelectedProvider(provider.id)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ProviderLogo
                          sx={{
                            backgroundColor: provider.color,
                            color: provider.textColor,
                          }}
                        >
                          {provider.name.substring(0, 3)}
                        </ProviderLogo>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {provider.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {provider.description}
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mt: 0.5,
                            }}
                          >
                            <Chip
                              label={`${provider.marketShare} market share`}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 1 }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Prefixes: {provider.prefixes.join(', ')}
                            </Typography>
                          </Box>
                        </Box>
                        <Radio
                          checked={selectedProvider === provider.id}
                          sx={{ color: '#FFD700' }}
                        />
                      </Box>
                    </PaymentMethodCard>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Phone Number Input */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <PhoneIcon sx={{ mr: 1, color: '#FFD700' }} />
                Mobile Money Number
              </Typography>

              <TextField
                fullWidth
                label="Phone Number"
                placeholder="0244000000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                error={!!errors.phone}
                helperText={
                  errors.phone || 'Enter your mobile money registered number'
                }
                inputProps={{ inputMode: 'tel' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">+233</InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              {/* Provider-specific help */}
              {selectedProvider && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>
                      {providers.find((p) => p.id === selectedProvider)?.name}
                    </strong>{' '}
                    numbers start with:{' '}
                    {providers
                      .find((p) => p.id === selectedProvider)
                      ?.prefixes.join(', ')}
                  </Typography>
                </Alert>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Payment Summary */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Payment Summary
              </Typography>
              <Paper sx={{ p: 2, backgroundColor: 'rgba(255, 215, 0, 0.05)' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography>Amount:</Typography>
                  <Typography fontWeight={600}>
                    {formatGHSAmount(amount)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography>Provider:</Typography>
                  <Typography>
                    {providers.find((p) => p.id === selectedProvider)?.name}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography>Processing Fee:</Typography>
                  <Typography color="success.main">FREE</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Total:
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    color="primary.main"
                  >
                    {formatGHSAmount(amount)}
                  </Typography>
                </Box>
              </Paper>
            </Box>

            {/* Security Notice */}
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SecurityIcon sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Your payment is secured by{' '}
                  {providers.find((p) => p.id === selectedProvider)?.name}. You
                  will receive a prompt on your phone to confirm this
                  transaction.
                </Typography>
              </Box>
            </Alert>

            {/* Pay Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handlePayment}
              disabled={!phoneNumber || !!errors.phone || isProcessing}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                background: 'linear-gradient(45deg, #FFD700, #DAA520)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #DAA520, #FFD700)',
                },
              }}
            >
              {isProcessing ? (
                <>
                  <CircularProgress
                    size={20}
                    sx={{ mr: 1, color: 'inherit' }}
                  />
                  Processing...
                </>
              ) : (
                `Pay ${formatGHSAmount(amount)} with Mobile Money`
              )}
            </Button>
          </>
        );
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        maxWidth: 500,
        mx: 'auto',
        borderRadius: 2,
        backgroundColor: 'background.paper',
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
        🇬🇭 Ghana Mobile Money Payment
      </Typography>

      {renderPaymentContent()}
    </Paper>
  );
};

export default GhanaMobileMoneyPayment;
