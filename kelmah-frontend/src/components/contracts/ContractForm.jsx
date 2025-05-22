import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Autocomplete,
  Chip,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stack,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tooltip
} from '@mui/material';
import { 
  Save as SaveIcon, 
  Delete as DeleteIcon, 
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  CalendarMonth as CalendarIcon,
  AccountCircle as PersonIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ContractService from '../../services/ContractService';

// Define contract types
const contractTypes = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'hourly', label: 'Hourly Rate' },
  { value: 'milestone', label: 'Milestone Based' }
];

// Payment terms options
const paymentTermsOptions = [
  { value: 'upfront', label: 'Upfront Payment' },
  { value: 'completion', label: 'Payment on Completion' },
  { value: 'milestone', label: 'Payment per Milestone' },
  { value: 'net30', label: 'Net 30 Days' },
  { value: 'custom', label: 'Custom Payment Terms' }
];

// Validation schema
const validationSchema = Yup.object({
  title: Yup.string().required('Contract title is required'),
  description: Yup.string().required('Contract description is required'),
  contractType: Yup.string().required('Contract type is required'),
  startDate: Yup.date().required('Start date is required'),
  endDate: Yup.date().nullable(),
  jobId: Yup.string().nullable(),
  workerId: Yup.string().required('Worker is required'),
  hirerId: Yup.string().required('Hirer is required'),
  paymentAmount: Yup.number().positive('Amount must be positive').required('Payment amount is required'),
  paymentTerms: Yup.string().required('Payment terms are required'),
  milestones: Yup.array().of(
    Yup.object().shape({
      title: Yup.string().required('Milestone title is required'),
      description: Yup.string(),
      amount: Yup.number().positive('Amount must be positive').required('Amount is required'),
      dueDate: Yup.date().nullable()
    })
  )
});

const ContractForm = ({ contractId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [hirers, setHirers] = useState([]);
  const [addMilestoneDialogOpen, setAddMilestoneDialogOpen] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState(null);
  const [editingMilestoneIndex, setEditingMilestoneIndex] = useState(-1);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { label: 'Contract Information', description: 'Basic contract details and type' },
    { label: 'Parties Involved', description: 'Select worker and hirer' },
    { label: 'Payment Details', description: 'Payment amount and terms' },
    { label: 'Milestones', description: 'Set up milestone deliverables' },
    { label: 'Review and Submit', description: 'Finalize your contract' }
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      contractType: '',
      startDate: null,
      endDate: null,
      jobId: '',
      workerId: '',
      hirerId: '',
      paymentAmount: '',
      paymentTerms: '',
      customPaymentTerms: '',
      milestones: []
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        
        // Format milestones for API
        const formattedMilestones = values.milestones.map(milestone => ({
          ...milestone,
          dueDate: milestone.dueDate ? new Date(milestone.dueDate).toISOString() : null
        }));
        
        // Format dates
        const formattedValues = {
          ...values,
          startDate: values.startDate ? new Date(values.startDate).toISOString() : null,
          endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
          milestones: formattedMilestones,
          paymentTerms: values.paymentTerms === 'custom' ? values.customPaymentTerms : values.paymentTerms
        };
        
        // Remove customPaymentTerms as it's not needed in the API
        delete formattedValues.customPaymentTerms;
        
        let response;
        if (contractId) {
          // Update existing contract
          response = await ContractService.updateContract(contractId, formattedValues);
        } else {
          // Create new contract
          response = await ContractService.createContract(formattedValues);
        }
        
        setSuccess(true);
        
        // Redirect to contract details after short delay
        setTimeout(() => {
          navigate(`/contracts/${response.data.id}`);
        }, 1500);
      } catch (err) {
        console.error('Error saving contract:', err);
        setError(err.response?.data?.message || 'Failed to save contract. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        
        // Fetch jobs, workers, and hirers in parallel
        const [jobsResponse, workersResponse, hirersResponse] = await Promise.all([
          fetch('/api/jobs').then(res => res.json()),
          fetch('/api/workers').then(res => res.json()),
          fetch('/api/hirers').then(res => res.json())
        ]);
        
        setJobs(jobsResponse.data);
        setWorkers(workersResponse.data);
        setHirers(hirersResponse.data);
        
        // If editing an existing contract, load its data
        if (contractId) {
          const contractResponse = await ContractService.getContractById(contractId);
          const contract = contractResponse.data;
          
          formik.setValues({
            title: contract.title || '',
            description: contract.description || '',
            contractType: contract.contractType || '',
            startDate: contract.startDate ? new Date(contract.startDate) : null,
            endDate: contract.endDate ? new Date(contract.endDate) : null,
            jobId: contract.jobId || '',
            workerId: contract.workerId || '',
            hirerId: contract.hirerId || '',
            paymentAmount: contract.paymentAmount || '',
            paymentTerms: contract.paymentTerms || '',
            customPaymentTerms: '',
            milestones: contract.milestones?.map(milestone => ({
              title: milestone.title || '',
              description: milestone.description || '',
              amount: milestone.amount || '',
              dueDate: milestone.dueDate ? new Date(milestone.dueDate) : null
            })) || []
          });
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load required data. Please try again.');
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchData();
  }, [contractId]);

  const handleOpenMilestoneDialog = (index = -1) => {
    if (index >= 0) {
      // Editing existing milestone
      setCurrentMilestone(formik.values.milestones[index]);
      setEditingMilestoneIndex(index);
    } else {
      // Adding new milestone
      setCurrentMilestone({
        title: '',
        description: '',
        amount: '',
        dueDate: null
      });
      setEditingMilestoneIndex(-1);
    }
    setAddMilestoneDialogOpen(true);
  };

  const handleCloseMilestoneDialog = () => {
    setAddMilestoneDialogOpen(false);
    setCurrentMilestone(null);
  };

  const handleSaveMilestone = () => {
    if (!currentMilestone?.title) return;
    
    const newMilestones = [...formik.values.milestones];
    
    if (editingMilestoneIndex >= 0) {
      // Update existing milestone
      newMilestones[editingMilestoneIndex] = currentMilestone;
    } else {
      // Add new milestone
      newMilestones.push(currentMilestone);
    }
    
    formik.setFieldValue('milestones', newMilestones);
    handleCloseMilestoneDialog();
  };

  const handleDeleteMilestone = (index) => {
    const newMilestones = formik.values.milestones.filter((_, i) => i !== index);
    formik.setFieldValue('milestones', newMilestones);
  };

  const handleMilestoneChange = (field) => (event) => {
    setCurrentMilestone({
      ...currentMilestone,
      [field]: field === 'dueDate' ? event : event.target.value
    });
  };

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  const renderStepContent = (step) => {
    switch (step) {
      case 0: // Contract Information
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="title"
                name="title"
                label="Contract Title"
                value={formik.values.title}
                onChange={formik.handleChange}
                error={formik.touched.title && Boolean(formik.errors.title)}
                helperText={formik.touched.title && formik.errors.title}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="description"
                name="description"
                label="Contract Description"
                value={formik.values.description}
                onChange={formik.handleChange}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
                variant="outlined"
                multiline
                rows={4}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={formik.touched.contractType && Boolean(formik.errors.contractType)}>
                <InputLabel id="contract-type-label">Contract Type</InputLabel>
                <Select
                  labelId="contract-type-label"
                  id="contractType"
                  name="contractType"
                  value={formik.values.contractType}
                  onChange={formik.handleChange}
                  label="Contract Type"
                >
                  {contractTypes.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.contractType && formik.errors.contractType && (
                  <FormHelperText>{formik.errors.contractType}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Autocomplete
                id="jobId"
                options={jobs}
                getOptionLabel={(option) => option.title || ''}
                value={jobs.find(job => job.id === formik.values.jobId) || null}
                onChange={(_, newValue) => {
                  formik.setFieldValue('jobId', newValue?.id || '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Related Job (Optional)"
                    variant="outlined"
                    error={formik.touched.jobId && Boolean(formik.errors.jobId)}
                    helperText={formik.touched.jobId && formik.errors.jobId}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={formik.values.startDate}
                  onChange={(newValue) => {
                    formik.setFieldValue('startDate', newValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={formik.touched.startDate && Boolean(formik.errors.startDate)}
                      helperText={formik.touched.startDate && formik.errors.startDate}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date (Optional)"
                  value={formik.values.endDate}
                  onChange={(newValue) => {
                    formik.setFieldValue('endDate', newValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={formik.touched.endDate && Boolean(formik.errors.endDate)}
                      helperText={formik.touched.endDate && formik.errors.endDate}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        );
      
      case 1: // Parties Involved
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                id="workerId"
                options={workers}
                getOptionLabel={(option) => option.name || ''}
                value={workers.find(worker => worker.id === formik.values.workerId) || null}
                onChange={(_, newValue) => {
                  formik.setFieldValue('workerId', newValue?.id || '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Worker"
                    variant="outlined"
                    error={formik.touched.workerId && Boolean(formik.errors.workerId)}
                    helperText={formik.touched.workerId && formik.errors.workerId}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <PersonIcon />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      )
                    }}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Autocomplete
                id="hirerId"
                options={hirers}
                getOptionLabel={(option) => option.name || ''}
                value={hirers.find(hirer => hirer.id === formik.values.hirerId) || null}
                onChange={(_, newValue) => {
                  formik.setFieldValue('hirerId', newValue?.id || '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Hirer"
                    variant="outlined"
                    error={formik.touched.hirerId && Boolean(formik.errors.hirerId)}
                    helperText={formik.touched.hirerId && formik.errors.hirerId}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <BusinessIcon />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      )
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        );
      
      case 2: // Payment Details
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="paymentAmount"
                name="paymentAmount"
                label="Payment Amount"
                type="number"
                value={formik.values.paymentAmount}
                onChange={formik.handleChange}
                error={formik.touched.paymentAmount && Boolean(formik.errors.paymentAmount)}
                helperText={formik.touched.paymentAmount && formik.errors.paymentAmount}
                variant="outlined"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={formik.touched.paymentTerms && Boolean(formik.errors.paymentTerms)}>
                <InputLabel id="payment-terms-label">Payment Terms</InputLabel>
                <Select
                  labelId="payment-terms-label"
                  id="paymentTerms"
                  name="paymentTerms"
                  value={formik.values.paymentTerms}
                  onChange={formik.handleChange}
                  label="Payment Terms"
                >
                  {paymentTermsOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.paymentTerms && formik.errors.paymentTerms && (
                  <FormHelperText>{formik.errors.paymentTerms}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            {formik.values.paymentTerms === 'custom' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="customPaymentTerms"
                  name="customPaymentTerms"
                  label="Custom Payment Terms"
                  value={formik.values.customPaymentTerms}
                  onChange={formik.handleChange}
                  variant="outlined"
                  multiline
                  rows={2}
                  placeholder="Describe your custom payment terms here"
                />
              </Grid>
            )}
          </Grid>
        );
      
      case 3: // Milestones
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                Contract Milestones
              </Typography>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                onClick={() => handleOpenMilestoneDialog()}
              >
                Add Milestone
              </Button>
            </Box>
            
            {formik.values.milestones.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                No milestones defined yet. Click the button above to add milestones to your contract.
              </Alert>
            ) : (
              <Box sx={{ mt: 2 }}>
                {formik.values.milestones.map((milestone, index) => (
                  <Paper key={index} sx={{ p: 2, mb: 2, position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenMilestoneDialog(index)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteMilestone(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    
                    <Typography variant="subtitle1" gutterBottom>
                      {milestone.title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {milestone.description || 'No description provided'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Chip
                        label={`$${milestone.amount}`}
                        color="primary"
                        size="small"
                      />
                      
                      {milestone.dueDate && (
                        <Chip
                          icon={<CalendarIcon />}
                          label={new Date(milestone.dueDate).toLocaleDateString()}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        );
      
      case 4: // Review and Submit
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Please review your contract details before submitting. Once created, the contract will be in draft status.
            </Alert>
            
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Contract Summary
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Title</Typography>
                  <Typography variant="body1">{formik.values.title}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Contract Type</Typography>
                  <Typography variant="body1">
                    {contractTypes.find(type => type.value === formik.values.contractType)?.label || 'Not specified'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Description</Typography>
                  <Typography variant="body1">{formik.values.description}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Start Date</Typography>
                  <Typography variant="body1">
                    {formik.values.startDate ? new Date(formik.values.startDate).toLocaleDateString() : 'Not specified'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">End Date</Typography>
                  <Typography variant="body1">
                    {formik.values.endDate ? new Date(formik.values.endDate).toLocaleDateString() : 'Not specified'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Worker</Typography>
                  <Typography variant="body1">
                    {workers.find(worker => worker.id === formik.values.workerId)?.name || 'Not selected'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Hirer</Typography>
                  <Typography variant="body1">
                    {hirers.find(hirer => hirer.id === formik.values.hirerId)?.name || 'Not selected'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Payment Amount</Typography>
                  <Typography variant="body1">${formik.values.paymentAmount}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Payment Terms</Typography>
                  <Typography variant="body1">
                    {formik.values.paymentTerms === 'custom' 
                      ? formik.values.customPaymentTerms 
                      : paymentTermsOptions.find(term => term.value === formik.values.paymentTerms)?.label || 'Not specified'}
                  </Typography>
                </Grid>
                
                {formik.values.milestones.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Milestones</Typography>
                    <Box sx={{ ml: 2 }}>
                      {formik.values.milestones.map((milestone, index) => (
                        <Box key={index} sx={{ mb: 1 }}>
                          <Typography variant="body2">
                            {index + 1}. {milestone.title} - ${milestone.amount}
                            {milestone.dueDate && ` (Due: ${new Date(milestone.dueDate).toLocaleDateString()})`}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
            
            {/* Submit button is rendered outside */}
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton 
          edge="start" 
          onClick={() => navigate('/contracts')}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          {contractId ? 'Edit Contract' : 'Create New Contract'}
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Contract {contractId ? 'updated' : 'created'} successfully! Redirecting...
        </Alert>
      )}
      
      <form onSubmit={formik.handleSubmit}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                optional={
                  <Typography variant="caption">
                    {step.description}
                  </Typography>
                }
              >
                {step.label}
              </StepLabel>
              <StepContent>
                <Box sx={{ my: 2 }}>
                  {renderStepContent(index)}
                </Box>
                <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  {activeStep === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      type="submit"
                      disabled={loading}
                      startIcon={loading && <CircularProgress size={20} />}
                    >
                      {loading ? 'Saving...' : 'Save Contract'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </form>
      
      {/* Milestone Dialog */}
      <Dialog 
        open={addMilestoneDialogOpen} 
        onClose={handleCloseMilestoneDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingMilestoneIndex >= 0 ? 'Edit Milestone' : 'Add New Milestone'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Milestone Title"
            fullWidth
            value={currentMilestone?.title || ''}
            onChange={handleMilestoneChange('title')}
            required
          />
          
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={currentMilestone?.description || ''}
            onChange={handleMilestoneChange('description')}
          />
          
          <TextField
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            value={currentMilestone?.amount || ''}
            onChange={handleMilestoneChange('amount')}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            required
          />
          
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Due Date (Optional)"
              value={currentMilestone?.dueDate || null}
              onChange={handleMilestoneChange('dueDate')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  margin="dense"
                />
              )}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMilestoneDialog}>Cancel</Button>
          <Button onClick={handleSaveMilestone} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContractForm; 