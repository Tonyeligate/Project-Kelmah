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

const PASSWORD_REQUIREMENTS = [
  {
    test: (value) => value.length >= 12,
    message: 'Password must be at least 12 characters long.',
  },
  {
    test: (value) => /[A-Z]/.test(value),
    message: 'Password must contain at least one uppercase letter.',
  },
  {
    test: (value) => /[a-z]/.test(value),
    message: 'Password must contain at least one lowercase letter.',
  },
  {
    test: (value) => /\d/.test(value),
    message: 'Password must contain at least one number.',
  },
  {
    test: (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
    message: 'Password must contain at least one special character.',
  },
];

const getPasswordValidationErrors = (password = '') =>
  PASSWORD_REQUIREMENTS
    .filter((rule) => !rule.test(password))
    .map((rule) => rule.message);

const extractApiErrorMessage = (error) => {
  const fallbackMessage = 'Failed to update security settings. Please try again.';
  const responseData = error?.response?.data;

  if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
    const message = responseData.errors
      .map((issue) => issue?.message || issue?.msg)
      .filter(Boolean)
      .join(' ')
      .trim();
    if (message) return message;
  }

  return (
    responseData?.error?.message ||
    responseData?.message ||
    error?.message ||
    fallbackMessage
  );
};

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
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Please complete all password fields.',
        severity: 'error',
      });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'New passwords do not match',
        severity: 'error',
      });
      return;
    }

    const passwordErrors = getPasswordValidationErrors(form.newPassword);
    if (passwordErrors.length > 0) {
      setSnackbar({
        open: true,
        message: passwordErrors[0],
        severity: 'error',
      });
      return;
    }

    if (form.currentPassword === form.newPassword) {
      setSnackbar({
        open: true,
        message: 'New password must be different from your current password.',
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
      setSnackbar({
        open: true,
        message: extractApiErrorMessage(error),
        severity: 'error',
      });
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
          sx={{
            '&:focus-visible': {
              outline: '3px solid',
              outlineColor: 'primary.main',
              outlineOffset: '2px',
            },
          }}
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
        <Alert severity="info">Use at least 12 characters with uppercase, lowercase, number, and symbol.</Alert>
      <TextField
        label="Current Password"
        name="currentPassword"
        type={showPasswords.current ? 'text' : 'password'}
        value={form.currentPassword}
        onChange={handleChange}
        fullWidth
        required
        autoComplete="current-password"
        InputProps={buildPasswordAdornment('current')}
      />
      <TextField
        label="New Password"
        name="newPassword"
        type={showPasswords.next ? 'text' : 'password'}
        value={form.newPassword}
        onChange={handleChange}
        fullWidth
        required
        autoComplete="new-password"
        InputProps={buildPasswordAdornment('next')}
      />
      <TextField
        label="Confirm New Password"
        name="confirmPassword"
        type={showPasswords.confirm ? 'text' : 'password'}
        value={form.confirmPassword}
        onChange={handleChange}
        fullWidth
        required
        autoComplete="new-password"
        InputProps={buildPasswordAdornment('confirm')}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={handleSubmit} disabled={loading} sx={{ minHeight: 44 }}>
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
                sx={{ mt: 1, minHeight: 44 }}
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
                  autoComplete="current-password"
                  InputProps={buildPasswordAdornment('disable')}
                />
                <TextField
                  label="Authentication Code"
                  name="token"
                  value={disableForm.token}
                  onChange={handleDisableChange}
                  fullWidth
                  required
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={disableLoading}
                  sx={{ minHeight: 44 }}
                >
                  {disableLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    'Confirm Disable'
                  )}
                </Button>
                <Button variant="text" onClick={() => setShowDisable(false)} sx={{ minHeight: 44 }}>
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
              sx={{ mt: 1, minHeight: 44 }}
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

