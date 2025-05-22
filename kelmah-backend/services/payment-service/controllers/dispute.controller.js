/**
 * Dispute Controller
 * Handles dispute-related operations for the Kelmah platform
 */

const { Dispute, Escrow, Transaction } = require('../models');
const AppError = require('../utils/app-error');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Get dispute by ID
 */
exports.getDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const dispute = await Dispute.findByPk(id);
    
    if (!dispute) {
      return next(new AppError('Dispute not found', 404));
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        dispute
      }
    });
  } catch (error) {
    logger.error('Error fetching dispute:', error);
    return next(new AppError('Failed to fetch dispute', 500));
  }
};

/**
 * Get dispute by dispute number
 */
exports.getDisputeByNumber = async (req, res, next) => {
  try {
    const { disputeNumber } = req.params;
    
    const dispute = await Dispute.findByDisputeNumber(disputeNumber);
    
    if (!dispute) {
      return next(new AppError('Dispute not found', 404));
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        dispute
      }
    });
  } catch (error) {
    logger.error('Error fetching dispute by number:', error);
    return next(new AppError('Failed to fetch dispute', 500));
  }
};

/**
 * Get all disputes
 */
exports.getAllDisputes = async (req, res, next) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    
    // Build query conditions
    const conditions = {};
    if (status) {
      conditions.status = status;
    }
    
    const disputes = await Dispute.findAll({
      where: conditions,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['createdAt', 'DESC']]
    });
    
    // Get total count for pagination
    const totalCount = await Dispute.count({
      where: conditions
    });
    
    return res.status(200).json({
      status: 'success',
      results: disputes.length,
      totalCount,
      data: {
        disputes
      }
    });
  } catch (error) {
    logger.error('Error fetching disputes:', error);
    return next(new AppError('Failed to fetch disputes', 500));
  }
};

/**
 * Add evidence to an existing dispute
 */
exports.addEvidence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { evidence, submittedBy } = req.body;
    
    const dispute = await Dispute.findByPk(id);
    
    if (!dispute) {
      return next(new AppError('Dispute not found', 404));
    }
    
    if (dispute.status !== 'pending' && dispute.status !== 'in_review') {
      return next(new AppError(`Cannot add evidence to a dispute in ${dispute.status} status`, 400));
    }
    
    // Validate the submittedBy is either the hirer or worker
    if (submittedBy !== dispute.hirerId && submittedBy !== dispute.workerId) {
      return next(new AppError('Evidence can only be submitted by hirer or worker', 403));
    }
    
    if (!evidence) {
      return next(new AppError('Evidence is required', 400));
    }
    
    // Add evidence to the dispute
    await dispute.addEvidence(evidence, submittedBy);
    
    logger.disputeAction('evidence_added', {
      id: dispute.id,
      disputeNumber: dispute.disputeNumber,
      submittedBy
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        dispute
      }
    });
  } catch (error) {
    logger.error('Error adding evidence to dispute:', error);
    return next(new AppError('Failed to add evidence to dispute', 500));
  }
};

/**
 * Admin/moderator accepts a dispute for review
 */
exports.acceptDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { moderatorId, remarks } = req.body;
    
    const dispute = await Dispute.findByPk(id);
    
    if (!dispute) {
      return next(new AppError('Dispute not found', 404));
    }
    
    if (dispute.status !== 'pending') {
      return next(new AppError(`Cannot accept a dispute in ${dispute.status} status`, 400));
    }
    
    if (!moderatorId) {
      return next(new AppError('Moderator ID is required', 400));
    }
    
    // Accept the dispute for review
    await dispute.acceptForReview(moderatorId, remarks);
    
    logger.disputeAction('accepted_for_review', {
      id: dispute.id,
      disputeNumber: dispute.disputeNumber,
      moderatorId
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        dispute
      }
    });
  } catch (error) {
    logger.error('Error accepting dispute for review:', error);
    return next(new AppError('Failed to accept dispute for review', 500));
  }
};

/**
 * Admin/moderator resolves a dispute
 */
exports.resolveDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      resolution, 
      resolutionAmount, 
      hirerAmount, 
      workerAmount, 
      moderatorId, 
      resolution_notes 
    } = req.body;
    
    const dispute = await Dispute.findByPk(id);
    
    if (!dispute) {
      return next(new AppError('Dispute not found', 404));
    }
    
    if (dispute.status !== 'in_review') {
      return next(new AppError(`Cannot resolve a dispute in ${dispute.status} status`, 400));
    }
    
    const escrow = await Escrow.findByPk(dispute.escrowId);
    
    if (!escrow) {
      return next(new AppError('Associated escrow not found', 404));
    }
    
    if (escrow.status !== 'disputed') {
      return next(new AppError(`Cannot resolve a dispute for an escrow in ${escrow.status} status`, 400));
    }
    
    if (!resolution || !['hirer_favor', 'worker_favor', 'split'].includes(resolution)) {
      return next(new AppError('Valid resolution type is required', 400));
    }
    
    if (!moderatorId) {
      return next(new AppError('Moderator ID is required', 400));
    }
    
    // For split resolution, both amounts must be provided
    if (resolution === 'split') {
      if (hirerAmount === undefined || workerAmount === undefined) {
        return next(new AppError('Both hirer and worker amounts are required for split resolution', 400));
      }
      
      // Validate that the sum equals the escrow amount
      const total = parseFloat(hirerAmount) + parseFloat(workerAmount);
      if (Math.abs(total - parseFloat(escrow.amount)) > 0.01) { // Allow small rounding differences
        return next(new AppError('The sum of hirer and worker amounts must equal the escrow amount', 400));
      }
    }
    
    // Create transactions based on resolution
    let hirerTransaction, workerTransaction;
    
    if (resolution === 'hirer_favor' || (resolution === 'split' && hirerAmount > 0)) {
      // Return money to hirer (full or partial)
      const hirerRefundAmount = resolution === 'hirer_favor' ? escrow.amount : hirerAmount;
      
      hirerTransaction = await Transaction.create({
        transactionId: uuidv4(),
        userId: escrow.hirerId,
        type: 'dispute_resolution',
        amount: hirerRefundAmount,
        currency: escrow.currency,
        status: 'completed',
        description: `Dispute resolution (${resolution}) for escrow: ${escrow.escrowNumber}`,
        escrowId: escrow.id,
        disputeId: dispute.id
      });
    }
    
    if (resolution === 'worker_favor' || (resolution === 'split' && workerAmount > 0)) {
      // Release money to worker (full or partial)
      const workerPaymentAmount = resolution === 'worker_favor' ? escrow.amount : workerAmount;
      
      workerTransaction = await Transaction.create({
        transactionId: uuidv4(),
        userId: escrow.workerId,
        type: 'dispute_resolution',
        amount: workerPaymentAmount,
        currency: escrow.currency,
        status: 'completed',
        description: `Dispute resolution (${resolution}) for escrow: ${escrow.escrowNumber}`,
        escrowId: escrow.id,
        disputeId: dispute.id
      });
    }
    
    // Resolve the dispute
    await dispute.resolve(
      resolution, 
      resolutionAmount || escrow.amount, 
      moderatorId, 
      resolution_notes,
      hirerTransaction ? hirerTransaction.id : null,
      workerTransaction ? workerTransaction.id : null
    );
    
    // Update escrow status
    await escrow.resolveDispute(dispute.id, resolution);
    
    logger.disputeAction('resolved', {
      id: dispute.id,
      disputeNumber: dispute.disputeNumber,
      resolution,
      moderatorId
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        dispute,
        escrow,
        hirerTransaction,
        workerTransaction
      }
    });
  } catch (error) {
    logger.error('Error resolving dispute:', error);
    return next(new AppError('Failed to resolve dispute', 500));
  }
};

/**
 * Get disputes for a user (as hirer)
 */
exports.getHirerDisputes = async (req, res, next) => {
  try {
    const { hirerId } = req.params;
    const { status, limit = 20, offset = 0 } = req.query;
    
    const conditions = { hirerId };
    if (status) {
      conditions.status = status;
    }
    
    const disputes = await Dispute.findAll({
      where: conditions,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['createdAt', 'DESC']]
    });
    
    // Get total count for pagination
    const totalCount = await Dispute.count({
      where: conditions
    });
    
    return res.status(200).json({
      status: 'success',
      results: disputes.length,
      totalCount,
      data: {
        disputes
      }
    });
  } catch (error) {
    logger.error('Error fetching hirer disputes:', error);
    return next(new AppError('Failed to fetch hirer disputes', 500));
  }
};

/**
 * Get disputes for a user (as worker)
 */
exports.getWorkerDisputes = async (req, res, next) => {
  try {
    const { workerId } = req.params;
    const { status, limit = 20, offset = 0 } = req.query;
    
    const conditions = { workerId };
    if (status) {
      conditions.status = status;
    }
    
    const disputes = await Dispute.findAll({
      where: conditions,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['createdAt', 'DESC']]
    });
    
    // Get total count for pagination
    const totalCount = await Dispute.count({
      where: conditions
    });
    
    return res.status(200).json({
      status: 'success',
      results: disputes.length,
      totalCount,
      data: {
        disputes
      }
    });
  } catch (error) {
    logger.error('Error fetching worker disputes:', error);
    return next(new AppError('Failed to fetch worker disputes', 500));
  }
};

/**
 * Cancel a dispute (can only be done by the creator before it's in review)
 */
exports.cancelDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, cancelledBy } = req.body;
    
    const dispute = await Dispute.findByPk(id);
    
    if (!dispute) {
      return next(new AppError('Dispute not found', 404));
    }
    
    if (dispute.status !== 'pending') {
      return next(new AppError(`Cannot cancel a dispute in ${dispute.status} status`, 400));
    }
    
    // Validate the cancelledBy is the same as requestedBy
    if (cancelledBy !== dispute.requestedBy) {
      return next(new AppError('Dispute can only be cancelled by the creator', 403));
    }
    
    // Get the escrow
    const escrow = await Escrow.findByPk(dispute.escrowId);
    
    if (!escrow) {
      return next(new AppError('Associated escrow not found', 404));
    }
    
    // Cancel the dispute
    await dispute.cancel(reason, cancelledBy);
    
    // Update escrow status back to funded
    await escrow.cancelDispute();
    
    logger.disputeAction('cancelled', {
      id: dispute.id,
      disputeNumber: dispute.disputeNumber,
      cancelledBy,
      reason
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        dispute,
        escrow
      }
    });
  } catch (error) {
    logger.error('Error cancelling dispute:', error);
    return next(new AppError('Failed to cancel dispute', 500));
  }
};

/**
 * Add a comment to a dispute
 */
exports.addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment, userId, userType } = req.body;
    
    const dispute = await Dispute.findByPk(id);
    
    if (!dispute) {
      return next(new AppError('Dispute not found', 404));
    }
    
    if (!comment) {
      return next(new AppError('Comment is required', 400));
    }
    
    if (!userId) {
      return next(new AppError('User ID is required', 400));
    }
    
    if (!userType || !['hirer', 'worker', 'moderator', 'admin'].includes(userType)) {
      return next(new AppError('Valid user type is required', 400));
    }
    
    // Validate the userId based on userType
    if (userType === 'hirer' && userId !== dispute.hirerId) {
      return next(new AppError('Invalid hirer ID', 403));
    }
    
    if (userType === 'worker' && userId !== dispute.workerId) {
      return next(new AppError('Invalid worker ID', 403));
    }
    
    // Add comment to the dispute
    await dispute.addComment(comment, userId, userType);
    
    logger.disputeAction('comment_added', {
      id: dispute.id,
      disputeNumber: dispute.disputeNumber,
      userId,
      userType
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        dispute
      }
    });
  } catch (error) {
    logger.error('Error adding comment to dispute:', error);
    return next(new AppError('Failed to add comment to dispute', 500));
  }
}; 