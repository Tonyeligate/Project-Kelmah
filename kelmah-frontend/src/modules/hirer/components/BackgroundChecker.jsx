import React, { useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Alert } from '@mui/material';

const BackgroundChecker = ({ onCheck }) => {
  const [idNumber, setIdNumber] = useState('');
  const [status, setStatus] = useState(null);

  const handleCheck = async () => {
    setStatus('pending');
    try {
      const result = await onCheck?.(idNumber);
      setStatus(result?.ok ? 'clear' : 'flagged');
    } catch {
      setStatus('error');
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Background Verification</Typography>
      <Paper sx={{ p: 2 }}>
        <TextField fullWidth label="National ID / Passport" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} sx={{ mb: 2 }} />
        <Button variant="contained" onClick={handleCheck} disabled={!idNumber}>Check</Button>
        {status === 'pending' && <Alert sx={{ mt: 2 }} severity="info">Checking...</Alert>}
        {status === 'clear' && <Alert sx={{ mt: 2 }} severity="success">No issues found.</Alert>}
        {status === 'flagged' && <Alert sx={{ mt: 2 }} severity="warning">Potential issues detected. Review required.</Alert>}
        {status === 'error' && <Alert sx={{ mt: 2 }} severity="error">Verification failed.</Alert>}
      </Paper>
    </Box>
  );
};

export default BackgroundChecker;




