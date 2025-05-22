import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  Avatar,
  Slider,
  InputAdornment,
  useTheme
} from '@mui/material';
import {
  Work as WorkIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
  Send as SendIcon,
  KeyboardArrowLeft as BackIcon,
  KeyboardArrowRight as NextIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';
import { Helmet } from 'react-helmet';

// Import worker slice
import { submitWorkerApplication, selectWorkerLoading, selectWorkerError } from '../../store/slices/workerSlice';

const JobApplicationPage = () => {
  const { jobId } = useParams();
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get job data and loading states from Redux store
  const job = useSelector(state => state.jobs.items.find(job => job.id === jobId));
  const workerProfile = useSelector(state => state.worker.profile);
  const workerSkills = useSelector(state => state.worker.skills);
  const isLoading = useSelector(selectWorkerLoading('applications'));
  const error = useSelector(selectWorkerError('applications'));
  
  // Application form state
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    coverLetter: '',
    proposedRate: job?.budget?.min || 0,
    estimatedDuration: job?.duration || '',
    milestones: [],
    attachments: [],
    termsAccepted: false
  });
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', amount: 0 });
  const [validationErrors, setValidationErrors] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Fetch job data if not available
  useEffect(() => {
    if (!job && jobId) {
      // This would normally dispatch a thunk to fetch the job by ID
      // dispatch(fetchJobById(jobId));
    }
  }, [job, jobId, dispatch]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: null
      });
    }
  };
  
  // Handle rate slider change
  const handleRateChange = (event, newValue) => {
    setFormData({
      ...formData,
      proposedRate: newValue
    });
  };
  
  // Add new milestone
  const handleAddMilestone = () => {
    if (!newMilestone.title || !newMilestone.description || newMilestone.amount <= 0) {
      return;
    }
    
    setFormData({
      ...formData,
      milestones: [
        ...formData.milestones,
        { ...newMilestone, id: Date.now() }
      ]
    });
    
    setNewMilestone({ title: '', description: '', amount: 0 });
  };
  
  // Remove milestone
  const handleRemoveMilestone = (id) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.filter(milestone => milestone.id !== id)
    });
  };
  
  // Handle file upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFormData({
        ...formData,
        attachments: [...formData.attachments, ...files]
      });
    }
  };
  
  // Remove attachment
  const handleRemoveAttachment = (index) => {
    const updatedAttachments = [...formData.attachments];
    updatedAttachments.splice(index, 1);
    
    setFormData({
      ...formData,
      attachments: updatedAttachments
    });
  };
  
  // Validate form data
  const validateForm = () => {
    const errors = {};
    
    if (activeStep === 0 && !formData.coverLetter.trim()) {
      errors.coverLetter = 'Cover letter is required';
    }
    
    if (activeStep === 1) {
      if (formData.proposedRate <= 0) {
        errors.proposedRate = 'Please enter a valid rate';
      }
      
      if (!formData.estimatedDuration.trim()) {
        errors.estimatedDuration = 'Please provide an estimated duration';
      }
    }
    
    if (activeStep === 2 && job?.paymentType === 'milestone' && formData.milestones.length === 0) {
      errors.milestones = 'Please add at least one milestone';
    }
    
    if (activeStep === 3 && !formData.termsAccepted) {
      errors.termsAccepted = 'You must accept the terms to proceed';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle step navigation
  const handleNext = () => {
    if (validateForm()) {
      setActiveStep(prevStep => prevStep + 1);
    }
  };
  
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      // Prepare application data
      const applicationData = {
        jobId,
        coverLetter: formData.coverLetter,
        proposedRate: formData.proposedRate,
        estimatedDuration: formData.estimatedDuration,
        milestones: formData.milestones,
        // In a real application, you would handle file uploads differently
        attachmentIds: []
      };
      
      // Dispatch application submission action
      await dispatch(submitWorkerApplication(applicationData)).unwrap();
      setSubmitSuccess(true);
      
      // Reset form
      setFormData({
        coverLetter: '',
        proposedRate: job?.budget?.min || 0,
        estimatedDuration: job?.duration || '',
        milestones: [],
        attachments: [],
        termsAccepted: false
      });
      
      // Move to success step
      setActiveStep(4);
    } catch (err) {
      console.error('Application submission failed:', err);
    }
  };
  
  // Navigate back to job details
  const handleBackToJob = () => {
    navigate(`/jobs/${jobId}`);
  };
  
  // Find more jobs
  const handleFindMoreJobs = () => {
    navigate('/findwork');
  };
  
  // Loading state
  if (!job && isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Error state
  if (!job && !isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          Job not found or has been removed. Please try browsing other available jobs.
        </Alert>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button variant="contained" onClick={() => navigate('/findwork')}>
            Browse Available Jobs
          </Button>
        </Box>
      </Container>
    );
  }
  
  // Define steps for the application process
  const steps = [
    'Cover Letter',
    'Rate & Timeline',
    job?.paymentType === 'milestone' ? 'Milestones' : 'Additional Info',
    'Review & Submit'
  ];
  
  // Render application form steps
  const getStepContent = (step) => {
    switch (step) {
      case 0: // Cover Letter
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Introduce yourself and explain why you're a good fit for this job
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                The client will see this as the first part of your application. Make sure to address their requirements and highlight relevant experience.
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={8}
                maxRows={15}
                label="Cover Letter"
                name="coverLetter"
                value={formData.coverLetter}
                onChange={handleChange}
                error={!!validationErrors.coverLetter}
                helperText={validationErrors.coverLetter}
                placeholder="Introduce yourself and explain why you're the best candidate for this job. Mention relevant experience, skills, and how you plan to approach the project."
              />
            </Grid>
          </Grid>
        );
        
      case 1: // Rate & Timeline
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Set your rate and timeline
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography gutterBottom>
                Proposed Rate (${formData.proposedRate}/hour)
              </Typography>
              <Box sx={{ px: 2 }}>
                <Slider
                  value={formData.proposedRate}
                  onChange={handleRateChange}
                  min={job?.budget?.min || 10}
                  max={job?.budget?.max || 100}
                  step={1}
                  marks={[
                    { value: job?.budget?.min || 10, label: `$${job?.budget?.min || 10}` },
                    { value: job?.budget?.max || 100, label: `$${job?.budget?.max || 100}` }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `$${value}`}
                  aria-labelledby="proposed-rate-slider"
                />
              </Box>
              {validationErrors.proposedRate && (
                <Typography color="error" variant="caption">
                  {validationErrors.proposedRate}
                </Typography>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Estimated Duration"
                name="estimatedDuration"
                value={formData.estimatedDuration}
                onChange={handleChange}
                error={!!validationErrors.estimatedDuration}
                helperText={validationErrors.estimatedDuration || "e.g., '2 weeks', '1 month'"}
                placeholder="How long do you expect this project to take"
              />
            </Grid>
          </Grid>
        );
        
      case 2: // Milestones or Additional Info
        return job?.paymentType === 'milestone' ? (
          // Milestones
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Define project milestones
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Break down the project into specific deliverables with clear deadlines and payment amounts.
              </Typography>
            </Grid>
            
            {/* Existing milestones */}
            {formData.milestones.length > 0 && (
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Defined Milestones
                  </Typography>
                  {formData.milestones.map((milestone, index) => (
                    <Box key={milestone.id} sx={{ mb: 2, pb: 2, borderBottom: index !== formData.milestones.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle2">
                            {index + 1}. {milestone.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {milestone.description}
                          </Typography>
                        </Box>
                        <Box>
                          <Chip
                            label={`$${milestone.amount}`}
                            color="primary"
                            variant="outlined"
                            onDelete={() => handleRemoveMilestone(milestone.id)}
                          />
                        </Box>
                      </Box>
                    </Box>
                  ))}
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2">
                      Total:
                    </Typography>
                    <Typography variant="subtitle1" color="primary">
                      ${formData.milestones.reduce((total, m) => total + parseFloat(m.amount), 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            )}
            
            {/* Add new milestone */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Add New Milestone
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Milestone Title"
                      value={newMilestone.title}
                      onChange={(e) => setNewMilestone({...newMilestone, title: e.target.value})}
                      placeholder="e.g., 'Initial Design', 'Frontend Development'"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Amount"
                      type="number"
                      value={newMilestone.amount}
                      onChange={(e) => setNewMilestone({...newMilestone, amount: e.target.value})}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      multiline
                      rows={2}
                      value={newMilestone.description}
                      onChange={(e) => setNewMilestone({...newMilestone, description: e.target.value})}
                      placeholder="Describe what will be delivered in this milestone"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      onClick={handleAddMilestone}
                      disabled={!newMilestone.title || !newMilestone.description || newMilestone.amount <= 0}
                    >
                      Add Milestone
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
              {validationErrors.milestones && (
                <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                  {validationErrors.milestones}
                </Typography>
              )}
            </Grid>
          </Grid>
        ) : (
          // Additional Info (for hourly jobs)
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Additional Information
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Provide any additional information that might be relevant to your application.
              </Typography>
            </Grid>
            
            {/* File attachments */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Attachments (optional)
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<DescriptionIcon />}
                >
                  Upload Files
                  <input
                    type="file"
                    multiple
                    hidden
                    onChange={handleFileUpload}
                  />
                </Button>
              </Box>
              
              {formData.attachments.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Uploaded Files:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {formData.attachments.map((file, index) => (
                      <Chip
                        key={index}
                        label={file.name}
                        onDelete={() => handleRemoveAttachment(index)}
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Grid>
          </Grid>
        );
        
      case 3: // Review & Submit
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Review your application
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Please review your application details before submitting.
              </Typography>
            </Grid>
            
            {/* Application summary */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Rate & Timeline
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <MoneyIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
                    <Typography>
                      {job?.paymentType === 'hourly' 
                        ? `$${formData.proposedRate}/hour` 
                        : `$${formData.milestones.reduce((total, m) => total + parseFloat(m.amount), 0).toFixed(2)} (total)`}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
                    <Typography>
                      {formData.estimatedDuration}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Job Details
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <WorkIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
                    <Typography>
                      {job?.title}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
                    <Typography>
                      {job?.locationType === 'remote' ? 'Remote' : job?.location}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Cover letter preview */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Cover Letter
                  </Typography>
                  <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-line' }}>
                    {formData.coverLetter}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Milestones preview */}
            {job?.paymentType === 'milestone' && formData.milestones.length > 0 && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Milestones
                    </Typography>
                    {formData.milestones.map((milestone, index) => (
                      <Box key={milestone.id} sx={{ mb: 2, pb: 2, borderBottom: index !== formData.milestones.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="subtitle2">
                              {index + 1}. {milestone.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {milestone.description}
                            </Typography>
                          </Box>
                          <Chip
                            label={`$${milestone.amount}`}
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            )}
            
            {/* Attachments preview */}
            {formData.attachments.length > 0 && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Attachments ({formData.attachments.length})
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {formData.attachments.map((file, index) => (
                        <Chip
                          key={index}
                          label={file.name}
                          icon={<DescriptionIcon />}
                        />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}
            
            {/* Terms acceptance */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.termsAccepted}
                    onChange={handleChange}
                    name="termsAccepted"
                    color="primary"
                  />
                }
                label="I agree to the Terms of Service and understand that my application will be visible to the client."
              />
              {validationErrors.termsAccepted && (
                <Typography color="error" variant="caption" sx={{ display: 'block' }}>
                  {validationErrors.termsAccepted}
                </Typography>
              )}
            </Grid>
            
            {error && (
              <Grid item xs={12}>
                <Alert severity="error">
                  {error}
                </Alert>
              </Grid>
            )}
          </Grid>
        );
        
      case 4: // Success
        return (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Application Submitted Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your application has been submitted to the client. You will be notified when they respond to your application.
            </Typography>
            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="outlined" onClick={handleBackToJob}>
                Back to Job
              </Button>
              <Button variant="contained" onClick={handleFindMoreJobs}>
                Find More Jobs
              </Button>
            </Box>
          </Box>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Helmet>
        <title>{`Apply for: ${job?.title} | Kelmah`}</title>
      </Helmet>
      
      {/* Job title and back button */}
      <Box sx={{ mb: 4 }}>
        <Button
          variant="text"
          startIcon={<BackIcon />}
          onClick={handleBackToJob}
          sx={{ mb: 2 }}
        >
          Back to Job
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          Apply for: {job?.title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Chip 
            icon={<WorkIcon />} 
            label={job?.category}
            variant="outlined"
          />
          <Chip 
            icon={<LocationIcon />} 
            label={job?.locationType === 'remote' ? 'Remote' : job?.location}
            variant="outlined"
          />
          <Chip 
            icon={<MoneyIcon />} 
            label={job?.paymentType === 'hourly' 
              ? `$${job?.budget?.min}-${job?.budget?.max}/hr` 
              : `$${job?.budget?.fixed} (Fixed)`}
            variant="outlined"
          />
        </Box>
      </Box>
      
      {/* Application stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {/* Step content */}
      <Paper sx={{ p: 3, mb: 3 }}>
        {getStepContent(activeStep)}
      </Paper>
      
      {/* Navigation buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          startIcon={<BackIcon />}
          disabled={activeStep === 0 || activeStep === 4}
        >
          Back
        </Button>
        
        <Box>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              endIcon={<SendIcon />}
              disabled={isLoading || formData.termsAccepted === false}
              color="primary"
            >
              {isLoading ? <CircularProgress size={24} /> : 'Submit Application'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<NextIcon />}
              disabled={activeStep === 4}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default JobApplicationPage; 