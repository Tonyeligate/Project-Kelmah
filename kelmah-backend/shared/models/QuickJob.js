/**
 * QuickJob Model - For small, same-day to 2-day jobs (under GH₵500)
 * Part of Kelmah's Protected Quick-Hire system
 * 
 * Flow: Client requests → Workers quote → Client accepts → Escrow → Work → Approval → Payment
 */

const mongoose = require('mongoose');

// Service categories for vocational work
const SERVICE_CATEGORIES = [
  'plumbing',
  'electrical',
  'carpentry',
  'masonry',
  'painting',
  'welding',
  'tailoring',
  'cleaning',
  'hvac',
  'roofing',
  'tiling',
  'general_repair',
  'other'
];

const URGENCY_LEVELS = ['emergency', 'soon', 'flexible'];

const JOB_STATUS = [
  'pending',        // Just created, waiting for quotes
  'quoted',         // Has received at least one quote
  'accepted',       // Client accepted a quote, awaiting payment
  'funded',         // Payment in escrow, waiting for worker
  'worker_on_way',  // Worker heading to location
  'worker_arrived', // Worker at location (GPS verified)
  'in_progress',    // Work being done
  'completed',      // Worker marked complete, awaiting client approval
  'approved',       // Client approved, payment released
  'disputed',       // Under dispute
  'cancelled',      // Cancelled by client or worker
  'expired'         // No quotes received within time limit
];

const ESCROW_STATUS = ['pending', 'held', 'released', 'refunded', 'partial_refund'];

const QuoteSchema = new mongoose.Schema({
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [25, 'Minimum job amount is GH₵25']
  },
  message: {
    type: String,
    maxlength: 500
  },
  availableAt: {
    type: String,
    enum: ['30_mins', '1_hour', '2_hours', 'today', 'tomorrow'],
    required: true
  },
  estimatedDuration: {
    type: String,
    enum: ['30_mins', '1_hour', '2_hours', 'half_day', 'full_day', '2_days'],
  },
  includesTransport: {
    type: Boolean,
    default: true
  },
  includesMaterials: {
    type: Boolean,
    default: false
  },
  materialsCost: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const TrackingSchema = new mongoose.Schema({
  workerOnWay: {
    timestamp: Date,
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number] // [lng, lat]
    }
  },
  workerArrived: {
    timestamp: Date,
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number]
    },
    verified: {
      type: Boolean,
      default: false
    },
    distanceFromJob: Number // meters
  },
  workStarted: {
    timestamp: Date
  },
  workCompleted: {
    timestamp: Date,
    photos: [{
      url: String,
      uploadedAt: { type: Date, default: Date.now },
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number]
      }
    }],
    workerNote: String
  },
  clientApproved: {
    timestamp: Date,
    rating: { type: Number, min: 1, max: 5 },
    review: String
  },
  workerRatedClient: {
    timestamp: Date,
    rating: { type: Number, min: 1, max: 5 },
    review: String
  }
});

const EscrowSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  platformFee: {
    type: Number,
    required: true
  },
  workerPayout: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ESCROW_STATUS,
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['mtn_momo', 'vodafone_cash', 'airtel_money', 'card', 'bank_transfer'],
  },
  paymentReference: String, // Paystack reference
  transactionId: String,    // Paystack transaction ID
  paidAt: Date,
  releasedAt: Date,
  refundedAt: Date,
  refundAmount: Number,
  refundReason: String
});

const DisputeSchema = new mongoose.Schema({
  raisedBy: {
    type: String,
    enum: ['client', 'worker'],
    required: true
  },
  raisedByUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    enum: [
      'work_not_completed',
      'poor_quality',
      'worker_no_show',
      'wrong_charges',
      'worker_rude',
      'client_not_available',
      'scope_disagreement',
      'payment_issue',
      'other'
    ],
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  evidence: [{
    type: { type: String, enum: ['photo', 'text', 'video'] },
    url: String,
    description: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['open', 'under_review', 'resolved', 'escalated'],
    default: 'open'
  },
  resolution: {
    type: String,
    enum: ['worker_returns', 'partial_refund', 'full_refund', 'payment_released', 'escalated_to_staff'],
  },
  resolutionNote: String,
  refundPercentage: Number,
  resolvedBy: {
    type: String,
    enum: ['auto', 'staff']
  },
  staffHandler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  raisedAt: {
    type: Date,
    default: Date.now
  },
  autoResolveDeadline: Date, // 48 hours from raised
  resolvedAt: Date
});

const AdditionalWorkSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedAt: Date,
  escrowStatus: {
    type: String,
    enum: ESCROW_STATUS,
    default: 'pending'
  },
  paymentReference: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const QuickJobSchema = new mongoose.Schema({
  // Job Type
  type: {
    type: String,
    default: 'quick_job',
    immutable: true
  },

  // Service Category
  category: {
    type: String,
    enum: SERVICE_CATEGORIES,
    required: [true, 'Service category is required']
  },

  // Description
  title: {
    type: String,
    maxlength: 100
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: 500
  },
  photos: [{
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  voiceNote: {
    url: String,
    duration: Number // seconds
  },

  // Location
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    },
    address: {
      type: String,
      required: true
    },
    landmark: String,
    city: {
      type: String,
      required: true
    },
    region: {
      type: String,
      required: true
    }
  },

  // Urgency
  urgency: {
    type: String,
    enum: URGENCY_LEVELS,
    default: 'soon'
  },
  preferredDate: Date,
  preferredTimeSlot: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'anytime']
  },

  // Status
  status: {
    type: String,
    enum: JOB_STATUS,
    default: 'pending'
  },

  // Client
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Quotes from workers
  quotes: [QuoteSchema],

  // Accepted Quote
  acceptedQuote: {
    quote: {
      type: mongoose.Schema.Types.ObjectId,
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: Number,
    acceptedAt: Date
  },

  // Escrow
  escrow: EscrowSchema,

  // Tracking
  tracking: TrackingSchema,

  // Additional Work Requests
  additionalWork: [AdditionalWorkSchema],

  // Dispute
  dispute: DisputeSchema,

  // Cancellation
  cancellation: {
    cancelledBy: {
      type: String,
      enum: ['client', 'worker', 'system']
    },
    cancelledByUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    cancelledAt: Date,
    workerCompensation: {
      amount: Number,
      status: { type: String, enum: ['pending', 'paid'] }
    }
  },

  // Notifications tracking
  notificationsSent: [{
    type: { type: String },
    sentTo: mongoose.Schema.Types.ObjectId,
    sentAt: Date,
    channel: { type: String, enum: ['push', 'sms', 'whatsapp', 'email'] }
  }],

  // Workers who were notified about this job
  notifiedWorkers: [{
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notifiedAt: Date,
    distance: Number // km from job
  }],

  // Expiry
  expiresAt: {
    type: Date,
    default: function() {
      // Jobs expire after 24 hours if no quotes accepted
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  }
}, {
  timestamps: true
});

// Indexes
QuickJobSchema.index({ location: '2dsphere' });
QuickJobSchema.index({ client: 1, status: 1 });
QuickJobSchema.index({ 'acceptedQuote.worker': 1, status: 1 });
QuickJobSchema.index({ category: 1, status: 1, 'location.city': 1 });
QuickJobSchema.index({ status: 1, createdAt: -1 });
QuickJobSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL for expired jobs

// Virtual for calculating worker payout
QuickJobSchema.virtual('workerPayout').get(function() {
  if (!this.escrow || !this.escrow.amount) return 0;
  const platformFeeRate = 0.15; // 15%
  return this.escrow.amount * (1 - platformFeeRate);
});

// Pre-save middleware to calculate fees
QuickJobSchema.pre('save', function(next) {
  if (this.escrow && this.escrow.amount && !this.escrow.platformFee) {
    const platformFeeRate = 0.15; // 15%
    this.escrow.platformFee = Math.round(this.escrow.amount * platformFeeRate * 100) / 100;
    this.escrow.workerPayout = this.escrow.amount - this.escrow.platformFee;
  }
  next();
});

// Instance method to check if job can accept more quotes
QuickJobSchema.methods.canAcceptQuotes = function() {
  return ['pending', 'quoted'].includes(this.status) && 
         !this.acceptedQuote.worker &&
         new Date() < new Date(this.expiresAt);
};

// Instance method to check if worker can be verified as arrived
QuickJobSchema.methods.verifyWorkerArrival = function(workerLat, workerLng) {
  const jobLat = this.location.coordinates[1];
  const jobLng = this.location.coordinates[0];
  
  // Calculate distance using Haversine formula
  const R = 6371e3; // Earth's radius in meters
  const φ1 = jobLat * Math.PI / 180;
  const φ2 = workerLat * Math.PI / 180;
  const Δφ = (workerLat - jobLat) * Math.PI / 180;
  const Δλ = (workerLng - jobLng) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const distance = R * c; // in meters

  return {
    distance: Math.round(distance),
    verified: distance <= 100 // Within 100 meters
  };
};

// Static method to find jobs near a location
QuickJobSchema.statics.findNearby = function(lng, lat, maxDistanceKm = 10, category = null) {
  const query = {
    status: { $in: ['pending', 'quoted'] },
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: maxDistanceKm * 1000 // Convert km to meters
      }
    }
  };

  if (category) {
    query.category = category;
  }

  return this.find(query)
    .populate('client', 'firstName lastName profilePicture rating')
    .select('-quotes.worker'); // Don't show other workers' quotes
};

// Static method to auto-expire jobs
QuickJobSchema.statics.expireOldJobs = async function() {
  const result = await this.updateMany(
    {
      status: { $in: ['pending', 'quoted'] },
      expiresAt: { $lt: new Date() }
    },
    {
      $set: { status: 'expired' }
    }
  );
  return result.modifiedCount;
};

const QuickJob = mongoose.model('QuickJob', QuickJobSchema);

module.exports = QuickJob;
