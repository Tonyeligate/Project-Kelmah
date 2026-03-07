import { useState } from 'react';
import { useSelector } from 'react-redux';
import { normalizeUser } from '../../../../utils/userUtils';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Stack,
  InputAdornment,
  IconButton,
} from '@mui/material';
import authService from '../../../auth/services/authService';
import { Link as RouterLink } from 'react-router-dom';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import SettingsSection from '../SettingsSection';

const SecuritySettings = () => {
  // FIXED: Use standardized user normalization for consistent user data access
  const { user: rawUser } = useSelector((state) => state.auth);
  const user = normalizeUser(rawUser);
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
  const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false, disable: false });
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
      await authService.disableMFA(disableForm.password, disableForm.token);
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
      await authService.changePassword({
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
      const msg = 'Failed to update security settings. Please try again.';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const buildPasswordAdornment = (key) => ({
    endAdornment: (
      <InputAdornment position="end">
        <IconButton
          edge="end"
          onClick={() => setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }))}
          aria-label={showPasswords[key] ? 'Hide password' : 'Show password'}
        >
          {showPasswords[key] ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      </InputAdornment>
    ),
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <SettingsSection
        title="Change Password"
        description="Choose a strong password that is different from the one you use on other apps."
      >
      <Stack spacing={2}>
        <Alert severity="info">Use at least 8 characters with a mix of letters, numbers, and symbols.</Alert>
      <TextField
        label="Current Password"
        name="currentPassword"
        type={showPasswords.current ? 'text' : 'password'}
        value={form.currentPassword}
        onChange={handleChange}
        fullWidth
        InputProps={buildPasswordAdornment('current')}
      />
      <TextField
        label="New Password"
        name="newPassword"
        type={showPasswords.next ? 'text' : 'password'}
        value={form.newPassword}
        onChange={handleChange}
        fullWidth
        InputProps={buildPasswordAdornment('next')}
      />
      <TextField
        label="Confirm New Password"
        name="confirmPassword"
        type={showPasswords.confirm ? 'text' : 'password'}
        value={form.confirmPassword}
        onChange={handleChange}
        fullWidth
        InputProps={buildPasswordAdornment('confirm')}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Update Password'}
        </Button>
      </Box>
      </Stack>
      </SettingsSection>
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
      <SettingsSection
        title="Two-Factor Authentication"
        description="Add an extra layer of protection when you sign in from a new device."
      >
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
                  type={showPasswords.disable ? 'text' : 'password'}
                  value={disableForm.password}
                  onChange={handleDisableChange}
                  fullWidth
                  required
                  InputProps={buildPasswordAdornment('disable')}
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
      </SettingsSection>
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
  );
};

export default SecuritySettings;
