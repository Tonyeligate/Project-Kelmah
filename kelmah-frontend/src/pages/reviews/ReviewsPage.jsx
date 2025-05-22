import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Rating,
  Divider,
  Button,
  Grid,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  Chip,
  LinearProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  ArrowBack,
  Star,
  FilterList,
  SortByAlpha,
  ThumbUp
} from '@mui/icons-material';
import { workerService } from '../../api/workerService';

// Styled components
const PageContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(8),
}));

const HeaderPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(1),
  backgroundColor: '#1a1a1a',
  color: 'white',
}));

const ContentPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(1),
}));

const StyledButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  borderColor: '#D4AF37',
  color: '#D4AF37',
  '&:hover': {
    borderColor: '#B8860B',
    backgroundColor: 'rgba(212, 175, 55, 0.04)',
  },
}));

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

const RatingBarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(0.5),
}));

const RatingBar = styled(LinearProgress)(({ theme }) => ({
  flexGrow: 1,
  height: 8,
  borderRadius: 4,
  marginLeft: theme.spacing(1),
  marginRight: theme.spacing(1),
  backgroundColor: 'rgba(0, 0, 0, 0.08)',
  '& .MuiLinearProgress-bar': {
    backgroundColor: '#D4AF37',
  },
}));

const ReviewsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [worker, setWorker] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('date_desc');
  const [filterRating, setFilterRating] = useState('all');
  
  // Fetch worker and reviews data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch worker details
        const workerData = await workerService.getWorkerById(id);
        setWorker(workerData);
        
        // Fetch reviews
        const reviewsData = await workerService.getWorkerReviews(id);
        setReviews(reviewsData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load worker reviews. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Handle sorting change
  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };
  
  // Handle filter change
  const handleFilterChange = (event) => {
    setFilterRating(event.target.value);
  };
  
  // Navigate back to worker profile
  const handleBackToProfile = () => {
    navigate(`/workers/${id}`);
  };
  
  // Process reviews based on filters and sorting
  const getProcessedReviews = () => {
    if (!reviews.length) return [];
    
    // Apply rating filter
    let filteredReviews = [...reviews];
    if (filterRating !== 'all') {
      const rating = parseInt(filterRating, 10);
      filteredReviews = filteredReviews.filter(review => Math.floor(review.rating) === rating);
    }
    
    // Apply sorting
    let sortedReviews = [...filteredReviews];
    switch(sortBy) {
      case 'date_desc':
        sortedReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'date_asc':
        sortedReviews.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'rating_desc':
        sortedReviews.sort((a, b) => b.rating - a.rating);
        break;
      case 'rating_asc':
        sortedReviews.sort((a, b) => a.rating - b.rating);
        break;
      default:
        break;
    }
    
    return sortedReviews;
  };
  
  // Calculate review statistics
  const getReviewStats = () => {
    if (!reviews.length) return { total: 0, stats: [] };
    
    const total = reviews.length;
    const stats = [5, 4, 3, 2, 1].map(rating => {
      const count = reviews.filter(review => Math.floor(review.rating) === rating).length;
      const percentage = (count / total) * 100;
      return { rating, count, percentage };
    });
    
    return { total, stats };
  };
  
  const reviewStats = getReviewStats();
  const processedReviews = getProcessedReviews();
  
  if (loading) {
    return (
      <PageContainer maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress sx={{ color: '#D4AF37' }} />
        </Box>
      </PageContainer>
    );
  }
  
  if (error || !worker) {
    return (
      <PageContainer maxWidth="lg">
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="h6" color="error" gutterBottom>
            {error || 'Worker not found'}
          </Typography>
          <StyledButton 
            variant="outlined" 
            onClick={() => navigate('/workers')}
            sx={{ mt: 2 }}
          >
            Back to Workers
          </StyledButton>
        </Box>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer maxWidth="lg">
      <HeaderPaper elevation={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <StyledButton 
            variant="outlined" 
            startIcon={<ArrowBack />}
            onClick={handleBackToProfile}
            sx={{ mr: 2 }}
          >
            Back to Profile
          </StyledButton>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Reviews for {worker.name}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mr: 2 }}>
              {worker.rating.toFixed(1)}
            </Typography>
            <Box>
              <Rating value={worker.rating} readOnly precision={0.5} size="large" sx={{ color: '#D4AF37' }} />
              <Typography variant="body1" color="rgba(255, 255, 255, 0.7)">
                Based on {worker.reviewCount} reviews
              </Typography>
            </Box>
          </Box>
        </Box>
      </HeaderPaper>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <ContentPaper elevation={1}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Rating Breakdown
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              {reviewStats.stats.map((stat) => (
                <RatingBarContainer key={stat.rating}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: 45 }}>
                    <Typography variant="body2">{stat.rating}</Typography>
                    <Star sx={{ fontSize: 16, ml: 0.5, color: '#D4AF37' }} />
                  </Box>
                  <RatingBar 
                    variant="determinate" 
                    value={stat.percentage} 
                  />
                  <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right' }}>
                    {stat.count}
                  </Typography>
                </RatingBarContainer>
              ))}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mt: 3 }}>
              Filter Reviews
            </Typography>
            
            <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
              <InputLabel id="filter-label">Filter by Rating</InputLabel>
              <Select
                labelId="filter-label"
                value={filterRating}
                onChange={handleFilterChange}
                label="Filter by Rating"
              >
                <MenuItem value="all">All Ratings</MenuItem>
                <MenuItem value="5">5 Stars</MenuItem>
                <MenuItem value="4">4 Stars</MenuItem>
                <MenuItem value="3">3 Stars</MenuItem>
                <MenuItem value="2">2 Stars</MenuItem>
                <MenuItem value="1">1 Star</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="sort-label">Sort by</InputLabel>
              <Select
                labelId="sort-label"
                value={sortBy}
                onChange={handleSortChange}
                label="Sort by"
              >
                <MenuItem value="date_desc">Newest First</MenuItem>
                <MenuItem value="date_asc">Oldest First</MenuItem>
                <MenuItem value="rating_desc">Highest Rating</MenuItem>
                <MenuItem value="rating_asc">Lowest Rating</MenuItem>
              </Select>
            </FormControl>
          </ContentPaper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <ContentPaper elevation={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {processedReviews.length} {processedReviews.length === 1 ? 'Review' : 'Reviews'}
                {filterRating !== 'all' && ` with ${filterRating} stars`}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <FilterList sx={{ color: '#757575' }} />
                <SortByAlpha sx={{ color: '#757575' }} />
              </Box>
            </Box>
            
            {processedReviews.length > 0 ? (
              processedReviews.map((review) => (
                <ReviewCard key={review.id} elevation={1}>
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
                        <Typography variant="body2" color="text.secondary">
                          {new Date(review.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </Typography>
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
                      <Chip 
                        label={`${review.jobType || 'Service'}`}
                        size="small" 
                        sx={{ bgcolor: 'rgba(26, 26, 26, 0.08)' }}
                      />
                      
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
              ))
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No reviews match your current filters.
                </Typography>
                {filterRating !== 'all' && (
                  <Button 
                    variant="text" 
                    color="primary" 
                    onClick={() => setFilterRating('all')}
                    sx={{ mt: 1, color: '#D4AF37' }}
                  >
                    Clear Filters
                  </Button>
                )}
              </Box>
            )}
          </ContentPaper>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default ReviewsPage; 