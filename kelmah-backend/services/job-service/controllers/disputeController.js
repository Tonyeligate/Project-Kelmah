/**
 * Dispute Resolution Controller
 * Handles dispute management for QuickJobs
 * 
 * Resolution Types:
 * - Auto-resolution for minor issues (48-hour deadline)
 * - Staff escalation for complex disputes
 * - Partial refunds based on dispute outcome
 */

const { QuickJob, User } = require('../models');
const paystackService = require('../services/paystackService');
const logger = require('../utils/logger');

// Dispute resolution percentages
const RESOLUTION_PERCENTAGES = {
  worker_returns: 0,       // Worker returns to fix, no refund yet
  partial_refund: 50,      // 50% refund to client
  full_refund: 100,        // Full refund to client
  payment_released: 0,     // Worker gets full payment
  escalated_to_staff: null // No auto-resolution
};

/**
 * Get all disputes (admin only)
 * GET /api/quick-jobs/disputes
 */
const getAllDisputes = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { 'dispute.status': { $exists: true } };
    if (status) {
      query['dispute.status'] = status;
    }

    const disputes = await QuickJob.find(query)
      .populate('client', 'firstName lastName email phoneNumber')
      .populate('acceptedQuote.worker', 'firstName lastName email phoneNumber')
      .sort({ 'dispute.raisedAt': -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await QuickJob.countDocuments(query);

    res.json({
      success: true,
      data: disputes.map(job => ({
        jobId: job._id,
        category: job.category,
        description: job.description,
        client: job.client,
        worker: job.acceptedQuote?.worker,
        dispute: job.dispute,
        escrow: job.escrow,
        status: job.status
      })),
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching disputes:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch disputes', code: 'SERVER_ERROR' }
    });
  }
};

/**
 * Get dispute details
 * GET /api/quick-jobs/:id/dispute
 */
const getDispute = async (req, res) => {
  try {
    const { id } = req.params;

    const quickJob = await QuickJob.findById(id)
      .populate('client', 'firstName lastName email phoneNumber')
      .populate('acceptedQuote.worker', 'firstName lastName email phoneNumber')
      .populate('dispute.raisedByUser', 'firstName lastName')
      .populate('dispute.staffHandler', 'firstName lastName');

    if (!quickJob) {
      return res.status(404).json({
        success: false,
        error: { message: 'Job not found', code: 'NOT_FOUND' }
      });
    }

    if (!quickJob.dispute) {
      return res.status(404).json({
        success: false,
        error: { message: 'No dispute found for this job', code: 'NOT_FOUND' }
      });
    }

    // Check authorization
    const isClient = quickJob.client._id.toString() === req.user._id.toString();
    const isWorker = quickJob.acceptedQuote?.worker?._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isClient && !isWorker && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to view this dispute', code: 'FORBIDDEN' }
      });
    }

    res.json({
      success: true,
      data: {
        jobId: quickJob._id,
        category: quickJob.category,
        description: quickJob.description,
        client: quickJob.client,
        worker: quickJob.acceptedQuote?.worker,
        dispute: quickJob.dispute,
        escrow: quickJob.escrow,
        tracking: quickJob.tracking,
        status: quickJob.status
      }
    });
  } catch (error) {
    logger.error('Error fetching dispute:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch dispute', code: 'SERVER_ERROR' }
    });
  }
};

/**
 * Add evidence to a dispute
 * POST /api/quick-jobs/:id/dispute/evidence
 */
const addEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, url, description } = req.body;

    if (!type || !url) {
      return res.status(400).json({
        success: false,
        error: { message: 'Evidence type and URL required', code: 'VALIDATION_ERROR' }
      });
    }

    const quickJob = await QuickJob.findById(id);

    if (!quickJob || !quickJob.dispute) {
      return res.status(404).json({
        success: false,
        error: { message: 'Dispute not found', code: 'NOT_FOUND' }
      });
    }

    // Check authorization
    const isClient = quickJob.client.toString() === req.user._id.toString();
    const isWorker = quickJob.acceptedQuote?.worker?.toString() === req.user._id.toString();

    if (!isClient && !isWorker) {
      return res.status(403).json({
        success: false,
        error: { message: 'Only involved parties can add evidence', code: 'FORBIDDEN' }
      });
    }

    // Check if dispute is still open
    if (!['open', 'under_review'].includes(quickJob.dispute.status)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot add evidence to resolved dispute', code: 'INVALID_STATUS' }
      });
    }

    quickJob.dispute.evidence.push({
      type,
      url,
      description: description || '',
      uploadedAt: new Date()
    });

    await quickJob.save();

    logger.info(`Evidence added to dispute for QuickJob ${id}`);

    res.json({
      success: true,
      message: 'Evidence added successfully',
      data: { evidenceCount: quickJob.dispute.evidence.length }
    });
  } catch (error) {
    logger.error('Error adding evidence:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to add evidence', code: 'SERVER_ERROR' }
    });
  }
};

/**
 * Resolve a dispute (admin/staff only)
 * POST /api/quick-jobs/:id/dispute/resolve
 */
const resolveDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, note, refundPercentage } = req.body;

    if (!resolution) {
      return res.status(400).json({
        success: false,
        error: { message: 'Resolution type is required', code: 'VALIDATION_ERROR' }
      });
    }

    // Validate resolution type
    const validResolutions = ['worker_returns', 'partial_refund', 'full_refund', 'payment_released', 'escalated_to_staff'];
    if (!validResolutions.includes(resolution)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid resolution type', code: 'VALIDATION_ERROR' }
      });
    }

    const quickJob = await QuickJob.findById(id);

    if (!quickJob || !quickJob.dispute) {
      return res.status(404).json({
        success: false,
        error: { message: 'Dispute not found', code: 'NOT_FOUND' }
      });
    }

    // Check admin permission
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { message: 'Only staff can resolve disputes', code: 'FORBIDDEN' }
      });
    }

    // Process resolution
    quickJob.dispute.resolution = resolution;
    quickJob.dispute.resolutionNote = note || '';
    quickJob.dispute.resolvedBy = 'staff';
    quickJob.dispute.staffHandler = req.user._id;
    quickJob.dispute.resolvedAt = new Date();
    quickJob.dispute.status = resolution === 'escalated_to_staff' ? 'escalated' : 'resolved';

    // Handle financial resolution
    let paymentResult = null;

    if (resolution === 'full_refund') {
      quickJob.dispute.refundPercentage = 100;
      try {
        paymentResult = await paystackService.processRefund(id, 100);
        quickJob.status = 'cancelled';
      } catch (err) {
        logger.error('Refund processing failed:', err);
        // Continue with resolution but note the failure
        quickJob.dispute.resolutionNote += ' [REFUND PROCESSING FAILED - MANUAL REVIEW NEEDED]';
      }
    } else if (resolution === 'partial_refund') {
      const percent = refundPercentage || 50;
      quickJob.dispute.refundPercentage = percent;
      try {
        paymentResult = await paystackService.processRefund(id, percent);
        // Partial refund means job is resolved but worker gets remaining
        quickJob.status = 'approved';
      } catch (err) {
        logger.error('Partial refund processing failed:', err);
        quickJob.dispute.resolutionNote += ' [PARTIAL REFUND PROCESSING FAILED - MANUAL REVIEW NEEDED]';
      }
    } else if (resolution === 'payment_released') {
      try {
        paymentResult = await paystackService.releaseEscrowToWorker(id);
        quickJob.status = 'approved';
      } catch (err) {
        logger.error('Payment release failed:', err);
        quickJob.dispute.resolutionNote += ' [PAYMENT RELEASE FAILED - MANUAL REVIEW NEEDED]';
      }
    } else if (resolution === 'worker_returns') {
      // Worker agrees to return and fix the issue
      quickJob.status = 'in_progress'; // Reset to in progress
      quickJob.dispute.status = 'resolved';
    }

    await quickJob.save();

    logger.info(`Dispute resolved for QuickJob ${id}`, {
      resolution,
      staffHandler: req.user._id
    });

    // TODO: Notify both parties of resolution

    res.json({
      success: true,
      message: `Dispute resolved: ${resolution.replace(/_/g, ' ')}`,
      data: {
        resolution,
        status: quickJob.dispute.status,
        jobStatus: quickJob.status,
        paymentResult
      }
    });
  } catch (error) {
    logger.error('Error resolving dispute:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to resolve dispute', code: 'SERVER_ERROR' }
    });
  }
};

/**
 * Auto-resolve expired disputes
 * Called by cron job or scheduled task
 */
const autoResolveExpiredDisputes = async () => {
  try {
    const now = new Date();

    // Find disputes past their auto-resolve deadline
    const expiredDisputes = await QuickJob.find({
      'dispute.status': 'open',
      'dispute.autoResolveDeadline': { $lt: now }
    });

    let resolved = 0;

    for (const job of expiredDisputes) {
      try {
        // Default auto-resolution: release payment to worker
        // (Client didn't respond within 48 hours)
        job.dispute.resolution = 'payment_released';
        job.dispute.resolutionNote = 'Auto-resolved: Client did not respond within deadline';
        job.dispute.resolvedBy = 'auto';
        job.dispute.resolvedAt = now;
        job.dispute.status = 'resolved';
        job.status = 'approved';

        // Release payment
        await paystackService.releaseEscrowToWorker(job._id);

        await job.save();
        resolved++;

        logger.info(`Auto-resolved dispute for QuickJob ${job._id}`);
      } catch (err) {
        logger.error(`Failed to auto-resolve dispute for QuickJob ${job._id}:`, err);
      }
    }

    logger.info(`Auto-resolution complete: ${resolved}/${expiredDisputes.length} disputes resolved`);

    return { resolved, total: expiredDisputes.length };
  } catch (error) {
    logger.error('Error in auto-resolve disputes:', error);
    throw error;
  }
};

/**
 * Get dispute statistics (admin)
 * GET /api/quick-jobs/disputes/stats
 */
const getDisputeStats = async (req, res) => {
  try {
    const stats = await QuickJob.aggregate([
      { $match: { 'dispute.status': { $exists: true } } },
      {
        $group: {
          _id: '$dispute.status',
          count: { $sum: 1 }
        }
      }
    ]);

    const byReason = await QuickJob.aggregate([
      { $match: { 'dispute.reason': { $exists: true } } },
      {
        $group: {
          _id: '$dispute.reason',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        byStatus: stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        byReason: byReason.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {}),
        total: stats.reduce((sum, s) => sum + s.count, 0)
      }
    });
  } catch (error) {
    logger.error('Error fetching dispute stats:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch stats', code: 'SERVER_ERROR' }
    });
  }
};

module.exports = {
  getAllDisputes,
  getDispute,
  addEvidence,
  resolveDispute,
  autoResolveExpiredDisputes,
  getDisputeStats
};
