import React, { useState } from 'react';
import AuthWrapper from '../components/common/AuthWrapper';
import { Box, TextField, Button, Typography, Alert } from '@mui/material';
import authService from '../services/authService';
import { useParams, Link, useSearchParams } from 'react-router-dom';

const ResetPasswordPage = () => {
  const { token: paramToken } = useParams();
  const [searchParams] = useSearchParams();
  // Support token from URL params (/reset-password/:token) or query string (?token=xxx)
  const token = paramToken || searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

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

  return (
    <AuthWrapper>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ width: '100%', maxWidth: 360 }}
      >
        <Typography variant="h5" gutterBottom>
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
          type="password"
          fullWidth
          required
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextField
          label="Confirm Password"
          type="password"
          fullWidth
          required
          margin="normal"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2, minHeight: 44 }}>
          Reset Password
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

export default ResetPasswordPage;
