'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('system_configs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      dataType: {
        type: Sequelize.ENUM('string', 'number', 'boolean', 'json', 'array'),
        defaultValue: 'string'
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      defaultValue: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      possibleValues: {
        type: Sequelize.JSON,
        allowNull: true
      },
      updatedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
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
    await queryInterface.addIndex('system_configs', ['category', 'key'], {
      name: 'system_configs_category_key_idx',
      unique: true
    });
    
    await queryInterface.addIndex('system_configs', ['category'], {
      name: 'system_configs_category_idx'
    });
    
    await queryInterface.addIndex('system_configs', ['isPublic'], {
      name: 'system_configs_is_public_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('system_configs');
  }
}; 