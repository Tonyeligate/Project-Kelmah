const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { handleError } = require('../utils/errorHandler');
const { validateWallet } = require('../utils/validation');

// Get user's wallet
exports.getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id })
      .populate('paymentMethods')
      .populate({
        path: 'transactionHistory.transaction',
        populate: [
          { path: 'sender', select: 'name email' },
          { path: 'recipient', select: 'name email' }
        ]
      });

    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    res.json(wallet);
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

    let wallet = await Wallet.findOne({ user: req.user._id });

    if (wallet) {
      // Update existing wallet
      wallet.currency = currency;
      if (paymentMethods) {
        wallet.paymentMethods = paymentMethods;
      }
    } else {
      // Create new wallet
      wallet = new Wallet({
        user: req.user._id,
        currency,
        paymentMethods
      });
    }

    await wallet.save();

    res.status(200).json({
      message: 'Wallet updated successfully',
      data: wallet
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Add payment method
exports.addPaymentMethod = async (req, res) => {
  try {
    const { paymentMethod } = req.body;

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    await wallet.addPaymentMethod(paymentMethod);

    res.status(200).json({
      message: 'Payment method added successfully',
      data: wallet
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Remove payment method
exports.removePaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId } = req.params;

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    await wallet.removePaymentMethod(paymentMethodId);

    res.json({
      message: 'Payment method removed successfully',
      data: wallet
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Set default payment method
exports.setDefaultPaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId } = req.params;

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    const paymentMethod = wallet.paymentMethods.id(paymentMethodId);
    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    await paymentMethod.setAsDefault();

    res.json({
      message: 'Default payment method updated successfully',
      data: wallet
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get transaction history
exports.getTransactionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    const transactions = await Transaction.find({
      $or: [
        { sender: req.user._id },
        { recipient: req.user._id }
      ]
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('sender recipient relatedContract relatedJob');

    const total = await Transaction.countDocuments({
      $or: [
        { sender: req.user._id },
        { recipient: req.user._id }
      ]
    });

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    handleError(res, error);
  }
}; 