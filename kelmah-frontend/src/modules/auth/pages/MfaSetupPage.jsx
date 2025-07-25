import React, { useState, useEffect } from 'react';
import AuthWrapper from '../components/common/AuthWrapper';
import { Box, Typography, Button, TextField, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const MfaSetupPage = () => {
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const { mfaSetup, verifyTwoFactor } = useAuth();

  useEffect(() => {
    const init = async () => {
      try {
        const data = await mfaSetup();
        setSecret(data.secret);
        setQrCode(data.qrCode);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      }
    };
    init();
  }, [mfaSetup]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');
    try {
      await verifyTwoFactor(token);
      setStatus('Two-factor authentication enabled successfully.');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <AuthWrapper>
      <Box
        sx={{ width: '100%', maxWidth: 400, mx: 'auto', textAlign: 'center' }}
      >
        <Typography variant="h5" gutterBottom>
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
            <Typography variant="body2" gutterBottom>
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
                sx={{ mb: 2 }}
              />
              <Button type="submit" variant="contained">
                Enable 2FA
              </Button>
            </Box>
          </>
        ) : (
          <Typography>Loading two-factor setup...</Typography>
        )}
      </Box>
    </AuthWrapper>
  );
};

export default MfaSetupPage;
