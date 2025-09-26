/**
 * Role Model
 * Defines roles and their permissions in the system
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  permissions: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: []
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'roles',
  timestamps: true
});

// Define associations using the models object
Role.associate = function(models) {
  Role.hasMany(models.User, {
    foreignKey: 'roleId',
    as: 'users'
  });
};

module.exports = Role;
