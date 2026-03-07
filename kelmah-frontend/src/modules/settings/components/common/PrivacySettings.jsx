import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Stack,
  FormControl,
  RadioGroup,
  Radio,
} from '@mui/material';
import PropTypes from 'prop-types';
import SettingsSection from '../SettingsSection';

const PrivacySettings = ({ settings = null, loading = false, updatePrivacySettings }) => {

  const [localPrivacy, setLocalPrivacy] = useState({
    profileVisibility: 'public',
    searchVisibility: true,
    dataSharing: false,
  });
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

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
      setSnackbar({
        open: true,
        message: 'Privacy settings updated',
        severity: 'success',
      });
    } catch (error) {
      const msg = 'Failed to update privacy settings. Please try again.';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => setSnackbar((prev) => ({ ...prev, open: false }));

  return (
    <>
      <SettingsSection
        title="Privacy Settings"
        description="Decide how discoverable your worker profile is and whether Kelmah may share non-sensitive data with trusted partners."
        loading={loading}
      >
        <Stack spacing={1.5}>
          <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
            <FormControlLabel
              sx={{ alignItems: 'flex-start', m: 0, width: '100%', justifyContent: 'space-between' }}
              control={
                <Switch
                  checked={localPrivacy.searchVisibility}
                  onChange={handleToggle('searchVisibility')}
                  color="primary"
                />
              }
              label={(
                <Box sx={{ pr: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700}>Appear in search results</Typography>
                  <Typography variant="body2" color="text.secondary">Let hirers discover your profile when they search for workers.</Typography>
                </Box>
              )}
              labelPlacement="start"
            />
          </Box>
          <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
            <FormControlLabel
              sx={{ alignItems: 'flex-start', m: 0, width: '100%', justifyContent: 'space-between' }}
              control={
                <Switch
                  checked={localPrivacy.dataSharing}
                  onChange={handleToggle('dataSharing')}
                  color="primary"
                />
              }
              label={(
                <Box sx={{ pr: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700}>Allow trusted data sharing</Typography>
                  <Typography variant="body2" color="text.secondary">Share limited profile data with trusted Kelmah partners when it improves matching.</Typography>
                </Box>
              )}
              labelPlacement="start"
            />
          </Box>
          <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
              Profile visibility
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Choose whether your profile is visible to the public or only to you.
            </Typography>
            <FormControl>
              <RadioGroup
                value={localPrivacy.profileVisibility}
                onChange={(event) =>
                  setLocalPrivacy((prev) => ({
                    ...prev,
                    profileVisibility: event.target.value,
                  }))
                }
              >
                <FormControlLabel value="public" control={<Radio />} label="Public — hirers can view your profile" />
                <FormControlLabel value="private" control={<Radio />} label="Private — only you can view your profile" />
              </RadioGroup>
            </FormControl>
          </Box>
        </Stack>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </Box>
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
    </>
  );
};

PrivacySettings.propTypes = {
  settings: PropTypes.shape({
    privacy: PropTypes.object,
  }),
  loading: PropTypes.bool,
  updatePrivacySettings: PropTypes.func.isRequired,
};



export default PrivacySettings;
