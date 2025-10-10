import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const AdvancedCalendar = () => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Availability Calendar
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Calendar integration placeholder. Connect to scheduling backend and
          render availability slots.
        </Typography>
      </Paper>
    </Box>
  );
};

export default AdvancedCalendar;
