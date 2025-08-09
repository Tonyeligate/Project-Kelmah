/**
 * Sequelize migration for bookmarks table (optional if using Sequelize)
 * Note: user-service primarily uses MongoDB; include this only if Sequelize is enabled.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!queryInterface || !Sequelize) return;
    await queryInterface.createTable('bookmarks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      workerId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });
    await queryInterface.addIndex('bookmarks', ['userId']);
    await queryInterface.addIndex('bookmarks', ['workerId']);
    await queryInterface.addConstraint('bookmarks', {
      fields: ['userId', 'workerId'],
      type: 'unique',
      name: 'bookmarks_user_worker_unique'
    });
  },
  async down(queryInterface) {
    if (!queryInterface) return;
    await queryInterface.dropTable('bookmarks');
  }
};



