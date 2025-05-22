import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Rating,
  Chip,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { ThumbUp, CalendarToday } from '@mui/icons-material';

const ReviewCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(1),
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: theme.shadows[3],
  },
}));

const ReviewAuthor = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(1.5),
}));

const ReviewList = ({ reviews, maxItems = null }) => {
  // If maxItems is provided, limit the number of reviews shown
  const displayedReviews = maxItems ? reviews.slice(0, maxItems) : reviews;

  if (!reviews || reviews.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography variant="body1" color="text.secondary">
          No reviews available yet.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {displayedReviews.map((review, index) => (
        <React.Fragment key={review.id || index}>
          <ReviewCard elevation={1}>
            <CardContent>
              <ReviewAuthor>
                <Avatar 
                  src={review.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.author)}&background=random`} 
                  alt={review.author}
                  sx={{ width: 40, height: 40, mr: 2 }}
                />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {review.author}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarToday sx={{ fontSize: 14, mr: 0.5, color: '#757575' }} />
                    <Typography variant="body2" color="text.secondary">
                      {new Date(review.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Typography>
                  </Box>
                </Box>
              </ReviewAuthor>
              
              <Box sx={{ mb: 1.5 }}>
                <Rating 
                  value={review.rating} 
                  readOnly 
                  precision={0.5} 
                  sx={{ color: '#D4AF37' }}
                />
              </Box>
              
              <Typography variant="body1" paragraph>
                {review.comment}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {review.jobType && (
                  <Chip 
                    label={review.jobType}
                    size="small" 
                    sx={{ bgcolor: 'rgba(26, 26, 26, 0.08)' }}
                  />
                )}
                
                {review.likes > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ThumbUp sx={{ fontSize: 14, mr: 0.5, color: '#757575' }} />
                    <Typography variant="body2" color="text.secondary">
                      {review.likes}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </ReviewCard>
          
          {/* Add a divider between items except for the last one */}
          {index < displayedReviews.length - 1 && (
            <Box sx={{ my: 2, opacity: 0.1 }}>
              <Divider />
            </Box>
          )}
        </React.Fragment>
      ))}
    </>
  );
};

export default ReviewList; 