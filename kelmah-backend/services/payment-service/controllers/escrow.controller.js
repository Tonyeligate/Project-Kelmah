/**
 * Escrow Controller
 * Handles escrow-related operations for the Kelmah platform
 */

const { Escrow, Transaction, Payment, Dispute } = require('../models');
const AppError = require('../utils/app-error');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new escrow
 */
exports.createEscrow = async (req, res, next) => {
  try {
    const {
      amount,
      currency = 'GHS',
      hirerId,
      workerId,
      jobId,
      contractId,
      description,
      milestoneId,
      dueDate
    } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return next(new AppError('Escrow amount must be greater than 0', 400));
    }

    // Validate required fields
    if (!hirerId) {
      return next(new AppError('Hirer ID is required', 400));
    }

    if (!workerId) {
      return next(new AppError('Worker ID is required', 400));
    }

    // At least one of jobId or contractId must be provided
    if (!jobId && !contractId) {
      return next(new AppError('Either jobId or contractId must be provided', 400));
    }

    // Create the escrow
    const escrow = await Escrow.create({
      escrowNumber: `ESC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      amount,
      currency,
      hirerId,
      workerId,
      jobId,
      contractId,
      description,
      milestoneId,
      dueDate,
      status: 'pending'
    });

    logger.escrowAction('created', {
      id: escrow.id,
      escrowNumber: escrow.escrowNumber,
      amount: escrow.amount,
      currency: escrow.currency,
      status: escrow.status
    });

    return res.status(201).json({
      status: 'success',
      data: {
        escrow
      }
    });
  } catch (error) {
    logger.error('Error creating escrow:', error);
    return next(new AppError('Failed to create escrow', 500));
  }
};

/**
 * Get escrow by ID
 */
exports.getEscrow = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const escrow = await Escrow.findByPk(id);
    
    if (!escrow) {
      return next(new AppError('Escrow not found', 404));
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        escrow
      }
    });
  } catch (error) {
    logger.error('Error fetching escrow:', error);
    return next(new AppError('Failed to fetch escrow', 500));
  }
};

/**
 * Get escrow by escrow number
 */
exports.getEscrowByNumber = async (req, res, next) => {
  try {
    const { escrowNumber } = req.params;
    
    const escrow = await Escrow.findByEscrowNumber(escrowNumber);
    
    if (!escrow) {
      return next(new AppError('Escrow not found', 404));
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        escrow
      }
    });
  } catch (error) {
    logger.error('Error fetching escrow by number:', error);
    return next(new AppError('Failed to fetch escrow', 500));
  }
};

/**
 * Fund an escrow
 */
exports.fundEscrow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentMethodId } = req.body;
    
    const escrow = await Escrow.findByPk(id);
    
    if (!escrow) {
      return next(new AppError('Escrow not found', 404));
    }
    
    if (escrow.status !== 'pending') {
      return next(new AppError(`Cannot fund escrow in ${escrow.status} status`, 400));
    }
    
    // Create a payment for the escrow funding
    const payment = await Payment.create({
      paymentNumber: `PMT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      amount: escrow.amount,
      currency: escrow.currency,
      payerId: escrow.hirerId,
      recipientId: null, // Will be set to workerId upon release
      type: 'escrow_funding',
      status: 'pending',
      paymentMethodId,
      description: `Funding for escrow: ${escrow.escrowNumber}`,
      escrowId: escrow.id,
      jobId: escrow.jobId,
      contractId: escrow.contractId
    });
    
    // Create a transaction record
    const transaction = await Transaction.create({
      transactionId: uuidv4(),
      userId: escrow.hirerId,
      type: 'escrow_funding',
      amount: escrow.amount,
      currency: escrow.currency,
      status: 'completed',
      description: `Funding for escrow: ${escrow.escrowNumber}`,
      paymentId: payment.id,
      paymentMethodId
    });
    
    // Update payment with transaction
    await payment.complete(transaction.id, transaction.transactionId);
    
    // Update escrow status to funded
    await escrow.fund(transaction.id);
    
    logger.escrowAction('funded', {
      id: escrow.id,
      escrowNumber: escrow.escrowNumber,
      amount: escrow.amount,
      currency: escrow.currency,
      status: escrow.status
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        escrow,
        payment,
        transaction
      }
    });
  } catch (error) {
    logger.error('Error funding escrow:', error);
    return next(new AppError('Failed to fund escrow', 500));
  }
};

/**
 * Release funds from an escrow
 */
exports.releaseEscrow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    
    const escrow = await Escrow.findByPk(id);
    
    if (!escrow) {
      return next(new AppError('Escrow not found', 404));
    }
    
    if (escrow.status !== 'funded') {
      return next(new AppError(`Cannot release escrow in ${escrow.status} status`, 400));
    }
    
    // Create a payment for the escrow release
    const payment = await Payment.create({
      paymentNumber: `PMT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      amount: escrow.amount,
      currency: escrow.currency,
      payerId: escrow.hirerId,
      recipientId: escrow.workerId,
      type: 'escrow_release',
      status: 'pending',
      description: `Release for escrow: ${escrow.escrowNumber}`,
      escrowId: escrow.id,
      jobId: escrow.jobId,
      contractId: escrow.contractId
    });
    
    // Create a transaction record for the release
    const transaction = await Transaction.create({
      transactionId: uuidv4(),
      userId: escrow.workerId,
      type: 'escrow_release',
      amount: escrow.amount,
      currency: escrow.currency,
      status: 'completed',
      description: `Release for escrow: ${escrow.escrowNumber}`,
      paymentId: payment.id
    });
    
    // Update payment with transaction
    await payment.complete(transaction.id, transaction.transactionId);
    
    // Update escrow status to released
    await escrow.release(transaction.id, remarks);
    
    logger.escrowAction('released', {
      id: escrow.id,
      escrowNumber: escrow.escrowNumber,
      amount: escrow.amount,
      currency: escrow.currency,
      status: escrow.status
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        escrow,
        payment,
        transaction
      }
    });
  } catch (error) {
    logger.error('Error releasing escrow:', error);
    return next(new AppError('Failed to release escrow', 500));
  }
};

/**
 * Refund an escrow
 */
exports.refundEscrow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const escrow = await Escrow.findByPk(id);
    
    if (!escrow) {
      return next(new AppError('Escrow not found', 404));
    }
    
    if (escrow.status !== 'funded') {
      return next(new AppError(`Cannot refund escrow in ${escrow.status} status`, 400));
    }
    
    // Create a transaction record for the refund
    const transaction = await Transaction.create({
      transactionId: uuidv4(),
      userId: escrow.hirerId,
      type: 'escrow_refund',
      amount: escrow.amount,
      currency: escrow.currency,
      status: 'completed',
      description: `Refund for escrow: ${escrow.escrowNumber}`,
      escrowId: escrow.id
    });
    
    // Update escrow status to refunded
    await escrow.refund(transaction.id, reason);
    
    logger.escrowAction('refunded', {
      id: escrow.id,
      escrowNumber: escrow.escrowNumber,
      amount: escrow.amount,
      currency: escrow.currency,
      status: escrow.status,
      reason
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        escrow,
        transaction
      }
    });
  } catch (error) {
    logger.error('Error refunding escrow:', error);
    return next(new AppError('Failed to refund escrow', 500));
  }
};

/**
 * Create a dispute for an escrow
 */
exports.createDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, description, evidence, requestedAmount, requestedBy } = req.body;
    
    const escrow = await Escrow.findByPk(id);
    
    if (!escrow) {
      return next(new AppError('Escrow not found', 404));
    }
    
    if (escrow.status !== 'funded') {
      return next(new AppError(`Cannot dispute escrow in ${escrow.status} status`, 400));
    }
    
    if (!reason) {
      return next(new AppError('Dispute reason is required', 400));
    }
    
    // Validate the requestedBy is either the hirer or worker
    if (requestedBy !== escrow.hirerId && requestedBy !== escrow.workerId) {
      return next(new AppError('Dispute can only be requested by hirer or worker', 403));
    }
    
    // Create the dispute
    const dispute = await Dispute.create({
      disputeNumber: `DSP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      escrowId: escrow.id,
      reason,
      description,
      evidence,
      requestedAmount: requestedAmount || escrow.amount,
      requestedBy,
      status: 'pending',
      hirerId: escrow.hirerId,
      workerId: escrow.workerId,
      jobId: escrow.jobId,
      contractId: escrow.contractId
    });
    
    // Update escrow status to disputed
    await escrow.dispute(dispute.id);
    
    logger.escrowAction('disputed', {
      id: escrow.id,
      escrowNumber: escrow.escrowNumber,
      disputeId: dispute.id,
      status: escrow.status
    });
    
    return res.status(201).json({
      status: 'success',
      data: {
        escrow,
        dispute
      }
    });
  } catch (error) {
    logger.error('Error creating dispute:', error);
    return next(new AppError('Failed to create dispute', 500));
  }
};

/**
 * Get escrows for a job
 */
exports.getJobEscrows = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    
    const escrows = await Escrow.findByJobId(jobId);
    
    return res.status(200).json({
      status: 'success',
      results: escrows.length,
      data: {
        escrows
      }
    });
  } catch (error) {
    logger.error('Error fetching job escrows:', error);
    return next(new AppError('Failed to fetch job escrows', 500));
  }
};

/**
 * Get escrows for a contract
 */
exports.getContractEscrows = async (req, res, next) => {
  try {
    const { contractId } = req.params;
    
    const escrows = await Escrow.findByContractId(contractId);
    
    return res.status(200).json({
      status: 'success',
      results: escrows.length,
      data: {
        escrows
      }
    });
  } catch (error) {
    logger.error('Error fetching contract escrows:', error);
    return next(new AppError('Failed to fetch contract escrows', 500));
  }
};

/**
 * Get escrows for a hirer
 */
exports.getHirerEscrows = async (req, res, next) => {
  try {
    const { hirerId } = req.params;
    const { status, limit = 20, offset = 0 } = req.query;
    
    const escrows = await Escrow.findByHirerId(hirerId, {
      status,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });
    
    // Get total count for pagination
    const totalCount = await Escrow.count({
      where: { hirerId }
    });
    
    return res.status(200).json({
      status: 'success',
      results: escrows.length,
      totalCount,
      data: {
        escrows
      }
    });
  } catch (error) {
    logger.error('Error fetching hirer escrows:', error);
    return next(new AppError('Failed to fetch hirer escrows', 500));
  }
};

/**
 * Get escrows for a worker
 */
exports.getWorkerEscrows = async (req, res, next) => {
  try {
    const { workerId } = req.params;
    const { status, limit = 20, offset = 0 } = req.query;
    
    const escrows = await Escrow.findByWorkerId(workerId, {
      status,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });
    
    // Get total count for pagination
    const totalCount = await Escrow.count({
      where: { workerId }
    });
    
    return res.status(200).json({
      status: 'success',
      results: escrows.length,
      totalCount,
      data: {
        escrows
      }
    });
  } catch (error) {
    logger.error('Error fetching worker escrows:', error);
    return next(new AppError('Failed to fetch worker escrows', 500));
  }
};

/**
 * Get disputes for an escrow
 */
exports.getEscrowDisputes = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const escrow = await Escrow.findByPk(id);
    
    if (!escrow) {
      return next(new AppError('Escrow not found', 404));
    }
    
    const disputes = await Dispute.findAll({
      where: { escrowId: id }
    });
    
    return res.status(200).json({
      status: 'success',
      results: disputes.length,
      data: {
        disputes
      }
    });
  } catch (error) {
    logger.error('Error fetching escrow disputes:', error);
    return next(new AppError('Failed to fetch escrow disputes', 500));
  }
};

/**
 * Cancel an escrow
 */
exports.cancelEscrow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const escrow = await Escrow.findByPk(id);
    
    if (!escrow) {
      return next(new AppError('Escrow not found', 404));
    }
    
    if (escrow.status !== 'pending') {
      return next(new AppError(`Cannot cancel escrow in ${escrow.status} status`, 400));
    }
    
    // Update escrow status to cancelled
    await escrow.cancel(reason);
    
    logger.escrowAction('cancelled', {
      id: escrow.id,
      escrowNumber: escrow.escrowNumber,
      status: escrow.status,
      reason
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        escrow
      }
    });
  } catch (error) {
    logger.error('Error cancelling escrow:', error);
    return next(new AppError('Failed to cancel escrow', 500));
  }
};

/**
 * Update an escrow (before funding)
 */
exports.updateEscrow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, dueDate, description } = req.body;
    
    const escrow = await Escrow.findByPk(id);
    
    if (!escrow) {
      return next(new AppError('Escrow not found', 404));
    }
    
    if (escrow.status !== 'pending') {
      return next(new AppError(`Cannot update escrow in ${escrow.status} status`, 400));
    }
    
    // Update fields
    if (amount && amount > 0) {
      escrow.amount = amount;
    }
    
    if (dueDate) {
      escrow.dueDate = dueDate;
    }
    
    if (description) {
      escrow.description = description;
    }
    
    await escrow.save();
    
    logger.escrowAction('updated', {
      id: escrow.id,
      escrowNumber: escrow.escrowNumber,
      amount: escrow.amount,
      dueDate: escrow.dueDate
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        escrow
      }
    });
  } catch (error) {
    logger.error('Error updating escrow:', error);
    return next(new AppError('Failed to update escrow', 500));
  }
}; 