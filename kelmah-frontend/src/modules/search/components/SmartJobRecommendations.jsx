import { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { normalizeUser } from '../../../utils/userUtils';
import searchService from '../services/smartSearchService';
import {
  useSavedJobsQuery,
  useSavedJobIds,
  useSaveJobMutation,
  useUnsaveJobMutation,
} from '../../jobs/hooks/useJobsQuery';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Badge,
  LinearProgress,
  useTheme,
  alpha,
  Skeleton,
} from '@mui/material';
import {
  WorkOutline as JobIcon,
  LocationOn as LocationIcon,
  Schedule as TimeIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
  Lightbulb as AIIcon,
  Bookmark as SaveIcon,
  BookmarkBorder as SaveBorderIcon,
  Share as ShareIcon,
  Visibility as ViewIcon,
  AutoAwesome as MagicIcon,
  Psychology as BrainIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { formatCurrency, formatRelativeTime, formatJobLocation } from '../../../utils/formatters';

const SmartJobRecommendations = ({
  maxRecommendations = 6,
  showHeader = true,
  onJobSelect = null,
  filterCriteria = {},
}) => {
  const navigate = useNavigate();
  // FIXED: Use standardized user normalization for consistent user data access
  const { user: rawUser, isAuthenticated } = useSelector((state) => state.auth);
  const user = normalizeUser(rawUser);
  const userId = user?.id || user?._id;
  const userRole = user?.role;
  const userType = user?.userType;
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isWorker = useMemo(
    () => userRole === 'worker' || userType === 'worker',
    [userRole, userType],
  );
  const savedJobsQuery = useSavedJobsQuery(
    {},
    { enabled: Boolean(isAuthenticated) },
  );
  const savedJobIds = useSavedJobIds(savedJobsQuery.data);
  const saveJobMutation = useSaveJobMutation({
    onSuccess: () =>
      enqueueSnackbar('Job saved successfully', { variant: 'success' }),
    onError: () => enqueueSnackbar('Failed to save job', { variant: 'error' }),
  });
  const unsaveJobMutation = useUnsaveJobMutation({
    onSuccess: () =>
      enqueueSnackbar('Job removed from saved list', { variant: 'info' }),
    onError: () =>
      enqueueSnackbar('Failed to update saved jobs', { variant: 'error' }),
  });

  // State management
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);

  // Load recommendations
  const loadRecommendations = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        // If no authenticated user, skip personalized recommendations gracefully
        if (!userId) {
          setRecommendations([]);
          setAiInsights(null);
          setError(null);
          setInfoMessage('Sign in to see personalized job recommendations.');
          setLoading(false);
          setRefreshing(false);
          return;
        }

        if (!isWorker) {
          setRecommendations([]);
          setAiInsights(null);
          setError(null);
          setInfoMessage(
            'Smart job recommendations are available for worker accounts. Switch to a worker profile to discover tailored opportunities.',
          );
          setLoading(false);
          setRefreshing(false);
          return;
        }

        const response = await searchService.getSmartJobRecommendations(
          userId,
          {
            limit: maxRecommendations,
            ...filterCriteria,
          },
        );

        const payload = response || {};

        setRecommendations(payload.jobs || []);
        setAiInsights(payload.insights || null);
        setInfoMessage(
          payload.jobs && payload.jobs.length === 0
            ? 'Complete your worker profile to unlock AI-powered job matches tailored to your skills.'
            : null,
        );
        setError(null);
      } catch (err) {
        const status = err?.response?.status;

        if (status === 403) {
          setInfoMessage(
            'We could not verify a worker profile for this account. Update your profile type to receive smart recommendations.',
          );
          setError(null);
        } else if (status === 404 || status === 204) {
          setInfoMessage(
            'No recommendations are available yet. Keep your profile up to date and check back soon.',
          );
          setError(null);
        } else {
          setError('Failed to load job recommendations');
          setInfoMessage(null);
          enqueueSnackbar('Failed to load smart recommendations', {
            variant: 'error',
          });
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId, isWorker, maxRecommendations, filterCriteria, enqueueSnackbar],
  );

  useEffect(() => {
    // Load only when user is available; otherwise show empty state without errors
    loadRecommendations();
  }, [loadRecommendations]);

  // Handle save/unsave job
  const handleToggleSave = async (job) => {
    const jobId = job?.id || job?._id || job?.jobId;
    if (!jobId) {
      enqueueSnackbar('Job reference unavailable. Please refresh.', {
        variant: 'warning',
      });
      return;
    }
    const isSaved = savedJobIds.has(jobId);

    try {
      if (isSaved) {
        await unsaveJobMutation.mutateAsync({ jobId });
        return;
      }

      await saveJobMutation.mutateAsync({ jobId, job });
    } catch (mutationError) {
      // Notification handled inside mutation callbacks.
      console.warn('Saved job mutation failed:', mutationError);
    }
  };

  // Handle job application
  const handleApplyToJob = async (jobId) => {
    if (!jobId) {
      enqueueSnackbar('Job reference unavailable. Please refresh.', {
        variant: 'warning',
      });
      return;
    }

    try {
      await searchService.trackJobInteraction(jobId, 'apply_click');
      if (onJobSelect) {
        onJobSelect(jobId, 'apply');
      }
      navigate(`/jobs/${jobId}/apply`);
    } catch (applyError) {
      console.error('Failed to process job application:', applyError);
      enqueueSnackbar('Failed to process job application', {
        variant: 'error',
      });
    }
  };

  // Handle view job details
  const handleViewJob = async (jobId) => {
    if (!jobId) {
      enqueueSnackbar('Job reference unavailable. Please refresh.', {
        variant: 'warning',
      });
      return;
    }

    try {
      await searchService.trackJobInteraction(jobId, 'view_click');
      if (onJobSelect) {
        onJobSelect(jobId, 'view');
      }
      navigate(`/jobs/${jobId}`);
    } catch (viewError) {
      console.error('Failed to track job view:', viewError);
    }
  };

  // Get match score color
  const getMatchScoreColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'primary';
    if (score >= 60) return 'warning';
    return 'error';
  };

  // Get urgency indicator
  const getUrgencyIndicator = (urgency) => {
    const indicators = {
      high: { color: 'error', label: 'Urgent', icon: '🔥' },
      medium: { color: 'warning', label: 'Soon', icon: '⏰' },
      low: { color: 'info', label: 'Flexible', icon: '📅' },
    };
    return indicators[urgency] || indicators.low;
  };

  // Render AI insights panel
  const renderAIInsights = () => {
    if (!aiInsights || !showHeader) return null;

    return (
      <Paper
        sx={{
          p: 2,
          mb: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar
            sx={{
              backgroundColor: theme.palette.primary.main,
              width: 32,
              height: 32,
            }}
          >
            <BrainIcon fontSize="small" />
          </Avatar>
          <Typography variant="h6" color="primary">
            AI Insights
          </Typography>
          <Chip
            icon={<MagicIcon />}
            label="Powered by AI"
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        <Typography variant="body2" paragraph>
          {aiInsights.summary}
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          {aiInsights.tags?.map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              size="small"
              icon={<AIIcon />}
              sx={{ mb: 1 }}
            />
          ))}
        </Stack>
      </Paper>
    );
  };

  // Render job recommendation card
  const renderJobCard = (job) => {
    const matchColor = getMatchScoreColor(job.matchScore);
    const urgency = getUrgencyIndicator(job.urgency);
    const jobKey = job.id || job._id || job.jobId;
    const isSaved = jobKey ? savedJobIds.has(jobKey) : false;

    return (
      <Card
        key={jobKey || job.title}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8],
          },
          border: job.featured
            ? `2px solid ${theme.palette.primary.main}`
            : '1px solid',
          borderColor: job.featured
            ? theme.palette.primary.main
            : theme.palette.divider,
        }}
      >
        {/* Featured badge */}
        {job.featured && (
          <Chip
            icon={<StarIcon />}
            label="Featured"
            color="primary"
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 1,
            }}
          />
        )}

        {/* Match score badge */}
        <Chip
          label={`${job.matchScore}% Match`}
          color={matchColor}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
            fontWeight: 'bold',
          }}
        />

        {/* Urgency indicator */}
        {job.urgency !== 'low' && (
          <Chip
            label={`${urgency.icon} ${urgency.label}`}
            color={urgency.color}
            size="small"
            sx={{
              position: 'absolute',
              top: job.featured ? 40 : 40,
              right: 8,
              zIndex: 1,
            }}
          />
        )}

        <CardContent sx={{ flexGrow: 1, pt: job.featured ? 5 : 3 }}>
          <Typography variant="h6" component="h3" gutterBottom>
            {job.title}
          </Typography>

          <Typography variant="body2" color="text.secondary" paragraph>
            {job.description?.length > 120
              ? `${job.description.substring(0, 120)}...`
              : job.description}
          </Typography>

          <Stack spacing={1} mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <LocationIcon fontSize="small" color="action" />
              <Typography variant="body2">{formatJobLocation(job.location)}</Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <MoneyIcon fontSize="small" color="action" />
              <Typography variant="body2" fontWeight="medium">
                {job?.budget
                  ? typeof job.budget === 'object'
                    ? `${formatCurrency(job.budget.min || 0)} - ${formatCurrency(job.budget.max || 0)}`
                    : formatCurrency(job.budget)
                  : 'Budget not specified'}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <TimeIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {job.duration || 'Duration not specified'}
              </Typography>
            </Box>

            {job.postedAt && (
              <Box display="flex" alignItems="center" gap={1}>
                <JobIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Posted {formatRelativeTime(job.postedAt)}
                </Typography>
              </Box>
            )}
          </Stack>

          {/* Skills required */}
          {job.skillsRequired && job.skillsRequired.length > 0 && (
            <Box mb={2}>
              <Typography
                variant="caption"
                color="text.secondary"
                gutterBottom
                display="block"
              >
                Skills Required:
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                {job.skillsRequired.slice(0, 3).map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    size="small"
                    variant="outlined"
                    sx={{ mb: 0.5 }}
                  />
                ))}
                {job.skillsRequired.length > 3 && (
                  <Chip
                    label={`+${job.skillsRequired.length - 3} more`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                )}
              </Stack>
            </Box>
          )}

          {/* AI reasoning */}
          {job.aiReasoning && (
            <Alert
              severity="info"
              icon={<AIIcon />}
              sx={{
                mt: 2,
                '& .MuiAlert-message': { fontSize: '0.75rem' },
              }}
            >
              <Typography variant="caption">
                <strong>Why this matches:</strong> {job.aiReasoning}
              </Typography>
            </Alert>
          )}

          {/* Match score breakdown */}
          <Box mt={2}>
            <Typography
              variant="caption"
              color="text.secondary"
              gutterBottom
              display="block"
            >
              Match Breakdown:
            </Typography>
            <Stack spacing={0.5}>
              {job.matchBreakdown?.map((item, index) => (
                <Box
                  key={index}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography variant="caption">{item.factor}</Typography>
                  <Box display="flex" alignItems="center" gap={1} width="60%">
                    <LinearProgress
                      variant="determinate"
                      value={item.score}
                      sx={{
                        flexGrow: 1,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      }}
                    />
                    <Typography variant="caption" sx={{ minWidth: 30 }}>
                      {item.score}%
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        </CardContent>

        <Divider />

        <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
          <Stack direction="row" spacing={1}>
            <Tooltip title={isSaved ? 'Remove from saved' : 'Save job'}>
              <IconButton
                size="small"
                onClick={() => handleToggleSave(job)}
                color={isSaved ? 'primary' : 'default'}
              >
                {isSaved ? <SaveIcon /> : <SaveBorderIcon />}
              </IconButton>
            </Tooltip>

            <Tooltip title="View details">
              <IconButton size="small" onClick={() => handleViewJob(jobKey)}>
                <ViewIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Share job">
              <IconButton size="small">
                <ShareIcon />
              </IconButton>
            </Tooltip>
          </Stack>

          <Button
            variant="contained"
            size="small"
            onClick={() => handleApplyToJob(jobKey)}
            sx={{ minWidth: 80 }}
          >
            Apply Now
          </Button>
        </CardActions>
      </Card>
    );
  };

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <Grid container spacing={3}>
      {[...Array(maxRecommendations)].map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card>
            <CardContent>
              <Skeleton variant="text" height={32} width="80%" />
              <Skeleton variant="text" height={20} />
              <Skeleton variant="text" height={20} />
              <Box mt={2}>
                <Skeleton variant="rectangular" height={60} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  if (loading) {
    return (
      <Box>
        {showHeader && (
          <Box
            mb={3}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h5" display="flex" alignItems="center" gap={1}>
              <BrainIcon color="primary" />
              Smart Job Recommendations
            </Typography>
          </Box>
        )}
        {renderLoadingSkeleton()}
      </Box>
    );
  }

  if (infoMessage && recommendations.length === 0) {
    return (
      <Box>
        {showHeader && (
          <Box
            mb={3}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h5" display="flex" alignItems="center" gap={1}>
              <BrainIcon color="primary" />
              Smart Job Recommendations
              <Badge badgeContent={0} color="primary" />
            </Typography>
          </Box>
        )}

        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AIIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Recommendations Unavailable
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {infoMessage}
          </Typography>
          {!isWorker && (
            <Button variant="contained" href="/profile">
              Update Profile
            </Button>
          )}
        </Paper>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button size="small" onClick={() => loadRecommendations()}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {showHeader && (
        <Box
          mb={3}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h5" display="flex" alignItems="center" gap={1}>
            <BrainIcon color="primary" />
            Smart Job Recommendations
            <Badge badgeContent={recommendations.length} color="primary" />
          </Typography>

          <Button
            variant="outlined"
            size="small"
            startIcon={
              refreshing ? <CircularProgress size={16} /> : <RefreshIcon />
            }
            onClick={() => loadRecommendations(true)}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>
      )}

      {/* AI Insights */}
      {renderAIInsights()}

      {/* Recommendations Grid */}
      {recommendations.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AIIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Recommendations Available
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Complete your profile and set your preferences to get personalized
            job recommendations
          </Typography>
          <Button variant="contained" href="/worker/profile/edit">
            Complete Profile
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {recommendations.map((job) => {
            const jobKey = job.id || job._id || job.jobId;
            return (
              <Grid item xs={12} sm={6} md={4} key={jobKey || job.title}>
                {renderJobCard(job)}
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Load More Button */}
      {recommendations.length >= maxRecommendations && (
        <Box textAlign="center" mt={3}>
          <Button
            variant="outlined"
            onClick={() => {
              // Navigate to full search page with recommendations
              navigate('/search/jobs?recommended=true');
            }}
          >
            View All Recommendations
          </Button>
        </Box>
      )}
    </Box>
  );
};

SmartJobRecommendations.propTypes = {
  maxRecommendations: PropTypes.number,
  showHeader: PropTypes.bool,
  onJobSelect: PropTypes.func,
  filterCriteria: PropTypes.object,
};

export default SmartJobRecommendations;
