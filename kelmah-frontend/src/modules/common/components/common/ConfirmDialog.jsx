import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

/**
 * Reusable confirmation dialog that replaces native window.confirm().
 *
 * @param {boolean}  open            Whether the dialog is visible.
 * @param {string}   title           Dialog title (default: "Confirm").
 * @param {string}   message         Body text shown to the user.
 * @param {string}   confirmLabel    Label for the confirm button (default: "Confirm").
 * @param {string}   cancelLabel     Label for the cancel button (default: "Cancel").
 * @param {string}   confirmColor    MUI color for confirm button (default: "error").
 * @param {Function} onConfirm       Called when user clicks confirm.
 * @param {Function} onCancel        Called when user clicks cancel or closes dialog.
 */
const ConfirmDialog = ({
  open,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'error',
  onConfirm,
  onCancel,
}) => (
  <Dialog
    open={open}
    onClose={onCancel}
    aria-labelledby="confirm-dialog-title"
    aria-describedby="confirm-dialog-description"
    maxWidth="xs"
    fullWidth
  >
    <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
    <DialogContent>
      <DialogContentText id="confirm-dialog-description">
        {message}
      </DialogContentText>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onCancel} color="inherit">
        {cancelLabel}
      </Button>
      <Button
        onClick={onConfirm}
        color={confirmColor}
        variant="contained"
        autoFocus
      >
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDialog;
