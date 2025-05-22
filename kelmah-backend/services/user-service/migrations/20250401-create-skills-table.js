'use strict';

/**
 * Migration for creating the skills table
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('skills', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false
      },
      subcategory: {
        type: Sequelize.STRING,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      icon: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isVerifiable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      testAvailable: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      popularity: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'deprecated'),
        defaultValue: 'active'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add indexes
    await queryInterface.addIndex('skills', ['name'], {
      name: 'skills_name_idx',
      unique: true
    });
    
    await queryInterface.addIndex('skills', ['category'], {
      name: 'skills_category_idx'
    });
    
    await queryInterface.addIndex('skills', ['popularity'], {
      name: 'skills_popularity_idx'
    });
    
    await queryInterface.addIndex('skills', ['status'], {
      name: 'skills_status_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('skills');
  }
}; 