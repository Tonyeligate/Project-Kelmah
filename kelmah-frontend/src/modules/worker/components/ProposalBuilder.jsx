import React, { useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Stack } from '@mui/material';

const ProposalBuilder = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [rate, setRate] = useState('');

  const handleSubmit = () => {
    onSubmit?.({ title, coverLetter, rate: Number(rate) });
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Proposal Builder</Typography>
      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <TextField label="Proposal Title" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextField label="Cover Letter" fullWidth multiline minRows={6} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} />
          <TextField label="Proposed Rate (GHS)" type="number" fullWidth value={rate} onChange={(e) => setRate(e.target.value)} />
          <Button variant="contained" onClick={handleSubmit}>Submit Proposal</Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ProposalBuilder;




