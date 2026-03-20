import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Avatar,
  Rating,
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
import { formatDistanceToNow } from 'date-fns';
import { Helmet } from 'react-helmet-async';

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
        if (import.meta.env.DEV) console.error(err);
        setError('Failed to load reviews. Please try again later.');
      })
      .finally(() => setLoading(false));
  }, [user?.id, user?._id, page]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 0.5, sm: 2 } }}>
        {/* Summary Skeleton */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} mb={4}>
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
    );
  }

  const totalReviews = reviews.length;
  const averageRating = totalReviews
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;
  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 0.5, sm: 2 } }}>
      <Helmet><title>Worker Reviews | Kelmah</title></Helmet>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            My Reviews
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Average rating: {averageRating.toFixed(1)} ({totalReviews} reviews)
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={4}>
        {/* Left column for summary */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={(theme) => ({
              p: 3,
              borderRadius: theme.spacing(2),
              backgroundColor: alpha(theme.palette.primary.main, 0.7),
              backdropFilter: 'blur(10px)',
              border: `2px solid ${theme.palette.secondary.main}`,
              boxShadow: `inset 0 0 8px rgba(255, 215, 0, 0.5)`,
              transition:
                'box-shadow 0.3s ease-in-out, border-color 0.3s ease-in-out',
              '&:hover': {
                boxShadow: `0 0 12px rgba(255, 215, 0, 0.3), inset 0 0 8px rgba(255, 215, 0, 0.5)`,
                borderColor: theme.palette.secondary.light,
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
          </Paper>
        </Grid>

        {/* Right column for reviews list */}
        <Grid item xs={12} md={8}>
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
        </Grid>
      </Grid>
      <Box display="flex" justifyContent="center" mt={4}>
        <Pagination
          count={pagination.pageCount}
          page={page}
          onChange={handlePageChange}
          color="secondary"
        />
      </Box>
    </Container>
  );
};

export default WorkerReviewsPage;
