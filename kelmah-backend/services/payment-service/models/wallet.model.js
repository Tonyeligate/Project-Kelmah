/**
 * Wallet Model
 * Defines the structure and behavior of user wallets in the Kelmah platform
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Wallet = sequelize.define('Wallet', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  // Basic wallet information
  walletNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  balance: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: {
        args: [0],
        msg: 'Balance cannot be negative'
      }
    }
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'GHS', // Ghanaian Cedi
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'frozen', 'suspended'),
    defaultValue: 'active',
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('individual', 'business', 'escrow'),
    defaultValue: 'individual',
    allowNull: false
  },
  
  // Limits and thresholds
  dailyLimit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Maximum amount that can be transacted in a day'
  },
  monthlyLimit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Maximum amount that can be transacted in a month'
  },
  withdrawalLimit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Maximum amount that can be withdrawn in a single transaction'
  },
  minimumBalance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    allowNull: false,
    comment: 'Minimum balance that must be maintained'
  },
  
  // Pending amounts
  pendingDeposits: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    allowNull: false
  },
  pendingWithdrawals: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    allowNull: false
  },
  escrowAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    allowNull: false,
    comment: 'Amount currently held in escrow'
  },
  
  // Security and verification
  verificationStatus: {
    type: DataTypes.ENUM('unverified', 'pending', 'verified'),
    defaultValue: 'unverified',
    allowNull: false
  },
  lastVerified: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Activity information
  lastTransactionDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dailyTransactionTotal: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    allowNull: false
  },
  dailyTransactionReset: {
    type: DataTypes.DATE,
    allowNull: true
  },
  monthlyTransactionTotal: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    allowNull: false
  },
  monthlyTransactionReset: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Additional settings
  autoWithdrawal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether to automatically withdraw funds to default payment method'
  },
  autoWithdrawalThreshold: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Balance threshold for automatic withdrawal'
  },
  autoWithdrawalMethod: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID or reference to the default payment method for auto withdrawals'
  },
  
  // Timestamps for wallet processes
  lastBalanceCheck: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastStatementDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Notes and metadata
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'wallets',
  timestamps: true, // createdAt and updatedAt
  indexes: [
    {
      name: 'wallets_user_id_idx',
      unique: true,
      fields: ['userId']
    },
    {
      name: 'wallets_wallet_number_idx',
      unique: true,
      fields: ['walletNumber']
    },
    {
      name: 'wallets_status_idx',
      fields: ['status']
    },
    {
      name: 'wallets_type_idx',
      fields: ['type']
    }
  ],
  hooks: {
    beforeCreate: (wallet) => {
      // Generate a wallet number if not provided
      if (!wallet.walletNumber) {
        const prefix = 'WAL';
        const timestamp = new Date().getTime().toString().slice(-8);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        wallet.walletNumber = `${prefix}-${timestamp}-${random}`;
      }
      
      // Set daily and monthly transaction reset dates
      const now = new Date();
      
      // Set daily reset to next day at midnight
      const dailyReset = new Date(now);
      dailyReset.setDate(dailyReset.getDate() + 1);
      dailyReset.setHours(0, 0, 0, 0);
      wallet.dailyTransactionReset = dailyReset;
      
      // Set monthly reset to first day of next month
      const monthlyReset = new Date(now);
      monthlyReset.setMonth(monthlyReset.getMonth() + 1);
      monthlyReset.setDate(1);
      monthlyReset.setHours(0, 0, 0, 0);
      wallet.monthlyTransactionReset = monthlyReset;
    }
  }
});

/**
 * Class methods
 */

// Find wallet by user ID
Wallet.findByUserId = async function(userId) {
  return await Wallet.findOne({ where: { userId } });
};

// Find wallet by wallet number
Wallet.findByWalletNumber = async function(walletNumber) {
  return await Wallet.findOne({ where: { walletNumber } });
};

// Create wallet for a new user
Wallet.createForUser = async function(userId, currency = 'GHS') {
  return await Wallet.create({
    userId,
    currency
  });
};

// Get wallets with low balance (for notifications)
Wallet.getLowBalanceWallets = async function(threshold) {
  return await Wallet.findAll({
    where: {
      balance: {
        [sequelize.Op.lt]: threshold
      },
      status: 'active'
    }
  });
};

/**
 * Instance methods
 */

// Credit wallet (add funds)
Wallet.prototype.credit = async function(amount, transactionId = null, description = null) {
  if (amount <= 0) {
    throw new Error('Credit amount must be positive');
  }
  
  // Update balance
  this.balance = sequelize.literal(`balance + ${amount}`);
  
  // Update transaction date
  this.lastTransactionDate = new Date();
  
  // Update daily and monthly totals
  this.checkAndResetTransactionTotals();
  this.dailyTransactionTotal = sequelize.literal(`daily_transaction_total + ${amount}`);
  this.monthlyTransactionTotal = sequelize.literal(`monthly_transaction_total + ${amount}`);
  
  await this.save();
  
  // Refresh the instance to get the updated balance
  const updatedWallet = await Wallet.findByPk(this.id);
  return updatedWallet;
};

// Debit wallet (remove funds)
Wallet.prototype.debit = async function(amount, transactionId = null, description = null) {
  if (amount <= 0) {
    throw new Error('Debit amount must be positive');
  }
  
  if (this.balance < amount) {
    throw new Error('Insufficient funds');
  }
  
  // Update balance
  this.balance = sequelize.literal(`balance - ${amount}`);
  
  // Update transaction date
  this.lastTransactionDate = new Date();
  
  // Update daily and monthly totals
  this.checkAndResetTransactionTotals();
  this.dailyTransactionTotal = sequelize.literal(`daily_transaction_total + ${amount}`);
  this.monthlyTransactionTotal = sequelize.literal(`monthly_transaction_total + ${amount}`);
  
  await this.save();
  
  // Refresh the instance to get the updated balance
  const updatedWallet = await Wallet.findByPk(this.id);
  return updatedWallet;
};

// Hold funds in escrow
Wallet.prototype.holdInEscrow = async function(amount) {
  if (amount <= 0) {
    throw new Error('Escrow amount must be positive');
  }
  
  if (this.balance < amount) {
    throw new Error('Insufficient funds for escrow');
  }
  
  // Move funds from balance to escrow
  this.balance = sequelize.literal(`balance - ${amount}`);
  this.escrowAmount = sequelize.literal(`escrow_amount + ${amount}`);
  
  await this.save();
  
  // Refresh the instance to get the updated values
  const updatedWallet = await Wallet.findByPk(this.id);
  return updatedWallet;
};

// Release funds from escrow
Wallet.prototype.releaseFromEscrow = async function(amount, toWalletId = null) {
  if (amount <= 0) {
    throw new Error('Release amount must be positive');
  }
  
  if (this.escrowAmount < amount) {
    throw new Error('Insufficient funds in escrow');
  }
  
  // If releasing to another wallet, create a transaction
  if (toWalletId) {
    const destinationWallet = await Wallet.findByPk(toWalletId);
    if (!destinationWallet) {
      throw new Error('Destination wallet not found');
    }
    
    // Reduce escrow amount
    this.escrowAmount = sequelize.literal(`escrow_amount - ${amount}`);
    await this.save();
    
    // Credit the destination wallet
    await destinationWallet.credit(amount);
  } else {
    // Return to the same wallet
    this.escrowAmount = sequelize.literal(`escrow_amount - ${amount}`);
    this.balance = sequelize.literal(`balance + ${amount}`);
    await this.save();
  }
  
  // Refresh the instance to get the updated values
  const updatedWallet = await Wallet.findByPk(this.id);
  return updatedWallet;
};

// Update wallet status
Wallet.prototype.updateStatus = async function(newStatus) {
  const allowedStatuses = ['active', 'inactive', 'frozen', 'suspended'];
  
  if (!allowedStatuses.includes(newStatus)) {
    throw new Error('Invalid wallet status');
  }
  
  this.status = newStatus;
  return await this.save();
};

// Check and reset transaction totals if needed
Wallet.prototype.checkAndResetTransactionTotals = function() {
  const now = new Date();
  
  // Reset daily total if past reset date
  if (this.dailyTransactionReset && now >= this.dailyTransactionReset) {
    this.dailyTransactionTotal = 0;
    
    // Set next daily reset date
    const dailyReset = new Date(now);
    dailyReset.setDate(dailyReset.getDate() + 1);
    dailyReset.setHours(0, 0, 0, 0);
    this.dailyTransactionReset = dailyReset;
  }
  
  // Reset monthly total if past reset date
  if (this.monthlyTransactionReset && now >= this.monthlyTransactionReset) {
    this.monthlyTransactionTotal = 0;
    
    // Set next monthly reset date
    const monthlyReset = new Date(now);
    monthlyReset.setMonth(monthlyReset.getMonth() + 1);
    monthlyReset.setDate(1);
    monthlyReset.setHours(0, 0, 0, 0);
    this.monthlyTransactionReset = monthlyReset;
  }
};

// Check if transaction within limits
Wallet.prototype.isWithinLimits = function(amount, type) {
  // Check daily limit
  if (this.dailyLimit && (this.dailyTransactionTotal + amount) > this.dailyLimit) {
    return {
      allowed: false,
      reason: 'Daily transaction limit would be exceeded'
    };
  }
  
  // Check monthly limit
  if (this.monthlyLimit && (this.monthlyTransactionTotal + amount) > this.monthlyLimit) {
    return {
      allowed: false,
      reason: 'Monthly transaction limit would be exceeded'
    };
  }
  
  // Check withdrawal limit for withdrawal transactions
  if (type === 'withdrawal' && this.withdrawalLimit && amount > this.withdrawalLimit) {
    return {
      allowed: false,
      reason: 'Withdrawal amount exceeds the withdrawal limit'
    };
  }
  
  // Check if balance would go below minimum for debits
  if ((type === 'debit' || type === 'withdrawal') && (this.balance - amount) < this.minimumBalance) {
    return {
      allowed: false,
      reason: 'Transaction would put balance below minimum required balance'
    };
  }
  
  return {
    allowed: true
  };
};

module.exports = Wallet; 