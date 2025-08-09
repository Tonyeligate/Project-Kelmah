import React, { useMemo, useState } from 'react';
import { Box, Typography, Paper, Grid, TextField } from '@mui/material';

const RateCalculator = () => {
  const [hourlyRate, setHourlyRate] = useState(100);
  const [hours, setHours] = useState(8);
  const [days, setDays] = useState(5);

  const weekly = useMemo(() => hourlyRate * hours * days, [hourlyRate, hours, days]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Rate Calculator</Typography>
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField label="Hourly Rate (GHS)" type="number" fullWidth value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Hours/Day" type="number" fullWidth value={hours} onChange={(e) => setHours(Number(e.target.value))} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Days/Week" type="number" fullWidth value={days} onChange={(e) => setDays(Number(e.target.value))} />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1">Estimated Weekly Earnings: GHS {weekly.toLocaleString()}</Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default RateCalculator;




