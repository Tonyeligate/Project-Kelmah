'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reviews', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      contractId: {
        type: Sequelize.UUID,
        references: {
          model: 'contracts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      },
      jobId: {
        type: Sequelize.UUID,
        references: {
          model: 'jobs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      },
      reviewerUserId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      reviewedUserId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      reviewType: {
        type: Sequelize.ENUM('hirer_to_worker', 'worker_to_hirer'),
        allowNull: false
      },
      rating: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: false,
        validate: {
          min: 0,
          max: 5
        }
      },
      title: {
        type: Sequelize.STRING,
        allowNull: true
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      criteriaRatings: {
        type: Sequelize.JSONB,
        defaultValue: {},
        comment: 'Detailed ratings for specific criteria (e.g., communication, quality, etc.)'
      },
      status: {
        type: Sequelize.ENUM('pending', 'published', 'flagged', 'removed'),
        defaultValue: 'published',
        allowNull: false
      },
      flaggedReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      flaggedBy: {
        type: Sequelize.UUID,
        allowNull: true
      },
      flaggedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      response: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Response to the review by the reviewed user'
      },
      responseAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      verifiedPurchase: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Whether the review is from a verified completed contract'
      },
      isAnonymous: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      helpfulCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      unhelpfulCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      adminReviewedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      adminReviewedBy: {
        type: Sequelize.UUID,
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
    await queryInterface.addIndex('reviews', ['contractId'], {
      name: 'reviews_contract_id_idx'
    });

    await queryInterface.addIndex('reviews', ['jobId'], {
      name: 'reviews_job_id_idx'
    });

    await queryInterface.addIndex('reviews', ['reviewerUserId'], {
      name: 'reviews_reviewer_user_id_idx'
    });

    await queryInterface.addIndex('reviews', ['reviewedUserId'], {
      name: 'reviews_reviewed_user_id_idx'
    });

    await queryInterface.addIndex('reviews', ['reviewedUserId', 'status'], {
      name: 'reviews_reviewed_user_status_idx'
    });

    await queryInterface.addIndex('reviews', ['rating'], {
      name: 'reviews_rating_idx'
    });

    // Create unique constraint to prevent duplicate reviews
    await queryInterface.addConstraint('reviews', {
      type: 'unique',
      fields: ['contractId', 'reviewerUserId', 'reviewType'],
      name: 'reviews_contract_reviewer_type_unique',
      where: {
        deletedAt: null
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('reviews');
  }
}; 