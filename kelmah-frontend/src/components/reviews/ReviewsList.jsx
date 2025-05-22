import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Divider, Grid, Pagination, CircularProgress } from '@mui/material';
import ReviewCard from './ReviewCard';
import EmptyState from '../common/EmptyState';

const ReviewsList = ({
  reviews,
  loading = false,
  error = null,
  title = 'Reviews',
  compact = false,
  showRecipient = true,
  variant = 'outlined',
  totalPages = 1,
  currentPage = 1,
  onPageChange,
  emptyStateMessage = 'No reviews found',
  emptyStateIcon = 'review',
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <EmptyState 
        message={emptyStateMessage} 
        icon={emptyStateIcon}
        sx={{ my: 4 }}
      />
    );
  }

  return (
    <Box>
      {title && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
          <Divider sx={{ mt: 1 }} />
        </Box>
      )}

      <Grid container spacing={2}>
        {reviews.map((review) => (
          <Grid item xs={12} key={review.id || `review-${review.createdAt}`}>
            <ReviewCard
              review={review}
              compact={compact}
              showRecipient={showRecipient}
              variant={variant}
            />
          </Grid>
        ))}
      </Grid>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={onPageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
};

ReviewsList.propTypes = {
  reviews: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      reviewer: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string.isRequired,
        avatar: PropTypes.string,
        title: PropTypes.string,
      }).isRequired,
      recipient: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string.isRequired,
        avatar: PropTypes.string,
        title: PropTypes.string,
      }),
      overallRating: PropTypes.number.isRequired,
      communicationRating: PropTypes.number,
      qualityRating: PropTypes.number,
      timelinessRating: PropTypes.number,
      comment: PropTypes.string,
      createdAt: PropTypes.string.isRequired,
    })
  ),
  loading: PropTypes.bool,
  error: PropTypes.string,
  title: PropTypes.string,
  compact: PropTypes.bool,
  showRecipient: PropTypes.bool,
  variant: PropTypes.oneOf(['outlined', 'elevation']),
  totalPages: PropTypes.number,
  currentPage: PropTypes.number,
  onPageChange: PropTypes.func,
  emptyStateMessage: PropTypes.string,
  emptyStateIcon: PropTypes.string,
};

export default ReviewsList; 