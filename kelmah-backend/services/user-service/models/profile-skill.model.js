/**
 * ProfileSkill Model
 * Represents the many-to-many relationship between user profiles and skills
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').getSequelize();

const ProfileSkill = sequelize.define('ProfileSkill', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  profileId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'profiles', // This refers to the Profile model
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  skillId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'skills', // This refers to the Skill model
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  yearsOfExperience: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: {
        args: [0],
        msg: 'Years of experience cannot be negative'
      }
    }
  },
  proficiencyLevel: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
    allowNull: false,
    defaultValue: 'intermediate'
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verifiedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users', // This refers to the User model
      key: 'id'
    }
  },
  verificationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  verificationMethod: {
    type: DataTypes.ENUM('test', 'portfolio', 'certification', 'interview', 'admin'),
    allowNull: true
  },
  verificationScore: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: {
        args: [0],
        msg: 'Verification score cannot be negative'
      },
      max: {
        args: [100],
        msg: 'Verification score cannot exceed 100'
      }
    }
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  endorsementCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'profile_skills',
  timestamps: true,
  indexes: [
    {
      name: 'profile_skills_profile_id_idx',
      fields: ['profileId']
    },
    {
      name: 'profile_skills_skill_id_idx',
      fields: ['skillId']
    },
    {
      name: 'profile_skills_profile_skill_unique_idx',
      unique: true,
      fields: ['profileId', 'skillId']
    },
    {
      name: 'profile_skills_featured_idx',
      fields: ['featured']
    }
  ]
});

/**
 * Instance methods
 */

// Verify a profile skill
ProfileSkill.prototype.verify = async function(verifierId, method, score) {
  this.isVerified = true;
  this.verifiedBy = verifierId;
  this.verificationDate = new Date();
  this.verificationMethod = method;
  if (score !== undefined) {
    this.verificationScore = score;
  }
  return await this.save();
};

// Add an endorsement
ProfileSkill.prototype.addEndorsement = async function() {
  this.endorsementCount += 1;
  return await this.save();
};

// Toggle featured status
ProfileSkill.prototype.toggleFeatured = async function() {
  this.featured = !this.featured;
  return await this.save();
};

// Update proficiency level
ProfileSkill.prototype.updateProficiency = async function(level) {
  this.proficiencyLevel = level;
  return await this.save();
};

module.exports = ProfileSkill;