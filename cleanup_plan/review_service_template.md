# Review Service Template

This template provides the basic structure for creating the Review Service if it doesn't exist in your backend.

## Directory Structure

```
kelmah-backend/services/review-service/
├── controllers/
│   ├── review.controller.js
│   └── rating.controller.js
├── models/
│   ├── review.model.js
│   └── rating.model.js
├── routes/
│   ├── index.js
│   └── review.routes.js
├── services/
│   └── review.service.js
├── middleware/
│   ├── validation.middleware.js
│   └── authorization.middleware.js
├── utils/
│   └── rating-calculation.js
├── tests/
│   ├── review.test.js
│   └── rating.test.js
├── config/
│   └── index.js
├── server.js
└── package.json
```

## Key Files Implementation

### review.model.js
```javascript
const mongoose = require('mongoose');

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
  reviewType: {
    type: String,
    enum: ['worker', 'hirer'],
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
    minlength: 1,
    maxlength: 1000
  },
  skills: [{
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'published', 'rejected', 'reported'],
    default: 'published'
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add index for efficient queries
reviewSchema.index({ revieweeId: 1, createdAt: -1 });
reviewSchema.index({ jobId: 1 });

// Calculate average rating for a user
reviewSchema.statics.calculateAverageRating = async function(userId) {
  const result = await this.aggregate([
    { $match: { revieweeId: mongoose.Types.ObjectId(userId), status: 'published' } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  
  return result.length > 0 ? { average: result[0].average, count: result[0].count } : { average: 0, count: 0 };
};

// Calculate skill rating average
reviewSchema.statics.calculateSkillRatings = async function(userId) {
  return await this.aggregate([
    { $match: { revieweeId: mongoose.Types.ObjectId(userId), status: 'published' } },
    { $unwind: '$skills' },
    { $group: { 
      _id: '$skills.skillId', 
      average: { $avg: '$skills.rating' },
      count: { $sum: 1 }
    }}
  ]);
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
```

### review.controller.js
```javascript
const Review = require('../models/review.model');
const User = require('../../user-service/models/user.model');
const Job = require('../../job-service/models/job.model');
const { ratingCalculation } = require('../utils/rating-calculation');
const { NotificationService } = require('../../notification-service/services/notification.service');

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const { jobId, revieweeId, rating, comment, skills, isAnonymous } = req.body;
    const reviewerId = req.user.id;
    
    // Validate job exists and is completed
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    if (job.status !== 'completed') {
      return res.status(400).json({ message: 'Cannot review a job that is not completed' });
    }
    
    // Determine review type based on reviewer role
    let reviewType;
    if (job.hirerId.toString() === reviewerId.toString()) {
      reviewType = 'worker';
      // Verify reviewee is the worker
      if (job.workerId.toString() !== revieweeId.toString()) {
        return res.status(400).json({ message: 'Invalid reviewee - must be the worker for this job' });
      }
    } else if (job.workerId.toString() === reviewerId.toString()) {
      reviewType = 'hirer';
      // Verify reviewee is the hirer
      if (job.hirerId.toString() !== revieweeId.toString()) {
        return res.status(400).json({ message: 'Invalid reviewee - must be the hirer for this job' });
      }
    } else {
      return res.status(403).json({ message: 'You are not authorized to review this job' });
    }
    
    // Check if review already exists
    const existingReview = await Review.findOne({
      jobId,
      reviewerId,
      revieweeId
    });
    
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this user for this job' });
    }
    
    // Create new review
    const review = new Review({
      jobId,
      reviewerId,
      revieweeId,
      reviewType,
      rating,
      comment,
      skills: skills || [],
      isAnonymous
    });
    
    await review.save();
    
    // Update user's average rating
    await ratingCalculation.updateUserRating(revieweeId);
    
    // Send notification to reviewee
    NotificationService.sendNotification({
      recipient: revieweeId,
      type: 'NEW_REVIEW',
      data: {
        jobId,
        rating,
        reviewId: review._id
      }
    });
    
    return res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get reviews for a user
exports.getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, type } = req.query;
    
    const query = { 
      revieweeId: userId,
      status: 'published'
    };
    
    if (type) {
      query.reviewType = type;
    }
    
    const reviews = await Review.find(query)
      .populate('reviewerId', 'firstName lastName profileImage')
      .populate('jobId', 'title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
      
    const total = await Review.countDocuments(query);
    
    // Get average rating
    const ratingStats = await Review.calculateAverageRating(userId);
    
    return res.status(200).json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      ratingStats
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get job reviews
exports.getJobReviews = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const reviews = await Review.find({ 
      jobId,
      status: 'published'
    })
      .populate('reviewerId', 'firstName lastName profileImage')
      .populate('revieweeId', 'firstName lastName profileImage')
      .sort({ createdAt: -1 });
      
    return res.status(200).json({ reviews });
  } catch (error) {
    console.error('Error fetching job reviews:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update a review
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, isAnonymous } = req.body;
    const userId = req.user.id;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Verify ownership
    if (review.reviewerId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You are not authorized to update this review' });
    }
    
    // Check if 72 hours have passed since creation
    const creationTime = new Date(review.createdAt).getTime();
    const currentTime = new Date().getTime();
    const hoursSinceCreation = (currentTime - creationTime) / (1000 * 60 * 60);
    
    if (hoursSinceCreation > 72) {
      return res.status(400).json({ message: 'Reviews can only be updated within 72 hours of creation' });
    }
    
    // Update review
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    review.isAnonymous = isAnonymous !== undefined ? isAnonymous : review.isAnonymous;
    review.updatedAt = new Date();
    
    await review.save();
    
    // Update user's average rating
    await ratingCalculation.updateUserRating(review.revieweeId);
    
    return res.status(200).json({
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Verify ownership or admin
    if (review.reviewerId.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to delete this review' });
    }
    
    // Check if 72 hours have passed since creation (unless admin)
    if (req.user.role !== 'admin') {
      const creationTime = new Date(review.createdAt).getTime();
      const currentTime = new Date().getTime();
      const hoursSinceCreation = (currentTime - creationTime) / (1000 * 60 * 60);
      
      if (hoursSinceCreation > 72) {
        return res.status(400).json({ message: 'Reviews can only be deleted within 72 hours of creation' });
      }
    }
    
    await Review.findByIdAndDelete(reviewId);
    
    // Update user's average rating
    await ratingCalculation.updateUserRating(review.revieweeId);
    
    return res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Report a review
exports.reportReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Create report
    // This would typically create a report in a separate Reports collection
    // For simplicity, we'll just mark the review as reported
    review.status = 'reported';
    await review.save();
    
    // Notify admins
    NotificationService.sendNotification({
      recipient: 'admin', // This would target admin users in a real implementation
      type: 'REVIEW_REPORTED',
      data: {
        reviewId,
        reporterId: userId,
        reason,
        revieweeId: review.revieweeId
      }
    });
    
    return res.status(200).json({ message: 'Review reported successfully' });
  } catch (error) {
    console.error('Error reporting review:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
```

### review.routes.js
```javascript
const express = require('express');
const reviewController = require('../controllers/review.controller');
const { authenticate } = require('../../auth-service/middleware/auth.middleware');
const { validateReview } = require('../middleware/validation.middleware');

const router = express.Router();

// Create a new review
router.post('/', authenticate, validateReview, reviewController.createReview);

// Get reviews for a user
router.get('/user/:userId', reviewController.getUserReviews);

// Get reviews for a job
router.get('/job/:jobId', reviewController.getJobReviews);

// Update a review
router.put('/:reviewId', authenticate, reviewController.updateReview);

// Delete a review
router.delete('/:reviewId', authenticate, reviewController.deleteReview);

// Report a review
router.post('/:reviewId/report', authenticate, reviewController.reportReview);

module.exports = router;
```

### rating-calculation.js
```javascript
const Review = require('../models/review.model');
const User = require('../../user-service/models/user.model');

// Rating calculation utilities
exports.ratingCalculation = {
  // Update user's average rating
  updateUserRating: async (userId) => {
    try {
      // Calculate overall average rating
      const ratingStats = await Review.calculateAverageRating(userId);
      
      // Calculate skill ratings
      const skillRatings = await Review.calculateSkillRatings(userId);
      
      // Update user profile with new ratings
      await User.findByIdAndUpdate(userId, {
        'rating.average': ratingStats.average,
        'rating.count': ratingStats.count,
        'rating.lastUpdated': new Date(),
        'rating.skills': skillRatings.map(skill => ({
          skillId: skill._id,
          rating: skill.average,
          count: skill.count
        }))
      });
      
      return ratingStats;
    } catch (error) {
      console.error('Error updating user rating:', error);
      throw error;
    }
  },
  
  // Calculate percentile ranking
  calculatePercentileRanking: async (userId, category) => {
    try {
      const user = await User.findById(userId);
      if (!user || !user.rating || !user.rating.average) {
        return 0;
      }
      
      // Get count of users with lower rating in the same category
      const lowerRatedCount = await User.countDocuments({
        'profile.category': category,
        'rating.average': { $lt: user.rating.average }
      });
      
      // Get total count of users in the category
      const totalUsersInCategory = await User.countDocuments({
        'profile.category': category,
        'rating.average': { $exists: true }
      });
      
      if (totalUsersInCategory === 0) return 0;
      
      // Calculate percentile
      return (lowerRatedCount / totalUsersInCategory) * 100;
    } catch (error) {
      console.error('Error calculating percentile ranking:', error);
      throw error;
    }
  }
};
```

### server.js
```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler } = require('../../shared/middleware/errorHandler');
const config = require('./config');

// Import routes
const reviewRoutes = require('./routes/review.routes');

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/reviews', reviewRoutes);

// Error handling
app.use(errorHandler);

// Database connection
mongoose.connect(config.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
})
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start server
    const PORT = process.env.PORT || config.port;
    app.listen(PORT, () => {
      console.log(`Review Service running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;
```

## Implementation Steps

1. Create the directory structure as shown above
2. Implement the key files with the provided templates
3. Adjust imports and references to match your actual project structure
4. Add the service to your API Gateway routing
5. Update the backend orchestration in index.js to include this service
6. Test the APIs to ensure they work correctly

This template provides the basic structure and functionality for the Review Service based on the architecture diagrams and best practices shown in other services. 