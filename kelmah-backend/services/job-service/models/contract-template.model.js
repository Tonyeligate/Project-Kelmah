/**
 * Contract Template Model
 * Defines the structure for reusable contract templates
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContractTemplate = sequelize.define('ContractTemplate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Template title is required'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  jobType: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Job type is required'
      }
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Template content is required'
      }
    }
  },
  variables: {
    type: DataTypes.JSON, // Array of variable names detected in the template
    defaultValue: []
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'contract_templates',
  timestamps: true, // createdAt and updatedAt
  paranoid: true, // Soft deletes (deletedAt)
  indexes: [
    {
      name: 'contract_templates_job_type_idx',
      fields: ['jobType']
    },
    {
      name: 'contract_templates_created_by_idx',
      fields: ['createdBy']
    },
    {
      name: 'contract_templates_is_default_idx',
      fields: ['isDefault']
    }
  ]
});

/**
 * Class methods
 */

// Find templates by job type
ContractTemplate.findByJobType = async (jobType) => {
  return await ContractTemplate.findAll({
    where: { jobType },
    order: [['createdAt', 'DESC']]
  });
};

// Find default templates
ContractTemplate.findDefaults = async () => {
  return await ContractTemplate.findAll({
    where: { isDefault: true },
    order: [['jobType', 'ASC']]
  });
};

// Find templates by creator
ContractTemplate.findByCreator = async (userId) => {
  return await ContractTemplate.findAll({
    where: { createdBy: userId },
    order: [['createdAt', 'DESC']]
  });
};

/**
 * Generate a contract from template with variable replacement
 * @param {Object} variables - Object with variable names as keys and replacement values as values
 * @return {String} - Contract text with variables replaced
 */
ContractTemplate.prototype.generateContract = function(variables = {}) {
  let contractText = this.content;
  
  // Replace all variables in the format {{variableName}} with their values
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    contractText = contractText.replace(regex, value || `{{${key}}}`);
  });
  
  return contractText;
};

module.exports = ContractTemplate; 