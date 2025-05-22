const { DataTypes } = require('sequelize');
const db = require('../config/database');

// Define PaymentMethod model
const PaymentMethod = db.sequelize.define('PaymentMethod', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('card', 'bank_account', 'paypal', 'crypto'),
    allowNull: false
  },
  provider: {
    type: DataTypes.ENUM('stripe', 'paypal', 'other'),
    allowNull: false
  },
  // For cards: last 4 digits; for bank accounts: last 4 digits of account number
  lastFour: {
    type: DataTypes.STRING(4),
    allowNull: true
  },
  // For cards: expiration month (MM)
  expiryMonth: {
    type: DataTypes.STRING(2),
    allowNull: true
  },
  // For cards: expiration year (YYYY)
  expiryYear: {
    type: DataTypes.STRING(4),
    allowNull: true
  },
  // For cards: card brand (Visa, Mastercard, etc.)
  brand: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // For bank accounts: bank name
  bankName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // For bank accounts: account type (checking, savings)
  accountType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // For PayPal: email address
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // External ID from payment processor
  externalId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'payment_methods',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['externalId']
    }
  ]
});

module.exports = PaymentMethod; 