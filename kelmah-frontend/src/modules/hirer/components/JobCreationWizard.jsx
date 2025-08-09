import React, { useState } from 'react';
import { Box, Stepper, Step, StepLabel, Button, Paper, Typography, TextField, Grid } from '@mui/material';

const steps = ['Basics', 'Requirements', 'Budget', 'Timeline'];

const JobCreationWizard = ({ onSubmit }) => {
  const [active, setActive] = useState(0);
  const [form, setForm] = useState({ title: '', description: '', skills: '', budget: '', startDate: '', endDate: '' });

  const next = () => setActive((v) => Math.min(v + 1, steps.length - 1));
  const back = () => setActive((v) => Math.max(v - 1, 0));
  const submit = () => onSubmit?.(form);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Job Posting Wizard</Typography>
      <Paper sx={{ p: 2 }}>
        <Stepper activeStep={active} sx={{ mb: 3 }}>
          {steps.map((s) => (
            <Step key={s}><StepLabel>{s}</StepLabel></Step>
          ))}
        </Stepper>

        {active === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField fullWidth label="Job Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={4} label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Grid>
          </Grid>
        )}
        {active === 1 && (
          <TextField fullWidth label="Required Skills (comma-separated)" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
        )}
        {active === 2 && (
          <TextField fullWidth type="number" label="Budget (GHS)" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
        )}
        {active === 3 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField fullWidth type="date" label="Start Date" InputLabelProps={{ shrink: true }} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth type="date" label="End Date" InputLabelProps={{ shrink: true }} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Grid>
          </Grid>
        )}

        <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
          <Button disabled={active === 0} onClick={back}>Back</Button>
          {active < steps.length - 1 ? (
            <Button variant="contained" onClick={next}>Next</Button>
          ) : (
            <Button variant="contained" onClick={submit}>Submit</Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default JobCreationWizard;




