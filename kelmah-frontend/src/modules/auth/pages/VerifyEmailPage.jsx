import React, { useState, useEffect } from 'react';
import AuthWrapper from '../components/common/AuthWrapper';
import { Box, Typography, Button, TextField, Alert, CircularProgress } from '@mui/material';
import { CheckCircleOutline, ErrorOutline, MailOutline } from '@mui/icons-material';
import authService from '../services/authService';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useBreakpointDown } from '@/hooks/useResponsive';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(!!token);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [resendSent, setResendSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState('');
  const isMobile = useBreakpointDown('md');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Verification link is missing. Open the latest email from Kelmah and try again.');
      return;
    }
    let cancelled = false;
    const verify = async () => {
      try {
        const res = await authService.verifyEmail(token);
        if (!cancelled) {
          setStatus(
            res.message || 'Your email is confirmed. You can now sign in.',
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError('This link is no longer valid. Request a new verification email below.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    verify();
    return () => { cancelled = true; };
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    setResendError('');
    setResendSent(false);
    setResendLoading(true);
    try {
      await authService.resendVerificationEmail(email);
      setResendSent(true);
    } catch (err) {
      setResendError('Failed to send verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const content = (
    <Box sx={{ width: '100%', maxWidth: 400, textAlign: 'center', mx: 'auto' }}>
      <Helmet><title>Verify Email | Kelmah</title></Helmet>
      {loading && (
        <Box sx={{ mb: 3 }}>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>Verifying your email…</Typography>
        </Box>
      )}
      {!loading && status && (
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
      {!loading && error && (
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
              Enter your account email. We will send a new verification link.
            </Typography>
          </Box>
            {resendError && (
              <Alert severity="error" sx={{
                mt: 1, mb: 1, borderRadius: 2,
                ...(isMobile && { bgcolor: (t) => `${t.palette.error.main}1F`, color: 'text.primary' }),
              }}>
                {resendError}
              </Alert>
            )}
            <Box component="form" onSubmit={handleResend} sx={{ mt: 1 }}>
            <TextField
              label="Account Email"
              type="email"
              fullWidth
              required
              margin="normal"
              placeholder="Enter the email you used to sign up"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputProps={{ inputMode: 'email', autoComplete: 'email', 'aria-label': 'Account email for verification resend' }}
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
              disabled={resendLoading}
              aria-label="Send new verification link"
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
              {resendLoading ? <CircularProgress size={24} color="inherit" /> : 'Send New Link'}
            </Button>
          </Box>
          {resendSent && (
            <Alert severity="success" sx={{
              mt: 2,
              borderRadius: 2,
              ...(isMobile && { bgcolor: (t) => `${t.palette.success.main}1F`, color: 'text.primary' }),
            }}>
              Verification link sent. Check your inbox and spam folder.
            </Alert>
          )}
        </>
      )}
      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" sx={{ color: isMobile ? 'text.disabled' : 'text.secondary' }}>
          Back to{' '}
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
