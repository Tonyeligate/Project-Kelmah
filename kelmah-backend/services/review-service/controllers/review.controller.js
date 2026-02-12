/**
 * Review Controller
 * Handles review CRUD operations
 */

const { Review, Job, Application } = require('../models');

const toObjectIdSafe = (value) => value;

/**
 * Submit a new review
 */
exports.submitReview = async (req, res) => {
  try {
        const reviewerId = req.user?.id || req.user?._id;
        if (!reviewerId) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required to submit review'
          });
        }

    const {
      jobId,
      workerId,
      rating,
      ratings,
      comment = '',
    } = req.body;

    // Derive the single rating value: accept top-level `rating` or `ratings.overall`
    const finalRating = rating ?? ratings?.overall;

    // Validation — schema requires: job, reviewer, reviewee, rating
    if (!jobId || !workerId || !finalRating) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: jobId, workerId, and rating (or ratings.overall)'
      });
    }

    if (finalRating < 1 || finalRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rating. Must be between 1 and 5.'
      });
    }

    // Check if review already exists for this job by this reviewer
    const existingReview = await Review.findOne({ job: jobId, reviewer: reviewerId });
    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: 'Review already exists for this job'
      });
    }

    const job = await Job.findById(jobId).select('category').lean();

    // Create review matching the Review schema: { job, reviewer, reviewee, rating, comment }
    const review = new Review({
      job: jobId,
      reviewer: reviewerId,
      reviewee: workerId,
      rating: finalRating,
      comment: (comment || '').trim(),
      jobCategory: job?.category || '',
    });

    await review.save();

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit review'
    });
  }
};

/**
 * Get reviews for a specific worker
 */
exports.getWorkerReviews = async (req, res) => {
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
    const query = { reviewee: toObjectIdSafe(workerId) };
    if (status && status !== 'all') query.status = status;
    if (category) query.jobCategory = category;
    if (minRating) query.rating = { $gte: parseInt(minRating) };

    // Build sort
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('reviewer', 'firstName lastName profilePicture isVerified')
        .populate('job', 'title completedDate budget')
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
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
};

/**
 * Get reviews for a specific job
 */
exports.getJobReviews = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { page = 1, limit = 10, status = 'approved' } = req.query;

    const query = { job: toObjectIdSafe(jobId) };
    if (status && status !== 'all') query.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('reviewer', 'firstName lastName profilePicture isVerified')
        .populate('job', 'title completedDate budget')
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
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job reviews'
    });
  }
};

/**
 * Get reviews authored by a specific user
 */
exports.getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status = 'approved' } = req.query;
    const query = { reviewee: toObjectIdSafe(userId) };
    if (status && status !== 'all') query.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('reviewer', 'firstName lastName profilePicture isVerified')
        .populate('job', 'title completedDate budget')
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
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user reviews'
    });
  }
};

/**
 * Get specific review details
 */
exports.getReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId)
      .populate('reviewee', 'firstName lastName profilePicture profession')
      .populate('reviewer', 'firstName lastName profilePicture isVerified')
      .populate('job', 'title completedDate budget')
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
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review'
    });
  }
};

/**
 * Add worker response to a review
 */
exports.addReviewResponse = async (req, res) => {
      const requesterId = req.user?.id || req.user?._id;
      if (!requesterId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to respond to review'
        });
      }

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
    if (String(review.reviewee) !== String(requesterId)) {
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
      workerId: requesterId
    };

    await review.save();

    res.json({
      success: true,
      message: 'Response added successfully',
      data: review
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add response'
    });
  }
};

/**
 * Vote review as helpful
 */
exports.voteHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.id || req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to vote'
      });
    }

    // Use $addToSet to prevent duplicate votes from the same user
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $addToSet: { helpfulVoters: userId } },
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
      data: { helpfulVotes: review.helpfulVoters.length }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to record vote'
    });
  }
};

/**
 * Report a review
 */
exports.reportReview = async (req, res) => {
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

    res.json({
      success: true,
      message: 'Review reported for moderation'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to report review'
    });
  }
};

/**
 * Check whether the authenticated user is eligible to review a worker.
 * Eligibility requires: the user has at least one completed job/application
 * with the worker AND has not already reviewed that worker for that job.
 */
exports.checkEligibility = async (req, res) => {
  try {
    const { workerId } = req.params;
    const reviewerId = req.user?.id || req.user?._id;

    if (!reviewerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to check eligibility'
      });
    }

    // Find completed applications where the reviewer hired this worker
    const completedApplications = await Application.find({
      worker: workerId,
      status: 'completed'
    }).populate('job', '_id title hirer').lean();

    // Filter to jobs owned by the current reviewer (hirer)
    const eligibleJobs = completedApplications.filter(
      app => app.job && String(app.job.hirer) === String(reviewerId)
    );

    if (eligibleJobs.length === 0) {
      return res.json({
        success: true,
        data: {
          canReview: false,
          reason: 'No completed contracts with this worker'
        }
      });
    }

    // Check if the user already reviewed this worker for any of these jobs
    const existingReviews = await Review.find({
      reviewer: reviewerId,
      reviewee: workerId,
      job: { $in: eligibleJobs.map(a => a.job._id) }
    }).lean();

    const reviewedJobIds = new Set(existingReviews.map(r => String(r.job)));
    const unreviewedJobs = eligibleJobs.filter(
      a => !reviewedJobIds.has(String(a.job._id))
    );

    res.json({
      success: true,
      data: {
        canReview: unreviewedJobs.length > 0,
        eligibleJobs: unreviewedJobs.map(a => ({
          jobId: a.job._id,
          title: a.job.title
        })),
        reason: unreviewedJobs.length > 0
          ? `${unreviewedJobs.length} completed job(s) available for review`
          : 'Already reviewed for all completed contracts'
      }
    });

  } catch (error) {
    console.error('Failed to check review eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check review eligibility'
    });
  }
};