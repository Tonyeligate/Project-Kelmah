/**
 * Migration to create job_views table
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('job_views', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      job_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'jobs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      ip: {
        type: Sequelize.STRING,
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      referrer: {
        type: Sequelize.STRING,
        allowNull: true
      },
      view_duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: 'Duration of view in seconds'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes
    await queryInterface.addIndex('job_views', ['job_id'], {
      name: 'job_views_job_id_idx'
    });

    await queryInterface.addIndex('job_views', ['user_id'], {
      name: 'job_views_user_id_idx'
    });

    await queryInterface.addIndex('job_views', ['created_at'], {
      name: 'job_views_created_at_idx'
    });

    // Add a unique constraint to prevent duplicate views from the same user in a short period
    await queryInterface.addIndex('job_views', ['job_id', 'user_id', 'created_at'], {
      name: 'job_views_unique_recent_view',
      unique: true,
      where: {
        created_at: {
          [Sequelize.Op.gt]: Sequelize.literal("NOW() - INTERVAL '30 minutes'")
        }
      }
    });

    // Create hypertable if TimescaleDB is available
    try {
      await queryInterface.sequelize.query(`
        SELECT create_hypertable('job_views', 'created_at', if_not_exists => TRUE);
      `);
    } catch (error) {
      console.log('TimescaleDB extension not available, skipping hypertable creation');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('job_views');
  }
}; 