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
  if (!workerId) {
    return {};
  }

  return {
    reviewee: Types.ObjectId.isValid(workerId)
      ? new Types.ObjectId(workerId)
      : workerId,
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
    quality: rounded,
    communication: rounded,
    timeliness: rounded,
    professionalism: rounded,
  };
};

/**
 * Get worker rating summary
 */
exports.getWorkerRating = async (req, res) => {
  try {
    const { workerId } = req.params;

    // For now, return a basic structure - full implementation would require WorkerRating model
    // This is a simplified version until the WorkerRating model is extracted

    const reviews = await Review.find(buildWorkerFilter(workerId)).lean();

    if (!reviews || reviews.length === 0) {
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

    // Calculate basic stats
    const totalReviews = reviews.length;
    const ratingSum = reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0);
    const averageRating = totalReviews > 0 ? ratingSum / totalReviews : 0;
    const ratingDistribution = buildRatingDistribution(reviews);
    const recommendationRate = totalReviews > 0
      ? Math.round((reviews.filter(r => (Number(r.rating) || 0) >= 4).length / totalReviews) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        workerId,
        totalReviews,
        averageRating: roundRating(averageRating),
        ratings: buildRatingsBreakdown(averageRating),
        ratingDistribution,
        categoryRatings: [],
        recommendationRate,
        verifiedReviewsCount: 0,
        responseRate: 0,
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

    const reviews = await Review.find(buildWorkerFilter(workerId)).lean();

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
    const ratingValues = reviews.map((r) => Number(r.rating) || 0);
    const averageRating = totalReviews > 0
      ? ratingValues.reduce((sum, rating) => sum + rating, 0) / totalReviews
      : 0;
    const recommendationRate = totalReviews > 0
      ? Math.round((ratingValues.filter((rating) => rating >= 4).length / totalReviews) * 100)
      : 0;
    const responseRate = 0;

    const recentReviews = reviews
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 10);
    const recentRating = recentReviews.length > 0
      ? recentReviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / recentReviews.length
      : 0;

    const signals = {
      totalReviews,
      averageRating: roundRating(averageRating),
      recommendationRate,
      verifiedReviewsCount: 0,
      responseRate,
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