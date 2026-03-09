/**
 * Review Controller
 * Handles review CRUD operations
 */

const { Review, Job, Application, User, WorkerRating } = require('../models');
const { logger } = require('../utils/logger');

const toObjectIdSafe = (value) => value;
const toIdString = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  return typeof value?.toString === 'function' ? value.toString() : String(value);
};

const formatJobDuration = (duration) => {
  if (!duration) {
    return 'Not specified';
  }

  if (typeof duration === 'string') {
    return duration;
  }

  const value = Number(duration.value);
  const unit = duration.unit;
  if (!Number.isFinite(value) || !unit) {
    return 'Not specified';
  }

  return `${value} ${unit}${value === 1 ? '' : 's'}`;
};

const buildWorkerName = (worker) => {
  const fullName = [worker?.firstName, worker?.lastName].filter(Boolean).join(' ').trim();
  return fullName || worker?.name || 'Unknown Worker';
};

const resolveAssignedWorkerIdForJob = async (job) => {
  if (job?.worker) {
    return job.worker;
  }

  const acceptedApplication = await Application.findOne({
    job: job?._id,
    status: 'accepted',
  })
    .select('worker')
    .lean();

  return acceptedApplication?.worker || null;
};

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

    const job = await Job.findById(jobId).select('category status hirer').lean();

    // HIGH-11 FIX: Enforce job completion before allowing reviews.
    // Prevents gaming ratings on open/in-progress jobs.
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    if (job.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be submitted for completed jobs'
      });
    }

    const assignedWorkerId = await resolveAssignedWorkerIdForJob(job);

    // Also verify the reviewer was actually involved in the job and that the
    // review target matches the actual completed-job participant.
    const isHirer = String(job.hirer) === String(reviewerId);
    let revieweeId;

    if (isHirer) {
      if (!assignedWorkerId) {
        return res.status(409).json({
          success: false,
          message: 'This completed job does not have an assigned worker to review'
        });
      }

      if (String(workerId) !== String(assignedWorkerId)) {
        return res.status(403).json({
          success: false,
          message: 'Review target must match the worker assigned to this completed job'
        });
      }

      revieweeId = assignedWorkerId;
    } else if (assignedWorkerId && String(assignedWorkerId) === String(reviewerId)) {
      if (String(workerId) !== String(job.hirer)) {
        return res.status(403).json({
          success: false,
          message: 'Workers can only review the hirer for this completed job'
        });
      }

      revieweeId = job.hirer;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Only job participants (hirer or assigned worker) can submit reviews'
      });
    }

    // Create review matching the Review schema: { job, reviewer, reviewee, rating, comment }
    const review = new Review({
      job: jobId,
      reviewer: reviewerId,
      reviewee: revieweeId,
      rating: finalRating,
      comment: (comment || '').trim(),
      jobCategory: job?.category || '',
    });

    await review.save();

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });

  } catch (error) {
    return res.status(500).json({
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

    return res.json({
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
    return res.status(500).json({
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

    return res.json({
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
    return res.status(500).json({
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
    const query = { reviewer: toObjectIdSafe(userId) };
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

    return res.json({
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
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: review
    });

  } catch (error) {
    return res.status(500).json({
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

    return res.json({
      success: true,
      message: 'Response added successfully',
      data: review
    });

  } catch (error) {
    return res.status(500).json({
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
    // HIGH-24 FIX: Only use authenticated user ID, never spoofable headers
    const userId = req.user?.id;

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

    return res.json({
      success: true,
      message: 'Vote recorded',
      data: { helpfulVotes: review.helpfulVoters.length }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to record vote'
    });
  }
};

/**
 * Report a review
 * HIGH-23 FIX: Require authentication, use $addToSet for reporters to prevent
 * duplicate reports, and only flag the review after a threshold.
 */
exports.reportReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to report a review'
      });
    }

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'A reason for reporting is required (min 5 characters)'
      });
    }

    // Use $addToSet to prevent duplicate reports from the same user
    const REPORT_THRESHOLD = 3;
    const review = await Review.findByIdAndUpdate(
      reviewId,
      {
        $addToSet: { reporters: userId }
      },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Only flag for moderation after threshold
    if (review.reporters && review.reporters.length >= REPORT_THRESHOLD) {
      review.status = 'flagged';
      await review.save();
    }

    return res.json({
      success: true,
      message: 'Review reported for moderation'
    });

  } catch (error) {
    return res.status(500).json({
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
    const { jobId } = req.query;
    const reviewerId = req.user?.id || req.user?._id;

    if (!reviewerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to check eligibility'
      });
    }

    const directCompletedJobs = await Job.find({
      hirer: reviewerId,
      worker: workerId,
      status: 'completed',
      ...(jobId ? { _id: jobId } : {}),
    })
      .select('_id title')
      .lean();

    // Legacy fallback: older records may have a completed job without the
    // `job.worker` mirror but still retain an accepted application.
    let fallbackEligibleJobs = [];
    if (!jobId || directCompletedJobs.length === 0) {
      const acceptedApplications = await Application.find({
        worker: workerId,
        status: 'accepted',
      })
        .populate({
          path: 'job',
          select: '_id title hirer status',
          match: {
            hirer: reviewerId,
            status: 'completed',
            ...(jobId ? { _id: jobId } : {}),
          },
        })
        .lean();

      fallbackEligibleJobs = acceptedApplications
        .map((application) => application.job)
        .filter(Boolean)
        .map((job) => ({ _id: job._id, title: job.title }));
    }

    const eligibleJobs = Array.from(
      new Map(
        [...directCompletedJobs, ...fallbackEligibleJobs].map((job) => [
          String(job._id),
          job,
        ]),
      ).values(),
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
      job: { $in: eligibleJobs.map((job) => job._id) }
    }).lean();

    const reviewedJobIds = new Set(existingReviews.map(r => String(r.job)));
    const unreviewedJobs = eligibleJobs.filter(
      (job) => !reviewedJobIds.has(String(job._id))
    );

    return res.json({
      success: true,
      data: {
        canReview: unreviewedJobs.length > 0,
        eligibleJobs: unreviewedJobs.map((job) => ({
          jobId: job._id,
          title: job.title
        })),
        reason: unreviewedJobs.length > 0
          ? `${unreviewedJobs.length} completed job(s) available for review`
          : 'Already reviewed for all completed contracts'
      }
    });

  } catch (error) {
    logger.error('Failed to check review eligibility:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check review eligibility'
    });
  }
};

/**
 * Get workers with completed hirer jobs that can be reviewed.
 */
exports.getHirerReviewCandidates = async (req, res) => {
  try {
    const reviewerId = req.user?.id || req.user?._id;

    if (!reviewerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to load review candidates',
      });
    }

    const completedJobs = await Job.find({
      hirer: reviewerId,
      status: 'completed',
    })
      .select('_id title budget duration completedDate updatedAt createdAt worker')
      .sort({ completedDate: -1, updatedAt: -1, createdAt: -1 })
      .lean();

    if (!Array.isArray(completedJobs) || completedJobs.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const jobsMissingWorker = completedJobs
      .filter((job) => !job.worker)
      .map((job) => job._id);

    let acceptedWorkerByJobId = new Map();
    if (jobsMissingWorker.length > 0) {
      const acceptedApplications = await Application.find({
        job: { $in: jobsMissingWorker },
        status: 'accepted',
      })
        .select('job worker')
        .lean();

      acceptedWorkerByJobId = new Map(
        (acceptedApplications || [])
          .filter((application) => application?.job && application?.worker)
          .map((application) => [toIdString(application.job), application.worker]),
      );
    }

    const resolvedJobs = completedJobs
      .map((job) => ({
        ...job,
        resolvedWorkerId: job.worker || acceptedWorkerByJobId.get(toIdString(job._id)) || null,
      }))
      .filter((job) => job.resolvedWorkerId);

    if (resolvedJobs.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const workerIds = Array.from(
      new Set(resolvedJobs.map((job) => toIdString(job.resolvedWorkerId)).filter(Boolean)),
    );
    const jobIds = resolvedJobs.map((job) => job._id);

    const [workers, ratings, existingReviews] = await Promise.all([
      User.find({ _id: { $in: workerIds } })
        .select('_id firstName lastName profilePicture profileImage skills location profession')
        .lean(),
      WorkerRating.find({ workerId: { $in: workerIds } })
        .select('workerId averageRating totalReviews')
        .lean(),
      Review.find({
        reviewer: reviewerId,
        job: { $in: jobIds },
        reviewee: { $in: workerIds },
      })
        .select('_id job reviewee rating comment createdAt')
        .lean(),
    ]);

    const workersById = new Map(
      (workers || []).map((worker) => [toIdString(worker._id), worker]),
    );
    const ratingsByWorkerId = new Map(
      (ratings || []).map((rating) => [toIdString(rating.workerId), rating]),
    );
    const reviewsByJobId = new Map(
      (existingReviews || []).map((review) => [toIdString(review.job), review]),
    );

    const groupedWorkers = new Map();

    resolvedJobs.forEach((job) => {
      const workerId = toIdString(job.resolvedWorkerId);
      if (!workerId) {
        return;
      }

      const worker = workersById.get(workerId) || {};
      const rating = ratingsByWorkerId.get(workerId) || {};
      const review = reviewsByJobId.get(toIdString(job._id));

      if (!groupedWorkers.has(workerId)) {
        groupedWorkers.set(workerId, {
          id: workerId,
          _id: workerId,
          name: buildWorkerName(worker),
          avatar: worker.profilePicture || worker.profileImage || null,
          overallRating: rating.averageRating || 0,
          totalReviews: rating.totalReviews || 0,
          skills: Array.isArray(worker.skills) ? worker.skills : [],
          location: worker.location || '',
          profession: worker.profession || '',
          completedJobs: [],
        });
      }

      groupedWorkers.get(workerId).completedJobs.push({
        id: toIdString(job._id),
        _id: toIdString(job._id),
        title: job.title || 'Completed Job',
        amount: Number(job.budget || 0),
        budget: Number(job.budget || 0),
        duration: formatJobDuration(job.duration),
        completedDate: job.completedDate || job.updatedAt || job.createdAt || null,
        review: review
          ? {
            id: toIdString(review._id),
            _id: toIdString(review._id),
            rating: Number(review.rating || 0),
            comment: review.comment || '',
            reviewDate: review.createdAt || null,
          }
          : null,
      });
    });

    const candidates = Array.from(groupedWorkers.values()).sort((left, right) => {
      const leftCompletedAt = new Date(left.completedJobs?.[0]?.completedDate || 0).getTime();
      const rightCompletedAt = new Date(right.completedJobs?.[0]?.completedDate || 0).getTime();
      return rightCompletedAt - leftCompletedAt;
    });

    return res.json({
      success: true,
      data: candidates,
    });
  } catch (error) {
    logger.error('Failed to load hirer review candidates:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load review candidates',
    });
  }
};