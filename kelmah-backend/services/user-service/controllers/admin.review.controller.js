/**
 * Admin Review Controller
 * Handles operations related to review moderation by admins
 */

const { Review, User, AdminActionLog } = require('../models');
const { Op } = require('sequelize');

const adminReviewController = {
    /**
     * Get reviews for moderation
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @returns {Object} - Response with reviews data
     */
    getReviewsForModeration: async (req, res) => {
        try {
            const { status = 'pending', page = 1, limit = 10, search = '' } = req.query;
            const offset = (page - 1) * limit;
            
            // Validate status
            const validStatuses = ['pending', 'approved', 'rejected', 'flagged', 'all'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid status parameter'
                });
            }
            
            // Build where clause
            const whereClause = {};
            if (status !== 'all') {
                whereClause.status = status;
            }
            
            // Add search condition if provided
            if (search) {
                whereClause[Op.or] = [
                    { comment: { [Op.iLike]: `%${search}%` } }
                ];
            }
            
            // Count total records for pagination
            const count = await Review.count({
                where: whereClause
            });
            
            // Fetch reviews with pagination
            const reviews = await Review.findAll({
                where: whereClause,
                include: [
                    {
                        model: User,
                        as: 'reviewer',
                        attributes: ['id', 'firstName', 'lastName', 'profileImage']
                    },
                    {
                        model: User,
                        as: 'recipient',
                        attributes: ['id', 'firstName', 'lastName', 'profileImage']
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: offset
            });
            
            // Format the response
            const formattedReviews = reviews.map(review => ({
                id: review.id,
                rating: review.rating,
                comment: review.comment,
                reviewerId: review.reviewerId,
                reviewerName: `${review.reviewer.firstName} ${review.reviewer.lastName}`,
                reviewerAvatar: review.reviewer.profileImage,
                recipientId: review.recipientId,
                recipientName: `${review.recipient.firstName} ${review.recipient.lastName}`,
                recipientAvatar: review.recipient.profileImage,
                categories: {
                    communication: review.communication,
                    skillMatch: review.skillMatch,
                    timeliness: review.timeliness,
                    quality: review.quality,
                    value: review.value
                },
                jobId: review.jobId,
                status: review.status,
                flagReason: review.flagReason,
                adminReviewedBy: review.adminReviewedBy,
                adminReviewedAt: review.adminReviewedAt,
                createdAt: review.createdAt,
                updatedAt: review.updatedAt
            }));
            
            res.json({
                success: true,
                reviews: formattedReviews,
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            });
        } catch (error) {
            console.error('Error fetching reviews for moderation:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch reviews'
            });
        }
    },
    
    /**
     * Approve a review
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @returns {Object} - Response with approval status
     */
    approveReview: async (req, res) => {
        try {
            const { reviewId } = req.body;
            const adminId = req.user.id;
            
            // Find the review
            const review = await Review.findByPk(reviewId);
            
            if (!review) {
                return res.status(404).json({
                    success: false,
                    error: 'Review not found'
                });
            }
            
            // Check if review is already approved
            if (review.status === 'approved') {
                return res.status(400).json({
                    success: false,
                    error: 'Review is already approved'
                });
            }
            
            // Update the review
            await review.update({
                status: 'approved',
                adminReviewedBy: adminId,
                adminReviewedAt: new Date()
            });
            
            // Update user's average rating
            await updateRecipientRating(review.recipientId);
            
            // Log admin action
            await AdminActionLog.create({
                adminId,
                actionType: 'REVIEW_APPROVE',
                targetType: 'REVIEW',
                targetId: reviewId,
                details: {
                    previousStatus: review.status,
                    newStatus: 'approved'
                },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });
            
            res.json({
                success: true,
                message: 'Review approved successfully'
            });
        } catch (error) {
            console.error('Error approving review:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to approve review'
            });
        }
    },
    
    /**
     * Reject a review
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @returns {Object} - Response with rejection status
     */
    rejectReview: async (req, res) => {
        try {
            const { reviewId, reason } = req.body;
            const adminId = req.user.id;
            
            if (!reason) {
                return res.status(400).json({
                    success: false,
                    error: 'Reason for rejection is required'
                });
            }
            
            // Find the review
            const review = await Review.findByPk(reviewId);
            
            if (!review) {
                return res.status(404).json({
                    success: false,
                    error: 'Review not found'
                });
            }
            
            // Update the review
            await review.update({
                status: 'rejected',
                flagReason: reason,
                adminReviewedBy: adminId,
                adminReviewedAt: new Date()
            });
            
            // Log admin action
            await AdminActionLog.create({
                adminId,
                actionType: 'REVIEW_REJECT',
                targetType: 'REVIEW',
                targetId: reviewId,
                details: {
                    previousStatus: review.status,
                    newStatus: 'rejected',
                    rejectionReason: reason
                },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });
            
            res.json({
                success: true,
                message: 'Review rejected successfully'
            });
        } catch (error) {
            console.error('Error rejecting review:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to reject review'
            });
        }
    },
    
    /**
     * Flag a review for further investigation
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @returns {Object} - Response with flagging status
     */
    flagReview: async (req, res) => {
        try {
            const { reviewId, reason } = req.body;
            const adminId = req.user.id;
            
            if (!reason) {
                return res.status(400).json({
                    success: false,
                    error: 'Reason for flagging is required'
                });
            }
            
            // Find the review
            const review = await Review.findByPk(reviewId);
            
            if (!review) {
                return res.status(404).json({
                    success: false,
                    error: 'Review not found'
                });
            }
            
            // Update the review
            await review.update({
                status: 'flagged',
                flagReason: reason,
                adminReviewedBy: adminId,
                adminReviewedAt: new Date()
            });
            
            // If review was previously approved, recalculate recipient's rating
            if (review.status === 'approved') {
                await updateRecipientRating(review.recipientId);
            }
            
            // Log admin action
            await AdminActionLog.create({
                adminId,
                actionType: 'REVIEW_FLAG',
                targetType: 'REVIEW',
                targetId: reviewId,
                details: {
                    previousStatus: review.status,
                    newStatus: 'flagged',
                    flagReason: reason
                },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });
            
            res.json({
                success: true,
                message: 'Review flagged successfully'
            });
        } catch (error) {
            console.error('Error flagging review:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to flag review'
            });
        }
    },
    
    /**
     * Get review details
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @returns {Object} - Response with detailed review information
     */
    getReviewDetails: async (req, res) => {
        try {
            const { reviewId } = req.params;
            
            // Find the review with related data
            const review = await Review.findByPk(reviewId, {
                include: [
                    {
                        model: User,
                        as: 'reviewer',
                        attributes: ['id', 'firstName', 'lastName', 'profileImage', 'email']
                    },
                    {
                        model: User,
                        as: 'recipient',
                        attributes: ['id', 'firstName', 'lastName', 'profileImage', 'email']
                    },
                    {
                        model: User,
                        as: 'adminReviewer',
                        attributes: ['id', 'firstName', 'lastName', 'email'],
                        required: false
                    }
                ]
            });
            
            if (!review) {
                return res.status(404).json({
                    success: false,
                    error: 'Review not found'
                });
            }
            
            // Format the response
            const reviewDetails = {
                id: review.id,
                rating: review.rating,
                comment: review.comment,
                privateComment: review.privateComment,
                reviewerType: review.reviewerType,
                communication: review.communication,
                skillMatch: review.skillMatch,
                timeliness: review.timeliness,
                quality: review.quality,
                value: review.value,
                jobId: review.jobId,
                status: review.status,
                helpfulCount: review.helpfulCount,
                isAnonymous: review.isAnonymous,
                flagReason: review.flagReason,
                reviewer: {
                    id: review.reviewer.id,
                    name: `${review.reviewer.firstName} ${review.reviewer.lastName}`,
                    email: review.reviewer.email,
                    profileImage: review.reviewer.profileImage
                },
                recipient: {
                    id: review.recipient.id,
                    name: `${review.recipient.firstName} ${review.recipient.lastName}`,
                    email: review.recipient.email,
                    profileImage: review.recipient.profileImage
                },
                adminReviewer: review.adminReviewer ? {
                    id: review.adminReviewer.id,
                    name: `${review.adminReviewer.firstName} ${review.adminReviewer.lastName}`,
                    email: review.adminReviewer.email
                } : null,
                responseComment: review.responseComment,
                responseDate: review.responseDate,
                adminReviewedAt: review.adminReviewedAt,
                createdAt: review.createdAt,
                updatedAt: review.updatedAt
            };
            
            res.json({
                success: true,
                review: reviewDetails
            });
        } catch (error) {
            console.error('Error fetching review details:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch review details'
            });
        }
    }
};

/**
 * Helper function to update recipient's average rating
 * @param {string} recipientId - ID of the review recipient
 */
async function updateRecipientRating(recipientId) {
    const reviews = await Review.findAll({
        where: {
            recipientId,
            status: 'approved'
        },
        attributes: ['rating']
    });
    
    if (reviews.length > 0) {
        const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
        await User.update(
            { averageRating: parseFloat(averageRating.toFixed(1)) },
            { where: { id: recipientId } }
        );
    } else {
        // If no approved reviews, reset rating to null or default
        await User.update(
            { averageRating: null },
            { where: { id: recipientId } }
        );
    }
}

module.exports = adminReviewController; 