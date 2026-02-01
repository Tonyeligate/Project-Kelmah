/**
 * QuickJobTrackingPage - Real-time job tracking for workers
 * Shows job status, GPS verification, completion flow
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Avatar,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  Divider,
  Paper
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
  Navigation as NavigationIcon,
  Check as CheckIcon,
  PhotoCamera as PhotoCameraIcon,
  Phone as PhoneIcon,
  Message as MessageIcon,
  Close as CloseIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import {
  SERVICE_CATEGORIES,
  getQuickJob,
  markOnWay,
  markArrived,
  startWork,
  markComplete,
  cancelQuickJob,
  getCurrentLocation,
  formatCurrency
} from '../services/quickJobService';

// Job status steps for worker
const workerSteps = [
  { status: 'funded', label: 'Payment Received', description: 'Client has paid. Start heading to the location.' },
  { status: 'worker_on_way', label: 'On My Way', description: 'Client knows you\'re coming.' },
  { status: 'worker_arrived', label: 'Arrived', description: 'GPS verified your arrival.' },
  { status: 'in_progress', label: 'Working', description: 'Complete the work.' },
  { status: 'completed', label: 'Done!', description: 'Waiting for client approval.' }
];

const QuickJobTrackingPage = () => {
  const theme = useTheme();
  const { jobId } = useParams();
  const navigate = useNavigate();

  // State
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  
  // Completion flow
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [completionPhotos, setCompletionPhotos] = useState([]);
  const [completionNote, setCompletionNote] = useState('');
  
  // Cancellation
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Fetch job data
  const fetchJob = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getQuickJob(jobId);
      if (result.success) {
        setJob(result.data);
      } else {
        setError(result.error?.message || 'Failed to load job');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchJob, 30000);
    return () => clearInterval(interval);
  }, [fetchJob]);

  // Get current step index
  const getCurrentStepIndex = () => {
    if (!job) return 0;
    const index = workerSteps.findIndex(s => s.status === job.status);
    return index >= 0 ? index : 0;
  };

  // Handle marking on way
  const handleMarkOnWay = async () => {
    setActionLoading(true);
    setLocationLoading(true);
    try {
      const pos = await getCurrentLocation();
      const result = await markOnWay(jobId, pos.latitude, pos.longitude);
      if (result.success) {
        fetchJob();
      } else {
        setError(result.error?.message || 'Failed to update status');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
      setLocationLoading(false);
    }
  };

  // Handle marking arrived
  const handleMarkArrived = async () => {
    setActionLoading(true);
    setLocationLoading(true);
    try {
      const pos = await getCurrentLocation();
      const result = await markArrived(jobId, pos.latitude, pos.longitude);
      if (result.success) {
        fetchJob();
        if (!result.data.gpsVerified) {
          setError(`GPS shows you're ${result.data.distance}m from the job location. This has been noted.`);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to verify arrival');
    } finally {
      setActionLoading(false);
      setLocationLoading(false);
    }
  };

  // Handle starting work
  const handleStartWork = async () => {
    setActionLoading(true);
    try {
      const result = await startWork(jobId);
      if (result.success) {
        fetchJob();
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to start work');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle photo upload for completion
  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files);
    const newPhotos = files.slice(0, 5 - completionPhotos.length).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      url: file.name // Temporary - would upload to storage
    }));
    setCompletionPhotos(prev => [...prev, ...newPhotos].slice(0, 5));
  };

  // Handle marking complete
  const handleMarkComplete = async () => {
    if (completionPhotos.length === 0) {
      setError('Please add at least one photo of the completed work');
      return;
    }

    setActionLoading(true);
    try {
      const pos = await getCurrentLocation();
      const photos = completionPhotos.map(p => ({ url: p.preview }));
      
      const result = await markComplete(
        jobId,
        photos,
        completionNote,
        pos.latitude,
        pos.longitude
      );

      if (result.success) {
        setCompletionDialogOpen(false);
        fetchJob();
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to mark complete');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle cancellation
  const handleCancel = async () => {
    setActionLoading(true);
    try {
      const result = await cancelQuickJob(jobId, cancelReason);
      if (result.success) {
        setCancelDialogOpen(false);
        navigate('/worker/quick-jobs');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to cancel job');
    } finally {
      setActionLoading(false);
    }
  };

  // Open maps for navigation
  const openMaps = () => {
    if (!job?.location?.coordinates) return;
    const [lng, lat] = job.location.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  // Get category details
  const getCategory = () => {
    if (!job) return null;
    return SERVICE_CATEGORIES.find(c => c.id === job.category);
  };

  // Loading state
  if (loading && !job) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading job details...</Typography>
      </Container>
    );
  }

  // Error state
  if (error && !job) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Go Back</Button>
      </Container>
    );
  }

  const category = getCategory();
  const currentStep = getCurrentStepIndex();
  const canCancel = ['funded', 'worker_on_way'].includes(job?.status);

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight="bold">
          Job Tracking
        </Typography>
      </Box>

      {/* Error alert */}
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Job Card */}
      {job && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              {/* Category & Status */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main + '20' }}>
                    <Typography>{category?.icon || '📋'}</Typography>
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="600">
                      {category?.name || 'Service'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatCurrency(job.escrow?.workerPayout || 0)} payout
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={job.status?.replace(/_/g, ' ')}
                  color={job.status === 'completed' ? 'success' : 'primary'}
                  size="small"
                />
              </Box>

              {/* Description */}
              <Typography variant="body2" sx={{ mb: 2, bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                "{job.description}"
              </Typography>

              {/* Client info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar src={job.client?.profilePicture}>
                  {job.client?.firstName?.[0]}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2">
                    {job.client?.firstName} {job.client?.lastName?.[0]}.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Client
                  </Typography>
                </Box>
                
                {/* Contact buttons */}
                {job.client?.phoneNumber && (
                  <IconButton 
                    color="primary"
                    onClick={() => window.open(`tel:${job.client.phoneNumber}`, '_self')}
                  >
                    <PhoneIcon />
                  </IconButton>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Location with navigation */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocationIcon color="action" fontSize="small" />
                <Typography variant="body2">
                  {job.location?.address}
                </Typography>
              </Box>
              {job.location?.landmark && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                  Landmark: {job.location.landmark}
                </Typography>
              )}
              
              <Button
                variant="outlined"
                startIcon={<NavigationIcon />}
                onClick={openMaps}
                fullWidth
                sx={{ mt: 2 }}
              >
                Navigate to Location
              </Button>
            </CardContent>
          </Card>

          {/* Progress Stepper */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Progress
            </Typography>
            <Stepper activeStep={currentStep} orientation="vertical">
              {workerSteps.map((step, index) => (
                <Step key={step.status} completed={currentStep > index}>
                  <StepLabel
                    optional={
                      index === currentStep && (
                        <Typography variant="caption" color="text.secondary">
                          {step.description}
                        </Typography>
                      )
                    }
                  >
                    {step.label}
                  </StepLabel>
                  <StepContent>
                    {/* Action buttons based on current step */}
                    {step.status === 'funded' && (
                      <Button
                        variant="contained"
                        onClick={handleMarkOnWay}
                        disabled={actionLoading}
                        startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <NavigationIcon />}
                      >
                        {actionLoading ? 'Updating...' : 'I\'m On My Way'}
                      </Button>
                    )}
                    
                    {step.status === 'worker_on_way' && (
                      <Button
                        variant="contained"
                        onClick={handleMarkArrived}
                        disabled={actionLoading}
                        startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <LocationIcon />}
                      >
                        {actionLoading ? 'Verifying...' : 'I\'ve Arrived'}
                      </Button>
                    )}
                    
                    {step.status === 'worker_arrived' && (
                      <Button
                        variant="contained"
                        onClick={handleStartWork}
                        disabled={actionLoading}
                        color="success"
                      >
                        {actionLoading ? 'Starting...' : 'Start Work'}
                      </Button>
                    )}
                    
                    {step.status === 'in_progress' && (
                      <Button
                        variant="contained"
                        onClick={() => setCompletionDialogOpen(true)}
                        disabled={actionLoading}
                        color="success"
                        startIcon={<CheckIcon />}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Paper>

          {/* Payment info */}
          {job.status === 'completed' && (
            <Alert severity="info" icon={<CheckIcon />}>
              <Typography variant="subtitle2">Work marked complete!</Typography>
              <Typography variant="body2">
                Payment of {formatCurrency(job.escrow?.workerPayout || 0)} will be released once the client approves.
                Auto-release in 24 hours if no response.
              </Typography>
            </Alert>
          )}

          {job.status === 'approved' && (
            <Alert severity="success" icon={<CheckIcon />}>
              <Typography variant="subtitle2">Payment Released! 🎉</Typography>
              <Typography variant="body2">
                {formatCurrency(job.escrow?.workerPayout || 0)} has been sent to your account.
              </Typography>
            </Alert>
          )}

          {/* Cancel button */}
          {canCancel && (
            <Button
              variant="text"
              color="error"
              onClick={() => setCancelDialogOpen(true)}
              sx={{ mt: 2 }}
              fullWidth
            >
              Cancel Job
            </Button>
          )}
        </>
      )}

      {/* Completion Dialog */}
      <Dialog open={completionDialogOpen} onClose={() => setCompletionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Mark Work Complete
            <IconButton onClick={() => setCompletionDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Take photos of the completed work. This protects you in case of disputes.
          </Typography>

          {/* Photo upload */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {completionPhotos.map((photo, index) => (
              <Box key={index} sx={{ position: 'relative' }}>
                <Avatar
                  src={photo.preview}
                  variant="rounded"
                  sx={{ width: 80, height: 80 }}
                />
                <IconButton
                  size="small"
                  onClick={() => setCompletionPhotos(prev => prev.filter((_, i) => i !== index))}
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    bgcolor: 'error.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'error.dark' }
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            
            {completionPhotos.length < 5 && (
              <Button
                variant="outlined"
                component="label"
                sx={{ width: 80, height: 80, borderStyle: 'dashed' }}
              >
                <PhotoCameraIcon />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handlePhotoUpload}
                />
              </Button>
            )}
          </Box>

          {completionPhotos.length === 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              At least one photo is required
            </Alert>
          )}

          {/* Note */}
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Notes (optional)"
            placeholder="Any notes about the completed work..."
            value={completionNote}
            onChange={(e) => setCompletionNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCompletionDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleMarkComplete}
            disabled={actionLoading || completionPhotos.length === 0}
            startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
          >
            {actionLoading ? 'Submitting...' : 'Submit & Complete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            Cancel Job
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Are you sure you want to cancel this job? This may affect your reputation.
          </Typography>
          <TextField
            fullWidth
            label="Reason (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Keep Job</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancel}
            disabled={actionLoading}
          >
            {actionLoading ? 'Cancelling...' : 'Cancel Job'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QuickJobTrackingPage;
