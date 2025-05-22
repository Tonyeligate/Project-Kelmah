/**
 * User Model
 * Defines the structure and behavior of users in the Kelmah platform
 */

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // Basic Information
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'First name is required'
      },
      len: {
        args: [2, 50],
        msg: 'First name must be between 2 and 50 characters'
      }
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Last name is required'
      },
      len: {
        args: [2, 50],
        msg: 'Last name must be between 2 and 50 characters'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Please provide a valid email'
      }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [6, 100],
        msg: 'Password must be at least 6 characters long'
      }
    }
  },
  
  // Authentication & Security
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailVerificationToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emailVerificationExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  mfaEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  mfaSecret: {
    type: DataTypes.STRING,
    allowNull: true
  },
  loginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lockUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Role and Status
  role: {
    type: DataTypes.ENUM('admin', 'hirer', 'worker', 'both'),
    defaultValue: 'both',
    allowNull: false
  },
  accountStatus: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended', 'banned'),
    defaultValue: 'active',
    allowNull: false
  },
  accountType: {
    type: DataTypes.ENUM('individual', 'business'),
    defaultValue: 'individual',
    allowNull: false
  },
  
  // Social Authentication
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  facebookId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  appleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  
  // Preferences
  language: {
    type: DataTypes.STRING,
    defaultValue: 'en',
    allowNull: false
  },
  timezone: {
    type: DataTypes.STRING,
    defaultValue: 'UTC',
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'GHS', // Ghanaian Cedi
    allowNull: false
  },
  
  // Notification Settings
  emailNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  smsNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  pushNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  // Registration and Referral
  registrationIP: {
    type: DataTypes.STRING,
    allowNull: true
  },
  referredBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  referralCode: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  
  // Legal and Terms
  termsAccepted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  privacyPolicyAccepted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  marketingOptIn: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  // Business Information (for business accounts)
  businessName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  businessRegistrationNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  vatNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Account Deletion
  deletionRequested: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  deletionRequestDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true, // Adds createdAt and updatedAt
  paranoid: true, // Soft deletions (adds deletedAt)
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
      
      // Generate unique referral code if not provided
      if (!user.referralCode) {
        // Generate a unique referral code based on name and random string
        const nameInitials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
        const randomString = Math.random().toString(36).substring(2, 7).toUpperCase();
        user.referralCode = `${nameInitials}${randomString}`;
      }
    },
    beforeUpdate: async (user) => {
      // Only hash the password if it was changed
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  },
  defaultScope: {
    attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires', 'emailVerificationToken', 'mfaSecret'] }
  },
  scopes: {
    withPassword: {
      attributes: {}
    }
  },
  indexes: [
    {
      name: 'users_email_idx',
      unique: true,
      fields: ['email']
    },
    {
      name: 'users_referral_code_idx',
      unique: true,
      fields: ['referralCode']
    },
    {
      name: 'users_social_ids_idx',
      fields: ['googleId', 'facebookId', 'appleId']
    },
    {
      name: 'users_account_status_idx',
      fields: ['accountStatus']
    },
    {
      name: 'users_role_idx',
      fields: ['role']
    }
  ]
});

/**
 * Instance methods
 */

// Method to compare password
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
User.prototype.generateAuthToken = function() {
  const payload = {
    id: this.id,
    email: this.email,
    role: this.role
  };
  
  const secret = process.env.JWT_SECRET;
  const options = {
    expiresIn: process.env.JWT_EXPIRATION || '1h'
  };
  
  return jwt.sign(payload, secret, options);
};

// Generate refresh token
User.prototype.generateRefreshToken = function() {
  const payload = {
    id: this.id,
    tokenType: 'refresh'
  };
  
  const secret = process.env.REFRESH_TOKEN_SECRET;
  const options = {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '7d'
  };
  
  return jwt.sign(payload, secret, options);
};

// Generate verification token
User.prototype.generateVerificationToken = function() {
  const token = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
  
  this.emailVerificationToken = token;
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return token;
};

// Generate password reset token
User.prototype.generatePasswordResetToken = function() {
  const token = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
  
  this.resetPasswordToken = token;
  this.resetPasswordExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
  
  return token;
};

// Verify user's email
User.prototype.verifyEmail = async function() {
  this.emailVerified = true;
  this.emailVerificationToken = null;
  this.emailVerificationExpires = null;
  return await this.save();
};

// Reset user's password
User.prototype.resetPassword = async function(newPassword) {
  this.password = newPassword;
  this.resetPasswordToken = null;
  this.resetPasswordExpires = null;
  this.loginAttempts = 0;
  this.lockUntil = null;
  return await this.save();
};

// Update login information
User.prototype.updateLoginInfo = async function(ip) {
  this.lastLogin = new Date();
  this.loginAttempts = 0;
  this.lockUntil = null;
  if (ip) {
    this.lastLoginIP = ip;
  }
  return await this.save();
};

// Increment login attempts
User.prototype.incrementLoginAttempts = async function() {
  // If we have a previous lock that has expired, reset the count
  if (this.lockUntil && this.lockUntil < new Date()) {
    this.loginAttempts = 1;
    this.lockUntil = null;
  } else {
    // Otherwise increment login attempts
    this.loginAttempts = this.loginAttempts + 1;
    
    // Lock the account if we've reached max attempts (5)
    if (this.loginAttempts >= 5) {
      this.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
    }
  }
  
  return await this.save();
};

// Check if account is locked
User.prototype.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Update user's role
User.prototype.updateRole = async function(newRole) {
  if (!['admin', 'hirer', 'worker', 'both'].includes(newRole)) {
    throw new Error('Invalid role');
  }
  
  this.role = newRole;
  return await this.save();
};

// Update account status
User.prototype.updateAccountStatus = async function(newStatus) {
  if (!['active', 'inactive', 'suspended', 'banned'].includes(newStatus)) {
    throw new Error('Invalid account status');
  }
  
  this.accountStatus = newStatus;
  return await this.save();
};

// Request account deletion
User.prototype.requestDeletion = async function() {
  this.deletionRequested = true;
  this.deletionRequestDate = new Date();
  return await this.save();
};

// Cancel account deletion request
User.prototype.cancelDeletionRequest = async function() {
  this.deletionRequested = false;
  this.deletionRequestDate = null;
  return await this.save();
};

/**
 * Class methods
 */

// Find user by email
User.findByEmail = async function(email) {
  return await User.findOne({ where: { email } });
};

// Find user by verification token
User.findByVerificationToken = async function(token) {
  return await User.findOne({
    where: {
      emailVerificationToken: token,
      emailVerificationExpires: { [sequelize.Op.gt]: new Date() }
    }
  });
};

// Find user by password reset token
User.findByResetToken = async function(token) {
  return await User.findOne({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { [sequelize.Op.gt]: new Date() }
    }
  });
};

// Find user by social login ID
User.findBySocialId = async function(provider, socialId) {
  const query = {};
  
  switch(provider) {
    case 'google':
      query.googleId = socialId;
      break;
    case 'facebook':
      query.facebookId = socialId;
      break;
    case 'apple':
      query.appleId = socialId;
      break;
    default:
      throw new Error('Invalid social provider');
  }
  
  return await User.findOne({ where: query });
};

// Find users by referral
User.findReferredUsers = async function(referralCode) {
  return await User.findAll({
    where: { referredBy: referralCode },
    order: [['createdAt', 'DESC']]
  });
};

module.exports = User; 