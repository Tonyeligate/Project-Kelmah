/**
 * Skills Master Model
 * Master list of all available skills in the platform
 */

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Skill extends Model {
    static associate(models) {
      Skill.hasMany(models.WorkerSkill, {
        foreignKey: 'skillId',
        as: 'workerSkills'
      });
      
      Skill.belongsTo(models.SkillCategory, {
        foreignKey: 'categoryId',
        as: 'category'
      });
    }
    
    /**
     * Get skill popularity score based on worker count
     * @returns {number} Popularity score (0-100)
     */
    getPopularityScore() {
      if (this.totalWorkers === 0) return 0;
      
      // Normalize based on platform average
      const maxWorkers = 1000; // Adjust based on platform size
      return Math.min(100, (this.totalWorkers / maxWorkers) * 100);
    }
    
    /**
     * Get skill demand level
     * @returns {string} Demand level
     */
    getDemandLevel() {
      const score = this.demandScore || 0;
      
      if (score >= 80) return 'very-high';
      if (score >= 60) return 'high';
      if (score >= 40) return 'medium';
      if (score >= 20) return 'low';
      return 'very-low';
    }
    
    /**
     * Get average hourly rate for this skill
     * @returns {number} Average rate
     */
    getAverageRate() {
      return this.averageHourlyRate || 0;
    }
    
    /**
     * Check if skill is trending
     * @returns {boolean} True if trending
     */
    isTrending() {
      // Consider trending if growth rate > 10% in last 30 days
      return (this.growthRate || 0) > 0.1;
    }
    
    /**
     * Get skill verification requirements
     * @returns {Object} Verification requirements
     */
    getVerificationRequirements() {
      return {
        requiresCertification: this.requiresCertification || false,
        minimumExperience: this.minimumExperience || 0,
        assessmentRequired: this.assessmentRequired || false,
        portfolioRequired: this.portfolioRequired || false
      };
    }
    
    /**
     * Get related skills
     * @returns {Array} Related skill IDs
     */
    getRelatedSkills() {
      return this.relatedSkills || [];
    }
  }
  
  Skill.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    slug: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        is: /^[a-z0-9-]+$/
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'skill_categories',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    keywords: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Search keywords and synonyms'
    },
    aliases: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Alternative names for this skill'
    },
    level: {
      type: DataTypes.ENUM('entry', 'intermediate', 'advanced', 'expert'),
      allowNull: true,
      comment: 'Typical skill level required'
    },
    complexity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 10
      },
      comment: 'Skill complexity rating (1-10)'
    },
    averageHourlyRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Market average hourly rate for this skill'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'GHS',
      allowNull: false
    },
    totalWorkers: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Number of workers with this skill'
    },
    totalJobs: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Number of jobs requiring this skill'
    },
    demandScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      },
      comment: 'Market demand score (0-100)'
    },
    growthRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
      comment: 'Monthly growth rate (-1 to 1)'
    },
    seasonality: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Seasonal demand patterns'
    },
    relatedSkills: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of related skill IDs'
    },
    prerequisites: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Required prerequisite skills'
    },
    tools: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Common tools used with this skill'
    },
    certifications: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Available certifications for this skill'
    },
    requiresCertification: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether certification is required'
    },
    minimumExperience: {
      type: DataTypes.DECIMAL(4, 1),
      allowNull: true,
      comment: 'Minimum years of experience typically required'
    },
    assessmentRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether skill assessment is required'
    },
    portfolioRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether portfolio samples are required'
    },
    safetyRequirements: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Safety requirements and certifications'
    },
    physicalRequirements: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Physical requirements for this skill'
    },
    workEnvironment: {
      type: DataTypes.ENUM('indoor', 'outdoor', 'both', 'office', 'industrial', 'residential'),
      allowNull: true,
      comment: 'Typical work environment'
    },
    riskLevel: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'very-high'),
      defaultValue: 'low',
      allowNull: false,
      comment: 'Risk level associated with this skill'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    isPopular: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Marked as popular skill'
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Featured in skill recommendations'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Display order'
    },
    icon: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Icon URL or name'
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: true,
      validate: {
        is: /^#[0-9A-F]{6}$/i
      },
      comment: 'Associated color code'
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
    modelName: 'Skill',
    tableName: 'skills',
    timestamps: true,
    indexes: [
      {
        fields: ['name'],
        unique: true
      },
      {
        fields: ['slug'],
        unique: true
      },
      {
        fields: ['categoryId']
      },
      {
        fields: ['level']
      },
      {
        fields: ['complexity']
      },
      {
        fields: ['demandScore']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['isPopular']
      },
      {
        fields: ['isFeatured']
      },
      {
        fields: ['totalWorkers']
      },
      {
        fields: ['totalJobs']
      },
      {
        fields: ['keywords'],
        using: 'gin'
      },
      {
        fields: ['aliases'],
        using: 'gin'
      },
      {
        fields: ['tools'],
        using: 'gin'
      },
      {
        fields: ['workEnvironment']
      },
      {
        fields: ['riskLevel']
      },
      {
        fields: ['averageHourlyRate']
      }
    ],
    hooks: {
      beforeCreate: (skill) => {
        // Generate slug from name if not provided
        if (!skill.slug) {
          skill.slug = skill.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
        }
        
        // Generate keywords from name and aliases
        if (!skill.keywords || skill.keywords.length === 0) {
          const nameWords = skill.name.toLowerCase().split(/\s+/);
          const aliasWords = (skill.aliases || []).flatMap(alias => 
            alias.toLowerCase().split(/\s+/)
          );
          skill.keywords = [...new Set([...nameWords, ...aliasWords])];
        }
      },
      
      beforeUpdate: (skill) => {
        // Update slug if name changed
        if (skill.changed('name') && !skill.changed('slug')) {
          skill.slug = skill.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
        }
        
        // Update keywords if name or aliases changed
        if (skill.changed('name') || skill.changed('aliases')) {
          const nameWords = skill.name.toLowerCase().split(/\s+/);
          const aliasWords = (skill.aliases || []).flatMap(alias => 
            alias.toLowerCase().split(/\s+/)
          );
          skill.keywords = [...new Set([...nameWords, ...aliasWords])];
        }
      }
    },
    scopes: {
      active: {
        where: {
          isActive: true
        }
      },
      popular: {
        where: {
          isPopular: true,
          isActive: true
        }
      },
      featured: {
        where: {
          isFeatured: true,
          isActive: true
        }
      },
      byCategory: (categoryId) => ({
        where: {
          categoryId,
          isActive: true
        }
      }),
      byLevel: (level) => ({
        where: {
          level,
          isActive: true
        }
      }),
      highDemand: {
        where: {
          demandScore: {
            [DataTypes.Op.gte]: 70
          },
          isActive: true
        },
        order: [['demandScore', 'DESC']]
      },
      trending: {
        where: {
          growthRate: {
            [DataTypes.Op.gt]: 0.1
          },
          isActive: true
        },
        order: [['growthRate', 'DESC']]
      }
    }
  });
  
  // Class methods
  Skill.searchSkills = async function(query, options = {}) {
    const { Op } = require('sequelize');
    
    return await this.findAll({
      where: {
        [Op.or]: [
          {
            name: {
              [Op.iLike]: `%${query}%`
            }
          },
          {
            keywords: {
              [Op.contains]: [query.toLowerCase()]
            }
          },
          {
            aliases: {
              [Op.contains]: [query.toLowerCase()]
            }
          }
        ],
        isActive: true,
        ...options.where
      },
      order: [
        ['isPopular', 'DESC'],
        ['demandScore', 'DESC'],
        ['totalWorkers', 'DESC']
      ],
      ...options
    });
  };
  
  Skill.getPopularSkills = async function(limit = 10) {
    return await this.scope('popular').findAll({
      limit,
      order: [
        ['totalWorkers', 'DESC'],
        ['demandScore', 'DESC']
      ]
    });
  };
  
  Skill.getTrendingSkills = async function(limit = 10) {
    return await this.scope('trending').findAll({
      limit
    });
  };
  
  Skill.updateMarketData = async function(skillId, data) {
    const { totalWorkers, totalJobs, averageHourlyRate, demandScore, growthRate } = data;
    
    return await this.update({
      totalWorkers,
      totalJobs,
      averageHourlyRate,
      demandScore,
      growthRate
    }, {
      where: { id: skillId }
    });
  };
  
  Skill.getSkillsByCategory = async function(categoryId, options = {}) {
    return await this.scope('byCategory', categoryId).findAll({
      order: [
        ['sortOrder', 'ASC'],
        ['isPopular', 'DESC'],
        ['name', 'ASC']
      ],
      ...options
    });
  };
  
  return Skill;
};