import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  LinearProgress,
  Divider,
  Stack,
  Alert,
} from '@mui/material';
import { Star as StarIcon } from '@mui/icons-material';
import ReviewCard from '../components/common/ReviewCard';
import Skeleton from '@mui/material/Skeleton';
import useAuth from '../../auth/hooks/useAuth';
import reviewService from '../services/reviewService';
import Pagination from '@mui/material/Pagination';
import { alpha } from '@mui/material/styles';
import { Helmet } from 'react-helmet-async';
import { devError } from '@/modules/common/utils/devLogger';
import PageCanvas from '@/modules/common/components/PageCanvas';

const RatingDistribution = ({ distribution, totalReviews }) => (
  <Box>
    {distribution.map((item) => (
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        key={item.stars}
        mb={0.5}
      >
        <Typography variant="caption" sx={{ width: '60px' }}>
          {item.stars} stars
        </Typography>
        <Box sx={{ flexGrow: 1, mr: 1 }}>
          <LinearProgress
            variant="determinate"
            value={totalReviews > 0 ? (item.count / totalReviews) * 100 : 0}
            sx={{ height: 8, borderRadius: 2 }}
          />
        </Box>
        <Typography variant="caption" sx={{ width: '30px' }}>
          {item.count}
        </Typography>
      </Stack>
    ))}
  </Box>
);

RatingDistribution.propTypes = {
  distribution: PropTypes.arrayOf(
    PropTypes.shape({
      stars: PropTypes.number.isRequired,
      count: PropTypes.number.isRequired,
    }),
  ).isRequired,
  totalReviews: PropTypes.number.isRequired,
};

const WorkerReviewsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [pagination, setPagination] = useState({
    page: 1,
    limit,
    total: 0,
    pageCount: 1,
  });

  useEffect(() => {
    const userId = user?.id || user?._id;
    if (!userId) return;
    setLoading(true);
    reviewService
      .getUserReviews(userId, page, limit, { status: 'approved' })
      .then(({ reviews, pagination }) => {
        setReviews(reviews);
        setPagination(pagination);
      })
      .catch((err) => {
        devError(err);
        setError('Failed to load reviews. Please try again later.');
      })
      .finally(() => setLoading(false));
  }, [user?.id, user?._id, page]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  if (loading) {
    return (
      <PageCanvas
        disableContainer
        sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}
      >
        <Container
          maxWidth="lg"
          sx={{ py: { xs: 2, sm: 4 }, px: { xs: 0.5, sm: 2 } }}
        >
          {/* Summary Skeleton */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            mb={4}
          >
            <Skeleton variant="circular" width={64} height={64} />
            <Box sx={{ flexGrow: 1 }}>
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="text" width="30%" />
            </Box>
          </Stack>
          {/* Reviews Skeletons */}
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Skeleton
                variant="rectangular"
                height={200}
                sx={{ borderRadius: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              {Array.from(new Array(3)).map((_, idx) => (
                <Skeleton
                  key={`worker-review-skeleton-${idx}`}
                  variant="rectangular"
                  height={150}
                  sx={{ mb: 2, borderRadius: 2 }}
                />
              ))}
            </Grid>
          </Grid>
        </Container>
      </PageCanvas>
    );
  }

  const totalReviews = reviews.length;
  const numericRatings = reviews
    .map((review) => Number(review?.rating))
    .filter((value) => Number.isFinite(value));
  const averageRating = numericRatings.length
    ? numericRatings.reduce((sum, value) => sum + value, 0) /
      numericRatings.length
    : 0;
  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((review) => {
      const roundedRating = Math.round(Number(review?.rating) || 0);
      return roundedRating === stars;
    }).length,
  }));

  return (
    <PageCanvas
      disableContainer
      sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}
    >
      <Container
        maxWidth="lg"
        sx={{ py: { xs: 2, sm: 4 }, px: { xs: 0.5, sm: 2 } }}
      >
        <Helmet>
          <title>Worker Reviews | Kelmah</title>
        </Helmet>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {/* Header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          mb={4}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold">
              My Reviews
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Average rating: {averageRating.toFixed(1)} ({totalReviews}{' '}
              reviews)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Reviews from completed jobs appear here.
            </Typography>
          </Box>
        </Stack>

        <Grid container spacing={4}>
          {/* Left column for summary */}
          <Grid item xs={12} md={4}>
            <Paper
              sx={(theme) => ({
                p: { xs: 2, md: 2.5 },
                borderRadius: theme.spacing(2.5),
                backgroundColor: alpha(theme.palette.background.paper, 0.96),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.35)}`,
                boxShadow:
                  theme.palette.mode === 'dark'
                    ? `0 10px 24px ${alpha('#000', 0.35)}`
                    : `0 8px 20px ${alpha('#0f172a', 0.08)}`,
                transition:
                  'box-shadow 0.3s ease-in-out, border-color 0.3s ease-in-out',
                '@media (hover: hover)': {
                  '&:hover': {
                    boxShadow:
                      theme.palette.mode === 'dark'
                        ? `0 14px 28px ${alpha(theme.palette.secondary.main, 0.2)}`
                        : `0 10px 24px ${alpha(theme.palette.secondary.main, 0.16)}`,
                    borderColor: alpha(theme.palette.secondary.main, 0.6),
                  },
                },
              })}
            >
              <Typography variant="h5" fontWeight="600" mb={2}>
                Rating Summary
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <StarIcon color="secondary" sx={{ fontSize: 32 }} />
                <Typography variant="h4" fontWeight="bold">
                  {averageRating.toFixed(1)}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  ({totalReviews} reviews)
                </Typography>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <RatingDistribution
                distribution={ratingDistribution}
                totalReviews={totalReviews}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: 'block' }}
              >
                Ratings are grouped to the nearest full star for faster trust
                scanning.
              </Typography>
            </Paper>
          </Grid>

          {/* Right column for reviews list */}
          <Grid item xs={12} md={8}>
            {reviews.length > 0 ? (
              <Grid container spacing={2}>
                {reviews.map((r) => (
                  <Grid item xs={12} key={r._id}>
                    <ReviewCard
                      review={{
                        id: r._id,
                        author: {
                          name: `${r.reviewer?.firstName || 'Anonymous'} ${r.reviewer?.lastName || ''}`.trim(),
                          avatar: r.reviewer?.profilePicture,
                        },
                        rating: r.rating,
                        content: r.comment,
                        date: r.createdAt,
                        jobTitle: r.job?.title || `Job ${r.job}`,
                        jobImage: r.job?.image,
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: '1px dashed',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No reviews yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Keep completing jobs and asking clients for feedback. New
                  reviews will show here automatically.
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={pagination.pageCount}
            page={page}
            onChange={handlePageChange}
            color="secondary"
            getItemAriaLabel={(type, selectedPage) => {
              if (type === 'page') {
                return `Go to review page ${selectedPage}`;
              }
              if (type === 'next') {
                return 'Go to next review page';
              }
              if (type === 'previous') {
                return 'Go to previous review page';
              }
              if (type === 'first') {
                return 'Go to first review page';
              }
              if (type === 'last') {
                return 'Go to last review page';
              }
              return 'Go to review page';
            }}
          />
        </Box>
      </Container>
    </PageCanvas>
  );
};

export default WorkerReviewsPage;
