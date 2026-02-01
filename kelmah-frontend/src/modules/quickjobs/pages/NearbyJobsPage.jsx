/**
 * NearbyJobsPage - Worker View for Quick Jobs
 * Shows jobs near the worker's location that they can quote on
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Button,
  Chip,
  Avatar,
  IconButton,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Badge,
  useTheme,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Skeleton
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Navigation as NavigationIcon,
  Send as SendIcon,
  Close as CloseIcon,
  MyLocation as MyLocationIcon
} from '@mui/icons-material';
import {
  SERVICE_CATEGORIES,
  URGENCY_LEVELS,
  getNearbyQuickJobs,
  submitQuote,
  getCurrentLocation,
  formatCurrency,
  calculateFees
} from '../services/quickJobService';

const NearbyJobsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // State
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [maxDistance, setMaxDistance] = useState(10);
  const [selectedJob, setSelectedJob] = useState(null);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quoteAvailableAt, setQuoteAvailableAt] = useState('today');
  const [quoteEstimatedDuration, setQuoteEstimatedDuration] = useState('half_day');
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState(false);

  // Get worker's location
  const getLocation = useCallback(async () => {
    try {
      setLocationError('');
      const pos = await getCurrentLocation();
      setLocation(pos);
      return pos;
    } catch (err) {
      setLocationError(err.message);
      return null;
    }
  }, []);

  // Fetch nearby jobs
  const fetchJobs = useCallback(async (pos = location) => {
    if (!pos) return;
    
    setLoading(true);
    setError('');

    try {
      const result = await getNearbyQuickJobs(
        pos.longitude,
        pos.latitude,
        maxDistance,
        categoryFilter || null
      );

      if (result.success) {
        setJobs(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch jobs');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [location, maxDistance, categoryFilter]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      const pos = await getLocation();
      if (pos) {
        await fetchJobs(pos);
      }
    };
    init();
  }, []);

  // Refresh when filters change
  useEffect(() => {
    if (location) {
      fetchJobs();
    }
  }, [maxDistance, categoryFilter]);

  // Handle quote submission
  const handleSubmitQuote = async () => {
    if (!selectedJob || !quoteAmount || parseFloat(quoteAmount) < 25) {
      return;
    }

    setQuoteSubmitting(true);

    try {
      const result = await submitQuote(selectedJob._id, {
        amount: parseFloat(quoteAmount),
        message: quoteMessage,
        availableAt: quoteAvailableAt,
        estimatedDuration: quoteEstimatedDuration
      });

      if (result.success) {
        setQuoteSuccess(true);
        // Remove job from list (they've already quoted)
        setJobs(prev => prev.filter(j => j._id !== selectedJob._id));
        
        setTimeout(() => {
          setQuoteDialogOpen(false);
          setQuoteSuccess(false);
          setSelectedJob(null);
          resetQuoteForm();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to submit quote');
    } finally {
      setQuoteSubmitting(false);
    }
  };

  // Reset quote form
  const resetQuoteForm = () => {
    setQuoteAmount('');
    setQuoteMessage('');
    setQuoteAvailableAt('today');
    setQuoteEstimatedDuration('half_day');
  };

  // Open quote dialog
  const openQuoteDialog = (job) => {
    setSelectedJob(job);
    setQuoteDialogOpen(true);
  };

  // Get urgency color
  const getUrgencyColor = (urgency) => {
    const level = URGENCY_LEVELS.find(l => l.id === urgency);
    return level?.color || 'default';
  };

  // Get time ago string
  const getTimeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  // Get category icon
  const getCategoryIcon = (categoryId) => {
    const cat = SERVICE_CATEGORIES.find(c => c.id === categoryId);
    return cat?.icon || '📋';
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Jobs Near You
        </Typography>
        <IconButton onClick={() => fetchJobs()} disabled={loading || !location}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Location status */}
      {locationError && (
        <Alert 
          severity="warning" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={getLocation}>
              Retry
            </Button>
          }
        >
          {locationError}
        </Alert>
      )}

      {location && (
        <Chip
          icon={<MyLocationIcon />}
          label={`Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
          variant="outlined"
          size="small"
          sx={{ mb: 2 }}
        />
      )}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Category"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="">All Categories</MenuItem>
            {SERVICE_CATEGORIES.map(cat => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Distance</InputLabel>
          <Select
            value={maxDistance}
            label="Distance"
            onChange={(e) => setMaxDistance(e.target.value)}
          >
            <MenuItem value={5}>5 km</MenuItem>
            <MenuItem value={10}>10 km</MenuItem>
            <MenuItem value={15}>15 km</MenuItem>
            <MenuItem value={20}>20 km</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Loading skeletons */}
      {loading && (
        <Grid container spacing={2}>
          {[1, 2, 3].map(i => (
            <Grid item xs={12} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="100%" />
                  <Skeleton variant="text" width="80%" />
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Skeleton variant="rounded" width={80} height={24} />
                    <Skeleton variant="rounded" width={80} height={24} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Error message */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Empty state */}
      {!loading && !error && jobs.length === 0 && (
        <Box textAlign="center" py={6}>
          <Typography variant="h1" sx={{ mb: 2 }}>📭</Typography>
          <Typography variant="h6" gutterBottom>
            No jobs nearby right now
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Check back later or expand your search radius
          </Typography>
          <Button variant="outlined" onClick={() => setMaxDistance(20)}>
            Search within 20km
          </Button>
        </Box>
      )}

      {/* Jobs list */}
      {!loading && jobs.length > 0 && (
        <Grid container spacing={2}>
          {jobs.map(job => (
            <Grid item xs={12} key={job._id}>
              <Card
                sx={{
                  borderLeft: `4px solid ${theme.palette[getUrgencyColor(job.urgency)]?.main || theme.palette.primary.main}`,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateX(4px)',
                    boxShadow: 2
                  }
                }}
              >
                <CardContent>
                  {/* Header: Category & Time */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main + '20', width: 40, height: 40 }}>
                        <Typography>{getCategoryIcon(job.category)}</Typography>
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="600">
                          {SERVICE_CATEGORIES.find(c => c.id === job.category)?.name || 'General'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {getTimeAgo(job.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={URGENCY_LEVELS.find(l => l.id === job.urgency)?.name || 'Soon'}
                      color={getUrgencyColor(job.urgency)}
                      size="small"
                    />
                  </Box>

                  {/* Description */}
                  <Typography variant="body2" sx={{ mb: 2, minHeight: 40 }}>
                    "{job.description}"
                  </Typography>

                  {/* Location */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 1 }}>
                    <LocationIcon fontSize="small" />
                    <Typography variant="body2">
                      {job.location?.address}, {job.location?.city}
                    </Typography>
                  </Box>

                  {/* Photos preview */}
                  {job.photos?.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      {job.photos.slice(0, 3).map((photo, i) => (
                        <Avatar
                          key={i}
                          src={photo.url}
                          variant="rounded"
                          sx={{ width: 50, height: 50 }}
                        />
                      ))}
                      {job.photos.length > 3 && (
                        <Avatar variant="rounded" sx={{ width: 50, height: 50, bgcolor: 'grey.200' }}>
                          <Typography variant="caption">+{job.photos.length - 3}</Typography>
                        </Avatar>
                      )}
                    </Box>
                  )}

                  {/* Client info */}
                  {job.client && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        src={job.client.profilePicture}
                        sx={{ width: 24, height: 24 }}
                      >
                        {job.client.firstName?.[0]}
                      </Avatar>
                      <Typography variant="caption" color="text.secondary">
                        {job.client.firstName}
                        {job.client.rating && ` • ⭐ ${job.client.rating.toFixed(1)}`}
                      </Typography>
                    </Box>
                  )}
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={() => openQuoteDialog(job)}
                    fullWidth
                  >
                    Send Quote
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Floating refresh button */}
      {location && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 80, right: 16 }}
          onClick={() => fetchJobs()}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}
        </Fab>
      )}

      {/* Quote Dialog */}
      <Dialog
        open={quoteDialogOpen}
        onClose={() => !quoteSubmitting && setQuoteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Send Quote
            <IconButton onClick={() => setQuoteDialogOpen(false)} disabled={quoteSubmitting}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {quoteSuccess ? (
            <Box textAlign="center" py={4}>
              <Typography variant="h1" sx={{ mb: 2 }}>✅</Typography>
              <Typography variant="h6">Quote Sent!</Typography>
              <Typography variant="body2" color="text.secondary">
                You'll be notified if the client accepts your quote
              </Typography>
            </Box>
          ) : (
            <Box sx={{ pt: 1 }}>
              {/* Job summary */}
              {selectedJob && (
                <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
                  <CardContent sx={{ py: 1.5 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {SERVICE_CATEGORIES.find(c => c.id === selectedJob.category)?.name}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      "{selectedJob.description}"
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Quote amount */}
              <TextField
                fullWidth
                required
                label="Your Price"
                type="number"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">GH₵</InputAdornment>
                }}
                helperText={quoteAmount && parseFloat(quoteAmount) >= 25 
                  ? `You'll receive: ${formatCurrency(calculateFees(parseFloat(quoteAmount)).workerPayout)} (after 15% platform fee)`
                  : 'Minimum: GH₵25'
                }
                error={quoteAmount && parseFloat(quoteAmount) < 25}
                sx={{ mb: 2 }}
              />

              {/* Availability */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>When can you start?</InputLabel>
                <Select
                  value={quoteAvailableAt}
                  label="When can you start?"
                  onChange={(e) => setQuoteAvailableAt(e.target.value)}
                >
                  <MenuItem value="30_mins">Within 30 minutes</MenuItem>
                  <MenuItem value="1_hour">Within 1 hour</MenuItem>
                  <MenuItem value="2_hours">Within 2 hours</MenuItem>
                  <MenuItem value="today">Later today</MenuItem>
                  <MenuItem value="tomorrow">Tomorrow</MenuItem>
                </Select>
              </FormControl>

              {/* Duration estimate */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Estimated duration</InputLabel>
                <Select
                  value={quoteEstimatedDuration}
                  label="Estimated duration"
                  onChange={(e) => setQuoteEstimatedDuration(e.target.value)}
                >
                  <MenuItem value="30_mins">30 minutes</MenuItem>
                  <MenuItem value="1_hour">1 hour</MenuItem>
                  <MenuItem value="2_hours">2 hours</MenuItem>
                  <MenuItem value="half_day">Half day</MenuItem>
                  <MenuItem value="full_day">Full day</MenuItem>
                  <MenuItem value="2_days">2 days</MenuItem>
                </Select>
              </FormControl>

              {/* Message */}
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Message to client (optional)"
                placeholder="E.g., 'I have 10 years experience with this type of work...'"
                value={quoteMessage}
                onChange={(e) => setQuoteMessage(e.target.value)}
                inputProps={{ maxLength: 500 }}
              />
            </Box>
          )}
        </DialogContent>

        {!quoteSuccess && (
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setQuoteDialogOpen(false)} disabled={quoteSubmitting}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitQuote}
              disabled={quoteSubmitting || !quoteAmount || parseFloat(quoteAmount) < 25}
              startIcon={quoteSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            >
              {quoteSubmitting ? 'Sending...' : 'Send Quote'}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Container>
  );
};

export default NearbyJobsPage;
