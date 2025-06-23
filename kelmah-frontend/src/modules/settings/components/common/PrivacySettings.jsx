import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Button,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { useSettings } from '../../hooks/useSettings';

const PrivacySettings = () => {
  const {
    settings,
    loading,
    updatePrivacySettings
  } = useSettings();

  const [localPrivacy, setLocalPrivacy] = useState({
    profileVisibility: 'public',
    searchVisibility: true,
    dataSharing: false
  });
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (settings?.privacy) {
      setLocalPrivacy(settings.privacy);
    }
  }, [settings]);

  const handleToggle = (field) => (event) => {
    setLocalPrivacy((prev) => ({ ...prev, [field]: event.target.checked }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePrivacySettings(localPrivacy);
      setSnackbar({ open: true, message: 'Privacy settings updated', severity: 'success' });
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => setSnackbar((prev) => ({ ...prev, open: false }));

  return (
    <Box p={3} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" gutterBottom>
        Privacy Settings
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={localPrivacy.searchVisibility}
            onChange={handleToggle('searchVisibility')}
            color="primary"
          />
        }
        label="Appear in search results"
      />
      <FormControlLabel
        control={
          <Switch
            checked={localPrivacy.dataSharing}
            onChange={handleToggle('dataSharing')}
            color="primary"
          />
        }
        label="Allow data sharing with trusted partners"
      />
      {/* Profile visibility toggle between public/private could be implemented with select; keep simple */}
      <FormControlLabel
        control={
          <Switch
            checked={localPrivacy.profileVisibility === 'public'}
            onChange={() =>
              setLocalPrivacy((prev) => ({
                ...prev,
                profileVisibility: prev.profileVisibility === 'public' ? 'private' : 'public'
              }))
            }
            color="primary"
          />
        }
        label={`Profile visibility: ${localPrivacy.profileVisibility === 'public' ? 'Public' : 'Private'}`}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={handleSave} disabled={saving || loading}>
          {saving ? <CircularProgress size={24} /> : 'Save Changes'}
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

export default PrivacySettings; 