'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create Profiles table
    await queryInterface.createTable('profiles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true
      },
      bio: {
        type: Sequelize.TEXT
      },
      headline: {
        type: Sequelize.STRING
      },
      phoneNumber: {
        type: Sequelize.STRING
      },
      hourlyRate: {
        type: Sequelize.FLOAT
      },
      availability: {
        type: Sequelize.ENUM('Full-Time', 'Part-Time', 'Contract', 'Freelance'),
        defaultValue: 'Full-Time'
      },
      radius: {
        type: Sequelize.INTEGER,
        defaultValue: 25
      },
      profilePictureUrl: {
        type: Sequelize.STRING
      },
      backgroundImageUrl: {
        type: Sequelize.STRING
      },
      isRemote: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      lastActive: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      completionPercentage: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      rating: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      visibility: {
        type: Sequelize.ENUM('Public', 'Private', 'Connections Only'),
        defaultValue: 'Public'
      },
      accountStatus: {
        type: Sequelize.ENUM('Active', 'Inactive', 'Suspended'),
        defaultValue: 'Active'
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

    // Create Address table
    await queryInterface.createTable('addresses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      street: {
        type: Sequelize.STRING
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false
      },
      state: {
        type: Sequelize.STRING,
        allowNull: false
      },
      zipCode: {
        type: Sequelize.STRING,
        allowNull: false
      },
      country: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'USA'
      },
      latitude: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      longitude: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      profileId: {
        type: Sequelize.UUID,
        references: {
          model: 'profiles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    // Create Skills table
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
      description: {
        type: Sequelize.TEXT
      },
      popularity: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      aliases: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
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

    // Create ProfileSkill junction table
    await queryInterface.createTable('profile_skills', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      profileId: {
        type: Sequelize.UUID,
        references: {
          model: 'profiles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      skillId: {
        type: Sequelize.UUID,
        references: {
          model: 'skills',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      level: {
        type: Sequelize.ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert'),
        defaultValue: 'Intermediate'
      },
      yearsOfExperience: {
        type: Sequelize.INTEGER,
        defaultValue: 1
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

    // Add index on profile_skills for faster queries
    await queryInterface.addIndex('profile_skills', ['profileId', 'skillId'], {
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('profile_skills');
    await queryInterface.dropTable('skills');
    await queryInterface.dropTable('addresses');
    await queryInterface.dropTable('profiles');
  }
}; 