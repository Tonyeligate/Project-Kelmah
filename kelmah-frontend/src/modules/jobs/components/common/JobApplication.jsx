import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  FormHelperText,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Send as SendIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  AttachFile as AttachFileIcon,
  ExpandMore as ExpandMoreIcon,
  AccountCircle,
  BusinessCenter,
  Schedule,
  Paid,
  LocationOn,
} from '@mui/icons-material';
// Temporarily comment out API import until jobs service is implemented
// import jobsApi from '../../../../api/jobsApi';
import { useAuth } from '../../auth/contexts/AuthContext';
import { format } from 'date-fns';
import axiosInstance from '../../../../common/services/axios';

// Styled components
const ApplicationPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  overflow: 'hidden',
}));

const JobInfoCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 1.5,
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
  marginBottom: theme.spacing(3),
  border: '1px solid',
  borderColor: theme.palette.divider,
}));

const MilestoneCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  boxShadow: 'none',
  border: '1px solid',
  borderColor: theme.palette.divider,
  marginBottom: theme.spacing(2),
}));

const ApplicationButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 4,
  padding: theme.spacing(1.2, 4),
  fontWeight: 600,
}));

function JobApplication() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();

  // Application form steps
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    'Job Overview',
    'Your Proposal',
    'Milestones',
    'Review & Submit',
  ];

  // State
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    proposedBudget: '',
    currency: "GHS",
    estimatedDuration: '',
    attachments: [],
    milestoneProposal: [],
  });

  // Milestone form state
  const [currentMilestone, setCurrentMilestone] = useState({
    title: '',
    description: '',
    amount: '',
    estimatedDays: '',
  });

  // Form validation
  const [formErrors, setFormErrors] = useState({});

  // Fetch job details on component mount
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const response = await jobsApi.getJobById(jobId);
        setJob(response.data);

        // Set defaults from job
        setApplicationData((prev) => ({
          ...prev,
          proposedBudget: response.data.budget,
          currency: response.data.currency || 'GHS',
        }));

        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setApplicationData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Handle milestone input changes
  const handleMilestoneChange = (e) => {
    const { name, value } = e.target;
    setCurrentMilestone((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add a milestone to the proposal
  const handleAddMilestone = () => {
    // Validate milestone
    const errors = {};
    if (!currentMilestone.title) errors.milestoneTitle = 'Title is required';
    if (!currentMilestone.amount) errors.milestoneAmount = 'Amount is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors({ ...formErrors, ...errors });
      return;
    }

    // Add milestone to proposal
    setApplicationData((prev) => ({
      ...prev,
      milestoneProposal: [...prev.milestoneProposal, { ...currentMilestone }],
    }));

    // Clear milestone form
    setCurrentMilestone({
      title: '',
      description: '',
      amount: '',
      estimatedDays: '',
    });
  };

  // Remove a milestone from the proposal
  const handleRemoveMilestone = (index) => {
    setApplicationData((prev) => ({
      ...prev,
      milestoneProposal: prev.milestoneProposal.filter((_, i) => i !== index),
    }));
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const fileObjects = files.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    setApplicationData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...fileObjects],
    }));
  };

  // Remove an attachment
  const handleRemoveAttachment = (index) => {
    setApplicationData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  // Go to next step
  const handleNext = () => {
    const errors = validateStep(activeStep);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setActiveStep((prev) => prev + 1);
  };

  // Go to previous step
  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Validate current step form inputs
  const validateStep = (step) => {
    const errors = {};

    switch (step) {
      case 0: // Job Overview - no validation needed
        break;
      case 1: // Your Proposal
        if (!applicationData.coverLetter)
          errors.coverLetter = 'Cover letter is required';
        if (!applicationData.proposedBudget)
          errors.proposedBudget = 'Proposed budget is required';
        break;
      case 2: // Milestones
        // Milestones are optional, but if any are added, they should total to the proposed budget
        if (applicationData.milestoneProposal.length > 0) {
          const totalMilestoneAmount = applicationData.milestoneProposal.reduce(
            (sum, milestone) => sum + parseFloat(milestone.amount || 0),
            0,
          );

          if (
            totalMilestoneAmount !== parseFloat(applicationData.proposedBudget)
          ) {
            errors.milestones = `Milestone amounts should total to the proposed budget (${applicationData.proposedBudget} ${applicationData.currency})`;
          }
        }
        break;
      case 3: // Review - no additional validation needed
        break;
      default:
        break;
    }

    return errors;
  };

  // Submit application
  const handleSubmit = async () => {
    // Final validation
    let combinedErrors = {};
    for (let i = 0; i < steps.length; i++) {
      const stepErrors = validateStep(i);
      combinedErrors = { ...combinedErrors, ...stepErrors };
    }

    if (Object.keys(combinedErrors).length > 0) {
      setFormErrors(combinedErrors);
      // Go to the first step with errors
      for (let i = 0; i < steps.length; i++) {
        if (Object.keys(validateStep(i)).length > 0) {
          setActiveStep(i);
          break;
        }
      }
      return;
    }

    try {
      // Process attachments properly
      let processedAttachments = [];

      if (applicationData.attachments.length > 0) {
        setSubmitting(true);

        try {
          // Create a FormData object for file uploads
          const formData = new FormData();

          // Append each file to the FormData
          applicationData.attachments.forEach((attachment, index) => {
            formData.append(`file${index}`, attachment.file);
          });

          // Upload the files first
          const uploadResponse = await axiosInstance.post(
            '/uploads',
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            },
          );

          // Get the file URLs from the response
          processedAttachments = uploadResponse.data.files.map(
            (fileData, index) => ({
              fileName: applicationData.attachments[index].name,
              fileSize: applicationData.attachments[index].size,
              fileType: applicationData.attachments[index].type,
              fileUrl: fileData.url,
              fileId: fileData.id,
            }),
          );
        } catch (uploadError) {
          setError(
            'Failed to upload attachments. ' + (uploadError.message || ''),
          );
          setSubmitting(false);
          return;
        }
      }

      // Create submission data with processed attachments
      const submissionData = {
        ...applicationData,
        attachments: processedAttachments,
      };

      // Submit the application with attachment references
      await jobsApi.applyForJob(jobId, submissionData);
      setSuccess(true);

      // Redirect after successful submission (with delay)
      setTimeout(() => {
        navigate('/dashboard/applications');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error && !job) {
    return (
      <Box sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/jobs')}
          variant="outlined"
        >
          Back to Jobs
        </Button>
      </Box>
    );
  }

  if (success) {
    return (
      <Box sx={{ py: 3 }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          Your application has been submitted successfully!
        </Alert>
        <Typography variant="body1" sx={{ mb: 2 }}>
          The job poster will review your application and get back to you.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/dashboard/applications')}
        >
          View My Applications
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/jobs/${jobId}`)}
        sx={{ mb: 3 }}
      >
        Back to Job Details
      </Button>

      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        fontWeight={700}
        color="primary"
      >
        Apply for Job
      </Typography>

      <ApplicationPaper elevation={3} sx={{ mt: 3, overflow: 'hidden' }}>
        {/* Stepper */}
        <Box
          sx={{
            p: 3,
            pb: 2,
            bgcolor: theme.palette.background.default,
            borderBottom: '1px solid',
            borderColor: theme.palette.divider,
          }}
        >
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Step content */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Job Overview
              </Typography>

              <JobInfoCard>
                <CardContent>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                    {job?.title}
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={6}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                      >
                        <AccountCircle color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          <strong>Posted by:</strong>{' '}
                          {job?.hirerName || 'Anonymous Client'}
                        </Typography>
                      </Box>

                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                      >
                        <BusinessCenter color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          <strong>Category:</strong> {job?.category}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                      >
                        <Paid color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          <strong>Budget:</strong> {job?.budget} {job?.currency}
                        </Typography>
                      </Box>

                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                      >
                        <Schedule color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          <strong>Duration:</strong>{' '}
                          {job?.duration || 'Not specified'} days
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Job Description
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ mb: 2, whiteSpace: 'pre-line' }}
                  >
                    {job?.description}
                  </Typography>

                  {job?.skills?.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, mb: 1 }}
                      >
                        Skills Required
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {job.skills.map((skill, index) => (
                          <Chip
                            key={index}
                            label={skill}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </JobInfoCard>
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Your Proposal
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    name="coverLetter"
                    label="Cover Letter"
                    fullWidth
                    multiline
                    rows={6}
                    value={applicationData.coverLetter}
                    onChange={handleInputChange}
                    error={!!formErrors.coverLetter}
                    helperText={
                      formErrors.coverLetter ||
                      'Introduce yourself and explain why you are the right person for this job'
                    }
                    variant="outlined"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    name="proposedBudget"
                    label="Your Proposed Budget"
                    fullWidth
                    type="number"
                    value={applicationData.proposedBudget}
                    onChange={handleInputChange}
                    error={!!formErrors.proposedBudget}
                    helperText={formErrors.proposedBudget}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {applicationData.currency}
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    name="estimatedDuration"
                    label="Estimated Duration (days)"
                    fullWidth
                    type="number"
                    value={applicationData.estimatedDuration}
                    onChange={handleInputChange}
                    error={!!formErrors.estimatedDuration}
                    helperText={formErrors.estimatedDuration}
                    variant="outlined"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Attachments
                  </Typography>

                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                  >
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<AttachFileIcon />}
                      sx={{ width: 'fit-content' }}
                    >
                      Add File
                      <input
                        type="file"
                        multiple
                        hidden
                        onChange={handleFileUpload}
                      />
                    </Button>

                    {applicationData.attachments.length > 0 && (
                      <List>
                        {applicationData.attachments.map((file, index) => (
                          <ListItem
                            key={index}
                            secondaryAction={
                              <IconButton
                                edge="end"
                                onClick={() => handleRemoveAttachment(index)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            }
                          >
                            <ListItemText
                              primary={file.name}
                              secondary={`${(file.size / 1024).toFixed(1)} KB`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Proposed Milestones
              </Typography>

              <Typography variant="body2" paragraph color="text.secondary">
                Break down the project into milestones to structure the work and
                payments.
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="title"
                    label="Milestone Title"
                    fullWidth
                    value={currentMilestone.title}
                    onChange={handleMilestoneChange}
                    error={!!formErrors.milestoneTitle}
                    helperText={formErrors.milestoneTitle}
                    variant="outlined"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    name="amount"
                    label="Amount"
                    fullWidth
                    type="number"
                    value={currentMilestone.amount}
                    onChange={handleMilestoneChange}
                    error={!!formErrors.milestoneAmount}
                    helperText={formErrors.milestoneAmount}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {applicationData.currency}
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    name="estimatedDays"
                    label="Estimated Days"
                    fullWidth
                    type="number"
                    value={currentMilestone.estimatedDays}
                    onChange={handleMilestoneChange}
                    variant="outlined"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box
                    sx={{
                      display: 'flex',
                      height: '100%',
                      alignItems: 'center',
                    }}
                  >
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddMilestone}
                      sx={{ mt: { xs: 0, sm: 1 } }}
                    >
                      Add Milestone
                    </Button>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    name="description"
                    label="Milestone Description"
                    fullWidth
                    multiline
                    rows={3}
                    value={currentMilestone.description}
                    onChange={handleMilestoneChange}
                    variant="outlined"
                  />
                </Grid>
              </Grid>

              {applicationData.milestoneProposal.length > 0 ? (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Your Milestones
                  </Typography>

                  {formErrors.milestones && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {formErrors.milestones}
                    </Alert>
                  )}

                  {applicationData.milestoneProposal.map((milestone, index) => (
                    <MilestoneCard key={index} sx={{ mb: 2 }}>
                      <CardContent sx={{ py: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight={600}>
                            {index + 1}. {milestone.title}
                          </Typography>
                          <Box>
                            <Chip
                              label={`${milestone.amount} ${applicationData.currency}`}
                              color="primary"
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            {milestone.estimatedDays && (
                              <Chip
                                label={`${milestone.estimatedDays} days`}
                                color="secondary"
                                variant="outlined"
                                size="small"
                              />
                            )}
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveMilestone(index)}
                              sx={{ ml: 1 }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                        {milestone.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                          >
                            {milestone.description}
                          </Typography>
                        )}
                      </CardContent>
                    </MilestoneCard>
                  ))}

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mt: 3,
                    }}
                  >
                    <Typography variant="subtitle1">Total:</Typography>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      color="primary"
                    >
                      {applicationData.milestoneProposal.reduce(
                        (sum, m) => sum + parseFloat(m.amount || 0),
                        0,
                      )}{' '}
                      {applicationData.currency}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Breaking your work into milestones can increase your chances
                  of getting hired.
                </Alert>
              )}
            </Box>
          )}

          {activeStep === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Review Your Application
              </Typography>

              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Cover Letter
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" whiteSpace="pre-line">
                    {applicationData.coverLetter}
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Budget & Duration
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Proposed Budget:</strong>{' '}
                        {applicationData.proposedBudget}{' '}
                        {applicationData.currency}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Estimated Duration:</strong>{' '}
                        {applicationData.estimatedDuration || 'Not specified'}{' '}
                        days
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Milestones ({applicationData.milestoneProposal.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {applicationData.milestoneProposal.length > 0 ? (
                    <List>
                      {applicationData.milestoneProposal.map(
                        (milestone, index) => (
                          <ListItem
                            key={index}
                            divider={
                              index <
                              applicationData.milestoneProposal.length - 1
                            }
                          >
                            <ListItemText
                              primary={`${index + 1}. ${milestone.title} (${milestone.amount} ${applicationData.currency})`}
                              secondary={milestone.description}
                            />
                          </ListItem>
                        ),
                      )}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No milestones proposed.
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Attachments ({applicationData.attachments.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {applicationData.attachments.length > 0 ? (
                    <List>
                      {applicationData.attachments.map((file, index) => (
                        <ListItem
                          key={index}
                          divider={
                            index < applicationData.attachments.length - 1
                          }
                        >
                          <ListItemText
                            primary={file.name}
                            secondary={`${(file.size / 1024).toFixed(1)} KB`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No files attached.
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>

              {error && (
                <Alert severity="error" sx={{ mt: 3 }}>
                  {error}
                </Alert>
              )}
            </Box>
          )}

          {/* Navigation buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={activeStep === 0}
              sx={{ borderRadius: theme.shape.borderRadius * 4 }}
            >
              Back
            </Button>

            <Box>
              {activeStep === steps.length - 1 ? (
                <ApplicationButton
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                  endIcon={
                    submitting ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <SendIcon />
                    )
                  }
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </ApplicationButton>
              ) : (
                <ApplicationButton
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                >
                  Next
                </ApplicationButton>
              )}
            </Box>
          </Box>
        </Box>
      </ApplicationPaper>
    </Box>
  );
}

export default JobApplication;
