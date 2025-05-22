/**
 * Subscription Model
 * Defines the structure and behavior of subscriptions in the Kelmah platform
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // Reference number
  subscriptionNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Unique identifier for this subscription'
  },
  // Associated user
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'User who owns this subscription'
  },
  // Plan details
  planId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Plans',
      key: 'id'
    },
    comment: 'The plan this subscription is for'
  },
  planName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Name of the plan (cached here to preserve history)'
  },
  planType: {
    type: DataTypes.ENUM(
      'freelancer',   // Plans for freelancers
      'hirer',        // Plans for job hirers
      'business',     // Plans for businesses
      'enterprise'    // Enterprise level plans
    ),
    allowNull: false,
    comment: 'Type of plan'
  },
  // Pricing details
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Subscription amount must be non-negative'
      }
    },
    comment: 'Regular amount charged for this subscription'
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'GHS', // Ghanaian Cedi
    allowNull: false
  },
  billingCycle: {
    type: DataTypes.ENUM(
      'monthly',      // Billed monthly
      'quarterly',    // Billed every 3 months
      'semi_annual',  // Billed every 6 months
      'annual',       // Billed yearly
      'one_time'      // One-time payment
    ),
    defaultValue: 'monthly',
    allowNull: false
  },
  // Discount information
  discountPercentage: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'Discount percentage must be non-negative'
      },
      max: {
        args: [100],
        msg: 'Discount percentage cannot exceed 100%'
      }
    },
    comment: 'Percentage discount applied to this subscription'
  },
  discountReason: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Reason for the discount'
  },
  discountExpiryDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the discount expires'
  },
  // Subscription status
  status: {
    type: DataTypes.ENUM(
      'active',        // Subscription is active
      'inactive',      // Subscription is inactive (not canceled, but benefits not applied)
      'trialing',      // In trial period
      'past_due',      // Payment is past due
      'unpaid',        // Multiple failed payments
      'canceled',      // Subscription has been canceled
      'expired',       // Subscription has expired
      'pending'        // Pending activation
    ),
    defaultValue: 'pending',
    allowNull: false
  },
  // Timing
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the subscription starts'
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the subscription ends or renews'
  },
  canceledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the subscription was canceled'
  },
  // Trial information
  trialStartDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the trial period starts'
  },
  trialEndDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the trial period ends'
  },
  hasTrialPeriod: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this subscription has a trial period'
  },
  // Billing information
  nextBillingDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date of the next billing'
  },
  lastBillingDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date of the last billing'
  },
  billingDay: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: {
        args: [1],
        msg: 'Billing day must be between 1 and 31'
      },
      max: {
        args: [31],
        msg: 'Billing day must be between 1 and 31'
      }
    },
    comment: 'Day of the month when billing occurs'
  },
  // Payment tracking
  currentPeriodStart: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Start of the current billing period'
  },
  currentPeriodEnd: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'End of the current billing period'
  },
  // Payment method
  paymentMethodId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'PaymentMethods',
      key: 'id'
    },
    comment: 'Payment method used for this subscription'
  },
  autoRenew: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether the subscription auto-renews'
  },
  // Failed payment handling
  gracePeriodEndDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the grace period ends after a failed payment'
  },
  failedPaymentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Number of consecutive failed payments'
  },
  // Subscription features
  features: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Features included in this subscription (cached from plan)'
  },
  // Subscription limits
  limits: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Usage limits for this subscription (cached from plan)'
  },
  // Usage tracking
  usage: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Current usage statistics for this billing period'
  },
  // Cancellation information
  cancellationReason: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Reason for cancellation'
  },
  cancellationFeedback: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Feedback provided during cancellation'
  },
  // Payment history
  paymentHistory: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of payment IDs and dates'
  },
  // Notification preferences
  notifyBeforeRenewal: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether to notify the user before renewal'
  },
  notifyOnPaymentFailure: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether to notify the user on payment failure'
  },
  // Admin actions
  adminActions: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Record of admin actions taken on this subscription'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Internal notes about this subscription'
  },
  // For integrations with external subscription services
  externalSubscriptionId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID in the external subscription system (e.g., Stripe, PayPal)'
  },
  // Metadata
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional data for this subscription'
  }
}, {
  tableName: 'subscriptions',
  timestamps: true, // createdAt and updatedAt
  paranoid: true, // Soft deletes (deletedAt)
  indexes: [
    {
      name: 'subscriptions_subscription_number_idx',
      unique: true,
      fields: ['subscriptionNumber']
    },
    {
      name: 'subscriptions_user_id_idx',
      fields: ['userId']
    },
    {
      name: 'subscriptions_plan_id_idx',
      fields: ['planId']
    },
    {
      name: 'subscriptions_status_idx',
      fields: ['status']
    },
    {
      name: 'subscriptions_next_billing_date_idx',
      fields: ['nextBillingDate']
    },
    {
      name: 'subscriptions_created_at_idx',
      fields: ['createdAt']
    }
  ],
  hooks: {
    beforeCreate: (subscription) => {
      // Generate a unique subscription number if not provided
      if (!subscription.subscriptionNumber) {
        const prefix = 'SUB';
        const timestamp = new Date().getTime().toString().slice(-8);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        subscription.subscriptionNumber = `${prefix}-${timestamp}-${random}`;
      }
      
      // Set billing day if not provided
      if (!subscription.billingDay && subscription.startDate) {
        subscription.billingDay = new Date(subscription.startDate).getDate();
      }
    }
  }
});

/**
 * Class methods
 */

// Find subscription by subscription number
Subscription.findBySubscriptionNumber = async function(subscriptionNumber) {
  return await Subscription.findOne({
    where: { subscriptionNumber }
  });
};

// Find subscriptions by user ID
Subscription.findByUserId = async function(userId, options = {}) {
  const { status, limit = 20, offset = 0 } = options;
  
  const where = { userId };
  
  if (status) {
    where.status = status;
  }
  
  return await Subscription.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

// Find active subscription for a user
Subscription.findActiveForUser = async function(userId) {
  return await Subscription.findOne({
    where: {
      userId,
      status: {
        [sequelize.Op.in]: ['active', 'trialing']
      }
    },
    order: [['createdAt', 'DESC']]
  });
};

// Find subscriptions by plan ID
Subscription.findByPlanId = async function(planId, options = {}) {
  const { status, limit = 20, offset = 0 } = options;
  
  const where = { planId };
  
  if (status) {
    where.status = status;
  }
  
  return await Subscription.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

// Find subscriptions by status
Subscription.findByStatus = async function(status, limit = 20, offset = 0) {
  return await Subscription.findAll({
    where: { status },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

// Find subscriptions due for renewal
Subscription.findDueForRenewal = async function(daysAhead = 3) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + daysAhead);
  
  return await Subscription.findAll({
    where: {
      status: 'active',
      autoRenew: true,
      nextBillingDate: {
        [sequelize.Op.between]: [now, futureDate]
      }
    },
    order: [['nextBillingDate', 'ASC']]
  });
};

// Find subscriptions that have ended their trial
Subscription.findTrialEnding = async function(daysAhead = 3) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + daysAhead);
  
  return await Subscription.findAll({
    where: {
      status: 'trialing',
      trialEndDate: {
        [sequelize.Op.between]: [now, futureDate]
      }
    },
    order: [['trialEndDate', 'ASC']]
  });
};

// Find expired trials that haven't converted
Subscription.findExpiredTrials = async function() {
  const now = new Date();
  
  return await Subscription.findAll({
    where: {
      status: 'trialing',
      trialEndDate: {
        [sequelize.Op.lt]: now
      }
    }
  });
};

// Find subscriptions with failed payments
Subscription.findWithFailedPayments = async function() {
  return await Subscription.findAll({
    where: {
      status: {
        [sequelize.Op.in]: ['past_due', 'unpaid']
      }
    },
    order: [['failedPaymentCount', 'DESC']]
  });
};

// Calculate renewal date based on billing cycle
Subscription.calculateRenewalDate = function(startDate, billingCycle) {
  const date = new Date(startDate);
  
  switch (billingCycle) {
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'semi_annual':
      date.setMonth(date.getMonth() + 6);
      break;
    case 'annual':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case 'one_time':
      // For one-time, set a far future date
      date.setFullYear(date.getFullYear() + 100);
      break;
    default:
      throw new Error(`Invalid billing cycle: ${billingCycle}`);
  }
  
  return date;
};

/**
 * Instance methods
 */

// Activate the subscription
Subscription.prototype.activate = async function(startDate = new Date()) {
  if (this.status === 'active') {
    throw new Error('Subscription is already active');
  }
  
  // Use provided start date or now
  this.startDate = startDate;
  this.status = 'active';
  
  // Set up the billing cycle
  this.currentPeriodStart = startDate;
  
  // Calculate the end of the current period based on billing cycle
  this.currentPeriodEnd = Subscription.calculateRenewalDate(startDate, this.billingCycle);
  
  // Set next billing date
  this.nextBillingDate = this.currentPeriodEnd;
  
  // Reset usage stats for new period
  this.usage = {};
  
  return await this.save();
};

// Start trial
Subscription.prototype.startTrial = async function(trialDays = 14) {
  if (this.status !== 'pending') {
    throw new Error(`Cannot start trial for subscription in ${this.status} status`);
  }
  
  const now = new Date();
  
  this.status = 'trialing';
  this.trialStartDate = now;
  
  // Calculate trial end date
  const trialEndDate = new Date(now);
  trialEndDate.setDate(trialEndDate.getDate() + trialDays);
  this.trialEndDate = trialEndDate;
  
  this.hasTrialPeriod = true;
  
  // Set current period to match trial
  this.currentPeriodStart = now;
  this.currentPeriodEnd = trialEndDate;
  
  // Next billing happens at end of trial
  this.nextBillingDate = trialEndDate;
  
  return await this.save();
};

// Convert trial to active subscription
Subscription.prototype.convertTrial = async function(paymentId = null) {
  if (this.status !== 'trialing') {
    throw new Error('Can only convert subscriptions in trial status');
  }
  
  const now = new Date();
  
  this.status = 'active';
  
  // Set up normal billing cycle starting from trial end
  this.startDate = this.trialEndDate;
  this.currentPeriodStart = this.trialEndDate;
  this.currentPeriodEnd = Subscription.calculateRenewalDate(this.trialEndDate, this.billingCycle);
  this.nextBillingDate = this.currentPeriodEnd;
  
  // Add payment to history if provided
  if (paymentId) {
    if (!this.paymentHistory) {
      this.paymentHistory = [];
    }
    
    this.paymentHistory.push({
      paymentId,
      date: now,
      type: 'trial_conversion'
    });
  }
  
  return await this.save();
};

// Cancel subscription
Subscription.prototype.cancel = async function(cancellationReason = null, feedback = null, cancelImmediately = false) {
  if (this.status === 'canceled' || this.status === 'expired') {
    throw new Error(`Subscription is already ${this.status}`);
  }
  
  const now = new Date();
  this.canceledAt = now;
  this.cancellationReason = cancellationReason;
  this.cancellationFeedback = feedback;
  this.autoRenew = false;
  
  // If canceling immediately, mark as canceled
  if (cancelImmediately) {
    this.status = 'canceled';
    this.endDate = now;
  } else {
    // Otherwise, keep subscription active until the end of the current period
    this.endDate = this.currentPeriodEnd;
  }
  
  return await this.save();
};

// Process renewal
Subscription.prototype.renew = async function(paymentId, nextPeriodEndDate = null) {
  if (this.status !== 'active' && this.status !== 'past_due') {
    throw new Error(`Cannot renew subscription in ${this.status} status`);
  }
  
  const now = new Date();
  
  // Update payment history
  if (!this.paymentHistory) {
    this.paymentHistory = [];
  }
  
  this.paymentHistory.push({
    paymentId,
    date: now,
    type: 'renewal'
  });
  
  // Update billing dates
  this.lastBillingDate = now;
  this.currentPeriodStart = this.nextBillingDate || now;
  
  // Calculate the end of the renewed period based on billing cycle
  if (!nextPeriodEndDate) {
    nextPeriodEndDate = Subscription.calculateRenewalDate(this.currentPeriodStart, this.billingCycle);
  }
  
  this.currentPeriodEnd = nextPeriodEndDate;
  this.nextBillingDate = nextPeriodEndDate;
  
  // Reset any past due status
  if (this.status === 'past_due') {
    this.status = 'active';
  }
  
  // Reset failed payment count
  this.failedPaymentCount = 0;
  this.gracePeriodEndDate = null;
  
  // Reset usage for new period
  this.usage = {};
  
  return await this.save();
};

// Mark payment as failed
Subscription.prototype.markPaymentFailed = async function(failureReason = null, setGracePeriod = true) {
  if (this.status !== 'active' && this.status !== 'past_due') {
    throw new Error(`Cannot mark payment failed for subscription in ${this.status} status`);
  }
  
  // Increment failed payment count
  this.failedPaymentCount += 1;
  
  // Set status based on number of failures
  if (this.failedPaymentCount === 1) {
    this.status = 'past_due';
    
    // Set grace period if requested
    if (setGracePeriod) {
      const gracePeriodEnd = new Date();
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7); // One week grace period
      this.gracePeriodEndDate = gracePeriodEnd;
    }
  } else if (this.failedPaymentCount >= 3) {
    this.status = 'unpaid';
  }
  
  // Store failure reason in metadata
  if (!this.metadata) {
    this.metadata = {};
  }
  
  if (!this.metadata.paymentFailures) {
    this.metadata.paymentFailures = [];
  }
  
  this.metadata.paymentFailures.push({
    date: new Date(),
    reason: failureReason,
    count: this.failedPaymentCount
  });
  
  return await this.save();
};

// Check if subscription is active
Subscription.prototype.isActive = function() {
  return this.status === 'active' || this.status === 'trialing';
};

// Update subscription details
Subscription.prototype.updateDetails = async function(updates) {
  // Only update allowed fields
  const allowedFields = [
    'autoRenew', 
    'notifyBeforeRenewal', 
    'notifyOnPaymentFailure',
    'paymentMethodId',
    'notes'
  ];
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      this[field] = updates[field];
    }
  }
  
  return await this.save();
};

// Change plan
Subscription.prototype.changePlan = async function(newPlanId, newPlanName, newPlanType, newAmount, immediate = false, paymentId = null) {
  const now = new Date();
  const oldPlanId = this.planId;
  
  // Store the plan change in history
  if (!this.metadata) {
    this.metadata = {};
  }
  
  if (!this.metadata.planChanges) {
    this.metadata.planChanges = [];
  }
  
  this.metadata.planChanges.push({
    date: now,
    fromPlanId: oldPlanId,
    toPlanId: newPlanId,
    immediate
  });
  
  // If changing immediately, update everything now
  if (immediate) {
    this.planId = newPlanId;
    this.planName = newPlanName;
    this.planType = newPlanType;
    this.amount = newAmount;
    
    // Reset current period with new plan
    this.currentPeriodStart = now;
    this.currentPeriodEnd = Subscription.calculateRenewalDate(now, this.billingCycle);
    this.nextBillingDate = this.currentPeriodEnd;
    
    // Add payment to history if provided
    if (paymentId) {
      if (!this.paymentHistory) {
        this.paymentHistory = [];
      }
      
      this.paymentHistory.push({
        paymentId,
        date: now,
        type: 'plan_change'
      });
    }
  } else {
    // Otherwise, update will happen at next renewal
    // Just store the info to apply later
    if (!this.metadata.pendingPlanChange) {
      this.metadata.pendingPlanChange = {};
    }
    
    this.metadata.pendingPlanChange = {
      planId: newPlanId,
      planName: newPlanName,
      planType: newPlanType,
      amount: newAmount,
      scheduledFor: this.nextBillingDate
    };
  }
  
  return await this.save();
};

// Apply discount
Subscription.prototype.applyDiscount = async function(discountPercentage, discountReason, discountDurationMonths = 0) {
  if (discountPercentage < 0 || discountPercentage > 100) {
    throw new Error('Discount percentage must be between 0 and 100');
  }
  
  this.discountPercentage = discountPercentage;
  this.discountReason = discountReason;
  
  // Set expiry date if duration provided
  if (discountDurationMonths > 0) {
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + discountDurationMonths);
    this.discountExpiryDate = expiryDate;
  } else {
    // No expiry date means permanent discount
    this.discountExpiryDate = null;
  }
  
  // Record discount in metadata
  if (!this.metadata) {
    this.metadata = {};
  }
  
  if (!this.metadata.discountHistory) {
    this.metadata.discountHistory = [];
  }
  
  this.metadata.discountHistory.push({
    date: new Date(),
    percentage: discountPercentage,
    reason: discountReason,
    durationMonths: discountDurationMonths,
    expiryDate: this.discountExpiryDate
  });
  
  return await this.save();
};

// Update usage stats
Subscription.prototype.updateUsage = async function(feature, increment = 1) {
  if (!this.usage) {
    this.usage = {};
  }
  
  // Initialize feature counter if it doesn't exist
  if (!this.usage[feature]) {
    this.usage[feature] = 0;
  }
  
  // Increment usage counter
  this.usage[feature] += increment;
  
  return await this.save();
};

// Check if a feature is available (based on limits)
Subscription.prototype.hasFeatureAvailable = function(feature) {
  // If no limits defined, assume feature is available
  if (!this.limits || !this.limits[feature]) {
    return true;
  }
  
  // If usage not tracked, initialize it
  if (!this.usage || !this.usage[feature]) {
    return true;
  }
  
  // Check if usage is within limits
  return this.usage[feature] < this.limits[feature];
};

// Add admin action
Subscription.prototype.addAdminAction = async function(action, adminId, notes = null) {
  if (!this.adminActions) {
    this.adminActions = [];
  }
  
  this.adminActions.push({
    action,
    adminId,
    timestamp: new Date(),
    notes
  });
  
  return await this.save();
};

module.exports = Subscription; 