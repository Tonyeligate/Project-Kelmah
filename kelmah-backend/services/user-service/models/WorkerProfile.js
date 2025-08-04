/**
 * Worker Profile Model
 * Extended profile information for workers
 */

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class WorkerProfile extends Model {
    static associate(models) {
      WorkerProfile.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      
      WorkerProfile.hasMany(models.WorkerSkill, {
        foreignKey: 'workerProfileId',
        as: 'skills'
      });
      
      WorkerProfile.hasMany(models.Portfolio, {
        foreignKey: 'workerProfileId',
        as: 'portfolioItems'
      });
      
      WorkerProfile.hasMany(models.Certification, {
        foreignKey: 'workerProfileId',
        as: 'certifications'
      });
    }
    
    /**
     * Get worker's average rating
     * @returns {number} Average rating
     */
    getAverageRating() {
      return this.rating || 0;
    }
    
    /**
     * Get worker's completion rate
     * @returns {number} Completion rate percentage
     */
    getCompletionRate() {
      if (this.totalJobsStarted === 0) return 0;
      return Math.round((this.totalJobsCompleted / this.totalJobsStarted) * 100);
    }
    
    /**
     * Get worker's response rate
     * @returns {number} Response rate percentage
     */
    getResponseRate() {
      if (this.totalMessagesReceived === 0) return 0;
      return Math.round((this.totalMessagesResponded / this.totalMessagesReceived) * 100);
    }
    
    /**
     * Check if worker is available for new jobs
     * @returns {boolean} Availability status
     */
    isAvailable() {
      return this.availabilityStatus === 'available' && this.isActive;
    }
    
    /**
     * Get worker's primary skills (top 5 by proficiency)
     * @returns {Array} Primary skills
     */
    getPrimarySkills() {
      if (!this.skills || !Array.isArray(this.skills)) return [];
      
      return this.skills
        .sort((a, b) => (b.proficiencyLevel || 0) - (a.proficiencyLevel || 0))
        .slice(0, 5)
        .map(skill => ({
          name: skill.skillName,
          proficiency: skill.proficiencyLevel,
          yearsOfExperience: skill.yearsOfExperience
        }));
    }
    
    /**
     * Calculate profile completion percentage
     * @returns {number} Profile completion percentage
     */
    getProfileCompletionPercentage() {
      const requiredFields = [
        'bio',
        'hourlyRate',
        'availabilityStatus',
        'location',
        'skills',
        'portfolioItems'
      ];
      
      let completedFields = 0;
      
      if (this.bio && this.bio.length >= 50) completedFields++;
      if (this.hourlyRate > 0) completedFields++;
      if (this.availabilityStatus) completedFields++;
      if (this.location) completedFields++;
      if (this.skills && this.skills.length > 0) completedFields++;
      if (this.portfolioItems && this.portfolioItems.length > 0) completedFields++;
      
      return Math.round((completedFields / requiredFields.length) * 100);
    }
    
    /**
     * Get worker's specialization categories
     * @returns {Array} Specialization categories
     */
    getSpecializations() {
      const specializations = this.specializations || [];
      return Array.isArray(specializations) ? specializations : [];
    }
    
    /**
     * Get formatted hourly rate range
     * @returns {Object} Rate range
     */
    getHourlyRateRange() {
      return {
        min: this.hourlyRateMin || this.hourlyRate,
        max: this.hourlyRateMax || this.hourlyRate,
        currency: this.currency || 'GHS'
      };
    }
    
    /**
     * Check if worker meets job requirements
     * @param {Object} jobRequirements - Job requirements
     * @returns {Object} Match result
     */
    matchesJobRequirements(jobRequirements) {
      const {
        requiredSkills = [],
        minRating = 0,
        maxBudget = Infinity,
        location = null,
        experienceLevel = null
      } = jobRequirements;
      
      const result = {
        matches: true,
        score: 0,
        reasons: []
      };
      
      // Check skills match
      const workerSkills = this.skills || [];
      const skillMatches = requiredSkills.filter(reqSkill =>
        workerSkills.some(workerSkill => 
          workerSkill.skillName.toLowerCase().includes(reqSkill.toLowerCase()) ||
          reqSkill.toLowerCase().includes(workerSkill.skillName.toLowerCase())
        )
      );
      
      const skillMatchRatio = requiredSkills.length > 0 
        ? skillMatches.length / requiredSkills.length 
        : 1;
      
      if (skillMatchRatio < 0.5) {
        result.matches = false;
        result.reasons.push('Insufficient skill match');
      }
      
      result.score += skillMatchRatio * 40; // 40% weight for skills
      
      // Check rating
      if (this.rating < minRating) {
        result.matches = false;
        result.reasons.push('Rating below requirement');
      } else {
        result.score += Math.min(this.rating / 5, 1) * 20; // 20% weight for rating
      }
      
      // Check budget compatibility
      if (this.hourlyRate > maxBudget) {
        result.matches = false;
        result.reasons.push('Rate above budget');
      } else {
        const budgetScore = maxBudget > 0 
          ? Math.max(0, 1 - this.hourlyRate / maxBudget) 
          : 1;
        result.score += budgetScore * 20; // 20% weight for budget
      }
      
      // Check location (if specified)
      if (location && this.location) {
        const locationMatch = this.location.toLowerCase().includes(location.toLowerCase()) ||
                             location.toLowerCase().includes(this.location.toLowerCase());
        if (locationMatch) {
          result.score += 10; // 10% bonus for location match
        }
      }
      
      // Check availability
      if (this.isAvailable()) {
        result.score += 10; // 10% bonus for availability
      } else {
        result.reasons.push('Currently unavailable');
      }
      
      result.score = Math.round(result.score);
      return result;
    }
  }
  
  WorkerProfile.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 2000]
      }
    },
    hourlyRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 10000
      }
    },
    hourlyRateMin: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    hourlyRateMax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'GHS',
      allowNull: false
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      validate: {
        min: -90,
        max: 90
      }
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      validate: {
        min: -180,
        max: 180
      }
    },
    serviceRadius: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Service radius in kilometers',
      validate: {
        min: 1,
        max: 500
      }
    },
    availabilityStatus: {
      type: DataTypes.ENUM('available', 'busy', 'unavailable', 'vacation'),
      defaultValue: 'available',
      allowNull: false
    },
    availableHours: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Weekly availability schedule',
      defaultValue: {
        monday: { start: '09:00', end: '17:00', available: true },
        tuesday: { start: '09:00', end: '17:00', available: true },
        wednesday: { start: '09:00', end: '17:00', available: true },
        thursday: { start: '09:00', end: '17:00', available: true },
        friday: { start: '09:00', end: '17:00', available: true },
        saturday: { start: '09:00', end: '13:00', available: false },
        sunday: { start: '09:00', end: '13:00', available: false }
      }
    },
    experienceLevel: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
      allowNull: true
    },
    yearsOfExperience: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 50
      }
    },
    specializations: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of specialization categories'
    },
    languages: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: ['English'],
      comment: 'Languages spoken by the worker'
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5
      }
    },
    totalReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    totalJobsCompleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    totalJobsStarted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    totalEarnings: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      allowNull: false
    },
    responseTimeAvg: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Average response time in minutes'
    },
    totalMessagesReceived: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    totalMessagesResponded: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    profilePicture: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    coverPhoto: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    socialMedia: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Social media links'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    verificationLevel: {
      type: DataTypes.ENUM('none', 'basic', 'enhanced', 'premium'),
      defaultValue: 'none',
      allowNull: false
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    pausedUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Profile paused until this date'
    },
    emergencyContact: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Emergency contact information'
    },
    preferences: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Worker preferences and settings'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional metadata'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'WorkerProfile',
    tableName: 'worker_profiles',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
        unique: true
      },
      {
        fields: ['availabilityStatus']
      },
      {
        fields: ['location']
      },
      {
        fields: ['rating']
      },
      {
        fields: ['hourlyRate']
      },
      {
        fields: ['experienceLevel']
      },
      {
        fields: ['isVerified']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['specializations'],
        using: 'gin'
      },
      {
        fields: ['latitude', 'longitude'],
        name: 'worker_profiles_location_idx'
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['updatedAt']
      }
    ],
    scopes: {
      active: {
        where: {
          isActive: true
        }
      },
      available: {
        where: {
          availabilityStatus: 'available',
          isActive: true
        }
      },
      verified: {
        where: {
          isVerified: true
        }
      },
      byLocation: (location) => ({
        where: {
          location: {
            [DataTypes.Op.iLike]: `%${location}%`
          }
        }
      }),
      byRating: (minRating) => ({
        where: {
          rating: {
            [DataTypes.Op.gte]: minRating
          }
        }
      }),
      byRate: (maxRate) => ({
        where: {
          hourlyRate: {
            [DataTypes.Op.lte]: maxRate
          }
        }
      })
    }
  });
  
  return WorkerProfile;
};