/**
 * Enhanced RefreshToken Model with Security Features
 * Supports token rotation, device tracking, and audit logging
 */

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class RefreshToken extends Model {
    static associate(models) {
      RefreshToken.belongsTo(models.User, { 
        foreignKey: 'userId',
        as: 'user'
      });
    }
    
    /**
     * Check if token is expired
     * @returns {boolean} True if token is expired
     */
    isExpired() {
      return this.expiresAt < new Date();
    }
    
    /**
     * Check if token is active (not revoked and not expired)
     * @returns {boolean} True if token is active
     */
    isActive() {
      return !this.isRevoked && !this.isExpired();
    }
    
    /**
     * Revoke the token
     * @param {string} reason - Reason for revocation
     * @returns {Promise<void>}
     */
    async revoke(reason = 'Manual revocation') {
      this.isRevoked = true;
      this.revokedAt = new Date();
      this.revokedReason = reason;
      await this.save();
    }
    
    /**
     * Get token age in seconds
     * @returns {number} Age in seconds
     */
    getAge() {
      return Math.floor((new Date() - this.createdAt) / 1000);
    }
    
    /**
     * Get time until expiry in seconds
     * @returns {number} Seconds until expiry (negative if expired)
     */
    getTimeUntilExpiry() {
      return Math.floor((this.expiresAt - new Date()) / 1000);
    }
    
    /**
     * Check if token is from same device/IP
     * @param {string} deviceInfo - Current device info
     * @param {string} ipAddress - Current IP address
     * @returns {boolean} True if device/IP matches
     */
    isSameDevice(deviceInfo, ipAddress) {
      return this.deviceInfo === deviceInfo && this.ipAddress === ipAddress;
    }
    
    /**
     * Get formatted device information
     * @returns {Object} Parsed device information
     */
    getParsedDeviceInfo() {
      try {
        return typeof this.deviceInfo === 'string' ? 
          JSON.parse(this.deviceInfo) : this.deviceInfo;
      } catch {
        return { userAgent: this.deviceInfo };
      }
    }
    
    /**
     * Check if this is a suspicious token based on usage patterns
     * @returns {boolean} True if token usage seems suspicious
     */
    isSuspicious() {
      // Check for rapid successive uses (potential token theft)
      if (this.lastUsedAt && this.updatedAt) {
        const timeDiff = Math.abs(this.updatedAt - this.lastUsedAt);
        if (timeDiff < 1000) { // Less than 1 second apart
          return true;
        }
      }
      
      // Check for usage from different locations (if location tracking is enabled)
      // This would require additional location tracking implementation
      
      return false;
    }
    
    /**
     * Update last used timestamp and usage count
     * @returns {Promise<void>}
     */
    async markAsUsed() {
      this.lastUsedAt = new Date();
      this.usageCount = (this.usageCount || 0) + 1;
      await this.save();
    }
    
    /**
     * Get token statistics
     * @returns {Object} Token usage statistics
     */
    getStats() {
      return {
        id: this.id,
        tokenId: this.tokenId,
        userId: this.userId,
        created: this.createdAt,
        expires: this.expiresAt,
        lastUsed: this.lastUsedAt,
        usageCount: this.usageCount || 0,
        isActive: this.isActive(),
        isExpired: this.isExpired(),
        isRevoked: this.isRevoked,
        age: this.getAge(),
        timeUntilExpiry: this.getTimeUntilExpiry(),
        deviceInfo: this.getParsedDeviceInfo(),
        ipAddress: this.ipAddress
      };
    }
  }
  
  RefreshToken.init({
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
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    tokenId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      comment: 'Unique identifier for the token (from JWT jti claim)'
    },
    tokenHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: 'SHA256 hash of the raw token part'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Token expiration timestamp'
    },
    isRevoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether the token has been revoked'
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the token was revoked'
    },
    revokedReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Reason for token revocation'
    },
    deviceInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Device information (User-Agent, etc.)'
    },
    ipAddress: {
      type: DataTypes.INET,
      allowNull: true,
      comment: 'IP address when token was created'
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last time the token was used'
    },
    usageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Number of times token has been used'
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
      comment: 'Token version for global invalidation'
    },
    fingerprint: {
      type: DataTypes.STRING(32),
      allowNull: true,
      comment: 'Device fingerprint for additional security'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional metadata (location, security flags, etc.)'
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
    modelName: 'RefreshToken',
    tableName: 'refresh_tokens',
    timestamps: true,
    paranoid: false, // We want hard deletes for security
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['tokenId'],
        unique: true
      },
      {
        fields: ['expiresAt']
      },
      {
        fields: ['isRevoked']
      },
      {
        fields: ['userId', 'isRevoked', 'expiresAt'],
        name: 'refresh_tokens_active_lookup'
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['lastUsedAt']
      }
    ],
    hooks: {
      beforeCreate: (token) => {
        // Set initial usage timestamp
        token.lastUsedAt = new Date();
      },
      
      beforeUpdate: (token) => {
        // Update usage timestamp if token is being used
        if (token.changed('usageCount')) {
          token.lastUsedAt = new Date();
        }
      },
      
      afterCreate: async (token) => {
        // Log token creation for audit
        const auditLogger = require('../../../shared/utils/audit-logger');
        await auditLogger.log({
          userId: token.userId,
          action: 'REFRESH_TOKEN_CREATED',
          details: {
            tokenId: token.tokenId,
            expiresAt: token.expiresAt,
            ipAddress: token.ipAddress
          }
        });
      },
      
      afterUpdate: async (token) => {
        // Log token revocation for audit
        if (token.changed('isRevoked') && token.isRevoked) {
          const auditLogger = require('../../../shared/utils/audit-logger');
          await auditLogger.log({
            userId: token.userId,
            action: 'REFRESH_TOKEN_REVOKED',
            details: {
              tokenId: token.tokenId,
              reason: token.revokedReason,
              revokedAt: token.revokedAt
            }
          });
        }
      }
    },
    scopes: {
      active: {
        where: {
          isRevoked: false,
          expiresAt: {
            [require('sequelize').Op.gt]: new Date()
          }
        }
      },
      expired: {
        where: {
          expiresAt: {
            [require('sequelize').Op.lt]: new Date()
          }
        }
      },
      revoked: {
        where: {
          isRevoked: true
        }
      },
      byUser: (userId) => ({
        where: {
          userId
        }
      }),
      recentlyUsed: {
        where: {
          lastUsedAt: {
            [require('sequelize').Op.gt]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }
    }
  });
  
  // Class methods for bulk operations
  RefreshToken.cleanupExpired = async function() {
    const deletedCount = await this.destroy({
      where: {
        [require('sequelize').Op.or]: [
          {
            expiresAt: {
              [require('sequelize').Op.lt]: new Date()
            }
          },
          {
            isRevoked: true,
            revokedAt: {
              [require('sequelize').Op.lt]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days old
            }
          }
        ]
      }
    });
    
    return deletedCount;
  };
  
  RefreshToken.revokeAllForUser = async function(userId, reason = 'Manual revocation') {
    const [updatedCount] = await this.update(
      {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason
      },
      {
        where: {
          userId,
          isRevoked: false
        }
      }
    );
    
    return updatedCount;
  };
  
  RefreshToken.getActiveTokensForUser = async function(userId) {
    return await this.scope('active').findAll({
      where: { userId },
      order: [['lastUsedAt', 'DESC']]
    });
  };
  
  RefreshToken.getTokenStats = async function(userId = null) {
    const whereClause = userId ? { userId } : {};
    
    const stats = await this.findAll({
      where: whereClause,
      attributes: [
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN is_revoked = false AND expires_at > NOW() THEN 1 END')), 'active'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN is_revoked = true THEN 1 END')), 'revoked'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN expires_at <= NOW() THEN 1 END')), 'expired'],
        [require('sequelize').fn('AVG', require('sequelize').col('usage_count')), 'avgUsageCount'],
        [require('sequelize').fn('MAX', require('sequelize').col('last_used_at')), 'lastActivity']
      ],
      raw: true
    });
    
    return stats[0];
  };
  
  return RefreshToken;
};