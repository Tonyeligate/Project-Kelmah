/**
 * Worker Skills Model
 * Manages skills associated with worker profiles
 */

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class WorkerSkill extends Model {
    static associate(models) {
      WorkerSkill.belongsTo(models.WorkerProfile, {
        foreignKey: 'workerProfileId',
        as: 'workerProfile'
      });
      
      WorkerSkill.belongsTo(models.Skill, {
        foreignKey: 'skillId',
        as: 'skill',
        onDelete: 'CASCADE'
      });
    }
    
    /**
     * Get proficiency level as text
     * @returns {string} Proficiency description
     */
    getProficiencyText() {
      const levels = {
        1: 'Beginner',
        2: 'Basic',
        3: 'Intermediate',
        4: 'Advanced',
        5: 'Expert'
      };
      return levels[this.proficiencyLevel] || 'Unknown';
    }
    
    /**
     * Calculate skill experience score
     * @returns {number} Experience score (0-100)
     */
    getExperienceScore() {
      const proficiencyWeight = this.proficiencyLevel * 20; // Max 100 points
      const experienceWeight = Math.min(this.yearsOfExperience * 5, 50); // Max 50 bonus points
      const certificationBonus = this.isCertified ? 20 : 0; // 20 bonus points
      
      return Math.min(100, proficiencyWeight + experienceWeight + certificationBonus);
    }
    
    /**
     * Check if skill is recently updated
     * @returns {boolean} True if updated within last 30 days
     */
    isRecentlyUpdated() {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return this.updatedAt > thirtyDaysAgo;
    }
    
    /**
     * Get skill category based on name
     * @returns {string} Skill category
     */
    getCategory() {
      const categories = {
        'electrical': ['electrical', 'wiring', 'circuit', 'voltage', 'electrical installation'],
        'plumbing': ['plumbing', 'pipe', 'drainage', 'water', 'plumber'],
        'carpentry': ['carpentry', 'wood', 'furniture', 'cabinet', 'carpenter'],
        'masonry': ['masonry', 'brick', 'concrete', 'stone', 'construction'],
        'hvac': ['hvac', 'air conditioning', 'heating', 'ventilation', 'cooling'],
        'painting': ['painting', 'paint', 'decorator', 'interior design'],
        'landscaping': ['landscaping', 'garden', 'lawn', 'plants', 'outdoor'],
        'automotive': ['automotive', 'car', 'mechanic', 'engine', 'vehicle'],
        'technology': ['programming', 'software', 'computer', 'IT', 'web'],
        'general': []
      };
      
      const skillName = this.skillName.toLowerCase();
      
      for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => skillName.includes(keyword))) {
          return category;
        }
      }
      
      return 'general';
    }
    
    /**
     * Get skill demand level based on market data
     * @returns {string} Demand level
     */
    getDemandLevel() {
      // This would typically come from market analysis
      // For now, return based on common high-demand skills
      const highDemandSkills = [
        'electrical installation',
        'plumbing',
        'hvac',
        'solar installation',
        'smart home setup',
        'bathroom renovation',
        'kitchen installation'
      ];
      
      const skillName = this.skillName.toLowerCase();
      const isHighDemand = highDemandSkills.some(skill => 
        skillName.includes(skill) || skill.includes(skillName)
      );
      
      return isHighDemand ? 'high' : 'medium';
    }
  }
  
  WorkerSkill.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    workerProfileId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'worker_profiles',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    skillId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'skills',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    skillName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    proficiencyLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      validate: {
        min: 1,
        max: 5
      },
      comment: '1=Beginner, 2=Basic, 3=Intermediate, 4=Advanced, 5=Expert'
    },
    yearsOfExperience: {
      type: DataTypes.DECIMAL(4, 1),
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 50
      }
    },
    isCertified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    certificationName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    certificationIssuer: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    certificationDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    certificationExpiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    certificationUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Is this a primary skill for the worker'
    },
    hourlyRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      },
      comment: 'Specific hourly rate for this skill (overrides profile rate)'
    },
    availability: {
      type: DataTypes.ENUM('available', 'limited', 'unavailable'),
      defaultValue: 'available',
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000]
      }
    },
    keywords: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Additional keywords for search optimization'
    },
    projectsCompleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    lastUsedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last date this skill was used in a project'
    },
    endorsements: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Number of client endorsements for this skill'
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5
      },
      comment: 'Average rating for this specific skill'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether this skill has been verified by the platform'
    },
    verifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID of the user/admin who verified this skill'
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    portfolio: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Portfolio items specifically for this skill'
    },
    tags: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Tags for categorization and search'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Order in which skills should be displayed'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional metadata for the skill'
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
    modelName: 'WorkerSkill',
    tableName: 'worker_skills',
    timestamps: true,
    indexes: [
      {
        fields: ['workerProfileId']
      },
      {
        fields: ['skillId']
      },
      {
        fields: ['skillName']
      },
      {
        fields: ['proficiencyLevel']
      },
      {
        fields: ['isPrimary']
      },
      {
        fields: ['isCertified']
      },
      {
        fields: ['isVerified']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['availability']
      },
      {
        fields: ['rating']
      },
      {
        fields: ['workerProfileId', 'isPrimary']
      },
      {
        fields: ['keywords'],
        using: 'gin'
      },
      {
        fields: ['tags'],
        using: 'gin'
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['lastUsedDate']
      }
    ],
    hooks: {
      beforeSave: async (workerSkill) => {
        // Auto-generate keywords from skill name
        if (workerSkill.skillName && !workerSkill.keywords) {
          const keywords = workerSkill.skillName
            .toLowerCase()
            .split(/[\s,.-]+/)
            .filter(word => word.length > 2);
          workerSkill.keywords = [...new Set(keywords)];
        }
        
        // Set tags based on category
        if (!workerSkill.tags || workerSkill.tags.length === 0) {
          const category = workerSkill.getCategory();
          workerSkill.tags = [category];
        }
      },
      
      afterCreate: async (workerSkill) => {
        // Update worker profile skills count
        const { WorkerProfile } = require('./');
        const profile = await WorkerProfile.findByPk(workerSkill.workerProfileId);
        if (profile) {
          const skillsCount = await WorkerSkill.count({
            where: { workerProfileId: profile.id, isActive: true }
          });
          // Update skills count in profile if such field exists
        }
      }
    },
    scopes: {
      active: {
        where: {
          isActive: true
        }
      },
      primary: {
        where: {
          isPrimary: true,
          isActive: true
        }
      },
      certified: {
        where: {
          isCertified: true
        }
      },
      verified: {
        where: {
          isVerified: true
        }
      },
      available: {
        where: {
          availability: 'available',
          isActive: true
        }
      },
      byProficiency: (minLevel) => ({
        where: {
          proficiencyLevel: {
            [DataTypes.Op.gte]: minLevel
          }
        }
      }),
      byCategory: (category) => ({
        where: {
          tags: {
            [DataTypes.Op.contains]: [category]
          }
        }
      }),
      recentlyUsed: {
        where: {
          lastUsedDate: {
            [DataTypes.Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
          }
        }
      }
    }
  });
  
  // Class methods for skill management
  WorkerSkill.findByWorker = async function(workerProfileId, options = {}) {
    return await this.findAll({
      where: {
        workerProfileId,
        isActive: true,
        ...options.where
      },
      order: [
        ['isPrimary', 'DESC'],
        ['proficiencyLevel', 'DESC'],
        ['rating', 'DESC'],
        ['sortOrder', 'ASC']
      ],
      ...options
    });
  };
  
  WorkerSkill.searchSkills = async function(query, options = {}) {
    const { Op } = require('sequelize');
    
    return await this.findAll({
      where: {
        [Op.or]: [
          {
            skillName: {
              [Op.iLike]: `%${query}%`
            }
          },
          {
            keywords: {
              [Op.contains]: [query.toLowerCase()]
            }
          },
          {
            tags: {
              [Op.contains]: [query.toLowerCase()]
            }
          }
        ],
        isActive: true,
        ...options.where
      },
      order: [
        ['proficiencyLevel', 'DESC'],
        ['rating', 'DESC']
      ],
      ...options
    });
  };
  
  WorkerSkill.getSkillStatistics = async function(workerProfileId) {
    const skills = await this.findAll({
      where: {
        workerProfileId,
        isActive: true
      }
    });
    
    return {
      totalSkills: skills.length,
      primarySkills: skills.filter(s => s.isPrimary).length,
      certifiedSkills: skills.filter(s => s.isCertified).length,
      verifiedSkills: skills.filter(s => s.isVerified).length,
      averageProficiency: skills.reduce((sum, s) => sum + s.proficiencyLevel, 0) / skills.length || 0,
      totalExperience: skills.reduce((sum, s) => sum + (s.yearsOfExperience || 0), 0),
      averageRating: skills.reduce((sum, s) => sum + (s.rating || 0), 0) / skills.length || 0,
      categories: [...new Set(skills.map(s => s.getCategory()))]
    };
  };
  
  return WorkerSkill;
};