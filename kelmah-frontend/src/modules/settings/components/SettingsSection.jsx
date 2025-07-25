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
  selectLoading,
  selectError,
} from '../../../../store/slices/settingsSlice';

const SettingsSection = ({
  title,
  description,
  children,
  loading,
  error,
  sx = {},
}) => {
  const globalLoading = useSelector(selectLoading);
  const globalError = useSelector(selectError);

  return (
    <Paper
      sx={{
        p: 3,
        mb: 3,
        ...sx,
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
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
