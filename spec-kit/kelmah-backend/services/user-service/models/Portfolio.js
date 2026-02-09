/**
 * Portfolio Model
 * Manages portfolio items for worker profiles
 */

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Portfolio extends Model {
    static associate(models) {
      Portfolio.belongsTo(models.WorkerProfile, {
        foreignKey: 'workerProfileId',
        as: 'workerProfile'
      });
      
      Portfolio.belongsTo(models.Skill, {
        foreignKey: 'primarySkillId',
        as: 'primarySkill'
      });
    }
    
    /**
     * Get portfolio item status
     * @returns {string} Status description
     */
    getStatusText() {
      const statuses = {
        'draft': 'Draft',
        'published': 'Published',
        'archived': 'Archived',
        'featured': 'Featured'
      };
      return statuses[this.status] || 'Unknown';
    }
    
    /**
     * Get main image URL
     * @returns {string|null} Main image URL
     */
    getMainImageUrl() {
      if (this.images && this.images.length > 0) {
        return this.images[0].url || this.images[0];
      }
      return this.mainImage;
    }
    
    /**
     * Get all image URLs
     * @returns {Array} Array of image URLs
     */
    getAllImageUrls() {
      if (this.images && Array.isArray(this.images)) {
        return this.images.map(img => 
          typeof img === 'object' ? img.url : img
        ).filter(Boolean);
      }
      return this.mainImage ? [this.mainImage] : [];
    }
    
    /**
     * Check if portfolio item is published and visible
     * @returns {boolean} True if visible
     */
    isVisible() {
      return this.status === 'published' && this.isActive;
    }
    
    /**
     * Get project duration in readable format
     * @returns {string} Duration text
     */
    getDurationText() {
      if (!this.startDate) return 'Duration not specified';
      
      const start = new Date(this.startDate);
      const end = this.endDate ? new Date(this.endDate) : new Date();
      
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks !== 1 ? 's' : ''}`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months !== 1 ? 's' : ''}`;
      } else {
        const years = Math.floor(diffDays / 365);
        return `${years} year${years !== 1 ? 's' : ''}`;
      }
    }
    
    /**
     * Get skills used in this project
     * @returns {Array} Skills array
     */
    getSkillsUsed() {
      return this.skillsUsed || [];
    }
    
    /**
     * Calculate project complexity score
     * @returns {number} Complexity score (1-10)
     */
    getComplexityScore() {
      let score = 1;
      
      // Base on project value
      if (this.projectValue) {
        if (this.projectValue > 10000) score += 3;
        else if (this.projectValue > 5000) score += 2;
        else if (this.projectValue > 1000) score += 1;
      }
      
      // Base on skills count
      const skillsCount = this.getSkillsUsed().length;
      score += Math.min(skillsCount, 3);
      
      // Base on duration
      if (this.startDate && this.endDate) {
        const duration = new Date(this.endDate) - new Date(this.startDate);
        const days = duration / (1000 * 60 * 60 * 24);
        if (days > 90) score += 2;
        else if (days > 30) score += 1;
      }
      
      // Base on client satisfaction
      if (this.clientRating >= 5) score += 1;
      
      return Math.min(10, Math.max(1, score));
    }
    
    /**
     * Get portfolio item summary for display
     * @returns {Object} Summary data
     */
    getSummary() {
      return {
        id: this.id,
        title: this.title,
        description: this.description?.substring(0, 150) + '...',
        mainImage: this.getMainImageUrl(),
        imageCount: this.getAllImageUrls().length,
        projectValue: this.projectValue,
        currency: this.currency,
        duration: this.getDurationText(),
        skillsCount: this.getSkillsUsed().length,
        clientRating: this.clientRating,
        status: this.getStatusText(),
        isVisible: this.isVisible(),
        complexityScore: this.getComplexityScore(),
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };
    }
  }
  
  Portfolio.init({
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
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [5, 200]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 2000]
      }
    },
    projectType: {
      type: DataTypes.ENUM('personal', 'professional', 'freelance', 'volunteer', 'academic'),
      allowNull: true,
      defaultValue: 'professional'
    },
    primarySkillId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'skills',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    skillsUsed: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of skills used in this project'
    },
    mainImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    images: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of image URLs or objects with metadata'
    },
    videos: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of video URLs or objects'
    },
    documents: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of document URLs (certificates, plans, etc.)'
    },
    projectValue: {
      type: DataTypes.DECIMAL(12, 2),
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
    startDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isAfterStart(value) {
          if (value && this.startDate && value < this.startDate) {
            throw new Error('End date must be after start date');
          }
        }
      }
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    clientName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    clientCompany: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    clientRating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 5
      }
    },
    clientTestimonial: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000]
      }
    },
    challenges: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Challenges faced during the project'
    },
    solutions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Solutions implemented'
    },
    outcomes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Project outcomes and results'
    },
    lessonsLearned: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Key learnings from the project'
    },
    toolsUsed: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Tools and equipment used'
    },
    teamSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 100
      }
    },
    role: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Role in the project (lead, member, consultant, etc.)'
    },
    responsibilities: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Specific responsibilities in the project'
    },
    achievements: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Notable achievements or awards'
    },
    externalLinks: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'External links (website, press coverage, etc.)'
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived', 'featured'),
      defaultValue: 'draft',
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    likeCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    shareCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Display order in portfolio'
    },
    tags: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Tags for categorization and search'
    },
    keywords: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'SEO keywords'
    },
    seoTitle: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    seoDescription: {
      type: DataTypes.TEXT,
      allowNull: true
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
    modelName: 'Portfolio',
    tableName: 'portfolios',
    timestamps: true,
    indexes: [
      {
        fields: ['workerProfileId']
      },
      {
        fields: ['primarySkillId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['projectType']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['isFeatured']
      },
      {
        fields: ['startDate']
      },
      {
        fields: ['endDate']
      },
      {
        fields: ['clientRating']
      },
      {
        fields: ['projectValue']
      },
      {
        fields: ['viewCount']
      },
      {
        fields: ['skillsUsed'],
        using: 'gin'
      },
      {
        fields: ['tags'],
        using: 'gin'
      },
      {
        fields: ['keywords'],
        using: 'gin'
      },
      {
        fields: ['toolsUsed'],
        using: 'gin'
      },
      {
        fields: ['workerProfileId', 'status', 'isActive']
      },
      {
        fields: ['createdAt']
      }
    ],
    hooks: {
      beforeCreate: (portfolio) => {
        // Generate keywords from title and description
        if (!portfolio.keywords || portfolio.keywords.length === 0) {
          const titleWords = portfolio.title.toLowerCase().split(/\s+/);
          const descWords = portfolio.description 
            ? portfolio.description.toLowerCase().split(/\s+/) 
            : [];
          
          portfolio.keywords = [...new Set([...titleWords, ...descWords])]
            .filter(word => word.length > 3)
            .slice(0, 20);
        }
        
        // Auto-generate tags from skills and project type
        if (!portfolio.tags || portfolio.tags.length === 0) {
          const tags = [];
          
          if (portfolio.projectType) {
            tags.push(portfolio.projectType);
          }
          
          if (portfolio.skillsUsed && Array.isArray(portfolio.skillsUsed)) {
            tags.push(...portfolio.skillsUsed.slice(0, 5));
          }
          
          portfolio.tags = [...new Set(tags)];
        }
      },
      
      beforeUpdate: (portfolio) => {
        // Update keywords if title or description changed
        if (portfolio.changed('title') || portfolio.changed('description')) {
          const titleWords = portfolio.title.toLowerCase().split(/\s+/);
          const descWords = portfolio.description 
            ? portfolio.description.toLowerCase().split(/\s+/) 
            : [];
          
          portfolio.keywords = [...new Set([...titleWords, ...descWords])]
            .filter(word => word.length > 3)
            .slice(0, 20);
        }
        
        // Update tags if skills or project type changed
        if (portfolio.changed('skillsUsed') || portfolio.changed('projectType')) {
          const tags = [];
          
          if (portfolio.projectType) {
            tags.push(portfolio.projectType);
          }
          
          if (portfolio.skillsUsed && Array.isArray(portfolio.skillsUsed)) {
            tags.push(...portfolio.skillsUsed.slice(0, 5));
          }
          
          portfolio.tags = [...new Set(tags)];
        }
      }
    },
    scopes: {
      published: {
        where: {
          status: 'published',
          isActive: true
        }
      },
      featured: {
        where: {
          isFeatured: true,
          status: 'published',
          isActive: true
        }
      },
      byWorker: (workerProfileId) => ({
        where: {
          workerProfileId
        }
      }),
      bySkill: (skillId) => ({
        where: {
          [DataTypes.Op.or]: [
            { primarySkillId: skillId },
            {
              skillsUsed: {
                [DataTypes.Op.contains]: [skillId]
              }
            }
          ]
        }
      }),
      recent: {
        where: {
          status: 'published',
          isActive: true
        },
        order: [['createdAt', 'DESC']]
      },
      popular: {
        where: {
          status: 'published',
          isActive: true
        },
        order: [['viewCount', 'DESC'], ['likeCount', 'DESC']]
      }
    }
  });
  
  // Class methods
  Portfolio.findByWorker = async function(workerProfileId, options = {}) {
    return await this.findAll({
      where: {
        workerProfileId,
        isActive: true,
        ...options.where
      },
      order: [
        ['isFeatured', 'DESC'],
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC']
      ],
      ...options
    });
  };
  
  Portfolio.searchPortfolio = async function(query, options = {}) {
    const { Op } = require('sequelize');
    
    return await this.findAll({
      where: {
        [Op.or]: [
          {
            title: {
              [Op.iLike]: `%${query}%`
            }
          },
          {
            description: {
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
        status: 'published',
        isActive: true,
        ...options.where
      },
      order: [
        ['isFeatured', 'DESC'],
        ['viewCount', 'DESC'],
        ['createdAt', 'DESC']
      ],
      ...options
    });
  };
  
  Portfolio.getFeaturedPortfolio = async function(limit = 10) {
    return await this.scope('featured').findAll({
      limit,
      order: [
        ['viewCount', 'DESC'],
        ['likeCount', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });
  };
  
  Portfolio.incrementView = async function(portfolioId) {
    return await this.increment('viewCount', {
      where: { id: portfolioId }
    });
  };
  
  Portfolio.incrementLike = async function(portfolioId) {
    return await this.increment('likeCount', {
      where: { id: portfolioId }
    });
  };
  
  Portfolio.incrementShare = async function(portfolioId) {
    return await this.increment('shareCount', {
      where: { id: portfolioId }
    });
  };
  
  return Portfolio;
};