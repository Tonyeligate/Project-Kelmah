import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Typography,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Stack,
} from '@mui/material';
import {
  Edit as EditIcon,
  Cancel as CancelIcon,
  Send as SendIcon,
  Print as PrintIcon,
  Create as SignIcon,
  Assignment as MilestoneIcon,
  Done as CompletedIcon,
  Warning as DisputeIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

// Import contract slice actions and selectors
import {
  fetchContractById,
  fetchContractMilestones,
  updateContract,
  cancelContract,
  signContract,
  sendContractForSignature,
  completeMilestone,
  createDispute,
  selectCurrentContract,
  selectContractMilestones,
  selectContractsLoading,
  selectContractsError,
} from '../services/contractSlice';

import Toast from '../../common/components/common/Toast';

// Status colors for contract chips
const statusColors = {
  draft: 'default',
  pending: 'warning',
  active: 'success',
  completed: 'info',
  cancelled: 'error',
  disputed: 'error',
};

const ContractDetailsPage = () => {
  const { contractId, id } = useParams();
  const resolvedContractId = contractId || id;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const contract = useSelector(selectCurrentContract);
  const milestones = useSelector((state) =>
    selectContractMilestones(state, resolvedContractId),
  );
  const loading = useSelector(selectContractsLoading);
  const error = useSelector(selectContractsError);

  // Local state for dialogs
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [disputeData, setDisputeData] = useState({
    reason: '',
    description: '',
  });
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [signature, setSignature] = useState('');

  // Toast state
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  // Load contract and milestones on mount
  useEffect(() => {
    if (!resolvedContractId) return;
    dispatch(fetchContractById(resolvedContractId));
    dispatch(fetchContractMilestones(resolvedContractId));
  }, [dispatch, resolvedContractId]);

  // Show creation success toast if navigated with state
  useEffect(() => {
    if (location.state?.toast) {
      const { message, severity } = location.state.toast;
      setToast({ open: true, message, severity });
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Navigate back to contract list
  const handleBack = () => {
    navigate('/contracts');
  };

  // Navigate to edit contract page
  const handleEditContract = () => {
    navigate(`/contracts/${resolvedContractId}/edit`);
  };

  // Handle contract cancellation
  const handleCancelContract = () => {
    dispatch(cancelContract({ contractId: resolvedContractId, reason: cancelReason }))
      .unwrap()
      .then(() => {
        setCancelDialogOpen(false);
        setCancelReason('');
        setToast({
          open: true,
          message: 'Contract cancelled successfully',
          severity: 'success',
        });
      })
      .catch((err) => {
        setToast({
          open: true,
          message: err || 'Failed to cancel contract',
          severity: 'error',
        });
      });
  };

  // Handle contract signature
  const handleSignContract = () => {
    dispatch(signContract({ contractId: resolvedContractId, signatureData: { signature } }))
      .unwrap()
      .then(() => {
        setSignDialogOpen(false);
        setSignature('');
        setToast({
          open: true,
          message: 'Contract signed successfully',
          severity: 'success',
        });
      })
      .catch((err) => {
        setToast({
          open: true,
          message: err || 'Failed to sign contract',
          severity: 'error',
        });
      });
  };

  // Handle send for signature
  const handleSendForSignature = () => {
    dispatch(sendContractForSignature(resolvedContractId))
      .unwrap()
      .then(() => {
        setToast({
          open: true,
          message: 'Contract sent for signature',
          severity: 'success',
        });
      })
      .catch((err) => {
        setToast({
          open: true,
          message: err || 'Failed to send contract for signature',
          severity: 'error',
        });
      });
  };

  // Handle milestone completion
  const handleCompleteMilestone = (milestoneId) => {
    dispatch(completeMilestone({ contractId: resolvedContractId, milestoneId }))
      .unwrap()
      .then(() => {
        setToast({
          open: true,
          message: 'Milestone marked as completed',
          severity: 'success',
        });
      })
      .catch((err) => {
        setToast({
          open: true,
          message: err || 'Failed to complete milestone',
          severity: 'error',
        });
      });
  };

  // Handle dispute creation
  const handleCreateDispute = () => {
    dispatch(createDispute({ contractId: resolvedContractId, disputeData }))
      .unwrap()
      .then(() => {
        setDisputeDialogOpen(false);
        setDisputeData({ reason: '', description: '' });
        setToast({
          open: true,
          message: 'Dispute submitted successfully',
          severity: 'success',
        });
      })
      .catch((err) => {
        setToast({
          open: true,
          message: err || 'Failed to submit dispute',
          severity: 'error',
        });
      });
  };

  // Handle download contract
  const handleDownloadContract = () => {
    if (!resolvedContractId) return;
    window.open(`/api/jobs/contracts/${resolvedContractId}`, '_blank');
  };

  // Calculate contract progress based on milestones
  const calculateProgress = () => {
    if (!milestones || milestones.length === 0) return 0;

    const completedMilestones = milestones.filter(
      (milestone) => milestone.status === 'completed',
    ).length;

    return Math.round((completedMilestones / milestones.length) * 100);
  };

  // Show a loading state while contract data is being fetched
  if (loading.currentContract || !contract) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Error alert */}
      {error.currentContract && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error loading contract: {error.currentContract}
        </Alert>
      )}

      {/* Back button and header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={handleBack}
          variant="outlined"
          color="secondary"
          sx={{ mr: 2, borderWidth: 2 }}
        >
          Back to Contracts
        </Button>
        <Typography variant="h4" sx={{ color: 'secondary.main' }}>
          Contract Details
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Contract summary */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={(theme) => ({
              p: 3,
              mb: 4,
              backgroundColor: alpha(theme.palette.primary.main, 0.7),
              backdropFilter: 'blur(10px)',
              borderRadius: theme.spacing(2),
              border: `2px solid ${theme.palette.secondary.main}`,
              boxShadow: `inset 0 0 8px rgba(255, 215, 0, 0.5)`,
              transition:
                'box-shadow 0.3s ease-in-out, border-color 0.3s ease-in-out',
              '&:hover': {
                boxShadow: `0 0 12px rgba(255, 215, 0, 0.3), inset 0 0 8px rgba(255, 215, 0, 0.5)`,
                borderColor: theme.palette.secondary.light,
              },
            })}
          >
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}
            >
              <Typography variant="h5">{contract.title}</Typography>
              <Chip
                label={
                  contract.status.charAt(0).toUpperCase() +
                  contract.status.slice(1)
                }
                color={statusColors[contract.status] || 'default'}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Client
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {contract.clientName || 'N/A'}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary">
                  Worker
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {contract.workerName || 'N/A'}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary">
                  Contract Value
                </Typography>
                <Typography variant="body1" gutterBottom>
                  GH₵{contract.value?.toFixed(2) || '0.00'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Start Date
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(contract.startDate)}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary">
                  End Date
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(contract.endDate)}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary">
                  Created On
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(contract.createdAt)}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {contract.status === 'draft' && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={handleEditContract}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<SendIcon />}
                    onClick={handleSendForSignature}
                  >
                    Send for Signature
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    Delete
                  </Button>
                </>
              )}

              {contract.status === 'pending' && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<SignIcon />}
                    onClick={() => setSignDialogOpen(true)}
                  >
                    Sign Contract
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    Decline
                  </Button>
                </>
              )}

              {contract.status === 'active' && (
                <>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DisputeIcon />}
                    onClick={() => setDisputeDialogOpen(true)}
                  >
                    Raise Dispute
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={handleDownloadContract}
                  >
                    Download
                  </Button>
                </>
              )}

              {['completed', 'cancelled', 'disputed'].includes(
                contract.status,
              ) && (
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={handleDownloadContract}
                >
                  Download
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Contract details */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={(theme) => ({
              p: 3,
              mb: 4,
              backgroundColor: alpha(theme.palette.primary.main, 0.7),
              backdropFilter: 'blur(10px)',
              borderRadius: theme.spacing(2),
              border: `2px solid ${theme.palette.secondary.main}`,
              boxShadow: `inset 0 0 8px rgba(255, 215, 0, 0.5)`,
              transition:
                'box-shadow 0.3s ease-in-out, border-color 0.3s ease-in-out',
              '&:hover': {
                boxShadow: `0 0 12px rgba(255, 215, 0, 0.3), inset 0 0 8px rgba(255, 215, 0, 0.5)`,
                borderColor: theme.palette.secondary.light,
              },
            })}
          >
            <Typography variant="h6" gutterBottom>
              Contract Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1">
              {contract.description || 'No detailed description provided.'}
            </Typography>
          </Paper>
        </Grid>

        {/* Milestones */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={(theme) => ({
              p: 3,
              mb: 4,
              backgroundColor: alpha(theme.palette.primary.main, 0.7),
              backdropFilter: 'blur(10px)',
              borderRadius: theme.spacing(2),
              border: `2px solid ${theme.palette.secondary.main}`,
              boxShadow: `inset 0 0 8px rgba(255, 215, 0, 0.5)`,
              transition:
                'box-shadow 0.3s ease-in-out, border-color 0.3s ease-in-out',
              '&:hover': {
                boxShadow: `0 0 12px rgba(255, 215, 0, 0.3), inset 0 0 8px rgba(255, 215, 0, 0.5)`,
                borderColor: theme.palette.secondary.light,
              },
            })}
          >
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}
            >
              <Typography variant="h6">Milestones</Typography>
              <Typography variant="subtitle1">
                Progress: {calculateProgress()}%
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {loading.milestones ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : milestones.length === 0 ? (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 3 }}>
                No milestones defined for this contract.
              </Typography>
            ) : (
              <>
                <Stepper
                  activeStep={
                    milestones.filter((m) => m.status === 'completed').length
                  }
                  alternativeLabel
                >
                  {milestones.map((milestone) => (
                    <Step
                      key={milestone.id}
                      completed={milestone.status === 'completed'}
                    >
                      <StepLabel>{milestone.title}</StepLabel>
                    </Step>
                  ))}
                </Stepper>

                <List sx={{ mt: 3 }}>
                  {milestones.map((milestone) => (
                    <Card key={milestone.id} sx={{ mb: 2 }}>
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            mb: 1,
                          }}
                        >
                          <Typography variant="h6">
                            {milestone.title}
                          </Typography>
                          <Chip
                            label={
                              milestone.status.charAt(0).toUpperCase() +
                              milestone.status.slice(1)
                            }
                            color={statusColors[milestone.status] || 'default'}
                            size="small"
                          />
                        </Box>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          {milestone.description}
                        </Typography>

                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            mt: 2,
                          }}
                        >
                          <Typography variant="body2">
                            <strong>Due Date:</strong>{' '}
                            {formatDate(milestone.dueDate)}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Amount:</strong> GH₵
                            {milestone.amount?.toFixed(2) || '0.00'}
                          </Typography>
                        </Box>

                        {contract.status === 'active' &&
                          milestone.status === 'pending' && (
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                mt: 2,
                              }}
                            >
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<CompletedIcon />}
                                onClick={() =>
                                  handleCompleteMilestone(milestone.id)
                                }
                              >
                                Complete
                              </Button>
                            </Box>
                          )}
                      </CardContent>
                    </Card>
                  ))}
                </List>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Cancel contract dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>
          {contract.status === 'draft' ? 'Delete Contract' : 'Cancel Contract'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {contract.status === 'draft'
              ? 'Are you sure you want to delete this draft contract? This action cannot be undone.'
              : 'Please provide a reason for cancelling this contract. This action cannot be undone.'}
          </DialogContentText>
          {contract.status !== 'draft' && (
            <TextField
              autoFocus
              margin="dense"
              label="Reason for cancellation"
              fullWidth
              multiline
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCancelContract}
            color="error"
            disabled={contract.status !== 'draft' && !cancelReason}
          >
            {contract.status === 'draft' ? 'Delete' : 'Cancel Contract'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sign contract dialog */}
      <Dialog open={signDialogOpen} onClose={() => setSignDialogOpen(false)}>
        <DialogTitle>Sign Contract</DialogTitle>
        <DialogContent>
          <DialogContentText>
            By signing this contract, you agree to all terms and conditions
            outlined in the document.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Your Name (as signature)"
            fullWidth
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSignContract}
            color="primary"
            disabled={!signature}
          >
            Sign Contract
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create dispute dialog */}
      <Dialog
        open={disputeDialogOpen}
        onClose={() => setDisputeDialogOpen(false)}
      >
        <DialogTitle>Raise a Dispute</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please provide details about the issue you're experiencing with this
            contract.
          </DialogContentText>
          <TextField
            margin="dense"
            label="Dispute Reason"
            fullWidth
            value={disputeData.reason}
            onChange={(e) =>
              setDisputeData({ ...disputeData, reason: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            label="Detailed Description"
            fullWidth
            multiline
            rows={4}
            value={disputeData.description}
            onChange={(e) =>
              setDisputeData({ ...disputeData, description: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisputeDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateDispute}
            color="primary"
            disabled={!disputeData.reason || !disputeData.description}
          >
            Submit Dispute
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast notifications */}
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
        fullWidth
      />
    </Container>
  );
};

export default ContractDetailsPage;
