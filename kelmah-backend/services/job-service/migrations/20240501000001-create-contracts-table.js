'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('contracts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      jobId: {
        type: Sequelize.UUID,
        references: {
          model: 'jobs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      },
      hirerUserId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      workerUserId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      contractType: {
        type: Sequelize.ENUM('fixed', 'hourly', 'milestone'),
        allowNull: false
      },
      paymentTerms: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      totalAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING,
        defaultValue: 'GHS',
        allowNull: false
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM(
          'draft', 
          'sent', 
          'accepted', 
          'active', 
          'paused', 
          'completed', 
          'cancelled', 
          'disputed'
        ),
        defaultValue: 'draft',
        allowNull: false
      },
      paymentStatus: {
        type: Sequelize.ENUM(
          'not_started',
          'escrow_funded',
          'in_progress',
          'completed',
          'refunded'
        ),
        defaultValue: 'not_started',
        allowNull: false
      },
      escrowAmount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false
      },
      paidAmount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false
      },
      milestones: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      lastActivityAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      contractTerms: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      hirerSignedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      workerSignedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cancelledAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cancelReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      cancelledBy: {
        type: Sequelize.UUID,
        allowNull: true
      },
      disputeReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      disputeOpenedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      disputeOpenedBy: {
        type: Sequelize.UUID,
        allowNull: true
      },
      disputeResolvedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      disputeResolution: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      templateId: {
        type: Sequelize.UUID,
        references: {
          model: 'contract_templates',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      },
      completedAt: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex('contracts', ['jobId'], {
      name: 'contracts_job_id_idx'
    });

    await queryInterface.addIndex('contracts', ['hirerUserId'], {
      name: 'contracts_hirer_user_id_idx'
    });

    await queryInterface.addIndex('contracts', ['workerUserId'], {
      name: 'contracts_worker_user_id_idx'
    });

    await queryInterface.addIndex('contracts', ['status'], {
      name: 'contracts_status_idx'
    });

    await queryInterface.addIndex('contracts', ['paymentStatus'], {
      name: 'contracts_payment_status_idx'
    });

    await queryInterface.addIndex('contracts', ['hirerUserId', 'status'], {
      name: 'contracts_hirer_status_idx'
    });

    await queryInterface.addIndex('contracts', ['workerUserId', 'status'], {
      name: 'contracts_worker_status_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('contracts');
  }
}; 