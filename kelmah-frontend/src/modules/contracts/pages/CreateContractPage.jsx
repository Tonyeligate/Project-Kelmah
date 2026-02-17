import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  InputAdornment,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Z_INDEX, STICKY_CTA_HEIGHT } from '../../../constants/layout';
import Toast from '../../common/components/common/Toast';

// Import contract slice actions and selectors
import {
  createContract,
  fetchContractTemplates,
  selectContractTemplates,
  selectContractsLoading,
  selectContractsError,
} from '../services/contractSlice';

const initialContractState = {
  title: '',
  description: '',
  clientName: '',
  workerName: '',
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
  const templates = useSelector(selectContractTemplates);
  const loading = useSelector(selectContractsLoading);
  const error = useSelector(selectContractsError);

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Load contract templates on mount
  useEffect(() => {
    dispatch(fetchContractTemplates());
  }, [dispatch]);

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
    'Basic Details',
    'Parties',
    'Contract Terms',
    'Milestones',
    'Review',
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
        (template) => template.id === value,
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
          errors.value = 'Contract value must be a positive number';
        }
        break;
      case 3: // Milestones
        const milestoneErrors = {};
        let totalAmount = 0;

        contract.milestones.forEach((milestone, index) => {
          const milestoneError = {};
          if (!milestone.title.trim())
            milestoneError.title = 'Title is required';
          if (!milestone.dueDate)
            milestoneError.dueDate = 'Due date is required';
          if (!milestone.amount) {
            milestoneError.amount = 'Amount is required';
          } else if (
            isNaN(milestone.amount) ||
            parseFloat(milestone.amount) <= 0
          ) {
            milestoneError.amount = 'Amount must be a positive number';
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
        if (totalAmount !== parseFloat(contract.value)) {
          errors.totalAmount = `Milestone amounts (${totalAmount}) must equal contract value (${contract.value})`;
        }
        break;
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
            message: err || 'Failed to create contract',
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
                  {templates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.title}
                    </MenuItem>
                  ))}
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
                label="Contract Title"
                value={contract.title}
                onChange={handleChange}
                error={!!validationErrors.title}
                helperText={
                  validationErrors.title ||
                  'Enter a descriptive title for the contract'
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="description"
                name="description"
                label="Contract Description"
                value={contract.description}
                onChange={handleChange}
                multiline
                rows={4}
                error={!!validationErrors.description}
                helperText={
                  validationErrors.description ||
                  'Provide a detailed description of the contract scope and deliverables'
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
                label="Client Name"
                value={contract.clientName}
                onChange={handleChange}
                error={!!validationErrors.clientName}
                helperText={
                  validationErrors.clientName ||
                  'Enter the client name or company'
                }
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
                  'Enter the worker name or company'
                }
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
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!validationErrors.startDate}
                      helperText={
                        validationErrors.startDate ||
                        'Select contract start date'
                      }
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="End Date *"
                  value={contract.endDate}
                  onChange={(value) => handleDateChange('endDate', value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!validationErrors.endDate}
                      helperText={
                        validationErrors.endDate || 'Select contract end date'
                      }
                    />
                  )}
                  minDate={contract.startDate}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="value"
                  name="value"
                  label="Contract Value"
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
                    validationErrors.value || 'Enter the total contract value'
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
                <Paper key={index} sx={{ p: 2, mb: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle1">
                      Milestone {index + 1}
                    </Typography>
                    {contract.milestones.length > 1 && (
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveMilestone(index)}
                        size="small"
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
                        label="Milestone Title"
                        value={milestone.title}
                        onChange={(e) =>
                          handleMilestoneChange(index, 'title', e.target.value)
                        }
                        error={validationErrors.milestones?.[index]?.title}
                        helperText={
                          validationErrors.milestones?.[index]?.title ||
                          'Enter milestone title'
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
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              fullWidth
                              error={
                                validationErrors.milestones?.[index]?.dueDate
                              }
                              helperText={
                                validationErrors.milestones?.[index]?.dueDate ||
                                'Select milestone due date'
                              }
                            />
                          )}
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
                    key={index}
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
                        GH₵{parseFloat(milestone.amount).toFixed(2)}
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
          onClick={handleBack}
          disabled={activeStep === 0}
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
        >
          {activeStep === steps.length - 1 ? 'Create Contract' : 'Next'}
        </Button>
      </Box>

      {/* Discard changes confirmation dialog */}
      <Dialog
        open={discardDialogOpen}
        onClose={() => setDiscardDialogOpen(false)}
      >
        <DialogTitle>Discard changes?</DialogTitle>
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
      >
        <DialogTitle>Confirm Contract Creation</DialogTitle>
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
            bottom: 0,
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
            sx={{ minHeight: 44, flex: 1 }}
          >
            {activeStep === steps.length - 1 ? 'Create Contract' : 'Next'}
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
