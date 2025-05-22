/**
 * Models Index
 * Initializes and exports all database models
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UserModel = require('./user.model')(sequelize);

// Create a RefreshToken model
const RefreshToken = sequelize.define('RefreshToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isRevoked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdByIp: {
    type: DataTypes.STRING
  }
}, {
  indexes: [
    {
      name: 'refresh_token_user_idx',
      fields: ['userId']
    },
    {
      name: 'refresh_token_token_idx',
      fields: ['token']
    }
  ]
});

// Set up associations
UserModel.hasMany(RefreshToken, { foreignKey: 'userId' });
RefreshToken.belongsTo(UserModel, { foreignKey: 'userId' });

// Define the models object to export
const models = {
  User: UserModel,
  RefreshToken
};

module.exports = models; 