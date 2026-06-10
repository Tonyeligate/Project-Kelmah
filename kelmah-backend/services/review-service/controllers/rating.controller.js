/**
 * Rating Controller
 * Handles rating summary and analytics operations
 */

const mongoose = require('mongoose');
const { Review } = require('../models');

const { Types } = mongoose;

const DEFAULT_RATING_RESPONSE = {
  ratings: { overall: 0, quality: 0, communication: 0, timeliness: 0, professionalism: 0 },
  ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  categoryRatings: [],
  recommendationRate: 0,
  verifiedReviewsCount: 0,
  responseRate: 0,
};

const buildWorkerFilter = (workerId) => {
  if (!workerId || !Types.ObjectId.isValid(workerId)) {
    return null; // Signal invalid ID
  }

  return {
    reviewee: new Types.ObjectId(workerId),
  };
};

const buildRatingDistribution = (reviews) => {
  return reviews.reduce(
    (acc, review) => {
      const rating = Math.min(Math.max(Math.round(review.rating || 0), 1), 5);
      if (rating >= 1 && rating <= 5) {
        acc[rating] = acc[rating] + 1;
      }
      return acc;
    },
    { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  );
};

const roundRating = (value) => Number.isFinite(value) ? parseFloat(value.toFixed(1)) : 0;

const buildRatingsBreakdown = (averageRating) => {
  const rounded = roundRating(averageRating);
  return {
    overall: rounded,
    quality: 0,
    communication: 0,
    timeliness: 0,
    professionalism: 0,
  };
};

/**
 * Get worker rating summary
 */
exports.getWorkerRating = async (req, res) => {
  try {
    const { workerId } = req.params;
    const filter = buildWorkerFilter(workerId);
    if (!filter) {
      return res.status(400).json({ success: false, error: { message: 'Invalid worker ID' } });
    }

    // Use aggregation to avoid loading all reviews into memory
    const [stats] = await Review.aggregate([
      { $match: filter },
      { $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          avgRating: { $avg: { $ifNull: ['$rating', 0] } },
          highRated: { $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] } },
          dist: { $push: '$rating' }
      }}
    ]);

    if (!stats) {
      return res.json({
        success: true,
        data: {
          workerId,
          totalReviews: 0,
          averageRating: 0,
          ...DEFAULT_RATING_RESPONSE,
        }
      });
    }

    const { totalReviews, avgRating, highRated, dist } = stats;
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of dist) {
      const rounded = Math.min(Math.max(Math.round(r || 0), 1), 5);
      ratingDistribution[rounded]++;
    }
    const recommendationRate = totalReviews > 0 ? Math.round((highRated / totalReviews) * 100) : 0;

    return res.json({
      success: true,
      data: {
        workerId,
        totalReviews,
        averageRating: roundRating(avgRating),
        ratings: buildRatingsBreakdown(avgRating),
        ratingDistribution,
        categoryRatings: [],
        recommendationRate,
        verifiedReviewsCount: 0,
        responseRate: 0,
      }
    });

  } catch (error) {
    return res.status(500).json({
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

    const filter = buildWorkerFilter(workerId);
    if (!filter) {
      return res.status(400).json({ success: false, error: { message: 'Invalid worker ID' } });
    }

    // Use $facet to compute all signals in a single aggregation
    const [result] = await Review.aggregate([
      { $match: filter },
      { $facet: {
          overall: [{ $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            avgRating: { $avg: { $ifNull: ['$rating', 0] } },
            highRated: { $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] } },
          }}],
          recent: [
            { $sort: { createdAt: -1 } },
            { $limit: 10 },
            { $group: { _id: null, recentAvg: { $avg: { $ifNull: ['$rating', 0] } } } }
          ]
      }}
    ]);

    const overall = result?.overall?.[0];
    if (!overall) {
      return res.json({
        success: true,
        data: {
          workerId,
          rankSignals: {
            totalReviews: 0, averageRating: 0, recommendationRate: 0,
            verifiedReviewsCount: 0, responseRate: 0, recentRating: 0
          }
        }
      });
    }

    const { totalReviews, avgRating, highRated } = overall;
    const recentRating = result?.recent?.[0]?.recentAvg || 0;

    const signals = {
      totalReviews,
      averageRating: roundRating(avgRating),
      recommendationRate: totalReviews > 0 ? Math.round((highRated / totalReviews) * 100) : 0,
      verifiedReviewsCount: 0,
      responseRate: 0,
      recentRating: roundRating(recentRating)
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