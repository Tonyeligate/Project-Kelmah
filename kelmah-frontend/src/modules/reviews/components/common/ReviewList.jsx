import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Alert, List, ListItem, ListItemAvatar, Avatar, ListItemText, Rating, Divider } from '@mui/material';
import { RateReview as ReviewIcon } from '@mui/icons-material';
import { formatRelativeTime } from '../../../../utils/formatters';

const ReviewList = ({ reviews = [], emptyMessage = 'No reviews yet' }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <ReviewIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <List disablePadding>
      {reviews.map((review, index) => (
        <React.Fragment key={review.id || review._id || index}>
          <ListItem alignItems="flex-start" sx={{ px: 0 }}>
            <ListItemAvatar>
              <Avatar src={review.reviewerAvatar} alt={review.reviewerName || 'Reviewer'}>
                {(review.reviewerName || 'R')[0]}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2">{review.reviewerName || 'Anonymous'}</Typography>
                  <Rating value={review.rating || 0} size="small" readOnly precision={0.5} />
                </Box>
              }
              secondary={
                <>
                  <Typography variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
                    {review.comment || review.text || ''}
                  </Typography>
                  {review.createdAt && (
                    <Typography variant="caption" color="text.secondary">
                      {formatRelativeTime(review.createdAt)}
                    </Typography>
                  )}
                </>
              }
            />
          </ListItem>
          {index < reviews.length - 1 && <Divider variant="inset" component="li" />}
        </React.Fragment>
      ))}
    </List>
  );
};

ReviewList.propTypes = {
  reviews: PropTypes.array,
  emptyMessage: PropTypes.string,
};

export default ReviewList;
