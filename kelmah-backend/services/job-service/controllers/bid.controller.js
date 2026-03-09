/**
 * Bid Controller - Enhanced Application Controller with Bidding System
 */

const mongoose = require('mongoose');
const { Bid, Job, UserPerformance } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const ServiceClient = require('../services/serviceClient');

const DURATION_UNIT_MAP = {
  hour: 'hour',
  hours: 'hour',
  hr: 'hour',
  hrs: 'hour',
  day: 'day',
  days: 'day',
  week: 'week',
  weeks: 'week',
  wk: 'week',
  wks: 'week',
  month: 'month',
  months: 'month',
  mo: 'month',
  mos: 'month',
};

const DEFAULT_DURATION = { value: 1, unit: 'week' };

const ensureValidObjectId = (res, value, label) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    errorResponse(res, 400, `Invalid ${label}`);
    return false;
  }

  return true;
};

const ensureValidBidId = (res, bidId) => ensureValidObjectId(res, bidId, 'bid ID');
const ensureValidJobId = (res, jobId) => ensureValidObjectId(res, jobId, 'job ID');
const ensureValidWorkerId = (res, workerId) => ensureValidObjectId(res, workerId, 'worker ID');

const toPositiveNumber = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

const normalizeDurationUnit = (unit) => {
  if (!unit || typeof unit !== 'string') return null;
  return DURATION_UNIT_MAP[unit.trim().toLowerCase()] || null;
};

const normalizeEstimatedDuration = (estimatedDuration) => {
  if (estimatedDuration && typeof estimatedDuration === 'object') {
    const value = toPositiveNumber(
      estimatedDuration.value ?? estimatedDuration.amount ?? estimatedDuration.duration,
    );
    const unit = normalizeDurationUnit(estimatedDuration.unit);
    if (value && unit) {
      return { value, unit };
    }
  }

  if (typeof estimatedDuration === 'string') {
    const match = estimatedDuration.trim().match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/);
    if (match) {
      const value = toPositiveNumber(match[1]);
      const unit = normalizeDurationUnit(match[2]);
      if (value && unit) {
        return { value, unit };
      }
    }
  }

  return { ...DEFAULT_DURATION };
};

const normalizeAvailability = (availability) => {
  if (availability && typeof availability === 'object') {
    const startDate = availability.startDate ? new Date(availability.startDate) : new Date();
    const normalizedAvailability = {
      startDate: Number.isNaN(startDate.getTime()) ? new Date() : startDate,
      flexible: availability.flexible ?? true,
    };

    const hoursPerWeek = toPositiveNumber(availability.hoursPerWeek);
    if (hoursPerWeek) {
      normalizedAvailability.hoursPerWeek = Math.min(hoursPerWeek, 168);
    }

    if (availability.endDate) {
      const endDate = new Date(availability.endDate);
      if (!Number.isNaN(endDate.getTime())) {
        normalizedAvailability.endDate = endDate;
      }
    }

    return normalizedAvailability;
  }

  return {
    startDate: new Date(),
    flexible: true,
  };
};

// Create a new bid
exports.createBid = async (req, res, next) => {
  try {
    const {
      jobId: rawJobId,
      job: legacyJobId,
      bidAmount: rawBidAmount,
      estimatedDuration,
      coverLetter,
      portfolio,
      availability,
    } = req.body;
    const workerId = req.user.id || req.user._id;
    const jobId = rawJobId || legacyJobId;
    const bidAmount = Number(rawBidAmount);
    const normalizedEstimatedDuration = normalizeEstimatedDuration(estimatedDuration);
    const normalizedAvailability = normalizeAvailability(availability);

    // Validate required fields
    if (!jobId || !Number.isFinite(bidAmount) || bidAmount <= 0 || !String(coverLetter || '').trim()) {
      return errorResponse(res, 400, 'Missing required bid fields');
    }

    if (!ensureValidJobId(res, jobId)) {
      return;
    }

    // Check if job exists and is open for bidding
    const job = await Job.findById(jobId);
    if (!job) {
      return errorResponse(res, 404, 'Job not found');
    }

    if (!job.isBiddingOpen) {
      return errorResponse(res, 400, 'Job is not open for bidding');
    }

    // Prevent hirer from bidding on their own job
    if (job.hirer.toString() === workerId) {
      return errorResponse(res, 400, 'You cannot bid on your own job');
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
    
    // Use tier-based bid limit instead of hard-coded 5
    const userPerformance = await UserPerformance.findOne({ userId: workerId });
    const monthlyBidLimit = userPerformance ? userPerformance.monthlyBidQuota : 5;
    if (monthlyBidCount >= monthlyBidLimit) {
      return errorResponse(res, 400, `Monthly bid limit of ${monthlyBidLimit} bids exceeded`);
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

    // Get user performance score (already fetched above for bid limit)
    const performanceScore = userPerformance ? userPerformance.overallScore : 0;

    // Create the bid
    const bid = new Bid({
      job: jobId,
      worker: workerId,
      bidAmount,
      estimatedDuration: normalizedEstimatedDuration,
      coverLetter: String(coverLetter).trim(),
      portfolio: portfolio || [],
      availability: normalizedAvailability,
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

    // Notify the hirer that a new bid was received
    ServiceClient.messaging.sendBidNotification(
      job.hirer.toString(),
      'bid:received',
      {
        bidId: bid._id,
        jobId: job._id,
        jobTitle: job.title,
        workerName: bid.worker ? `${bid.worker.firstName} ${bid.worker.lastName}` : 'A worker',
        bidAmount: bidAmount,
      }
    ).catch(() => {}); // Fire-and-forget

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

    if (!ensureValidJobId(res, jobId)) {
      return;
    }

    // Check if user is the job owner
    const job = await Job.findById(jobId);
    if (!job) {
      return errorResponse(res, 404, 'Job not found');
    }

    if (job.hirer.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Access denied. You can only view bids for your own jobs');
    }

    const query = { job: jobId };
    const [total, bids] = await Promise.all([
      Bid.countDocuments(query),
      Bid.find(query)
        .sort({ bidTimestamp: -1 })
        .skip(offset)
        .limit(limit)
        .populate('worker', 'firstName lastName profilePicture')
        .populate('job', 'title category locationDetails')
        .lean(),
    ]);

    return paginatedResponse(res, 200, 'Job bids retrieved successfully', bids, page, limit, total);
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

    if (!ensureValidWorkerId(res, workerId)) {
      return;
    }

    // Check if user is viewing their own bids or is an admin
    if (workerId !== req.user.id && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const query = { worker: workerId };
    const [total, bids] = await Promise.all([
      Bid.countDocuments(query),
      Bid.find(query)
        .sort({ bidTimestamp: -1 })
        .skip(offset)
        .limit(limit)
        .populate('job', 'title category locationDetails')
        .populate('worker', 'firstName lastName profilePicture')
        .lean(),
    ]);

    return paginatedResponse(res, 200, 'Worker bids retrieved successfully', bids, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// Get a specific bid by ID
exports.getBidById = async (req, res, next) => {
  try {
    const { bidId } = req.params;

    if (!ensureValidBidId(res, bidId)) {
      return;
    }

    const bid = await Bid.findById(bidId)
      .populate('job', 'title category locationDetails hirer')
      .populate('worker', 'firstName lastName profilePicture email')
      .lean();

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

    if (!ensureValidBidId(res, bidId)) {
      return;
    }

    const bid = await Bid.findById(bidId).populate('job');
    if (!bid) {
      return errorResponse(res, 404, 'Bid not found');
    }

    // Check if user is the job owner
    if (bid.job.hirer.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Access denied. You can only accept bids for your own jobs');
    }

    // Accept bid, reject others, and update job in a transaction to prevent double-accept
    const session = await mongoose.startSession();
    try {
      let freshBid;
      await session.withTransaction(async () => {
        // Atomically check status and update inside the transaction to prevent race conditions
        freshBid = await Bid.findOneAndUpdate(
          { _id: bidId, status: 'pending' },
          { status: 'accepted', responseTimestamp: new Date(), hirerNotes: hirerNotes || '' },
          { new: true, session }
        ).populate('job');
        if (!freshBid) {
          throw new Error('Bid is no longer pending or was already accepted');
        }

        await Bid.updateMany(
          { job: freshBid.job._id, _id: { $ne: bidId }, status: 'pending' },
          { status: 'rejected', hirerNotes: 'Another bid was accepted' },
          { session }
        );

        freshBid.job.status = 'in-progress';
        freshBid.job.worker = freshBid.worker;
        freshBid.job.bidding.bidStatus = 'closed';
        await freshBid.job.save({ session });
      });

      // Notify the worker whose bid was accepted
      ServiceClient.messaging.sendBidNotification(
        freshBid.worker.toString(),
        'bid:accepted',
        {
          bidId: freshBid._id,
          jobId: freshBid.job._id,
          jobTitle: freshBid.job.title,
          bidAmount: freshBid.bidAmount,
        }
      ).catch(() => {});

      return successResponse(res, 200, 'Bid accepted successfully', freshBid);
    } finally {
      await session.endSession();
    }
  } catch (error) {
    next(error);
  }
};

// Reject a bid
exports.rejectBid = async (req, res, next) => {
  try {
    const { bidId } = req.params;
    const { hirerNotes } = req.body;

    if (!ensureValidBidId(res, bidId)) {
      return;
    }

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

    // Notify the worker whose bid was rejected
    ServiceClient.messaging.sendBidNotification(
      bid.worker.toString(),
      'bid:rejected',
      {
        bidId: bid._id,
        jobId: bid.job._id,
        jobTitle: bid.job.title,
        bidAmount: bid.bidAmount,
        reason: hirerNotes || '',
      }
    ).catch(() => {});

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

    if (!ensureValidBidId(res, bidId)) {
      return;
    }

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

    // Notify the hirer that a bidder withdrew
    ServiceClient.messaging.sendBidNotification(
      bid.job.hirer.toString(),
      'bid:withdrawn',
      {
        bidId: bid._id,
        jobId: bid.job._id,
        jobTitle: bid.job.title,
        workerName: 'A bidder',
      }
    ).catch(() => {});

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

    if (!ensureValidBidId(res, bidId)) {
      return;
    }

    // SECURITY: Only allow modification of specific bid fields
    const BID_MODIFIABLE_FIELDS = ['bidAmount', 'proposal', 'timeline', 'deliveryDate'];
    if (!BID_MODIFIABLE_FIELDS.includes(field)) {
      return errorResponse(res, 400, 'Invalid field for modification');
    }

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

    if (!ensureValidWorkerId(res, workerId)) {
      return;
    }

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
