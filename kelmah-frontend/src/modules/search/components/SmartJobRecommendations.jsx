import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import {
  formatCurrency,
  formatRelativeTime,
  formatJobLocation,
} from '../../../utils/formatters';

// FIX C2: Stable default object to prevent infinite render loops from {} !== {}
const EMPTY_FILTER = {};
const EMPTY_RECOMMENDATION_META = {
  source: null,
  averageMatchScore: null,
  totalRecommendations: 0,
  refreshedAt: null,
};

const isRequestAbort = (error) =>
  error?.name === 'AbortError' ||
  error?.name === 'CanceledError' ||
  error?.code === 'ERR_CANCELED';

const SmartJobRecommendations = ({
  maxRecommendations = 6,
  showHeader = true,
  onJobSelect = null,
  filterCriteria = EMPTY_FILTER,
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
  const savedJobsQuery = useSavedJobsQuery(EMPTY_FILTER, {
    enabled: Boolean(isAuthenticated),
  });
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
  const [recommendationMeta, setRecommendationMeta] = useState(
    EMPTY_RECOMMENDATION_META,
  );
  const activeRequestRef = useRef(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
    };
  }, []);

  // Load recommendations
  const loadRecommendations = useCallback(
    async (refresh = false) => {
      activeRequestRef.current?.abort();
      const controller = new AbortController();
      activeRequestRef.current = controller;

      const canUpdateState = () =>
        isMountedRef.current &&
        activeRequestRef.current === controller &&
        !controller.signal.aborted;

      const applyState = (updater) => {
        if (!canUpdateState()) {
          return false;
        }

        updater();
        return true;
      };

      try {
        applyState(() => {
          if (refresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }
        });

        // If no authenticated user, skip personalized recommendations gracefully
        if (!userId) {
          applyState(() => {
            setRecommendations([]);
            setAiInsights(null);
            setRecommendationMeta(EMPTY_RECOMMENDATION_META);
            setError(null);
            setInfoMessage('Sign in to see personalized job recommendations.');
          });
          return;
        }

        if (!isWorker) {
          applyState(() => {
            setRecommendations([]);
            setAiInsights(null);
            setRecommendationMeta(EMPTY_RECOMMENDATION_META);
            setError(null);
            setInfoMessage(
              'Smart job recommendations are available for worker accounts. Switch to a worker profile to discover tailored opportunities.',
            );
          });
          return;
        }

        const response = await searchService.getSmartJobRecommendations(
          userId,
          {
            limit: maxRecommendations,
            signal: controller.signal,
            ...filterCriteria,
          },
        );

        if (!canUpdateState()) {
          return;
        }

        const payload = response || {};

        // FIX H6: smartSearchService pre-handles 403/404 by returning
        // { jobs: [], status: 'forbidden'|'empty' } instead of throwing.
        // Check for these statuses in the success path so info messages display.
        if (payload.status === 'forbidden') {
          applyState(() => {
            setRecommendations([]);
            setAiInsights(null);
            setRecommendationMeta(EMPTY_RECOMMENDATION_META);
            setInfoMessage(
              'We could not verify a worker profile for this account. Update your profile type to receive smart recommendations.',
            );
            setError(null);
          });
          return;
        }

        if (payload.status === 'empty') {
          applyState(() => {
            setRecommendations([]);
            setAiInsights(null);
            setRecommendationMeta({
              source: payload.recommendationSource || null,
              averageMatchScore: payload.averageMatchScore ?? null,
              totalRecommendations: payload.totalRecommendations ?? 0,
              refreshedAt: new Date().toISOString(),
            });
            setInfoMessage(
              'No recommendations are available yet. Keep your profile up to date and check back soon.',
            );
            setError(null);
          });
          return;
        }

        applyState(() => {
          const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
          setRecommendations(jobs);
          setAiInsights(payload.insights || null);
          setRecommendationMeta({
            source: payload.recommendationSource || null,
            averageMatchScore: payload.averageMatchScore ?? null,
            totalRecommendations: payload.totalRecommendations ?? jobs.length,
            refreshedAt: new Date().toISOString(),
          });
          setInfoMessage(
            Array.isArray(payload.jobs) && payload.jobs.length === 0
              ? 'Complete your worker profile to unlock AI-powered job matches tailored to your skills.'
              : null,
          );
          setError(null);
        });
      } catch (err) {
        if (isRequestAbort(err)) {
          return;
        }

        if (!canUpdateState()) {
          return;
        }

        const status = err?.response?.status;

        if (status === 403) {
          applyState(() => {
            setRecommendationMeta(EMPTY_RECOMMENDATION_META);
            setInfoMessage(
              'We could not verify a worker profile for this account. Update your profile type to receive smart recommendations.',
            );
            setError(null);
          });
        } else if (status === 404 || status === 204) {
          applyState(() => {
            setRecommendationMeta({
              ...EMPTY_RECOMMENDATION_META,
              refreshedAt: new Date().toISOString(),
            });
            setInfoMessage(
              'No recommendations are available yet. Keep your profile up to date and check back soon.',
            );
            setError(null);
          });
        } else {
          applyState(() => {
            setRecommendationMeta(EMPTY_RECOMMENDATION_META);
            setError(
              'Unable to load recommendations right now. Please retry or browse all jobs.',
            );
            setInfoMessage(null);
          });
          enqueueSnackbar('Failed to load smart recommendations', {
            variant: 'error',
          });
        }
      } finally {
        const shouldFinalizeState = canUpdateState();

        if (activeRequestRef.current === controller) {
          activeRequestRef.current = null;
        }

        if (shouldFinalizeState) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [userId, isWorker, maxRecommendations, filterCriteria, enqueueSnackbar],
  );

  useEffect(() => {
    // Load only when user is available; otherwise show empty state without errors
    loadRecommendations();
  }, [loadRecommendations]);

  // Handle save/unsave job
  const handleToggleSave = useCallback(
    async (job) => {
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
        if (import.meta.env.DEV)
          console.warn('Saved job mutation failed:', mutationError);
      }
    },
    [enqueueSnackbar, saveJobMutation, savedJobIds, unsaveJobMutation],
  );

  // Handle job application
  const handleApplyToJob = useCallback(
    async (jobId) => {
      if (!jobId) {
        enqueueSnackbar('Job reference unavailable. Please refresh.', {
          variant: 'warning',
        });
        return;
      }

      // Fire-and-forget: tracking should never block navigation
      searchService.trackJobInteraction(jobId, 'apply_click').catch(() => {});
      if (onJobSelect) {
        onJobSelect(jobId, 'apply');
      }
      navigate(`/jobs/${jobId}/apply`);
    },
    [enqueueSnackbar, navigate, onJobSelect],
  );

  // Handle view job details
  const handleViewJob = useCallback(
    async (jobId) => {
      if (!jobId) {
        enqueueSnackbar('Job reference unavailable. Please refresh.', {
          variant: 'warning',
        });
        return;
      }

      // FIX C3: Fire-and-forget tracking so navigation is never blocked
      searchService.trackJobInteraction(jobId, 'view_click').catch(() => {});
      if (onJobSelect) {
        onJobSelect(jobId, 'view');
      }
      navigate(`/jobs/${jobId}`);
    },
    [enqueueSnackbar, navigate, onJobSelect],
  );

  // Get match score color
  const getMatchScoreColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'primary';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getConfidenceLabel = (score) => {
    if (score >= 90) return 'Very strong';
    if (score >= 75) return 'Strong';
    if (score >= 60) return 'Moderate';
    return 'Low';
  };

  const getRecommendationSourceLabel = (source) => {
    const sourceLabels = {
      'worker-profile': 'Your profile skills and work history',
      'activity-history': 'Recent job activity and clicks',
      'saved-searches': 'Saved searches and preference signals',
      'hybrid-ranking': 'Combined profile fit and market demand',
    };

    return sourceLabels[source] || 'Personalized recommendation engine';
  };

  const recommendationSummary = useMemo(() => {
    const hasConfidence =
      recommendationMeta.averageMatchScore != null &&
      !isNaN(recommendationMeta.averageMatchScore);
    return {
      hasConfidence,
      sourceText: getRecommendationSourceLabel(recommendationMeta.source),
      refreshedText: recommendationMeta.refreshedAt
        ? new Date(recommendationMeta.refreshedAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        : null,
    };
  }, [recommendationMeta]);

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
          {(Array.isArray(aiInsights?.tags) ? aiInsights.tags : []).map(
            (tag, index) => (
              <Chip
                key={`${tag || 'tag'}-${index}`}
                label={tag}
                size="small"
                icon={<AIIcon />}
                sx={{ mb: 1 }}
              />
            ),
          )}
        </Stack>
      </Paper>
    );
  };

  // Render job recommendation card
  const renderJobCard = useCallback(
    (job) => {
      const hasMatchScore = job.matchScore != null && !isNaN(job.matchScore);
      const matchColor = hasMatchScore
        ? getMatchScoreColor(job.matchScore)
        : 'default';
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
          {hasMatchScore && (
            <Chip
              label={`Confidence ${job.matchScore}%`}
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
          )}

          {/* FIX M7: Only show urgency chip when urgency is explicitly set and not 'low' */}
          {job.urgency && job.urgency !== 'low' && (
            <Chip
              label={`${urgency.icon} ${urgency.label}`}
              color={urgency.color}
              size="small"
              sx={{
                position: 'absolute',
                top: hasMatchScore ? 40 : 8,
                right: 8,
                zIndex: 1,
              }}
            />
          )}

          <CardContent sx={{ flexGrow: 1, pt: job.featured ? 5 : 3 }}>
            <Typography
              variant="h6"
              component="h3"
              gutterBottom
              sx={{ wordBreak: 'break-word' }}
            >
              {job.title}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              paragraph
              sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
            >
              {job.description?.length > 120
                ? `${job.description.substring(0, 120)}...`
                : job.description}
            </Typography>

            <Stack spacing={1} mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <LocationIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  {formatJobLocation(job.location)}
                </Typography>
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
                      key={`${skill || 'skill'}-${index}`}
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
                  '& .MuiAlert-message': {
                    fontSize: '0.75rem',
                    wordBreak: 'break-word',
                  },
                }}
              >
                <Typography variant="caption">
                  <strong>Why this matches:</strong> {job.aiReasoning}
                </Typography>
              </Alert>
            )}

            {/* FIX M8: Only render breakdown section when data exists */}
            {Array.isArray(job.matchBreakdown) &&
              job.matchBreakdown.length > 0 && (
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
                    {job.matchBreakdown.map((item, index) => (
                      <Box
                        key={`${item.factor || 'factor'}-${item.score ?? 0}-${index}`}
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Typography variant="caption">{item.factor}</Typography>
                        <Box
                          display="flex"
                          alignItems="center"
                          gap={1}
                          width="60%"
                        >
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(100, Math.max(0, item.score || 0))}
                            sx={{
                              flexGrow: 1,
                              height: 4,
                              borderRadius: 2,
                              backgroundColor: alpha(
                                theme.palette.primary.main,
                                0.1,
                              ),
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
              )}
          </CardContent>

          <Divider />

          <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
            <Stack direction="row" spacing={1}>
              <Tooltip title={isSaved ? 'Remove from saved' : 'Save job'}>
                <IconButton
                  size="small"
                  onClick={() => handleToggleSave(job)}
                  aria-label={
                    isSaved
                      ? 'Remove job from saved list'
                      : 'Save job for later'
                  }
                  color={isSaved ? 'primary' : 'default'}
                  sx={{ width: 44, height: 44 }}
                >
                  {isSaved ? <SaveIcon /> : <SaveBorderIcon />}
                </IconButton>
              </Tooltip>

              <Tooltip title="View details">
                <IconButton
                  size="small"
                  aria-label="View job details"
                  onClick={() => handleViewJob(jobKey)}
                  sx={{ width: 44, height: 44 }}
                >
                  <ViewIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Share job">
                <IconButton
                  size="small"
                  aria-label="Share job link"
                  sx={{ width: 44, height: 44 }}
                  onClick={() => {
                    const jobUrl = `${window.location.origin}/jobs/${jobKey}`;
                    if (navigator.share) {
                      navigator
                        .share({ title: job.title, url: jobUrl })
                        .catch(() => {});
                    } else {
                      navigator.clipboard
                        .writeText(jobUrl)
                        .then(() => {
                          enqueueSnackbar('Link copied to clipboard', {
                            variant: 'success',
                          });
                        })
                        .catch(() => {});
                    }
                  }}
                >
                  <ShareIcon />
                </IconButton>
              </Tooltip>
            </Stack>

            <Button
              variant="contained"
              size="small"
              onClick={() => handleApplyToJob(jobKey)}
              aria-label={`Apply to recommended job ${job.title}`}
              sx={{ minWidth: 80, minHeight: 44 }}
            >
              Apply Now
            </Button>
          </CardActions>
        </Card>
      );
    },
    [
      enqueueSnackbar,
      handleApplyToJob,
      handleToggleSave,
      handleViewJob,
      savedJobIds,
      theme,
    ],
  );

  const renderedRecommendationCards = useMemo(
    () =>
      recommendations.map((job, index) => {
        const jobKey = job.id || job._id || job.jobId;
        return (
          <Grid item xs={12} sm={6} md={4} key={jobKey || `job-${index}`}>
            {renderJobCard(job)}
          </Grid>
        );
      }),
    [recommendations, renderJobCard],
  );

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <Grid container spacing={3}>
      {[...Array(maxRecommendations)].map((_, index) => (
        <Grid
          item
          xs={12}
          sm={6}
          md={4}
          key={`smart-recommendation-skeleton-${index}`}
        >
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

        {(recommendationMeta.source || recommendationSummary.hasConfidence) && (
          <Alert
            severity="info"
            sx={{
              mb: 2,
              textAlign: 'left',
              '& .MuiAlert-message': { width: '100%' },
            }}
          >
            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
              <strong>Recommendation source:</strong>{' '}
              {recommendationSummary.sourceText}
            </Typography>
            {recommendationSummary.hasConfidence && (
              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                <strong>Average confidence:</strong>{' '}
                {Math.round(recommendationMeta.averageMatchScore)}% (
                {getConfidenceLabel(recommendationMeta.averageMatchScore)})
              </Typography>
            )}
            {recommendationSummary.refreshedText && (
              <Typography variant="caption" color="text.secondary">
                Last refreshed at {recommendationSummary.refreshedText}
              </Typography>
            )}
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mt: 0.5 }}
            >
              Tips: keep your skills and preferred location updated for stronger
              and clearer matches.
            </Typography>
          </Alert>
        )}

        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AIIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Recommendations are warming up
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {infoMessage}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You can still browse all open jobs while recommendations warm up.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            justifyContent="center"
          >
            <Button
              variant="outlined"
              onClick={() => navigate('/jobs')}
              sx={{ minHeight: 44 }}
            >
              Browse all jobs
            </Button>
            {!isWorker && (
              <Button
                variant="contained"
                onClick={() => navigate('/profile')}
                sx={{ minHeight: 44 }}
              >
                Update profile
              </Button>
            )}
          </Stack>
        </Paper>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button
            size="small"
            onClick={() => loadRecommendations()}
            sx={{ minHeight: 44 }}
          >
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
            sx={{ minHeight: 44 }}
           aria-label="Refresh job recommendations">
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>
      )}

      {(recommendationMeta.source || recommendationSummary.hasConfidence) &&
        recommendations.length > 0 && (
          <Alert
            severity="info"
            sx={{ mb: 2, '& .MuiAlert-message': { width: '100%' } }}
          >
            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
              <strong>Recommendation source:</strong>{' '}
              {recommendationSummary.sourceText}
            </Typography>
            {recommendationSummary.hasConfidence && (
              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                <strong>Average confidence:</strong>{' '}
                {Math.round(recommendationMeta.averageMatchScore)}% (
                {getConfidenceLabel(recommendationMeta.averageMatchScore)})
              </Typography>
            )}
            {recommendationSummary.refreshedText && (
              <Typography variant="caption" color="text.secondary">
                Last refreshed at {recommendationSummary.refreshedText}
              </Typography>
            )}
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mt: 0.5 }}
            >
              Ranking favors skill relevance, location fit, and recent
              marketplace activity.
            </Typography>
          </Alert>
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
            Complete your profile and keep your skills, budget range, and
            preferred location up to date to get personalized job matches.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/worker/profile/edit')}
            sx={{ minHeight: 44 }}
          >
            Complete Profile
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {renderedRecommendationCards}
        </Grid>
      )}

      {/* Load More Button */}
      {recommendations.length >= maxRecommendations && (
        <Box textAlign="center" mt={3}>
          <Button
            variant="outlined"
            onClick={() => {
              navigate('/jobs');
            }}
            sx={{ minHeight: 44 }}
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

