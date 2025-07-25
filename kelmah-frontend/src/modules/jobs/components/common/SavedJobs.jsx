import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

function SavedJobs() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Saved Jobs
        </Typography>
        <Typography>Saved jobs feature coming soon...</Typography>
      </Paper>
    </Container>
  );
}

export default SavedJobs;
