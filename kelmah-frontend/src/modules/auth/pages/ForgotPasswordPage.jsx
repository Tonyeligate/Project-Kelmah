import React, { useState } from 'react';
import AuthWrapper from '../components/common/AuthWrapper';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { ArrowBack, EmailOutlined } from '@mui/icons-material';
import authService from '../services/authService';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useBreakpointDown } from '@/hooks/useResponsive';
import PageCanvas from '@/modules/common/components/PageCanvas';
import { withSafeAreaBottom, withSafeAreaTop } from '@/utils/safeArea';

const ForgotPasswordPage = () => {
  const isActualMobile = useBreakpointDown('md');
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setStatus(
        'If we find this email, we will send a reset link in a few minutes.',
      );
    } catch (err) {
      // AUD2-M07 FIX: Use generic error message to prevent email enumeration attacks.
      // Server-specific messages (e.g. "User not found") would let attackers confirm
      // which email addresses exist in the system.
      setError(
        'We could not send reset instructions now. Please try again shortly.',
      );
    } finally {
      setLoading(false);
    }
  };

  // Mobile-first forgot password view
  if (isActualMobile) {
    return (
      <PageCanvas
        disableContainer
        sx={{ pt: 0, pb: 0 }}
      >
        <Box
          sx={{
            minHeight: '100dvh',
            bgcolor: 'background.default',
            color: 'text.primary',
            fontFamily: 'Manrope, "Noto Sans", sans-serif',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Header */}
          <Box sx={{ px: 2, pt: withSafeAreaTop(8), pb: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <IconButton
                onClick={() => navigate('/login')}
                sx={{
                  color: 'text.primary',
                  mr: 2,
                  minWidth: 44,
                  minHeight: 44,
                  '&:focus-visible': {
                    outline: '3px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: '2px',
                  },
                }}
                aria-label="Back to login"
              >
                <ArrowBack />
              </IconButton>
              <Typography
                variant="h6"
                sx={{
                  color: 'text.primary',
                  fontWeight: 'bold',
                  fontSize: '18px',
                  textAlign: 'center',
                  flex: 1,
                  pr: 6,
                }}
              >
                Reset Password
              </Typography>
            </Box>
          </Box>

          {/* Main Content */}
          <Box sx={{ flex: 1, px: 2 }}>
            <Typography
              variant="h5"
              sx={{
                color: 'text.primary',
                fontWeight: 'bold',
                fontSize: '24px',
                mb: 2,
                mt: 3,
              }}
            >
              Forgot your password?
            </Typography>

            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: '16px',
                mb: 2,
                lineHeight: 1.5,
              }}
            >
              Enter the email you used to sign up. If it matches an account, we
              will send password reset steps.
            </Typography>

            {/* Status Alert */}
            {status && (
              <Alert
                severity="success"
                sx={{
                  mb: 2,
                  bgcolor: (t) => `${t.palette.success.main}14`,
                  color: 'success.main',
                  border: (t) => `1px solid ${t.palette.success.main}4D`,
                  borderRadius: '12px',
                  '& .MuiAlert-icon': { color: 'success.main' },
                }}
              >
                {status}
              </Alert>
            )}

            {/* Error Alert */}
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  bgcolor: (t) => `${t.palette.error.main}14`,
                  color: 'error.main',
                  border: (t) => `1px solid ${t.palette.error.main}4D`,
                  borderRadius: '12px',
                  '& .MuiAlert-icon': { color: 'error.main' },
                }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              {/* Email Field */}
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  type="email"
                  placeholder="Email used for your Kelmah account"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  inputProps={{
                    'aria-label': 'Email used for your Kelmah account',
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'background.paper',
                      borderRadius: '12px',
                      height: '56px',
                      border: 'none',
                      '& fieldset': { border: 'none' },
                      '&:hover fieldset': { border: 'none' },
                      '&.Mui-focused fieldset': { border: 'none' },
                    },
                    '& .MuiOutlinedInput-input': {
                      color: 'text.primary',
                      fontSize: '16px',
                      padding: '16px',
                      '&::placeholder': {
                        color: 'text.secondary',
                        opacity: 1,
                      },
                    },
                  }}
                />
              </Box>

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                disabled={loading}
                aria-label="Send reset link to email"
                sx={{
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  height: '48px',
                  borderRadius: '24px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  mb: 2,
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </Box>
          </Box>

          {/* Bottom Section */}
          <Box sx={{ px: 2, pt: 1.5, pb: withSafeAreaBottom(12) }}>
            <Typography
              component={Link}
              to="/login"
              sx={{
                color: 'text.secondary',
                fontSize: '14px',
                textAlign: 'center',
                display: 'block',
                textDecoration: 'underline',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              Back to Login
            </Typography>
          </Box>
        </Box>
      </PageCanvas>
    );
  }

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

  return (
    <AuthWrapper>
      <Helmet>
        <title>Forgot Password | Kelmah</title>
      </Helmet>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ width: '100%', maxWidth: 380, mx: 'auto' }}
      >
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            fontWeight: 800,
            color: accentColor,
            fontSize: '1.6rem',
            textAlign: 'center',
            mb: 1.5,
            textShadow: `0 2px 10px ${alpha(accentColor, 0.24)}`
          }}
        >
          Forgot Password
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: panelMuted,
            textAlign: 'center',
            mb: 3,
            lineHeight: 1.5
          }}
        >
          Enter the email address you used to register and we'll send you a link to reset your password.
        </Typography>

        {status && (
          <Alert
            severity="success"
            sx={{
              mb: 2.5,
              borderRadius: 1.5,
              fontSize: '0.85rem'
            }}
          >
            {status}
          </Alert>
        )}
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2.5,
              borderRadius: 1.5,
              fontSize: '0.85rem'
            }}
          >
            {error}
          </Alert>
        )}

        <TextField
          label="Email Address"
          type="email"
          fullWidth
          required
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          inputProps={{
            'aria-label': 'Email used for your Kelmah account',
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailOutlined
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
          sx={{ mb: 3 }}
        />

        <Button
          type="submit"
          fullWidth
          disabled={loading}
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            height: '48px',
            borderRadius: '24px',
            fontSize: '16px',
            fontWeight: 'bold',
            textTransform: 'none',
            mb: 2.5,
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Send Reset Link'
          )}
        </Button>
        <Box sx={{ textCenter: 'center', display: 'flex', justifyContent: 'center' }}>
          <Typography variant="body2" sx={{ color: panelMuted }}>
            Remembered your password?{' '}
            <Link
              to="/login"
              style={{
                color: accentColor,
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              Sign In
            </Link>
          </Typography>
        </Box>
      </Box>
    </AuthWrapper>
  );
};

export default ForgotPasswordPage;
