import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { normalizeUser } from '../../../utils/userUtils';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Work as WorkIcon,
  Description as DescriptionIcon,
  AttachMoney as AttachMoneyIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

const JobApplication = () => {
  // FIXED: Use standardized user normalization for consistent user data access
  const { user: rawUser } = useSelector((state) => state.auth);
  const user = normalizeUser(rawUser);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    proposedBudget: '',
    estimatedTime: '',
    availability: '',
    additionalNotes: '',
  });
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  useEffect(() => {
    fetchAvailableJobs();
  }, []);

  const fetchAvailableJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/jobs/available');
      const data = await response.json();
      setAvailableJobs(data);
      setError(null);
    } catch (err) {
      setError('Failed to load available jobs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStepChange = (step) => {
    setActiveStep(step);
  };

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    setActiveStep(1);
  };

  const handleInputChange = (field) => (event) => {
    setApplicationData({
      ...applicationData,
      [field]: event.target.value,
    });
  };

  const handlePreview = () => {
    setPreviewDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: selectedJob.id,
          workerId: user.id,
          ...applicationData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      // Reset form and go back to job selection
      setSelectedJob(null);
      setApplicationData({
        coverLetter: '',
        proposedBudget: '',
        estimatedTime: '',
        availability: '',
        additionalNotes: '',
      });
      setActiveStep(0);
      setError(null);
    } catch (err) {
      setError('Failed to submit application');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderJobCard = (job) => (
    <Card
      key={job.id}
      sx={{ mb: 2, cursor: 'pointer' }}
      onClick={() => handleJobSelect(job)}
    >
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h6">{job.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {job.hirerName}
            </Typography>
          </Box>
          <Chip
            label={`$${job.budget}`}
            color="primary"
            size="small"
            icon={<AttachMoneyIcon />}
          />
        </Box>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Posted
            </Typography>
            <Typography variant="body1">
              {format(new Date(job.postedAt), 'MMM dd, yyyy')}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Deadline
            </Typography>
            <Typography variant="body1">
              {format(new Date(job.deadline), 'MMM dd, yyyy')}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Description
            </Typography>
            <Typography variant="body1">{job.description}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {job.requiredSkills.map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const steps = [
    {
      label: 'Select Job',
      content: (
        <Box>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : availableJobs.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No available jobs found
              </Typography>
            </Paper>
          ) : (
            <Box>{availableJobs.map(renderJobCard)}</Box>
          )}
        </Box>
      ),
    },
    {
      label: 'Submit Proposal',
      content: (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cover Letter"
                multiline
                rows={6}
                value={applicationData.coverLetter}
                onChange={handleInputChange('coverLetter')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Proposed Budget"
                type="number"
                value={applicationData.proposedBudget}
                onChange={handleInputChange('proposedBudget')}
                InputProps={{
                  startAdornment: (
                    <AttachMoneyIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  ),
                }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estimated Time"
                value={applicationData.estimatedTime}
                onChange={handleInputChange('estimatedTime')}
                InputProps={{
                  startAdornment: (
                    <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  ),
                }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Availability"
                value={applicationData.availability}
                onChange={handleInputChange('availability')}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes"
                multiline
                rows={4}
                value={applicationData.additionalNotes}
                onChange={handleInputChange('additionalNotes')}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => setActiveStep(0)}
                  startIcon={<CloseIcon />}
                >
                  Cancel
                </Button>
                <Button
                  variant="outlined"
                  onClick={handlePreview}
                  startIcon={<DescriptionIcon />}
                >
                  Preview
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  startIcon={<SendIcon />}
                  disabled={loading}
                >
                  Submit Application
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Job Applications
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
              <StepContent>{step.content}</StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Application Preview</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedJob?.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {selectedJob?.hirerName}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Cover Letter
            </Typography>
            <Typography variant="body1" paragraph>
              {applicationData.coverLetter}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">Proposed Budget</Typography>
                <Typography variant="body1">
                  ${applicationData.proposedBudget}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">Estimated Time</Typography>
                <Typography variant="body1">
                  {applicationData.estimatedTime}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Availability</Typography>
                <Typography variant="body1">
                  {applicationData.availability}
                </Typography>
              </Grid>
              {applicationData.additionalNotes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Additional Notes</Typography>
                  <Typography variant="body1">
                    {applicationData.additionalNotes}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobApplication;
