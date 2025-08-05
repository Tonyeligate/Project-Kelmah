import React, { useState, useEffect } from 'react';
import AuthWrapper from '../components/common/AuthWrapper';
import { Box, Typography, Button, TextField, Alert } from '@mui/material';
import authService from '../services/authService';
import { useParams, Link } from 'react-router-dom';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('Verifying...');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await authService.verifyEmail(token);
        setStatus(
          res.message || 'Email verified successfully. You can now login.',
        );
      } catch (err) {
        setStatus('');
        setError(err.message || 'Email verification failed');
      }
    };
    verify();
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    try {
      await authService.resendVerificationEmail(email);
      setResendSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send verification email');
    }
  };

  return (
    <AuthWrapper>
      <Box sx={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>
        {status && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {status}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {error && (
          <>
            <Typography variant="body1">
              Enter your email to resend verification link:
            </Typography>
            <Box component="form" onSubmit={handleResend} sx={{ mt: 2 }}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                required
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 1 }}
              >
                Resend Link
              </Button>
            </Box>
            {resendSent && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Link sent! Check your email.
              </Alert>
            )}
          </>
        )}
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2">
            Go to <Link to="/login">Login</Link>
          </Typography>
        </Box>
      </Box>
    </AuthWrapper>
  );
};

export default VerifyEmailPage;
