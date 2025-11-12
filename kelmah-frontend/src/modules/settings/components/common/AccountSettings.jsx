import React, { useState, useEffect, useMemo } from 'react';
import { Box, TextField, Button, CircularProgress, Snackbar, Alert, Typography, Skeleton } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useProfile } from '../../../profile/hooks/useProfile';
import {
  selectProfile,
  selectProfileLoading,
  selectProfileError,
} from '../../../../store/slices/profileSlice';
import { VALIDATION } from '../../../../config/environment';

const AccountSettings = () => {
  const dispatch = useDispatch();
  const profile = useSelector(selectProfile);
  const loading = useSelector(selectProfileLoading);
  const error = useSelector(selectProfileError);
  const { user } = useSelector((state) => state.auth);
  const { updateProfile, loadProfile } = useProfile();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [isHydrated, setIsHydrated] = useState(false);

  const showSkeleton = useMemo(() => !isHydrated && loading, [isHydrated, loading]);

  useEffect(() => {
    if (!profile) {
      loadProfile().catch(() => {
        setSnackbar({
          open: true,
          message: 'Unable to load account details. Please try again shortly.',
          severity: 'error',
        });
      });
    }
  }, [profile, loadProfile]);

  // Load profile data on mount
  // Update form when profile or user data changes
  useEffect(() => {
    const profileData = profile || user;
    if (profileData) {
      setFormData({
        firstName: profileData.firstName || profileData.name?.split(' ')[0] || '',
        lastName: profileData.lastName || profileData.name?.split(' ')[1] || '',
        email: profileData.email || '',
        phone: profileData.phone || profileData.phoneNumber || '',
      });
      setFormErrors({});
      setIsHydrated(true);
    }
  }, [profile, user]);

  useEffect(() => {
    if (error) {
      setSnackbar({
        open: true,
        message: error,
        severity: 'error',
      });
    }
  }, [error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.firstName?.trim()) {
      nextErrors.firstName = 'First name is required';
    }

    if (!formData.lastName?.trim()) {
      nextErrors.lastName = 'Last name is required';
    }

    if (!formData.email?.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!VALIDATION.email.test(formData.email.trim())) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (formData.phone?.trim()) {
      const sanitizedPhone = formData.phone.replace(/\s+/g, '');
      if (!VALIDATION.phone.test(sanitizedPhone)) {
        nextErrors.phone = 'Enter a valid phone number';
      }
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (event) => {
    event?.preventDefault();

    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Please correct the highlighted fields.',
        severity: 'error',
      });
      return;
    }

    try {
      const updated = await updateProfile(formData);
      if (updated) {
        setFormData((prev) => ({ ...prev, ...updated }));
      }
      setSnackbar({
        open: true,
        message: 'Account settings updated!',
        severity: 'success',
      });
      setFormErrors({});
      await loadProfile();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || 'Error updating settings',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const isSaving = loading && isHydrated;

  return (
    <Box component="section" sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Account Settings
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {showSkeleton ? (
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Skeleton variant="text" height={56} />
          <Skeleton variant="text" height={56} />
          <Skeleton variant="text" height={56} />
          <Skeleton variant="text" height={56} />
          <Skeleton variant="rectangular" height={44} sx={{ borderRadius: 1 }} />
        </Box>
      ) : (
        <Box
          component="form"
          noValidate
          onSubmit={handleSave}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            error={Boolean(formErrors.firstName)}
            helperText={formErrors.firstName}
            fullWidth
            disabled={isSaving}
          />
          <TextField
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            error={Boolean(formErrors.lastName)}
            helperText={formErrors.lastName}
            fullWidth
            disabled={isSaving}
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={Boolean(formErrors.email)}
            helperText={formErrors.email}
            fullWidth
            disabled={isSaving}
          />
          <TextField
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            error={Boolean(formErrors.phone)}
            helperText={formErrors.phone || 'Include country code e.g. +233...' }
            fullWidth
            disabled={isSaving}
          />
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button type="submit" variant="contained" disabled={isSaving}>
              {isSaving ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AccountSettings;
