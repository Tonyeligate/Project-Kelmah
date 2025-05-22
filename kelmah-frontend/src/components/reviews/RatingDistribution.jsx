import React from 'react';
import { Box, Typography, LinearProgress, Paper, Rating, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Star } from '@mui/icons-material';

// Styled components
const RatingContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  background: 'rgba(26, 26, 26, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 215, 0, 0.1)',
}));

const RatingBarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(1.5),
}));

const RatingBar = styled(LinearProgress)(({ theme }) => ({
  flexGrow: 1,
  height: 8,
  borderRadius: 4,
  marginLeft: theme.spacing(1),
  marginRight: theme.spacing(1),
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  '& .MuiLinearProgress-bar': {
    backgroundColor: '#FFD700',
  },
}));

const RatingCount = styled(Typography)(({ theme }) => ({
  minWidth: 30,
  textAlign: 'right',
  color: 'rgba(255, 255, 255, 0.7)',
}));

const RatingPercentage = styled(Typography)(({ theme }) => ({
  minWidth: 40,
  textAlign: 'right',
  color: 'rgba(255, 255, 255, 0.7)',
}));

const CategoryRating = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  background: 'rgba(255, 255, 255, 0.05)',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.08)',
  }
}));

/**
 * RatingDistribution component
 * Displays a visual representation of rating distribution for a worker
 * 
 * @param {Object} props - Component props
 * @param {Object} props.ratingStats - Stats object with rating distribution
 * @param {Object} props.categoryRatings - Object with category ratings
 * @param {number} props.averageRating - Overall average rating
 * @param {number} props.totalReviews - Total number of reviews
 */
const RatingDistribution = ({ ratingStats = [], categoryRatings = {}, averageRating = 0, totalReviews = 0 }) => {
  // Fill in missing rating stats
  const fullRatingStats = Array.from({ length: 5 }, (_, i) => {
    const starLevel = 5 - i;
    const existing = ratingStats.find(stat => stat.rating === starLevel);
    return existing || { rating: starLevel, count: 0, percentage: 0 };
  });

  return (
    <RatingContainer elevation={3}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ color: '#FFD700', mb: 1 }}>
          Rating Distribution
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Star distribution bars */}
      <Box sx={{ mb: 4 }}>
        {fullRatingStats.map((stat) => (
          <RatingBarContainer key={stat.rating}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: 48 }}>
              <Typography variant="body2" sx={{ mr: 0.5, color: '#fff' }}>
                {stat.rating}
              </Typography>
              <Star sx={{ fontSize: 16, color: '#FFD700' }} />
            </Box>
            <RatingBar variant="determinate" value={stat.percentage} />
            <RatingCount variant="body2">
              {stat.count}
            </RatingCount>
            <RatingPercentage variant="body2">
              {stat.percentage.toFixed(0)}%
            </RatingPercentage>
          </RatingBarContainer>
        ))}
      </Box>

      {/* Category ratings */}
      {Object.keys(categoryRatings).length > 0 && (
        <>
          <Typography variant="h6" sx={{ color: '#FFD700', mb: 2 }}>
            Rating by Category
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(categoryRatings).map(([category, rating]) => (
              <Grid item xs={6} sm={4} md={3} key={category}>
                <CategoryRating>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 1, 
                      color: 'rgba(255, 255, 255, 0.9)',
                      textTransform: 'capitalize'
                    }}
                  >
                    {category.replace(/([A-Z])/g, ' $1').trim()}
                  </Typography>
                  <Rating 
                    value={rating} 
                    readOnly 
                    precision={0.1} 
                    size="small"
                    sx={{ color: '#FFD700' }}
                  />
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      mt: 0.5, 
                      fontWeight: 'bold',
                      color: '#FFD700'
                    }}
                  >
                    {rating.toFixed(1)}
                  </Typography>
                </CategoryRating>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Overall rating summary */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mt: 3,
          pt: 3,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ color: '#FFD700', fontWeight: 'bold' }}>
            {averageRating.toFixed(1)}
          </Typography>
          <Rating 
            value={averageRating} 
            readOnly 
            precision={0.1}
            sx={{ mt: 1, color: '#FFD700' }}
          />
          <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
            Overall Rating
          </Typography>
        </Box>
      </Box>
    </RatingContainer>
  );
};

export default RatingDistribution; 