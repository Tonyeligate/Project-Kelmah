/**
 * Wallet Controller
 * Handles wallet operations through the API
 */

const walletUtils = require('../utils/wallet.utils');
const Wallet = require('../models/wallet.model');
const Transaction = require('../models/transaction.model');
const { response } = require('../../../shared');

/**
 * Get wallet for current user
 * @route GET /wallet
 * @access Private
 */
exports.getWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get or create wallet
    const wallet = await walletUtils.getOrCreateWallet(userId);
    
    return response.success(res, 200, {
      wallet: {
        id: wallet.id,
        balance: wallet.balance,
        currency: wallet.currency,
        lastTransactionAt: wallet.lastTransactionAt
      }
    });
  } catch (error) {
    console.error('Error getting wallet:', error);
    return response.error(res, 500, 'Failed to get wallet information');
  }
};

/**
 * Get transaction history
 * @route GET /wallet/transactions
 * @access Private
 */
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const type = req.query.type; // Optional filter by transaction type
    
    // Build query
    const query = { where: { userId } };
    
    if (type) {
      query.where.type = type;
    }
    
    // Get transactions with pagination
    const { count, rows } = await Transaction.findAndCountAll({
      ...query,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
    
    return response.success(res, 200, {
      transactions: rows,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error getting transaction history:', error);
    return response.error(res, 500, 'Failed to get transaction history');
  }
};

/**
 * Deposit funds to wallet
 * @route POST /wallet/deposit
 * @access Private
 */
exports.deposit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, source, description } = req.body;
    
    // Validate input
    if (!amount || amount <= 0) {
      return response.error(res, 400, 'Valid amount is required');
    }
    
    if (!source) {
      return response.error(res, 400, 'Payment source is required');
    }
    
    // Process deposit
    const result = await walletUtils.deposit(
      userId,
      amount,
      source,
      description || 'Wallet deposit'
    );
    
    return response.success(res, 200, {
      message: 'Deposit successful',
      transaction: result.transaction,
      wallet: {
        id: result.wallet.id,
        balance: result.wallet.balance,
        currency: result.wallet.currency
      }
    });
  } catch (error) {
    console.error('Error depositing to wallet:', error);
    return response.error(res, 500, 'Failed to process deposit');
  }
};

/**
 * Withdraw funds from wallet
 * @route POST /wallet/withdraw
 * @access Private
 */
exports.withdraw = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, destination, description } = req.body;
    
    // Validate input
    if (!amount || amount <= 0) {
      return response.error(res, 400, 'Valid amount is required');
    }
    
    if (!destination) {
      return response.error(res, 400, 'Withdrawal destination is required');
    }
    
    // Process withdrawal
    const result = await walletUtils.withdraw(
      userId,
      amount,
      destination,
      description || 'Wallet withdrawal'
    );
    
    return response.success(res, 200, {
      message: 'Withdrawal request submitted',
      transaction: result.transaction,
      wallet: {
        id: result.wallet.id,
        balance: result.wallet.balance,
        currency: result.wallet.currency
      }
    });
  } catch (error) {
    console.error('Error withdrawing from wallet:', error);
    
    if (error.message === 'Insufficient balance') {
      return response.error(res, 400, 'Insufficient balance');
    }
    
    return response.error(res, 500, 'Failed to process withdrawal');
  }
};

/**
 * Transfer funds to another user
 * @route POST /wallet/transfer
 * @access Private
 */
exports.transfer = async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const { toUserId, amount, description } = req.body;
    
    // Validate input
    if (!toUserId) {
      return response.error(res, 400, 'Recipient user ID is required');
    }
    
    if (!amount || amount <= 0) {
      return response.error(res, 400, 'Valid amount is required');
    }
    
    // Check if sending to self
    if (fromUserId === toUserId) {
      return response.error(res, 400, 'Cannot transfer to yourself');
    }
    
    // Process transfer
    const result = await walletUtils.transfer(
      fromUserId,
      toUserId,
      amount,
      description || 'User transfer'
    );
    
    return response.success(res, 200, {
      message: 'Transfer successful',
      fromTransaction: result.fromTransaction,
      wallet: {
        id: result.fromWallet.id,
        balance: result.fromWallet.balance,
        currency: result.fromWallet.currency
      }
    });
  } catch (error) {
    console.error('Error transferring from wallet:', error);
    
    if (error.message === 'Insufficient balance') {
      return response.error(res, 400, 'Insufficient balance');
    }
    
    if (error.message === 'Sender wallet not found') {
      return response.error(res, 404, 'Wallet not found');
    }
    
    return response.error(res, 500, 'Failed to process transfer');
  }
}; 