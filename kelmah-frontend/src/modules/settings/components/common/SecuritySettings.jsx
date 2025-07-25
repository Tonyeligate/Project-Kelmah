import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import authApi from '../../../../api/services/authApi';
import { useAuth } from '../../../auth/contexts/AuthContext';
import { Link as RouterLink } from 'react-router-dom';

const SecuritySettings = () => {
  const { user, disableMfa } = useAuth();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [showDisable, setShowDisable] = useState(false);
  const [disableForm, setDisableForm] = useState({ password: '', token: '' });
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableSnackbar, setDisableSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDisableChange = (e) => {
    const { name, value } = e.target;
    setDisableForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDisableSubmit = async (e) => {
    e.preventDefault();
    setDisableLoading(true);
    try {
      await disableMfa(disableForm.password, disableForm.token);
      setDisableSnackbar({
        open: true,
        message: 'Two-factor authentication disabled.',
        severity: 'success',
      });
      setShowDisable(false);
    } catch (err) {
      setDisableSnackbar({
        open: true,
        message: err.response?.data?.message || err.message,
        severity: 'error',
      });
    } finally {
      setDisableLoading(false);
    }
  };

  const handleDisableClose = () =>
    setDisableSnackbar((prev) => ({ ...prev, open: false }));

  const handleSubmit = async () => {
    if (form.newPassword !== form.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'New passwords do not match',
        severity: 'error',
      });
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSnackbar({
        open: true,
        message: 'Password changed successfully',
        severity: 'success',
      });
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
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Update Password'}
        </Button>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleClose}
      >
        <Alert
          onClose={handleClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      <Box p={3} sx={{ mt: 4, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" gutterBottom>
          Two-Factor Authentication
        </Typography>
        {user?.isTwoFactorEnabled ? (
          <>
            <Typography>
              Two-factor authentication is currently <strong>enabled</strong>.
            </Typography>
            {!showDisable && (
              <Button
                variant="outlined"
                onClick={() => setShowDisable(true)}
                sx={{ mt: 1 }}
              >
                Disable Two-Factor Authentication
              </Button>
            )}
            {showDisable && (
              <Box
                component="form"
                onSubmit={handleDisableSubmit}
                sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
              >
                <TextField
                  label="Current Password"
                  name="password"
                  type="password"
                  value={disableForm.password}
                  onChange={handleDisableChange}
                  fullWidth
                  required
                />
                <TextField
                  label="Authentication Code"
                  name="token"
                  value={disableForm.token}
                  onChange={handleDisableChange}
                  fullWidth
                  required
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={disableLoading}
                >
                  {disableLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    'Confirm Disable'
                  )}
                </Button>
                <Button variant="text" onClick={() => setShowDisable(false)}>
                  Cancel
                </Button>
              </Box>
            )}
          </>
        ) : (
          <>
            <Typography>
              Two-factor authentication is currently <strong>disabled</strong>.
            </Typography>
            <Button
              variant="contained"
              component={RouterLink}
              to="/mfa/setup"
              sx={{ mt: 1 }}
            >
              Enable Two-Factor Authentication
            </Button>
          </>
        )}
        <Snackbar
          open={disableSnackbar.open}
          autoHideDuration={6000}
          onClose={handleDisableClose}
        >
          <Alert
            onClose={handleDisableClose}
            severity={disableSnackbar.severity}
            sx={{ width: '100%' }}
          >
            {disableSnackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default SecuritySettings;
