import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, CircularProgress, Snackbar, Alert, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useProfile } from '../../../profile/hooks/useProfile';
import { selectProfile, selectProfileLoading, selectProfileError } from '../../../../store/slices/profileSlice';

const AccountSettings = () => {
  const dispatch = useDispatch();
  const profile = useSelector(selectProfile);
  const loading = useSelector(selectProfileLoading);
  const error = useSelector(selectProfileError);
  const { updateProfile } = useProfile();

  const [formData, setFormData] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    setFormData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
    });
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setSnackbar({ open: true, message: 'Account settings updated!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Error updating settings', severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Account Settings
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} fullWidth />
        <TextField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} fullWidth />
        <TextField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} fullWidth />
        <TextField label="Phone" name="phone" value={formData.phone} onChange={handleChange} fullWidth />
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={handleSave} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </Box>
      </Box>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AccountSettings;
