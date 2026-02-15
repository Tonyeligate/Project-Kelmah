import React, { useState, useEffect } from 'react';
import AuthWrapper from '../components/common/AuthWrapper';
import { Box, Typography, Button, TextField, Alert, useMediaQuery, useTheme } from '@mui/material';
import { CheckCircleOutline, ErrorOutline, MailOutline } from '@mui/icons-material';
import authService from '../services/authService';
import { useParams, Link } from 'react-router-dom';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('Verifying...');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [resendSent, setResendSent] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  const content = (
    <Box sx={{ width: '100%', maxWidth: 400, textAlign: 'center', mx: 'auto' }}>
      {status && (
        <Box sx={{ mb: 3 }}>
          <CheckCircleOutline sx={{ fontSize: 56, color: 'success.main', mb: 1 }} />
          <Alert severity="success" sx={{
            borderRadius: 2,
            ...(isMobile && { bgcolor: (t) => `${t.palette.success.main}1F`, color: 'text.primary' }),
          }}>
            {status}
          </Alert>
        </Box>
      )}
      {error && (
        <>
          <Box sx={{ mb: 3 }}>
            <ErrorOutline sx={{ fontSize: 56, color: 'error.main', mb: 1 }} />
            <Alert severity="error" sx={{
              borderRadius: 2,
              ...(isMobile && { bgcolor: (t) => `${t.palette.error.main}1F`, color: 'text.primary' }),
            }}>
              {error}
            </Alert>
          </Box>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <MailOutline sx={{ color: isMobile ? 'primary.main' : 'text.secondary', fontSize: 20 }} />
            <Typography variant="body1" sx={{ color: isMobile ? 'text.secondary' : 'text.primary' }}>
              Enter your email to resend verification link:
            </Typography>
          </Box>
          <Box component="form" onSubmit={handleResend} sx={{ mt: 1 }}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputProps={{ inputMode: 'email', autoComplete: 'email', style: { fontSize: 16 } }}
              sx={isMobile ? {
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                  color: 'text.primary',
                  '& fieldset': { borderColor: 'divider' },
                  '&:hover fieldset': { borderColor: 'primary.main' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                },
                '& .MuiInputLabel-root': { color: 'text.secondary' },
                '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' },
              } : {}}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 2,
                minHeight: 48,
                borderRadius: 6,
                fontWeight: 600,
                fontSize: '1rem',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              Resend Link
            </Button>
          </Box>
          {resendSent && (
            <Alert severity="success" sx={{
              mt: 2,
              borderRadius: 2,
              ...(isMobile && { bgcolor: (t) => `${t.palette.success.main}1F`, color: 'text.primary' }),
            }}>
              Link sent! Check your email.
            </Alert>
          )}
        </>
      )}
      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" sx={{ color: isMobile ? 'text.disabled' : 'text.secondary' }}>
          Go to{' '}
          <Link to="/login" style={{ color: 'inherit', fontWeight: 600, textDecoration: 'none' }}>
            Login
          </Link>
        </Typography>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Box sx={{
        minHeight: '100dvh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
        py: 4,
      }}>
        {content}
      </Box>
    );
  }

  return (
    <AuthWrapper>
      {content}
    </AuthWrapper>
  );
};

export default VerifyEmailPage;
