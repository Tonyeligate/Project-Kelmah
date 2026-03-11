/**
 * Analytics Controller
 * Handles review analytics and moderation operations
 */

const mongoose = require('mongoose');
const { Review, WorkerRating } = require('../models');

const roundRating = (value) => (Number.isFinite(value) ? parseFloat(value.toFixed(1)) : 0);

const updateWorkerRating = async (workerId) => {
  if (!workerId || !mongoose.Types.ObjectId.isValid(workerId)) {
    return null;
  }

  const reviews = await Review.find({ reviewee: workerId, status: 'approved' })
    .sort({ createdAt: -1 })
    .select('rating response jobCategory')
    .lean();

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / totalReviews
    : 0;
  const highRated = reviews.filter((review) => Number(review.rating || 0) >= 4).length;
  const responded = reviews.filter((review) => review.response?.comment).length;
  const recentReviews = reviews.slice(0, 10);
  const ratingDistribution = reviews.reduce(
    (distribution, review) => {
      const rating = Math.min(Math.max(Math.round(Number(review.rating || 0)), 1), 5);
      distribution[rating] += 1;
      return distribution;
    },
    { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  );

  const categorySummary = Array.from(
    reviews.reduce((map, review) => {
      const category = String(review.jobCategory || '').trim();
      if (!category) {
        return map;
      }
      const bucket = map.get(category) || { total: 0, count: 0 };
      bucket.total += Number(review.rating || 0);
      bucket.count += 1;
      map.set(category, bucket);
      return map;
    }, new Map()).entries(),
  ).map(([category, bucket]) => ({
    category,
    averageRating: roundRating(bucket.count > 0 ? bucket.total / bucket.count : 0),
    reviewCount: bucket.count,
  }));

  return WorkerRating.findOneAndUpdate(
    { workerId },
    {
      totalReviews,
      averageRating: roundRating(averageRating),
      ratings: {
        overall: roundRating(averageRating),
        quality: 0,
        communication: 0,
        timeliness: 0,
        professionalism: 0,
      },
      ratingDistribution,
      categoryRatings: categorySummary,
      recommendationRate: totalReviews > 0 ? Math.round((highRated / totalReviews) * 100) : 0,
      verifiedReviewsCount: 0,
      responseRate: totalReviews > 0 ? Math.round((responded / totalReviews) * 100) : 0,
      recentRating: roundRating(
        recentReviews.length > 0
          ? recentReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / recentReviews.length
          : 0,
      ),
      lastUpdated: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
};

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
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]),
      Review.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Review.aggregate([
        { $group: { _id: '$jobCategory', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Review.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }},
        { $sort: { _id: 1 } }
      ])
    ]);

    return res.json({
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
    return res.status(500).json({
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

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ success: false, message: 'Invalid review ID' });
    }

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

    await updateWorkerRating(review.reviewee);

    return res.json({
      success: true,
      message: 'Review moderated successfully',
      data: review
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to moderate review'
    });
  }
};