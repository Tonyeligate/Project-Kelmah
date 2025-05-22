'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('saved_searches', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      query: {
        type: Sequelize.STRING,
        allowNull: false
      },
      parameters: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'JSON object containing search parameters (skills, location, etc.)'
      },
      notificationsEnabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether the user wants to receive notifications for new matches'
      },
      lastNotificationSent: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lastResultCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Number of results found last time this search was run'
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
    await queryInterface.addIndex('saved_searches', ['userId'], {
      name: 'saved_searches_user_id_idx'
    });

    await queryInterface.addIndex('saved_searches', ['notificationsEnabled', 'lastNotificationSent'], {
      name: 'saved_searches_notifications_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('saved_searches');
  }
}; 