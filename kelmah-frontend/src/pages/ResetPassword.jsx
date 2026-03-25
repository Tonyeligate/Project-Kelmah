import React, { useMemo, useState } from 'react';
import { Alert, Box, Button, IconButton, InputAdornment, TextField, Typography, useTheme } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import authService from '../modules/auth/services/authService';
import { Helmet } from 'react-helmet-async';
import { useBreakpointDown } from '@/hooks/useResponsive';
import PageCanvas from '../modules/common/components/PageCanvas';

const ResetPassword = () => {
  const theme = useTheme();
  const isMobile = useBreakpointDown('md');
  const navigate = useNavigate();

  const { token: paramToken } = useParams();
  const [searchParams] = useSearchParams();

  const token = useMemo(() => paramToken || searchParams.get('token'), [paramToken, searchParams]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    setError('');

    if (!token) {
      setError('Reset token is missing. Please use the link from your email.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password.length > 128) {
      setError('Password must not exceed 128 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.resetPassword(token, password);
      setStatus(res?.message || 'Password reset successful. You can now sign in.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Password reset failed. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 420 }}>
      <Helmet><title>Reset Password | Kelmah</title></Helmet>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ fontWeight: 700, color: 'text.primary' }}
      >
        Reset Password
      </Typography>
      <Typography variant="body2" sx={{ mb: 1.5, color: 'text.secondary' }}>
        Choose a new password you can remember. You can sign in right after saving.
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
        label="New Password"
        type={showPassword ? 'text' : 'password'}
        fullWidth
        required
        disabled={loading}
        margin="normal"
        helperText="Use at least 8 characters."
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        inputProps={{ autoComplete: 'new-password', style: { fontSize: 16 }, 'aria-label': 'New password' }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword((prev) => !prev)}
                edge="end"
                sx={{ minWidth: 44, minHeight: 44 }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <TextField
        label="Confirm Password"
        type={showConfirm ? 'text' : 'password'}
        fullWidth
        required
        disabled={loading}
        margin="normal"
        helperText="Type the same password again."
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        inputProps={{ autoComplete: 'new-password', style: { fontSize: 16 }, 'aria-label': 'Confirm new password' }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowConfirm((prev) => !prev)}
                edge="end"
                sx={{ minWidth: 44, minHeight: 44 }}
                aria-label={showConfirm ? 'Hide password confirmation' : 'Show password confirmation'}
              >
                {showConfirm ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        aria-label="Save new password"
        sx={{ mt: 2, minHeight: 48, borderRadius: isMobile ? '24px' : 1 }}
      >
        {loading ? 'Saving new password...' : 'Save New Password'}
      </Button>

      {status && (
        <Button
          variant="outlined"
          fullWidth
          onClick={() => navigate('/login')}
          sx={{ mt: 1.25, minHeight: 44 }}
        >
          Go to Sign in
        </Button>
      )}

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Remember your password now?{' '}
          <Link to="/login" style={{ color: 'inherit', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </Typography>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <PageCanvas disableContainer sx={{ pt: { xs: 3, md: 4 }, pb: { xs: 4, md: 6 } }}>
        <Box
          sx={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            px: 3,
            py: 4,
          }}
        >
          {content}
        </Box>
      </PageCanvas>
    );
  }

  return (
    <PageCanvas disableContainer sx={{ pt: { xs: 3, md: 4 }, pb: { xs: 4, md: 6 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6, px: 3 }}>{content}</Box>
    </PageCanvas>
  );
};

export default ResetPassword;
