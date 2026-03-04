import React, { useState, useEffect } from 'react';
import AuthWrapper from '../components/common/AuthWrapper';
import { Box, Typography, Button, TextField, Alert, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { Helmet } from 'react-helmet-async';

const MfaSetupPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [qrCode, setQrCode] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const { setupMFA, verifyMFA } = useAuth();

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const data = await setupMFA();
        if (!cancelled) {
          if (data?.qrCode) {
            setQrCode(data.qrCode);
          } else {
            setError('Failed to set up two-factor authentication. Please refresh and try again.');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to set up two-factor authentication. Please refresh and try again.');
        }
      }
    };
    init();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');
    setVerifying(true);
    try {
      await verifyMFA(token);
      setStatus('Two-factor authentication enabled successfully.');
    } catch (err) {
      setError('Verification failed. Please check the code and try again.');
    } finally {
      setVerifying(false);
    }
  };

  const mfaContent = (
      <Box
        sx={{ width: '100%', maxWidth: 400, mx: 'auto', textAlign: 'center' }}
      >
        <Helmet><title>Two-Factor Authentication | Kelmah</title></Helmet>
        <Typography variant="h5" gutterBottom sx={isMobile ? { color: 'text.primary', fontWeight: 700 } : {}}>
          Setup Two-Factor Authentication
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {status && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {status}
          </Alert>
        )}
        {qrCode ? (
          <>
            <Box
              component="img"
              src={qrCode}
              alt="2FA QR Code"
              sx={{ mb: 2, maxWidth: '100%' }}
            />
            <Typography variant="body2" gutterBottom sx={isMobile ? { color: 'text.secondary' } : {}}>
              Scan this QR code with your authenticator app, then enter the code
              below to verify.
            </Typography>
            <Box component="form" onSubmit={handleVerify} sx={{ mt: 2 }}>
              <TextField
                label="Authentication Code"
                fullWidth
                required
                placeholder="Enter 6-digit code"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6, style: { letterSpacing: '0.3em', textAlign: 'center' } }}
                sx={isMobile ? { mb: 2, '& .MuiOutlinedInput-root': { backgroundColor: 'action.hover', color: 'text.primary' }, '& .MuiInputLabel-root': { color: 'text.secondary' } } : { mb: 2 }}
              />
              <Button type="submit" variant="contained" fullWidth disabled={verifying} sx={{ minHeight: 48, borderRadius: isMobile ? '24px' : 1 }}>
                {verifying ? <CircularProgress size={24} color="inherit" /> : 'Enable 2FA'}
              </Button>
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'center' }}>
            <CircularProgress size={24} sx={{ color: '#D4AF37' }} />
            <Typography sx={isMobile ? { color: 'text.secondary' } : {}}>Setting up two-factor authentication...</Typography>
          </Box>
        )}
      </Box>
  );

  if (isMobile) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', px: 3, py: 4 }}>
        {mfaContent}
      </Box>
    );
  }

  return (
    <AuthWrapper>
      {mfaContent}
    </AuthWrapper>
  );
};

export default MfaSetupPage;
