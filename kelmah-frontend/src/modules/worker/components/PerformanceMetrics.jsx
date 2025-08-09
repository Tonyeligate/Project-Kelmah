import React from 'react';
import { Box, Typography, Paper, LinearProgress, Stack } from '@mui/material';

const Metric = ({ label, value }) => (
  <Box>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <LinearProgress variant="determinate" value={Math.max(0, Math.min(100, value))} sx={{ height: 8, borderRadius: 1 }} />
  </Box>
);

const PerformanceMetrics = ({ metrics = { onTime: 80, quality: 85, satisfaction: 90 } }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Performance Metrics</Typography>
      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Metric label="On-time Completion" value={metrics.onTime} />
          <Metric label="Work Quality" value={metrics.quality} />
          <Metric label="Client Satisfaction" value={metrics.satisfaction} />
        </Stack>
      </Paper>
    </Box>
  );
};

export default PerformanceMetrics;




