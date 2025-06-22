import React, { useState } from 'react';
import { Box, Typography, TextField, Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import authApi from '../../../../api/services/authApi';

const SecuritySettings = () => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (form.newPassword !== form.confirmPassword) {
      setSnackbar({ open: true, message: 'New passwords do not match', severity: 'error' });
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setSnackbar({ open: true, message: 'Password changed successfully', severity: 'success' });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => setSnackbar((prev) => ({ ...prev, open: false }));

  return (
    <Box p={3} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" gutterBottom>
        Change Password
      </Typography>
      <TextField
        label="Current Password"
        name="currentPassword"
        type="password"
        value={form.currentPassword}
        onChange={handleChange}
        fullWidth
      />
      <TextField
        label="New Password"
        name="newPassword"
        type="password"
        value={form.newPassword}
        onChange={handleChange}
        fullWidth
      />
      <TextField
        label="Confirm New Password"
        name="confirmPassword"
        type="password"
        value={form.confirmPassword}
        onChange={handleChange}
        fullWidth
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Update Password'}
        </Button>
      </Box>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SecuritySettings;
