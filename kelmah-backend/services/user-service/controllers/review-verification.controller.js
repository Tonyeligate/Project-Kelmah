const Review = require('../models/review.model');
const User = require('../models/user.model');
const Contract = require('../models/contract.model');
const ReviewVerification = require('../models/review-verification.model');
const { getIpInfo } = require('../utils/ip-utils');
const { analyzeText } = require('../utils/text-analysis');

/**
 * Controller for handling review verification logic
 */
const reviewVerificationController = {
  /**
   * Create verification record for a new review
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async verifyReview(req, res) {
    try {
      const { reviewId } = req.params;
      
      // Get review data
      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }
      
      // Check if verification already exists
      const existingVerification = await ReviewVerification.findOne({ reviewId });
      if (existingVerification) {
        return res.status(400).json({
          success: false,
          message: 'Verification already exists for this review'
        });
      }
      
      // Create verification record
      const verification = await createVerificationRecord(review, req.ip);
      
      return res.status(201).json({
        success: true,
        verification
      });
    } catch (error) {
      console.error('Error verifying review:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verifying review',
        error: error.message
      });
    }
  },
  
  /**
   * Get verification details for a specific review
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getVerificationDetails(req, res) {
    try {
      const { reviewId } = req.params;
      
      const verification = await ReviewVerification.findOne({ reviewId })
        .populate('reviewId', 'rating comment strengths jobId')
        .populate('reviewerId', 'firstName lastName profilePhoto')
        .populate('workerId', 'firstName lastName profilePhoto');
      
      if (!verification) {
        return res.status(404).json({
          success: false,
          message: 'Verification not found for this review'
        });
      }
      
      return res.status(200).json({
        success: true,
        verification
      });
    } catch (error) {
      console.error('Error getting verification details:', error);
      return res.status(500).json({
        success: false,
        message: 'Error getting verification details',
        error: error.message
      });
    }
  },
  
  /**
   * Get reviews requiring verification (for admin dashboard)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getReviewsRequiringVerification(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;
      
      const verifications = await ReviewVerification.find({
        'verificationResult.requiresManualReview': true,
        'verificationResult.status': { $in: ['pending', 'suspicious'] }
      })
        .populate('reviewId', 'rating comment strengths jobId createdAt')
        .populate('reviewerId', 'firstName lastName email profilePhoto')
        .populate('workerId', 'firstName lastName email profilePhoto')
        .sort({ 'verificationResult.score': 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      const total = await ReviewVerification.countDocuments({
        'verificationResult.requiresManualReview': true,
        'verificationResult.status': { $in: ['pending', 'suspicious'] }
      });
      
      return res.status(200).json({
        success: true,
        verifications,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error getting reviews requiring verification:', error);
      return res.status(500).json({
        success: false,
        message: 'Error getting reviews requiring verification',
        error: error.message
      });
    }
  },
  
  /**
   * Admin manual verification of a review
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async manuallyVerifyReview(req, res) {
    try {
      const { verificationId } = req.params;
      const { status, notes } = req.body;
      const adminId = req.user.id;
      
      if (!['verified', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be "verified" or "rejected"'
        });
      }
      
      // Update verification record
      const verification = await ReviewVerification.findById(verificationId);
      if (!verification) {
        return res.status(404).json({
          success: false,
          message: 'Verification record not found'
        });
      }
      
      verification.verificationResult.status = status;
      verification.verificationResult.verifiedBy = adminId;
      verification.verificationResult.verifiedAt = new Date();
      verification.verificationResult.verificationNotes = notes;
      verification.verificationResult.requiresManualReview = false;
      
      await verification.save();
      
      // Update review status based on verification
      const review = await Review.findById(verification.reviewId);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }
      
      review.status = status === 'verified' ? 'approved' : 'rejected';
      review.moderatedAt = new Date();
      review.moderatedBy = adminId;
      
      await review.save();
      
      // If status is verified, update worker's average rating
      if (status === 'verified') {
        await updateWorkerRating(verification.workerId);
      }
      
      return res.status(200).json({
        success: true,
        message: `Review has been ${status}`,
        verification
      });
    } catch (error) {
      console.error('Error manually verifying review:', error);
      return res.status(500).json({
        success: false,
        message: 'Error manually verifying review',
        error: error.message
      });
    }
  },
  
  /**
   * Get verification stats for admin dashboard
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getVerificationStats(req, res) {
    try {
      const pendingCount = await ReviewVerification.countDocuments({
        'verificationResult.status': 'pending',
        'verificationResult.requiresManualReview': true
      });
      
      const suspiciousCount = await ReviewVerification.countDocuments({
        'verificationResult.status': 'suspicious'
      });
      
      const verifiedCount = await ReviewVerification.countDocuments({
        'verificationResult.status': 'verified'
      });
      
      const rejectedCount = await ReviewVerification.countDocuments({
        'verificationResult.status': 'rejected'
      });
      
      const autoApprovedCount = await ReviewVerification.countDocuments({
        'verificationResult.autoApproved': true
      });
      
      // Get flag distribution
      const flagAggregation = await ReviewVerification.aggregate([
        { $unwind: '$verificationResult.flags' },
        { $group: {
            _id: '$verificationResult.flags',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      return res.status(200).json({
        success: true,
        stats: {
          counts: {
            pending: pendingCount,
            suspicious: suspiciousCount,
            verified: verifiedCount,
            rejected: rejectedCount,
            autoApproved: autoApprovedCount,
            total: pendingCount + suspiciousCount + verifiedCount + rejectedCount
          },
          flagDistribution: flagAggregation
        }
      });
    } catch (error) {
      console.error('Error getting verification stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Error getting verification stats',
        error: error.message
      });
    }
  }
};

/**
 * Create a verification record for a review
 * @param {Object} review - The review to verify
 * @param {string} ip - IP address of the reviewer
 * @returns {Promise<Object>} The created verification record
 */
async function createVerificationRecord(review, ip) {
  try {
    // Create verification record with basic info
    const verification = new ReviewVerification({
      reviewId: review._id,
      reviewerId: review.clientId,
      workerId: review.workerId
    });
    
    // Get reviewer and worker data
    const [reviewer, worker] = await Promise.all([
      User.findById(review.clientId),
      User.findById(review.workerId)
    ]);
    
    // Check if they worked together
    const contract = await Contract.findOne({
      clientId: review.clientId,
      workerId: review.workerId,
      status: 'completed'
    });
    
    // Perform content analysis
    const contentAnalysis = await analyzeReviewContent(review.comment, review.strengths);
    verification.contentAnalysis = contentAnalysis;
    
    // Analyze user behavior
    const behaviorAnalysis = await analyzeUserBehavior(reviewer, worker, contract, review);
    verification.behaviorAnalysis = behaviorAnalysis;
    
    // Analyze rating patterns
    const ratingAnalysis = await analyzeRatingPatterns(review, worker);
    verification.ratingAnalysis = ratingAnalysis;
    
    // Get IP and location data
    const locationData = await getLocationData(ip, reviewer);
    verification.locationData = locationData;
    
    // Calculate verification score and set flags
    verification.calculateVerificationScore();
    verification.setVerificationFlags();
    
    // Save and return the verification
    await verification.save();
    
    // If auto-approved, update the review status
    if (verification.verificationResult.autoApproved) {
      await Review.findByIdAndUpdate(review._id, {
        status: 'approved',
        moderatedAt: new Date()
      });
      
      // Update worker's average rating
      await updateWorkerRating(review.workerId);
    }
    
    return verification;
  } catch (error) {
    console.error('Error creating verification record:', error);
    throw error;
  }
}

/**
 * Analyze review content for suspicious patterns
 * @param {string} comment - Review comment
 * @param {Array} strengths - Review strengths
 * @returns {Object} Content analysis results
 */
async function analyzeReviewContent(comment, strengths) {
  try {
    const combinedText = `${comment} ${strengths.join(' ')}`;
    
    // Use text analysis service to analyze content
    const analysisResult = await analyzeText(combinedText);
    
    return {
      inappropriateContentScore: analysisResult.inappropriateScore || 0,
      spamScore: analysisResult.spamScore || 0,
      sentimentScore: analysisResult.sentimentScore || 0,
      languageQualityScore: analysisResult.qualityScore || 0.5,
      flaggedKeywords: analysisResult.flaggedKeywords || []
    };
  } catch (error) {
    console.error('Error analyzing review content:', error);
    
    // Return default values if analysis fails
    return {
      inappropriateContentScore: 0,
      spamScore: 0,
      sentimentScore: 0,
      languageQualityScore: 0.5,
      flaggedKeywords: []
    };
  }
}

/**
 * Analyze user behavior for suspicious patterns
 * @param {Object} reviewer - The reviewer user object
 * @param {Object} worker - The worker user object
 * @param {Object} contract - The contract object (if exists)
 * @param {Object} review - The review object
 * @returns {Object} Behavior analysis results
 */
async function analyzeUserBehavior(reviewer, worker, contract, review) {
  try {
    // Check if this is the reviewer's first review
    const reviewCount = await Review.countDocuments({ clientId: reviewer._id });
    const isFirstReview = reviewCount <= 1;
    
    // Calculate review frequency (reviews per month)
    const userCreationDate = new Date(reviewer.createdAt);
    const monthsSinceCreation = (Date.now() - userCreationDate) / (1000 * 60 * 60 * 24 * 30);
    const reviewFrequency = monthsSinceCreation > 0 ? reviewCount / monthsSinceCreation : reviewCount;
    
    // Check if they worked together and contract completion details
    const hasWorkedTogether = !!contract;
    
    let contractCompletionDate = null;
    let daysAfterCompletion = 0;
    
    if (hasWorkedTogether) {
      contractCompletionDate = new Date(contract.completedAt || contract.updatedAt);
      daysAfterCompletion = Math.floor((new Date(review.createdAt) - contractCompletionDate) / (1000 * 60 * 60 * 24));
    }
    
    // Calculate reviewer history score (0 to 1, with 1 being trustworthy)
    // Factors: account age, previous reviews, profile completeness
    const accountAgeDays = Math.floor((Date.now() - userCreationDate) / (1000 * 60 * 60 * 24));
    const hasProfilePhoto = !!reviewer.profilePhoto;
    const hasCompletedProfile = reviewer.firstName && reviewer.lastName && reviewer.email && reviewer.phone;
    
    let reviewerHistoryScore = 0.5; // Start with neutral score
    
    // Increase score for older accounts (max bonus: 0.2)
    reviewerHistoryScore += Math.min(accountAgeDays / 365, 1) * 0.2;
    
    // Increase score for more reviews (max bonus: 0.1)
    reviewerHistoryScore += Math.min(reviewCount / 10, 1) * 0.1;
    
    // Increase score for profile completeness (max bonus: 0.2)
    reviewerHistoryScore += (hasProfilePhoto ? 0.1 : 0) + (hasCompletedProfile ? 0.1 : 0);
    
    // Decrease score for very high review frequency (penalty up to 0.2)
    if (reviewFrequency > 5) {
      reviewerHistoryScore -= Math.min((reviewFrequency - 5) / 10, 0.2);
    }
    
    // Cap score between 0 and 1
    reviewerHistoryScore = Math.max(0, Math.min(reviewerHistoryScore, 1));
    
    return {
      reviewerHistoryScore,
      isFirstReview,
      reviewFrequency,
      hasWorkedTogether,
      contractCompletionDate,
      daysAfterCompletion
    };
  } catch (error) {
    console.error('Error analyzing user behavior:', error);
    
    // Return default values if analysis fails
    return {
      reviewerHistoryScore: 0.5,
      isFirstReview: false,
      reviewFrequency: 0,
      hasWorkedTogether: false,
      contractCompletionDate: null,
      daysAfterCompletion: 0
    };
  }
}

/**
 * Analyze rating patterns for suspicious activity
 * @param {Object} review - The review object
 * @param {Object} worker - The worker user object
 * @returns {Object} Rating analysis results
 */
async function analyzeRatingPatterns(review, worker) {
  try {
    // Get worker's average rating
    const workerRating = worker.rating || 0;
    
    // Calculate deviation from average
    const ratingDeviation = review.rating - workerRating;
    
    // Determine rating bias
    let ratingBias = 'none';
    if (ratingDeviation > 1) {
      ratingBias = 'positive';
    } else if (ratingDeviation < -1) {
      ratingBias = 'negative';
    }
    
    // Calculate category consistency (if rating categories exist)
    // This is a placeholder - implement based on your rating categories
    const categoryConsistency = 0.5; // Default to neutral
    
    return {
      ratingDeviation,
      categoryConsistency,
      ratingBias
    };
  } catch (error) {
    console.error('Error analyzing rating patterns:', error);
    
    // Return default values if analysis fails
    return {
      ratingDeviation: 0,
      categoryConsistency: 0.5,
      ratingBias: 'none'
    };
  }
}

/**
 * Get location data from IP address
 * @param {string} ip - IP address
 * @param {Object} reviewer - The reviewer user object
 * @returns {Object} Location data
 */
async function getLocationData(ip, reviewer) {
  try {
    // Get IP info using external service
    const ipInfo = await getIpInfo(ip);
    
    // Check if IP location matches user's location
    const isIpMismatch = reviewer.location && 
      reviewer.location.country && 
      ipInfo.country && 
      reviewer.location.country !== ipInfo.country;
    
    // Check for suspicious locations (proxy, VPN, etc.)
    const isSuspiciousLocation = ipInfo.proxy || ipInfo.tor || ipInfo.vpn;
    
    return {
      ipAddress: ip,
      country: ipInfo.country,
      city: ipInfo.city,
      isIpMismatch,
      isSuspiciousLocation
    };
  } catch (error) {
    console.error('Error getting location data:', error);
    
    // Return default values if location check fails
    return {
      ipAddress: ip,
      country: null,
      city: null,
      isIpMismatch: false,
      isSuspiciousLocation: false
    };
  }
}

/**
 * Update worker's average rating
 * @param {string} workerId - Worker ID
 * @returns {Promise<void>}
 */
async function updateWorkerRating(workerId) {
  try {
    // Find all approved reviews for this worker
    const reviews = await Review.find({
      workerId,
      status: 'approved'
    });
    
    if (reviews.length === 0) {
      // No approved reviews yet, set rating to 0
      await User.findByIdAndUpdate(workerId, { rating: 0 });
      return;
    }
    
    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    // Update worker's rating
    await User.findByIdAndUpdate(workerId, {
      rating: averageRating,
      reviewCount: reviews.length
    });
  } catch (error) {
    console.error('Error updating worker rating:', error);
    throw error;
  }
}

module.exports = reviewVerificationController; 