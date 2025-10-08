/**
 * Job Model
 */

const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [100, "Job title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
      trim: true,
      maxlength: [5000, "Job description cannot be more than 5000 characters"],
    },
    category: {
      type: String,
      required: [true, "Job category is required"],
      trim: true,
    },
    skills: [
      {
        type: String,
        required: [true, "At least one skill is required"],
        trim: true,
      },
    ],
    budget: {
      type: Number,
      required: [true, "Budget is required"],
    },
    currency: {
      type: String,
      default: 'GHS',
      trim: true
    },
    duration: {
      value: {
        type: Number,
        required: [true, "Duration value is required"],
      },
      unit: {
        type: String,
        enum: ["hour", "day", "week", "month"],
        required: [true, "Duration unit is required"],
      },
    },
    paymentType: {
      type: String,
      enum: ["fixed", "hourly"],
      required: [true, "Payment type is required"],
    },
    location: {
      type: {
        type: String,
        enum: ["remote", "onsite", "hybrid"],
        required: [true, "Location type is required"],
      },
      country: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
    },
    status: {
      type: String,
      enum: ["draft", "open", "in-progress", "completed", "cancelled"],
      default: "open",
    },
    visibility: {
      type: String,
      enum: ["public", "private", "invite-only"],
      default: "public",
    },
    attachments: [
      {
        name: String,
        url: String,
        type: String,
        size: Number,
      },
    ],
    hirer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Hirer is required"],
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    proposalCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    completedDate: {
      type: Date,
    },
    
    // Enhanced fields for bidding system
    bidding: {
      maxBidders: { 
        type: Number, 
        default: 5,
        min: 1,
        max: 10
      },
      currentBidders: { 
        type: Number, 
        default: 0 
      },
      bidDeadline: {
        type: Date,
        default: function() {
          // Default to 7 days from creation
          return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }
      },
      minBidAmount: {
        type: Number,
        required: [true, "Minimum bid amount is required"]
      },
      maxBidAmount: {
        type: Number,
        required: [true, "Maximum bid amount is required"]
      },
      bidStatus: { 
        type: String, 
        enum: ["open", "closed", "full"],
        default: "open"
      }
    },
    
    // Enhanced location details for Ghana cities
    locationDetails: {
      region: {
        type: String,
        enum: ["Greater Accra", "Ashanti", "Western", "Eastern", "Central", "Volta", "Northern", "Upper East", "Upper West", "Brong-Ahafo"],
        required: [true, "Region is required"]
      },
      district: {
        type: String,
        trim: true
      },
      coordinates: {
        lat: {
          type: Number,
          min: -90,
          max: 90
        },
        lng: {
          type: Number,
          min: -180,
          max: 180
        }
      },
      searchRadius: {
        type: Number,
        default: 25, // Default 25km radius
        min: 5,
        max: 100
      }
    },
    
    // Enhanced requirements for skill matching
    requirements: {
      primarySkills: [{
        type: String,
        enum: ["Plumbing", "Electrical", "Carpentry", "Construction", "Painting", "Welding", "Masonry", "HVAC", "Roofing", "Flooring"],
        required: [true, "At least one primary skill is required"]
      }],
      secondarySkills: [{
        type: String,
        enum: ["Plumbing", "Electrical", "Carpentry", "Construction", "Painting", "Welding", "Masonry", "HVAC", "Roofing", "Flooring"]
      }],
      experienceLevel: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
        default: "intermediate"
      },
      certifications: [{
        type: String,
        trim: true
      }],
      tools: [{
        type: String,
        trim: true
      }]
    },
    
    // Performance tier for job visibility
    performanceTier: {
      type: String,
      enum: ["tier1", "tier2", "tier3"],
      default: "tier3"
    },
    
    // Auto-expiry system
    expiresAt: {
      type: Date,
      default: function() {
        // Auto-expire after 30 days
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
    },
    
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    bufferCommands: false, // Disable buffering - fail fast if connection not ready
    autoCreate: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual fields for bids (replacing proposals)
JobSchema.virtual("bids", {
  ref: "Bid",
  localField: "_id",
  foreignField: "job",
  justOne: false,
});

// Virtual field for contract
JobSchema.virtual("contract", {
  ref: "Contract",
  localField: "_id",
  foreignField: "job",
  justOne: true,
});

// Virtual field to check if job is expired
JobSchema.virtual("isExpired").get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Virtual field to check if bidding is open
JobSchema.virtual("isBiddingOpen").get(function() {
  return this.bidding.bidStatus === "open" && 
         this.bidding.currentBidders < this.bidding.maxBidders &&
         this.bidding.bidDeadline > new Date() &&
         !this.isExpired;
});

// Instance methods
JobSchema.methods.updateBidCount = function() {
  return this.constructor.countDocuments({ 
    _id: this._id,
    'bids.status': 'pending'
  }).then(count => {
    this.bidding.currentBidders = count;
    if (count >= this.bidding.maxBidders) {
      this.bidding.bidStatus = 'full';
    }
    return this.save();
  });
};

JobSchema.methods.closeBidding = function() {
  this.bidding.bidStatus = 'closed';
  return this.save();
};

JobSchema.methods.extendDeadline = function(days = 7) {
  this.bidding.bidDeadline = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return this.save();
};

JobSchema.methods.renewJob = function() {
  this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  this.bidding.bidStatus = 'open';
  this.bidding.currentBidders = 0;
  return this.save();
};

// Static methods
JobSchema.statics.findByLocation = function(region, district = null) {
  const query = { 'locationDetails.region': region };
  if (district) {
    query['locationDetails.district'] = district;
  }
  return this.find(query);
};

JobSchema.statics.findBySkill = function(skill) {
  return this.find({
    $or: [
      { 'requirements.primarySkills': skill },
      { 'requirements.secondarySkills': skill },
      { skills: skill }
    ]
  });
};

JobSchema.statics.findByPerformanceTier = function(tier) {
  return this.find({ performanceTier: tier });
};

JobSchema.statics.findExpiredJobs = function() {
  return this.find({ expiresAt: { $lt: new Date() } });
};

// Index for text search
JobSchema.index({
  title: "text",
  description: "text",
  category: "text",
  skills: "text",
  "requirements.primarySkills": "text",
  "requirements.secondarySkills": "text"
});

// Geo index for location-based queries
JobSchema.index({ "locationDetails.coordinates": "2dsphere" });

// Compound indexes for performance
JobSchema.index({ "locationDetails.region": 1, "requirements.primarySkills": 1 });
JobSchema.index({ "performanceTier": 1, "bidding.bidStatus": 1 });
JobSchema.index({ "expiresAt": 1, "status": 1 });

// Export model, reusing existing definition if present to avoid overwrite
const JobModel = mongoose.models.Job || mongoose.model("Job", JobSchema);
module.exports = JobModel;
