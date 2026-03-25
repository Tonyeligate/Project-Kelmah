import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box, Paper, Typography, TextField, Button, Grid, CircularProgress, Alert, Divider, Card, CardContent, Chip, IconButton, InputAdornment, MenuItem, Stepper, Step, StepLabel, useTheme, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText, FormHelperText, LinearProgress,
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
import { format } from 'date-fns';
import { api } from '../../../../services/apiClient';
import {
  useApplyToJobMutation,
  useJobQuery,
} from '../../hooks/useJobsQuery';
import fileUploadService from '../../../common/services/fileUploadService';
import { useBreakpointDown } from '@/hooks/useResponsive';
import { formatGhanaCurrency } from '@/utils/formatters';

// Styled components
const ApplicationPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    borderRadius: theme.shape.borderRadius * 1.25,
  },
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
  const { user } = useSelector((state) => state.auth);
  const theme = useTheme();
  const isMobile = useBreakpointDown('sm');
  const {
    data: job,
    isLoading: isJobLoading,
    error: jobError,
  } = useJobQuery(jobId);
  const applyMutation = useApplyToJobMutation();

  // Application form steps
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    'Job Overview',
    'Your Proposal',
    'Milestones',
    'Review & Submit',
  ];

  // State
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    proposedBudget: '',
    currency: 'GHS',
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

  const getAttachmentSignature = (attachment) => {
    const file = attachment?.file;
    const lastModified = typeof file?.lastModified === 'number'
      ? file.lastModified
      : typeof attachment?.lastModified === 'number'
        ? attachment.lastModified
        : 'na';

    return `${attachment?.name}-${attachment?.size}-${lastModified}`;
  };

  // Sync defaults from job payload when it loads
  useEffect(() => {
    if (!job) return;
    setApplicationData((prev) => ({
      ...prev,
      proposedBudget:
        job?.budget?.amount ||
        job?.budget?.min ||
        job?.budget ||
        '',
      currency: job?.currency || 'GHS',
    }));
  }, [job]);

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
    const files = Array.from(e.target.files || []);
    const fileObjects = files.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    }));

    setApplicationData((prev) => {
      const seen = new Set(prev.attachments.map((attachment) => getAttachmentSignature(attachment)));
      const nextAttachments = [...prev.attachments];

      fileObjects.forEach((attachment) => {
        const signature = getAttachmentSignature(attachment);
        if (!seen.has(signature)) {
          seen.add(signature);
          nextAttachments.push(attachment);
        }
      });

      return {
        ...prev,
        attachments: nextAttachments,
      };
    });

    e.target.value = '';
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
            errors.milestones = `Milestone amounts should total to the proposed budget (${formatGhanaCurrency(applicationData.proposedBudget)})`;
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
    if (submitting || success) {
      return;
    }

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

    setSubmitting(true);

    try {
      // Process attachments properly
      let processedAttachments = [];

      if (applicationData.attachments.length > 0) {
        try {
          const uploads = await fileUploadService.uploadFiles(
            applicationData.attachments.map((attachment) => attachment.file),
            'applications',
            'user',
          );

          const failedUpload = uploads.find((item) => item?.error);
          if (failedUpload) {
            throw new Error(failedUpload.error || 'Attachment upload failed');
          }

          processedAttachments = uploads.map((fileData, index) => ({
            name: applicationData.attachments[index].name,
            fileSize: applicationData.attachments[index].size,
            fileType: applicationData.attachments[index].type,
            fileUrl: fileData.fileUrl || fileData.url,
            publicId: fileData.publicId || null,
            resourceType: fileData.resourceType || null,
            thumbnailUrl: fileData.thumbnailUrl || null,
            width: fileData.width || null,
            height: fileData.height || null,
            duration: fileData.duration || null,
            format: fileData.format || null,
          }));
        } catch (uploadError) {
          setSubmissionError(
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
      setSubmissionError(null);
      await applyMutation.mutateAsync({
        jobId,
        applicationData: submissionData,
      });
      setSuccess(true);

      // Redirect after successful submission (with delay)
      setTimeout(() => {
        navigate('/worker/applications');
      }, 2000);
    } catch (err) {
      setSubmissionError(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (isJobLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (jobError && !job) {
    return (
      <Box sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {jobError?.message || 'Failed to fetch job details'}
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

  if (!job) {
    return (
      <Box sx={{ py: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Job details are not available right now. Please try again later.
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
          onClick={() => navigate('/worker/applications')}
        >
          View My Applications
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ py: { xs: 1.5, sm: 3 }, pb: { xs: success ? 2 : 11, sm: 3 } }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/jobs/${jobId}`)}
        sx={{ mb: { xs: 1.25, sm: 3 } }}
      >
        Back to Job Details
      </Button>

      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        fontWeight={700}
        color="primary"
        sx={{ fontSize: { xs: '1.3rem', sm: '2rem' } }}
      >
        Apply for Job
      </Typography>

      <ApplicationPaper elevation={3} sx={{ mt: 3, overflow: 'hidden' }}>
        {/* Stepper */}
        <Box
          sx={{
            p: { xs: 1.25, sm: 3 },
            pb: { xs: 1.25, sm: 2 },
            bgcolor: theme.palette.background.default,
            borderBottom: '1px solid',
            borderColor: theme.palette.divider,
          }}
        >
          {isMobile ? (
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                Step {activeStep + 1} of {steps.length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 700, mb: 0.75 }}>
                {steps[activeStep]}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={((activeStep + 1) / steps.length) * 100}
                sx={{ height: 6, borderRadius: 99 }}
              />
            </Box>
          ) : (
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          )}
        </Box>

        <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
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
                          <strong>Budget:</strong>{' '}
                          {job?.budget
                            ? typeof job.budget === 'object'
                              ? `${formatGhanaCurrency(job.budget?.min || 0)} - ${formatGhanaCurrency(job.budget?.max || 0)}`
                              : formatGhanaCurrency(job.budget)
                            : 'Not specified'}{' '}
                        </Typography>
                      </Box>

                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                      >
                        <Schedule color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          <strong>Duration:</strong>{' '}
                          {job?.duration
                            ? typeof job.duration === 'object'
                              ? `${job.duration.value || 0} ${job.duration.unit || 'days'}`
                              : `${job.duration} days`
                            : 'Not specified'}
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
                            key={`${skill || 'skill'}-${index}`}
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
                    placeholder="Tell the hirer about your experience and why you are right for this job..."
                    fullWidth
                    multiline
                    rows={isMobile ? 4 : 6}
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
                    placeholder="e.g. 500"
                    fullWidth
                    type="number"
                    value={applicationData.proposedBudget}
                    onChange={handleInputChange}
                    error={!!formErrors.proposedBudget}
                    helperText={formErrors.proposedBudget}
                    inputProps={{ inputMode: 'decimal' }}
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
                    placeholder="e.g. 14"
                    fullWidth
                    type="number"
                    value={applicationData.estimatedDuration}
                    onChange={handleInputChange}
                    error={!!formErrors.estimatedDuration}
                    helperText={formErrors.estimatedDuration}
                    inputProps={{ inputMode: 'numeric' }}
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
                        aria-label="Upload application attachments"
                        onChange={handleFileUpload}
                      />
                    </Button>

                    {applicationData.attachments.length > 0 && (
                      <List>
                        {applicationData.attachments.map((file, index) => (
                          <ListItem
                            key={`${file.name || 'attachment'}-${file.size || 0}-${file.lastModified || index}`}
                            secondaryAction={
                              <IconButton
                                edge="end"
                                onClick={() => handleRemoveAttachment(index)}
                                aria-label={`Remove attachment ${file.name}`}
                                sx={{
                                  width: 44,
                                  height: 44,
                                  '&:focus-visible': {
                                    outline: '3px solid',
                                    outlineColor: 'primary.main',
                                    outlineOffset: '2px',
                                  },
                                }}
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
                    inputProps={{ inputMode: 'decimal' }}
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
                    inputProps={{ inputMode: 'numeric' }}
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
                    <MilestoneCard key={milestone.id || milestone._id || `${milestone.title || 'milestone'}-${milestone.amount || 0}-${index}`} sx={{ mb: 2 }}>
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
                              label={formatGhanaCurrency(milestone.amount)}
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
                              aria-label={`Remove milestone ${index + 1}`}
                              sx={{
                                ml: 1,
                                width: 44,
                                height: 44,
                                '&:focus-visible': {
                                  outline: '3px solid',
                                  outlineColor: 'primary.main',
                                  outlineOffset: '2px',
                                },
                              }}
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
                      {formatGhanaCurrency(applicationData.milestoneProposal.reduce(
                        (sum, m) => sum + parseFloat(m.amount || 0),
                        0,
                      ))}
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
                        {formatGhanaCurrency(applicationData.proposedBudget)}
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
                            key={milestone.id || milestone._id || `${milestone.title || 'milestone'}-${milestone.amount || 0}-${index}`}
                            divider={
                              index <
                              applicationData.milestoneProposal.length - 1
                            }
                          >
                            <ListItemText
                              primary={`${index + 1}. ${milestone.title} (${formatGhanaCurrency(milestone.amount)})`}
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
                          key={`${file.name || 'attachment'}-${file.size || 0}-${file.lastModified || index}`}
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

              {submissionError && (
                <Alert severity="error" sx={{ mt: 3 }}>
                  {submissionError}
                </Alert>
              )}
            </Box>
          )}

          {/* Navigation buttons */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'space-between', mt: 4 }}>
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

      {isMobile && !success && (
        <Box
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1300,
            p: 1,
            pb: 'calc(8px + env(safe-area-inset-bottom, 0px))',
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'grid',
            gridTemplateColumns: '1fr 1.2fr',
            gap: 1,
          }}
        >
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={activeStep === 0 || submitting}
            sx={{ minHeight: 44 }}
          >
            Back
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              endIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
              sx={{ minHeight: 44, fontWeight: 700 }}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext} sx={{ minHeight: 44, fontWeight: 700 }}>
              Next
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}

export default JobApplication;

