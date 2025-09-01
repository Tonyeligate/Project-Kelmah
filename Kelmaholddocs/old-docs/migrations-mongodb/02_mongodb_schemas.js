/**
 * MongoDB Schema Design
 * Defines the new document-based schemas for MongoDB
 */

const mongoose = require('mongoose');

// User Schema - Enhanced from SQL version
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['worker', 'hirer', 'admin'],
    default: 'worker'
  },
  // Embedded profile data
  profile: {
    firstName: String,
    lastName: String,
    phoneNumber: String,
    location: {
      address: String,
      city: String,
      state: String,
      zipCode: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    avatar: String,
    bio: String,
    skills: [String],
    experience: [{
      title: String,
      company: String,
      duration: String,
      description: String
    }],
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    }
  },
  // Financial data
  wallet: {
    balance: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' }
  },
  // Settings and preferences
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    privacy: {
      profileVisible: { type: Boolean, default: true },
      showEmail: { type: Boolean, default: false }
    }
  },
  // Subscription info
  subscription: {
    plan: { type: String, default: 'free' },
    status: { type: String, default: 'active' },
    expiresAt: Date
  },
  // Timestamps
  emailVerifiedAt: Date,
  lastLoginAt: Date,
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Job Schema - Enhanced with embedded data
const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  skillsRequired: [String],
  payment: {
    amount: {
      min: Number,
      max: Number,
      fixed: Number
    },
    currency: { type: String, default: 'USD' },
    type: { type: String, enum: ['fixed', 'hourly', 'range'], default: 'fixed' }
  },
  location: {
    type: { type: String, enum: ['remote', 'onsite', 'hybrid'], default: 'onsite' },
    address: String,
    city: String,
    state: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  timeline: {
    startDate: Date,
    endDate: Date,
    estimatedHours: Number
  },
  status: {
    type: String,
    enum: ['draft', 'open', 'in_progress', 'completed', 'cancelled'],
    default: 'draft'
  },
  hirerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedWorkerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  applications: [{
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    coverLetter: String,
    proposedRate: Number,
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    appliedAt: { type: Date, default: Date.now }
  }],
  // Embedded contract info
  contract: {
    terms: String,
    startDate: Date,
    endDate: Date,
    milestones: [{
      title: String,
      description: String,
      amount: Number,
      dueDate: Date,
      status: { type: String, enum: ['pending', 'completed', 'approved'], default: 'pending' }
    }]
  }
}, {
  timestamps: true
});

// Message Schema - For real-time messaging
const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    text: String,
    attachments: [{
      filename: String,
      url: String,
      type: String,
      size: Number
    }]
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  readBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }],
  editedAt: Date,
  deletedAt: Date
}, {
  timestamps: true
});

// Conversation Schema
const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  type: {
    type: String,
    enum: ['direct', 'group', 'job_related'],
    default: 'direct'
  },
  relatedJobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  lastMessage: {
    content: String,
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: Date
  },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Transaction Schema - Enhanced financial tracking
const transactionSchema = new mongoose.Schema({
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  type: {
    type: String,
    enum: ['payment', 'refund', 'withdrawal', 'deposit', 'fee'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'bank_transfer', 'wallet']
  },
  description: String,
  fees: {
    platformFee: { type: Number, default: 0 },
    processingFee: { type: Number, default: 0 }
  },
  metadata: {
    paymentIntentId: String, // For Stripe integration
    referenceNumber: String
  }
}, {
  timestamps: true
});

// Review Schema
const reviewSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  revieweeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: String,
  categories: {
    quality: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    timeliness: { type: Number, min: 1, max: 5 }
  },
  isVisible: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Notification Schema
const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['job_application', 'message', 'payment', 'review', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: String,
  data: {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }
  },
  isRead: { type: Boolean, default: false },
  readAt: Date
}, {
  timestamps: true
});

// Export schemas for use in migration
module.exports = {
  userSchema,
  jobSchema,
  messageSchema,
  conversationSchema,
  transactionSchema,
  reviewSchema,
  notificationSchema
};