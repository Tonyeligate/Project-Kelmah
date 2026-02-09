import React, { useState } from 'react';
import AuthWrapper from '../components/common/AuthWrapper';
import { Box, TextField, Button, Typography, Alert, IconButton, InputAdornment, useMediaQuery, useTheme } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import authService from '../services/authService';
import { useParams, Link, useSearchParams } from 'react-router-dom';

const ResetPasswordPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { token: paramToken } = useParams();
  const [searchParams] = useSearchParams();
  // Support token from URL params (/reset-password/:token) or query string (?token=xxx)
  const token = paramToken || searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Reset token is missing. Please use the link from your email.');
      return;
    }
    try {
      const res = await authService.resetPassword(token, password);
      setStatus(res.message || 'Password reset successful. You can now login.');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const formContent = (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ width: '100%', maxWidth: 400 }}
    >
      <Typography variant="h5" gutterBottom sx={isMobile ? { color: '#fff', fontWeight: 700 } : {}}>
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
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        inputProps={{ style: { fontSize: 16 } }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end"
                sx={{ minWidth: 44, minHeight: 44 }}>
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={isMobile ? {
          '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff' },
          '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
        } : {}}
      />
      <TextField
        label="Confirm Password"
        type={showConfirm ? 'text' : 'password'}
        fullWidth
        required
        margin="normal"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        inputProps={{ style: { fontSize: 16 } }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end"
                sx={{ minWidth: 44, minHeight: 44 }}>
                {showConfirm ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={isMobile ? {
          '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff' },
          '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
        } : {}}
      />
      <Button type="submit" variant="contained" fullWidth sx={{ mt: 2, minHeight: 48, borderRadius: isMobile ? '24px' : 1 }}>
        Reset Password
      </Button>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={isMobile ? { color: 'rgba(255,255,255,0.7)' } : {}}>
          Remembered your password? <Link to="/login" style={{ color: '#FFD700' }}>Login</Link>
  // Mobile: dark standalone layout matching MobileLogin pattern
  if (isMobile) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', px: 3, py: 4 }}>
        {formContent}
      </Box>
    );
  }

  // Desktop: use AuthWrapper
  return (
    <AuthWrapper>
      {formContent}
    </AuthWrapper>
  );
};

export default ResetPasswordPage;
