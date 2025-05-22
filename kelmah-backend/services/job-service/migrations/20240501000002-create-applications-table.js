'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('applications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      jobId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'jobs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      workerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      coverLetter: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      proposedRate: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      proposedTimeframe: {
        type: Sequelize.INTEGER, // Days
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM(
          'pending', 
          'shortlisted', 
          'rejected', 
          'hired', 
          'withdrawn'
        ),
        defaultValue: 'pending',
        allowNull: false
      },
      attachments: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      hirerNotes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      rejectionReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      withdrawalReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isInvited: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      invitedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lastStatusChangeAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lastStatusChangeBy: {
        type: Sequelize.UUID,
        allowNull: true
      },
      viewedByHirerAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      contractId: {
        type: Sequelize.UUID,
        references: {
          model: 'contracts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      },
      deletedAt: {
        type: Sequelize.DATE,
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

    // Create indexes
    await queryInterface.addIndex('applications', ['jobId'], {
      name: 'applications_job_id_idx'
    });

    await queryInterface.addIndex('applications', ['workerId'], {
      name: 'applications_worker_id_idx'
    });

    await queryInterface.addIndex('applications', ['status'], {
      name: 'applications_status_idx'
    });

    // Compound index for job+worker uniqueness checks
    await queryInterface.addIndex('applications', ['jobId', 'workerId'], {
      name: 'applications_job_worker_idx',
      unique: true,
      where: {
        deletedAt: null
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('applications');
  }
}; 