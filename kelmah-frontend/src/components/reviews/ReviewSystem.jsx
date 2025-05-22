import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Rating,
    TextField,
    Button,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Divider,
    Chip
} from '@mui/material';
import {
    Star,
    StarBorder,
    StarHalf,
    ThumbUp,
    ThumbDown,
    Comment,
    AccessTime
} from '@mui/icons-material';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

const ReviewSystem = ({ workerId }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [openReviewDialog, setOpenReviewDialog] = useState(false);
    const [newReview, setNewReview] = useState({
        rating: 0,
        comment: '',
        categories: {
            communication: 0,
            quality: 0,
            timeliness: 0,
            professionalism: 0
        }
    });

    useEffect(() => {
        fetchReviews();
    }, [workerId]);

    const fetchReviews = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/worker/${workerId}/reviews`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setReviews(response.data.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load reviews. Please try again later.');
            setLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        try {
            await axios.post(
                `${BACKEND_URL}/worker/${workerId}/reviews`,
                newReview,
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );
            setOpenReviewDialog(false);
            setNewReview({
                rating: 0,
                comment: '',
                categories: {
                    communication: 0,
                    quality: 0,
                    timeliness: 0,
                    professionalism: 0
                }
            });
            fetchReviews();
        } catch (err) {
            setError('Failed to submit review. Please try again.');
        }
    };

    const calculateAverageRating = () => {
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return (sum / reviews.length).toFixed(1);
    };

    const calculateCategoryAverages = () => {
        if (reviews.length === 0) return null;

        const categories = ['communication', 'quality', 'timeliness', 'professionalism'];
        return categories.reduce((acc, category) => {
            const sum = reviews.reduce((total, review) => total + review.categories[category], 0);
            acc[category] = (sum / reviews.length).toFixed(1);
            return acc;
        }, {});
    };

    const renderReviewDialog = () => (
        <Dialog
            open={openReviewDialog}
            onClose={() => setOpenReviewDialog(false)}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>Write a Review</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <Typography component="legend">Overall Rating</Typography>
                    <Rating
                        value={newReview.rating}
                        onChange={(event, value) => setNewReview(prev => ({ ...prev, rating: value }))}
                        precision={0.5}
                        size="large"
                    />
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography component="legend">Communication</Typography>
                    <Rating
                        value={newReview.categories.communication}
                        onChange={(event, value) => setNewReview(prev => ({
                            ...prev,
                            categories: { ...prev.categories, communication: value }
                        }))}
                        precision={0.5}
                    />
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography component="legend">Quality of Work</Typography>
                    <Rating
                        value={newReview.categories.quality}
                        onChange={(event, value) => setNewReview(prev => ({
                            ...prev,
                            categories: { ...prev.categories, quality: value }
                        }))}
                        precision={0.5}
                    />
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography component="legend">Timeliness</Typography>
                    <Rating
                        value={newReview.categories.timeliness}
                        onChange={(event, value) => setNewReview(prev => ({
                            ...prev,
                            categories: { ...prev.categories, timeliness: value }
                        }))}
                        precision={0.5}
                    />
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography component="legend">Professionalism</Typography>
                    <Rating
                        value={newReview.categories.professionalism}
                        onChange={(event, value) => setNewReview(prev => ({
                            ...prev,
                            categories: { ...prev.categories, professionalism: value }
                        }))}
                        precision={0.5}
                    />
                </Box>

                <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Your Review"
                    value={newReview.comment}
                    onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                    sx={{ mt: 2 }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpenReviewDialog(false)}>Cancel</Button>
                <Button 
                    onClick={handleSubmitReview}
                    variant="contained"
                    color="primary"
                    disabled={!newReview.rating || !newReview.comment}
                >
                    Submit Review
                </Button>
            </DialogActions>
        </Dialog>
    );

    const renderReviewList = () => (
        <List>
            {reviews.map((review) => (
                <React.Fragment key={review.id}>
                    <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                            <Avatar>{review.clientName[0]}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle1">{review.clientName}</Typography>
                                    <Rating value={review.rating} readOnly size="small" />
                </Box>
                            }
                            secondary={
                                <Box>
                                    <Typography
                                        component="span"
                                        variant="body2"
                                        color="text.primary"
                                        sx={{ display: 'block', mb: 1 }}
                                    >
                                        {review.comment}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {Object.entries(review.categories).map(([category, rating]) => (
                                            <Chip
                                                key={category}
                                                label={`${category}: ${rating}`}
                                        size="small"
                                                icon={<Star />}
                                            />
                                        ))}
                                    </Box>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}
                                    >
                                        <AccessTime fontSize="small" />
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            }
                        />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                </React.Fragment>
            ))}
        </List>
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    const categoryAverages = calculateCategoryAverages();

    return (
        <Box sx={{ p: 3 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h5" gutterBottom>
                                Overall Rating
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h3" sx={{ mr: 2 }}>
                                    {calculateAverageRating()}
                                </Typography>
                                <Rating
                                    value={parseFloat(calculateAverageRating())}
                                    readOnly
                                    precision={0.5}
                                    size="large"
                                />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Based on {reviews.length} reviews
                            </Typography>
                        </CardContent>
                    </Card>
                        </Grid>

                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Rating Breakdown
                            </Typography>
                            {categoryAverages && (
                                <Box sx={{ mt: 2 }}>
                                    {Object.entries(categoryAverages).map(([category, rating]) => (
                                        <Box key={category} sx={{ mb: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                                    {category}
                                                </Typography>
                                                <Typography variant="body2">{rating}</Typography>
                                            </Box>
                                            <Rating value={parseFloat(rating)} readOnly size="small" />
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">Reviews</Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<Comment />}
                                    onClick={() => setOpenReviewDialog(true)}
                                >
                                    Write a Review
                                </Button>
                            </Box>
                            {reviews.length === 0 ? (
                <Typography color="text.secondary" align="center">
                                    No reviews yet. Be the first to review this worker!
                </Typography>
                            ) : (
                                renderReviewList()
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {renderReviewDialog()}
        </Box>
    );
};

export default ReviewSystem; 