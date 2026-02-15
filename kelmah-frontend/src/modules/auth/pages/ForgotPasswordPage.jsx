import React, { useState } from 'react';
import AuthWrapper from '../components/common/AuthWrapper';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  useMediaQuery,
  IconButton,
  useTheme,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import authService from '../services/authService';
import { Link, useNavigate } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const theme = useTheme();
  const isActualMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    setError('');
    try {
      const res = await authService.forgotPassword(email);
      setStatus(
        res.message || 'If that email exists, a reset link has been sent.',
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  // Mobile-first forgot password view
  if (isActualMobile) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          color: 'text.primary',
          fontFamily: 'Manrope, "Noto Sans", sans-serif',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, pb: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <IconButton
              onClick={() => navigate('/login')}
              sx={{ color: 'text.primary', mr: 2, minWidth: 44, minHeight: 44 }}
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
              mt: 5,
            }}
          >
            Forgot your password?
          </Typography>

          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: '16px',
              mb: 3,
              lineHeight: 1.5,
            }}
          >
            Enter the email address or phone number associated with your
            account, and we'll send you instructions to reset your password.
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
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Email or Phone"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                height: '48px',
                borderRadius: '24px',
                fontSize: '16px',
                fontWeight: 'bold',
                textTransform: 'none',
                mb: 3,
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            >
              Request Reset
            </Button>
          </Box>
        </Box>

        {/* Bottom Section */}
        <Box sx={{ p: 2 }}>
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
          <Box sx={{ height: '20px', bgcolor: 'background.default' }} />
        </Box>
      </Box>
    );
  }

  return (
    <AuthWrapper>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ width: '100%', maxWidth: 360 }}
      >
        <Typography variant="h5" gutterBottom>
          Forgot Password
        </Typography>
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
        <TextField
          label="Email"
          type="email"
          fullWidth
          required
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2, minHeight: 44 }}>
          Send Reset Link
        </Button>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">
            Remembered your password? <Link to="/login">Login</Link>
          </Typography>
        </Box>
      </Box>
    </AuthWrapper>
  );
};

export default ForgotPasswordPage;
