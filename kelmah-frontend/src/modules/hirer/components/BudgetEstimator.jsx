import React, { useMemo, useState } from 'react';
import { Box, Typography, Paper, Grid, TextField } from '@mui/material';

const BudgetEstimator = () => {
  const [rate, setRate] = useState(150);
  const [hours, setHours] = useState(20);
  const [materials, setMaterials] = useState(500);
  const [contingency, setContingency] = useState(10);

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const estimate = useMemo(() => {
    const labor = Math.max(0, rate) * Math.max(0, hours);
    const base = labor + Math.max(0, materials);
    return Math.round(base * (1 + clamp(contingency, 0, 100) / 100));
  }, [rate, hours, materials, contingency]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Budget Estimator
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Hourly Rate (GHS)"
              type="number"
              fullWidth
              value={rate}
              onChange={(e) => setRate(Math.max(0, Number(e.target.value)))}
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Estimated Hours"
              type="number"
              fullWidth
              value={hours}
              onChange={(e) => setHours(Math.max(0, Number(e.target.value)))}
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Materials (GHS)"
              type="number"
              fullWidth
              value={materials}
              onChange={(e) => setMaterials(Math.max(0, Number(e.target.value)))}
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Contingency (%)"
              type="number"
              fullWidth
              value={contingency}
              onChange={(e) => setContingency(clamp(Number(e.target.value), 0, 100))}
              inputProps={{ min: 0, max: 100 }}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" aria-live="polite">
              Estimated Budget: GHS {estimate.toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default BudgetEstimator;
