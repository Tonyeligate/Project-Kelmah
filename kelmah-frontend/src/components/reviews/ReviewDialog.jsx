import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Rating,
    TextField,
    Box,
    Typography,
    Alert
} from '@mui/material';
import { Star } from '@mui/icons-material';
import api from '../../api/axios';

function ReviewDialog({ open, onClose, jobId, revieweeId, revieweeName, onReviewSubmitted }) {
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            setError(null);

            await api.post('/api/reviews', {
                job_id: jobId,
                reviewee_id: revieweeId,
                rating,
                review_text: review
            });

            onReviewSubmitted();
            handleClose();
        } catch (error) {
            console.error('Error submitting review:', error);
            setError(error.response?.data?.message || 'Error submitting review');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setRating(0);
        setReview('');
        setError(null);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Review {revieweeName}
            </DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ my: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography component="legend">Rating</Typography>
                    <Rating
                        value={rating}
                        onChange={(event, newValue) => setRating(newValue)}
                        size="large"
                        emptyIcon={<Star style={{ opacity: 0.55 }} fontSize="inherit" />}
                    />
                </Box>

                <TextField
                    fullWidth
                    label="Review"
                    multiline
                    rows={4}
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Share your experience..."
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={!rating || submitting}
                >
                    Submit Review
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ReviewDialog; 