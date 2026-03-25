import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';

const EarningsReports = ({
  summary = { monthly: 0, yearly: 0, pending: 0 },
}) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Earnings Reports
      </Typography>
      <Grid container spacing={2}>
        {[
          { label: 'This Month', value: summary.monthly },
          { label: 'This Year', value: summary.yearly },
          { label: 'Pending', value: summary.pending },
        ].map((item) => (
          <Grid item xs={12} sm={4} key={item.label}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary">
                {item.label}
              </Typography>
              <Typography variant="h6">
                {new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(Number(item.value || 0))}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default EarningsReports;
