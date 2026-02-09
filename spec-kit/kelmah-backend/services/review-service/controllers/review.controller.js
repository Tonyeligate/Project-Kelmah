/**
 * Review Controller
 * Handles review CRUD operations
 */

const { Review } = require('../models');

/**
 * Submit a new review
 */
exports.submitReview = async (req, res) => {
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

    // Simple moderation heuristics
    const textBlob = `${title} ${comment} ${(pros||[]).join(' ')} ${(cons||[]).join(' ')}`.toLowerCase();
    const banned = (process.env.REVIEW_BANNED_WORDS || 'scam,fraud,spam,abuse').split(',').map((w) => w.trim()).filter(Boolean);
    const hasBanned = banned.some((w) => w && textBlob.includes(w));
    const autoApprove = (process.env.REVIEW_AUTO_APPROVE === 'true');
    const initialStatus = hasBanned ? 'flagged' : (autoApprove ? 'approved' : 'pending');

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
      status: initialStatus // Reviews require moderation
    });

    await review.save();

    // Update worker rating summary (will be handled by service)
    // await updateWorkerRating(workerId);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully and is pending moderation',
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

    const query = { jobId, status };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort({ createdAt: -1 })
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
    const query = { workerId: userId, status };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort({ createdAt: -1 })
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