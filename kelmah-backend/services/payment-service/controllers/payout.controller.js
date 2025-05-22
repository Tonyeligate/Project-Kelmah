/**
 * Payout Controller
 * Handles payout-related operations for the Kelmah platform
 */

const { Payout, User, Wallet, Transaction, PaymentMethod } = require('../models');
const AppError = require('../utils/app-error');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const { calculateFees } = require('../utils/payment-calculator');

/**
 * Create a new payout request
 */
exports.createPayoutRequest = async (req, res, next) => {
  try {
    const {
      userId,
      amount,
      currency = 'GHS',
      withdrawalMethod,
      withdrawalDetails,
      description = 'Worker payout'
    } = req.body;
    
    // Validate required fields
    if (!userId) {
      return next(new AppError('User ID is required', 400));
    }
    
    if (!amount || amount <= 0) {
      return next(new AppError('Amount must be greater than 0', 400));
    }
    
    if (!withdrawalMethod) {
      return next(new AppError('Withdrawal method is required', 400));
    }
    
    if (!withdrawalDetails) {
      return next(new AppError('Withdrawal details are required', 400));
    }
    
    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Check if user has wallet
    const wallet = await Wallet.findOne({ where: { userId } });
    if (!wallet) {
      return next(new AppError('User wallet not found', 404));
    }
    
    // Check if user has sufficient balance
    if (wallet.balance < amount) {
      return next(new AppError('Insufficient balance for this payout', 400));
    }
    
    // Check if withdrawal method is supported
    const supportedMethods = ['mobile_money', 'bank_transfer', 'paystack', 'flutterwave', 'cash_pickup'];
    if (!supportedMethods.includes(withdrawalMethod)) {
      return next(new AppError(`Unsupported withdrawal method. Supported methods are: ${supportedMethods.join(', ')}`, 400));
    }
    
    // Calculate fees
    const { processingFee, platformFee, tax, totalAmount } = calculateFees({
      amount,
      type: 'payout',
      method: withdrawalMethod
    });
    
    // Generate payout reference
    const payoutReference = `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create the payout request
    const payout = await Payout.create({
      payoutReference,
      userId,
      amount,
      currency,
      processingFee,
      platformFee,
      tax,
      totalAmount: amount - processingFee - platformFee - tax,
      withdrawalMethod,
      withdrawalDetails,
      description,
      status: 'pending',
      requestDate: new Date()
    });
    
    // Reserve the amount in the wallet (reduce available balance but not actual balance yet)
    await wallet.reserveAmount(amount);
    
    logger.payoutAction('requested', {
      id: payout.id,
      payoutReference: payout.payoutReference,
      userId,
      amount,
      withdrawalMethod
    });
    
    return res.status(201).json({
      status: 'success',
      data: {
        payout
      }
    });
  } catch (error) {
    logger.error('Error creating payout request:', error);
    return next(new AppError('Failed to create payout request', 500));
  }
};

/**
 * Get all payout requests for a user
 */
exports.getUserPayouts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, limit = 20, offset = 0 } = req.query;
    
    // Build query conditions
    const conditions = { userId };
    if (status) {
      conditions.status = status;
    }
    
    const payouts = await Payout.findAll({
      where: conditions,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['createdAt', 'DESC']]
    });
    
    // Get total count for pagination
    const totalCount = await Payout.count({
      where: conditions
    });
    
    return res.status(200).json({
      status: 'success',
      results: payouts.length,
      totalCount,
      data: {
        payouts
      }
    });
  } catch (error) {
    logger.error('Error fetching user payouts:', error);
    return next(new AppError('Failed to fetch user payouts', 500));
  }
};

/**
 * Get payout by ID
 */
exports.getPayout = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const payout = await Payout.findByPk(id, {
      include: ['user', 'approver', 'transaction']
    });
    
    if (!payout) {
      return next(new AppError('Payout not found', 404));
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        payout
      }
    });
  } catch (error) {
    logger.error('Error fetching payout:', error);
    return next(new AppError('Failed to fetch payout', 500));
  }
};

/**
 * Get payout by reference
 */
exports.getPayoutByReference = async (req, res, next) => {
  try {
    const { payoutReference } = req.params;
    
    const payout = await Payout.findOne({
      where: { payoutReference },
      include: ['user', 'approver', 'transaction']
    });
    
    if (!payout) {
      return next(new AppError('Payout not found', 404));
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        payout
      }
    });
  } catch (error) {
    logger.error('Error fetching payout by reference:', error);
    return next(new AppError('Failed to fetch payout', 500));
  }
};

/**
 * Approve a payout request (admin/staff only)
 */
exports.approvePayout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approverId, notes } = req.body;
    
    if (!approverId) {
      return next(new AppError('Approver ID is required', 400));
    }
    
    const payout = await Payout.findByPk(id);
    
    if (!payout) {
      return next(new AppError('Payout not found', 404));
    }
    
    if (payout.status !== 'pending') {
      return next(new AppError(`Cannot approve payout in ${payout.status} status`, 400));
    }
    
    // Find user's wallet
    const wallet = await Wallet.findOne({ where: { userId: payout.userId } });
    if (!wallet) {
      return next(new AppError('User wallet not found', 404));
    }
    
    // Create transaction record
    const transaction = await Transaction.create({
      transactionId: uuidv4(),
      userId: payout.userId,
      type: 'payout',
      amount: payout.amount,
      currency: payout.currency,
      status: 'processing',
      description: payout.description || 'Payout to worker',
      payoutId: payout.id
    });
    
    // Update payout status
    payout.status = 'processing';
    payout.approverId = approverId;
    payout.approvalDate = new Date();
    payout.approvalNotes = notes || '';
    payout.transactionId = transaction.id;
    
    await payout.save();
    
    logger.payoutAction('approved', {
      id: payout.id,
      payoutReference: payout.payoutReference,
      approverId,
      amount: payout.amount
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        payout,
        transaction
      }
    });
  } catch (error) {
    logger.error('Error approving payout:', error);
    return next(new AppError('Failed to approve payout', 500));
  }
};

/**
 * Process a payout (admin/staff only)
 * This simulates sending the money through the selected payment provider
 */
exports.processPayout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { processedBy, processorReference, processorResponse } = req.body;
    
    if (!processedBy) {
      return next(new AppError('Processor ID is required', 400));
    }
    
    const payout = await Payout.findByPk(id);
    
    if (!payout) {
      return next(new AppError('Payout not found', 404));
    }
    
    if (payout.status !== 'processing') {
      return next(new AppError(`Cannot process payout in ${payout.status} status`, 400));
    }
    
    // Update transaction status
    const transaction = await Transaction.findByPk(payout.transactionId);
    if (transaction) {
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      transaction.processorReference = processorReference || '';
      transaction.processorResponse = processorResponse || '{}';
      await transaction.save();
    }
    
    // Find user's wallet
    const wallet = await Wallet.findOne({ where: { userId: payout.userId } });
    if (!wallet) {
      return next(new AppError('User wallet not found', 404));
    }
    
    // Update wallet balance (now actually deduct the amount)
    await wallet.deductAmount(payout.amount);
    
    // Update payout status
    payout.status = 'completed';
    payout.processedBy = processedBy;
    payout.processedDate = new Date();
    payout.processorReference = processorReference || '';
    payout.processorResponse = processorResponse || '{}';
    
    await payout.save();
    
    logger.payoutAction('processed', {
      id: payout.id,
      payoutReference: payout.payoutReference,
      processedBy,
      amount: payout.amount
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        payout,
        transaction
      }
    });
  } catch (error) {
    logger.error('Error processing payout:', error);
    return next(new AppError('Failed to process payout', 500));
  }
};

/**
 * Reject a payout request (admin/staff only)
 */
exports.rejectPayout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectedBy, reason } = req.body;
    
    if (!rejectedBy) {
      return next(new AppError('Rejector ID is required', 400));
    }
    
    if (!reason) {
      return next(new AppError('Rejection reason is required', 400));
    }
    
    const payout = await Payout.findByPk(id);
    
    if (!payout) {
      return next(new AppError('Payout not found', 404));
    }
    
    if (payout.status !== 'pending') {
      return next(new AppError(`Cannot reject payout in ${payout.status} status`, 400));
    }
    
    // Find user's wallet
    const wallet = await Wallet.findOne({ where: { userId: payout.userId } });
    if (!wallet) {
      return next(new AppError('User wallet not found', 404));
    }
    
    // Return the reserved amount to the wallet
    await wallet.unreserveAmount(payout.amount);
    
    // Update payout status
    payout.status = 'rejected';
    payout.rejectedBy = rejectedBy;
    payout.rejectionDate = new Date();
    payout.rejectionReason = reason;
    
    await payout.save();
    
    logger.payoutAction('rejected', {
      id: payout.id,
      payoutReference: payout.payoutReference,
      rejectedBy,
      reason
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        payout
      }
    });
  } catch (error) {
    logger.error('Error rejecting payout:', error);
    return next(new AppError('Failed to reject payout', 500));
  }
};

/**
 * Cancel a payout request (can only be done by the user who created it and only if it's still pending)
 */
exports.cancelPayout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return next(new AppError('User ID is required', 400));
    }
    
    const payout = await Payout.findByPk(id);
    
    if (!payout) {
      return next(new AppError('Payout not found', 404));
    }
    
    if (payout.userId !== userId) {
      return next(new AppError('You can only cancel your own payout requests', 403));
    }
    
    if (payout.status !== 'pending') {
      return next(new AppError(`Cannot cancel payout in ${payout.status} status`, 400));
    }
    
    // Find user's wallet
    const wallet = await Wallet.findOne({ where: { userId: payout.userId } });
    if (!wallet) {
      return next(new AppError('User wallet not found', 404));
    }
    
    // Return the reserved amount to the wallet
    await wallet.unreserveAmount(payout.amount);
    
    // Update payout status
    payout.status = 'cancelled';
    payout.cancellationDate = new Date();
    
    await payout.save();
    
    logger.payoutAction('cancelled', {
      id: payout.id,
      payoutReference: payout.payoutReference,
      userId
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        payout
      }
    });
  } catch (error) {
    logger.error('Error cancelling payout:', error);
    return next(new AppError('Failed to cancel payout', 500));
  }
};

/**
 * Mark payout as failed (admin/staff only)
 */
exports.markPayoutAsFailed = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { processedBy, failureReason, processorResponse } = req.body;
    
    if (!processedBy) {
      return next(new AppError('Processor ID is required', 400));
    }
    
    if (!failureReason) {
      return next(new AppError('Failure reason is required', 400));
    }
    
    const payout = await Payout.findByPk(id);
    
    if (!payout) {
      return next(new AppError('Payout not found', 404));
    }
    
    if (payout.status !== 'processing') {
      return next(new AppError(`Cannot mark payout as failed in ${payout.status} status`, 400));
    }
    
    // Update transaction status
    const transaction = await Transaction.findByPk(payout.transactionId);
    if (transaction) {
      transaction.status = 'failed';
      transaction.failureReason = failureReason;
      transaction.processorResponse = processorResponse || '{}';
      await transaction.save();
    }
    
    // Find user's wallet
    const wallet = await Wallet.findOne({ where: { userId: payout.userId } });
    if (!wallet) {
      return next(new AppError('User wallet not found', 404));
    }
    
    // Return the reserved amount to the wallet
    await wallet.unreserveAmount(payout.amount);
    
    // Update payout status
    payout.status = 'failed';
    payout.processedBy = processedBy;
    payout.processedDate = new Date();
    payout.failureReason = failureReason;
    payout.processorResponse = processorResponse || '{}';
    
    await payout.save();
    
    logger.payoutAction('failed', {
      id: payout.id,
      payoutReference: payout.payoutReference,
      processedBy,
      failureReason
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        payout,
        transaction
      }
    });
  } catch (error) {
    logger.error('Error marking payout as failed:', error);
    return next(new AppError('Failed to mark payout as failed', 500));
  }
};

/**
 * Get available payout methods for a user
 * This takes into account the user's location, verification status, and any platform restrictions
 */
exports.getPayoutMethods = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Get user's saved payment methods
    const savedMethods = await PaymentMethod.findAll({
      where: { 
        userId,
        type: {
          [Op.in]: ['bank_account', 'mobile_money']
        },
        isActive: true
      }
    });
    
    // Define available methods based on user location (default to Ghana)
    const countryCode = user.countryCode || 'GH';
    let availableMethods = [];
    
    if (countryCode === 'GH') {
      // Ghana-specific methods
      availableMethods = [
        {
          id: 'mobile_money',
          name: 'Mobile Money',
          description: 'Withdraw to your Mobile Money account (MTN, Vodafone, AirtelTigo)',
          processingTime: '1-24 hours',
          minAmount: 10,
          maxAmount: 5000,
          currency: 'GHS',
          fee: '1.5%',
          providers: [
            { id: 'mtn', name: 'MTN Mobile Money' },
            { id: 'vodafone', name: 'Vodafone Cash' },
            { id: 'airtel_tigo', name: 'AirtelTigo Money' }
          ],
          requiredFields: ['provider', 'phoneNumber', 'accountName']
        },
        {
          id: 'bank_transfer',
          name: 'Bank Transfer',
          description: 'Withdraw directly to your Ghana bank account',
          processingTime: '1-3 business days',
          minAmount: 100,
          maxAmount: 50000,
          currency: 'GHS',
          fee: '1%',
          providers: [
            { id: 'gh_bank', name: 'Ghana Banks' }
          ],
          requiredFields: ['bankName', 'accountNumber', 'accountName', 'branchCode', 'swiftCode']
        },
        {
          id: 'cash_pickup',
          name: 'Cash Pickup',
          description: 'Pick up cash at any Kelmah partner location',
          processingTime: '1-2 business days',
          minAmount: 50,
          maxAmount: 3000,
          currency: 'GHS',
          fee: '2%',
          providers: [
            { id: 'kelmah_office', name: 'Kelmah Office' },
            { id: 'partner_location', name: 'Partner Locations' }
          ],
          requiredFields: ['pickupLocation', 'identificationNumber', 'identificationType']
        }
      ];
    } else {
      // International methods
      availableMethods = [
        {
          id: 'bank_transfer',
          name: 'International Bank Transfer',
          description: 'Withdraw to your international bank account',
          processingTime: '3-5 business days',
          minAmount: 100,
          maxAmount: 50000,
          currency: 'USD',
          fee: '3%',
          providers: [
            { id: 'intl_bank', name: 'International Banks' }
          ],
          requiredFields: ['bankName', 'accountNumber', 'accountName', 'routingNumber', 'swiftCode', 'bankAddress']
        },
        {
          id: 'paystack',
          name: 'Paystack',
          description: 'Withdraw via Paystack',
          processingTime: '1-2 business days',
          minAmount: 50,
          maxAmount: 10000,
          currency: 'NGN',
          fee: '1.5%',
          providers: [
            { id: 'paystack', name: 'Paystack' }
          ],
          requiredFields: ['email']
        },
        {
          id: 'flutterwave',
          name: 'Flutterwave',
          description: 'Withdraw via Flutterwave',
          processingTime: '1-2 business days',
          minAmount: 50,
          maxAmount: 10000,
          currency: 'USD',
          fee: '1.5%',
          providers: [
            { id: 'flutterwave', name: 'Flutterwave' }
          ],
          requiredFields: ['email', 'accountNumber']
        }
      ];
    }
    
    // Add the user's saved methods
    const savedMethodDetails = savedMethods.map(method => ({
      id: method.id,
      type: method.type,
      details: method.details,
      isDefault: method.isDefault
    }));
    
    return res.status(200).json({
      status: 'success',
      data: {
        availableMethods,
        savedMethods: savedMethodDetails
      }
    });
  } catch (error) {
    logger.error('Error fetching payout methods:', error);
    return next(new AppError('Failed to fetch payout methods', 500));
  }
};

/**
 * Get all payouts (admin only)
 */
exports.getAllPayouts = async (req, res, next) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    
    // Build query conditions
    const conditions = {};
    if (status) {
      conditions.status = status;
    }
    
    const payouts = await Payout.findAll({
      where: conditions,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['createdAt', 'DESC']],
      include: ['user', 'approver', 'processor', 'transaction']
    });
    
    // Get total count for pagination
    const totalCount = await Payout.count({
      where: conditions
    });
    
    return res.status(200).json({
      status: 'success',
      results: payouts.length,
      totalCount,
      data: {
        payouts
      }
    });
  } catch (error) {
    logger.error('Error fetching all payouts:', error);
    return next(new AppError('Failed to fetch all payouts', 500));
  }
}; 