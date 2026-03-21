import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Button, Container, Grid, Paper, Typography, TextField, FormControl, InputLabel, Select, MenuItem, FormHelperText, Divider, CircularProgress, Alert, Stepper, Step, StepLabel, IconButton, InputAdornment, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { Helmet } from 'react-helmet-async';
import { Z_INDEX, STICKY_CTA_HEIGHT, BOTTOM_NAV_HEIGHT } from '../../../constants/layout';
import Toast from '../../common/components/common/Toast';
import workerService from '../../worker/services/workerService';

// Import contract slice actions and selectors
import {
  createContract,
  fetchContractTemplates,
  selectContractTemplates,
  selectContractsLoading,
  selectContractsError,
} from '../services/contractSlice';
import { useBreakpointDown } from '@/hooks/useResponsive';

const initialContractState = {
  title: '',
  description: '',
  clientName: '',
  workerName: '',
  workerId: '',
  startDate: null,
  endDate: null,
  value: '',
  milestones: [
    {
      title: '',
      description: '',
      dueDate: null,
      amount: '',
    },
  ],
  templateId: '',
};

const CreateContractPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templates = useSelector(selectContractTemplates);
  const loading = useSelector(selectContractsLoading);
  const error = useSelector(selectContractsError);
  const { user } = useSelector((state) => state.auth);

  const [contract, setContract] = useState(initialContractState);
  const [activeStep, setActiveStep] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'info',
  });
  const [isDirty, setIsDirty] = useState(false);
  const [workerLoading, setWorkerLoading] = useState(false);
  const isMobile = useBreakpointDown('sm');

  // Load contract templates on mount
  useEffect(() => {
    dispatch(fetchContractTemplates());
  }, [dispatch]);

  // Auto-populate worker and client info from URL params and auth state
  useEffect(() => {
    let cancelled = false;
    const workerId = searchParams.get('workerId');

    // Auto-populate client name from authenticated user
    if (user && !contract.clientName) {
      const clientName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || '';
      if (clientName) {
        setContract((prev) => ({ ...prev, clientName }));
      }
    }

    // Auto-populate worker info from URL param
    if (workerId && !contract.workerName) {
      setWorkerLoading(true);
      workerService.getWorkerById(workerId)
        .then((response) => {
          if (cancelled) return;
          const data = response?.data?.data || response?.data || response;
          const workerUser = data?.user || data;
          const workerName = [workerUser?.firstName, workerUser?.lastName].filter(Boolean).join(' ')
            || workerUser?.name || data?.name || '';
          if (workerName) {
            setContract((prev) => ({
              ...prev,
              workerName,
              workerId,
            }));
          }
        })
        .catch((err) => {
          if (cancelled) return;
          if (import.meta.env.DEV) console.error('Failed to fetch worker details:', err);
        })
        .finally(() => { if (!cancelled) setWorkerLoading(false); });
    }
    return () => { cancelled = true; };
  }, [searchParams, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Warn if the user tries to close/reload with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Steps for contract creation process
  const steps = [
    'Job Info',
    'Names',
    'Pay & Dates',
    'Payment Steps',
    'Check & Send',
  ];

  // Handle form field changes
  const handleChange = (e) => {
    setIsDirty(true);
    const { name, value } = e.target;
    setContract((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle date changes
  const handleDateChange = (name, value) => {
    setIsDirty(true);
    setContract((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle milestone changes
  const handleMilestoneChange = (index, field, value) => {
    setIsDirty(true);
    const updatedMilestones = [...contract.milestones];
    updatedMilestones[index] = {
      ...updatedMilestones[index],
      [field]: value,
    };
    setContract((prev) => ({
      ...prev,
      milestones: updatedMilestones,
    }));
  };

  // Add a new milestone
  const handleAddMilestone = () => {
    setIsDirty(true);
    setContract((prev) => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        {
          title: '',
          description: '',
          dueDate: null,
          amount: '',
        },
      ],
    }));
  };

  // Remove a milestone
  const handleRemoveMilestone = (index) => {
    setIsDirty(true);
    const updatedMilestones = [...contract.milestones];
    updatedMilestones.splice(index, 1);
    setContract((prev) => ({
      ...prev,
      milestones: updatedMilestones,
    }));
  };

  // Handle template selection
  const handleTemplateChange = (e) => {
    setIsDirty(true);
    const { value } = e.target;
    setContract((prev) => ({
      ...prev,
      templateId: value,
    }));

    if (value) {
      const selectedTemplate = templates.find(
        (template) => (template.id || template._id) === value,
      );
      if (selectedTemplate) {
        // Prefill form based on template
        setContract((prev) => ({
          ...prev,
          title: selectedTemplate.title || prev.title,
          description: selectedTemplate.description || prev.description,
        }));
      }
    }
  };

  // Validate current step
  const validateStep = () => {
    const errors = {};

    switch (activeStep) {
      case 0: // Basic Details
        if (!contract.title.trim()) errors.title = 'Title is required';
        if (!contract.description.trim())
          errors.description = 'Description is required';
        break;
      case 1: // Parties
        if (!contract.clientName.trim())
          errors.clientName = 'Client name is required';
        if (!contract.workerName.trim())
          errors.workerName = 'Worker name is required';
        break;
      case 2: // Contract Terms
        if (!contract.startDate) errors.startDate = 'Start date is required';
        if (!contract.endDate) errors.endDate = 'End date is required';
        if (
          contract.endDate &&
          contract.startDate &&
          contract.endDate < contract.startDate
        ) {
          errors.endDate = 'End date must be after start date';
        }
        if (!contract.value) {
          errors.value = 'Contract value is required';
        } else if (isNaN(contract.value) || parseFloat(contract.value) <= 0) {
          errors.value = 'Enter how much you will pay (must be more than 0)';
        }
        break;
      case 3: { // Milestones
        const milestoneErrors = {};
        let totalAmount = 0;

        contract.milestones.forEach((milestone, index) => {
          const milestoneError = {};
          if (!milestone.title.trim()) {
            milestoneError.title = 'Title is required';
          }
          if (!milestone.dueDate) {
            milestoneError.dueDate = 'Due date is required';
          }
          if (!milestone.amount) {
            milestoneError.amount = 'Amount is required';
          } else if (
            isNaN(milestone.amount) ||
            parseFloat(milestone.amount) <= 0
          ) {
            milestoneError.amount = 'Enter a pay amount greater than 0';
          } else {
            totalAmount += parseFloat(milestone.amount);
          }

          if (Object.keys(milestoneError).length > 0) {
            milestoneErrors[index] = milestoneError;
          }
        });

        if (Object.keys(milestoneErrors).length > 0) {
          errors.milestones = milestoneErrors;
        }

        // Check if milestone amounts add up to contract value
        if (Math.abs(totalAmount - parseFloat(contract.value)) > 0.01) {
          errors.totalAmount = 'The step payments must add up to the total pay';
        }
        break;
      }
      default:
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Handle contract creation
  const handleCreateContract = () => {
    if (validateStep()) {
      dispatch(createContract(contract))
        .unwrap()
        .then((response) => {
          const newContractId = response?.id || response?._id;
          navigate(newContractId ? `/contracts/${newContractId}` : '/contracts', {
            state: {
              toast: {
                open: true,
                message: 'Contract created successfully',
                severity: 'success',
              },
            },
          });
        })
        .catch((err) => {
          setToast({
            open: true,
            message: err?.message || (typeof err === 'string' ? err : 'Failed to create contract'),
            severity: 'error',
          });
        });
    }
  };

  // Handle top-level back/navigation
  const handleBackToList = () => {
    if (isDirty) {
      setDiscardDialogOpen(true);
    } else {
      navigate('/contracts');
    }
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  // Render step content
  const getStepContent = (step) => {
    switch (step) {
      case 0: // Basic Details
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel id="template-label">
                  Contract Template (Optional)
                </InputLabel>
                <Select
                  labelId="template-label"
                  id="templateId"
                  name="templateId"
                  value={contract.templateId}
                  onChange={handleTemplateChange}
                  label="Contract Template (Optional)"
                >
                  <MenuItem value="">
                    <em>No template</em>
                  </MenuItem>
                  {templates.map((template) => {
                    const tId = template.id || template._id;
                    return (
                      <MenuItem key={tId} value={tId}>
                        {template.title}
                      </MenuItem>
                    );
                  })}
                </Select>
                <FormHelperText>
                  Select a template to pre-fill contract details
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="title"
                name="title"
                label="Job Name"
                value={contract.title}
                onChange={handleChange}
                error={!!validationErrors.title}
                helperText={
                  validationErrors.title ||
                  'Enter a short name for this job'
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="description"
                name="description"
                label="What is the job?"
                value={contract.description}
                onChange={handleChange}
                multiline
                rows={4}
                error={!!validationErrors.description}
                helperText={
                  validationErrors.description ||
                  'Tell the worker what the job is about'
                }
              />
            </Grid>
          </Grid>
        );
      case 1: // Parties
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                id="clientName"
                name="clientName"
                label="Your Name"
                value={contract.clientName}
                onChange={handleChange}
                error={!!validationErrors.clientName}
                helperText={
                  validationErrors.clientName ||
                  'Your name (auto-filled from your account)'
                }
                InputProps={{
                  readOnly: !!user,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                id="workerName"
                name="workerName"
                label="Worker Name"
                value={contract.workerName}
                onChange={handleChange}
                error={!!validationErrors.workerName}
                helperText={
                  validationErrors.workerName ||
                  (workerLoading ? 'Loading worker details...' : (contract.workerId ? 'Auto-filled from selected worker' : 'Enter the worker name'))
                }
                InputProps={{
                  readOnly: !!contract.workerId,
                  endAdornment: workerLoading ? (
                    <InputAdornment position="end">
                      <CircularProgress size={20} />
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Grid>
          </Grid>
        );
      case 2: // Contract Terms
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Start Date *"
                  value={contract.startDate}
                  onChange={(value) => handleDateChange('startDate', value)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!validationErrors.startDate,
                      helperText: validationErrors.startDate || 'Select contract start date',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="End Date *"
                  value={contract.endDate}
                  onChange={(value) => handleDateChange('endDate', value)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!validationErrors.endDate,
                      helperText: validationErrors.endDate || 'Select contract end date',
                    },
                  }}
                  minDate={contract.startDate}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="value"
                  name="value"
                  label="Total Pay"
                  value={contract.value}
                  onChange={handleChange}
                  type="number"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">GH₵</InputAdornment>
                    ),
                  }}
                  error={!!validationErrors.value}
                  helperText={
                    validationErrors.value || 'How much will you pay in total?'
                  }
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        );
      case 3: // Milestones
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}
              >
                <Typography variant="h6">Define Milestones</Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddMilestone}
                >
                  Add Milestone
                </Button>
              </Box>
              {validationErrors.totalAmount && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {validationErrors.totalAmount}
                </Alert>
              )}
              {contract.milestones.map((milestone, index) => (
                <Paper key={milestone.id || milestone._id || `${milestone.title || 'milestone'}-${milestone.dueDate || 'due'}-${index}`} sx={{ p: 2, mb: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle1">
                      Step {index + 1}
                    </Typography>
                    {contract.milestones.length > 1 && (
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveMilestone(index)}
                        size="medium"
                        aria-label={`Remove step ${index + 1}`}
                        sx={{ minWidth: 44, minHeight: 44 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        required
                        fullWidth
                        label="Step Name"
                        value={milestone.title}
                        onChange={(e) =>
                          handleMilestoneChange(index, 'title', e.target.value)
                        }
                        error={validationErrors.milestones?.[index]?.title}
                        helperText={
                          validationErrors.milestones?.[index]?.title ||
                          'Name this payment step'
                        }
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Description"
                        value={milestone.description}
                        onChange={(e) =>
                          handleMilestoneChange(
                            index,
                            'description',
                            e.target.value,
                          )
                        }
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Due Date *"
                          value={milestone.dueDate}
                          onChange={(value) =>
                            handleMilestoneChange(index, 'dueDate', value)
                          }
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: !!validationErrors.milestones?.[index]?.dueDate,
                              helperText:
                                validationErrors.milestones?.[index]?.dueDate ||
                                'Select milestone due date',
                            },
                          }}
                          minDate={contract.startDate}
                          maxDate={contract.endDate}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        required
                        fullWidth
                        label="Amount"
                        value={milestone.amount}
                        onChange={(e) =>
                          handleMilestoneChange(index, 'amount', e.target.value)
                        }
                        type="number"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">GH₵</InputAdornment>
                          ),
                        }}
                        error={validationErrors.milestones?.[index]?.amount}
                        helperText={
                          validationErrors.milestones?.[index]?.amount ||
                          'Enter the milestone payment amount'
                        }
                      />
                    </Grid>
                  </Grid>
                </Paper>
              ))}
              {contract.milestones.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No milestones defined. Click "Add Milestone" to create one.
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        );
      case 4: // Review
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Contract Summary
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Title
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {contract.title}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Value
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      GH₵{parseFloat(contract.value).toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Client
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {contract.clientName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Worker
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {contract.workerName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Start Date
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {formatDate(contract.startDate)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      End Date
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {formatDate(contract.endDate)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {contract.description}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Milestones
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {contract.milestones.map((milestone, index) => (
                  <Box
                    key={milestone.id || milestone._id || `${milestone.title || 'milestone'}-${milestone.dueDate || 'due'}-${index}`}
                    sx={{
                      mb: 2,
                      pb: 2,
                      borderBottom:
                        index < contract.milestones.length - 1
                          ? '1px dashed #ddd'
                          : 'none',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle1">
                        {milestone.title}
                      </Typography>
                      <Typography variant="subtitle1">
                        GH₵{isNaN(parseFloat(milestone.amount)) ? '—' : parseFloat(milestone.amount).toFixed(2)}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      {milestone.description}
                    </Typography>
                    <Typography variant="body2">
                      Due: {formatDate(milestone.dueDate)}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 4, sm: 8 }, px: { xs: 0.5, sm: 2 }, pb: isMobile ? `${STICKY_CTA_HEIGHT + 16}px` : undefined }}>
      <Helmet><title>Create Contract | Kelmah</title></Helmet>
      {/* Error alert */}
      {error.createContract && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error creating contract: {error.createContract}
        </Alert>
      )}

      {/* Back button and header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={handleBackToList}
          variant="outlined"
          color="secondary"
          sx={{ mr: 2, borderWidth: 2 }}
        >
          Back to Contracts
        </Button>
        <Typography variant="h4" sx={{ color: 'secondary.main' }}>
          Create New Contract
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Fill each step with clear job details so both sides agree before work starts.
      </Typography>

      {/* Stepper */}
      <Paper
        elevation={0}
        sx={(theme) => ({
          p: { xs: 1.5, sm: 3 },
          mb: { xs: 2, sm: 4 },
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
          overflowX: 'auto',
        })}
      >
        <Stepper activeStep={activeStep} orientation={isMobile ? 'vertical' : 'horizontal'} {...(!isMobile && { alternativeLabel: true })} sx={{ minWidth: { xs: 'max-content', sm: 'auto' }, '& .MuiStepLabel-label': { fontSize: { xs: '0.7rem', sm: '0.875rem' } } }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step content */}
      <Paper
        elevation={0}
        sx={(theme) => ({
          p: { xs: 1.5, sm: 3 },
          mb: { xs: 2, sm: 4 },
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
        {loading.createContract ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>{getStepContent(activeStep)}</>
        )}
      </Paper>

      {/* Navigation buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<BackIcon />}
          onClick={handleBack}
          disabled={activeStep === 0}
          sx={{ minHeight: 44 }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          color="secondary"
          endIcon={activeStep === steps.length - 1 ? <CheckCircleIcon /> : <ForwardIcon />}
          sx={{ minHeight: 44 }}
          aria-label={activeStep === steps.length - 1 ? 'Create contract now' : 'Go to next contract step'}
          onClick={() => {
            if (activeStep === steps.length - 1) {
              if (validateStep()) setConfirmDialogOpen(true);
            } else {
              handleNext();
            }
          }}
        >
          {activeStep === steps.length - 1 ? 'Create Contract' : 'Next'}
        </Button>
      </Box>

      {/* Discard changes confirmation dialog */}
      <Dialog
        open={discardDialogOpen}
        onClose={() => setDiscardDialogOpen(false)}
        aria-labelledby="discard-changes-dialog-title"
      >
        <DialogTitle id="discard-changes-dialog-title">Discard changes?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved changes. Are you sure you want to leave and discard
            them?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscardDialogOpen(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              setDiscardDialogOpen(false);
              navigate('/contracts');
            }}
          >
            Discard and Leave
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm create contract dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        aria-labelledby="confirm-contract-dialog-title"
      >
        <DialogTitle id="confirm-contract-dialog-title">Confirm Contract Creation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to create this contract? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            color="primary"
            onClick={() => {
              setConfirmDialogOpen(false);
              handleCreateContract();
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sticky bottom action bar for mobile */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: { xs: `${BOTTOM_NAV_HEIGHT}px`, md: 0 },
            left: 0,
            right: 0,
            zIndex: Z_INDEX.stickyCta,
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
            px: 2,
            py: 1.5,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 1,
            boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleBack}
            disabled={activeStep === 0}
            sx={{ minHeight: 44, flex: 1 }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => {
              if (activeStep === steps.length - 1) {
                if (validateStep()) setConfirmDialogOpen(true);
              } else {
                handleNext();
              }
            }}
            disabled={loading || workerLoading}
            aria-label={activeStep === steps.length - 1 ? 'Create contract now' : 'Go to next contract step'}
            sx={{ minHeight: 44, flex: 1 }}
          >
            {loading ? <CircularProgress size={18} color="inherit" /> : activeStep === steps.length - 1 ? 'Create Contract' : 'Next'}
          </Button>
        </Box>
      )}

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

export default CreateContractPage;

