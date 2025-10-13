import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Divider,
  Alert,
  Skeleton,
  LinearProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Star as StarIcon,
  ThumbUp as ThumbUpIcon,
  Work as WorkIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { userServiceClient } from '../../common/services/axios';

// Use centralized client

// No mock data - using real API data only

const WorkerReview = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    communication: 5,
    quality: 5,
    deadline: 5,
    professionalism: 5,
    comment: '',
    recommend: 'yes',
  });

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      // Try to fetch from user service, fall back to mock data
      const response = await userServiceClient.get(
        '/users/workers/completed-jobs',
      );
      setWorkers(response.data || []);
      setError(null);
    } catch (err) {
      console.warn('User service unavailable for worker reviews:', err.message);
      setWorkers([]);
      setError('Unable to fetch worker reviews. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
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

  const handleMenuOpen = (event, worker, job = null) => {
    setAnchorEl(event.currentTarget);
    setSelectedWorker(worker);
    setSelectedJob(job);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedWorker(null);
    setSelectedJob(null);
  };

  const handleDialogOpen = (type) => {
    setDialogType(type);
    setDialogOpen(true);
    handleMenuClose();
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogType(null);
    setSelectedWorker(null);
    setSelectedJob(null);
    setReviewForm({
      rating: 5,
      communication: 5,
      quality: 5,
      deadline: 5,
      professionalism: 5,
      comment: '',
      recommend: 'yes',
    });
  };

  const handleReviewSubmit = async () => {
    if (selectedWorker && selectedJob) {
      try {
        // Mock review submission
        console.log(
          'Submitting review for worker:',
          selectedWorker.id,
          'job:',
          selectedJob.id,
          reviewForm,
        );

        // Update local state
        setWorkers((prev) =>
          prev.map((worker) =>
            worker.id === selectedWorker.id
              ? {
                  ...worker,
                  completedJobs: worker.completedJobs.map((job) =>
                    job.id === selectedJob.id
                      ? {
                          ...job,
                          review: {
                            ...reviewForm,
                            reviewDate: new Date(),
                          },
                        }
                      : job,
                  ),
                }
              : worker,
          ),
        );

        handleDialogClose();
      } catch (error) {
        console.error('Error submitting review:', error);
        setError('Failed to submit review');
      }
    }
  };

  // Get all completed jobs for table display
  const getAllCompletedJobs = () => {
    const allJobs = [];
    workers.forEach((worker) => {
      worker.completedJobs.forEach((job) => {
        allJobs.push({
          ...job,
          worker: {
            id: worker.id,
            name: worker.name,
            avatar: worker.avatar,
            rating: worker.overallRating,
            skills: worker.skills,
            location: worker.location,
          },
        });
      });
    });
    return allJobs.sort(
      (a, b) => new Date(b.completedDate) - new Date(a.completedDate),
    );
  };

  const allJobs = getAllCompletedJobs();
  const pendingReviews = allJobs.filter((job) => !job.review);
  const completedReviews = allJobs.filter((job) => job.review);

  // Statistics
  const reviewStats = {
    totalJobs: allJobs.length,
    pendingReviews: pendingReviews.length,
    completedReviews: completedReviews.length,
    averageRating:
      completedReviews.length > 0
        ? (
            completedReviews.reduce((sum, job) => sum + job.review.rating, 0) /
            completedReviews.length
          ).toFixed(1)
        : 0,
    totalSpent: allJobs.reduce((sum, job) => sum + job.amount, 0),
  };

  if (loading) {
    return (
      <Box>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[...Array(4)].map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={120} animation="wave" />
            </Grid>
          ))}
        </Grid>
        <Card>
          <CardContent>
            <Skeleton variant="text" height={40} width="40%" sx={{ mb: 2 }} />
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} variant="text" height={60} sx={{ mb: 1 }} />
            ))}
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Review Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              height: '100%',
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {reviewStats.totalJobs}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Completed Jobs
                  </Typography>
                </Box>
                <WorkIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              height: '100%',
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {reviewStats.pendingReviews}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Pending Reviews
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              height: '100%',
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(reviewStats.totalSpent)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Spent
                  </Typography>
                </Box>
                <MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              height: '100%',
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {reviewStats.averageRating}
                    <StarIcon sx={{ fontSize: 32, ml: 0.5, opacity: 0.9 }} />
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Average Rating
                  </Typography>
                </Box>
                <ThumbUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Jobs and Reviews Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Completed Jobs & Reviews ({allJobs.length})
          </Typography>

          {allJobs.length === 0 ? (
            <Box textAlign="center" py={4}>
              <WorkIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No completed jobs yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed jobs will appear here for review
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Worker & Job</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Amount</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Duration</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Completed</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Review Status</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Rating</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Actions</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allJobs.map((job) => (
                    <TableRow key={job.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar
                            src={job.worker.avatar}
                            sx={{ width: 40, height: 40 }}
                          >
                            {job.worker.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {job.worker.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                            >
                              {job.title}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {job.worker.location}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          color="primary.main"
                        >
                          {formatCurrency(job.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{job.duration}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(job.completedDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {job.review ? (
                          <Chip label="Reviewed" color="success" size="small" />
                        ) : (
                          <Chip
                            label="Pending Review"
                            color="warning"
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {job.review ? (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <StarIcon sx={{ fontSize: 16, color: 'gold' }} />
                            <Typography variant="body2">
                              {job.review.rating}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Not rated
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, job.worker, job)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleDialogOpen('view')}>
          <ViewIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        {selectedJob && !selectedJob.review && (
          <MenuItem onClick={() => handleDialogOpen('review')}>
            <EditIcon sx={{ mr: 1 }} />
            Write Review
          </MenuItem>
        )}
        {selectedJob && selectedJob.review && (
          <MenuItem onClick={() => handleDialogOpen('edit_review')}>
            <EditIcon sx={{ mr: 1 }} />
            Edit Review
          </MenuItem>
        )}
      </Menu>

      {/* Job Details Dialog */}
      <Dialog
        open={dialogOpen && dialogType === 'view'}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Job Details</DialogTitle>
        <DialogContent>
          {selectedJob && selectedWorker && (
            <Box>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Avatar
                  src={selectedWorker.avatar}
                  sx={{ width: 64, height: 64 }}
                >
                  {selectedWorker.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedWorker.name}</Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <StarIcon sx={{ fontSize: 16, color: 'gold' }} />
                    <Typography variant="body2">
                      {selectedWorker.rating}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {selectedWorker.location}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {selectedJob.title}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Amount: {formatCurrency(selectedJob.amount)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Duration: {selectedJob.duration}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Completed: {formatDate(selectedJob.completedDate)}
                  </Typography>
                </Grid>
              </Grid>

              {selectedJob.review && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                  >
                    Your Review
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Rating
                      value={selectedJob.review.rating}
                      readOnly
                      size="small"
                    />
                    <Typography variant="body2">
                      ({selectedJob.review.rating}/5)
                    </Typography>
                  </Box>
                  <Typography variant="body2" paragraph>
                    {selectedJob.review.comment}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Reviewed on {formatDate(selectedJob.review.reviewDate)}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Close</Button>
          {selectedJob && !selectedJob.review && (
            <Button
              onClick={() => handleDialogOpen('review')}
              variant="contained"
            >
              Write Review
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog
        open={
          dialogOpen &&
          (dialogType === 'review' || dialogType === 'edit_review')
        }
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogType === 'edit_review' ? 'Edit Review' : 'Write Review'}
        </DialogTitle>
        <DialogContent>
          {selectedWorker && selectedJob && (
            <Box>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Avatar src={selectedWorker.avatar}>
                  {selectedWorker.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedWorker.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedJob.title}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                  >
                    Overall Rating
                  </Typography>
                  <Rating
                    value={reviewForm.rating}
                    onChange={(e, newValue) =>
                      setReviewForm({ ...reviewForm, rating: newValue })
                    }
                    size="large"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" gutterBottom>
                    Communication
                  </Typography>
                  <Rating
                    value={reviewForm.communication}
                    onChange={(e, newValue) =>
                      setReviewForm({ ...reviewForm, communication: newValue })
                    }
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" gutterBottom>
                    Quality of Work
                  </Typography>
                  <Rating
                    value={reviewForm.quality}
                    onChange={(e, newValue) =>
                      setReviewForm({ ...reviewForm, quality: newValue })
                    }
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" gutterBottom>
                    Met Deadlines
                  </Typography>
                  <Rating
                    value={reviewForm.deadline}
                    onChange={(e, newValue) =>
                      setReviewForm({ ...reviewForm, deadline: newValue })
                    }
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" gutterBottom>
                    Professionalism
                  </Typography>
                  <Rating
                    value={reviewForm.professionalism}
                    onChange={(e, newValue) =>
                      setReviewForm({
                        ...reviewForm,
                        professionalism: newValue,
                      })
                    }
                    size="small"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Review Comments"
                    value={reviewForm.comment}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, comment: e.target.value })
                    }
                    placeholder="Share your experience working with this professional..."
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" gutterBottom>
                    Would you recommend this worker?
                  </Typography>
                  <Box display="flex" gap={2}>
                    <Button
                      variant={
                        reviewForm.recommend === 'yes'
                          ? 'contained'
                          : 'outlined'
                      }
                      onClick={() =>
                        setReviewForm({ ...reviewForm, recommend: 'yes' })
                      }
                      color="success"
                    >
                      Yes
                    </Button>
                    <Button
                      variant={
                        reviewForm.recommend === 'no' ? 'contained' : 'outlined'
                      }
                      onClick={() =>
                        setReviewForm({ ...reviewForm, recommend: 'no' })
                      }
                      color="error"
                    >
                      No
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleReviewSubmit} variant="contained">
            {dialogType === 'edit_review' ? 'Update Review' : 'Submit Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkerReview;
