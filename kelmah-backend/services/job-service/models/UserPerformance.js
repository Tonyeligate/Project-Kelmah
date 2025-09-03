/**
 * User Performance Model - Track user metrics and tier management
 */

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserPerformanceSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true
    },
    metrics: {
      jobCompletionRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      clientSatisfaction: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      responseTime: {
        type: Number,
        min: 0,
        default: 0 // in hours
      },
      profileCompleteness: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      verifiedSkillsCount: {
        type: Number,
        min: 0,
        default: 0
      },
      totalJobsCompleted: {
        type: Number,
        min: 0,
        default: 0
      },
      totalEarnings: {
        type: Number,
        min: 0,
        default: 0
      },
      averageRating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
      },
      onTimeDeliveryRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      }
    },
    performanceTier: {
      type: String,
      enum: ["tier1", "tier2", "tier3"],
      default: "tier3"
    },
    monthlyBidQuota: {
      type: Number,
      default: 5,
      min: 0,
      max: 10
    },
    bidHistory: [{
      jobId: {
        type: Schema.Types.ObjectId,
        ref: "Job"
      },
      bidDate: {
        type: Date,
        default: Date.now
      },
      outcome: {
        type: String,
        enum: ["accepted", "rejected", "withdrawn", "expired"]
      },
      bidAmount: Number,
      jobTitle: String
    }],
    skillVerification: {
      primarySkills: [{
        skill: {
          type: String,
          enum: ["Plumbing", "Electrical", "Carpentry", "Construction", "Painting", "Welding", "Masonry", "HVAC", "Roofing", "Flooring"]
        },
        verified: {
          type: Boolean,
          default: false
        },
        verifiedAt: Date,
        verifiedBy: {
          type: Schema.Types.ObjectId,
          ref: "User"
        },
        verificationMethod: {
          type: String,
          enum: ["portfolio", "testimonial", "assessment", "peer_review", "agent_interview"]
        },
        experienceMonths: {
          type: Number,
          min: 0
        }
      }],
      secondarySkills: [{
        skill: {
          type: String,
          enum: ["Plumbing", "Electrical", "Carpentry", "Construction", "Painting", "Welding", "Masonry", "HVAC", "Roofing", "Flooring"]
        },
        verified: {
          type: Boolean,
          default: false
        },
        verifiedAt: Date,
        verifiedBy: {
          type: Schema.Types.ObjectId,
          ref: "User"
        },
        verificationMethod: {
          type: String,
          enum: ["portfolio", "testimonial", "assessment", "peer_review", "agent_interview"]
        },
        experienceMonths: {
          type: Number,
          min: 0
        }
      }]
    },
    locationPreferences: {
      primaryRegion: {
        type: String,
        enum: ["Greater Accra", "Ashanti", "Western", "Eastern", "Central", "Volta", "Northern", "Upper East", "Upper West", "Brong-Ahafo"]
      },
      preferredCities: [String],
      maxTravelDistance: {
        type: Number,
        default: 25, // in kilometers
        min: 5,
        max: 100
      },
      willingToRelocate: {
        type: Boolean,
        default: false
      }
    },
    performanceHistory: [{
      date: {
        type: Date,
        default: Date.now
      },
      tier: String,
      metrics: {
        jobCompletionRate: Number,
        clientSatisfaction: Number,
        responseTime: Number,
        profileCompleteness: Number,
        verifiedSkillsCount: Number
      },
      reason: String // Reason for tier change
    }],
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    nextReviewDate: {
      type: Date,
      default: function() {
        // Review every 30 days
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance queries
UserPerformanceSchema.index({ userId: 1 });
UserPerformanceSchema.index({ performanceTier: 1 });
UserPerformanceSchema.index({ "metrics.jobCompletionRate": -1 });
UserPerformanceSchema.index({ "metrics.clientSatisfaction": -1 });
UserPerformanceSchema.index({ lastUpdated: -1 });

// Virtual field to calculate overall performance score
UserPerformanceSchema.virtual("overallScore").get(function() {
  const weights = {
    jobCompletionRate: 0.25,
    clientSatisfaction: 0.25,
    responseTime: 0.15,
    profileCompleteness: 0.15,
    verifiedSkillsCount: 0.10,
    onTimeDeliveryRate: 0.10
  };
  
  let score = 0;
  score += this.metrics.jobCompletionRate * weights.jobCompletionRate;
  score += this.metrics.clientSatisfaction * weights.clientSatisfaction;
  score += Math.max(0, 100 - (this.metrics.responseTime * 2)) * weights.responseTime; // Lower response time = higher score
  score += this.metrics.profileCompleteness * weights.profileCompleteness;
  score += Math.min(100, this.metrics.verifiedSkillsCount * 20) * weights.verifiedSkillsCount; // Max 5 skills = 100%
  score += this.metrics.onTimeDeliveryRate * weights.onTimeDeliveryRate;
  
  return Math.round(score);
});

// Virtual field to check if user can add secondary skills
UserPerformanceSchema.virtual("canAddSecondarySkill").get(function() {
  const primarySkill = this.skillVerification.primarySkills.find(skill => skill.verified);
  if (!primarySkill) return false;
  
  const hasMinExperience = primarySkill.experienceMonths >= 6;
  const hasSpaceForSecondary = this.skillVerification.secondarySkills.length < 3;
  
  return hasMinExperience && hasSpaceForSecondary;
});

// Instance methods
UserPerformanceSchema.methods.updateMetrics = function(newMetrics) {
  Object.keys(newMetrics).forEach(key => {
    if (this.metrics[key] !== undefined) {
      this.metrics[key] = newMetrics[key];
    }
  });
  
  this.lastUpdated = new Date();
  return this.save();
};

UserPerformanceSchema.methods.addBidHistory = function(jobId, outcome, bidAmount, jobTitle) {
  this.bidHistory.push({
    jobId,
    outcome,
    bidAmount,
    jobTitle
  });
  
  // Keep only last 50 bid history entries
  if (this.bidHistory.length > 50) {
    this.bidHistory = this.bidHistory.slice(-50);
  }
  
  return this.save();
};

UserPerformanceSchema.methods.verifySkill = function(skill, isPrimary, verificationData) {
  const skillArray = isPrimary ? this.skillVerification.primarySkills : this.skillVerification.secondarySkills;
  
  let skillEntry = skillArray.find(s => s.skill === skill);
  if (!skillEntry) {
    skillEntry = {
      skill,
      verified: false,
      experienceMonths: 0
    };
    skillArray.push(skillEntry);
  }
  
  skillEntry.verified = true;
  skillEntry.verifiedAt = new Date();
  skillEntry.verifiedBy = verificationData.verifiedBy;
  skillEntry.verificationMethod = verificationData.method;
  skillEntry.experienceMonths = verificationData.experienceMonths || 0;
  
  this.metrics.verifiedSkillsCount = this.skillVerification.primarySkills.filter(s => s.verified).length +
                                   this.skillVerification.secondarySkills.filter(s => s.verified).length;
  
  return this.save();
};

UserPerformanceSchema.methods.updateTier = function(newTier, reason = "") {
  const oldTier = this.performanceTier;
  this.performanceTier = newTier;
  
  // Add to performance history
  this.performanceHistory.push({
    tier: newTier,
    metrics: { ...this.metrics },
    reason
  });
  
  // Keep only last 12 tier changes
  if (this.performanceHistory.length > 12) {
    this.performanceHistory = this.performanceHistory.slice(-12);
  }
  
  // Update bid quota based on tier
  switch (newTier) {
    case "tier1":
      this.monthlyBidQuota = 8;
      break;
    case "tier2":
      this.monthlyBidQuota = 6;
      break;
    case "tier3":
      this.monthlyBidQuota = 5;
      break;
  }
  
  this.lastUpdated = new Date();
  return this.save();
};

UserPerformanceSchema.methods.calculateTier = function() {
  const score = this.overallScore;
  const verifiedPrimarySkills = this.skillVerification.primarySkills.filter(s => s.verified).length;
  const verifiedSecondarySkills = this.skillVerification.secondarySkills.filter(s => s.verified).length;
  
  // Tier 1: Premium Access
  if (score >= 90 && verifiedPrimarySkills >= 1 && this.metrics.profileCompleteness >= 90) {
    return "tier1";
  }
  
  // Tier 2: Verified Access
  if (score >= 75 && verifiedPrimarySkills >= 1 && this.metrics.profileCompleteness >= 75) {
    return "tier2";
  }
  
  // Tier 3: Standard Access
  return "tier3";
};

UserPerformanceSchema.methods.getBidSuccessRate = function() {
  const totalBids = this.bidHistory.length;
  if (totalBids === 0) return 0;
  
  const successfulBids = this.bidHistory.filter(bid => bid.outcome === "accepted").length;
  return Math.round((successfulBids / totalBids) * 100);
};

// Static methods
UserPerformanceSchema.statics.findByTier = function(tier) {
  return this.find({ performanceTier: tier });
};

UserPerformanceSchema.statics.findTopPerformers = function(limit = 10) {
  return this.find()
    .sort({ "metrics.jobCompletionRate": -1, "metrics.clientSatisfaction": -1 })
    .limit(limit);
};

UserPerformanceSchema.statics.findByLocation = function(region) {
  return this.find({ "locationPreferences.primaryRegion": region });
};

UserPerformanceSchema.statics.findBySkill = function(skill) {
  return this.find({
    $or: [
      { "skillVerification.primarySkills.skill": skill },
      { "skillVerification.secondarySkills.skill": skill }
    ]
  });
};

// Pre-save middleware to auto-calculate tier
UserPerformanceSchema.pre('save', function(next) {
  if (this.isModified('metrics') || this.isModified('skillVerification')) {
    const calculatedTier = this.calculateTier();
    if (calculatedTier !== this.performanceTier) {
      this.updateTier(calculatedTier, "Auto-calculated based on performance metrics");
    }
  }
  next();
});

const UserPerformance = mongoose.model("UserPerformance", UserPerformanceSchema);

module.exports = UserPerformance;
