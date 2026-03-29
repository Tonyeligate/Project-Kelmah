import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';

function ApplicationDecisionDialog({
  open,
  onClose,
  actionType,
  workerName,
  feedback,
  onFeedbackChange,
  onConfirm,
  updating,
  fullScreen = false,
}) {
  const isAccepted = actionType === 'accepted';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
      aria-labelledby="confirm-action-dialog-title"
    >
      <DialogTitle id="confirm-action-dialog-title">
        {isAccepted ? 'Accept This Worker?' : 'Reject This Application?'}
      </DialogTitle>
      <DialogContent dividers>
        <Typography sx={{ mb: isAccepted ? 0 : 1.5 }}>
          You are about to <strong>{isAccepted ? 'accept' : 'reject'}</strong>{' '}
          <strong>{workerName}</strong> for this job.
        </Typography>
        {!isAccepted && (
          <TextField
            label="Reason (optional)"
            multiline
            rows={4}
            fullWidth
            value={feedback}
            onChange={(e) => onFeedbackChange(e.target.value)}
            helperText="Short feedback helps the worker improve future applications."
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ minHeight: 44 }}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color={isAccepted ? 'success' : 'error'}
          variant="contained"
          disabled={updating}
          sx={{ minHeight: 44 }}
        >
          {updating ? (
            <CircularProgress size={24} />
          ) : (
            isAccepted ? 'Accept Worker' : 'Reject Application'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ApplicationDecisionDialog;
