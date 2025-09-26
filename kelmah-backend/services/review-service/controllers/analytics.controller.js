/**
 * Analytics Controller
 * Handles review analytics and moderation operations
 */

const { Review } = require('../models');

/**
 * Get review analytics (admin only)
 */
exports.getReviewAnalytics = async (req, res) => {
  try {
    // Basic analytics - in production, add role checking
    const [
      totalReviews,
      averageRating,
      reviewsByStatus,
      topCategories,
      recentTrends
    ] = await Promise.all([
      Review.countDocuments(),
      Review.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$ratings.overall' } } }
      ]),
      Review.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Review.aggregate([
        { $group: { _id: '$jobCategory', count: { $sum: 1 }, avgRating: { $avg: '$ratings.overall' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Review.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          avgRating: { $avg: '$ratings.overall' }
        }},
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalReviews,
        averageRating: averageRating[0]?.avgRating || 0,
        reviewsByStatus,
        topCategories,
        recentTrends
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
};

/**
 * Moderate a review (admin only)
 */
exports.moderateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status, moderationNote } = req.body;

    if (!['approved', 'rejected', 'flagged'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved, rejected, or flagged'
      });
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      {
        status,
        $push: {
          moderationNotes: {
            note: moderationNote,
            moderatorId: req.user.id,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Update worker rating if review was approved/rejected
    // await updateWorkerRating(review.workerId);

    res.json({
      success: true,
      message: 'Review moderated successfully',
      data: review
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to moderate review'
    });
  }
};