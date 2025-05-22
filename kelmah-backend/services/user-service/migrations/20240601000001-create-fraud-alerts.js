'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('fraud_alerts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      category: {
        type: Sequelize.ENUM('payment', 'login', 'profile', 'behavior'),
        allowNull: false
      },
      riskLevel: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      detectedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      status: {
        type: Sequelize.ENUM('pending', 'resolved'),
        allowNull: false,
        defaultValue: 'pending'
      },
      resolution: {
        type: Sequelize.ENUM('ignore', 'flag', 'block'),
        allowNull: true
      },
      resolvedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      resolvedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('fraud_alerts', ['userId'], {
      name: 'fraud_alerts_user_id_idx'
    });
    
    await queryInterface.addIndex('fraud_alerts', ['category'], {
      name: 'fraud_alerts_category_idx'
    });
    
    await queryInterface.addIndex('fraud_alerts', ['riskLevel'], {
      name: 'fraud_alerts_risk_level_idx'
    });
    
    await queryInterface.addIndex('fraud_alerts', ['status'], {
      name: 'fraud_alerts_status_idx'
    });
    
    await queryInterface.addIndex('fraud_alerts', ['detectedAt'], {
      name: 'fraud_alerts_detected_at_idx'
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    // Drop indexes first
    await queryInterface.removeIndex('fraud_alerts', 'fraud_alerts_user_id_idx');
    await queryInterface.removeIndex('fraud_alerts', 'fraud_alerts_category_idx');
    await queryInterface.removeIndex('fraud_alerts', 'fraud_alerts_risk_level_idx');
    await queryInterface.removeIndex('fraud_alerts', 'fraud_alerts_status_idx');
    await queryInterface.removeIndex('fraud_alerts', 'fraud_alerts_detected_at_idx');
    
    // Drop the enum types and table
    await queryInterface.dropTable('fraud_alerts');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_fraud_alerts_category;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_fraud_alerts_risk_level;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_fraud_alerts_status;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_fraud_alerts_resolution;');
  }
}; 