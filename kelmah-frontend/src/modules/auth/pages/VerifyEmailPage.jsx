import { useState, useEffect } from 'react';
import AuthWrapper from '../components/common/AuthWrapper';
import {
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  CheckCircleOutline,
  ErrorOutline,
  MailOutline,
} from '@mui/icons-material';
import authService from '../services/authService';
import { useLocation, useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useBreakpointDown } from '@/hooks/useResponsive';
import PageCanvas from '@/modules/common/components/PageCanvas';
import { withSafeAreaBottom } from '@/utils/safeArea';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const location = useLocation();
  const initialEmail =
    location.state?.email ||
    new URLSearchParams(location.search).get('email') ||
    '';
  const [loading, setLoading] = useState(!!token);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [resendSent, setResendSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState('');
  const isMobile = useBreakpointDown('md');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError(
        'Your account was created. If you did not receive the verification email, resend it below.',
      );
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
      } catch {
        if (!cancelled) {
          setError(
            'This link is no longer valid. Request a new verification email below.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    setResendError('');
    setResendSent(false);
    setResendLoading(true);
    try {
      await authService.resendVerificationEmail(email);
      setResendSent(true);
    } catch {
      setResendError('Failed to send verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const accentColor = theme.palette.primary.main || '#FFD34D';
  const panelText = isDarkMode ? '#FFFFFF' : '#171A1F';
  const panelMuted = isDarkMode ? alpha('#FFFFFF', 0.8) : alpha('#171A1F', 0.7);
  const panelSoft = isDarkMode
    ? alpha('#FFFFFF', 0.74)
    : alpha('#171A1F', 0.64);
  const inputBackground = isDarkMode
    ? alpha('#FFFFFF', 0.08)
    : alpha('#FFFFFF', 0.9);
  const inputBorder = isDarkMode
    ? alpha(accentColor, 0.5)
    : alpha('#171A1F', 0.14);
  const inputBorderHover = isDarkMode
    ? alpha(accentColor, 0.7)
    : alpha(accentColor, 0.38);
  const inputPlaceholder = isDarkMode
    ? alpha('#FFFFFF', 0.76)
    : alpha('#171A1F', 0.58);

  const content = (
    <Box sx={{ width: '100%', maxWidth: 420, textAlign: 'center', mx: 'auto' }}>
      <Helmet>
        <title>Verify Email | Kelmah</title>
      </Helmet>
      {loading && (
        <Box sx={{ py: 4 }}>
          <CircularProgress size={48} sx={{ color: accentColor, mb: 3 }} />
          <Typography variant="body1" sx={{ color: panelMuted, fontWeight: 500 }}>
            Verifying your secure email link…
          </Typography>
        </Box>
      )}
      {!loading && status && (
        <Box sx={{ mb: 3, py: 2 }}>
          <CheckCircleOutline
            sx={{ fontSize: 64, color: 'success.main', mb: 2 }}
          />
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: 'success.main',
              mb: 2
            }}
          >
            Verification Success!
          </Typography>
          <Alert
            severity="success"
            sx={{
              borderRadius: 1.5,
              fontSize: '0.88rem',
              textAlign: 'left'
            }}
          >
            {status}
          </Alert>
        </Box>
      )}
      {!loading && error && (
        <>
          <Box sx={{ mb: 3, py: 1 }}>
            <ErrorOutline sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: 'error.main',
                mb: 2
              }}
            >
              Verification Failed
            </Typography>
            <Alert
              severity="error"
              sx={{
                borderRadius: 1.5,
                fontSize: '0.88rem',
                textAlign: 'left'
              }}
            >
              {error}
            </Alert>
          </Box>

          <Box
            sx={{
              mb: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.25,
            }}
          >
            <MailOutline
              sx={{
                color: accentColor,
                fontSize: 22,
              }}
            />
            <Typography
              variant="body2"
              sx={{ color: panelMuted, textAlign: 'left', fontSize: '0.85rem' }}
            >
              No worries! Enter your registered account email address below, and we'll send you a new verification link right away.
            </Typography>
          </Box>

          {resendError && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius: 1.5,
                fontSize: '0.85rem'
              }}
            >
              {resendError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleResend} sx={{ mt: 1 }}>
            <TextField
              label="Account Email"
              type="email"
              fullWidth
              required
              placeholder="Enter your registered email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputProps={{
                inputMode: 'email',
                autoComplete: 'email',
                'aria-label': 'Account email for verification resend',
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MailOutline
                      sx={{
                        color: accentColor,
                        fontSize: 20,
                      }}
                    />
                  </InputAdornment>
                ),
                sx: {
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: panelText,
                  background: inputBackground,
                  borderRadius: 1.5,
                  minHeight: '48px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: inputBorder,
                    borderWidth: 2,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: inputBorderHover,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: accentColor,
                    boxShadow: `0 0 0 2px ${alpha(accentColor, 0.2)}`,
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: inputPlaceholder,
                    opacity: 1,
                  },
                },
              }}
              InputLabelProps={{
                sx: {
                  color: panelSoft,
                  fontWeight: 600,
                  '&.Mui-focused': {
                    color: accentColor,
                  },
                },
              }}
              sx={{ mb: 2.5 }}
            />
            <Button
              type="submit"
              disabled={resendLoading}
              aria-label="Send new verification link"
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                height: '48px',
                borderRadius: '24px',
                fontSize: '16px',
                fontWeight: 'bold',
                textTransform: 'none',
                mb: 2,
                width: '100%',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            >
              {resendLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Send New Link'
              )}
            </Button>
          </Box>

          {location.state?.message && (
            <Alert
              severity="success"
              sx={{
                mt: 2,
                borderRadius: 1.5,
                fontSize: '0.85rem'
              }}
            >
              {location.state.message}
            </Alert>
          )}

          {resendSent && (
            <Alert
              severity="success"
              sx={{
                mt: 2,
                borderRadius: 1.5,
                fontSize: '0.85rem'
              }}
            >
              Verification link sent successfully. Please check your inbox and spam folder.
            </Alert>
          )}
        </>
      )}

      <Box sx={{ mt: 3.5, display: 'flex', justifyContent: 'center' }}>
        <Typography variant="body2" sx={{ color: panelMuted }}>
          Back to{' '}
          <Link
            to="/login"
            style={{
              color: accentColor,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Sign In
          </Link>
        </Typography>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <PageCanvas
        disableContainer
        sx={{
          pt: { xs: 2, md: 4 },
          pb: { xs: withSafeAreaBottom(20), md: 6 },
        }}
      >
        <Box
          sx={{
            minHeight: '100dvh',
            bgcolor: 'background.default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 2,
            py: 3,
          }}
        >
          {content}
        </Box>
      </PageCanvas>
    );
  }

  return <AuthWrapper>{content}</AuthWrapper>;
};

export default VerifyEmailPage;
