/**
 * Enhanced User Model with Security Features
 * Improved password handling, account security, and audit logging
 */

const { DataTypes, Model } = require('sequelize');
const SecurityUtils = require('../utils/security');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.RefreshToken, { 
        foreignKey: 'userId',
        as: 'refreshTokens'
      });
    }
    
    /**
     * Validate password against stored hash
     * @param {string} password - Plain text password
     * @returns {Promise<boolean>} Validation result
     */
    async validatePassword(password) {
      return await SecurityUtils.verifyPassword(password, this.password);
    }
    
    /**
     * Update password with proper hashing
     * @param {string} newPassword - New plain text password
     * @returns {Promise<void>}
     */
    async updatePassword(newPassword) {
      // Validate password strength
      const validation = SecurityUtils.validatePassword(newPassword);
      if (!validation.isValid) {
        throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Hash the new password
      this.password = await SecurityUtils.hashPassword(newPassword);
      this.passwordChangedAt = new Date();
      this.tokenVersion += 1; // Invalidate all existing tokens
      
      await this.save();
    }
    
    /**
     * Generate email verification token
     * @returns {string} Verification token
     */
    generateEmailVerificationToken() {
      const token = SecurityUtils.generateSecureToken(32);
      this.emailVerificationToken = token;
      this.emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      return token;
    }
    
    /**
     * Generate password reset token
     * @returns {string} Reset token
     */
    generatePasswordResetToken() {
      const token = SecurityUtils.generateSecureToken(32);
      this.passwordResetToken = token;
      this.passwordResetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      return token;
    }
    
    /**
     * Clear password reset token
     */
    clearPasswordResetToken() {
      this.passwordResetToken = null;
      this.passwordResetTokenExpires = null;
    }
    
    /**
     * Clear email verification token
     */
    clearEmailVerificationToken() {
      this.emailVerificationToken = null;
      this.emailVerificationTokenExpires = null;
    }
    
    /**
     * Check if account is locked
     * @returns {boolean} True if account is locked
     */
    isAccountLocked() {
      return this.accountLockedUntil && this.accountLockedUntil > new Date();
    }
    
    /**
     * Lock account for specified duration
     * @param {number} durationMs - Duration in milliseconds
     */
    lockAccount(durationMs = 30 * 60 * 1000) { // Default 30 minutes
      this.accountLockedUntil = new Date(Date.now() + durationMs);
      this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
    }
    
    /**
     * Unlock account and reset failed attempts
     */
    unlockAccount() {
      this.accountLockedUntil = null;
      this.failedLoginAttempts = 0;
    }
    
    /**
     * Increment failed login attempts
     * @returns {number} Current failed attempts count
     */
    incrementFailedLoginAttempts() {
      this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
      return this.failedLoginAttempts;
    }
    
    /**
     * Reset failed login attempts
     */
    resetFailedLoginAttempts() {
      this.failedLoginAttempts = 0;
    }
    
    /**
     * Get full name
     * @returns {string} Full name
     */
    getFullName() {
      return `${this.firstName} ${this.lastName}`.trim();
    }
    
    /**
     * Check if user has role
     * @param {string} role - Role to check
     * @returns {boolean} True if user has role
     */
    hasRole(role) {
      return this.role === role;
    }
    
    /**
     * Check if user can perform action based on role
     * @param {string} action - Action to check
     * @returns {boolean} True if user can perform action
     */
    canPerform(action) {
      const permissions = {
        admin: ['*'], // All permissions
        hirer: [
          'post_job',
          'hire_worker',
          'manage_contracts',
          'release_payment',
          'rate_worker'
        ],
        worker: [
          'apply_job',
          'accept_contract',
          'submit_work',
          'rate_hirer'
        ]
      };
      
      const userPermissions = permissions[this.role] || [];
      return userPermissions.includes('*') || userPermissions.includes(action);
    }
    
    /**
     * Invalidate all tokens for this user
     */
    async invalidateAllTokens() {
      this.tokenVersion += 1;
      await this.save();
      
      // Also revoke all refresh tokens
      const { RefreshToken } = require('./');
      await RefreshToken.revokeAllForUser(this.id, 'Token version incremented');
    }
    
    /**
     * Get account security status
     * @returns {Object} Security status information
     */
    getSecurityStatus() {
      return {
        isEmailVerified: this.isEmailVerified,
        isPhoneVerified: this.isPhoneVerified || false,
        is2FAEnabled: this.twoFactorEnabled || false,
        isAccountLocked: this.isAccountLocked(),
        failedLoginAttempts: this.failedLoginAttempts || 0,
        lastLogin: this.lastLoginAt,
        passwordLastChanged: this.passwordChangedAt,
        accountAge: this.createdAt ? Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)) : 0
      };
    }
    
    /**
     * Get user's safe profile data (no sensitive info)
     * @returns {Object} Safe profile data
     */
    getSafeProfile() {
      return {
        id: this.id,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        phone: this.phone,
        role: this.role,
        isEmailVerified: this.isEmailVerified,
        isActive: this.isActive,
        profilePicture: this.profilePicture,
        createdAt: this.createdAt,
        lastLoginAt: this.lastLoginAt
      };
    }
    
    /**
     * Log user activity
     * @param {string} action - Action performed
     * @param {Object} details - Additional details
     * @param {string} ipAddress - IP address
     * @param {string} userAgent - User agent
     */
    async logActivity(action, details = {}, ipAddress = null, userAgent = null) {
      const auditLogger = require('../../../shared/utils/audit-logger');
      await auditLogger.log({
        userId: this.id,
        action,
        details,
        ipAddress,
        userAgent
      });
    }
    
    /**
     * Check if password needs to be changed (age-based)
     * @param {number} maxAgeMonths - Maximum password age in months
     * @returns {boolean} True if password should be changed
     */
    shouldChangePassword(maxAgeMonths = 6) {
      if (!this.passwordChangedAt) return true;
      
      const maxAge = maxAgeMonths * 30 * 24 * 60 * 60 * 1000;
      return (Date.now() - this.passwordChangedAt.getTime()) > maxAge;
    }
    
    /**
     * Setup 2FA for user
     * @returns {Object} 2FA setup data
     */
    setup2FA() {
      const secretData = SecurityUtils.generate2FASecret(this.email);
      this.twoFactorSecret = secretData.secret;
      this.twoFactorBackupCodes = JSON.stringify(secretData.backupCodes);
      this.twoFactorEnabled = false; // Enable after verification
      
      return {
        secret: secretData.secret,
        qrCode: secretData.qrCode,
        backupCodes: secretData.backupCodes
      };
    }
    
    /**
     * Verify 2FA token
     * @param {string} token - 6-digit token
     * @returns {boolean} Verification result
     */
    verify2FAToken(token) {
      if (!this.twoFactorSecret) return false;
      return SecurityUtils.verify2FAToken(token, this.twoFactorSecret);
    }
    
    /**
     * Enable 2FA after successful verification
     */
    enable2FA() {
      this.twoFactorEnabled = true;
      this.twoFactorEnabledAt = new Date();
    }
    
    /**
     * Disable 2FA
     */
    disable2FA() {
      this.twoFactorEnabled = false;
      this.twoFactorSecret = null;
      this.twoFactorBackupCodes = null;
      this.twoFactorEnabledAt = null;
    }
  }
  
  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      },
      set(value) {
        this.setDataValue('email', value.toLowerCase().trim());
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isPhoneNumber(value) {
          if (value && !SecurityUtils.validatePhone(value)) {
            throw new Error('Invalid phone number format');
          }
        }
      }
    },
    role: {
      type: DataTypes.ENUM('worker', 'hirer', 'admin'),
      allowNull: false,
      defaultValue: 'worker'
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    emailVerificationToken: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    emailVerificationTokenExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    emailVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isPhoneVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    phoneVerificationToken: {
      type: DataTypes.STRING(6),
      allowNull: true
    },
    phoneVerificationTokenExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    phoneVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    passwordResetToken: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    passwordResetTokenExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    passwordChangedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    failedLoginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    accountLockedUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastLoginIP: {
      type: DataTypes.INET,
      allowNull: true
    },
    lastLoginUserAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    deactivatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deactivationReason: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    tokenVersion: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    twoFactorSecret: {
      type: DataTypes.STRING(32),
      allowNull: true
    },
    twoFactorBackupCodes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    twoFactorEnabledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    profilePicture: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    registrationIP: {
      type: DataTypes.INET,
      allowNull: true
    },
    registrationUserAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    termsAcceptedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    privacyPolicyAcceptedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    marketingOptIn: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    securityQuestions: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    loginHistory: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional user metadata'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    paranoid: false,
    indexes: [
      {
        fields: ['email'],
        unique: true
      },
      {
        fields: ['phone'],
        unique: true,
        where: {
          phone: {
            [DataTypes.Op.ne]: null
          }
        }
      },
      {
        fields: ['role']
      },
      {
        fields: ['isEmailVerified']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['emailVerificationToken'],
        where: {
          emailVerificationToken: {
            [DataTypes.Op.ne]: null
          }
        }
      },
      {
        fields: ['passwordResetToken'],
        where: {
          passwordResetToken: {
            [DataTypes.Op.ne]: null
          }
        }
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['lastLoginAt']
      }
    ],
    hooks: {
      beforeCreate: async (user) => {
        // Hash password if not already hashed
        if (user.password && !user.password.startsWith('$2')) {
          user.password = await SecurityUtils.hashPassword(user.password);
        }
        
        // Set password changed timestamp
        user.passwordChangedAt = new Date();
      },
      
      beforeUpdate: async (user) => {
        // Hash password if changed and not already hashed
        if (user.changed('password') && !user.password.startsWith('$2')) {
          user.password = await SecurityUtils.hashPassword(user.password);
          user.passwordChangedAt = new Date();
        }
      },
      
      afterCreate: async (user) => {
        // Log user creation
        const auditLogger = require('../../../shared/utils/audit-logger');
        await auditLogger.log({
          userId: user.id,
          action: 'USER_CREATED',
          details: {
            email: user.email,
            role: user.role,
            registrationIP: user.registrationIP
          }
        });
      },
      
      afterUpdate: async (user) => {
        // Log significant changes
        const changedFields = user.changed();
        if (changedFields.includes('password')) {
          const auditLogger = require('../../../shared/utils/audit-logger');
          await auditLogger.log({
            userId: user.id,
            action: 'PASSWORD_CHANGED',
            details: {
              changedAt: user.passwordChangedAt
            }
          });
        }
        
        if (changedFields.includes('isEmailVerified') && user.isEmailVerified) {
          const auditLogger = require('../../../shared/utils/audit-logger');
          await auditLogger.log({
            userId: user.id,
            action: 'EMAIL_VERIFIED',
            details: {
              verifiedAt: user.emailVerifiedAt
            }
          });
        }
      }
    },
    scopes: {
      active: {
        where: {
          isActive: true
        }
      },
      verified: {
        where: {
          isEmailVerified: true
        }
      },
      workers: {
        where: {
          role: 'worker'
        }
      },
      hirers: {
        where: {
          role: 'hirer'
        }
      },
      withoutPassword: {
        attributes: {
          exclude: ['password', 'twoFactorSecret', 'twoFactorBackupCodes']
        }
      }
    },
    defaultScope: {
      attributes: {
        exclude: ['password', 'twoFactorSecret', 'twoFactorBackupCodes']
      }
    }
  });
  
  // Class methods
  User.findByEmail = async function(email) {
    return await this.unscoped().findOne({
      where: { email: email.toLowerCase().trim() }
    });
  };
  
  User.findByVerificationToken = async function(token) {
    return await this.unscoped().findOne({
      where: {
        emailVerificationToken: token,
        emailVerificationTokenExpires: {
          [DataTypes.Op.gt]: new Date()
        }
      }
    });
  };
  
  User.findByPasswordResetToken = async function(token) {
    return await this.unscoped().findOne({
      where: {
        passwordResetToken: token,
        passwordResetTokenExpires: {
          [DataTypes.Op.gt]: new Date()
        }
      }
    });
  };
  
  User.getActiveUsersCount = async function() {
    return await this.count({
      where: {
        isActive: true
      }
    });
  };
  
  User.getVerifiedUsersCount = async function() {
    return await this.count({
      where: {
        isEmailVerified: true
      }
    });
  };
  
  User.getUsersByRole = async function(role) {
    return await this.findAll({
      where: { role }
    });
  };
  
  return User;
};