/**
 * Skill Model
 * Defines the structure and behavior of skills in the Kelmah platform
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').getSequelize();

const Skill = sequelize.define('Skill', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Skill name is required'
      },
      len: {
        args: [2, 50],
        msg: 'Skill name must be between 2 and 50 characters'
      }
    }
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Skill category is required'
      }
    }
  },
  subcategory: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isVerifiable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  testAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  popularity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'deprecated'),
    defaultValue: 'active'
  }
}, {
  tableName: 'skills',
  timestamps: true,
  paranoid: true, // Soft deletes
  indexes: [
    {
      name: 'skills_name_idx',
      unique: true,
      fields: ['name']
    },
    {
      name: 'skills_category_idx',
      fields: ['category']
    },
    {
      name: 'skills_popularity_idx',
      fields: ['popularity']
    },
    {
      name: 'skills_status_idx',
      fields: ['status']
    }
  ],
  hooks: {
    beforeValidate: (skill) => {
      // Normalize skill names to lowercase for consistency
      if (skill.name) {
        skill.name = skill.name.trim().toLowerCase();
      }
      
      // Normalize categories to lowercase for consistency
      if (skill.category) {
        skill.category = skill.category.trim().toLowerCase();
      }
    }
  }
});

/**
 * Class methods
 */

// Find skills by category
Skill.findByCategory = async function(category) {
  return await Skill.findAll({
    where: { 
      category,
      status: 'active'
    },
    order: [['popularity', 'DESC']]
  });
};

// Find trending skills (most popular)
Skill.findTrending = async function(limit = 10) {
  return await Skill.findAll({
    where: { status: 'active' },
    order: [['popularity', 'DESC']],
    limit
  });
};

// Search skills by name or description
Skill.searchSkills = async function(query, limit = 20) {
  const { Op } = require('sequelize');
  return await Skill.findAll({
    where: {
      [Op.or]: [
        { name: { [Op.iLike]: `%${query}%` } },
        { description: { [Op.iLike]: `%${query}%` } }
      ],
      status: 'active'
    },
    limit
  });
};

// Get related skills
Skill.findRelated = async function(skillId, limit = 5) {
  const skill = await Skill.findByPk(skillId);
  if (!skill) return [];
  
  return await Skill.findAll({
    where: {
      category: skill.category,
      id: { [sequelize.Op.ne]: skillId },
      status: 'active'
    },
    order: [['popularity', 'DESC']],
    limit
  });
};

/**
 * Instance methods
 */

// Increment popularity
Skill.prototype.incrementPopularity = async function(amount = 1) {
  this.popularity += amount;
  return await this.save();
};

// Deprecate skill
Skill.prototype.deprecate = async function() {
  this.status = 'deprecated';
  return await this.save();
};

// Toggle active status
Skill.prototype.toggleActive = async function() {
  this.status = this.status === 'active' ? 'inactive' : 'active';
  return await this.save();
};

// Enable skill verification
Skill.prototype.enableVerification = async function(hasTest = false) {
  this.isVerifiable = true;
  this.testAvailable = hasTest;
  return await this.save();
};

module.exports = Skill; 