const { PayoutQueue, Transaction, PaymentMethod, User } = require('../models');

// Enqueue a payout (admin)
exports.enqueuePayout = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
    const { user, amount, currency = 'GHS', paymentMethod, provider, metadata } = req.body || {};
    if (!user || !amount || !paymentMethod || !provider) return res.status(400).json({ success: false, message: 'user, amount, paymentMethod, provider required' });
    const method = await PaymentMethod.findById(paymentMethod);
    if (!method) return res.status(404).json({ success: false, message: 'PaymentMethod not found' });
    const item = await PayoutQueue.create({ user, amount, currency, paymentMethod, provider, metadata });
    return res.status(201).json({ success: true, data: item });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

// Process a batch of queued payouts
exports.processBatch = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
    const limit = Math.min(50, Math.max(1, parseInt(req.body?.limit || '10')));
    const items = await PayoutQueue.find({ status: 'queued' }).sort({ createdAt: 1 }).limit(limit);
    let processed = 0;
    for (const item of items) {
      try {
        item.status = 'processing';
        item.attempts += 1;
        await item.save();
        // Create a withdrawal transaction and process via real flow
        const tx = await new Transaction({
          transactionId: `TRX-${Date.now()}-${Math.random().toString(36).substring(2,8)}`,
          amount: item.amount,
          currency: item.currency,
          type: 'withdrawal',
          paymentMethod: item.paymentMethod,
          sender: item.user,
          recipient: item.user,
          description: item.metadata?.description || 'Admin payout batch',
        }).save();

        const { _processWithdrawal } = require('./transaction.controller');
        const method = await PaymentMethod.findById(item.paymentMethod);
        if (!method) throw new Error('Payment method missing');
        await _processWithdrawal(tx);
        item.status = 'completed';
        item.lastError = undefined;
        await item.save();
        processed += 1;
      } catch (err) {
        item.status = 'queued';
        item.lastError = { message: err.message };
        await item.save();
      }
    }
    return res.json({ success: true, data: { processed, queued: await PayoutQueue.countDocuments({ status: 'queued' }) } });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

// List payouts
exports.listPayouts = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
    const { status, page = 1, limit = 20 } = req.query;
    const q = status ? { status } : {};
    const safePage = Math.max(1, parseInt(page));
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit)));
    const items = await PayoutQueue.find(q).sort({ createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit);
    const total = await PayoutQueue.countDocuments(q);
    return res.json({ success: true, data: items, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};


