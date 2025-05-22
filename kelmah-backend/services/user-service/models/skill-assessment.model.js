/**
 * Skill Assessment Model
 * Represents a worker's skill assessment results
 */

const { DataTypes, Model } = require('sequelize');
const logger = require('../utils/logger');

module.exports = (sequelize) => {
  class SkillAssessment extends Model {
    static associate(models) {
      // Define associations here
      SkillAssessment.belongsTo(models.User, {
        foreignKey: 'workerId',
        as: 'worker'
      });
      
      SkillAssessment.belongsTo(models.Skill, {
        foreignKey: 'skillId',
        as: 'skill'
      });
    }
  }

  SkillAssessment.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    workerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    skillId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Skills',
        key: 'id'
      }
    },
    skillName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'expired', 'failed'),
      defaultValue: 'pending'
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    percentile: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    certificateId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    certificateUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    hasCertificate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    attempt: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'SkillAssessment',
    tableName: 'skill_assessments',
    timestamps: true,
    hooks: {
      afterCreate: (assessment) => {
        logger.info(`New skill assessment scheduled for worker ${assessment.workerId} on skill ${assessment.skillName}`);
      },
      afterUpdate: (assessment) => {
        if (assessment.changed('status') && assessment.status === 'completed') {
          logger.info(`Worker ${assessment.workerId} completed assessment for ${assessment.skillName} with score ${assessment.score}`);
        }
      }
    }
  });

  return SkillAssessment;
}; 