/**
 * Bid Controller - Enhanced Application Controller with Bidding System
 */

const { Bid, Job, UserPerformance } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');

// Create a new bid
exports.createBid = async (req, res, next) => {
  try {
    const { jobId, bidAmount, estimatedDuration, coverLetter, portfolio, availability } = req.body;
    const workerId = req.user.id;

    // Validate required fields
    if (!jobId || !bidAmount || !estimatedDuration || !coverLetter || !availability) {
      return errorResponse(res, 400, 'Missing required fields');
    }

    // Check if job exists and is open for bidding
    const job = await Job.findById(jobId);
    if (!job) {
      return errorResponse(res, 404, 'Job not found');
    }

    if (!job.isBiddingOpen) {
      return errorResponse(res, 400, 'Job is not open for bidding');
    }

    // Check if user has already bid on this job
    const existingBid = await Bid.findOne({ job: jobId, worker: workerId });
    if (existingBid) {
      return errorResponse(res, 400, 'You have already bid on this job');
    }

    // Check monthly bid limit
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const monthlyBidCount = await Bid.getWorkerMonthlyBidCount(workerId, month, year);
    
    if (monthlyBidCount >= 5) {
      return errorResponse(res, 400, 'Monthly bid limit of 5 bids exceeded');
    }

    // Check if job has reached maximum bidders
    const currentBidCount = await Bid.getJobBidCount(jobId);
    if (currentBidCount >= job.bidding.maxBidders) {
      return errorResponse(res, 400, 'Job has reached maximum number of bidders');
    }

    // Validate bid amount
    if (bidAmount < job.bidding.minBidAmount) {
      return errorResponse(res, 400, `Bid amount must be at least ${job.bidding.minBidAmount} GHS`);
    }
    if (bidAmount > job.bidding.maxBidAmount) {
      return errorResponse(res, 400, `Bid amount cannot exceed ${job.bidding.maxBidAmount} GHS`);
    }

    // Get user performance score
    const userPerformance = await UserPerformance.findOne({ userId: workerId });
    const performanceScore = userPerformance ? userPerformance.overallScore : 0;

    // Create the bid
    const bid = new Bid({
      job: jobId,
      worker: workerId,
      bidAmount,
      estimatedDuration,
      coverLetter,
      portfolio: portfolio || [],
      availability,
      performanceScore,
      monthlyBidCount: monthlyBidCount + 1
    });

    await bid.save();

    // Update job bid count
    await job.updateBidCount();

    // Add to user's bid history
    if (userPerformance) {
      await userPerformance.addBidHistory(jobId, 'pending', bidAmount, job.title);
    }

    // Populate the response
    await bid.populate([
      { path: 'job', select: 'title category locationDetails.region' },
      { path: 'worker', select: 'firstName lastName profilePicture' }
    ]);

    return successResponse(res, 201, 'Bid created successfully', bid);
  } catch (error) {
    next(error);
  }
};

// Get all bids for a specific job
exports.getJobBids = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Check if user is the job owner
    const job = await Job.findById(jobId);
    if (!job) {
      return errorResponse(res, 404, 'Job not found');
    }

    if (job.hirer.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Access denied. You can only view bids for your own jobs');
    }

    const { count, rows } = await Bid.findAndCountAll({
      where: { job: jobId },
      offset,
      limit,
      order: [['bidTimestamp', 'DESC']],
      include: [
        { model: 'User', as: 'worker', attributes: ['firstName', 'lastName', 'profilePicture'] }
      ]
    });

    return paginatedResponse(res, 200, 'Job bids retrieved successfully', rows, page, limit, count);
  } catch (error) {
    next(error);
  }
};

// Get all bids by a specific worker
exports.getWorkerBids = async (req, res, next) => {
  try {
    const { workerId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Check if user is viewing their own bids or is an admin
    if (workerId !== req.user.id && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const { count, rows } = await Bid.findAndCountAll({
      where: { worker: workerId },
      offset,
      limit,
      order: [['bidTimestamp', 'DESC']],
      include: [
        { model: 'Job', as: 'job', attributes: ['title', 'category', 'locationDetails'] }
      ]
    });

    return paginatedResponse(res, 200, 'Worker bids retrieved successfully', rows, page, limit, count);
  } catch (error) {
    next(error);
  }
};

// Get a specific bid by ID
exports.getBidById = async (req, res, next) => {
  try {
    const { bidId } = req.params;

    const bid = await Bid.findById(bidId)
      .populate('job', 'title category locationDetails hirer')
      .populate('worker', 'firstName lastName profilePicture email');

    if (!bid) {
      return errorResponse(res, 404, 'Bid not found');
    }

    // Check access permissions
    const isJobOwner = bid.job.hirer.toString() === req.user.id;
    const isBidOwner = bid.worker._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isJobOwner && !isBidOwner && !isAdmin) {
      return errorResponse(res, 403, 'Access denied');
    }

    return successResponse(res, 200, 'Bid retrieved successfully', bid);
  } catch (error) {
    next(error);
  }
};

// Accept a bid
exports.acceptBid = async (req, res, next) => {
  try {
    const { bidId } = req.params;
    const { hirerNotes } = req.body;

    const bid = await Bid.findById(bidId).populate('job');
    if (!bid) {
      return errorResponse(res, 404, 'Bid not found');
    }

    // Check if user is the job owner
    if (bid.job.hirer.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Access denied. You can only accept bids for your own jobs');
    }

    if (bid.status !== 'pending') {
      return errorResponse(res, 400, 'Bid is not pending');
    }

    // Accept the bid
    await bid.accept(hirerNotes);

    // Reject all other pending bids for this job
    await Bid.updateMany(
      { job: bid.job._id, _id: { $ne: bidId }, status: 'pending' },
      { status: 'rejected', hirerNotes: 'Another bid was accepted' }
    );

    // Update job status
    bid.job.status = 'in-progress';
    bid.job.worker = bid.worker;
    bid.job.bidding.bidStatus = 'closed';
    await bid.job.save();

    return successResponse(res, 200, 'Bid accepted successfully', bid);
  } catch (error) {
    next(error);
  }
};

// Reject a bid
exports.rejectBid = async (req, res, next) => {
  try {
    const { bidId } = req.params;
    const { hirerNotes } = req.body;

    const bid = await Bid.findById(bidId).populate('job');
    if (!bid) {
      return errorResponse(res, 404, 'Bid not found');
    }

    // Check if user is the job owner
    if (bid.job.hirer.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Access denied. You can only reject bids for your own jobs');
    }

    if (bid.status !== 'pending') {
      return errorResponse(res, 400, 'Bid is not pending');
    }

    await bid.reject(hirerNotes);

    return successResponse(res, 200, 'Bid rejected successfully', bid);
  } catch (error) {
    next(error);
  }
};

// Withdraw a bid
exports.withdrawBid = async (req, res, next) => {
  try {
    const { bidId } = req.params;
    const { workerNotes } = req.body;

    const bid = await Bid.findById(bidId).populate('job');
    if (!bid) {
      return errorResponse(res, 404, 'Bid not found');
    }

    // Check if user is the bid owner
    if (bid.worker.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Access denied. You can only withdraw your own bids');
    }

    if (bid.status !== 'pending') {
      return errorResponse(res, 400, 'Bid is not pending');
    }

    await bid.withdraw(workerNotes);

    // Update job bid count
    await bid.job.updateBidCount();

    return successResponse(res, 200, 'Bid withdrawn successfully', bid);
  } catch (error) {
    next(error);
  }
};

// Modify a bid
exports.modifyBid = async (req, res, next) => {
  try {
    const { bidId } = req.params;
    const { field, newValue, reason } = req.body;

    const bid = await Bid.findById(bidId).populate('job');
    if (!bid) {
      return errorResponse(res, 404, 'Bid not found');
    }

    // Check if user is the bid owner
    if (bid.worker.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Access denied. You can only modify your own bids');
    }

    if (!bid.canModify) {
      return errorResponse(res, 400, 'Bid cannot be modified');
    }

    // Validate bid amount if being modified
    if (field === 'bidAmount') {
      if (newValue < bid.job.bidding.minBidAmount) {
        return errorResponse(res, 400, `Bid amount must be at least ${bid.job.bidding.minBidAmount} GHS`);
      }
      if (newValue > bid.job.bidding.maxBidAmount) {
        return errorResponse(res, 400, `Bid amount cannot exceed ${bid.job.bidding.maxBidAmount} GHS`);
      }
    }

    await bid.modifyBid(field, newValue, reason);

    return successResponse(res, 200, 'Bid modified successfully', bid);
  } catch (error) {
    next(error);
  }
};

// Get worker's monthly bid statistics
exports.getWorkerBidStats = async (req, res, next) => {
  try {
    const { workerId } = req.params;
    const { month, year } = req.query;

    // Check if user is viewing their own stats or is an admin
    if (workerId !== req.user.id && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const currentDate = new Date();
    const targetMonth = month ? parseInt(month, 10) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year, 10) : currentDate.getFullYear();

    const monthlyBidCount = await Bid.getWorkerMonthlyBidCount(workerId, targetMonth, targetYear);
    const userPerformance = await UserPerformance.findOne({ userId: workerId });

    const stats = {
      monthlyBidCount,
      monthlyBidLimit: userPerformance ? userPerformance.monthlyBidQuota : 5,
      remainingBids: Math.max(0, (userPerformance ? userPerformance.monthlyBidQuota : 5) - monthlyBidCount),
      performanceTier: userPerformance ? userPerformance.performanceTier : 'tier3',
      bidSuccessRate: userPerformance ? userPerformance.getBidSuccessRate() : 0
    };

    return successResponse(res, 200, 'Worker bid statistics retrieved successfully', stats);
  } catch (error) {
    next(error);
  }
};

// Get expired bids (for cleanup)
exports.getExpiredBids = async (req, res, next) => {
  try {
    // Only admins can access this endpoint
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const expiredBids = await Bid.findExpiredBids();
    return successResponse(res, 200, 'Expired bids retrieved successfully', expiredBids);
  } catch (error) {
    next(error);
  }
};

// Clean up expired bids
exports.cleanupExpiredBids = async (req, res, next) => {
  try {
    // Only admins can access this endpoint
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const expiredBids = await Bid.findExpiredBids();
    const updateResult = await Bid.updateMany(
      { _id: { $in: expiredBids.map(bid => bid._id) } },
      { status: 'expired' }
    );

    return successResponse(res, 200, `Cleaned up ${updateResult.modifiedCount} expired bids`, {
      updatedCount: updateResult.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};
