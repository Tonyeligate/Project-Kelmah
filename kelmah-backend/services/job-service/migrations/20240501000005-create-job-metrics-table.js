'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create job metrics table for time-series data
    await queryInterface.createTable('job_metrics', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Time when the metric was recorded'
      },
      jobId: {
        type: Sequelize.UUID,
        references: {
          model: 'jobs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      metricType: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Type of metric (views, applications, etc.)'
      },
      value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Value of the metric'
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
        comment: 'Additional metadata for the metric'
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

    // Create indexes for efficient time-series queries
    await queryInterface.addIndex('job_metrics', ['timestamp', 'jobId'], {
      name: 'job_metrics_timestamp_job_id_idx'
    });

    await queryInterface.addIndex('job_metrics', ['metricType'], {
      name: 'job_metrics_metric_type_idx'
    });

    // Execute raw SQL to convert table to a TimescaleDB hypertable
    // This will be executed after table creation at server startup
    // See database.js initializeHypertables() method
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('job_metrics');
  }
}; 