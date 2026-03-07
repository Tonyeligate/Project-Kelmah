import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useSelector } from 'react-redux';
import {
  selectSettingsLoading,
  selectSettingsError,
} from '../../../store/slices/settingsSlice';

const SettingsSection = ({
  title,
  description,
  children,
  loading,
  error,
  sx = {},
}) => {
  const globalLoading = useSelector(selectSettingsLoading);
  const globalError = useSelector(selectSettingsError);

  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3 },
        mb: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        ...sx,
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640, lineHeight: 1.6 }}>
            {description}
          </Typography>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {(loading || globalLoading) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {(error || globalError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || globalError}
        </Alert>
      )}

      {children}
    </Paper>
  );
};

export default SettingsSection;
