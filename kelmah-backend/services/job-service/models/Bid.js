/**
 * Bid Model - Enhanced Application Model with Bidding System
 */

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BidSchema = new Schema(
  {
    job: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: [true, "Job reference is required"],
    },
    worker: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Worker reference is required"],
    },
    bidAmount: {
      type: Number,
      required: [true, "Bid amount is required"],
      min: [0, "Bid amount cannot be negative"],
    },
    estimatedDuration: {
      value: {
        type: Number,
        required: [true, "Duration value is required"],
        min: [1, "Duration must be at least 1"]
      },
      unit: {
        type: String,
        enum: ["hour", "day", "week", "month"],
        required: [true, "Duration unit is required"],
        default: "day"
      },
    },
    coverLetter: {
      type: String,
      required: [true, "Cover letter is required"],
      maxlength: [2000, "Cover letter cannot exceed 2000 characters"],
      trim: true
    },
    portfolio: [{
      name: String,
      url: String,
      type: String, // "image", "document", "video"
      description: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    availability: {
      startDate: {
        type: Date,
        required: [true, "Availability start date is required"]
      },
      endDate: Date,
      hoursPerWeek: {
        type: Number,
        min: [1, "Must be at least 1 hour per week"],
        max: [168, "Cannot exceed 168 hours per week"]
      },
      flexible: {
        type: Boolean,
        default: false
      }
    },
    bidTimestamp: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "withdrawn", "expired"],
      default: "pending"
    },
    monthlyBidCount: {
      type: Number,
      default: 0
    },
    performanceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    hirerNotes: {
      type: String,
      maxlength: [1000, "Hirer notes cannot exceed 1000 characters"]
    },
    workerNotes: {
      type: String,
      maxlength: [1000, "Worker notes cannot exceed 1000 characters"]
    },
    // Track bid modifications
    modifications: [{
      modifiedAt: {
        type: Date,
        default: Date.now
      },
      field: String,
      oldValue: Schema.Types.Mixed,
      newValue: Schema.Types.Mixed,
      reason: String
    }],
    // Auto-expiry for bids
    expiresAt: {
      type: Date,
      default: function() {
        // Bids expire after 7 days if not responded to
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Ensure a worker can't bid on the same job multiple times
BidSchema.index({ job: 1, worker: 1 }, { unique: true });

// Index for performance queries
BidSchema.index({ worker: 1, status: 1 });
BidSchema.index({ job: 1, status: 1 });
BidSchema.index({ bidTimestamp: -1 });
BidSchema.index({ expiresAt: 1 });

// Virtual field to check if bid is expired
BidSchema.virtual("isExpired").get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Virtual field to check if bid can be modified
BidSchema.virtual("canModify").get(function() {
  return this.status === "pending" && !this.isExpired;
});

// Instance methods
BidSchema.methods.accept = function(hirerNotes = "") {
  this.status = "accepted";
  this.hirerNotes = hirerNotes;
  return this.save();
};

BidSchema.methods.reject = function(hirerNotes = "") {
  this.status = "rejected";
  this.hirerNotes = hirerNotes;
  return this.save();
};

BidSchema.methods.withdraw = function(workerNotes = "") {
  this.status = "withdrawn";
  this.workerNotes = workerNotes;
  return this.save();
};

BidSchema.methods.modifyBid = function(field, newValue, reason = "") {
  if (!this.canModify) {
    throw new Error("Bid cannot be modified");
  }
  
  const oldValue = this[field];
  this[field] = newValue;
  
  this.modifications.push({
    field,
    oldValue,
    newValue,
    reason
  });
  
  return this.save();
};

BidSchema.methods.extendExpiry = function(days = 7) {
  this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return this.save();
};

// Static methods
BidSchema.statics.findByWorker = function(workerId, status = null) {
  const query = { worker: workerId };
  if (status) {
    query.status = status;
  }
  return this.find(query).populate('job', 'title category locationDetails.region');
};

BidSchema.statics.findByJob = function(jobId, status = null) {
  const query = { job: jobId };
  if (status) {
    query.status = status;
  }
  return this.find(query).populate('worker', 'firstName lastName profilePicture');
};

BidSchema.statics.findExpiredBids = function() {
  return this.find({ 
    expiresAt: { $lt: new Date() },
    status: "pending"
  });
};

BidSchema.statics.getWorkerMonthlyBidCount = function(workerId, month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  return this.countDocuments({
    worker: workerId,
    bidTimestamp: {
      $gte: startDate,
      $lte: endDate
    }
  });
};

BidSchema.statics.getJobBidCount = function(jobId) {
  return this.countDocuments({
    job: jobId,
    status: "pending"
  });
};

// Pre-save middleware to update monthly bid count
BidSchema.pre('save', async function(next) {
  if (this.isNew) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    this.monthlyBidCount = await this.constructor.getWorkerMonthlyBidCount(
      this.worker, 
      month, 
      year
    );
  }
  next();
});

// Pre-save middleware to validate bid amount against job constraints
BidSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('bidAmount')) {
    const Job = mongoose.model('Job');
    const job = await Job.findById(this.job);
    
    if (job) {
      if (this.bidAmount < job.bidding.minBidAmount) {
        return next(new Error(`Bid amount must be at least ${job.bidding.minBidAmount} GHS`));
      }
      if (this.bidAmount > job.bidding.maxBidAmount) {
        return next(new Error(`Bid amount cannot exceed ${job.bidding.maxBidAmount} GHS`));
      }
    }
  }
  next();
});

// Pre-save middleware to check monthly bid limit
BidSchema.pre('save', async function(next) {
  if (this.isNew) {
    if (this.monthlyBidCount >= 5) {
      return next(new Error('Monthly bid limit of 5 bids exceeded'));
    }
  }
  next();
});

const Bid = mongoose.model("Bid", BidSchema);

module.exports = Bid;
