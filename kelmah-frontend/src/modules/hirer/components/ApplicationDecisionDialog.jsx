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
        Confirm {isAccepted ? 'Accept' : 'Reject'}
      </DialogTitle>
      <DialogContent>
        <Typography>
          You are about to <strong>{isAccepted ? 'accept' : 'reject'}</strong>{' '}
          the application from <strong>{workerName}</strong>.
        </Typography>
        {!isAccepted && (
          <TextField
            label="Feedback (Optional)"
            multiline
            rows={4}
            fullWidth
            value={feedback}
            onChange={(e) => onFeedbackChange(e.target.value)}
            sx={{ mt: 2 }}
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
            `Confirm ${isAccepted ? 'Accept' : 'Reject'}`
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ApplicationDecisionDialog;
