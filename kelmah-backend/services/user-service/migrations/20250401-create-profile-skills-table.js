'use strict';

/**
 * Migration for creating the profile_skills table
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('profile_skills', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      profileId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'profiles',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      skillId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'skills',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      yearsOfExperience: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      proficiencyLevel: {
        type: Sequelize.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
        allowNull: false,
        defaultValue: 'intermediate'
      },
      isVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      verifiedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      verificationDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      verificationMethod: {
        type: Sequelize.ENUM('test', 'portfolio', 'certification', 'interview', 'admin'),
        allowNull: true
      },
      verificationScore: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      endorsementCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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
    await queryInterface.addIndex('profile_skills', ['profileId'], {
      name: 'profile_skills_profile_id_idx'
    });
    
    await queryInterface.addIndex('profile_skills', ['skillId'], {
      name: 'profile_skills_skill_id_idx'
    });
    
    await queryInterface.addIndex('profile_skills', ['profileId', 'skillId'], {
      name: 'profile_skills_profile_skill_unique_idx',
      unique: true
    });
    
    await queryInterface.addIndex('profile_skills', ['featured'], {
      name: 'profile_skills_featured_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('profile_skills');
  }
};