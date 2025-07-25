import React, { useState } from 'react';
import AuthWrapper from '../components/common/AuthWrapper';
import { Box, TextField, Button, Typography, Alert } from '@mui/material';
import authApi from '../../../api/services/authApi';
import { Link } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    setError('');
    try {
      const res = await authApi.requestPasswordReset({ email });
      setStatus(
        res.message || 'If that email exists, a reset link has been sent.',
      );
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
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
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
