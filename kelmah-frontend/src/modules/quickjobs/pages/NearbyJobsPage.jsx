/**
 * NearbyJobsPage - Worker View for Quick Jobs
 * Shows jobs near the worker's location that they can quote on
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Helmet } from 'react-helmet-async';
import { BOTTOM_NAV_HEIGHT, HEADER_HEIGHT_MOBILE, Z_INDEX } from '../../../constants/layout';
import PageCanvas from '../../common/components/PageCanvas';
import { withSafeAreaTop } from '../../../utils/safeArea';
import { useBreakpointDown } from '@/hooks/useResponsive';

const NearbyJobsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useBreakpointDown('md');
  const quoteTimerRef = useRef(null);
  const locationRef = useRef(null); // stable ref so fetchJobs doesn't need location in its deps

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
  const mobileStickyTop = `calc(${withSafeAreaTop(HEADER_HEIGHT_MOBILE + 10)} + var(--kelmah-network-banner-offset, 0px))`;

  // Get worker's location
  const getLocation = useCallback(async () => {
    try {
      setLocationError('');
      const pos = await getCurrentLocation();
      locationRef.current = pos;
      setLocation(pos);
      return pos;
    } catch (err) {
      setLocationError(err.message);
      return null;
    }
  }, []);

  // Fetch nearby jobs — reads location from ref so this callback is stable across location changes
  const fetchJobs = useCallback(async (pos) => {
    const effectivePos = pos ?? locationRef.current;
    if (!effectivePos) return;
    
    setLoading(true);
    setError('');

    try {
      const result = await getNearbyQuickJobs(
        effectivePos.longitude,
        effectivePos.latitude,
        maxDistance,
        categoryFilter || null
      );

      if (result.success) {
        setJobs(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch jobs');
      }
    } catch (err) {
      setError('Unable to load nearby jobs. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [maxDistance, categoryFilter]);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const pos = await getLocation();
      if (cancelled) return;
      if (pos) {
        await fetchJobs(pos);
      }
    };
    init();
    return () => {
      cancelled = true;
      clearTimeout(quoteTimerRef.current);
    };
  }, []);

  // Refresh when filters change (only after initial location is acquired)
  useEffect(() => {
    if (locationRef.current) {
      fetchJobs();
    }
  }, [maxDistance, categoryFilter, fetchJobs]);

  // Handle quote submission
  const handleSubmitQuote = async () => {
    if (!selectedJob || !quoteAmount || parseFloat(quoteAmount) < 25) {
      return;
    }

    setQuoteSubmitting(true);

    try {
      const result = await submitQuote(selectedJob._id || selectedJob.id, {
        amount: parseFloat(quoteAmount),
        message: quoteMessage,
        availableAt: quoteAvailableAt,
        estimatedDuration: quoteEstimatedDuration
      });

      if (result.success) {
        setQuoteSuccess(true);
        // Remove job from list (they've already quoted)
        const selectedJobId = selectedJob?._id || selectedJob?.id;
        setJobs((prev) =>
          prev.filter((jobItem) => {
            const jobItemId = jobItem?._id || jobItem?.id;
            return String(jobItemId) !== String(selectedJobId);
          }),
        );
        
        quoteTimerRef.current = setTimeout(() => {
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
    <PageCanvas disableContainer sx={{ pt: { xs: 1.25, md: 4 }, pb: { xs: 4, md: 6 } }}>
      <Container maxWidth="md" sx={{ py: { xs: 1.5, md: 3 }, pb: { xs: 10, md: 3 } }}>
      <Helmet><title>Nearby Jobs | Kelmah</title></Helmet>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 1.25, md: 3 } }}>
        <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.15rem', md: '1.5rem' } }}>
          Nearby Quick Jobs
        </Typography>
        <IconButton aria-label="Refresh jobs" onClick={() => fetchJobs()} disabled={loading || !location} sx={{ minWidth: 44, minHeight: 44 , '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: '2px' }}}>
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
        <Box
          sx={{
            position: 'sticky',
            top: { xs: mobileStickyTop, md: 80 },
            zIndex: Z_INDEX.sticky,
            display: 'flex',
            gap: 0.75,
            mb: 1.25,
            py: 0.5,
            bgcolor: 'background.default',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Chip
            icon={<MyLocationIcon />}
            label="Nearby"
            variant="outlined"
            size="small"
            sx={{ fontWeight: 700 }}
          />
          <Chip
            icon={<NavigationIcon />}
            label={`Within ${maxDistance} km`}
            variant="outlined"
            size="small"
            sx={{ fontWeight: 700 }}
          />
          {categoryFilter && (
            <Chip
              label={SERVICE_CATEGORIES.find((c) => c.id === categoryFilter)?.name || 'Category'}
              size="small"
              sx={{ fontWeight: 700 }}
            />
          )}
        </Box>
      )}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 1, mb: { xs: 1.5, md: 3 }, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Category"
            onChange={(e) => setCategoryFilter(e.target.value)}
            sx={{ minHeight: 44 }}
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
            sx={{ minHeight: 44 }}
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
            <Grid item xs={12} key={`nearby-jobs-skeleton-${i}`}>
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
            Try again soon or increase the search distance to see more jobs.
          </Typography>
          <Button variant="outlined" onClick={() => setMaxDistance(20)} sx={{ minHeight: 44 }}>
            Search within 20 km
          </Button>
        </Box>
      )}

      {/* Jobs list */}
      {!loading && jobs.length > 0 && (
        <Grid container spacing={{ xs: 1.25, md: 2 }}>
          {jobs.map(job => (
            <Grid item xs={12} key={job._id}>
              <Card
                sx={{
                  borderLeft: `4px solid ${theme.palette[getUrgencyColor(job.urgency)]?.main || theme.palette.primary.main}`,
                  transition: 'all 0.2s',
                  borderRadius: { xs: 2.5, md: 1.5 },
                  '&:hover': {
                    transform: 'translateX(4px)',
                    boxShadow: 2
                  }
                }}
              >
                <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
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
                  <Typography variant="body2" sx={{ mb: 1.25, minHeight: 0, fontSize: { xs: '0.84rem', md: '0.875rem' } }}>
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
                    <Box sx={{ display: 'flex', gap: 1, mb: 1.25 }}>
                      {job.photos.slice(0, 3).map((photo, i) => (
                        <Avatar
                          key={photo.url || photo || i}
                          src={photo.url}
                          alt={`Job photo ${i + 1}`}
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
                        alt={job.client.firstName || 'Client avatar'}
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

                <CardActions sx={{ px: { xs: 1.5, md: 2 }, pb: { xs: 1.5, md: 2 }, pt: 0.5 }}>
                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={() => openQuoteDialog(job)}
                    fullWidth
                    sx={{ minHeight: 42 }}
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
      {location && !isMobile && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: `calc(${BOTTOM_NAV_HEIGHT + 16}px + env(safe-area-inset-bottom, 0px))`,
            right: 16,
          }}
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
        fullScreen={isMobile}
        aria-labelledby="send-quote-dialog-title"
      >
        <DialogTitle id="send-quote-dialog-title">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Send Quote
            <IconButton
              aria-label="Close quote dialog"
              onClick={() => setQuoteDialogOpen(false)}
              disabled={quoteSubmitting}
              sx={{
                minWidth: 44,
                minHeight: 44,
                '&:focus-visible': {
                  outline: '3px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: '2px',
                },
              }}
            >
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
                We will notify you if the client accepts your quote.
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
                  : 'Minimum quote amount is GH₵25'
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
                placeholder="Example: I can start today and I have handled similar work before."
                value={quoteMessage}
                onChange={(e) => setQuoteMessage(e.target.value)}
                inputProps={{ maxLength: 500 }}
              />
            </Box>
          )}
        </DialogContent>

        {!quoteSuccess && (
          <DialogActions sx={{ px: { xs: 1.5, md: 3 }, pb: { xs: 1.5, md: 3 }, position: { xs: 'sticky', md: 'static' }, bottom: 0, bgcolor: { xs: 'background.paper', md: 'transparent' }, borderTop: { xs: '1px solid', md: 'none' }, borderColor: 'divider' }}>
            <Button onClick={() => setQuoteDialogOpen(false)} disabled={quoteSubmitting} sx={{ minHeight: 44 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitQuote}
              disabled={quoteSubmitting || !quoteAmount || parseFloat(quoteAmount) < 25}
              startIcon={quoteSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              sx={{ minHeight: 44 }}>
              {quoteSubmitting ? 'Sending...' : 'Send Quote'}
            </Button>
          </DialogActions>
        )}
        </Dialog>
      </Container>
    </PageCanvas>
  );
};

export default NearbyJobsPage;
