/**
 * Review-service Server
 * Kelmah Platform - COMPREHENSIVE REVIEW & RATING SERVICE
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Import centralized logger
const { createLogger, createHttpLogger, createErrorLogger, setupGlobalErrorHandlers } = require('./utils/logger');

// Load environment variables
dotenv.config();

// Create service logger
const logger = createLogger('review-service');

// Setup global error handlers
setupGlobalErrorHandlers(logger);

logger.info('review-service starting...', { 
  nodeVersion: process.version,
  environment: process.env.NODE_ENV || 'development'
});

const app = express();
const PORT = process.env.PORT || 5006;

// Review Schema
const reviewSchema = new mongoose.Schema({
  jobId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'Job',
    index: true 
  },
  workerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'User',
    index: true 
  },
  hirerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'User',
    index: true 
  },
  
  // Rating breakdown for different aspects
  ratings: {
    overall: { type: Number, required: true, min: 1, max: 5 },
    quality: { type: Number, required: true, min: 1, max: 5 },
    communication: { type: Number, required: true, min: 1, max: 5 },
    timeliness: { type: Number, required: true, min: 1, max: 5 },
    professionalism: { type: Number, required: true, min: 1, max: 5 },
  },
  
  // Review content
  title: { type: String, required: true, maxlength: 100 },
  comment: { type: String, required: true, maxlength: 1000 },
  pros: [{ type: String, maxlength: 200 }],
  cons: [{ type: String, maxlength: 200 }],
  
  // Additional context
  jobCategory: { type: String, required: true, index: true },
  jobValue: { type: Number }, // Job payment amount
  projectDuration: { type: String }, // e.g., "2 weeks"
  wouldRecommend: { type: Boolean, default: true },
  
  // Review metadata
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'flagged'], 
    default: 'pending',
    index: true 
  },
  isVerified: { type: Boolean, default: false },
  helpfulVotes: { type: Number, default: 0 },
  reportCount: { type: Number, default: 0 },
  
  // Moderation
  moderationNotes: [{ 
    note: String, 
    moderatorId: mongoose.Schema.Types.ObjectId,
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Response from worker
  response: {
    comment: { type: String, maxlength: 500 },
    timestamp: { type: Date },
    workerId: mongoose.Schema.Types.ObjectId
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
reviewSchema.index({ workerId: 1, status: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ 'ratings.overall': -1 });
reviewSchema.index({ jobCategory: 1, 'ratings.overall': -1 });

// Virtual for calculated overall rating
reviewSchema.virtual('averageRating').get(function() {
  const { quality, communication, timeliness, professionalism } = this.ratings;
  return ((quality + communication + timeliness + professionalism) / 4).toFixed(1);
});

// Worker Rating Summary Schema
const workerRatingSchema = new mongoose.Schema({
  workerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    unique: true, 
    ref: 'User' 
  },
  
  // Overall statistics
  totalReviews: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  
  // Rating breakdown
  ratings: {
    overall: { type: Number, default: 0 },
    quality: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    timeliness: { type: Number, default: 0 },
    professionalism: { type: Number, default: 0 }
  },
  
  // Rating distribution
  ratingDistribution: {
    5: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    1: { type: Number, default: 0 }
  },
  
  // Category-specific ratings
  categoryRatings: [{
    category: String,
    averageRating: Number,
    reviewCount: Number
  }],
  
  // Trust metrics
  recommendationRate: { type: Number, default: 0 }, // Percentage who would recommend
  verifiedReviewsCount: { type: Number, default: 0 },
  responseRate: { type: Number, default: 0 }, // How often worker responds to reviews
  
  // Recent performance
  recentRating: { type: Number, default: 0 }, // Average of last 10 reviews
  trendDirection: { type: String, enum: ['up', 'down', 'stable'], default: 'stable' },
  
  // Last updated
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const Review = mongoose.model('Review', reviewSchema);
const WorkerRating = mongoose.model('WorkerRating', workerRatingSchema);

// Security middleware
app.use(helmet());

// Rate limiting for review submissions
const reviewRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 reviews per 15 minutes
  message: { error: 'Too many review submissions. Please try again later.' }
});

// CORS middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || [
    'http://localhost:3001',
    'http://localhost:5173',
    'https://project-kelmah.vercel.app'
  ],
  credentials: true
}));

// Add HTTP request logging
app.use(createHttpLogger(logger));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      logger.info('Connected to MongoDB', { database: process.env.DB_NAME });
    })
    .catch((error) => {
      logger.error('MongoDB connection failed', error);
      process.exit(1);
    });
}

// Middleware to extract user info from headers (set by API Gateway)
const extractUserInfo = (req, res, next) => {
  req.user = {
    id: req.headers['x-user-id'],
    role: req.headers['x-user-role']
  };
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'review-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    features: ['reviews', 'ratings', 'analytics', 'moderation']
  });
});

app.get('/health/ready', (req, res) => {
  const ready = mongoose.connection?.readyState === 1;
  res.status(ready ? 200 : 503).json({ ready, timestamp: new Date().toISOString() });
});

app.get('/health/live', (req, res) => {
  res.status(200).json({ alive: true, timestamp: new Date().toISOString() });
});

// Helper function to calculate worker rating summary
const updateWorkerRating = async (workerId) => {
  try {
    const reviews = await Review.find({ 
      workerId, 
      status: 'approved' 
    }).sort({ createdAt: -1 });

    if (reviews.length === 0) {
      return null;
    }

    // Calculate averages
    const totalReviews = reviews.length;
    const ratingSums = reviews.reduce((acc, review) => {
      acc.overall += review.ratings.overall;
      acc.quality += review.ratings.quality;
      acc.communication += review.ratings.communication;
      acc.timeliness += review.ratings.timeliness;
      acc.professionalism += review.ratings.professionalism;
      return acc;
    }, { overall: 0, quality: 0, communication: 0, timeliness: 0, professionalism: 0 });

    const averageRatings = {
      overall: (ratingSums.overall / totalReviews).toFixed(1),
      quality: (ratingSums.quality / totalReviews).toFixed(1),
      communication: (ratingSums.communication / totalReviews).toFixed(1),
      timeliness: (ratingSums.timeliness / totalReviews).toFixed(1),
      professionalism: (ratingSums.professionalism / totalReviews).toFixed(1)
    };

    // Calculate rating distribution
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      const roundedRating = Math.round(review.ratings.overall);
      ratingDistribution[roundedRating]++;
    });

    // Calculate category ratings
    const categoryGroups = reviews.reduce((acc, review) => {
      if (!acc[review.jobCategory]) {
        acc[review.jobCategory] = [];
      }
      acc[review.jobCategory].push(review.ratings.overall);
      return acc;
    }, {});

    const categoryRatings = Object.entries(categoryGroups).map(([category, ratings]) => ({
      category,
      averageRating: (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1),
      reviewCount: ratings.length
    }));

    // Calculate trust metrics
    const recommendationRate = (reviews.filter(r => r.wouldRecommend).length / totalReviews) * 100;
    const verifiedReviewsCount = reviews.filter(r => r.isVerified).length;
    const responsiveReviews = reviews.filter(r => r.response && r.response.comment).length;
    const responseRate = (responsiveReviews / totalReviews) * 100;

    // Recent performance (last 10 reviews)
    const recentReviews = reviews.slice(0, 10);
    const recentRating = recentReviews.length > 0 ? 
      (recentReviews.reduce((sum, r) => sum + r.ratings.overall, 0) / recentReviews.length).toFixed(1) : 0;

    // Update or create worker rating summary
    const workerRating = await WorkerRating.findOneAndUpdate(
      { workerId },
      {
        totalReviews,
        averageRating: parseFloat(averageRatings.overall),
        ratings: averageRatings,
        ratingDistribution,
        categoryRatings,
        recommendationRate: Math.round(recommendationRate),
        verifiedReviewsCount,
        responseRate: Math.round(responseRate),
        recentRating: parseFloat(recentRating),
        lastUpdated: new Date()
      },
      { new: true, upsert: true }
    );

    return workerRating;
  } catch (error) {
    logger.error('Error updating worker rating:', error);
    throw error;
  }
};

// API routes
app.get('/', (req, res) => {
  res.json({
    service: 'review-service',
    message: 'Comprehensive Review & Rating Service',
    version: '2.0.0',
    endpoints: {
      'POST /api/reviews': 'Submit a review',
      'GET /api/reviews/worker/:id': 'Get worker reviews',
      'GET /api/reviews/:id': 'Get specific review',
      'PUT /api/reviews/:id/response': 'Add worker response',
      'GET /api/ratings/worker/:id': 'Get worker rating summary',
      'GET /api/reviews/analytics': 'Get review analytics'
    }
  });
});

// ==================== API ROUTES ====================

// Submit a new review
app.post('/api/reviews', reviewRateLimit, extractUserInfo, async (req, res) => {
  try {
    const {
      jobId,
      workerId,
      ratings,
      title,
      comment,
      pros = [],
      cons = [],
      jobCategory,
      jobValue,
      projectDuration,
      wouldRecommend = true
    } = req.body;

    // Validation
    if (!jobId || !workerId || !ratings || !title || !comment || !jobCategory) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: jobId, workerId, ratings, title, comment, jobCategory'
      });
    }

    // Validate ratings
    const ratingFields = ['overall', 'quality', 'communication', 'timeliness', 'professionalism'];
    for (const field of ratingFields) {
      if (!ratings[field] || ratings[field] < 1 || ratings[field] > 5) {
        return res.status(400).json({
          success: false,
          message: `Invalid rating for ${field}. Must be between 1 and 5.`
        });
      }
    }

    // Check if review already exists for this job
    const existingReview = await Review.findOne({ jobId, hirerId: req.user.id });
    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: 'Review already exists for this job'
      });
    }

    // Create review
    const review = new Review({
      jobId,
      workerId,
      hirerId: req.user.id,
      ratings,
      title: title.trim(),
      comment: comment.trim(),
      pros: pros.map(p => p.trim()).filter(p => p.length > 0),
      cons: cons.map(c => c.trim()).filter(c => c.length > 0),
      jobCategory,
      jobValue,
      projectDuration,
      wouldRecommend,
      status: 'pending' // Reviews require moderation
    });

    await review.save();

    // Update worker rating summary
    await updateWorkerRating(workerId);

    logger.info('Review submitted', { 
      reviewId: review._id, 
      workerId, 
      hirerId: req.user.id 
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully and is pending moderation',
      data: review
    });

  } catch (error) {
    logger.error('Error submitting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review'
    });
  }
});

// Admin moderation routes (protected upstream by API Gateway)
app.use('/api/admin', extractUserInfo, require('./routes/admin.routes'));

// Get reviews for a specific worker
app.get('/api/reviews/worker/:workerId', async (req, res) => {
  try {
    const { workerId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      status = 'approved',
      category,
      minRating,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build query
    const query = { workerId, status };
    if (category) query.jobCategory = category;
    if (minRating) query['ratings.overall'] = { $gte: parseInt(minRating) };

    // Build sort
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('hirerId', 'firstName lastName profilePicture')
        .lean(),
      Review.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching worker reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
});

// Get worker rating summary
app.get('/api/ratings/worker/:workerId', async (req, res) => {
  try {
    const { workerId } = req.params;

    const workerRating = await WorkerRating.findOne({ workerId });
    
    if (!workerRating) {
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

    res.json({
      success: true,
      data: workerRating
    });

  } catch (error) {
    logger.error('Error fetching worker rating:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch worker rating'
    });
  }
});

// Get specific review details
app.get('/api/reviews/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId)
      .populate('workerId', 'firstName lastName profilePicture profession')
      .populate('hirerId', 'firstName lastName profilePicture')
      .lean();

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      data: review
    });

  } catch (error) {
    logger.error('Error fetching review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review'
    });
  }
});

// Worker response to a review
app.put('/api/reviews/:reviewId/response', extractUserInfo, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Response comment is required'
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user is the worker being reviewed
    if (review.workerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the reviewed worker can respond to this review'
      });
    }

    // Check if response already exists
    if (review.response && review.response.comment) {
      return res.status(409).json({
        success: false,
        message: 'Response already exists for this review'
      });
    }

    // Add response
    review.response = {
      comment: comment.trim(),
      timestamp: new Date(),
      workerId: req.user.id
    };

    await review.save();

    // Update worker rating (response rate)
    await updateWorkerRating(review.workerId);

    logger.info('Worker responded to review', { 
      reviewId, 
      workerId: req.user.id 
    });

    res.json({
      success: true,
      message: 'Response added successfully',
      data: review
    });

  } catch (error) {
    logger.error('Error adding review response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add response'
    });
  }
});

// Vote review as helpful
app.post('/api/reviews/:reviewId/helpful', extractUserInfo, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpfulVotes: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: 'Vote recorded',
      data: { helpfulVotes: review.helpfulVotes }
    });

  } catch (error) {
    logger.error('Error voting review helpful:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record vote'
    });
  }
});

// Report review
app.post('/api/reviews/:reviewId/report', extractUserInfo, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { 
        $inc: { reportCount: 1 },
        $set: { status: 'flagged' }
      },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    logger.info('Review reported', { 
      reviewId, 
      reportedBy: req.user.id, 
      reason 
    });

    res.json({
      success: true,
      message: 'Review reported for moderation'
    });

  } catch (error) {
    logger.error('Error reporting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report review'
    });
  }
});

// Get review analytics (admin only)
app.get('/api/reviews/analytics', extractUserInfo, async (req, res) => {
  try {
    // Basic analytics - in production, add role checking
    const [
      totalReviews,
      averageRating,
      reviewsByStatus,
      topCategories,
      recentTrends
    ] = await Promise.all([
      Review.countDocuments(),
      Review.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$ratings.overall' } } }
      ]),
      Review.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Review.aggregate([
        { $group: { _id: '$jobCategory', count: { $sum: 1 }, avgRating: { $avg: '$ratings.overall' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Review.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        { $group: { 
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          avgRating: { $avg: '$ratings.overall' }
        }},
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalReviews,
        averageRating: averageRating[0]?.avgRating || 0,
        reviewsByStatus,
        topCategories,
        recentTrends
      }
    });

  } catch (error) {
    logger.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

// Admin: Moderate review
app.put('/api/reviews/:reviewId/moderate', extractUserInfo, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status, moderationNote } = req.body;

    if (!['approved', 'rejected', 'flagged'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved, rejected, or flagged'
      });
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      {
        status,
        $push: {
          moderationNotes: {
            note: moderationNote,
            moderatorId: req.user.id,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Update worker rating if review was approved/rejected
    if (status === 'approved' || status === 'rejected') {
      await updateWorkerRating(review.workerId);
    }

    logger.info('Review moderated', { 
      reviewId, 
      status, 
      moderatorId: req.user.id 
    });

    res.json({
      success: true,
      message: 'Review moderated successfully',
      data: review
    });

  } catch (error) {
    logger.error('Error moderating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate review'
    });
  }
});

// Error logging middleware (must be last)
app.use(createErrorLogger(logger));

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  logger.info('review-service server started successfully', { 
    port: PORT, 
    environment: process.env.NODE_ENV || 'development',
    features: ['reviews', 'ratings', 'analytics', 'moderation', 'responses', 'reporting']
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down review-service...');
  if (mongoose.connection.readyState === 1) {
    mongoose.connection.close();
  }
  process.exit(0);
});
