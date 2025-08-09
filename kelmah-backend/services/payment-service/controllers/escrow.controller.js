const Escrow = require('../models/Escrow');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

exports.getEscrows = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const escrows = await Escrow.find({ $or: [{ hirerId: userId }, { workerId: userId }] }).sort({ createdAt: -1 });
    return res.json({ success: true, data: escrows });
  } catch (err) {
    next(err);
  }
};

exports.getEscrowDetails = async (req, res, next) => {
  try {
    const { escrowId } = req.params;
    const escrow = await Escrow.findById(escrowId).populate('transactions');
    if (!escrow) return res.status(404).json({ success: false, message: 'Escrow not found' });
    return res.json({ success: true, data: escrow });
  } catch (err) {
    next(err);
  }
};

exports.releaseEscrow = async (req, res, next) => {
  try {
    const { escrowId } = req.params;
    const escrow = await Escrow.findById(escrowId);
    if (!escrow) return res.status(404).json({ success: false, message: 'Escrow not found' });
    if (escrow.status !== 'active') return res.status(400).json({ success: false, message: 'Escrow is not active' });

    const workerWallet = await Wallet.findOne({ user: escrow.workerId });
    if (!workerWallet) return res.status(404).json({ success: false, message: 'Worker wallet not found' });

    const tx = await new Transaction({
      transactionId: `TRX-${Date.now()}`,
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
    }).save();

    await workerWallet.addFunds(escrow.amount, tx);

    escrow.status = 'released';
    escrow.releasedAt = new Date();
    escrow.transactions.push(tx._id);
    await escrow.save();

    return res.json({ success: true, message: 'Escrow released successfully', data: { escrowId: escrow._id } });
  } catch (err) {
    next(err);
  }
};

exports.fundEscrow = async (req, res, next) => {
  try {
    const { amount, currency = 'GHS', contractId, jobId, milestoneId, provider = 'paystack', workerId, reference } = req.body || {};
    const hirerId = req.user?.id || req.body?.hirerId;
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

    return res.status(201).json({ success: true, message: 'Escrow created', data: { escrowId: escrow._id, reference: escrow.reference, status: escrow.status } });
  } catch (err) {
    next(err);
  }
};

exports.refundEscrow = async (req, res, next) => {
  try {
    const { escrowId } = req.params;
    if (!escrowId) return res.status(400).json({ success: false, message: 'escrowId is required' });
    const escrow = await Escrow.findById(escrowId);
    if (!escrow) return res.status(404).json({ success: false, message: 'Escrow not found' });
    if (!['active', 'disputed'].includes(escrow.status)) return res.status(400).json({ success: false, message: 'Escrow is not refundable' });

    const hirerWallet = await Wallet.findOne({ user: escrow.hirerId });
    if (!hirerWallet) return res.status(404).json({ success: false, message: 'Hirer wallet not found' });

    const tx = await new Transaction({
      transactionId: `TRX-${Date.now()}`,
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

    await hirerWallet.addFunds(escrow.amount, tx);

    escrow.status = 'refunded';
    escrow.refundedAt = new Date();
    escrow.transactions.push(tx._id);
    await escrow.save();

    return res.json({ success: true, message: 'Escrow refunded successfully', data: { escrowId: escrow._id } });
  } catch (err) {
    next(err);
  }
};






