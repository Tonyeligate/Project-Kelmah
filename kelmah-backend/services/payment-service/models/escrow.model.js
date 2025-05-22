/**
 * Escrow Model
 * Defines the structure and behavior of escrow payments in the Kelmah platform
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Escrow = sequelize.define('Escrow', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // Escrow reference number
  escrowNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Unique identifier for this escrow'
  },
  // Associated users
  hirerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'User who is funding the escrow (hirer)'
  },
  workerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'User who will receive the funds (worker)'
  },
  // Associated job and contract
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
  // Payment details
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0.01],
        msg: 'Escrow amount must be greater than 0'
      }
    }
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'GHS', // Ghanaian Cedi
    allowNull: false
  },
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
  totalCharged: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    comment: 'Total amount charged including fees'
  },
  // Escrow status
  status: {
    type: DataTypes.ENUM(
      'pending',    // Escrow created but not funded
      'funded',     // Funds have been secured in escrow
      'released',   // Funds released to worker
      'partial_release', // Part of the funds released
      'refunded',   // Funds returned to hirer
      'disputed',   // Funds in dispute
      'cancelled',  // Escrow cancelled before funding
      'expired'     // Escrow expired without funding
    ),
    defaultValue: 'pending',
    allowNull: false
  },
  // Milestone tracking
  milestones: {
    type: DataTypes.JSON, // Array of milestone objects with status
    defaultValue: [],
    comment: 'Milestones associated with this escrow'
  },
  // Release details
  releasedAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    allowNull: false,
    comment: 'Total amount released so far'
  },
  remainingAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    comment: 'Amount still held in escrow'
  },
  // Transaction references
  fundingTransactionId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Transactions',
      key: 'id'
    },
    comment: 'Transaction for funding the escrow'
  },
  releaseTransactions: {
    type: DataTypes.JSON, // Array of transaction IDs for releases
    defaultValue: [],
    comment: 'Transactions for releasing funds'
  },
  refundTransactionId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Transactions',
      key: 'id'
    },
    comment: 'Transaction for refunding the escrow'
  },
  // Timing information
  fundedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the escrow was funded'
  },
  lastReleaseAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When funds were last released'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the escrow was fully released or refunded'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the escrow expires if not funded'
  },
  // Dispute information
  disputeId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Disputes',
      key: 'id'
    },
    comment: 'Related dispute if status is disputed'
  },
  disputeReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  disputeOpenedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  disputeResolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Conditions for auto-release
  autoReleaseDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date when funds will be auto-released if no dispute'
  },
  autoReleaseConditions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Conditions that trigger auto-release'
  },
  // Notes and comments
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Internal notes about this escrow'
  },
  hirerNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes from the hirer'
  },
  workerNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes from the worker'
  },
  // Notification preferences
  notifyHirer: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether to notify the hirer of status changes'
  },
  notifyWorker: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether to notify the worker of status changes'
  },
  // Admin actions
  adminActions: {
    type: DataTypes.JSON, // Array of admin actions with timestamps and reasons
    defaultValue: [],
    comment: 'Record of admin actions taken on this escrow'
  },
  // Metadata
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional data for this escrow'
  }
}, {
  tableName: 'escrows',
  timestamps: true, // createdAt and updatedAt
  paranoid: true, // Soft deletes (deletedAt)
  indexes: [
    {
      name: 'escrows_escrow_number_idx',
      unique: true,
      fields: ['escrowNumber']
    },
    {
      name: 'escrows_hirer_id_idx',
      fields: ['hirerId']
    },
    {
      name: 'escrows_worker_id_idx',
      fields: ['workerId']
    },
    {
      name: 'escrows_job_id_idx',
      fields: ['jobId']
    },
    {
      name: 'escrows_contract_id_idx',
      fields: ['contractId']
    },
    {
      name: 'escrows_status_idx',
      fields: ['status']
    },
    {
      name: 'escrows_created_at_idx',
      fields: ['createdAt']
    }
  ],
  hooks: {
    beforeCreate: (escrow) => {
      // Generate a unique escrow number if not provided
      if (!escrow.escrowNumber) {
        const prefix = 'ESC';
        const timestamp = new Date().getTime().toString().slice(-8);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        escrow.escrowNumber = `${prefix}-${timestamp}-${random}`;
      }
      
      // Set initial remaining amount
      escrow.remainingAmount = escrow.amount;
      
      // Set default expiration date (7 days from creation)
      if (!escrow.expiresAt) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        escrow.expiresAt = expiryDate;
      }
    }
  }
});

/**
 * Class methods
 */

// Find escrow by escrow number
Escrow.findByEscrowNumber = async function(escrowNumber) {
  return await Escrow.findOne({
    where: { escrowNumber }
  });
};

// Find escrows by hirer ID
Escrow.findByHirerId = async function(hirerId, limit = 20, offset = 0) {
  return await Escrow.findAll({
    where: { hirerId },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

// Find escrows by worker ID
Escrow.findByWorkerId = async function(workerId, limit = 20, offset = 0) {
  return await Escrow.findAll({
    where: { workerId },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

// Find escrows by job ID
Escrow.findByJobId = async function(jobId) {
  return await Escrow.findAll({
    where: { jobId },
    order: [['createdAt', 'DESC']]
  });
};

// Find escrows by contract ID
Escrow.findByContractId = async function(contractId) {
  return await Escrow.findOne({
    where: { contractId }
  });
};

// Find escrows by status
Escrow.findByStatus = async function(status, limit = 20, offset = 0) {
  return await Escrow.findAll({
    where: { status },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

// Calculate platform fees
Escrow.calculateFees = async function(amount, currency = 'GHS') {
  // This would typically involve looking up fee schedules from a database
  // Simplified example:
  const platformFeePercentage = 0.05; // 5%
  const processingFeePercentage = 0.015; // 1.5%
  const taxPercentage = 0.03; // 3% (example VAT)
  
  const platformFee = parseFloat((amount * platformFeePercentage).toFixed(2));
  const processingFee = parseFloat((amount * processingFeePercentage).toFixed(2));
  const tax = parseFloat((amount * taxPercentage).toFixed(2));
  
  const totalCharged = parseFloat((amount + platformFee + processingFee + tax).toFixed(2));
  
  return { 
    amount,
    currency,
    platformFee,
    processingFee,
    tax,
    totalCharged
  };
};

// Find expired pending escrows
Escrow.findExpiredPending = async function() {
  const now = new Date();
  return await Escrow.findAll({
    where: {
      status: 'pending',
      expiresAt: { [sequelize.Op.lt]: now }
    }
  });
};

// Check escrows for auto-release
Escrow.checkAutoReleaseDue = async function() {
  const now = new Date();
  return await Escrow.findAll({
    where: {
      status: 'funded',
      autoReleaseDate: { [sequelize.Op.lt]: now }
    }
  });
};

/**
 * Instance methods
 */

// Fund the escrow
Escrow.prototype.fund = async function(transactionId) {
  if (this.status !== 'pending') {
    throw new Error(`Cannot fund escrow in ${this.status} status`);
  }
  
  this.status = 'funded';
  this.fundingTransactionId = transactionId;
  this.fundedAt = new Date();
  
  // Set auto-release date if not already set (default to 14 days)
  if (!this.autoReleaseDate) {
    const releaseDate = new Date();
    releaseDate.setDate(releaseDate.getDate() + 14);
    this.autoReleaseDate = releaseDate;
  }
  
  return await this.save();
};

// Release funds (full or partial)
Escrow.prototype.releaseFunds = async function(amount, transactionId, releaseBy = null, notes = null) {
  if (this.status !== 'funded' && this.status !== 'partial_release') {
    throw new Error(`Cannot release funds from escrow in ${this.status} status`);
  }
  
  if (amount <= 0) {
    throw new Error('Release amount must be greater than 0');
  }
  
  if (amount > this.remainingAmount) {
    throw new Error('Release amount cannot exceed remaining escrow amount');
  }
  
  // Update release transaction records
  if (!this.releaseTransactions) {
    this.releaseTransactions = [];
  }
  
  this.releaseTransactions.push({
    transactionId,
    amount,
    releaseDate: new Date(),
    releasedBy: releaseBy,
    notes
  });
  
  // Update amounts
  this.releasedAmount = parseFloat((this.releasedAmount + amount).toFixed(2));
  this.remainingAmount = parseFloat((this.remainingAmount - amount).toFixed(2));
  this.lastReleaseAt = new Date();
  
  // Update status
  if (this.remainingAmount === 0) {
    this.status = 'released';
    this.completedAt = new Date();
  } else {
    this.status = 'partial_release';
  }
  
  return await this.save();
};

// Release all remaining funds
Escrow.prototype.releaseAllFunds = async function(transactionId, releaseBy = null, notes = null) {
  return await this.releaseFunds(this.remainingAmount, transactionId, releaseBy, notes);
};

// Refund the escrow
Escrow.prototype.refund = async function(transactionId, refundedBy = null, reason = null) {
  if (this.status !== 'funded' && this.status !== 'partial_release' && this.status !== 'disputed') {
    throw new Error(`Cannot refund escrow in ${this.status} status`);
  }
  
  this.status = 'refunded';
  this.refundTransactionId = transactionId;
  this.completedAt = new Date();
  
  if (reason) {
    this.notes = this.notes ? `${this.notes}\n\nRefund reason: ${reason}` : `Refund reason: ${reason}`;
  }
  
  // Add admin action if refunded by admin
  if (refundedBy) {
    if (!this.adminActions) {
      this.adminActions = [];
    }
    
    this.adminActions.push({
      action: 'refund',
      performedBy: refundedBy,
      timestamp: new Date(),
      reason
    });
  }
  
  return await this.save();
};

// Open a dispute
Escrow.prototype.openDispute = async function(disputeId, initiatedBy, reason) {
  if (this.status !== 'funded' && this.status !== 'partial_release') {
    throw new Error(`Cannot open dispute for escrow in ${this.status} status`);
  }
  
  this.status = 'disputed';
  this.disputeId = disputeId;
  this.disputeReason = reason;
  this.disputeOpenedAt = new Date();
  
  // Add metadata for the dispute
  if (!this.metadata) {
    this.metadata = {};
  }
  
  this.metadata.dispute = {
    ...this.metadata.dispute,
    initiatedBy,
    reason,
    openedAt: new Date()
  };
  
  return await this.save();
};

// Resolve a dispute
Escrow.prototype.resolveDispute = async function(resolution, resolvedBy, notes = null) {
  if (this.status !== 'disputed') {
    throw new Error('Can only resolve disputes for escrows in disputed status');
  }
  
  // Update metadata
  if (!this.metadata) {
    this.metadata = {};
  }
  
  if (!this.metadata.dispute) {
    this.metadata.dispute = {};
  }
  
  this.metadata.dispute.resolution = resolution;
  this.metadata.dispute.resolvedBy = resolvedBy;
  this.metadata.dispute.resolutionNotes = notes;
  this.metadata.dispute.resolvedAt = new Date();
  
  this.disputeResolvedAt = new Date();
  
  // Based on resolution, update status
  switch (resolution.outcome) {
    case 'release_to_worker':
      this.status = 'funded'; // Reset to funded so it can be released
      break;
    case 'refund_to_hirer':
      this.status = 'funded'; // Reset to funded so it can be refunded
      break;
    case 'split':
      this.status = 'funded'; // Reset to funded for partial releases
      break;
    default:
      throw new Error('Invalid dispute resolution outcome');
  }
  
  return await this.save();
};

// Cancel the escrow
Escrow.prototype.cancel = async function(cancelledBy = null, reason = null) {
  if (this.status !== 'pending') {
    throw new Error('Can only cancel escrows in pending status');
  }
  
  this.status = 'cancelled';
  
  if (reason) {
    this.notes = this.notes ? `${this.notes}\n\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`;
  }
  
  // Add admin action if cancelled by admin
  if (cancelledBy) {
    if (!this.adminActions) {
      this.adminActions = [];
    }
    
    this.adminActions.push({
      action: 'cancel',
      performedBy: cancelledBy,
      timestamp: new Date(),
      reason
    });
  }
  
  return await this.save();
};

// Mark the escrow as expired
Escrow.prototype.markAsExpired = async function() {
  if (this.status !== 'pending') {
    throw new Error('Can only expire escrows in pending status');
  }
  
  this.status = 'expired';
  return await this.save();
};

// Add or update milestones
Escrow.prototype.updateMilestones = async function(milestones) {
  this.milestones = milestones;
  return await this.save();
};

// Update milestone status
Escrow.prototype.updateMilestoneStatus = async function(milestoneId, status, updatedBy, notes = null) {
  if (!this.milestones || !Array.isArray(this.milestones)) {
    throw new Error('No milestones found for this escrow');
  }
  
  const milestoneIndex = this.milestones.findIndex(m => m.id === milestoneId);
  
  if (milestoneIndex === -1) {
    throw new Error('Milestone not found');
  }
  
  this.milestones[milestoneIndex] = {
    ...this.milestones[milestoneIndex],
    status,
    updatedAt: new Date(),
    updatedBy,
    notes: notes ? (this.milestones[milestoneIndex].notes ? `${this.milestones[milestoneIndex].notes}\n\n${notes}` : notes) : this.milestones[milestoneIndex].notes
  };
  
  return await this.save();
};

module.exports = Escrow; 