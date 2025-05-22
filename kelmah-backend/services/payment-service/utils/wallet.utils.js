/**
 * Wallet Utility
 * Handles wallet operations like deposits, withdrawals, and transfers
 */

const Wallet = require('../models/wallet.model');
const Transaction = require('../models/transaction.model');
const { sequelize } = require('../config/database');

/**
 * Get user wallet or create if it doesn't exist
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Wallet object
 */
async function getOrCreateWallet(userId) {
  try {
    // Find existing wallet
    let wallet = await Wallet.findOne({ where: { userId } });
    
    // If wallet doesn't exist, create it
    if (!wallet) {
      wallet = await Wallet.create({
        userId,
        balance: 0,
        currency: 'USD',
        isActive: true
      });
    }
    
    return wallet;
  } catch (error) {
    console.error('Error getting or creating wallet:', error);
    throw error;
  }
}

/**
 * Deposit funds to user wallet
 * @param {string} userId - User ID
 * @param {number} amount - Amount to deposit
 * @param {string} source - Source of funds (payment method ID or type)
 * @param {string} description - Transaction description
 * @param {string} paymentId - External payment ID if applicable
 * @returns {Promise<Object>} - Transaction object
 */
async function deposit(userId, amount, source, description, paymentId = null) {
  const transaction = await sequelize.transaction();
  
  try {
    // Get or create user wallet
    const wallet = await getOrCreateWallet(userId);
    
    // Check if amount is valid
    if (amount <= 0) {
      throw new Error('Deposit amount must be greater than zero');
    }
    
    // Update wallet balance
    const newBalance = parseFloat(wallet.balance) + parseFloat(amount);
    await wallet.update({ 
      balance: newBalance,
      lastTransactionAt: new Date()
    }, { transaction });
    
    // Create transaction record
    const transactionRecord = await Transaction.create({
      userId,
      amount,
      currency: wallet.currency,
      paymentMethod: source,
      type: 'deposit',
      status: 'completed',
      description,
      externalReference: paymentId,
      completedAt: new Date()
    }, { transaction });
    
    // Commit transaction
    await transaction.commit();
    
    return {
      transaction: transactionRecord,
      wallet: await Wallet.findByPk(wallet.id)
    };
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    console.error('Error depositing to wallet:', error);
    throw error;
  }
}

/**
 * Withdraw funds from user wallet
 * @param {string} userId - User ID
 * @param {number} amount - Amount to withdraw
 * @param {string} destination - Destination (payment method ID or type)
 * @param {string} description - Transaction description
 * @returns {Promise<Object>} - Transaction object
 */
async function withdraw(userId, amount, destination, description) {
  const transaction = await sequelize.transaction();
  
  try {
    // Get user wallet
    const wallet = await Wallet.findOne({ 
      where: { userId },
      transaction
    });
    
    // Check if wallet exists
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    
    // Check if amount is valid
    if (amount <= 0) {
      throw new Error('Withdrawal amount must be greater than zero');
    }
    
    // Check if user has sufficient balance
    if (parseFloat(wallet.balance) < parseFloat(amount)) {
      throw new Error('Insufficient balance');
    }
    
    // Update wallet balance
    const newBalance = parseFloat(wallet.balance) - parseFloat(amount);
    await wallet.update({ 
      balance: newBalance,
      lastTransactionAt: new Date()
    }, { transaction });
    
    // Create transaction record
    const transactionRecord = await Transaction.create({
      userId,
      amount,
      currency: wallet.currency,
      paymentMethod: destination,
      type: 'withdrawal',
      status: 'pending', // Initial status is pending until processed
      description
    }, { transaction });
    
    // Commit transaction
    await transaction.commit();
    
    return {
      transaction: transactionRecord,
      wallet: await Wallet.findByPk(wallet.id)
    };
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    console.error('Error withdrawing from wallet:', error);
    throw error;
  }
}

/**
 * Transfer funds between users
 * @param {string} fromUserId - Sender user ID
 * @param {string} toUserId - Recipient user ID
 * @param {number} amount - Amount to transfer
 * @param {string} description - Transaction description
 * @returns {Promise<Object>} - Transaction objects
 */
async function transfer(fromUserId, toUserId, amount, description) {
  const transaction = await sequelize.transaction();
  
  try {
    // Get sender wallet
    const fromWallet = await Wallet.findOne({ 
      where: { userId: fromUserId },
      transaction
    });
    
    // Check if sender wallet exists
    if (!fromWallet) {
      throw new Error('Sender wallet not found');
    }
    
    // Get or create recipient wallet
    const toWallet = await getOrCreateWallet(toUserId);
    
    // Check if amount is valid
    if (amount <= 0) {
      throw new Error('Transfer amount must be greater than zero');
    }
    
    // Check if sender has sufficient balance
    if (parseFloat(fromWallet.balance) < parseFloat(amount)) {
      throw new Error('Insufficient balance');
    }
    
    // Update sender wallet balance
    const newFromBalance = parseFloat(fromWallet.balance) - parseFloat(amount);
    await fromWallet.update({ 
      balance: newFromBalance,
      lastTransactionAt: new Date()
    }, { transaction });
    
    // Update recipient wallet balance
    const newToBalance = parseFloat(toWallet.balance) + parseFloat(amount);
    await toWallet.update({ 
      balance: newToBalance,
      lastTransactionAt: new Date()
    }, { transaction });
    
    // Create sender transaction record
    const fromTransaction = await Transaction.create({
      userId: fromUserId,
      amount,
      currency: fromWallet.currency,
      paymentMethod: 'wallet',
      type: 'payment',
      status: 'completed',
      description: `Transfer to user: ${description}`,
      metadata: { recipient: toUserId },
      completedAt: new Date()
    }, { transaction });
    
    // Create recipient transaction record
    const toTransaction = await Transaction.create({
      userId: toUserId,
      amount,
      currency: toWallet.currency,
      paymentMethod: 'wallet',
      type: 'deposit',
      status: 'completed',
      description: `Transfer from user: ${description}`,
      metadata: { sender: fromUserId },
      completedAt: new Date()
    }, { transaction });
    
    // Commit transaction
    await transaction.commit();
    
    return {
      fromTransaction,
      toTransaction,
      fromWallet: await Wallet.findByPk(fromWallet.id),
      toWallet: await Wallet.findByPk(toWallet.id)
    };
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    console.error('Error transferring between wallets:', error);
    throw error;
  }
}

module.exports = {
  getOrCreateWallet,
  deposit,
  withdraw,
  transfer
}; 