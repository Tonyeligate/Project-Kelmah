import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/contexts/AuthContext';
import searchService from '../services/smartSearchService';
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
  TrendingUp as TrendingIcon,
  Lightbulb as AIIcon,
  Bookmark as SaveIcon,
  BookmarkBorder as SaveBorderIcon,
  Share as ShareIcon,
  Visibility as ViewIcon,
  ThumbUp as LikeIcon,
  AutoAwesome as MagicIcon,
  Psychology as BrainIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { formatCurrency, formatDate, formatRelativeTime } from '../../../utils/formatters';

const SmartJobRecommendations = ({ 
  maxRecommendations = 6, 
  showHeader = true, 
  onJobSelect = null,
  filterCriteria = {}
}) => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  // State management
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);

  // Load recommendations
  const loadRecommendations = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await searchService.getSmartJobRecommendations(
        user.id, 
        { 
          limit: maxRecommendations,
          ...filterCriteria 
        }
      );
      
      setRecommendations(response.data.jobs || []);
      setAiInsights(response.data.insights || null);
      setSavedJobs(new Set(response.data.savedJobIds || []));
      setError(null);
    } catch (err) {
      setError('Failed to load job recommendations');
      enqueueSnackbar('Failed to load smart recommendations', { variant: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id, maxRecommendations, filterCriteria, enqueueSnackbar]);

  useEffect(() => {
    if (user?.id) {
      loadRecommendations();
    }
  }, [loadRecommendations, user]);

  // Handle save/unsave job
  const handleToggleSave = async (jobId) => {
    try {
      const isSaved = savedJobs.has(jobId);
      
      if (isSaved) {
        await searchService.unsaveJob(jobId);
        setSavedJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
        enqueueSnackbar('Job removed from saved list', { variant: 'success' });
      } else {
        await searchService.saveJob(jobId);
        setSavedJobs(prev => new Set(prev).add(jobId));
        enqueueSnackbar('Job saved successfully', { variant: 'success' });
      }
    } catch (error) {
      enqueueSnackbar('Failed to update saved jobs', { variant: 'error' });
    }
  };

  // Handle job application
  const handleApplyToJob = async (jobId) => {
    try {
      await searchService.trackJobInteraction(jobId, 'apply_click');
      if (onJobSelect) {
        onJobSelect(jobId, 'apply');
      }
      // Navigate to job application page
      window.location.href = `/jobs/${jobId}/apply`;
    } catch (error) {
      enqueueSnackbar('Failed to process job application', { variant: 'error' });
    }
  };

  // Handle view job details
  const handleViewJob = async (jobId) => {
    try {
      await searchService.trackJobInteraction(jobId, 'view_click');
      if (onJobSelect) {
        onJobSelect(jobId, 'view');
      }
      // Navigate to job details page
      window.location.href = `/jobs/${jobId}`;
    } catch (error) {
      console.error('Failed to track job view:', error);
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
      low: { color: 'info', label: 'Flexible', icon: '📅' }
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
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
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
    const isSaved = savedJobs.has(job.id);

    return (
      <Card
        key={job.id}
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
          border: job.featured ? `2px solid ${theme.palette.primary.main}` : '1px solid',
          borderColor: job.featured ? theme.palette.primary.main : theme.palette.divider,
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
              <Typography variant="body2">
                {job.location}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <MoneyIcon fontSize="small" color="action" />
              <Typography variant="body2" fontWeight="medium">
                {job.budget ? (
                  typeof job.budget === 'object' 
                    ? `${formatCurrency(job.budget.min)} - ${formatCurrency(job.budget.max)}`
                    : formatCurrency(job.budget)
                ) : (
                  'Salary not specified'
                )}
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
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">
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
                '& .MuiAlert-message': { fontSize: '0.75rem' }
              }}
            >
              <Typography variant="caption">
                <strong>Why this matches:</strong> {job.aiReasoning}
              </Typography>
            </Alert>
          )}

          {/* Match score breakdown */}
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
              Match Breakdown:
            </Typography>
            <Stack spacing={0.5}>
              {job.matchBreakdown?.map((item, index) => (
                <Box key={index} display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="caption">{item.factor}</Typography>
                  <Box display="flex" alignItems="center" gap={1} width="60%">
                    <LinearProgress
                      variant="determinate"
                      value={item.score}
                      sx={{ 
                        flexGrow: 1, 
                        height: 4, 
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1)
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
                onClick={() => handleToggleSave(job.id)}
                color={isSaved ? 'primary' : 'default'}
              >
                {isSaved ? <SaveIcon /> : <SaveBorderIcon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="View details">
              <IconButton 
                size="small"
                onClick={() => handleViewJob(job.id)}
              >
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
            onClick={() => handleApplyToJob(job.id)}
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
          <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
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
        <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" display="flex" alignItems="center" gap={1}>
            <BrainIcon color="primary" />
            Smart Job Recommendations
            <Badge badgeContent={recommendations.length} color="primary" />
          </Typography>
          
          <Button
            variant="outlined"
            size="small"
            startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
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
            Complete your profile and set your preferences to get personalized job recommendations
          </Typography>
          <Button variant="contained" href="/worker/profile/edit">
            Complete Profile
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {recommendations.map((job) => (
            <Grid item xs={12} sm={6} md={4} key={job.id}>
              {renderJobCard(job)}
            </Grid>
          ))}
        </Grid>
      )}

      {/* Load More Button */}
      {recommendations.length >= maxRecommendations && (
        <Box textAlign="center" mt={3}>
          <Button
            variant="outlined"
            onClick={() => {
              // Navigate to full search page with recommendations
              window.location.href = '/search/jobs?recommended=true';
            }}
          >
            View All Recommendations
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default SmartJobRecommendations;