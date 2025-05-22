/**
 * Payment Method Model
 * Defines the structure and behavior of payment methods in the Kelmah platform
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const crypto = require('crypto');

const PaymentMethod = sequelize.define('PaymentMethod', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  
  // Method Type & Basic Info
  type: {
    type: DataTypes.ENUM(
      'credit_card',
      'debit_card',
      'bank_account',
      'mobile_money',
      'paypal',
      'crypto_wallet',
      'other'
    ),
    allowNull: false
  },
  subType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Card brand, bank name, mobile money provider, etc.'
  },
  nickname: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'User-defined name for this payment method'
  },
  
  // Status
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'expired', 'deleted'),
    defaultValue: 'active'
  },
  
  // Card Details
  cardNumberLast4: {
    type: DataTypes.STRING(4),
    allowNull: true,
    validate: {
      len: [4, 4]
    }
  },
  cardExpiryMonth: {
    type: DataTypes.STRING(2),
    allowNull: true,
    validate: {
      isNumeric: true,
      len: [1, 2]
    }
  },
  cardExpiryYear: {
    type: DataTypes.STRING(4),
    allowNull: true,
    validate: {
      isNumeric: true,
      len: [2, 4]
    }
  },
  cardHolderName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cardBrand: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cardCountry: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Bank Account Details
  bankName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bankAccountNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bankAccountType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bankRoutingNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bankIBAN: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bankSwiftCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bankBranchCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Mobile Money Details
  mobileNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isValidPhone(value) {
        if (value && !/^(\+\d{1,3})?\d{9,15}$/.test(value)) {
          throw new Error('Invalid phone number format');
        }
      }
    }
  },
  mobileMoneyProvider: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mobileMoneyAccountName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // PayPal Details
  paypalEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  
  // Crypto Wallet Details
  cryptoWalletAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cryptoCurrency: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cryptoNetwork: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // External IDs & Tokens (from payment processors)
  externalId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID from payment processor (e.g. Stripe card ID)'
  },
  externalCustomerId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Customer ID from payment processor'
  },
  tokenizationData: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Encrypted tokenized data for this payment method'
  },
  
  // Billing Information
  billingName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  billingAddress1: {
    type: DataTypes.STRING,
    allowNull: true
  },
  billingAddress2: {
    type: DataTypes.STRING,
    allowNull: true
  },
  billingCity: {
    type: DataTypes.STRING,
    allowNull: true
  },
  billingState: {
    type: DataTypes.STRING,
    allowNull: true
  },
  billingPostalCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  billingCountry: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Usage & Performance
  dateLastUsed: {
    type: DataTypes.DATE,
    allowNull: true
  },
  successfulTransactions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  failedTransactions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  // Fingerprinting & Security
  fingerprint: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Unique identifier for this payment method for duplication detection'
  },
  
  // Risk & Compliance
  riskScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Risk score from 0-100, higher is more risky'
  },
  verificationMethod: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Method used to verify this payment method'
  },
  verificationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Metadata & Notes
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  
  // For recurring billing
  supportsRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recurringFailures: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'payment_methods',
  timestamps: true, // createdAt and updatedAt
  paranoid: true, // Soft deletes (deletedAt)
  indexes: [
    {
      name: 'payment_methods_user_id_idx',
      fields: ['userId']
    },
    {
      name: 'payment_methods_external_id_idx',
      fields: ['externalId']
    },
    {
      name: 'payment_methods_type_idx',
      fields: ['type']
    },
    {
      name: 'payment_methods_status_idx',
      fields: ['status']
    },
    {
      name: 'payment_methods_fingerprint_idx',
      fields: ['fingerprint']
    }
  ],
  hooks: {
    beforeCreate: async (paymentMethod) => {
      // Generate fingerprint for de-duplication
      if (paymentMethod.type === 'credit_card' || paymentMethod.type === 'debit_card') {
        // Create fingerprint from card details
        const fingerprintData = [
          paymentMethod.userId,
          paymentMethod.cardBrand,
          paymentMethod.cardNumberLast4,
          paymentMethod.type
        ].join('|');
        
        paymentMethod.fingerprint = crypto
          .createHash('sha256')
          .update(fingerprintData)
          .digest('hex');
      } else if (paymentMethod.type === 'bank_account') {
        // Create fingerprint from bank details
        const fingerprintData = [
          paymentMethod.userId,
          paymentMethod.bankName,
          paymentMethod.bankAccountNumber,
          paymentMethod.type
        ].join('|');
        
        paymentMethod.fingerprint = crypto
          .createHash('sha256')
          .update(fingerprintData)
          .digest('hex');
      }
      
      // If marked as default, ensure other payment methods are not default
      if (paymentMethod.isDefault) {
        await PaymentMethod.update(
          { isDefault: false },
          { 
            where: { 
              userId: paymentMethod.userId,
              isDefault: true,
              type: paymentMethod.type
            }
          }
        );
      }
    },
    beforeUpdate: async (paymentMethod) => {
      // If being updated to default, ensure other payment methods are not default
      if (paymentMethod.changed('isDefault') && paymentMethod.isDefault) {
        await PaymentMethod.update(
          { isDefault: false },
          { 
            where: { 
              userId: paymentMethod.userId,
              isDefault: true,
              type: paymentMethod.type,
              id: { [sequelize.Op.ne]: paymentMethod.id }
            }
          }
        );
      }
    }
  }
});

/**
 * Class methods
 */

// Find user's payment methods
PaymentMethod.findByUserId = async function(userId, options = {}) {
  const query = {
    where: { 
      userId,
      status: options.includeInactive ? { [sequelize.Op.ne]: 'deleted' } : 'active'
    },
    order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
  };
  
  if (options.type) {
    query.where.type = options.type;
  }
  
  return await PaymentMethod.findAll(query);
};

// Find user's default payment method
PaymentMethod.findDefaultByUserId = async function(userId, type) {
  const query = {
    where: {
      userId,
      isDefault: true,
      status: 'active'
    }
  };
  
  if (type) {
    query.where.type = type;
  }
  
  return await PaymentMethod.findOne(query);
};

// Find payment method by external ID
PaymentMethod.findByExternalId = async function(externalId) {
  return await PaymentMethod.findOne({
    where: { externalId }
  });
};

// Check for duplicate payment method
PaymentMethod.isDuplicate = async function(paymentMethod) {
  if (!paymentMethod.fingerprint) return false;
  
  const count = await PaymentMethod.count({
    where: {
      userId: paymentMethod.userId,
      fingerprint: paymentMethod.fingerprint,
      status: { [sequelize.Op.ne]: 'deleted' }
    }
  });
  
  return count > 0;
};

/**
 * Instance methods
 */

// Set as default payment method
PaymentMethod.prototype.setAsDefault = async function() {
  // Remove default status from other payment methods of the same type
  await PaymentMethod.update(
    { isDefault: false },
    { 
      where: { 
        userId: this.userId,
        type: this.type,
        isDefault: true,
        id: { [sequelize.Op.ne]: this.id }
      }
    }
  );
  
  this.isDefault = true;
  return await this.save();
};

// Mark payment method as verified
PaymentMethod.prototype.markAsVerified = async function(method = 'manual') {
  this.isVerified = true;
  this.verificationMethod = method;
  this.verificationDate = new Date();
  return await this.save();
};

// Update payment method status
PaymentMethod.prototype.updateStatus = async function(newStatus) {
  const allowedStatuses = ['active', 'inactive', 'expired', 'deleted'];
  
  if (!allowedStatuses.includes(newStatus)) {
    throw new Error('Invalid payment method status');
  }
  
  // If being deleted and was default, clear default
  if (newStatus === 'deleted' && this.isDefault) {
    this.isDefault = false;
  }
  
  this.status = newStatus;
  return await this.save();
};

// Record successful transaction
PaymentMethod.prototype.recordSuccess = async function() {
  this.successfulTransactions += 1;
  this.dateLastUsed = new Date();
  return await this.save();
};

// Record failed transaction
PaymentMethod.prototype.recordFailure = async function(isRecurring = false) {
  this.failedTransactions += 1;
  
  if (isRecurring) {
    this.recurringFailures += 1;
    
    // Deactivate after 3 recurring failures
    if (this.recurringFailures >= 3) {
      this.status = 'inactive';
    }
  }
  
  this.dateLastUsed = new Date();
  return await this.save();
};

// Update expiry date
PaymentMethod.prototype.updateExpiry = async function(month, year) {
  if (this.type !== 'credit_card' && this.type !== 'debit_card') {
    throw new Error('Can only update expiry date for card payment methods');
  }
  
  this.cardExpiryMonth = month.toString().padStart(2, '0');
  
  // Accept 2-digit or 4-digit years
  this.cardExpiryYear = year.toString().length === 2 
    ? `20${year}` 
    : year.toString();
  
  // Check if card is expired
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
  const currentYear = now.getFullYear();
  
  const expiryMonth = parseInt(this.cardExpiryMonth, 10);
  const expiryYear = parseInt(this.cardExpiryYear, 10);
  
  if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
    this.status = 'expired';
  } else {
    // If it was previously expired and now is valid, reactivate
    if (this.status === 'expired') {
      this.status = 'active';
    }
  }
  
  return await this.save();
};

module.exports = PaymentMethod; 