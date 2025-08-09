import React, { useMemo, useState } from 'react';
import { Box, Typography, Paper, Grid, TextField } from '@mui/material';

const BudgetEstimator = () => {
  const [rate, setRate] = useState(150);
  const [hours, setHours] = useState(20);
  const [materials, setMaterials] = useState(500);
  const [contingency, setContingency] = useState(10);

  const estimate = useMemo(() => {
    const labor = rate * hours;
    const base = labor + materials;
    return Math.round(base * (1 + contingency / 100));
  }, [rate, hours, materials, contingency]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Budget Estimator</Typography>
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}><TextField label="Hourly Rate (GHS)" type="number" fullWidth value={rate} onChange={(e) => setRate(Number(e.target.value))} /></Grid>
          <Grid item xs={12} sm={3}><TextField label="Estimated Hours" type="number" fullWidth value={hours} onChange={(e) => setHours(Number(e.target.value))} /></Grid>
          <Grid item xs={12} sm={3}><TextField label="Materials (GHS)" type="number" fullWidth value={materials} onChange={(e) => setMaterials(Number(e.target.value))} /></Grid>
          <Grid item xs={12} sm={3}><TextField label="Contingency (%)" type="number" fullWidth value={contingency} onChange={(e) => setContingency(Number(e.target.value))} /></Grid>
          <Grid item xs={12}><Typography variant="subtitle1">Estimated Budget: GHS {estimate.toLocaleString()}</Typography></Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default BudgetEstimator;




