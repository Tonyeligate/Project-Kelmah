import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Avatar,
  Button,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Skeleton,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  CheckCircle as CompleteIcon,
  Schedule as ScheduleIcon,
  AttachMoney as PaymentIcon,
  Message as MessageIcon,
  Star as StarIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  fetchHirerJobs,
  selectHirerJobs,
  selectHirerLoading,
} from '../services/hirerSlice';

// No mock data - using real API data only

const JobProgressTracker = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();

  const [selectedJob, setSelectedJob] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Redux selectors
  const activeJobs = useSelector(selectHirerJobs('active'));
  const loading = useSelector(selectHirerLoading('jobs'));

  useEffect(() => {
    dispatch(fetchHirerJobs('active'));
  }, [dispatch]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: "GHS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleDialogOpen = (type, job) => {
    setDialogType(type);
    setSelectedJob(job);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogType(null);
    setSelectedJob(null);
    setPaymentAmount('');
    setReviewRating(5);
    setReviewComment('');
  };

  const handlePaymentRelease = () => {
    // Mock payment release
    console.log(
      `Releasing payment of ${paymentAmount} for job ${selectedJob.id}`,
    );
    handleDialogClose();
  };

  const handleReviewSubmit = () => {
    // Mock review submission
    console.log(`Submitting review for worker ${selectedJob.worker.id}:`, {
      rating: reviewRating,
      comment: reviewComment,
    });
    handleDialogClose();
  };

  // Build progress model from active jobs
  const jobsWithProgress = Array.isArray(activeJobs)
    ? activeJobs.map((job) => ({
        id: job.id || job._id,
        title: job.title || 'Untitled Job',
        worker: {
          id: job.worker?.id || job.workerId || 'unknown',
          name: job.worker?.name || job.workerName || 'Assigned Worker',
          avatar: job.worker?.avatar || job.workerAvatar || '',
          rating: job.worker?.rating || 0,
          completedJobs: job.worker?.completedJobs || 0,
        },
        status: job.status || 'in_progress',
        progress: job.progress || 0,
        startDate: job.startDate || job.createdAt || Date.now(),
        expectedCompletion: job.expectedCompletion || job.dueDate || Date.now(),
        budget: job.budget || 0,
        paidAmount: job.paidAmount || 0,
        remainingAmount:
          (job.budget || 0) - (job.paidAmount || 0) > 0
            ? (job.budget || 0) - (job.paidAmount || 0)
            : 0,
        milestones: Array.isArray(job.milestones)
          ? job.milestones.map((m) => ({
              id: m.id || m._id,
              title: m.title || 'Milestone',
              description: m.description || '',
              amount: m.amount || 0,
              status: m.status || 'pending',
              expectedDate: m.expectedDate || job.dueDate || Date.now(),
              completedDate: m.completedDate || null,
              paid: Boolean(m.paid),
            }))
          : [],
        recentUpdates: Array.isArray(job.updates) ? job.updates : [],
      }))
    : [];

  if (loading) {
    return (
      <Box>
        {[...Array(2)].map((_, i) => (
          <Card key={i} sx={{ mb: 3 }}>
            <CardContent>
              <Skeleton variant="text" height={40} width="60%" sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
              <Skeleton variant="text" height={30} width="40%" />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  if (jobsWithProgress.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box textAlign="center" py={4}>
            <ScheduleIcon
              sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary">
              No active jobs in progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your active job progress will appear here
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {jobsWithProgress.map((job) => (
        <Card key={job.id} sx={{ mb: 3, overflow: 'visible' }}>
          <CardContent>
            {/* Job Header */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="flex-start"
              mb={3}
            >
              <Box flex={1}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {job.title}
                </Typography>
                <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar
                      src={job.worker.avatar}
                      sx={{ width: 32, height: 32 }}
                    >
                      {job.worker.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {job.worker.name}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <StarIcon sx={{ fontSize: 16, color: 'gold' }} />
                        <Typography variant="caption">
                          {job.worker.rating} ({job.worker.completedJobs} jobs)
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Chip
                    label={job.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(job.status)}
                    size="small"
                  />
                </Box>
              </Box>
              <Box display="flex" gap={1}>
                <IconButton
                  size="small"
                  onClick={() => handleDialogOpen('view', job)}
                >
                  <ViewIcon />
                </IconButton>
                <IconButton size="small">
                  <MessageIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Progress Overview */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={8}>
                <Box mb={2}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      Overall Progress
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {job.progress}% Complete
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={job.progress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        background:
                          job.progress >= 75
                            ? 'linear-gradient(90deg, #4caf50, #66bb6a)'
                            : job.progress >= 50
                              ? 'linear-gradient(90deg, #2196f3, #42a5f5)'
                              : 'linear-gradient(90deg, #ff9800, #ffb74d)',
                      },
                    }}
                  />
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Started: {formatDate(job.startDate)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Expected: {formatDate(job.expectedCompletion)}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box
                  p={2}
                  bgcolor="primary.50"
                  borderRadius={2}
                  border={1}
                  borderColor="primary.200"
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Budget Overview
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    color="primary.main"
                  >
                    {formatCurrency(job.budget)}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" mt={1}>
                    <Typography variant="caption" color="success.main">
                      Paid: {formatCurrency(job.paidAmount)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Remaining: {formatCurrency(job.remainingAmount)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Milestones */}
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Milestones
            </Typography>
            <List dense>
              {job.milestones.map((milestone, index) => (
                <ListItem key={milestone.id} sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor:
                          milestone.status === 'completed'
                            ? 'success.main'
                            : milestone.status === 'in_progress'
                              ? 'primary.main'
                              : 'grey.400',
                      }}
                    >
                      {milestone.status === 'completed' ? (
                        <CompleteIcon sx={{ fontSize: 20 }} />
                      ) : milestone.status === 'in_progress' ? (
                        <StartIcon sx={{ fontSize: 20 }} />
                      ) : (
                        <ScheduleIcon sx={{ fontSize: 20 }} />
                      )}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight="bold">
                        {milestone.title}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {milestone.description}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {milestone.status === 'completed'
                            ? `Completed: ${formatDate(milestone.completedDate)}`
                            : `Expected: ${formatDate(milestone.expectedDate)}`}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box textAlign="right">
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(milestone.amount)}
                      </Typography>
                      {milestone.status === 'completed' && !milestone.paid && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<PaymentIcon />}
                          onClick={() =>
                            handleDialogOpen('payment', {
                              ...job,
                              selectedMilestone: milestone,
                            })
                          }
                        >
                          Release Payment
                        </Button>
                      )}
                      {milestone.paid && (
                        <Chip label="Paid" size="small" color="success" />
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>

            {/* Recent Updates */}
            {job.recentUpdates.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Recent Updates
                </Typography>
                {job.recentUpdates.slice(0, 2).map((update) => (
                  <Box key={update.id} mb={1}>
                    <Typography variant="body2">{update.message}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(update.timestamp).toLocaleString('en-GH')}
                    </Typography>
                  </Box>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Payment Dialog */}
      <Dialog
        open={dialogOpen && dialogType === 'payment'}
        onClose={handleDialogClose}
      >
        <DialogTitle>Release Milestone Payment</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Release payment for: {selectedJob?.selectedMilestone?.title}
          </Typography>
          <TextField
            fullWidth
            label="Payment Amount"
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            sx={{ mt: 2 }}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>GH₵</Typography>,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handlePaymentRelease} variant="contained">
            Release Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog
        open={dialogOpen && dialogType === 'review'}
        onClose={handleDialogClose}
      >
        <DialogTitle>Review Worker</DialogTitle>
        <DialogContent>
          <Box textAlign="center" mb={2}>
            <Avatar
              src={selectedJob?.worker?.avatar}
              sx={{ width: 64, height: 64, mx: 'auto', mb: 1 }}
            >
              {selectedJob?.worker?.name?.charAt(0)}
            </Avatar>
            <Typography variant="h6">{selectedJob?.worker?.name}</Typography>
          </Box>
          <Box textAlign="center" mb={2}>
            <Typography gutterBottom>Rate this worker:</Typography>
            <Rating
              value={reviewRating}
              onChange={(e, newValue) => setReviewRating(newValue)}
              size="large"
            />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Review Comments"
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Share your experience working with this professional..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleReviewSubmit} variant="contained">
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobProgressTracker;
