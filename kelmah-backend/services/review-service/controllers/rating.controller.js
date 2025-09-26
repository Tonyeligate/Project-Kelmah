/**
 * Rating Controller
 * Handles rating summary and analytics operations
 */

const { Review } = require('../models');

/**
 * Get worker rating summary
 */
exports.getWorkerRating = async (req, res) => {
  try {
    const { workerId } = req.params;

    // For now, return a basic structure - full implementation would require WorkerRating model
    // This is a simplified version until the WorkerRating model is extracted

    const reviews = await Review.find({
      workerId,
      status: 'approved'
    }).lean();

    if (!reviews || reviews.length === 0) {
      return res.json({
        success: true,
        data: {
          workerId,
          totalReviews: 0,
          averageRating: 0,
          ratings: { overall: 0, quality: 0, communication: 0, timeliness: 0, professionalism: 0 },
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          categoryRatings: [],
          recommendationRate: 0,
          verifiedReviewsCount: 0,
          responseRate: 0
        }
      });
    }

    // Calculate basic stats
    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, r) => sum + r.ratings.overall, 0) / totalReviews;

    // Rating distribution
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      const roundedRating = Math.round(review.ratings.overall);
      ratingDistribution[roundedRating] = (ratingDistribution[roundedRating] || 0) + 1;
    });

    // Recommendation rate
    const recommendationRate = (reviews.filter(r => r.wouldRecommend).length / totalReviews) * 100;

    // Response rate
    const responseRate = (reviews.filter(r => r.response && r.response.comment).length / totalReviews) * 100;

    res.json({
      success: true,
      data: {
        workerId,
        totalReviews,
        averageRating: parseFloat(averageRating.toFixed(1)),
        ratings: {
          overall: parseFloat(averageRating.toFixed(1)),
          quality: parseFloat((reviews.reduce((sum, r) => sum + r.ratings.quality, 0) / totalReviews).toFixed(1)),
          communication: parseFloat((reviews.reduce((sum, r) => sum + r.ratings.communication, 0) / totalReviews).toFixed(1)),
          timeliness: parseFloat((reviews.reduce((sum, r) => sum + r.ratings.timeliness, 0) / totalReviews).toFixed(1)),
          professionalism: parseFloat((reviews.reduce((sum, r) => sum + r.ratings.professionalism, 0) / totalReviews).toFixed(1))
        },
        ratingDistribution,
        categoryRatings: [], // Simplified for now
        recommendationRate: Math.round(recommendationRate),
        verifiedReviewsCount: reviews.filter(r => r.isVerified).length,
        responseRate: Math.round(responseRate)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch worker rating'
    });
  }
};

/**
 * Get lightweight ranking signals for a worker
 */
exports.getWorkerRankSignals = async (req, res) => {
  try {
    const { workerId } = req.params;

    const reviews = await Review.find({
      workerId,
      status: 'approved'
    }).lean();

    if (!reviews || reviews.length === 0) {
      return res.json({
        success: true,
        data: {
          workerId,
          rankSignals: {
            totalReviews: 0,
            averageRating: 0,
            recommendationRate: 0,
            verifiedReviewsCount: 0,
            responseRate: 0,
            recentRating: 0
          }
        }
      });
    }

    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, r) => sum + r.ratings.overall, 0) / totalReviews;
    const recommendationRate = (reviews.filter(r => r.wouldRecommend).length / totalReviews) * 100;
    const verifiedReviewsCount = reviews.filter(r => r.isVerified).length;
    const responseRate = (reviews.filter(r => r.response && r.response.comment).length / totalReviews) * 100;

    // Recent rating (last 10 reviews)
    const recentReviews = reviews.slice(0, 10);
    const recentRating = recentReviews.length > 0 ?
      (recentReviews.reduce((sum, r) => sum + r.ratings.overall, 0) / recentReviews.length) : 0;

    const signals = {
      totalReviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
      recommendationRate: Math.round(recommendationRate),
      verifiedReviewsCount,
      responseRate: Math.round(responseRate),
      recentRating: parseFloat(recentRating.toFixed(1))
    };

    return res.json({
      success: true,
      data: { workerId, rankSignals: signals }
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load rank signals'
    });
  }
};