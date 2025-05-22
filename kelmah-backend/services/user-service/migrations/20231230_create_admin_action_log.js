'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('admin_action_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      adminId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      actionType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      targetType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      targetId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      details: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('admin_action_logs', ['adminId'], {
      name: 'admin_action_logs_admin_id_idx'
    });
    
    await queryInterface.addIndex('admin_action_logs', ['actionType'], {
      name: 'admin_action_logs_action_type_idx'
    });
    
    await queryInterface.addIndex('admin_action_logs', ['targetType'], {
      name: 'admin_action_logs_target_type_idx'
    });
    
    await queryInterface.addIndex('admin_action_logs', ['targetId'], {
      name: 'admin_action_logs_target_id_idx'
    });
    
    await queryInterface.addIndex('admin_action_logs', ['createdAt'], {
      name: 'admin_action_logs_created_at_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('admin_action_logs');
  }
}; 