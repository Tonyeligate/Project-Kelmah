/**
 * Transaction Model
 * Defines the structure and behavior of payment transactions in the Kelmah platform
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // Transaction Identification
  transactionNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  externalTransactionId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID from payment processor (e.g. PayStack, Stripe, etc.)'
  },
  
  // User Information
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  
  // Job/Contract Related
  jobId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Jobs',
      key: 'id'
    }
  },
  contractId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Contracts',
      key: 'id'
    }
  },
  escrowId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Escrows',
      key: 'id'
    }
  },
  
  // Transaction Details
  type: {
    type: DataTypes.ENUM(
      'deposit',
      'withdrawal',
      'escrow',
      'release',
      'fee',
      'refund',
      'transfer',
      'subscription',
      'tax'
    ),
    allowNull: false
  },
  subType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Additional categorization (e.g. milestone payment, platform fee)'
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0.01],
        msg: 'Amount must be greater than 0'
      }
    }
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'GHS', // Ghanaian Cedi
    allowNull: false
  },
  fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  exchangeRate: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    comment: 'Exchange rate if currency conversion was involved'
  },
  
  // Status Information
  status: {
    type: DataTypes.ENUM(
      'pending',
      'processing',
      'completed',
      'failed',
      'cancelled',
      'refunded',
      'partially_refunded',
      'disputed'
    ),
    defaultValue: 'pending',
    allowNull: false
  },
  failureReason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Payment Method
  paymentMethod: {
    type: DataTypes.ENUM(
      'credit_card', 
      'debit_card', 
      'bank_transfer', 
      'mobile_money', 
      'wallet',
      'paypal',
      'crypto',
      'other'
    ),
    allowNull: false
  },
  paymentMethodDetails: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional details about the payment method (masked card number, etc.)'
  },
  
  // Payment Processing
  processorName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Payment processor name (e.g. PayStack, Stripe)'
  },
  processorFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
    comment: 'Fee charged by the payment processor'
  },
  
  // Transaction Timestamps
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the transaction was processed by the payment provider'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the transaction was completed'
  },
  
  // Additional Information
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional data about the transaction'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Internal notes about the transaction'
  },
  
  // Receipt
  receiptNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    comment: 'Unique receipt number for the transaction'
  },
  receiptUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL to the transaction receipt'
  },
  
  // For Refunds
  parentTransactionId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Transactions',
      key: 'id'
    },
    comment: 'Reference to the original transaction in case of refunds'
  },
  
  // IP Address and Location
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Disputes
  isDisputed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  disputeId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Disputes',
      key: 'id'
    }
  }
}, {
  tableName: 'transactions',
  timestamps: true, // createdAt and updatedAt
  indexes: [
    {
      name: 'transactions_user_id_idx',
      fields: ['userId']
    },
    {
      name: 'transactions_job_id_idx',
      fields: ['jobId']
    },
    {
      name: 'transactions_contract_id_idx',
      fields: ['contractId']
    },
    {
      name: 'transactions_status_idx',
      fields: ['status']
    },
    {
      name: 'transactions_type_idx',
      fields: ['type']
    },
    {
      name: 'transactions_created_at_idx',
      fields: ['createdAt']
    },
    {
      name: 'transactions_transaction_number_idx',
      unique: true,
      fields: ['transactionNumber']
    },
    {
      name: 'transactions_external_id_idx',
      fields: ['externalTransactionId']
    }
  ],
  hooks: {
    beforeCreate: (transaction) => {
      // Generate a unique transaction number if not provided
      if (!transaction.transactionNumber) {
        const prefix = 'TXN';
        const timestamp = new Date().getTime().toString().slice(-8);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        transaction.transactionNumber = `${prefix}-${timestamp}-${random}`;
      }
      
      // Generate a receipt number if not provided
      if (transaction.status === 'completed' && !transaction.receiptNumber) {
        const prefix = 'RCP';
        const timestamp = new Date().getTime().toString().slice(-8);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        transaction.receiptNumber = `${prefix}-${timestamp}-${random}`;
      }
    }
  }
});

/**
 * Class methods
 */

// Find transactions by user ID
Transaction.findByUserId = async function(userId, limit = 10, offset = 0) {
  return await Transaction.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

// Find transactions by job ID
Transaction.findByJobId = async function(jobId) {
  return await Transaction.findAll({
    where: { jobId },
    order: [['createdAt', 'DESC']]
  });
};

// Find transactions by contract ID
Transaction.findByContractId = async function(contractId) {
  return await Transaction.findAll({
    where: { contractId },
    order: [['createdAt', 'DESC']]
  });
};

// Find transactions by transaction number
Transaction.findByTransactionNumber = async function(transactionNumber) {
  return await Transaction.findOne({
    where: { transactionNumber }
  });
};

// Find transactions by external transaction ID
Transaction.findByExternalId = async function(externalTransactionId) {
  return await Transaction.findOne({
    where: { externalTransactionId }
  });
};

// Get total amount for a user's transactions by type
Transaction.getTotalByType = async function(userId, type) {
  const result = await Transaction.findAll({
    where: {
      userId,
      type,
      status: 'completed'
    },
    attributes: [
      [sequelize.fn('SUM', sequelize.col('amount')), 'total']
    ],
    raw: true
  });
  
  return result[0].total || 0;
};

// Get transaction statistics for a given period
Transaction.getStatistics = async function(startDate, endDate) {
  const results = await Transaction.findAll({
    where: {
      createdAt: {
        [sequelize.Op.between]: [startDate, endDate]
      },
      status: 'completed'
    },
    attributes: [
      'type',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('amount')), 'total']
    ],
    group: ['type'],
    raw: true
  });
  
  return results;
};

/**
 * Instance methods
 */

// Update transaction status
Transaction.prototype.updateStatus = async function(newStatus, reason = null) {
  const allowedStatuses = [
    'pending', 'processing', 'completed', 'failed',
    'cancelled', 'refunded', 'partially_refunded', 'disputed'
  ];
  
  if (!allowedStatuses.includes(newStatus)) {
    throw new Error('Invalid transaction status');
  }
  
  this.status = newStatus;
  
  if (newStatus === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
    
    // Generate receipt number if not already set
    if (!this.receiptNumber) {
      const prefix = 'RCP';
      const timestamp = new Date().getTime().toString().slice(-8);
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      this.receiptNumber = `${prefix}-${timestamp}-${random}`;
    }
  }
  
  if (newStatus === 'failed' && reason) {
    this.failureReason = reason;
  }
  
  return await this.save();
};

// Mark transaction as processed
Transaction.prototype.markAsProcessed = async function() {
  this.status = 'processing';
  this.processedAt = new Date();
  return await this.save();
};

// Create a refund transaction
Transaction.prototype.createRefund = async function(amount, reason = null) {
  if (this.status !== 'completed') {
    throw new Error('Only completed transactions can be refunded');
  }
  
  if (amount > this.amount) {
    throw new Error('Refund amount cannot exceed original transaction amount');
  }
  
  // Update this transaction status
  if (amount === this.amount) {
    this.status = 'refunded';
  } else {
    this.status = 'partially_refunded';
  }
  await this.save();
  
  // Create a refund transaction
  const refundTransaction = await Transaction.create({
    userId: this.userId,
    jobId: this.jobId,
    contractId: this.contractId,
    escrowId: this.escrowId,
    type: 'refund',
    amount: amount,
    currency: this.currency,
    paymentMethod: this.paymentMethod,
    paymentMethodDetails: this.paymentMethodDetails,
    processorName: this.processorName,
    description: `Refund for transaction ${this.transactionNumber}`,
    notes: reason || 'Refund requested',
    parentTransactionId: this.id
  });
  
  return refundTransaction;
};

// Add transaction metadata
Transaction.prototype.addMetadata = async function(metadata) {
  this.metadata = {
    ...this.metadata,
    ...metadata
  };
  return await this.save();
};

// Mark transaction as disputed
Transaction.prototype.markAsDisputed = async function(disputeId) {
  this.isDisputed = true;
  this.disputeId = disputeId;
  this.status = 'disputed';
  return await this.save();
};

module.exports = Transaction; 