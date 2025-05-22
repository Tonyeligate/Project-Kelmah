'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jobs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
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
      status: {
        type: Sequelize.ENUM('draft', 'open', 'in_progress', 'completed', 'cancelled', 'expired'),
        defaultValue: 'draft',
        allowNull: false
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false
      },
      subCategory: {
        type: Sequelize.STRING,
        allowNull: true
      },
      skills: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      budget: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING,
        defaultValue: 'GHS',
        allowNull: false
      },
      paymentType: {
        type: Sequelize.ENUM('hourly', 'fixed', 'milestone'),
        allowNull: false
      },
      estimatedHours: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      deadline: {
        type: Sequelize.DATE,
        allowNull: true
      },
      location: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      jobType: {
        type: Sequelize.ENUM('remote', 'on_site', 'hybrid'),
        allowNull: false
      },
      experience: {
        type: Sequelize.ENUM('entry', 'intermediate', 'expert'),
        allowNull: false
      },
      visibility: {
        type: Sequelize.ENUM('public', 'private', 'invitation'),
        defaultValue: 'public',
        allowNull: false
      },
      applicationCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      hiredCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      maxHires: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      expiresAt: {
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
    await queryInterface.addIndex('jobs', ['hirerUserId'], {
      name: 'jobs_hirer_user_id_idx'
    });

    await queryInterface.addIndex('jobs', ['status', 'visibility'], {
      name: 'jobs_status_visibility_idx'
    });

    await queryInterface.addIndex('jobs', ['category'], {
      name: 'jobs_category_idx'
    });

    await queryInterface.addIndex('jobs', ['createdAt'], {
      name: 'jobs_created_at_idx'
    });

    await queryInterface.addIndex('jobs', ['skills'], {
      name: 'jobs_skills_gin_idx',
      using: 'GIN'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('jobs');
  }
}; 