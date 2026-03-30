import React, { useEffect, useRef, useState } from 'react';
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
  Skeleton,
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
import { alpha, useTheme } from '@mui/material/styles';
import { Helmet } from 'react-helmet-async';
import PageCanvas from '@/modules/common/components/PageCanvas';

// Import contract slice actions and selectors
import {
  fetchContractById,
  fetchContractMilestones,
  updateContract,
  cancelContract,
  signContract,
  sendContractForSignature,
  completeMilestone,
  completeContract,
  createDispute,
  selectCurrentContract,
  selectContractMilestones,
  selectContractsLoading,
  selectContractsError,
} from '../services/contractSlice';

import Toast from '../../common/components/common/Toast';
import { useBreakpointDown } from '@/hooks/useResponsive';

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
  const { id } = useParams();
  const resolvedContractId = id;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useBreakpointDown('md');

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
  const [completeContractDialogOpen, setCompleteContractDialogOpen] =
    useState(false);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [signature, setSignature] = useState('');
  const [slowLoadingHint, setSlowLoadingHint] = useState(false);
  const slowLoadingTimerRef = useRef(null);

  // Toast state
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  // Action-level loading to prevent double-clicks on async buttons
  const [actionLoading, setActionLoading] = useState(false);

  const getErrorText = (err, fallback) => {
    if (!err) return fallback;
    if (typeof err === 'string') return err;
    return err.message || err.technicalMessage || fallback;
  };

  const retryContractLoad = () => {
    if (!resolvedContractId) return;
    dispatch(fetchContractById(resolvedContractId));
    dispatch(fetchContractMilestones(resolvedContractId));
  };

  // Load contract and milestones on mount
  useEffect(() => {
    if (!resolvedContractId) return;
    dispatch(fetchContractById(resolvedContractId));
    dispatch(fetchContractMilestones(resolvedContractId));
  }, [dispatch, resolvedContractId]);

  useEffect(() => {
    if (!loading.currentContract) {
      setSlowLoadingHint(false);
      if (slowLoadingTimerRef.current) {
        clearTimeout(slowLoadingTimerRef.current);
        slowLoadingTimerRef.current = null;
      }
      return;
    }

    slowLoadingTimerRef.current = setTimeout(() => {
      setSlowLoadingHint(true);
    }, 8000);

    return () => {
      if (slowLoadingTimerRef.current) {
        clearTimeout(slowLoadingTimerRef.current);
        slowLoadingTimerRef.current = null;
      }
    };
  }, [loading.currentContract]);

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
    setActionLoading(true);
    dispatch(
      cancelContract({ contractId: resolvedContractId, reason: cancelReason }),
    )
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
          message: getErrorText(err, 'Failed to cancel contract'),
          severity: 'error',
        });
      })
      .finally(() => setActionLoading(false));
  };

  // Handle contract signature
  const handleSignContract = () => {
    setActionLoading(true);
    dispatch(
      signContract({
        contractId: resolvedContractId,
        signatureData: { signature },
      }),
    )
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
          message: getErrorText(err, 'Failed to sign contract'),
          severity: 'error',
        });
      })
      .finally(() => setActionLoading(false));
  };

  // Handle send for signature
  const handleSendForSignature = () => {
    setActionLoading(true);
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
          message: getErrorText(err, 'Failed to send contract for signature'),
          severity: 'error',
        });
      })
      .finally(() => setActionLoading(false));
  };

  // Handle milestone completion
  const handleCompleteMilestone = (milestoneId) => {
    setActionLoading(true);
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
          message: getErrorText(err, 'Failed to complete milestone'),
          severity: 'error',
        });
      })
      .finally(() => setActionLoading(false));
  };

  // Handle dispute creation
  const handleCreateDispute = () => {
    setActionLoading(true);
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
          message: getErrorText(err, 'Failed to submit dispute'),
          severity: 'error',
        });
      })
      .finally(() => setActionLoading(false));
  };

  // Handle contract completion
  const handleCompleteContract = () => {
    setActionLoading(true);
    dispatch(completeContract(resolvedContractId))
      .unwrap()
      .then(() => {
        setCompleteContractDialogOpen(false);
        setToast({
          open: true,
          message: 'Contract marked as completed! Well done.',
          severity: 'success',
        });
      })
      .catch((err) => {
        setToast({
          open: true,
          message: getErrorText(err, 'Failed to complete contract'),
          severity: 'error',
        });
      })
      .finally(() => setActionLoading(false));
  };

  // Handle download contract via browser print until dedicated PDF export API ships
  const handleDownloadContract = () => {
    if (!resolvedContractId) return;
    try {
      window.print();
      setToast({
        open: true,
        message:
          'Print dialog opened. Choose "Save as PDF" in your browser to download the contract.',
        severity: 'success',
      });
    } catch (printError) {
      setToast({
        open: true,
        message:
          'Unable to open the print dialog on this device. Please try again from a desktop browser.',
        severity: 'error',
      });
    }
  };

  // Calculate contract progress based on milestones
  const calculateProgress = () => {
    if (!milestones || milestones.length === 0) return 0;

    const completedMilestones = milestones.filter(
      (milestone) => milestone.status === 'completed',
    ).length;

    return Math.round((completedMilestones / milestones.length) * 100);
  };

  const milestoneSummary = {
    total: milestones?.length || 0,
    completed:
      milestones?.filter((milestone) => milestone.status === 'completed')
        .length || 0,
    pending:
      milestones?.filter((milestone) => milestone.status === 'pending')
        .length || 0,
  };

  const contractActionGuidance = {
    draft: {
      severity: 'info',
      text: 'Review details before requesting signatures. Deleting a draft is irreversible.',
    },
    pending: {
      severity: 'warning',
      text: 'Sign only after confirming dates, value, and scope. Declining stops this contract flow.',
    },
    active: {
      severity: 'info',
      text: 'Complete milestones before marking job complete. Report issues early if scope or payment is disputed.',
    },
    completed: {
      severity: 'success',
      text: 'Contract is closed. You can still print records for reference.',
    },
    cancelled: {
      severity: 'warning',
      text: 'Contract was cancelled. Keep records and reasons for accountability.',
    },
    disputed: {
      severity: 'warning',
      text: 'Dispute is open. Keep communication and milestone evidence available for resolution.',
    },
  };

  // Show a loading state while contract data is being fetched
  if (loading.currentContract) {
    return (
      <PageCanvas
        disableContainer
        sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}
      >
        <Container maxWidth="md" sx={{ py: 3 }}>
          {slowLoadingHint && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Contract details are taking longer than usual to load. The backend
              may still be waking up.
            </Alert>
          )}
          <Skeleton variant="text" width={200} height={36} sx={{ mb: 2 }} />
          <Skeleton
            variant="rounded"
            height={400}
            sx={{ borderRadius: 2, mb: 2 }}
          />
          <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2 }} />
        </Container>
      </PageCanvas>
    );
  }

  if (!contract && error.currentContract) {
    return (
      <PageCanvas
        disableContainer
        sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}
      >
        <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={retryContractLoad}>
                Retry
              </Button>
            }
          >
            Error loading contract:{' '}
            {getErrorText(
              error.currentContract,
              'Unable to load contract details.',
            )}
          </Alert>
          <Button onClick={handleBack} variant="outlined">
            Back to Contracts
          </Button>
        </Container>
      </PageCanvas>
    );
  }

  if (!contract) {
    return (
      <PageCanvas
        disableContainer
        sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}
      >
        <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
          <Alert
            severity="warning"
            action={
              <Button color="inherit" size="small" onClick={retryContractLoad}>
                Retry
              </Button>
            }
          >
            Contract not found.
          </Alert>
          <Button onClick={handleBack} variant="outlined" sx={{ mt: 2 }}>
            Back to Contracts
          </Button>
        </Container>
      </PageCanvas>
    );
  }

  return (
    <PageCanvas
      disableContainer
      sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}
    >
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Helmet>
          <title>Contract Details | Kelmah</title>
        </Helmet>
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
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Review this contract, complete milestones on time, and use actions
          below to sign, finish, or report issues.
        </Typography>

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
                    (contract.status || 'draft').charAt(0).toUpperCase() +
                    (contract.status || 'draft').slice(1)
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
                    GH₵{Number(contract.value || 0).toFixed(2)}
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

              <Alert
                severity={
                  contractActionGuidance[contract.status]?.severity || 'info'
                }
                sx={{ mb: 2 }}
              >
                {contractActionGuidance[contract.status]?.text ||
                  'Review your next contract action carefully before continuing.'}
              </Alert>

              <Stack
                direction="row"
                spacing={1}
                sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}
              >
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${milestoneSummary.completed}/${milestoneSummary.total} milestones done`}
                />
                <Chip
                  size="small"
                  color="warning"
                  variant="outlined"
                  label={`${milestoneSummary.pending} pending`}
                />
                <Chip
                  size="small"
                  color="info"
                  variant="outlined"
                  label={`Progress ${calculateProgress()}%`}
                />
              </Stack>

              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  flexWrap: 'wrap',
                  '& .MuiButton-root': { minHeight: 44 },
                }}
              >
                {contract.status === 'draft' && (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={handleEditContract}
                      disabled={actionLoading}
                    >
                      Edit Draft
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<SendIcon />}
                      onClick={handleSendForSignature}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <CircularProgress size={18} sx={{ mr: 1 }} />
                      ) : null}
                      Request Signatures
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => setCancelDialogOpen(true)}
                      disabled={actionLoading}
                    >
                      Delete Draft
                    </Button>
                  </>
                )}

                {contract.status === 'pending' && (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<SignIcon />}
                      onClick={() => setSignDialogOpen(true)}
                      disabled={actionLoading}
                    >
                      Sign Contract
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => setCancelDialogOpen(true)}
                      disabled={actionLoading}
                    >
                      Decline Contract
                    </Button>
                  </>
                )}

                {contract.status === 'active' && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CompletedIcon />}
                      onClick={() => setCompleteContractDialogOpen(true)}
                      disabled={actionLoading}
                    >
                      Mark Job Complete
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DisputeIcon />}
                      onClick={() => setDisputeDialogOpen(true)}
                      disabled={actionLoading}
                    >
                      Report Issue
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<PrintIcon />}
                      onClick={handleDownloadContract}
                    >
                      Print or Save PDF
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
                    Print or Save PDF
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

              <Stack
                direction="row"
                spacing={1}
                sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}
              >
                <Chip size="small" variant="outlined" label="Status legend" />
                <Chip size="small" color="success" label="Completed" />
                <Chip size="small" color="warning" label="Pending" />
                <Chip size="small" color="error" label="Needs attention" />
              </Stack>

              {loading.milestones ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : !milestones || milestones.length === 0 ? (
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
                        key={milestone.id || milestone._id}
                        completed={milestone.status === 'completed'}
                      >
                        <StepLabel>{milestone.title}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>

                  <List sx={{ mt: 3 }}>
                    {milestones.map((milestone) => (
                      <Card key={milestone.id || milestone._id} sx={{ mb: 2 }}>
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
                                milestone.status
                                  ? milestone.status.charAt(0).toUpperCase() +
                                    milestone.status.slice(1)
                                  : 'Unknown'
                              }
                              color={
                                statusColors[milestone.status] || 'default'
                              }
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
                              {Number(milestone.amount || 0).toFixed(2)}
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
                                  disabled={actionLoading}
                                  aria-label={`Mark ${milestone.title || 'this milestone'} as complete`}
                                  onClick={() =>
                                    handleCompleteMilestone(
                                      milestone.id || milestone._id,
                                    )
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

        {/* Complete contract dialog */}
        <Dialog
          open={completeContractDialogOpen}
          onClose={() => setCompleteContractDialogOpen(false)}
          fullScreen={isMobile}
          aria-labelledby="complete-contract-dialog-title"
        >
          <DialogTitle id="complete-contract-dialog-title">
            Mark Job as Complete
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Confirm that the work has been completed to your satisfaction.
              This will mark the contract as completed and release any held
              payment to the worker.
            </DialogContentText>
            <Alert severity="warning" sx={{ mt: 2 }}>
              This final step is hard to reverse. Confirm all milestones and
              deliverables first.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setCompleteContractDialogOpen(false)}
              disabled={actionLoading}
            >
              Not Yet
            </Button>
            <Button
              onClick={handleCompleteContract}
              color="success"
              variant="contained"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <CircularProgress size={18} sx={{ mr: 1 }} />
              ) : null}
              Yes, Complete Job
            </Button>
          </DialogActions>
        </Dialog>

        {/* Cancel contract dialog */}
        <Dialog
          open={cancelDialogOpen}
          onClose={() => setCancelDialogOpen(false)}
          fullScreen={isMobile}
          aria-labelledby="cancel-contract-dialog-title"
        >
          <DialogTitle id="cancel-contract-dialog-title">
            {contract.status === 'draft'
              ? 'Delete Contract'
              : 'Cancel Contract'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {contract.status === 'draft'
                ? 'Are you sure you want to delete this draft contract? This action cannot be undone.'
                : 'Please provide a reason for cancelling this contract. This action cannot be undone.'}
            </DialogContentText>
            <Alert severity="warning" sx={{ mt: 2, mb: 1 }}>
              Cancellation stops this contract workflow immediately. Keep your
              reason clear for dispute prevention.
            </Alert>
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
              disabled={
                actionLoading || (contract.status !== 'draft' && !cancelReason)
              }
            >
              {actionLoading ? (
                <CircularProgress size={18} sx={{ mr: 1 }} />
              ) : null}
              {contract.status === 'draft' ? 'Delete' : 'Cancel Contract'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Sign contract dialog */}
        <Dialog
          open={signDialogOpen}
          onClose={() => setSignDialogOpen(false)}
          fullScreen={isMobile}
          aria-labelledby="sign-contract-dialog-title"
        >
          <DialogTitle id="sign-contract-dialog-title">
            Sign Contract
          </DialogTitle>
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
              disabled={actionLoading || !signature}
            >
              {actionLoading ? (
                <CircularProgress size={18} sx={{ mr: 1 }} />
              ) : null}
              Sign Contract
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create dispute dialog */}
        <Dialog
          open={disputeDialogOpen}
          onClose={() => setDisputeDialogOpen(false)}
          fullScreen={isMobile}
          aria-labelledby="raise-dispute-dialog-title"
        >
          <DialogTitle id="raise-dispute-dialog-title">
            Raise a Dispute
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Please provide details about the issue you're experiencing with
              this contract.
            </DialogContentText>
            <Alert severity="info" sx={{ mt: 2, mb: 1 }}>
              Include milestone name, date, and payment context so support can
              resolve this faster.
            </Alert>
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
              disabled={
                actionLoading || !disputeData.reason || !disputeData.description
              }
            >
              {actionLoading ? (
                <CircularProgress size={18} sx={{ mr: 1 }} />
              ) : null}
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
    </PageCanvas>
  );
};

export default ContractDetailsPage;
