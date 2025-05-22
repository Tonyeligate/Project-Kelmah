/**
 * System Config Model
 * Stores configuration settings for the platform
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SystemConfig = sequelize.define('SystemConfig', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Configuration category
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Category of the configuration (e.g., security, payments, notifications)'
  },
  // Configuration key
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Unique identifier for the configuration setting'
  },
  // Configuration value (stored as string, can be parsed as needed)
  value: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Value of the configuration setting, stored as string'
  },
  // Description of the configuration
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description of what this configuration controls'
  },
  // Data type of the value
  dataType: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json', 'array'),
    defaultValue: 'string',
    comment: 'Data type of the value for proper parsing'
  },
  // Whether this config is public (visible to clients) or private (server-only)
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'If true, this config can be exposed to clients'
  },
  // Default value
  defaultValue: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Default value if not explicitly set'
  },
  // Possible values for validation
  possibleValues: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of possible values for validation (if applicable)'
  },
  // Who last updated this config
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'system_configs',
  timestamps: true,
  indexes: [
    {
      name: 'system_configs_category_key_idx',
      fields: ['category', 'key'],
      unique: true
    },
    {
      name: 'system_configs_category_idx',
      fields: ['category']
    },
    {
      name: 'system_configs_is_public_idx',
      fields: ['isPublic']
    }
  ]
});

// Associate with User model when it's available
SystemConfig.associate = (models) => {
  SystemConfig.belongsTo(models.User, {
    foreignKey: 'updatedBy',
    as: 'updater'
  });
};

// Class methods
SystemConfig.getByCategory = async function(category) {
  return await this.findAll({
    where: { category },
    order: [['key', 'ASC']]
  });
};

SystemConfig.getPublicConfigs = async function() {
  return await this.findAll({
    where: { isPublic: true },
    order: [['category', 'ASC'], ['key', 'ASC']]
  });
};

// Get a config value, parsed to the correct type
SystemConfig.getValue = async function(category, key, defaultValue = null) {
  const config = await this.findOne({
    where: { category, key }
  });
  
  if (!config) {
    return defaultValue;
  }
  
  // Parse the value based on dataType
  let parsedValue;
  try {
    switch (config.dataType) {
      case 'number':
        parsedValue = parseFloat(config.value);
        break;
      case 'boolean':
        parsedValue = config.value === 'true';
        break;
      case 'json':
      case 'array':
        parsedValue = JSON.parse(config.value);
        break;
      default:
        parsedValue = config.value;
    }
  } catch (error) {
    console.error(`Error parsing config value: ${error.message}`);
    return defaultValue;
  }
  
  return parsedValue;
};

// Set a config value
SystemConfig.setValue = async function(category, key, value, adminId) {
  // Convert value to string based on type
  let stringValue;
  if (typeof value === 'object') {
    stringValue = JSON.stringify(value);
  } else {
    stringValue = String(value);
  }
  
  // Determine data type
  let dataType;
  if (typeof value === 'number') {
    dataType = 'number';
  } else if (typeof value === 'boolean') {
    dataType = 'boolean';
  } else if (Array.isArray(value)) {
    dataType = 'array';
  } else if (typeof value === 'object') {
    dataType = 'json';
  } else {
    dataType = 'string';
  }
  
  // Find or create the config entry
  const [config, created] = await this.findOrCreate({
    where: { category, key },
    defaults: {
      value: stringValue,
      dataType,
      updatedBy: adminId
    }
  });
  
  // If found, update
  if (!created) {
    config.value = stringValue;
    config.dataType = dataType;
    config.updatedBy = adminId;
    await config.save();
  }
  
  return config;
};

module.exports = SystemConfig; 