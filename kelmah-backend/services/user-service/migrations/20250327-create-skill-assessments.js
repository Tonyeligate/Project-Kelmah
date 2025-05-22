'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create ENUM type for assessment status
    await queryInterface.sequelize.query(
      'CREATE TYPE "enum_skill_assessments_status" AS ENUM (\'pending\', \'in_progress\', \'completed\', \'expired\', \'failed\');'
    );

    await queryInterface.createTable('skill_assessments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      workerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      skillId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Skills',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      skillName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: 'enum_skill_assessments_status',
        defaultValue: 'pending'
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
          max: 100
        }
      },
      percentile: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
          max: 100
        }
      },
      certificateId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      certificateUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      hasCertificate: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      scheduledDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completedDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      expiryDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      attempt: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('skill_assessments', ['workerId']);
    await queryInterface.addIndex('skill_assessments', ['skillId']);
    await queryInterface.addIndex('skill_assessments', ['status']);
    await queryInterface.addIndex('skill_assessments', ['completedDate']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('skill_assessments');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_skill_assessments_status";');
  }
}; 