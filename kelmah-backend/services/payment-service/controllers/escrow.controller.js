const { Escrow, Wallet, Transaction, User } = require('../models');

exports.getEscrows = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { $or: [{ hirerId: userId }, { workerId: userId }] };
    const [escrows, total] = await Promise.all([
      Escrow.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Escrow.countDocuments(filter)
    ]);
    return res.json({ success: true, data: escrows, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

exports.getEscrowDetails = async (req, res, next) => {
  try {
    const { escrowId } = req.params;
    const userId = req.user?.id;
    const escrow = await Escrow.findById(escrowId).populate('transactions');
    if (!escrow) return res.status(404).json({ success: false, message: 'Escrow not found' });
    // Authorization: only parties or admin can view
    if (escrow.hirerId.toString() !== userId && escrow.workerId.toString() !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    return res.json({ success: true, data: escrow });
  } catch (err) {
    next(err);
  }
};

exports.releaseEscrow = async (req, res, next) => {
  const mongoose = require('mongoose');
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { escrowId } = req.params;
    const userId = req.user?.id;
    const escrow = await Escrow.findById(escrowId).session(session);
    if (!escrow) { await session.abortTransaction(); return res.status(404).json({ success: false, message: 'Escrow not found' }); }
    if (escrow.hirerId.toString() !== userId && req.user?.role !== 'admin') {
      await session.abortTransaction(); return res.status(403).json({ success: false, message: 'Only the hirer can release escrow' });
    }
    if (escrow.status !== 'active') { await session.abortTransaction(); return res.status(400).json({ success: false, message: 'Escrow is not active' }); }

    // Idempotency: atomically set status to 'releasing' to prevent double-release
    const lockResult = await Escrow.findOneAndUpdate(
      { _id: escrowId, status: 'active' },
      { $set: { status: 'releasing' } },
      { new: true, session }
    );
    if (!lockResult) {
      await session.abortTransaction();
      return res.status(409).json({ success: false, message: 'Escrow release already in progress or completed' });
    }

    const workerWallet = await Wallet.findOne({ user: escrow.workerId }).session(session);
    if (!workerWallet) { await session.abortTransaction(); return res.status(404).json({ success: false, message: 'Worker wallet not found' }); }

    const tx = await new Transaction({
      transactionId: `TRX-${Date.now()}-${require('crypto').randomUUID().slice(0, 8)}`,
      amount: escrow.amount,
      currency: escrow.currency,
      type: 'payment',
      paymentMethod: { metadata: { provider: escrow.provider } },
      sender: escrow.hirerId,
      recipient: escrow.workerId,
      relatedContract: escrow.contractId,
      relatedJob: escrow.jobId,
      description: 'Escrow release',
      status: 'completed'
    }).save({ session });

    await workerWallet.addFunds(escrow.amount, tx);

    escrow.status = 'released';
    escrow.releasedAt = new Date();
    escrow.transactions.push(tx._id);
    await escrow.save({ session });

    await session.commitTransaction();
    return res.json({ success: true, message: 'Escrow released successfully', data: { escrowId: escrow._id } });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

exports.fundEscrow = async (req, res, next) => {
  try {
    const { amount, currency = 'GHS', contractId, jobId, milestoneId, provider = 'paystack', workerId, reference } = req.body || {};
    const hirerId = req.user?.id;
    if (!hirerId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!amount || !contractId || !hirerId || !workerId) {
      return res.status(400).json({ success: false, message: 'amount, contractId, workerId are required; hirerId inferred from auth', code: 'VALIDATION_ERROR' });
    }

    const escrow = await Escrow.create({
      amount,
      currency,
      provider,
      contractId,
      jobId,
      hirerId,
      workerId,
      reference: reference || `ESC_${Date.now()}`,
      status: 'pending',
      milestones: milestoneId ? [{ milestoneId, amount, status: 'pending' }] : []
    });

    // Idempotency hint passthrough (for provider init)
    const idempotencyKey = req.headers['idempotency-key'] || `ESC_${escrow.reference}`;

    return res.status(201).json({ success: true, message: 'Escrow created', data: { escrowId: escrow._id, reference: escrow.reference, status: escrow.status, idempotencyKey } });
  } catch (err) {
    next(err);
  }
};

exports.refundEscrow = async (req, res, next) => {
  try {
    const { escrowId } = req.params;
    const userId = req.user?.id;
    if (!escrowId) return res.status(400).json({ success: false, message: 'escrowId is required' });
    const escrow = await Escrow.findById(escrowId);
    if (!escrow) return res.status(404).json({ success: false, message: 'Escrow not found' });
    // Only hirer or admin can refund
    if (escrow.hirerId.toString() !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the hirer or admin can refund escrow' });
    }
    if (!['active', 'disputed'].includes(escrow.status)) return res.status(400).json({ success: false, message: 'Escrow is not refundable' });

    // Idempotency: atomically set status to 'refunding' to prevent double-refund
    const lockResult = await Escrow.findOneAndUpdate(
      { _id: escrowId, status: { $in: ['active', 'disputed'] } },
      { $set: { status: 'refunding' } },
      { new: true }
    );
    if (!lockResult) {
      return res.status(409).json({ success: false, message: 'Escrow refund already in progress or completed' });
    }

    const tx = await new Transaction({
      transactionId: `TRX-${Date.now()}-${require('crypto').randomUUID().slice(0, 8)}`,
      amount: escrow.amount,
      currency: escrow.currency,
      type: 'refund',
      paymentMethod: { metadata: { provider: escrow.provider } },
      sender: escrow.workerId,
      recipient: escrow.hirerId,
      relatedContract: escrow.contractId,
      relatedJob: escrow.jobId,
      description: 'Escrow refund',
      status: 'completed'
    }).save();

    // Atomic balance update — prevents race-condition double-credit
    const walletUpdate = await Wallet.findOneAndUpdate(
      { user: escrow.hirerId },
      { $inc: { balance: escrow.amount } },
      { new: true }
    );
    if (!walletUpdate) return res.status(500).json({ success: false, message: 'Failed to credit hirer wallet' });

    await Escrow.findByIdAndUpdate(escrowId, {
      $set: { status: 'refunded', refundedAt: new Date() },
      $push: { transactions: tx._id }
    });

    return res.json({ success: true, message: 'Escrow refunded successfully', data: { escrowId: escrow._id } });
  } catch (err) {
    next(err);
  }
};

/**
 * Release milestone payment from escrow
 * @route POST /api/escrow/:escrowId/milestones/:milestoneId/release
 * @access Private (Hirer only)
 */
exports.releaseMilestonePayment = async (req, res, next) => {
  try {
    const { escrowId, milestoneId } = req.params;
    const hirerId = req.user?.id;
    
    const escrow = await Escrow.findById(escrowId);
    if (!escrow) return res.status(404).json({ success: false, message: 'Escrow not found' });
    if (escrow.hirerId.toString() !== hirerId) return res.status(403).json({ success: false, message: 'Access denied' });
    if (escrow.status !== 'active') return res.status(400).json({ success: false, message: 'Escrow is not active' });

    // Atomic milestone status guard — prevents double-release race condition
    const atomicResult = await Escrow.findOneAndUpdate(
      {
        _id: escrowId,
        'milestones.milestoneId': milestoneId,
        'milestones.status': { $ne: 'released' }
      },
      {
        $set: {
          'milestones.$.status': 'released',
          'milestones.$.releasedDate': new Date()
        }
      },
      { new: true }
    );

    if (!atomicResult) {
      return res.status(400).json({ success: false, message: 'Milestone already released or not found' });
    }

    // Find the milestone for amount info
    const milestone = atomicResult.milestones.find(m => m.milestoneId === milestoneId);

    // Create transaction for milestone payment
    const tx = await new Transaction({
      transactionId: `TRX-${Date.now()}-${require('crypto').randomUUID().slice(0, 8)}`,
      amount: milestone.amount,
      currency: atomicResult.currency,
      type: 'milestone_payment',
      paymentMethod: { type: 'paystack', details: { provider: atomicResult.provider, milestoneId } },
      sender: atomicResult.hirerId,
      recipient: atomicResult.workerId,
      relatedContract: atomicResult.contractId,
      relatedJob: atomicResult.jobId,
      description: `Milestone payment: ${milestone.description || milestoneId}`,
      status: 'completed'
    }).save();

    // Atomic balance update — prevents race-condition double-credit
    await Wallet.findOneAndUpdate(
      { user: atomicResult.workerId },
      { $inc: { balance: milestone.amount } },
      { new: true }
    );

    // Push transaction and check if all milestones released
    atomicResult.transactions.push(tx._id);
    const allReleased = atomicResult.milestones.every(m => m.status === 'released');
    if (allReleased) {
      atomicResult.status = 'released';
      atomicResult.releasedAt = new Date();
    }
    await atomicResult.save();

    return res.json({ 
      success: true, 
      message: 'Milestone payment released successfully', 
      data: { 
        escrowId: escrow._id, 
        milestoneId,
        amount: milestone.amount,
        transactionId: tx._id,
        escrowStatus: escrow.status
      } 
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Mark milestone as completed (worker action)
 * @route POST /api/escrow/:escrowId/milestones/:milestoneId/complete
 * @access Private (Worker only)
 */
exports.completeMilestone = async (req, res, next) => {
  try {
    const { escrowId, milestoneId } = req.params;
    const workerId = req.user?.id;
    const { deliverables } = req.body;
    
    const escrow = await Escrow.findById(escrowId);
    if (!escrow) return res.status(404).json({ success: false, message: 'Escrow not found' });
    if (escrow.workerId.toString() !== workerId) return res.status(403).json({ success: false, message: 'Access denied' });
    if (escrow.status !== 'active') return res.status(400).json({ success: false, message: 'Escrow is not active' });

    // Find the milestone
    const milestone = escrow.milestones.find(m => m.milestoneId === milestoneId);
    if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });
    if (milestone.status !== 'pending') return res.status(400).json({ success: false, message: 'Milestone is not pending' });

    // Update milestone status
    milestone.status = 'completed';
    milestone.completedDate = new Date();
    if (deliverables) {
      milestone.deliverables = deliverables;
    }

    await escrow.save();

    // Notify hirer about milestone completion (via messaging-service notifications)
    try {
      const { http } = require('../../../shared/utils/http');
      const gatewayBase = process.env.API_GATEWAY_URL || process.env.MESSAGING_SERVICE_URL;
      if (gatewayBase) {
        await http.post(
          `${gatewayBase.replace(/\/$/, '')}/api/notifications`,
          {
            recipient: escrow.hirerId,
            type: 'milestone_completed',
            title: 'Milestone completed',
            content: `Milestone ${milestone.description || milestoneId} has been marked as completed by the worker.`,
            relatedEntity: { type: 'escrow', id: escrow._id },
          },
          { headers: { Authorization: req.headers.authorization } }
        ).catch(() => {});
      }
    } catch (_) { /* non-blocking */ }
    
    return res.json({ 
      success: true, 
      message: 'Milestone marked as completed', 
      data: { 
        escrowId: escrow._id, 
        milestoneId,
        status: milestone.status,
        completedDate: milestone.completedDate
      } 
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Add milestone to existing escrow
 * @route POST /api/escrow/:escrowId/milestones
 * @access Private (Hirer only)
 */
exports.addMilestone = async (req, res, next) => {
  try {
    const { escrowId } = req.params;
    const hirerId = req.user?.id;
    const { milestoneId, description, amount, dueDate } = req.body;
    
    if (!milestoneId || !amount) {
      return res.status(400).json({ success: false, message: 'milestoneId and amount are required' });
    }

    const escrow = await Escrow.findById(escrowId);
    if (!escrow) return res.status(404).json({ success: false, message: 'Escrow not found' });
    if (escrow.hirerId.toString() !== hirerId) return res.status(403).json({ success: false, message: 'Access denied' });
    if (escrow.status !== 'active') return res.status(400).json({ success: false, message: 'Cannot add milestone to inactive escrow' });

    // Check if milestone already exists
    const existingMilestone = escrow.milestones.find(m => m.milestoneId === milestoneId);
    if (existingMilestone) return res.status(400).json({ success: false, message: 'Milestone already exists' });

    // Add new milestone
    escrow.milestones.push({
      milestoneId,
      description,
      amount,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: 'pending'
    });

    await escrow.save();

    return res.json({ 
      success: true, 
      message: 'Milestone added successfully', 
      data: { 
        escrowId: escrow._id, 
        milestoneId,
        milestonesCount: escrow.milestones.length
      } 
    });
  } catch (err) {
    next(err);
  }
};






