import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Paper, 
  Stepper, 
  Step, 
  StepLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

const steps = ['Enable 2FA', 'Scan QR Code', 'Verify Code'];

/**
 * MFA Setup Page
 * Allows users to set up two-factor authentication
 */
const MfaSetup = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mfaData, setMfaData] = useState({
    secret: '',
    qrCode: ''
  });
  const [verificationCode, setVerificationCode] = useState('');
  const { getCurrentUser } = useAuth();
  const [user, setUser] = useState(null);
  
  // Fetch user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        // If MFA is already enabled, go to the last step
        if (currentUser.mfaEnabled) {
          setActiveStep(3);
          setSuccess('You have already enabled two-factor authentication.');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setError('Failed to load user data.');
      }
    };
    
    fetchUser();
  }, [getCurrentUser]);
  
  // Function to initiate MFA setup
  const initiateMfaSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/auth/mfa/setup');
      
      if (response.data.success) {
        setMfaData({
          secret: response.data.secret,
          qrCode: response.data.qrCode
        });
        setActiveStep(1);
      } else {
        setError('Failed to set up MFA. Please try again.');
      }
    } catch (error) {
      console.error('MFA setup error:', error);
      setError(error.response?.data?.message || 'An error occurred during MFA setup.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to verify MFA code
  const verifyMfaSetup = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/auth/mfa/verify', {
        token: verificationCode
      });
      
      if (response.data.success) {
        setActiveStep(2);
        setSuccess('Two-factor authentication has been enabled successfully.');
        // Update user data
        setUser({
          ...user,
          mfaEnabled: true
        });
      } else {
        setError('Failed to verify MFA code. Please try again.');
      }
    } catch (error) {
      console.error('MFA verification error:', error);
      setError(error.response?.data?.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to disable MFA
  const disableMfa = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/auth/mfa/disable');
      
      if (response.data.success) {
        setSuccess('Two-factor authentication has been disabled.');
        setActiveStep(0);
        // Update user data
        setUser({
          ...user,
          mfaEnabled: false
        });
      } else {
        setError('Failed to disable MFA. Please try again.');
      }
    } catch (error) {
      console.error('MFA disable error:', error);
      setError(error.response?.data?.message || 'An error occurred while disabling MFA.');
    } finally {
      setLoading(false);
    }
  };
  
  // Render setup steps
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <SecurityIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Enhance Your Account Security
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Two-factor authentication adds an extra layer of security to your account.
              After enabling, you'll need both your password and a verification code from your 
              authenticator app to sign in.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={initiateMfaSetup}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Enable Two-Factor Authentication'}
            </Button>
          </Box>
        );
      
      case 1:
        return (
          <Box sx={{ py: 3 }}>
            <Typography variant="h5" gutterBottom>
              Scan the QR Code
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              1. Install an authenticator app like Google Authenticator or Authy.
              <br />
              2. Open the app and scan this QR code.
              <br />
              3. Enter the 6-digit verification code from the app.
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              {mfaData.qrCode ? (
                <img src={mfaData.qrCode} alt="QR Code" width="200" height="200" />
              ) : (
                <CircularProgress />
              )}
            </Box>
            
            <Typography variant="subtitle2" gutterBottom>
              Manual entry code (if QR scan doesn't work):
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 3 }}>
              {mfaData.secret}
            </Typography>
            
            <TextField
              fullWidth
              label="Verification Code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              margin="normal"
              variant="outlined"
              placeholder="123456"
              inputProps={{ maxLength: 6 }}
              sx={{ mb: 2 }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(0)}
              >
                Back
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={verifyMfaSetup}
                disabled={loading || !verificationCode}
              >
                {loading ? <CircularProgress size={24} /> : 'Verify'}
              </Button>
            </Box>
          </Box>
        );
      
      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <SecurityIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Two-Factor Authentication Enabled
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Your account is now protected with two-factor authentication.
              You'll need to enter a verification code from your authenticator app 
              every time you sign in.
            </Typography>
            
            <Button
              variant="outlined"
              color="error"
              onClick={disableMfa}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Disable Two-Factor Authentication'}
            </Button>
          </Box>
        );
      
      default:
        return null;
    }
  };
  
  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Two-Factor Authentication
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {renderStepContent(activeStep)}
      </Paper>
    </Box>
  );
};

export default MfaSetup; 