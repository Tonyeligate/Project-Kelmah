import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import authService from '../modules/auth/services/authService';

const ResetPassword = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
      setError(err?.response?.data?.message || err?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 420 }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={isMobile ? { color: '#fff', fontWeight: 700 } : { fontWeight: 700 }}
      >
        Reset Password
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
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        inputProps={{ autoComplete: 'new-password', style: { fontSize: 16 } }}
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
        sx={
          isMobile
            ? {
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
              }
            : {}
        }
      />

      <TextField
        label="Confirm Password"
        type={showConfirm ? 'text' : 'password'}
        fullWidth
        required
        disabled={loading}
        margin="normal"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        inputProps={{ autoComplete: 'new-password', style: { fontSize: 16 } }}
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
        sx={
          isMobile
            ? {
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
              }
            : {}
        }
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        sx={{ mt: 2, minHeight: 48, borderRadius: isMobile ? '24px' : 1 }}
      >
        {loading ? 'Resetting password...' : 'Reset Password'}
      </Button>

      {status && (
        <Button
          variant="outlined"
          fullWidth
          onClick={() => navigate('/login')}
          sx={{ mt: 1.25, minHeight: 44 }}
        >
          Continue to Sign in
        </Button>
      )}

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={isMobile ? { color: 'rgba(255,255,255,0.7)' } : {}}>
          Remembered your password?{' '}
          <Link to="/login" style={{ color: '#FFD700', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </Typography>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Box
        sx={{
          minHeight: '100dvh',
          bgcolor: 'background.default',
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
    );
  }

  return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6, px: 3 }}>{content}</Box>;
};

export default ResetPassword;
