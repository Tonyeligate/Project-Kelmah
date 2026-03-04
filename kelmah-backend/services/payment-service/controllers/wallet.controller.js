const { Wallet, Transaction, PaymentMethod, User } = require("../models");
const { validateWallet } = require('../utils/validation');
const { handleError } = require('../utils/controllerUtils');

// Helper: get user ID from gateway-authenticated request
const getUserId = (req) => req.user?.id || req.user?._id;

// Get user's wallet balance
exports.getBalance = async (req, res) => {
  try {
    const userId = getUserId(req);
    let wallet = await Wallet.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { user: userId, balance: 0 } },
      { new: true, upsert: true }
    );

    return res.json({
      success: true,
      data: {
        balance: wallet.balance,
        currency: wallet.currency,
        status: wallet.status,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Deposit funds into wallet
exports.deposit = async (req, res) => {
  try {
    const { amount, currency, paymentMethodId, reference } = req.body;
    const userId = getUserId(req);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A positive amount is required',
      });
    }

    // Require a verified payment reference to prevent unverified deposits
    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'A payment reference is required for deposits',
      });
    }

    let wallet = await Wallet.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { user: userId, balance: 0, currency: currency || 'GHS' } },
      { new: true, upsert: true }
    );

    if (wallet.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Wallet is not active',
      });
    }

    // CRIT FIX: Create deposit transaction with pending status.
    // Do NOT credit the wallet here — the wallet should only be credited
    // after the payment reference is verified via webhook or a subsequent
    // verification call.  The old code called wallet.addFunds() immediately,
    // allowing anyone to submit a fake reference and receive free credits.
    const transaction = await Transaction.create({
      sender: userId,
      recipient: userId,
      amount,
      type: 'deposit',
      status: 'pending',
      reference,
      description: 'Wallet deposit (awaiting verification)',
    });

    // NOTE: wallet.addFunds() is intentionally NOT called here.
    // A webhook handler or payment verification endpoint must confirm the
    // reference with the payment provider and then call wallet.addFunds().

    res.status(201).json({
      success: true,
      message: 'Deposit successful',
      data: {
        balance: wallet.balance,
        transaction: transaction._id,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Withdraw funds from wallet
exports.withdraw = async (req, res) => {
  try {
    const { amount, paymentMethodId, reference } = req.body;
    const userId = getUserId(req);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A positive amount is required',
      });
    }

    // Atomic balance check and deduction to prevent race conditions
    const wallet = await Wallet.findOneAndUpdate(
      { user: userId, status: 'active', balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { new: true }
    );

    if (!wallet) {
      // Determine specific error
      const existingWallet = await Wallet.findOne({ user: userId });
      if (!existingWallet) {
        return res.status(404).json({ success: false, message: 'Wallet not found' });
      }
      if (existingWallet.status !== 'active') {
        return res.status(403).json({ success: false, message: 'Wallet is not active' });
      }
      return res.status(400).json({ success: false, message: 'Insufficient funds' });
    }

    // Create a withdrawal transaction
    const transaction = await Transaction.create({
      sender: userId,
      recipient: userId,
      amount,
      type: 'withdrawal',
      status: 'completed',
      reference: reference || `wdr_${Date.now()}`,
      description: 'Wallet withdrawal',
    });

    res.json({
      success: true,
      message: 'Withdrawal successful',
      data: {
        balance: wallet.balance,
        transaction: transaction._id,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get user's wallet
exports.getWallet = async (req, res) => {
  try {
    const userId = getUserId(req);
    let wallet = await Wallet.findOne({ user: userId })
      .populate("paymentMethods")
      .populate({
        path: "transactionHistory.transaction",
        populate: [
          { path: "sender", select: "name email" },
          { path: "recipient", select: "name email" },
        ],
      });

    if (!wallet) {
      // Auto-provision an empty wallet on first access
      wallet = new Wallet({ user: userId, balance: 0 });
      await wallet.save();
    }

    res.json({ success: true, data: wallet });
  } catch (error) {
    handleError(res, error);
  }
};

// Create or update wallet
exports.createOrUpdateWallet = async (req, res) => {
  try {
    const { error } = validateWallet(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { currency, paymentMethods } = req.body;
    const userId = getUserId(req);

    let wallet = await Wallet.findOne({ user: userId });

    if (wallet) {
      // Update existing wallet
      wallet.currency = currency;
      if (paymentMethods) {
        wallet.paymentMethods = paymentMethods;
      }
    } else {
      // Create new wallet
      wallet = new Wallet({
        user: userId,
        currency,
        paymentMethods,
      });
    }

    await wallet.save();

    res.status(200).json({
      success: true,
      message: "Wallet updated successfully",
      data: wallet,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Add payment method
exports.addPaymentMethod = async (req, res) => {
  try {
    const { paymentMethod } = req.body;

    const wallet = await Wallet.findOne({ user: getUserId(req) });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    await wallet.addPaymentMethod(paymentMethod);

    res.status(200).json({
      success: true,
      message: "Payment method added successfully",
      data: wallet,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Remove payment method
exports.removePaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId } = req.params;

    const wallet = await Wallet.findOne({ user: getUserId(req) });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    await wallet.removePaymentMethod(paymentMethodId);

    res.json({
      success: true,
      message: "Payment method removed successfully",
      data: wallet,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Set default payment method
exports.setDefaultPaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId } = req.params;

    const wallet = await Wallet.findOne({ user: getUserId(req) });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    const paymentMethod = wallet.paymentMethods.id(paymentMethodId);
    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    await paymentMethod.setAsDefault();

    res.json({
      success: true,
      message: "Default payment method updated successfully",
      data: wallet,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get transaction history
exports.getTransactionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const userId = getUserId(req);
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    const transactions = await Transaction.find({
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("sender recipient relatedContract relatedJob");

    const total = await Transaction.countDocuments({
      $or: [{ sender: userId }, { recipient: userId }],
    });

    res.json({
      success: true,
      data: transactions,
      meta: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};
