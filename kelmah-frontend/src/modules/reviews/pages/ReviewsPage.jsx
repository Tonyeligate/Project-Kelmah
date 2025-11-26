import React, { useState, useEffect, useMemo } from 'react';
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
  useMediaQuery,
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
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '../../auth/hooks/useAuth';
import reviewService from '../services/reviewService';

// Enhanced Reviews Page with comprehensive review management
const EnhancedReviewsPage = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true); // Fix: Added missing isLoading state
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');
  const [activeTab, setActiveTab] = useState(0); // Fix: Added missing activeTab state
  const [reviewStats, setReviewStats] = useState({}); // Fix: Added missing reviewStats state
  const [replyDialog, setReplyDialog] = useState(false); // Fix: Added missing replyDialog state
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

  // Real review data is fetched from backend (mocks disabled in production)

  // Utility functions
  const showFeedback = (message, severity = 'info') => {
    setFeedback({ open: true, message, severity });
  };

  // Initialize data
  useEffect(() => {
    const loadReviews = async () => {
      setIsLoading(true);
      setLoading(true);
      try {
        if (!user?.id) {
          setReviews([]);
          setReviewStats({});
        } else {
          const [stats, workerReviews] = await Promise.all([
            reviewService.getReviewStats(user.id),
            reviewService.getUserReviews(user.id, 1, 20),
          ]);
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
        console.error('Failed to load reviews:', error);
        showFeedback('Failed to load reviews', 'error');
      } finally {
        setIsLoading(false);
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

  // Filter and sort reviews
  useEffect(() => {
    let filtered = [...reviews];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (review) =>
          review.title.toLowerCase().includes(query) ||
          review.comment.toLowerCase().includes(query) ||
          review.reviewer.name.toLowerCase().includes(query) ||
          review.job.title.toLowerCase().includes(query),
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
        filtered = filtered.filter((review) => review.reviewer.isVerified);
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

  const handleReply = async () => {
    if (!replyText.trim() || !selectedReview) return;

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update review with reply
      setReviews((prev) =>
        prev.map((review) =>
          review.id === selectedReview.id
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
      console.error('Failed to post reply:', error);
      showFeedback('Failed to post reply', 'error');
    }
  };

  const handleHelpfulVote = async (reviewId, isHelpful) => {
    try {
      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                helpfulVotes: isHelpful
                  ? review.helpfulVotes + 1
                  : review.helpfulVotes,
                unhelpfulVotes: !isHelpful
                  ? review.unhelpfulVotes + 1
                  : review.unhelpfulVotes,
              }
            : review,
        ),
      );

      showFeedback('Thank you for your feedback!', 'success');
    } catch (error) {
      console.error('Failed to vote:', error);
      showFeedback('Failed to record vote', 'error');
    }
  };

  // Review Statistics Component
  const ReviewStatistics = () => (
    <Paper
      sx={{
        p: 3,
        background:
          'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.98) 100%)',
        border: '1px solid rgba(255,215,0,0.2)',
        borderRadius: 3,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          color: '#FFD700',
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
                color: '#FFD700',
                fontWeight: 800,
                fontSize: { xs: '2.5rem', sm: '3rem' },
                mb: 1,
              }}
            >
              {reviewStats.overall?.averageRating.toFixed(1)}
            </Typography>
            <Rating
              value={reviewStats.overall?.averageRating || 0}
              precision={0.1}
              readOnly
              size="large"
              sx={{
                mb: 2,
                '& .MuiRating-iconFilled': {
                  color: '#FFD700',
                },
              }}
            />
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Based on {reviewStats.overall?.totalReviews} reviews
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
                  sx={{ color: 'rgba(255,255,255,0.7)', minWidth: '20px' }}
                >
                  {rating}
                </Typography>
                <StarIcon sx={{ color: '#FFD700', fontSize: 16 }} />
                <LinearProgress
                  variant="determinate"
                  value={
                    (reviewStats.overall?.ratingDistribution[rating] /
                      reviewStats.overall?.totalReviews) *
                    100
                  }
                  sx={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#FFD700',
                      borderRadius: 4,
                    },
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.7)', minWidth: '30px' }}
                >
                  {reviewStats.overall?.ratingDistribution[rating] || 0}
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
              sx={{ color: '#FFD700', fontWeight: 600 }}
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
                    sx={{ color: 'rgba(255,255,255,0.8)' }}
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
                          color: '#FFD700',
                        },
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#FFD700',
                        fontWeight: 600,
                        minWidth: '30px',
                      }}
                    >
                      {rating.toFixed(1)}
                    </Typography>
                  </Stack>
                </Stack>
              ),
            )}
          </Stack>
        </Grid>
      </Grid>

      {/* Recent Trends */}
      <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Stack direction="row" alignItems="center" spacing={3}>
          <Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              This Month
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography
                variant="h6"
                sx={{ color: '#4CAF50', fontWeight: 700 }}
              >
                {reviewStats.recent?.thisMonth}
              </Typography>
              <TrendingUpIcon sx={{ color: '#4CAF50', fontSize: 20 }} />
            </Stack>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Last Month
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}
            >
              {reviewStats.recent?.lastMonth}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Response Rate
            </Typography>
            <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 700 }}>
              87%
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Paper>
  );

  // Review Card Component
  const ReviewCard = ({ review, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card
        sx={{
          background:
            'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.98) 100%)',
          border: '1px solid rgba(255,215,0,0.2)',
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${
              review.rating >= 4
                ? '#4CAF50'
                : review.rating >= 3
                  ? '#FFD700'
                  : '#FF5722'
            } 0%, ${alpha(
              review.rating >= 4
                ? '#4CAF50'
                : review.rating >= 3
                  ? '#FFD700'
                  : '#FF5722',
              0.8,
            )} 100%)`,
          },
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
                src={review.reviewer.avatar}
                sx={{
                  width: 50,
                  height: 50,
                  bgcolor: alpha('#FFD700', 0.2),
                  color: '#FFD700',
                }}
              >
                {review.reviewer.name.charAt(0)}
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
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '1.1rem',
                    }}
                  >
                    {review.reviewer.name}
                  </Typography>
                  {review.reviewer.isVerified && (
                    <Tooltip title="Verified reviewer">
                      <VerifiedIcon sx={{ color: '#2196F3', fontSize: 20 }} />
                    </Tooltip>
                  )}
                </Stack>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Rating
                    value={review.rating}
                    readOnly
                    size="small"
                    sx={{
                      '& .MuiRating-iconFilled': {
                        color: '#FFD700',
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    {formatDistanceToNow(new Date(review.createdAt), {
                      addSuffix: true,
                    })}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
            <IconButton
              size="small"
              onClick={(e) => {
                setSelectedReview(review);
                setMoreMenuAnchor(e.currentTarget);
              }}
              sx={{
                color: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  color: '#FFD700',
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
              <WorkIcon sx={{ color: '#FFD700' }} />
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ color: '#FFD700', fontWeight: 600 }}
                >
                  {review.job.title}
                </Typography>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{ mt: 0.5 }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    Completed:{' '}
                    {format(new Date(review.job.completedDate), 'MMM dd, yyyy')}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: '#4CAF50', fontWeight: 600 }}
                  >
                    {review.job.budget}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Paper>

          {/* Review Content */}
          <Typography
            variant="h6"
            sx={{
              color: '#fff',
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
              color: 'rgba(255,255,255,0.8)',
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
            {review.categories.map((category) => (
              <Chip
                key={category}
                label={category}
                size="small"
                sx={{
                  backgroundColor: alpha('#FFD700', 0.2),
                  color: '#FFD700',
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
                borderLeft: '3px solid #FFD700',
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <Avatar
                  src={user?.profileImage}
                  sx={{
                    width: 24,
                    height: 24,
                    bgcolor: alpha('#FFD700', 0.2),
                    color: '#FFD700',
                  }}
                >
                  {user?.firstName?.charAt(0)}
                </Avatar>
                <Typography
                  variant="caption"
                  sx={{ color: '#FFD700', fontWeight: 600 }}
                >
                  Your Reply
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  {formatDistanceToNow(new Date(review.reply.createdAt), {
                    addSuffix: true,
                  })}
                </Typography>
              </Stack>
              <Typography
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.8)' }}
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
                  color: 'rgba(255,255,255,0.7)',
                  '&:hover': {
                    color: '#4CAF50',
                    backgroundColor: alpha('#4CAF50', 0.1),
                  },
                }}
              >
                {review.helpfulVotes}
              </Button>
              <Button
                size="small"
                startIcon={<ThumbDownIcon />}
                onClick={() => handleHelpfulVote(review.id, false)}
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  '&:hover': {
                    color: '#F44336',
                    backgroundColor: alpha('#F44336', 0.1),
                  },
                }}
              >
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
                  color: '#FFD700',
                  '&:hover': {
                    backgroundColor: alpha('#FFD700', 0.1),
                  },
                }}
              >
                Reply
              </Button>
            )}
          </Stack>
        </CardActions>
      </Card>
    </motion.div>
  );

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
              key={index}
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
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        p: { xs: 2, md: 3 },
      }}
    >
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
                color: '#FFD700',
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
                color: 'rgba(255,255,255,0.7)',
                fontSize: { xs: '0.9rem', sm: '1rem' },
              }}
            >
              Manage and respond to client reviews
            </Typography>
          </Box>

          <IconButton
            onClick={() => window.location.reload()}
            sx={{
              background: alpha('#FFD700', 0.1),
              border: '1px solid rgba(255,215,0,0.3)',
              '&:hover': {
                background: alpha('#FFD700', 0.2),
              },
            }}
          >
            <RefreshIcon sx={{ color: '#FFD700' }} />
          </IconButton>
        </Stack>
      </Box>

      {/* Tabs */}
      <Paper
        sx={{
          background:
            'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.98) 100%)',
          border: '1px solid rgba(255,215,0,0.2)',
          borderRadius: 3,
          mb: 3,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 600,
              '&.Mui-selected': {
                color: '#FFD700',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#FFD700',
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
              p: 3,
              mb: 3,
              background:
                'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.98) 100%)',
              border: '1px solid rgba(255,215,0,0.2)',
              borderRadius: 3,
            }}
          >
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <TextField
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: 'rgba(255,215,0,0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255,215,0,0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FFD700',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#fff',
                    '&::placeholder': {
                      color: 'rgba(255,255,255,0.5)',
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <SearchIcon
                      sx={{ color: 'rgba(255,255,255,0.5)', mr: 1 }}
                    />
                  ),
                }}
              />

              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
                sx={{
                  borderColor: 'rgba(255,215,0,0.3)',
                  color: '#FFD700',
                  '&:hover': {
                    borderColor: '#FFD700',
                    backgroundColor: alpha('#FFD700', 0.1),
                  },
                }}
              >
                Filter
              </Button>

              <Button
                variant="outlined"
                startIcon={<SortIcon />}
                onClick={(e) => setSortMenuAnchor(e.currentTarget)}
                sx={{
                  borderColor: 'rgba(255,215,0,0.3)',
                  color: '#FFD700',
                  '&:hover': {
                    borderColor: '#FFD700',
                    backgroundColor: alpha('#FFD700', 0.1),
                  },
                }}
              >
                Sort
              </Button>
            </Stack>

            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {filteredReviews.length} review
              {filteredReviews.length !== 1 ? 's' : ''} found
            </Typography>
          </Paper>

          {/* Reviews List */}
          {filteredReviews.length === 0 ? (
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                background:
                  'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.98) 100%)',
                border: '1px solid rgba(255,215,0,0.2)',
                borderRadius: 3,
              }}
            >
              <StarIcon
                sx={{ fontSize: 64, color: 'rgba(255,255,255,0.3)', mb: 2 }}
              />
              <Typography
                variant="h6"
                sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}
              >
                No reviews found
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Try adjusting your search or filters
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={3}>
              <AnimatePresence>
                {filteredReviews.map((review, index) => (
                  <ReviewCard key={review.id} review={review} index={index} />
                ))}
              </AnimatePresence>
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
        <MenuItem onClick={() => setMoreMenuAnchor(null)}>
          <ListItemIcon>
            <ShareIcon />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => setMoreMenuAnchor(null)}
          sx={{ color: '#F44336' }}
        >
          <ListItemIcon>
            <ReportIcon sx={{ color: '#F44336' }} />
          </ListItemIcon>
          <ListItemText>Report</ListItemText>
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
        PaperProps={{
          sx: {
            background:
              'linear-gradient(135deg, rgba(30,30,30,0.98) 0%, rgba(40,40,40,0.98) 100%)',
            border: '1px solid rgba(255,215,0,0.2)',
          },
        }}
      >
        <DialogTitle sx={{ color: '#FFD700' }}>
          Reply to {selectedReview?.reviewer.name}
        </DialogTitle>
        <DialogContent>
          {selectedReview && (
            <Paper
              sx={{
                p: 2,
                mb: 3,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
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
                      color: '#FFD700',
                    },
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  {selectedReview.title}
                </Typography>
              </Stack>
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255,255,255,0.8)',
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
            placeholder="Write your reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255,255,255,0.05)',
                '& fieldset': {
                  borderColor: 'rgba(255,215,0,0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255,215,0,0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#FFD700',
                },
              },
              '& .MuiInputBase-input': {
                color: '#fff',
                '&::placeholder': {
                  color: 'rgba(255,255,255,0.5)',
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
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReply}
            disabled={!replyText.trim()}
            sx={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
              color: '#000',
              fontWeight: 700,
              '&:hover': {
                background: 'linear-gradient(135deg, #FFC000 0%, #FFB300 100%)',
              },
              '&:disabled': {
                background: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.3)',
              },
            }}
          >
            Post Reply
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

