import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Rating,
  Avatar,
  Stack,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  Tooltip,
  Badge,
  useTheme,
  alpha,
  Tabs,
  Tab,
  Skeleton,
  Alert,
  Snackbar,
  Fade,
  Collapse,
} from '@mui/material';
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Reply as ReplyIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Verified as VerifiedIcon,
  Report as ReportIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  Work as WorkIcon,
  Person as PersonIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
// âœ… MOBILE-AUDIT P3: framer-motion import removed â€” all motion.div wrappers replaced with plain divs
import { formatDistanceToNow, format } from 'date-fns';
import { safeFormatDate, safeFormatRelative } from '@/modules/common/utils/formatters';
import {
  resolveMediaAssetUrl,
  resolveProfileImageUrl,
} from '@/modules/common/utils/mediaAssets';
import { useBreakpointDown } from '@/hooks/useResponsive';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import reviewService from '../services/reviewService';
import MobileFilterSheet from '../../../components/common/MobileFilterSheet';
import { Helmet } from 'react-helmet-async';
import { devError } from '@/modules/common/utils/devLogger';

// Enhanced Reviews Page with comprehensive review management
const EnhancedReviewsPage = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useBreakpointDown('md');

  // State management
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');
  const [activeTab, setActiveTab] = useState(0); // Fix: Added missing activeTab state
  const [reviewStats, setReviewStats] = useState({}); // Fix: Added missing reviewStats state
  const [replyDialog, setReplyDialog] = useState(false); // Fix: Added missing replyDialog state
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyText, setReplyText] = useState(''); // Fix: Added missing replyText state
  const [selectedReview, setSelectedReview] = useState(null); // Fix: Added missing selectedReview state
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null); // Fix: Added missing filterMenuAnchor state
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null); // Fix: Added missing sortMenuAnchor state
  const [moreMenuAnchor, setMoreMenuAnchor] = useState(null); // Fix: Added missing moreMenuAnchor state
  const [feedback, setFeedback] = useState({
    // Fix: Added missing feedback state
    open: false,
    message: '',
    severity: 'success',
  });
  const REVIEW_FILTER_LABELS = {
    all: 'All Reviews',
    '5-star': '5 Star Reviews',
    '4-star': '4 Star Reviews',
    recent: 'Recent (Last 7 days)',
    verified: 'Verified Reviewers',
    'with-reply': 'With Reply',
    'needs-reply': 'Needs Reply',
  };
  const REVIEW_SORT_LABELS = {
    newest: 'Newest First',
    oldest: 'Oldest First',
    'highest-rated': 'Highest Rated',
    'lowest-rated': 'Lowest Rated',
    'most-helpful': 'Most Helpful',
  };

  const overallStats = useMemo(
    () => ({
      averageRating: Number(reviewStats?.overall?.averageRating || 0),
      totalReviews: Number(reviewStats?.overall?.totalReviews || 0),
      ratingDistribution: reviewStats?.overall?.ratingDistribution || {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    }),
    [reviewStats],
  );

  // Real review data is fetched from backend (mocks disabled in production)

  // Utility functions
  const showFeedback = (message, severity = 'info') => {
    setFeedback({ open: true, message, severity });
  };

  // Load reviews function (extracted for reuse by refresh button)
  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!user?.id) {
        setReviews([]);
        setReviewStats({});
      } else {
        const [statsResult, reviewsResult] = await Promise.allSettled([
          reviewService.getReviewStats(user.id),
          reviewService.getUserReviews(user.id, 1, 20),
        ]);
        const stats = statsResult.status === 'fulfilled' ? statsResult.value : {};
        const workerReviews = reviewsResult.status === 'fulfilled' ? reviewsResult.value : null;
        setReviewStats({
          overall: {
            averageRating: stats.averageRating,
            totalReviews: stats.totalReviews,
            ratingDistribution: stats.ratingDistribution,
          },
          categories: stats.categoryRatings || {},
          recent: {},
        });
        setReviews(workerReviews?.reviews || []);
      }
    } catch (error) {
      devError('Failed to load reviews:', error);
      showFeedback('Failed to load reviews', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Initialize data
  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Filter and sort reviews
  useEffect(() => {
    let filtered = [...reviews];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (review) =>
          (review?.title || '').toLowerCase().includes(query) ||
          (review?.comment || '').toLowerCase().includes(query) ||
          (review?.reviewer?.name || '').toLowerCase().includes(query) ||
          (review?.job?.title || '').toLowerCase().includes(query),
      );
    }

    // Apply category filter
    switch (selectedFilter) {
      case '5-star':
        filtered = filtered.filter((review) => review.rating === 5);
        break;
      case '4-star':
        filtered = filtered.filter((review) => review.rating === 4);
        break;
      case 'recent': {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(
          (review) => new Date(review.createdAt) > weekAgo,
        );
        break;
      }
      case 'verified':
        filtered = filtered.filter((review) => review?.reviewer?.isVerified);
        break;
      case 'with-reply':
        filtered = filtered.filter((review) => review.hasReply);
        break;
      case 'needs-reply':
        filtered = filtered.filter(
          (review) => !review.hasReply && review.rating <= 3,
        );
        break;
      default:
        break;
    }

    // Apply sorting
    switch (selectedSort) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'highest-rated':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest-rated':
        filtered.sort((a, b) => a.rating - b.rating);
        break;
      case 'most-helpful':
        filtered.sort((a, b) => b.helpfulVotes - a.helpfulVotes);
        break;
      default: // newest
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    setFilteredReviews(filtered);
  }, [reviews, searchQuery, selectedFilter, selectedSort]);

  const reviewCredibilitySummary = useMemo(() => {
    const now = Date.now();
    const recentWindowMs = 30 * 24 * 60 * 60 * 1000;
    const verifiedCount = filteredReviews.filter((review) => review?.reviewer?.isVerified).length;
    const recentCount = filteredReviews.filter((review) => {
      const createdAt = review?.createdAt ? new Date(review.createdAt).getTime() : 0;
      return createdAt && now - createdAt <= recentWindowMs;
    }).length;
    return {
      verifiedCount,
      recentCount,
      withReplyCount: filteredReviews.filter((review) => review?.hasReply).length,
    };
  }, [filteredReviews]);

  const handleReply = async () => {
    if (!replyText.trim() || !selectedReview || replySubmitting) return;
    setReplySubmitting(true);
    try {
      await reviewService.addWorkerResponse(selectedReview.id || selectedReview._id, replyText.trim());

      // Update review with reply
      setReviews((prev) =>
        prev.map((review) =>
          (review.id || review._id) === (selectedReview.id || selectedReview._id)
            ? {
                ...review,
                hasReply: true,
                reply: {
                  text: replyText.trim(),
                  createdAt: new Date(),
                },
              }
            : review,
        ),
      );

      setReplyDialog(false);
      setReplyText('');
      setSelectedReview(null);
      showFeedback('Reply posted successfully!', 'success');
    } catch (error) {
      devError('Failed to post reply:', error);
      showFeedback('Failed to post reply', 'error');
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleHelpfulVote = async (reviewId, isHelpful) => {
    try {
      if (isHelpful) {
        await reviewService.voteHelpful(reviewId);
      } else {
        await reviewService.voteUnhelpful(reviewId);
      }

      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                helpfulVotes: isHelpful
                  ? review.helpfulVotes + 1
                  : review.helpfulVotes,
                unhelpfulVotes: isHelpful
                  ? review.unhelpfulVotes
                  : review.unhelpfulVotes + 1,
              }
            : review,
        ),
      );

      showFeedback('Thank you for your feedback!', 'success');
    } catch (error) {
      devError('Failed to vote:', error);
      showFeedback('Failed to record vote', 'error');
    }
  };

  // Review Statistics Component
  const ReviewStatistics = () => (
    <Paper
      sx={{
        p: { xs: 2, md: 3 },
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          color: 'secondary.main',
          fontWeight: 700,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <AnalyticsIcon />
        Review Analytics
      </Typography>

      <Grid container spacing={3}>
        {/* Overall Rating */}
        <Grid item xs={12} md={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h2"
              sx={{
                color: 'secondary.main',
                fontWeight: 800,
                fontSize: { xs: '2.5rem', sm: '3rem' },
                mb: 1,
              }}
            >
              {overallStats.averageRating.toFixed(1)}
            </Typography>
            <Rating
              value={overallStats.averageRating}
              precision={0.1}
              readOnly
              size="large"
              sx={{
                mb: 2,
                '& .MuiRating-iconFilled': {
                  color: 'secondary.main',
                },
              }}
            />
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Based on {overallStats.totalReviews} reviews
            </Typography>
          </Box>
        </Grid>

        {/* Rating Distribution */}
        <Grid item xs={12} md={4}>
          <Stack spacing={1}>
            {[5, 4, 3, 2, 1].map((rating) => (
              <Stack
                key={rating}
                direction="row"
                alignItems="center"
                spacing={2}
              >
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', minWidth: '20px' }}
                >
                  {rating}
                </Typography>
                <StarIcon sx={{ color: 'secondary.main', fontSize: 16 }} />
                <LinearProgress
                  variant="determinate"
                  value={
                    overallStats.totalReviews > 0
                      ? (overallStats.ratingDistribution[rating] /
                          overallStats.totalReviews) *
                        100
                      : 0
                  }
                  sx={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: (t) => alpha(t.palette.text.primary, 0.1),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'secondary.main',
                      borderRadius: 4,
                    },
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', minWidth: '30px' }}
                >
                  {overallStats.ratingDistribution[rating] || 0}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Grid>

        {/* Category Ratings */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            <Typography
              variant="subtitle1"
              sx={{ color: 'secondary.main', fontWeight: 600 }}
            >
              Category Breakdown
            </Typography>
            {Object.entries(reviewStats.categories || {}).map(
              ([category, rating]) => (
                <Stack
                  key={category}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography
                    variant="body2"
                    sx={{ color: 'text.primary' }}
                  >
                    {category}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Rating
                      value={rating}
                      precision={0.1}
                      readOnly
                      size="small"
                      sx={{
                        '& .MuiRating-iconFilled': {
                          color: 'secondary.main',
                        },
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'secondary.main',
                        fontWeight: 600,
                        minWidth: '30px',
                      }}
                    >
                      {Number(rating || 0).toFixed(1)}
                    </Typography>
                  </Stack>
                </Stack>
              ),
            )}
          </Stack>
        </Grid>
      </Grid>

      {/* Recent Trends â€” computed from actual review data */}
      <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={3}>
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              This Month
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography
                variant="h6"
                sx={{ color: 'success.main', fontWeight: 700 }}
              >
                {reviews.filter(r => {
                  const d = new Date(r.createdAt);
                  const now = new Date();
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }).length}
              </Typography>
              <TrendingUpIcon sx={{ color: 'success.main', fontSize: 20 }} />
            </Stack>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Last Month
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: 'text.primary', fontWeight: 600 }}
            >
              {reviews.filter(r => {
                const d = new Date(r.createdAt);
                const now = new Date();
                const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
                const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
                return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
              }).length}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Response Rate
            </Typography>
            <Typography variant="h6" sx={{ color: 'secondary.main', fontWeight: 700 }}>
              {reviews.length > 0
                ? `${Math.round((reviews.filter(r => r.hasReply).length / reviews.length) * 100)}%`
                : 'â€”'}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Paper>
  );

  // Review Card Component
  // âœ… MOBILE-AUDIT P3: removed motion.div wrapper from ReviewCard
  const ReviewCard = ({ review }) => {
    const reviewerAvatar = resolveMediaAssetUrl(review.reviewer?.avatar);
    const replyAvatar = resolveProfileImageUrl(user || {});
    const jobVisual = resolveMediaAssetUrl(review.job?.image || review.job?.gallery);

    return (
      <Card
        sx={{
          // âœ… MOBILE-AUDIT P4: solid bg, simple top border instead of gradient card + ::before
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderTop: `3px solid ${
            review.rating >= 4
              ? theme.palette.success.main
              : review.rating >= 3
                ? theme.palette.secondary.main
                : '#FF5722'
          }`,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Stack direction="row" spacing={2} sx={{ flex: 1 }}>
              <Avatar
                src={reviewerAvatar}
                alt={review.reviewer?.name || 'Reviewer avatar'}
                sx={{
                  width: 50,
                  height: 50,
                  bgcolor: alpha(theme.palette.secondary.main, 0.2),
                  color: 'secondary.main',
                }}
              >
                {review.reviewer?.name?.charAt(0) || '?'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 0.5 }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'text.primary',
                      fontWeight: 600,
                      fontSize: '1.1rem',
                    }}
                  >
                    {review.reviewer?.name || 'Unknown User'}
                  </Typography>
                  {review.reviewer?.isVerified && (
                    <Tooltip title="Verified reviewer">
                      <VerifiedIcon sx={{ color: 'info.main', fontSize: 20 }} />
                    </Tooltip>
                  )}
                </Stack>
                <Stack direction="row" spacing={0.75} sx={{ mb: 0.75, flexWrap: 'wrap' }}>
                  <Chip
                    size="small"
                    label={review.reviewer?.isVerified ? 'Identity verified' : 'Unverified reviewer'}
                    color={review.reviewer?.isVerified ? 'info' : 'default'}
                    variant={review.reviewer?.isVerified ? 'filled' : 'outlined'}
                    sx={{ height: 22, fontWeight: 600 }}
                  />
                  <Chip
                    size="small"
                    label={`Posted ${safeFormatRelative(review.createdAt)}`}
                    variant="outlined"
                    sx={{ height: 22 }}
                  />
                </Stack>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Rating
                    value={review.rating}
                    readOnly
                    size="small"
                    sx={{
                      '& .MuiRating-iconFilled': {
                        color: 'secondary.main',
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.disabled' }}
                  >
                    {safeFormatRelative(review.createdAt)}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
            <IconButton
              size="small"
              aria-label="Review options"
              onClick={(e) => {
                setSelectedReview(review);
                setMoreMenuAnchor(e.currentTarget);
              }}
              sx={{
                color: 'text.disabled',
                '&:hover': {
                  color: 'secondary.main',
                },
              }}
            >
              <MoreVertIcon />
            </IconButton>
          </Stack>

          {/* Job Info */}
          <Paper
            sx={{
              p: 2,
              mb: 2,
              background: 'rgba(255,215,0,0.05)',
              border: '1px solid rgba(255,215,0,0.1)',
              borderRadius: 2,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 68,
                  height: 68,
                  borderRadius: 2,
                  overflow: 'hidden',
                  flexShrink: 0,
                  bgcolor: alpha(theme.palette.secondary.main, 0.12),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid',
                  borderColor: alpha(theme.palette.secondary.main, 0.18),
                }}
              >
                {jobVisual ? (
                  <Box
                    component="img"
                    src={jobVisual}
                    alt={review.job?.title || 'Completed job'}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <WorkIcon sx={{ color: 'secondary.main' }} />
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ color: 'secondary.main', fontWeight: 600 }}
                >
                  {review.job?.title || 'Deleted Job'}
                </Typography>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{ mt: 0.5, flexWrap: 'wrap' }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary' }}
                  >
                    Completed:{' '}
                    {safeFormatDate(review.job?.completedDate, 'MMM dd, yyyy')}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'success.main', fontWeight: 600 }}
                  >
                    {typeof review.job?.budget === 'number'
                      ? `GHâ‚µ${review.job.budget.toLocaleString()}`
                      : review.job?.budget || 'â€”'}
                  </Typography>
                  {review.job?.gallery?.length > 1 && (
                    <Chip
                      label={`${review.job.gallery.length} project visuals`}
                      size="small"
                      sx={{
                        height: 22,
                        bgcolor: alpha(theme.palette.common.white, 0.7),
                        color: 'text.primary',
                        fontWeight: 700,
                      }}
                    />
                  )}
                </Stack>
              </Box>
            </Stack>
          </Paper>

          {/* Review Content */}
          <Typography
            variant="h6"
            sx={{
              color: 'text.primary',
              fontWeight: 600,
              mb: 2,
              fontSize: '1.1rem',
            }}
          >
            {review.title}
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: 'text.primary',
              lineHeight: 1.6,
              mb: 2,
            }}
          >
            {review.comment}
          </Typography>

          {/* Categories */}
          <Stack
            direction="row"
            spacing={1}
            sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}
          >
            {(review.categories || []).map((category) => (
              <Chip
                key={category}
                label={category}
                size="small"
                sx={{
                  backgroundColor: alpha(theme.palette.secondary.main, 0.2),
                  color: 'secondary.main',
                  fontSize: '0.75rem',
                }}
              />
            ))}
          </Stack>

          {/* Reply Section */}
          {review.hasReply && review.reply && (
            <Paper
              sx={{
                p: 2,
                mt: 2,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 2,
                borderLeft: `3px solid ${theme.palette.secondary.main}`,
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <Avatar
                  src={replyAvatar}
                  alt={user?.firstName || 'Your avatar'}
                  sx={{
                    width: 24,
                    height: 24,
                    bgcolor: alpha(theme.palette.secondary.main, 0.2),
                    color: 'secondary.main',
                  }}
                >
                  {user?.firstName?.charAt(0)}
                </Avatar>
                <Typography
                  variant="caption"
                  sx={{ color: 'secondary.main', fontWeight: 600 }}
                >
                  Your Reply
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.disabled' }}
                >
                  {safeFormatRelative(review.reply.createdAt)}
                </Typography>
              </Stack>
              <Typography
                variant="body2"
                sx={{ color: 'text.primary' }}
              >
                {review.reply.text}
              </Typography>
            </Paper>
          )}
        </CardContent>

        <CardActions sx={{ px: 3, pb: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ width: '100%' }}
          >
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                startIcon={<ThumbUpIcon />}
                onClick={() => handleHelpfulVote(review.id, true)}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'success.main',
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                  },
                }}>
                {review.helpfulVotes}
              </Button>
              <Button
                size="small"
                startIcon={<ThumbDownIcon />}
                onClick={() => handleHelpfulVote(review.id, false)}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'error.main',
                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                  },
                }}>
                {review.unhelpfulVotes}
              </Button>
            </Stack>

            {!review.hasReply && (
              <Button
                size="small"
                startIcon={<ReplyIcon />}
                onClick={() => {
                  setSelectedReview(review);
                  setReplyDialog(true);
                }}
                sx={{
                  color: 'secondary.main',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                  },
                }}
              >
                Reply
              </Button>
            )}
          </Stack>
        </CardActions>
        <Box sx={{ px: 3, pb: 2.25 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Helpful votes come from signed-in users. Use the menu to report a review when details look suspicious.
          </Typography>
        </Box>
      </Card>
    );
  };

  // Tab panels
  const tabPanels = [
    { label: 'All Reviews', value: 0 },
    { label: 'Recent', value: 1 },
    { label: 'Needs Reply', value: 2 },
    { label: 'Analytics', value: 3 },
  ];

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={3}>
          {[...Array(3)].map((_, index) => (
            <Skeleton
              key={`reviews-page-skeleton-${index}`}
              variant="rectangular"
              height={300}
              sx={{ borderRadius: 3 }}
            />
          ))}
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: 'background.default',
        p: { xs: 2, md: 3 },
        pb: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
      }}
    >
      <Helmet><title>Reviews | Kelmah</title></Helmet>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          spacing={2}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                color: 'secondary.main',
                fontWeight: 800,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                mb: 0.5,
              }}
            >
              Reviews & Feedback
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '0.9rem', sm: '1rem' },
              }}
            >
              Read client feedback and post clear, respectful replies.
            </Typography>
          </Box>

          <IconButton
            onClick={() => loadReviews()}
            aria-label="Refresh reviews"
            sx={{
              background: alpha(theme.palette.secondary.main, 0.1),
              border: '1px solid rgba(255,215,0,0.3)',
              minWidth: 44,
              minHeight: 44,
              '&:hover': {
                background: alpha(theme.palette.secondary.main, 0.2),
              },
            }}
          >
            <RefreshIcon sx={{ color: 'secondary.main' }} />
          </IconButton>
        </Stack>
      </Box>

      {/* Tabs */}
      <Paper
        sx={{
          // âœ… MOBILE-AUDIT P5: replaced hardcoded dark gradient with theme surface
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          mb: 3,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => {
            setActiveTab(newValue);
            // Sync filter state with tab selection
            if (newValue === 0) setSelectedFilter('all');
            else if (newValue === 1) setSelectedFilter('recent');
            else if (newValue === 2) setSelectedFilter('needs-reply');
          }}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            '& .MuiTab-root': {
              color: 'text.secondary',
              fontWeight: 600,
              minWidth: { xs: 'auto', md: 120 },
              '&.Mui-selected': {
                color: 'secondary.main',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'secondary.main',
            },
          }}
        >
          {tabPanels.map((panel) => (
            <Tab key={panel.value} label={panel.label} />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 3 ? (
        <ReviewStatistics />
      ) : (
        <>
          {/* Search and Filters */}
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              mb: 3,
              // âœ… MOBILE-AUDIT P4: solid bg instead of gradient
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              sx={{ mb: 2 }}
            >
              <TextField
                placeholder="Search by client name, job title, or review words"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: (t) => alpha(t.palette.text.primary, 0.05),
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: 'rgba(255,215,0,0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255,215,0,0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'secondary.main',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: 'text.primary',
                    '&::placeholder': {
                      color: 'text.disabled',
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <SearchIcon
                      sx={{ color: 'text.disabled', mr: 1 }}
                    />
                  ),
                }}
              />

              <MobileFilterSheet
                title="Filter & Sort"
                activeCount={(selectedFilter !== 'all' ? 1 : 0) + (selectedSort !== 'newest' ? 1 : 0)}
                onReset={() => { setSelectedFilter('all'); setSelectedSort('newest'); }}
              >
                <Stack spacing={2}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Filter</Typography>
                  {[
                    { value: 'all', label: 'All Reviews' },
                    { value: '5-star', label: '5 Star Reviews' },
                    { value: '4-star', label: '4 Star Reviews' },
                    { value: 'recent', label: 'Recent (Last 7 days)' },
                    { value: 'verified', label: 'Verified Reviewers' },
                    { value: 'with-reply', label: 'With Reply' },
                    { value: 'needs-reply', label: 'Needs Reply' },
                  ].map((filter) => (
                    <Chip
                      key={filter.value}
                      label={filter.label}
                      variant={selectedFilter === filter.value ? 'filled' : 'outlined'}
                      color={selectedFilter === filter.value ? 'primary' : 'default'}
                      onClick={() => setSelectedFilter(filter.value)}
                      sx={{ justifyContent: 'flex-start' }}
                    />
                  ))}
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Sort</Typography>
                  {[
                    { value: 'newest', label: 'Newest First' },
                    { value: 'oldest', label: 'Oldest First' },
                    { value: 'highest-rated', label: 'Highest Rated' },
                    { value: 'lowest-rated', label: 'Lowest Rated' },
                    { value: 'most-helpful', label: 'Most Helpful' },
                  ].map((sort) => (
                    <Chip
                      key={sort.value}
                      label={sort.label}
                      variant={selectedSort === sort.value ? 'filled' : 'outlined'}
                      color={selectedSort === sort.value ? 'primary' : 'default'}
                      onClick={() => setSelectedSort(sort.value)}
                      sx={{ justifyContent: 'flex-start' }}
                    />
                  ))}
                </Stack>
              </MobileFilterSheet>
            </Stack>

            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {filteredReviews.length} review
              {filteredReviews.length !== 1 ? 's' : ''} found
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1.25, flexWrap: 'wrap', gap: 1 }}>
              <Chip
                size="small"
                variant="outlined"
                label={`Filter: ${REVIEW_FILTER_LABELS[selectedFilter] || 'All Reviews'}`}
              />
              <Chip
                size="small"
                variant="outlined"
                label={`Sort: ${REVIEW_SORT_LABELS[selectedSort] || 'Newest First'}`}
              />
              <Chip
                size="small"
                color="info"
                variant="outlined"
                label={`${reviewCredibilitySummary.verifiedCount} verified reviewer${reviewCredibilitySummary.verifiedCount === 1 ? '' : 's'}`}
              />
              <Chip
                size="small"
                color="success"
                variant="outlined"
                label={`${reviewCredibilitySummary.recentCount} recent in 30 days`}
              />
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
              Moderation note: report suspicious reviews from the card menu so support can investigate.
            </Typography>
          </Paper>

          {/* Reviews List */}
          {filteredReviews.length === 0 ? (
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                // âœ… MOBILE-AUDIT P5: replaced hardcoded dark gradient with theme surface
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
              }}
            >
              <StarIcon
                sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
              />
              <Typography
                variant="h6"
                sx={{ color: 'text.secondary', mb: 1 }}
              >
                No reviews found
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'text.disabled', mb: 2 }}
              >
                Try changing your search words or filters.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedFilter('all');
                }}
                sx={{ color: 'text.secondary', borderColor: 'divider', minHeight: 44, '&:hover': { borderColor: 'text.disabled' } }}
              >
                Clear search and filters
              </Button>
            </Paper>
          ) : (
            <Stack spacing={3}>
                {filteredReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
            </Stack>
          )}
        </>
      )}

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
      >
        {[
          { value: 'all', label: 'All Reviews' },
          { value: '5-star', label: '5 Star Reviews' },
          { value: '4-star', label: '4 Star Reviews' },
          { value: 'recent', label: 'Recent (Last 7 days)' },
          { value: 'verified', label: 'Verified Reviewers' },
          { value: 'with-reply', label: 'With Reply' },
          { value: 'needs-reply', label: 'Needs Reply' },
        ].map((filter) => (
          <MenuItem
            key={filter.value}
            selected={selectedFilter === filter.value}
            onClick={() => {
              setSelectedFilter(filter.value);
              setFilterMenuAnchor(null);
            }}
          >
            {filter.label}
          </MenuItem>
        ))}
      </Menu>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => setSortMenuAnchor(null)}
      >
        {[
          { value: 'newest', label: 'Newest First' },
          { value: 'oldest', label: 'Oldest First' },
          { value: 'highest-rated', label: 'Highest Rated' },
          { value: 'lowest-rated', label: 'Lowest Rated' },
          { value: 'most-helpful', label: 'Most Helpful' },
        ].map((sort) => (
          <MenuItem
            key={sort.value}
            selected={selectedSort === sort.value}
            onClick={() => {
              setSelectedSort(sort.value);
              setSortMenuAnchor(null);
            }}
          >
            {sort.label}
          </MenuItem>
        ))}
      </Menu>

      {/* More Menu */}
      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={() => setMoreMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            setReplyDialog(true);
            setMoreMenuAnchor(null);
          }}
        >
          <ListItemIcon>
            <ReplyIcon />
          </ListItemIcon>
          <ListItemText>Reply</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            // Use Web Share API if available, otherwise copy to clipboard
            const reviewUrl = `${window.location.origin}/reviews/${selectedReview?._id || selectedReview?.id || ''}`;
            if (navigator.share) {
              navigator.share({ title: 'Kelmah Review', url: reviewUrl }).catch(() => {});
            } else if (navigator.clipboard) {
              navigator.clipboard.writeText(reviewUrl);
            }
            setMoreMenuAnchor(null);
          }}
        >
          <ListItemIcon>
            <ShareIcon />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            const reviewId = selectedReview?._id || selectedReview?.id;
            setMoreMenuAnchor(null);
            navigate('/support', {
              state: {
                reportContext: 'review',
                reportReviewId: reviewId || null,
                reportedUserId: selectedReview?.reviewer?.id || null,
              },
            });
          }}
        >
          <ListItemIcon>
            <ReportIcon />
          </ListItemIcon>
          <ListItemText>Report Review</ListItemText>
        </MenuItem>
      </Menu>

      {/* Reply Dialog */}
      <Dialog
        open={replyDialog}
        onClose={() => {
          setReplyDialog(false);
          setReplyText('');
          setSelectedReview(null);
        }}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        aria-labelledby="reply-dialog-title"
        PaperProps={{
          sx: {
            // âœ… MOBILE-AUDIT P5: replaced hardcoded dark gradient with theme surface
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <DialogTitle id="reply-dialog-title" sx={{ color: 'secondary.main' }}>
          Reply to {selectedReview?.reviewer?.name || 'reviewer'}
        </DialogTitle>
        <DialogContent>
          {selectedReview && (
            <Paper
              sx={{
                p: 2,
                mb: 3,
                background: (theme) => theme.palette.action.hover,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <Rating
                  value={selectedReview.rating}
                  readOnly
                  size="small"
                  sx={{
                    '& .MuiRating-iconFilled': {
                      color: 'secondary.main',
                    },
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary' }}
                >
                  {selectedReview.title}
                </Typography>
              </Stack>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.primary',
                  fontStyle: 'italic',
                }}
              >
                "{selectedReview.comment}"
              </Typography>
            </Paper>
          )}

          <TextField
            autoFocus
            fullWidth
            multiline
            rows={4}
            placeholder="Write a short, polite reply"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: (t) => alpha(t.palette.text.primary, 0.05),
                '& fieldset': {
                  borderColor: 'rgba(255,215,0,0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255,215,0,0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'secondary.main',
                },
              },
              '& .MuiInputBase-input': {
                color: 'text.primary',
                '&::placeholder': {
                  color: 'text.disabled',
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setReplyDialog(false);
              setReplyText('');
              setSelectedReview(null);
            }}
            sx={{ color: 'text.secondary', minHeight: 44 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReply}
            disabled={!replyText.trim() || replySubmitting}
            sx={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
              color: '#000',
              fontWeight: 700,
              minHeight: 44,
              '&:hover': {
                background: 'linear-gradient(135deg, #FFC000 0%, #FFB300 100%)',
              },
              '&:disabled': {
                background: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.3)',
              },
            }}
          >
            Post reply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Snackbar */}
      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
          severity={feedback.severity}
          sx={{ width: '100%' }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EnhancedReviewsPage;



