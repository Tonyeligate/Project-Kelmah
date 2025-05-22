'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add indexes for frequently queried fields
    await queryInterface.addIndex('Users', ['email'], {
      name: 'users_email_idx',
      unique: true
    });

    await queryInterface.addIndex('Users', ['username'], {
      name: 'users_username_idx',
      unique: true
    });

    await queryInterface.addIndex('Skills', ['category'], {
      name: 'skills_category_idx'
    });

    await queryInterface.addIndex('Profiles', ['userId'], {
      name: 'profiles_user_id_idx'
    });

    await queryInterface.addIndex('Messages', ['conversationId', 'createdAt'], {
      name: 'messages_conversation_timestamp_idx'
    });

    await queryInterface.addIndex('Notifications', ['userId', 'createdAt'], {
      name: 'notifications_user_timestamp_idx'
    });

    // Add foreign key constraints
    await queryInterface.addConstraint('Profiles', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'profiles_user_fk',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Messages', {
      fields: ['senderId'],
      type: 'foreign key',
      name: 'messages_sender_fk',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Notifications', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'notifications_user_fk',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('Users', 'users_email_idx');
    await queryInterface.removeIndex('Users', 'users_username_idx');
    await queryInterface.removeIndex('Skills', 'skills_category_idx');
    await queryInterface.removeIndex('Profiles', 'profiles_user_id_idx');
    await queryInterface.removeIndex('Messages', 'messages_conversation_timestamp_idx');
    await queryInterface.removeIndex('Notifications', 'notifications_user_timestamp_idx');

    // Remove foreign key constraints
    await queryInterface.removeConstraint('Profiles', 'profiles_user_fk');
    await queryInterface.removeConstraint('Messages', 'messages_sender_fk');
    await queryInterface.removeConstraint('Notifications', 'notifications_user_fk');
  }
}; 