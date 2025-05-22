# PowerShell script to create Review Service microservice structure

# Navigate to project root
Set-Location ..

# Store the current directory
$PROJECT_ROOT = Get-Location

# Create the review service directory structure
Write-Host "Creating Review Service microservice structure..."

# Main directory
$REVIEW_SERVICE_DIR = "$PROJECT_ROOT\kelmah-backend\services\review-service"
New-Item -Path $REVIEW_SERVICE_DIR -ItemType Directory -Force | Out-Null
Set-Location $REVIEW_SERVICE_DIR

# Create standard directories
$DIRS = @(
    "controllers",
    "models",
    "routes",
    "routes\api",
    "services",
    "config",
    "utils",
    "utils\errors",
    "middlewares",
    "tests",
    "constants"
)

foreach ($DIR in $DIRS) {
    New-Item -Path "$REVIEW_SERVICE_DIR\$DIR" -ItemType Directory -Force | Out-Null
}

# Create basic files
Write-Host "Creating basic files for the Review Service..."

# Create review model
$REVIEW_MODEL = @'
const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewSchema = new Schema({
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  reviewerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000
  },
  reviewType: {
    type: String,
    enum: ['WORKER_REVIEW', 'HIRER_REVIEW'],
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index to optimize searches
reviewSchema.index({ recipientId: 1, reviewType: 1 });
reviewSchema.index({ jobId: 1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
'@

Set-Content -Path "$REVIEW_SERVICE_DIR\models\review.model.js" -Value $REVIEW_MODEL

# Create review controller
$REVIEW_CONTROLLER = @'
const Review = require('../models/review.model');
const { StatusCodes } = require('http-status-codes');
const { NotFoundError, BadRequestError, UnauthorizedError } = require('../utils/errors');
const mongoose = require('mongoose');

const reviewController = {
  // Create a new review
  createReview: async (req, res) => {
    const { jobId, recipientId, rating, comment, reviewType } = req.body;
    const reviewerId = req.user.id;

    // Validate that the user hasn't already submitted a review for this job
    const existingReview = await Review.findOne({
      jobId,
      reviewerId,
      reviewType
    });

    if (existingReview) {
      throw new BadRequestError('You have already submitted a review for this job');
    }

    const review = new Review({
      jobId,
      reviewerId,
      recipientId,
      rating,
      comment,
      reviewType
    });

    await review.save();

    // Update user's average rating (this could be moved to a separate service)
    await updateUserAverageRating(recipientId);

    return res.status(StatusCodes.CREATED).json({ review });
  },

  // Get reviews for a specific user
  getUserReviews: async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10, reviewType } = req.query;

    const query = { recipientId: userId };
    
    // Add filter by review type if provided
    if (reviewType) {
      query.reviewType = reviewType;
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      populate: {
        path: 'reviewerId',
        select: 'firstName lastName profilePicture'
      }
    };

    const reviews = await Review.find(query)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .sort(options.sort)
      .populate(options.populate);

    const total = await Review.countDocuments(query);

    return res.status(StatusCodes.OK).json({
      reviews,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      totalReviews: total
    });
  },

  // Get reviews for a specific job
  getJobReviews: async (req, res) => {
    const { jobId } = req.params;

    const reviews = await Review.find({ jobId })
      .populate({
        path: 'reviewerId',
        select: 'firstName lastName profilePicture'
      })
      .sort({ createdAt: -1 });

    return res.status(StatusCodes.OK).json({ reviews });
  },

  // Update a review (only the owner can update)
  updateReview: async (req, res) => {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Check if the user is the owner of the review
    if (review.reviewerId.toString() !== userId) {
      throw new UnauthorizedError('You are not authorized to update this review');
    }

    // Update the review
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    review.updatedAt = Date.now();

    await review.save();

    // Update user's average rating
    await updateUserAverageRating(review.recipientId);

    return res.status(StatusCodes.OK).json({ review });
  },

  // Delete a review (only the owner can delete)
  deleteReview: async (req, res) => {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Check if the user is the owner of the review
    if (review.reviewerId.toString() !== userId) {
      throw new UnauthorizedError('You are not authorized to delete this review');
    }

    await Review.findByIdAndDelete(reviewId);

    // Update user's average rating
    await updateUserAverageRating(review.recipientId);

    return res.status(StatusCodes.OK).json({ message: 'Review deleted successfully' });
  },

  // Get review statistics for a user
  getUserReviewStats: async (req, res) => {
    const { userId } = req.params;

    const stats = await Review.aggregate([
      { $match: { recipientId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          rating5Count: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          rating4Count: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          rating3Count: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          rating2Count: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          rating1Count: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
        }
      }
    ]);

    const reviewStats = stats.length > 0 ? stats[0] : {
      averageRating: 0,
      totalReviews: 0,
      rating5Count: 0,
      rating4Count: 0,
      rating3Count: 0,
      rating2Count: 0,
      rating1Count: 0
    };

    // Calculate rating percentages
    if (reviewStats.totalReviews > 0) {
      reviewStats.rating5Percent = (reviewStats.rating5Count / reviewStats.totalReviews) * 100;
      reviewStats.rating4Percent = (reviewStats.rating4Count / reviewStats.totalReviews) * 100;
      reviewStats.rating3Percent = (reviewStats.rating3Count / reviewStats.totalReviews) * 100;
      reviewStats.rating2Percent = (reviewStats.rating2Count / reviewStats.totalReviews) * 100;
      reviewStats.rating1Percent = (reviewStats.rating1Count / reviewStats.totalReviews) * 100;
    } else {
      reviewStats.rating5Percent = 0;
      reviewStats.rating4Percent = 0;
      reviewStats.rating3Percent = 0;
      reviewStats.rating2Percent = 0;
      reviewStats.rating1Percent = 0;
    }

    return res.status(StatusCodes.OK).json({ stats: reviewStats });
  }
};

// Helper function to update a user's average rating
async function updateUserAverageRating(userId) {
  const stats = await Review.aggregate([
    { $match: { recipientId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  const averageRating = stats.length > 0 ? stats[0].averageRating : 0;
  const totalReviews = stats.length > 0 ? stats[0].totalReviews : 0;

  // This would update the user profile with the new average rating
  // We'll assume there's a User model that can be imported and used here
  // await User.findByIdAndUpdate(userId, { averageRating, totalReviews });
  
  // Since we don't have the User model imported here, we'll just log the update
  console.log(`Updated rating for user ${userId}: ${averageRating} (${totalReviews} reviews)`);
}

module.exports = reviewController;
'@

Set-Content -Path "$REVIEW_SERVICE_DIR\controllers\review.controller.js" -Value $REVIEW_CONTROLLER

# Create review routes
$REVIEW_ROUTES = @'
const express = require('express');
const router = express.Router();
const reviewController = require('../../controllers/review.controller');
const { authenticateUser } = require('../../middlewares/auth');
const asyncHandler = require('../../middlewares/asyncHandler');

// Create a new review
router.post(
  '/',
  authenticateUser,
  asyncHandler(reviewController.createReview)
);

// Get reviews for a specific user
router.get(
  '/user/:userId',
  asyncHandler(reviewController.getUserReviews)
);

// Get reviews for a specific job
router.get(
  '/job/:jobId',
  asyncHandler(reviewController.getJobReviews)
);

// Get review statistics for a user
router.get(
  '/stats/user/:userId',
  asyncHandler(reviewController.getUserReviewStats)
);

// Update a review
router.put(
  '/:reviewId',
  authenticateUser,
  asyncHandler(reviewController.updateReview)
);

// Delete a review
router.delete(
  '/:reviewId',
  authenticateUser,
  asyncHandler(reviewController.deleteReview)
);

module.exports = router;
'@

Set-Content -Path "$REVIEW_SERVICE_DIR\routes\api\review.routes.js" -Value $REVIEW_ROUTES

# Create main routes file
$ROUTES_INDEX = @'
const express = require('express');
const router = express.Router();

// Import API routes
const reviewRoutes = require('./api/review.routes');

// Set up API routes
router.use('/api/reviews', reviewRoutes);

module.exports = router;
'@

Set-Content -Path "$REVIEW_SERVICE_DIR\routes\index.js" -Value $ROUTES_INDEX

# Create server file
$SERVER_JS = @'
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { StatusCodes } = require('http-status-codes');
const routes = require('./routes');
const config = require('./config');
const errorHandler = require('./middlewares/errorHandler');

// Initialize express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(StatusCodes.OK).json({ status: 'UP', service: 'review-service' });
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5006;
app.listen(PORT, () => {
  console.log(`Review service running on port ${PORT}`);
});

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

module.exports = app;
'@

Set-Content -Path "$REVIEW_SERVICE_DIR\server.js" -Value $SERVER_JS

# Create config file
$CONFIG_JS = @'
require('dotenv').config();

module.exports = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/kelmah_review_service',
  JWT_SECRET: process.env.JWT_SECRET || 'review_service_secret',
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_GATEWAY_URL: process.env.API_GATEWAY_URL || 'http://localhost:5000',
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://localhost:5001',
  JOB_SERVICE_URL: process.env.JOB_SERVICE_URL || 'http://localhost:5002',
};
'@

Set-Content -Path "$REVIEW_SERVICE_DIR\config\index.js" -Value $CONFIG_JS

# Create error utility
$ERRORS_JS = @'
const { StatusCodes } = require('http-status-codes');

class CustomAPIError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends CustomAPIError {
  constructor(message) {
    super(message || 'Bad request');
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
}

class NotFoundError extends CustomAPIError {
  constructor(message) {
    super(message || 'Resource not found');
    this.statusCode = StatusCodes.NOT_FOUND;
  }
}

class UnauthorizedError extends CustomAPIError {
  constructor(message) {
    super(message || 'Unauthorized access');
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}

class ForbiddenError extends CustomAPIError {
  constructor(message) {
    super(message || 'Forbidden access');
    this.statusCode = StatusCodes.FORBIDDEN;
  }
}

class InternalServerError extends CustomAPIError {
  constructor(message) {
    super(message || 'Internal server error');
    this.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  }
}

module.exports = {
  CustomAPIError,
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  InternalServerError
};
'@

Set-Content -Path "$REVIEW_SERVICE_DIR\utils\errors\index.js" -Value $ERRORS_JS

# Create middleware files
$ASYNC_HANDLER = @'
const asyncHandler = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

module.exports = asyncHandler;
'@

Set-Content -Path "$REVIEW_SERVICE_DIR\middlewares\asyncHandler.js" -Value $ASYNC_HANDLER

$AUTH_MIDDLEWARE = @'
const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../utils/errors');
const config = require('../config');

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication invalid');
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    req.user = {
      id: payload.userId,
      role: payload.role,
      email: payload.email
    };
    next();
  } catch (error) {
    throw new UnauthorizedError('Authentication invalid');
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new UnauthorizedError('Unauthorized to access this route');
    }
    next();
  };
};

module.exports = {
  authenticateUser,
  authorizeRoles
};
'@

Set-Content -Path "$REVIEW_SERVICE_DIR\middlewares\auth.js" -Value $AUTH_MIDDLEWARE

$ERROR_HANDLER = @'
const { StatusCodes } = require('http-status-codes');
const { CustomAPIError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  console.error(err);

  let customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    message: err.message || 'Something went wrong, please try again later',
  };

  // MongoDB validation error
  if (err.name === 'ValidationError') {
    customError.message = Object.values(err.errors)
      .map((item) => item.message)
      .join(', ');
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  // MongoDB duplicate key error
  if (err.code && err.code === 11000) {
    customError.message = `Duplicate value entered for ${Object.keys(
      err.keyValue
    )} field, please choose another value`;
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  // MongoDB cast error
  if (err.name === 'CastError') {
    customError.message = `No item found with id: ${err.value}`;
    customError.statusCode = StatusCodes.NOT_FOUND;
  }

  return res.status(customError.statusCode).json({ 
    error: {
      message: customError.message
    }
  });
};

module.exports = errorHandler;
'@

Set-Content -Path "$REVIEW_SERVICE_DIR\middlewares\errorHandler.js" -Value $ERROR_HANDLER

# Create package.json
$PACKAGE_JSON = @'
{
  "name": "kelmah-review-service",
  "version": "1.0.0",
  "description": "Review service for Kelmah platform",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "dependencies": {
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^10.0.0",
    "express": "^4.17.1",
    "helmet": "^4.6.0",
    "http-status-codes": "^2.1.4",
    "jsonwebtoken": "^8.5.1",
    "mongoose": "^5.13.7"
  },
  "devDependencies": {
    "jest": "^27.0.6",
    "nodemon": "^2.0.12",
    "supertest": "^6.1.6"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
'@

Set-Content -Path "$REVIEW_SERVICE_DIR\package.json" -Value $PACKAGE_JSON

# Create .env file
$ENV_FILE = @'
PORT=5006
MONGODB_URI=mongodb://localhost:27017/kelmah_review_service
JWT_SECRET=review_service_secret
NODE_ENV=development
API_GATEWAY_URL=http://localhost:5000
USER_SERVICE_URL=http://localhost:5001
JOB_SERVICE_URL=http://localhost:5002
'@

Set-Content -Path "$REVIEW_SERVICE_DIR\.env" -Value $ENV_FILE

# Create README file
$README = @'
# Kelmah Review Service

This service handles all review-related functionality for the Kelmah platform, including:
- Worker reviews
- Hirer reviews
- Review statistics
- Rating calculations

## Features
- Create reviews for workers and hirers
- View reviews for a specific user or job
- Update and delete reviews
- Calculate review statistics and average ratings

## API Endpoints
- `POST /api/reviews`: Create a new review
- `GET /api/reviews/user/:userId`: Get reviews for a specific user
- `GET /api/reviews/job/:jobId`: Get reviews for a specific job
- `GET /api/reviews/stats/user/:userId`: Get review statistics for a user
- `PUT /api/reviews/:reviewId`: Update a review
- `DELETE /api/reviews/:reviewId`: Delete a review

## Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your configuration (see `.env.example`)
4. Run the service: `npm start` or `npm run dev` for development

## Dependencies
- Node.js (>= 14.0.0)
- MongoDB
- Express.js
'@

Set-Content -Path "$REVIEW_SERVICE_DIR\README.md" -Value $README

Write-Host "Review Service structure created successfully!"

# Return to the cleanup_plan directory
Set-Location "$PROJECT_ROOT\cleanup_plan" 