import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  InputAdornment,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Sms as SmsIcon,
  Phone as PhoneIcon,
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Timer as TimerIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { formatPhoneNumber } from '../../../utils/formatters';
import paymentService from '../services/paymentService';

const GhanaSMSVerification = ({
  phoneNumber,
  onVerificationSuccess,
  onVerificationError,
  purpose = 'payment',
  amount = null,
  autoStart = false,
  onCancel = null,
}) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const inputRefs = useRef([]);

  // State management
  const [verificationCode, setVerificationCode] = useState([
    '',
    '',
    '',
    '',
    '',
    '',
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [verificationId, setVerificationId] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [resendAvailable, setResendAvailable] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts] = useState(3);
  const [step, setStep] = useState('initial'); // initial, sent, verifying, success, failed
  const [showHelp, setShowHelp] = useState(false);

  // Ghana Network Operators
  const ghanaNetworks = {
    '024': { name: 'MTN', color: '#FFCC00', smsCode: '*170#' },
    '025': { name: 'MTN', color: '#FFCC00', smsCode: '*170#' },
    '053': { name: 'MTN', color: '#FFCC00', smsCode: '*170#' },
    '054': { name: 'MTN', color: '#FFCC00', smsCode: '*170#' },
    '055': { name: 'MTN', color: '#FFCC00', smsCode: '*170#' },
    '059': { name: 'MTN', color: '#FFCC00', smsCode: '*170#' },
    '020': { name: 'Vodafone', color: '#E60000', smsCode: '*110#' },
    '050': { name: 'Vodafone', color: '#E60000', smsCode: '*110#' },
    '026': { name: 'AirtelTigo', color: '#ED1C24', smsCode: '*100#' },
    '027': { name: 'AirtelTigo', color: '#ED1C24', smsCode: '*100#' },
    '056': { name: 'AirtelTigo', color: '#ED1C24', smsCode: '*100#' },
    '057': { name: 'AirtelTigo', color: '#ED1C24', smsCode: '*100#' },
  };

  // Auto-start verification if requested
  useEffect(() => {
    if (autoStart && phoneNumber) {
      handleSendVerification();
    }
  }, [autoStart, phoneNumber]);

  // Timer countdown
  useEffect(() => {
    let interval;
    if (step === 'sent' && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setResendAvailable(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timeRemaining]);

  // Get network info from phone number
  const getNetworkInfo = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const prefix = cleanPhone.substring(0, 3);
    return (
      ghanaNetworks[prefix] || { name: 'Unknown', color: '#666', smsCode: '' }
    );
  };

  // Send SMS verification
  const handleSendVerification = async () => {
    try {
      setIsSending(true);
      setStep('initial');

      const response = await paymentService.sendSMSVerification({
        phoneNumber: `233${phoneNumber.substring(1)}`,
        purpose,
        amount,
      });

      if (response.success) {
        setVerificationId(response.verificationId);
        setStep('sent');
        setTimeRemaining(300);
        setResendAvailable(false);

        const networkInfo = getNetworkInfo(phoneNumber);
        enqueueSnackbar(
          `Verification code sent to ${formatPhoneNumber(phoneNumber)} via ${networkInfo.name}`,
          { variant: 'success', autoHideDuration: 6000 },
        );
      } else {
        throw new Error(
          response.message || 'Failed to send verification code',
        );
      }
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to send SMS verification', {
        variant: 'error',
      });
      setStep('failed');
      if (onVerificationError) {
        onVerificationError(error);
      }
    } finally {
      setIsSending(false);
    }
  };

  // Handle code input change
  const handleCodeInputChange = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value.slice(-1); // Only take the last character
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (
      newCode.every((digit) => digit !== '') &&
      newCode.join('').length === 6
    ) {
      handleVerifyCode(newCode.join(''));
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verify SMS code
  const handleVerifyCode = async (code = null) => {
    const codeToVerify = code || verificationCode.join('');

    if (codeToVerify.length !== 6) {
      enqueueSnackbar('Please enter a complete 6-digit code', {
        variant: 'error',
      });
      return;
    }

    try {
      setIsLoading(true);
      setStep('verifying');

      const response = await paymentService.verifySMSCode({
        verificationId,
        code: codeToVerify,
        phoneNumber: `233${phoneNumber.substring(1)}`,
      });

      if (response.success) {
        setStep('success');
        enqueueSnackbar('Phone number verified successfully!', {
          variant: 'success',
        });

        if (onVerificationSuccess) {
          onVerificationSuccess({
            verificationId,
            phoneNumber,
            verifiedAt: new Date().toISOString(),
          });
        }
      } else {
        throw new Error(response.message || 'Invalid verification code');
      }
    } catch (error) {
      setAttempts((prev) => prev + 1);

      if (attempts + 1 >= maxAttempts) {
        setStep('failed');
        enqueueSnackbar('Too many failed attempts. Please try again later.', {
          variant: 'error',
        });
      } else {
        enqueueSnackbar(
          `Invalid code. ${maxAttempts - attempts - 1} attempts remaining.`,
          { variant: 'error' },
        );
        // Clear the code inputs
        setVerificationCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }

      if (onVerificationError) {
        onVerificationError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend code
  const handleResendCode = () => {
    setAttempts(0);
    setVerificationCode(['', '', '', '', '', '']);
    handleSendVerification();
  };

  // Format time remaining
  const formatTimeRemaining = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Render initial state
  const renderInitialState = () => {
    const networkInfo = getNetworkInfo(phoneNumber);

    return (
      <Card>
        <CardContent>
          <Box textAlign="center" mb={3}>
            <SmsIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              SMS Verification Required
            </Typography>
            <Typography variant="body2" color="text.secondary">
              We need to verify your phone number for security
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Phone Number:</strong> {formatPhoneNumber(phoneNumber)} (
              {networkInfo.name})
            </Typography>
            {amount && (
              <Typography variant="body2">
                <strong>Transaction Amount:</strong> {amount}
              </Typography>
            )}
          </Alert>

          <Box display="flex" gap={2} justifyContent="center">
            {onCancel && (
              <Button variant="outlined" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              variant="contained"
              onClick={handleSendVerification}
              disabled={isSending}
              startIcon={
                isSending ? <CircularProgress size={20} /> : <SendIcon />
              }
            >
              {isSending ? 'Sending...' : 'Send Verification Code'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Render code input state
  const renderCodeInputState = () => {
    const networkInfo = getNetworkInfo(phoneNumber);
    const progressPercent = ((300 - timeRemaining) / 300) * 100;

    return (
      <Card>
        <CardContent>
          <Box textAlign="center" mb={3}>
            <SecurityIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Enter Verification Code
            </Typography>
            <Typography variant="body2" color="text.secondary">
              We sent a 6-digit code to {formatPhoneNumber(phoneNumber)}
            </Typography>
          </Box>

          {/* Code Input Fields */}
          <Grid container spacing={1} justifyContent="center" mb={3}>
            {verificationCode.map((digit, index) => (
              <Grid item key={index}>
                <TextField
                  inputRef={(el) => (inputRefs.current[index] = el)}
                  value={digit}
                  onChange={(e) => handleCodeInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  inputProps={{
                    maxLength: 1,
                    style: {
                      textAlign: 'center',
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      width: '3rem',
                      height: '3rem',
                      padding: 0,
                    },
                  }}
                  sx={{
                    width: '4rem',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&.Mui-focused': {
                        '& fieldset': {
                          borderColor: 'primary.main',
                          borderWidth: 2,
                        },
                      },
                    },
                  }}
                />
              </Grid>
            ))}
          </Grid>

          {/* Timer and Progress */}
          <Box mb={3}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={1}
              mb={1}
            >
              <TimerIcon color="action" />
              <Typography variant="body2">
                Time remaining: {formatTimeRemaining(timeRemaining)}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              }}
            />
          </Box>

          {/* Action Buttons */}
          <Box display="flex" gap={2} justifyContent="center" mb={3}>
            <Button
              variant="outlined"
              onClick={handleResendCode}
              disabled={!resendAvailable || isSending}
              startIcon={
                isSending ? <CircularProgress size={20} /> : <RefreshIcon />
              }
            >
              {resendAvailable
                ? 'Resend Code'
                : `Resend in ${formatTimeRemaining(timeRemaining)}`}
            </Button>
            <Button
              variant="contained"
              onClick={() => handleVerifyCode()}
              disabled={isLoading || verificationCode.join('').length !== 6}
              startIcon={
                isLoading ? <CircularProgress size={20} /> : <CheckIcon />
              }
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </Box>

          {/* Help Section */}
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Didn't receive the code?</strong>
            </Typography>
            <List dense>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <InfoIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Check your SMS inbox and spam folder"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <InfoIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={`Ensure you have network coverage (${networkInfo.name})`}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <InfoIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="SMS delivery may take up to 2 minutes"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            </List>
          </Alert>

          {attempts > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Failed attempts:</strong> {attempts}/{maxAttempts}
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render verifying state
  const renderVerifyingState = () => (
    <Card>
      <CardContent>
        <Box textAlign="center">
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Verifying Code...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we verify your code
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  // Render success state
  const renderSuccessState = () => (
    <Card>
      <CardContent>
        <Box textAlign="center">
          <CheckIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" color="success.main" gutterBottom>
            Verification Successful!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your phone number has been verified successfully
          </Typography>

          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Verified:</strong> {formatPhoneNumber(phoneNumber)}
            </Typography>
          </Alert>
        </Box>
      </CardContent>
    </Card>
  );

  // Render failed state
  const renderFailedState = () => (
    <Card>
      <CardContent>
        <Box textAlign="center">
          <ErrorIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" color="error.main" gutterBottom>
            Verification Failed
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Unable to verify your phone number. Please try again.
          </Typography>

          <Button
            variant="contained"
            onClick={() => {
              setStep('initial');
              setAttempts(0);
              setVerificationCode(['', '', '', '', '', '']);
            }}
            startIcon={<RefreshIcon />}
          >
            Try Again
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography
        variant="h6"
        gutterBottom
        display="flex"
        alignItems="center"
        gap={1}
      >
        <ShieldIcon color="primary" />
        SMS Verification
      </Typography>

      {step === 'initial' && renderInitialState()}
      {step === 'sent' && renderCodeInputState()}
      {step === 'verifying' && renderVerifyingState()}
      {step === 'success' && renderSuccessState()}
      {step === 'failed' && renderFailedState()}

      {/* Help Dialog */}
      <Dialog
        open={showHelp}
        onClose={() => setShowHelp(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>SMS Verification Help</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Ghana Network Codes
          </Typography>
          <List>
            {Object.entries(ghanaNetworks)
              .reduce((acc, [prefix, info]) => {
                const existing = acc.find((item) => item.name === info.name);
                if (!existing) {
                  acc.push(info);
                }
                return acc;
              }, [])
              .map((network, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <PhoneIcon sx={{ color: network.color }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={network.name}
                    secondary={`Check balance: ${network.smsCode}`}
                  />
                </ListItem>
              ))}
          </List>

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Troubleshooting
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <InfoIcon />
              </ListItemIcon>
              <ListItemText
                primary="Ensure sufficient airtime for SMS"
                secondary="You need at least ₵0.30 credit to receive SMS"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <InfoIcon />
              </ListItemIcon>
              <ListItemText
                primary="Check network coverage"
                secondary="Move to an area with stronger signal"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <InfoIcon />
              </ListItemIcon>
              <ListItemText
                primary="SMS delays during peak hours"
                secondary="SMS delivery may be slower during 7-9 PM"
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHelp(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GhanaSMSVerification;
