import React, { useState, useEffect } from 'react';
import AuthWrapper from '../components/common/AuthWrapper';
import { Box, Typography, Button, TextField, Alert, useMediaQuery, useTheme } from '@mui/material';
import { useAuth } from '../hooks/useAuth';

const MfaSetupPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const { setupMFA, verifyMFA } = useAuth();

  useEffect(() => {
    const init = async () => {
      try {
        const data = await setupMFA();
        setSecret(data.secret);
        setQrCode(data.qrCode);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      }
    };
    init();
  }, [setupMFA]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');
    try {
      await verifyMFA(token);
      setStatus('Two-factor authentication enabled successfully.');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const mfaContent = (
      <Box
        sx={{ width: '100%', maxWidth: 400, mx: 'auto', textAlign: 'center' }}
      >
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
                value={token}
                onChange={(e) => setToken(e.target.value)}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6, style: { fontSize: 16, letterSpacing: '0.3em', textAlign: 'center' } }}
                sx={isMobile ? { mb: 2, '& .MuiOutlinedInput-root': { backgroundColor: 'action.hover', color: 'text.primary' }, '& .MuiInputLabel-root': { color: 'text.secondary' } } : { mb: 2 }}
              />
              <Button type="submit" variant="contained" fullWidth sx={{ minHeight: 48, borderRadius: isMobile ? '24px' : 1 }}>
                Enable 2FA
              </Button>
            </Box>
          </>
        ) : (
          <Typography sx={isMobile ? { color: 'text.secondary' } : {}}>Loading two-factor setup...</Typography>
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
