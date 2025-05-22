/**
 * Payment Model
 * Defines the structure and behavior of payments in the Kelmah platform
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // Payment reference number
  paymentNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Unique identifier for this payment'
  },
  // Associated users
  payerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'User who is making the payment'
  },
  recipientId: {
    type: DataTypes.UUID,
    allowNull: true, // May be null for platform fees or subscription payments
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'User who will receive the payment (if applicable)'
  },
  // Payment details
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0.01],
        msg: 'Payment amount must be greater than 0'
      }
    }
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'GHS', // Ghanaian Cedi
    allowNull: false
  },
  // Fees
  platformFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Fee charged by the platform'
  },
  processingFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Fee charged by payment processor'
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Tax amount if applicable'
  },
  // Total amount
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    comment: 'Total amount including fees and taxes'
  },
  // Payment method details
  paymentMethodId: {
    type: DataTypes.UUID,
    allowNull: true, // Can be null for cash payments
    references: {
      model: 'PaymentMethods',
      key: 'id'
    },
    comment: 'Payment method used for this payment'
  },
  paymentProviderTransactionId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Transaction ID from payment provider (e.g., PayPal, Stripe)'
  },
  // Payment provider details
  providerName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Name of the payment provider (mobile_money, paystack, flutterwave)'
  },
  providerReference: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Reference ID from the payment provider'
  },
  providerResponse: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON response from the payment provider'
  },
  // Payment type and status
  type: {
    type: DataTypes.ENUM(
      'deposit',        // Adding funds to wallet
      'withdrawal',     // Withdrawing funds from wallet
      'escrow_funding', // Funding an escrow account
      'escrow_release', // Releasing funds from escrow
      'refund',         // Refunding a payment
      'subscription',   // Subscription payment
      'service_fee',    // Fee for a service
      'direct_payment', // Direct payment to another user
      'platform_fee'    // Fee payment to platform
    ),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(
      'pending',      // Payment initiated but not completed
      'processing',   // Payment is being processed
      'completed',    // Payment completed successfully
      'failed',       // Payment failed
      'cancelled',    // Payment cancelled before processing
      'refunded',     // Payment was refunded
      'partial_refund' // Payment was partially refunded
    ),
    defaultValue: 'pending',
    allowNull: false
  },
  // Timing
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the payment is due (if applicable)'
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the payment was processed'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the payment was completed'
  },
  // Related entities
  escrowId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Escrows',
      key: 'id'
    },
    comment: 'Associated escrow if this is an escrow payment'
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Jobs',
      key: 'id'
    },
    comment: 'Associated job if this is a job payment'
  },
  contractId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Contracts',
      key: 'id'
    },
    comment: 'Associated contract if this is a contract payment'
  },
  // Transaction references
  transactionId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Transactions',
      key: 'id'
    },
    comment: 'Associated transaction record'
  },
  // Metadata
  metadata: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional metadata for the payment (JSON string)'
  },
  // Refund details
  refundedAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Amount refunded (if any)'
  },
  refundTransactionId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Transactions',
      key: 'id'
    },
    comment: 'Transaction for the refund (if any)'
  },
  refundReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for the refund'
  },
  refundedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the refund was processed'
  },
  // Payment details
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description of what this payment is for'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Internal notes about this payment'
  },
  receiptUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL to the payment receipt'
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Associated invoice number if any'
  },
  // Failure details
  errorCode: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Error code if payment failed'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error message if payment failed'
  },
  // Recurring payment details
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this is a recurring payment'
  },
  recurringScheduleId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID of the recurring schedule this payment belongs to'
  },
  // For subscriptions
  subscriptionId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Subscriptions',
      key: 'id'
    },
    comment: 'Associated subscription if this is a subscription payment'
  },
  // Admin actions
  adminActionedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'Admin who performed an action on this payment'
  },
  adminActionedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When an admin performed an action on this payment'
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes from admin about this payment'
  },
  // Payment provider data
  providerData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Raw data from the payment provider'
  }
}, {
  tableName: 'payments',
  timestamps: true, // createdAt and updatedAt
  paranoid: true, // Soft deletes (deletedAt)
  indexes: [
    {
      name: 'payments_payment_number_idx',
      unique: true,
      fields: ['paymentNumber']
    },
    {
      name: 'payments_payer_id_idx',
      fields: ['payerId']
    },
    {
      name: 'payments_recipient_id_idx',
      fields: ['recipientId']
    },
    {
      name: 'payments_escrow_id_idx',
      fields: ['escrowId']
    },
    {
      name: 'payments_job_id_idx',
      fields: ['jobId']
    },
    {
      name: 'payments_contract_id_idx',
      fields: ['contractId']
    },
    {
      name: 'payments_status_idx',
      fields: ['status']
    },
    {
      name: 'payments_type_idx',
      fields: ['type']
    },
    {
      name: 'payments_created_at_idx',
      fields: ['createdAt']
    }
  ],
  hooks: {
    beforeCreate: (payment) => {
      // Generate a unique payment number if not provided
      if (!payment.paymentNumber) {
        const prefix = 'PMT';
        const timestamp = new Date().getTime().toString().slice(-8);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        payment.paymentNumber = `${prefix}-${timestamp}-${random}`;
      }
      
      // Calculate the total amount if not provided
      if (!payment.totalAmount) {
        payment.totalAmount = parseFloat((
          parseFloat(payment.amount) + 
          parseFloat(payment.platformFee) + 
          parseFloat(payment.processingFee) + 
          parseFloat(payment.tax)
        ).toFixed(2));
      }
    }
  }
});

/**
 * Class methods
 */

// Find payment by payment number
Payment.findByPaymentNumber = async function(paymentNumber) {
  return await Payment.findOne({
    where: { paymentNumber }
  });
};

// Find payments by payer ID
Payment.findByPayerId = async function(payerId, options = {}) {
  const { limit = 20, offset = 0, status, type } = options;
  
  const where = { payerId };
  
  if (status) {
    where.status = status;
  }
  
  if (type) {
    where.type = type;
  }
  
  return await Payment.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

// Find payments by recipient ID
Payment.findByRecipientId = async function(recipientId, options = {}) {
  const { limit = 20, offset = 0, status, type } = options;
  
  const where = { recipientId };
  
  if (status) {
    where.status = status;
  }
  
  if (type) {
    where.type = type;
  }
  
  return await Payment.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

// Find payments by escrow ID
Payment.findByEscrowId = async function(escrowId) {
  return await Payment.findAll({
    where: { escrowId },
    order: [['createdAt', 'DESC']]
  });
};

// Find payments by job ID
Payment.findByJobId = async function(jobId) {
  return await Payment.findAll({
    where: { jobId },
    order: [['createdAt', 'DESC']]
  });
};

// Find payments by contract ID
Payment.findByContractId = async function(contractId) {
  return await Payment.findAll({
    where: { contractId },
    order: [['createdAt', 'DESC']]
  });
};

// Find payments by status
Payment.findByStatus = async function(status, limit = 20, offset = 0) {
  return await Payment.findAll({
    where: { status },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

// Calculate platform fees
Payment.calculateFees = async function(amount, options = {}) {
  const { currency = 'GHS', paymentType = 'direct_payment' } = options;
  
  // This would typically involve looking up fee schedules from a database
  // Simplified example with different rates for different payment types
  let platformFeePercentage = 0.05; // 5% default
  let processingFeePercentage = 0.015; // 1.5% default
  let taxPercentage = 0.03; // 3% default
  
  // Adjust fees based on payment type
  switch (paymentType) {
    case 'escrow_funding':
      platformFeePercentage = 0.06; // 6%
      break;
    case 'withdrawal':
      platformFeePercentage = 0.03; // 3%
      processingFeePercentage = 0.01; // 1%
      break;
    case 'subscription':
      platformFeePercentage = 0.04; // 4%
      break;
    // Other types use the default
  }
  
  const platformFee = parseFloat((amount * platformFeePercentage).toFixed(2));
  const processingFee = parseFloat((amount * processingFeePercentage).toFixed(2));
  const tax = parseFloat((amount * taxPercentage).toFixed(2));
  
  const totalAmount = parseFloat((amount + platformFee + processingFee + tax).toFixed(2));
  
  return { 
    amount,
    currency,
    platformFee,
    processingFee,
    tax,
    totalAmount
  };
};

// Generate receipt
Payment.generateReceipt = async function(paymentId) {
  // This would typically involve generating a PDF or HTML receipt
  // Simplified example
  const payment = await Payment.findByPk(paymentId);
  
  if (!payment) {
    throw new Error('Payment not found');
  }
  
  // Just returning a placeholder URL - in a real system, this would create and store a receipt
  const receiptUrl = `https://api.kelmah.com/receipts/${payment.paymentNumber}.pdf`;
  
  payment.receiptUrl = receiptUrl;
  await payment.save();
  
  return receiptUrl;
};

// Find pending payments that are past due
Payment.findOverduePayments = async function() {
  const now = new Date();
  return await Payment.findAll({
    where: {
      status: 'pending',
      dueDate: {
        [sequelize.Op.lt]: now
      }
    }
  });
};

/**
 * Find a payment by provider reference
 */
Payment.findByProviderReference = async function(reference, provider) {
  return await Payment.findOne({
    where: {
      providerReference: reference,
      providerName: provider
    }
  });
};

/**
 * Instance methods
 */

// Process payment
Payment.prototype.process = async function() {
  if (this.status !== 'pending') {
    throw new Error(`Cannot process payment in ${this.status} status`);
  }
  
  this.status = 'processing';
  this.processedAt = new Date();
  
  return await this.save();
};

// Complete payment
Payment.prototype.complete = async function(transactionId, providerTransactionId = null) {
  if (this.status !== 'processing' && this.status !== 'pending') {
    throw new Error(`Cannot complete payment in ${this.status} status`);
  }
  
  this.status = 'completed';
  this.completedAt = new Date();
  this.transactionId = transactionId;
  
  if (providerTransactionId) {
    this.paymentProviderTransactionId = providerTransactionId;
  }
  
  return await this.save();
};

// Mark payment as failed
Payment.prototype.markAsFailed = async function(errorCode, errorMessage) {
  if (this.status !== 'processing' && this.status !== 'pending') {
    throw new Error(`Cannot mark payment as failed in ${this.status} status`);
  }
  
  this.status = 'failed';
  this.errorCode = errorCode;
  this.errorMessage = errorMessage;
  
  return await this.save();
};

// Cancel payment
Payment.prototype.cancel = async function(reason) {
  if (this.status !== 'pending' && this.status !== 'processing') {
    throw new Error(`Cannot cancel payment in ${this.status} status`);
  }
  
  this.status = 'cancelled';
  this.notes = this.notes ? `${this.notes}\n\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`;
  
  return await this.save();
};

// Refund payment (full or partial)
Payment.prototype.refund = async function(amount, transactionId, reason = null) {
  if (this.status !== 'completed') {
    throw new Error('Can only refund completed payments');
  }
  
  if (amount <= 0) {
    throw new Error('Refund amount must be greater than 0');
  }
  
  if (amount > this.amount) {
    throw new Error('Refund amount cannot exceed payment amount');
  }
  
  this.refundedAmount = amount;
  this.refundTransactionId = transactionId;
  this.refundReason = reason;
  this.refundedAt = new Date();
  
  // Update status
  if (parseFloat(amount) === parseFloat(this.amount)) {
    this.status = 'refunded';
  } else {
    this.status = 'partial_refund';
  }
  
  return await this.save();
};

// Add admin action
Payment.prototype.addAdminAction = async function(adminId, notes) {
  this.adminActionedBy = adminId;
  this.adminActionedAt = new Date();
  this.adminNotes = notes;
  
  return await this.save();
};

// Update payment metadata
Payment.prototype.updateMetadata = async function(metadata) {
  this.metadata = { ...this.metadata, ...metadata };
  return await this.save();
};

// Link to escrow
Payment.prototype.linkToEscrow = async function(escrowId) {
  this.escrowId = escrowId;
  return await this.save();
};

// Link to job
Payment.prototype.linkToJob = async function(jobId) {
  this.jobId = jobId;
  return await this.save();
};

// Link to contract
Payment.prototype.linkToContract = async function(contractId) {
  this.contractId = contractId;
  return await this.save();
};

// Update provider data
Payment.prototype.updateProviderData = async function(providerData) {
  this.providerData = providerData;
  return await this.save();
};

module.exports = Payment; 