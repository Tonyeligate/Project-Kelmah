const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Review Verification Model
 * 
 * This model stores verification data for reviews to detect potential fake reviews,
 * inappropriate content, or other suspicious activity.
 */
const ReviewVerificationSchema = new Schema(
  {
    reviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Review',
      required: true,
      index: true
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    workerId: {
      type: Schema.Types.ObjectId,
      ref: 'User', 
      required: true,
      index: true
    },
    // Content analysis
    contentAnalysis: {
      inappropriateContentScore: {
        type: Number,
        min: 0,
        max: 1,
        default: 0
      },
      spamScore: {
        type: Number,
        min: 0,
        max: 1,
        default: 0
      },
      sentimentScore: {
        type: Number, // -1 to 1, with -1 being very negative and 1 being very positive
        min: -1,
        max: 1
      },
      languageQualityScore: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.5
      },
      flaggedKeywords: [{
        type: String
      }]
    },
    // User behavior analysis
    behaviorAnalysis: {
      reviewerHistoryScore: {
        type: Number, // 0 to 1, with 1 being very trustworthy
        min: 0,
        max: 1
      },
      isFirstReview: {
        type: Boolean,
        default: false
      },
      reviewFrequency: {
        type: Number, // Number of reviews per month
        default: 0
      },
      hasWorkedTogether: {
        type: Boolean,
        default: false
      },
      contractCompletionDate: {
        type: Date
      },
      daysAfterCompletion: {
        type: Number,
        default: 0
      }
    },
    // Rating pattern analysis
    ratingAnalysis: {
      ratingDeviation: {
        type: Number, // How much this rating deviates from the worker's average
        default: 0
      },
      categoryConsistency: {
        type: Number, // 0 to 1, with 1 being very consistent across categories
        min: 0,
        max: 1,
        default: 0.5
      },
      ratingBias: {
        type: String,
        enum: ['none', 'positive', 'negative'],
        default: 'none'
      }
    },
    // IP and location data
    locationData: {
      ipAddress: {
        type: String
      },
      country: {
        type: String
      },
      city: {
        type: String
      },
      isIpMismatch: {
        type: Boolean,
        default: false
      },
      isSuspiciousLocation: {
        type: Boolean,
        default: false
      }
    },
    // Overall verification result
    verificationResult: {
      score: {
        type: Number, // 0 to 1, with 1 being fully verified
        min: 0,
        max: 1,
        default: 0.5
      },
      status: {
        type: String,
        enum: ['pending', 'verified', 'suspicious', 'rejected'],
        default: 'pending'
      },
      autoApproved: {
        type: Boolean,
        default: false
      },
      requiresManualReview: {
        type: Boolean,
        default: false
      },
      flags: [{
        type: String,
        enum: [
          'inappropriate_content',
          'spam_detected',
          'fake_review_suspected',
          'suspicious_pattern',
          'ip_mismatch',
          'suspicious_location',
          'excessive_reviews',
          'extreme_rating',
          'never_worked_together'
        ]
      }],
      verifiedAt: {
        type: Date
      },
      verifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      verificationNotes: {
        type: String
      }
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for efficient querying
ReviewVerificationSchema.index({ 'verificationResult.status': 1 });
ReviewVerificationSchema.index({ 'verificationResult.requiresManualReview': 1 });
ReviewVerificationSchema.index({ reviewerId: 1, workerId: 1 });

/**
 * Calculate overall verification score based on all analysis factors
 */
ReviewVerificationSchema.methods.calculateVerificationScore = function() {
  let score = 0;
  let totalFactors = 0;
  
  // Content analysis factors
  if (this.contentAnalysis) {
    if (this.contentAnalysis.inappropriateContentScore !== undefined) {
      score += (1 - this.contentAnalysis.inappropriateContentScore);
      totalFactors++;
    }
    
    if (this.contentAnalysis.spamScore !== undefined) {
      score += (1 - this.contentAnalysis.spamScore);
      totalFactors++;
    }
    
    if (this.contentAnalysis.languageQualityScore !== undefined) {
      score += this.contentAnalysis.languageQualityScore;
      totalFactors++;
    }
  }
  
  // Behavior analysis factors
  if (this.behaviorAnalysis) {
    if (this.behaviorAnalysis.reviewerHistoryScore !== undefined) {
      score += this.behaviorAnalysis.reviewerHistoryScore;
      totalFactors++;
    }
    
    if (this.behaviorAnalysis.hasWorkedTogether !== undefined) {
      score += (this.behaviorAnalysis.hasWorkedTogether ? 1 : 0);
      totalFactors++;
    }
  }
  
  // Rating analysis factors
  if (this.ratingAnalysis) {
    if (this.ratingAnalysis.categoryConsistency !== undefined) {
      score += this.ratingAnalysis.categoryConsistency;
      totalFactors++;
    }
    
    if (this.ratingAnalysis.ratingDeviation !== undefined) {
      // Lower deviation is better (max deviation could be 5 in a 5-star system)
      const normalizedDeviation = Math.min(this.ratingAnalysis.ratingDeviation, 5) / 5;
      score += (1 - normalizedDeviation);
      totalFactors++;
    }
  }
  
  // Location data factors
  if (this.locationData) {
    if (this.locationData.isIpMismatch !== undefined) {
      score += (this.locationData.isIpMismatch ? 0 : 1);
      totalFactors++;
    }
    
    if (this.locationData.isSuspiciousLocation !== undefined) {
      score += (this.locationData.isSuspiciousLocation ? 0 : 1);
      totalFactors++;
    }
  }
  
  // Calculate average score
  const finalScore = totalFactors > 0 ? score / totalFactors : 0.5;
  
  // Update verification result
  this.verificationResult.score = finalScore;
  
  // Determine status based on score
  if (finalScore >= 0.8) {
    this.verificationResult.status = 'verified';
    this.verificationResult.autoApproved = true;
    this.verificationResult.requiresManualReview = false;
  } else if (finalScore >= 0.5) {
    this.verificationResult.status = 'pending';
    this.verificationResult.autoApproved = false;
    this.verificationResult.requiresManualReview = true;
  } else {
    this.verificationResult.status = 'suspicious';
    this.verificationResult.autoApproved = false;
    this.verificationResult.requiresManualReview = true;
  }
  
  return this.verificationResult.score;
};

/**
 * Set verification flags based on analysis
 */
ReviewVerificationSchema.methods.setVerificationFlags = function() {
  const flags = [];
  
  // Content analysis flags
  if (this.contentAnalysis.inappropriateContentScore > 0.7) {
    flags.push('inappropriate_content');
  }
  
  if (this.contentAnalysis.spamScore > 0.7) {
    flags.push('spam_detected');
  }
  
  // Behavior analysis flags
  if (this.behaviorAnalysis.reviewerHistoryScore < 0.3) {
    flags.push('suspicious_pattern');
  }
  
  if (!this.behaviorAnalysis.hasWorkedTogether) {
    flags.push('never_worked_together');
  }
  
  if (this.behaviorAnalysis.reviewFrequency > 10) {
    flags.push('excessive_reviews');
  }
  
  // Rating analysis flags
  if (Math.abs(this.ratingAnalysis.ratingDeviation) > 2.5) {
    flags.push('extreme_rating');
  }
  
  // Location flags
  if (this.locationData.isIpMismatch) {
    flags.push('ip_mismatch');
  }
  
  if (this.locationData.isSuspiciousLocation) {
    flags.push('suspicious_location');
  }
  
  this.verificationResult.flags = flags;
  
  return flags;
};

/**
 * Static method to find reviews requiring manual verification
 */
ReviewVerificationSchema.statics.findReviewsRequiringVerification = function() {
  return this.find({
    'verificationResult.requiresManualReview': true,
    'verificationResult.status': { $in: ['pending', 'suspicious'] }
  }).populate('reviewId reviewerId workerId');
};

/**
 * Static method to verify a review by admin
 */
ReviewVerificationSchema.statics.verifyReview = async function(reviewVerificationId, adminId, status, notes) {
  const verification = await this.findById(reviewVerificationId);
  
  if (!verification) {
    throw new Error('Review verification not found');
  }
  
  verification.verificationResult.status = status;
  verification.verificationResult.verifiedBy = adminId;
  verification.verificationResult.verifiedAt = new Date();
  verification.verificationResult.verificationNotes = notes;
  verification.verificationResult.requiresManualReview = false;
  
  await verification.save();
  
  return verification;
};

const ReviewVerification = mongoose.model('ReviewVerification', ReviewVerificationSchema);
module.exports = ReviewVerification; 