import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Paper, Alert, Button } from '@mui/material';
import { Description as ContractIcon } from '@mui/icons-material';

/**
 * ContractForm — create/edit a contract between hirer and worker.
 * Currently a placeholder while backend contract endpoints are finalized.
 */
const ContractForm = ({ jobId, workerId, onSubmit, onCancel }) => {
  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 4 },
        maxWidth: 600,
        mx: 'auto',
        textAlign: 'center',
      }}
    >
      <ContractIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        Create Contract
      </Typography>
      <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
        Contract creation is coming soon. Once available you will be able to
        define milestones, payment terms, and deliverables for your project.
      </Alert>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {jobId && `Job ID: ${jobId}`}
        {workerId && ` • Worker: ${workerId}`}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        {onCancel && (
          <Button variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button variant="contained" disabled>
          Create Contract
        </Button>
      </Box>
    </Paper>
  );
};

ContractForm.propTypes = {
  jobId: PropTypes.string,
  workerId: PropTypes.string,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
};

export default ContractForm;
