import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Divider, 
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import ReviewRating from './ReviewRating';
import { submitReview, resetReviewSubmission } from '../../store/slices/reviewsSlice';

const ReviewForm = ({ 
  contractId, 
  recipientId, 
  recipientType, 
  recipientName,
  onSubmitSuccess 
}) => {
  const dispatch = useDispatch();
  const { submitting, error, success } = useSelector((state) => state.reviews);
  
  const [formValues, setFormValues] = useState({
    rating: 0,
    communication: 0,
    qualityOfWork: 0,
    timeliness: 0,
    comment: '',
  });
  
  const [formErrors, setFormErrors] = useState({
    rating: false,
    communication: false,
    qualityOfWork: false,
    timeliness: false,
    comment: false,
  });

  const validateForm = () => {
    const newErrors = {
      rating: formValues.rating === 0,
      communication: formValues.communication === 0,
      qualityOfWork: formValues.qualityOfWork === 0,
      timeliness: formValues.timeliness === 0,
      comment: !formValues.comment.trim(),
    };
    
    setFormErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleRatingChange = (field) => (event, newValue) => {
    setFormValues(prev => ({
      ...prev,
      [field]: newValue
    }));
    
    if (newValue > 0) {
      setFormErrors(prev => ({
        ...prev,
        [field]: false
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (value.trim()) {
      setFormErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const reviewData = {
      contractId,
      recipientId,
      recipientType,
      overallRating: formValues.rating,
      communication: formValues.communication,
      qualityOfWork: formValues.qualityOfWork,
      timeliness: formValues.timeliness,
      comment: formValues.comment.trim()
    };
    
    dispatch(submitReview(reviewData))
      .unwrap()
      .then(() => {
        if (onSubmitSuccess) onSubmitSuccess();
      })
      .catch(() => {
        // Error is handled in the slice
      });
  };

  const handleReset = () => {
    setFormValues({
      rating: 0,
      communication: 0,
      qualityOfWork: 0,
      timeliness: 0,
      comment: '',
    });
    setFormErrors({
      rating: false,
      communication: false,
      qualityOfWork: false,
      timeliness: false,
      comment: false,
    });
    dispatch(resetReviewSubmission());
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Leave a Review for {recipientName}
      </Typography>
      
      <Divider sx={{ mb: 3 }} />
      
      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => dispatch(resetReviewSubmission())}
        >
          Review submitted successfully!
        </Alert>
      )}
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={() => dispatch(resetReviewSubmission())}
        >
          {error}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <ReviewRating
              label="Overall Rating"
              value={formValues.rating}
              onChange={handleRatingChange('rating')}
              readOnly={false}
              required
              error={formErrors.rating}
              helperText={formErrors.rating ? 'Overall rating is required' : ''}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <ReviewRating
              label="Communication"
              value={formValues.communication}
              onChange={handleRatingChange('communication')}
              readOnly={false}
              required
              error={formErrors.communication}
              helperText={formErrors.communication ? 'Communication rating is required' : ''}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <ReviewRating
              label="Quality of Work"
              value={formValues.qualityOfWork}
              onChange={handleRatingChange('qualityOfWork')}
              readOnly={false}
              required
              error={formErrors.qualityOfWork}
              helperText={formErrors.qualityOfWork ? 'Quality rating is required' : ''}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <ReviewRating
              label="Timeliness"
              value={formValues.timeliness}
              onChange={handleRatingChange('timeliness')}
              readOnly={false}
              required
              error={formErrors.timeliness}
              helperText={formErrors.timeliness ? 'Timeliness rating is required' : ''}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              name="comment"
              label="Review Comments"
              multiline
              rows={4}
              value={formValues.comment}
              onChange={handleInputChange}
              fullWidth
              required
              error={formErrors.comment}
              helperText={formErrors.comment ? 'Please provide comments for your review' : ''}
              sx={{ mb: 2 }}
            />
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={submitting || success}
            startIcon={submitting && <CircularProgress size={20} color="inherit" />}
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
          
          <Button
            type="button"
            variant="outlined"
            onClick={handleReset}
            disabled={submitting}
          >
            Reset
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

ReviewForm.propTypes = {
  contractId: PropTypes.string.isRequired,
  recipientId: PropTypes.string.isRequired,
  recipientType: PropTypes.oneOf(['client', 'worker']).isRequired,
  recipientName: PropTypes.string.isRequired,
  onSubmitSuccess: PropTypes.func,
};

export default ReviewForm; 