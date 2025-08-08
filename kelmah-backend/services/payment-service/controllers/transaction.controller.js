const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");
const PaymentMethod = require("../models/PaymentMethod");
const { handleError } = require("../utils/errorHandler");
const { validateTransaction } = require("../utils/validation");
const stripe = require("../services/stripe");
const paypal = require("../services/paypal");

// Create a new transaction
exports.createTransaction = async (req, res) => {
  try {
    const { error } = validateTransaction(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const {
      amount,
      currency,
      type,
      paymentMethod,
      recipient,
      relatedContract,
      relatedJob,
      description,
    } = req.body;

    // Create transaction record
    const transaction = new Transaction({
      transactionId: generateTransactionId(),
      amount,
      currency,
      type,
      paymentMethod,
      sender: req.user._id,
      recipient,
      relatedContract,
      relatedJob,
      description,
    });

    // Calculate fees
    await transaction.calculateFees();

    // Process payment based on type
    switch (type) {
      case "payment":
        await processPayment(transaction);
        break;
      case "withdrawal":
        await processWithdrawal(transaction);
        break;
      case "refund":
        await processRefund(transaction);
        break;
      default:
        throw new Error("Invalid transaction type");
    }

    res.status(201).json({
      message: "Transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get transaction details
exports.getTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findOne({
      transactionId,
      $or: [{ sender: req.user._id }, { recipient: req.user._id }],
    }).populate("sender recipient relatedContract relatedJob");

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json(transaction);
  } catch (error) {
    handleError(res, error);
  }
};

// Get user's transaction history
exports.getTransactionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;

    const query = {
      $or: [{ sender: req.user._id }, { recipient: req.user._id }],
    };

    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate("sender recipient relatedContract relatedJob");

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      totalPages: Math.ceil(total / Number(limit)) || 0,
      currentPage: Number(page),
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Cancel transaction
exports.cancelTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findOne({
      transactionId,
      sender: req.user._id,
      status: "pending",
    });

    if (!transaction) {
      return res
        .status(404)
        .json({ message: "Transaction not found or cannot be cancelled" });
    }

    await transaction.updateStatus("cancelled");

    res.json({ message: "Transaction cancelled successfully" });
  } catch (error) {
    handleError(res, error);
  }
};

// Helper functions
const generateTransactionId = () => {
  return `TRX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const processPayment = async (transaction) => {
  try {
    const paymentMethod = await PaymentMethod.findById(
      transaction.paymentMethod,
    );

    switch (paymentMethod.metadata.provider) {
      case "stripe":
        await stripe.processPayment(transaction, paymentMethod);
        break;
      case "paypal":
        await paypal.processPayment(transaction, paymentMethod);
        break;
      default:
        throw new Error("Unsupported payment provider");
    }

    // Update recipient's wallet
    const recipientWallet = await Wallet.findOne({
      user: transaction.recipient,
    });
    await recipientWallet.addFunds(transaction.amount, transaction);

    await transaction.updateStatus("completed");
  } catch (error) {
    await transaction.updateStatus("failed", {
      code: error.code,
      message: error.message,
    });
    throw error;
  }
};

const processWithdrawal = async (transaction) => {
  try {
    const senderWallet = await Wallet.findOne({ user: transaction.sender });

    if (senderWallet.balance < transaction.amount) {
      throw new Error("Insufficient funds");
    }

    const paymentMethod = await PaymentMethod.findById(
      transaction.paymentMethod,
    );

    switch (paymentMethod.metadata.provider) {
      case "stripe":
        await stripe.processWithdrawal(transaction, paymentMethod);
        break;
      case "paypal":
        await paypal.processWithdrawal(transaction, paymentMethod);
        break;
      default:
        throw new Error("Unsupported payment provider");
    }

    await senderWallet.deductFunds(transaction.amount, transaction);
    await transaction.updateStatus("completed");
  } catch (error) {
    await transaction.updateStatus("failed", {
      code: error.code,
      message: error.message,
    });
    throw error;
  }
};

const processRefund = async (transaction) => {
  try {
    const originalTransaction = await Transaction.findOne({
      transactionId: transaction.relatedTransaction,
    });

    if (!originalTransaction) {
      throw new Error("Original transaction not found");
    }

    const paymentMethod = await PaymentMethod.findById(
      originalTransaction.paymentMethod,
    );

    switch (paymentMethod.metadata.provider) {
      case "stripe":
        await stripe.processRefund(transaction, originalTransaction);
        break;
      case "paypal":
        await paypal.processRefund(transaction, originalTransaction);
        break;
      default:
        throw new Error("Unsupported payment provider");
    }

    // Update wallets
    const senderWallet = await Wallet.findOne({ user: transaction.sender });
    const recipientWallet = await Wallet.findOne({
      user: transaction.recipient,
    });

    await senderWallet.addFunds(transaction.amount, transaction);
    await recipientWallet.deductFunds(transaction.amount, transaction);

    await transaction.updateStatus("completed");
  } catch (error) {
    await transaction.updateStatus("failed", {
      code: error.code,
      message: error.message,
    });
    throw error;
  }
};
