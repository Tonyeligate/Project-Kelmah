const { Review, User, Job } = require('../models');
const { Op } = require('sequelize');

const reviewController = {
    // Get all reviews for a worker
    getWorkerReviews: async (req, res) => {
        try {
            const { workerId } = req.params;

            const reviews = await Review.findAll({
                where: {
                    workerId,
                    status: 'approved'
                },
                include: [
                    {
                        model: User,
                        as: 'client',
                        attributes: ['id', 'firstName', 'lastName', 'profileImage']
                    }
                ],
                order: [['createdAt', 'DESC']]
            });

            // Format the response
            const formattedReviews = reviews.map(review => ({
                id: review.id,
                rating: review.rating,
                comment: review.comment,
                categories: {
                    communication: review.communicationRating,
                    quality: review.qualityRating,
                    timeliness: review.timelinessRating,
                    professionalism: review.professionalismRating
                },
                clientName: `${review.client.firstName} ${review.client.lastName}`,
                createdAt: review.createdAt
            }));

            res.json({
                success: true,
                data: formattedReviews
            });
        } catch (error) {
            console.error('Error fetching worker reviews:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch reviews'
            });
        }
    },

    // Create a new review
    createReview: async (req, res) => {
        try {
            const { workerId } = req.params;
            const clientId = req.user.id;
            const {
                rating,
                comment,
                categories
            } = req.body;

            // Validate input
            if (!rating || !comment || !categories) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields'
                });
            }

            // Check if the client has worked with the worker
            const hasWorkedTogether = await Job.findOne({
                where: {
                    workerId,
                    clientId,
                    status: 'completed'
                }
            });

            if (!hasWorkedTogether) {
                return res.status(403).json({
                    success: false,
                    error: 'You can only review workers you have worked with'
                });
            }

            // Check if client has already reviewed this worker
            const existingReview = await Review.findOne({
                where: {
                    workerId,
                    clientId
                }
            });

            if (existingReview) {
                return res.status(400).json({
                    success: false,
                    error: 'You have already reviewed this worker'
                });
            }

            // Create the review
            const review = await Review.create({
                workerId,
                clientId,
                rating,
                comment,
                communicationRating: categories.communication,
                qualityRating: categories.quality,
                timelinessRating: categories.timeliness,
                professionalismRating: categories.professionalism,
                status: 'pending' // Reviews need admin approval
            });

            // Update worker's average rating
            await updateWorkerRating(workerId);

            res.json({
                success: true,
                data: {
                    id: review.id,
                    message: 'Review submitted successfully and pending approval'
                }
            });
        } catch (error) {
            console.error('Error creating review:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create review'
            });
        }
    },

    // Update a review
    updateReview: async (req, res) => {
        try {
            const { reviewId } = req.params;
            const clientId = req.user.id;
            const {
                rating,
                comment,
                categories
            } = req.body;

            // Find the review
            const review = await Review.findOne({
                where: {
                    id: reviewId,
                    clientId
                }
            });

            if (!review) {
                return res.status(404).json({
                    success: false,
                    error: 'Review not found'
                });
            }

            // Update the review
            await review.update({
                rating,
                comment,
                communicationRating: categories.communication,
                qualityRating: categories.quality,
                timelinessRating: categories.timeliness,
                professionalismRating: categories.professionalism,
                status: 'pending' // Reset to pending after update
            });

            // Update worker's average rating
            await updateWorkerRating(review.workerId);

            res.json({
                success: true,
                data: {
                    id: review.id,
                    message: 'Review updated successfully'
                }
            });
        } catch (error) {
            console.error('Error updating review:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update review'
            });
        }
    },

    // Delete a review
    deleteReview: async (req, res) => {
        try {
            const { reviewId } = req.params;
            const clientId = req.user.id;

            // Find the review
            const review = await Review.findOne({
                where: {
                    id: reviewId,
                    clientId
                }
            });

            if (!review) {
                return res.status(404).json({
                    success: false,
                    error: 'Review not found'
                });
            }

            const workerId = review.workerId;

            // Delete the review
            await review.destroy();

            // Update worker's average rating
            await updateWorkerRating(workerId);

            res.json({
                success: true,
                message: 'Review deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting review:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete review'
            });
        }
    }
};

// Helper function to update worker's average rating
async function updateWorkerRating(workerId) {
    const reviews = await Review.findAll({
        where: {
            workerId,
            status: 'approved'
        }
    });

    if (reviews.length > 0) {
        const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
        await User.update(
            { averageRating },
            { where: { id: workerId } }
        );
    }
}

module.exports = reviewController; 