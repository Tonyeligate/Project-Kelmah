'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('job_applications', {
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
      jobId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      jobTitle: {
        type: Sequelize.STRING,
        allowNull: false
      },
      companyName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      coverLetter: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      proposedRate: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      availability: {
        type: Sequelize.JSON,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'reviewing', 'shortlisted', 'interview', 'accepted', 'rejected', 'withdrawn'),
        defaultValue: 'pending'
      },
      interviewDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      feedbackFromHirer: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      appliedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
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
    await queryInterface.addIndex('job_applications', ['workerId']);
    await queryInterface.addIndex('job_applications', ['jobId']);
    await queryInterface.addIndex('job_applications', ['status']);
    await queryInterface.addIndex('job_applications', ['appliedAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('job_applications');
  }
}; 