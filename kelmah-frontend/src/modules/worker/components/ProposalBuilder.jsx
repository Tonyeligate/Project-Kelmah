import React, { useState } from 'react';
import {
  Alert,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
} from '@mui/material';

const ProposalBuilder = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [rate, setRate] = useState('');

  const handleSubmit = () => {
    onSubmit?.({ title, coverLetter, rate: Number(rate) });
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Proposal Builder
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Alert severity="info">
            Keep your proposal short and practical: what you will do, timeline, and total cost.
          </Alert>
          <TextField
            label="Proposal Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            inputProps={{ 'aria-label': 'Proposal title' }}
            placeholder="Example: Bathroom leak repair with same-day inspection"
            helperText="Use a clear title that explains the exact job outcome."
          />
          <TextField
            label="Cover Letter"
            fullWidth
            multiline
            minRows={6}
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            inputProps={{ 'aria-label': 'Proposal details' }}
            placeholder="Explain your plan, tools, and how long the job will take."
            helperText="Mention steps, materials, and when you can start."
          />
          <TextField
            label="Proposed Rate (GH₵)"
            type="number"
            fullWidth
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            inputProps={{ 'aria-label': 'Proposed rate in Ghana cedis' }}
            helperText="Enter your full quote so hirers can compare fairly."
          />
          <Button variant="contained" onClick={handleSubmit} sx={{ minHeight: 44, width: { xs: '100%', sm: 'auto' } }}>
            Submit Proposal
          </Button>
          <Typography variant="body2" color="text.secondary">
            Tip: include transport, tools, and team size if they affect price.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ProposalBuilder;
