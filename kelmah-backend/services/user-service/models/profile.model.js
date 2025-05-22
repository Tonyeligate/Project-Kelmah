/**
 * Profile Model
 * Defines the structure and behavior of user profiles in the Kelmah platform
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Profile = sequelize.define('Profile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  // Basic Information
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  headline: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: {
        args: [0, 100],
        msg: 'Headline must be less than 100 characters'
      }
    }
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 2000],
        msg: 'Bio must be less than 2000 characters'
      }
    }
  },
  profilePicture: {
    type: DataTypes.STRING,
    allowNull: true
  },
  coverImage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Contact Information
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isValidPhone(value) {
        if (value && !/^(\+\d{1,3})?\d{9,15}$/.test(value)) {
          throw new Error('Invalid phone number format');
        }
      }
    }
  },
  phoneVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  alternativeEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: {
        msg: 'Must be a valid email address'
      }
    }
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'Must be a valid URL'
      }
    }
  },
  
  // Location Details
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  region: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  postalCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  
  // Professional Information
  skills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  languages: {
    type: DataTypes.JSON, // Array of language objects with proficiency level
    defaultValue: []
  },
  education: {
    type: DataTypes.JSON, // Array of education objects
    defaultValue: []
  },
  experience: {
    type: DataTypes.JSON, // Array of work experience objects
    defaultValue: []
  },
  certifications: {
    type: DataTypes.JSON, // Array of certification objects
    defaultValue: []
  },
  portfolio: {
    type: DataTypes.JSON, // Array of portfolio items
    defaultValue: []
  },
  
  // Worker-specific Information
  hourlyRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: {
        args: [0],
        msg: 'Hourly rate must be greater than or equal to 0'
      }
    }
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'GHS', // Ghanaian Cedi
    allowNull: true
  },
  availability: {
    type: DataTypes.ENUM('full_time', 'part_time', 'contract', 'not_available'),
    allowNull: true
  },
  availableHours: {
    type: DataTypes.INTEGER, // Hours per week
    allowNull: true,
    validate: {
      min: {
        args: [0],
        msg: 'Available hours must be greater than or equal to 0'
      },
      max: {
        args: [168], // Maximum hours in a week
        msg: 'Available hours must be less than or equal to 168'
      }
    }
  },
  
  // Social Media Links
  socialMedia: {
    type: DataTypes.JSON, // Object with social media links
    defaultValue: {}
  },
  
  // Verification
  verifiedIdentity: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  idDocumentType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  idDocumentNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  idDocumentExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  idDocumentImage: {
    type: DataTypes.STRING, // URL to stored document
    allowNull: true
  },
  
  // Additional Settings
  visibility: {
    type: DataTypes.ENUM('public', 'private', 'contacts_only'),
    defaultValue: 'public',
    allowNull: false
  },
  searchable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastActive: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Stats and Metrics
  completedJobs: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  ongoingJobs: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  cancelledJobs: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalEarnings: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  responseRate: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  responseTime: {
    type: DataTypes.INTEGER, // In minutes
    defaultValue: 0
  },
  
  // Rating information
  averageRating: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  totalReviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  // Preferences
  categories: {
    type: DataTypes.ARRAY(DataTypes.STRING), // Preferred job categories
    defaultValue: []
  },
  preferredJobType: {
    type: DataTypes.ARRAY(DataTypes.STRING), // Types of jobs preferred
    defaultValue: []
  },
  notificationPreferences: {
    type: DataTypes.JSON, // Object with notification settings
    defaultValue: {}
  }
}, {
  tableName: 'profiles',
  timestamps: true, // createdAt and updatedAt
  paranoid: true, // Soft deletes (deletedAt)
  indexes: [
    {
      name: 'profiles_user_id_idx',
      fields: ['userId'],
      unique: true
    },
    {
      name: 'profiles_skills_idx',
      fields: ['skills'],
      using: 'gin'
    },
    {
      name: 'profiles_hourly_rate_idx',
      fields: ['hourlyRate']
    },
    {
      name: 'profiles_availability_idx',
      fields: ['availability']
    },
    {
      name: 'profiles_average_rating_idx',
      fields: ['averageRating']
    },
    {
      name: 'profiles_categories_idx',
      fields: ['categories'],
      using: 'gin'
    }
  ]
});

/**
 * Class methods
 */

// Find profile by user ID
Profile.findByUserId = async (userId) => {
  return await Profile.findOne({
    where: { userId }
  });
};

// Search profiles by skills
Profile.findBySkills = async (skills, limit = 20) => {
  return await Profile.findAll({
    where: {
      skills: {
        [sequelize.Op.overlap]: Array.isArray(skills) ? skills : [skills]
      },
      visibility: 'public',
      searchable: true
    },
    order: [['averageRating', 'DESC']],
    limit
  });
};

// Search profiles by categories
Profile.findByCategories = async (categories, limit = 20) => {
  return await Profile.findAll({
    where: {
      categories: {
        [sequelize.Op.overlap]: Array.isArray(categories) ? categories : [categories]
      },
      visibility: 'public',
      searchable: true
    },
    order: [['averageRating', 'DESC']],
    limit
  });
};

// Find top rated profiles
Profile.findTopRated = async (limit = 10) => {
  return await Profile.findAll({
    where: {
      visibility: 'public',
      searchable: true,
      averageRating: {
        [sequelize.Op.gt]: 0
      }
    },
    order: [['averageRating', 'DESC']],
    limit
  });
};

/**
 * Instance methods
 */

// Update profile information
Profile.prototype.updateInfo = async function(updateData) {
  Object.keys(updateData).forEach(key => {
    this[key] = updateData[key];
  });
  return await this.save();
};

// Add a skill
Profile.prototype.addSkill = async function(skill) {
  if (!this.skills.includes(skill)) {
    this.skills = [...this.skills, skill];
    await this.save();
  }
  return this;
};

// Update social media links
Profile.prototype.updateSocialMedia = async function(socialMediaLinks) {
  this.socialMedia = {
    ...this.socialMedia,
    ...socialMediaLinks
  };
  return await this.save();
};

// Update ratings
Profile.prototype.updateRating = async function(rating, totalReviews) {
  this.averageRating = rating;
  this.totalReviews = totalReviews;
  return await this.save();
};

// Update job stats
Profile.prototype.updateJobStats = async function(stats) {
  if (stats.completedJobs !== undefined) this.completedJobs = stats.completedJobs;
  if (stats.ongoingJobs !== undefined) this.ongoingJobs = stats.ongoingJobs;
  if (stats.cancelledJobs !== undefined) this.cancelledJobs = stats.cancelledJobs;
  if (stats.totalEarnings !== undefined) this.totalEarnings = stats.totalEarnings;
  return await this.save();
};

// Update user profile picture
Profile.prototype.updateProfilePicture = async function(url) {
  this.profilePicture = url;
  return await this.save();
};

// Verify identity document
Profile.prototype.verifyIdentity = async function(verified = true) {
  this.verifiedIdentity = verified;
  return await this.save();
};

// Update user last active timestamp
Profile.prototype.updateLastActive = async function() {
  this.lastActive = new Date();
  return await this.save();
};

module.exports = Profile; 