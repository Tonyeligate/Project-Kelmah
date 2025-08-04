/**
 * Skill Categories Model
 * Organizes skills into categories for better management
 */

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class SkillCategory extends Model {
    static associate(models) {
      SkillCategory.hasMany(models.Skill, {
        foreignKey: 'categoryId',
        as: 'skills'
      });
      
      SkillCategory.belongsTo(models.SkillCategory, {
        foreignKey: 'parentId',
        as: 'parent'
      });
      
      SkillCategory.hasMany(models.SkillCategory, {
        foreignKey: 'parentId',
        as: 'children'
      });
    }
    
    /**
     * Get full category path
     * @returns {string} Full category path
     */
    getFullPath() {
      if (!this.parent) return this.name;
      return `${this.parent.getFullPath()} > ${this.name}`;
    }
    
    /**
     * Check if category has subcategories
     * @returns {boolean} True if has children
     */
    hasChildren() {
      return this.children && this.children.length > 0;
    }
    
    /**
     * Get category depth level
     * @returns {number} Depth level (0 for root)
     */
    getDepthLevel() {
      if (!this.parentId) return 0;
      // This would need recursive query in real implementation
      return 1; // Simplified for now
    }
    
    /**
     * Get total skills count including subcategories
     * @returns {Promise<number>} Total skills count
     */
    async getTotalSkillsCount() {
      const { Skill } = require('./');
      
      // Count direct skills
      let count = await Skill.count({
        where: {
          categoryId: this.id,
          isActive: true
        }
      });
      
      // Add skills from subcategories
      if (this.children) {
        for (const child of this.children) {
          count += await child.getTotalSkillsCount();
        }
      }
      
      return count;
    }
    
    /**
     * Get category statistics
     * @returns {Promise<Object>} Category statistics
     */
    async getStatistics() {
      const { Skill, WorkerSkill } = require('./');
      
      const skills = await Skill.findAll({
        where: {
          categoryId: this.id,
          isActive: true
        },
        include: [{
          model: WorkerSkill,
          as: 'workerSkills',
          where: { isActive: true },
          required: false
        }]
      });
      
      const totalSkills = skills.length;
      const totalWorkers = skills.reduce((sum, skill) => sum + (skill.totalWorkers || 0), 0);
      const totalJobs = skills.reduce((sum, skill) => sum + (skill.totalJobs || 0), 0);
      const averageRate = skills.reduce((sum, skill) => sum + (skill.averageHourlyRate || 0), 0) / totalSkills || 0;
      const averageDemand = skills.reduce((sum, skill) => sum + (skill.demandScore || 0), 0) / totalSkills || 0;
      
      return {
        totalSkills,
        totalWorkers,
        totalJobs,
        averageHourlyRate: Math.round(averageRate * 100) / 100,
        averageDemandScore: Math.round(averageDemand * 100) / 100,
        topSkills: skills
          .sort((a, b) => (b.totalWorkers || 0) - (a.totalWorkers || 0))
          .slice(0, 5)
          .map(skill => ({
            id: skill.id,
            name: skill.name,
            workerCount: skill.totalWorkers,
            averageRate: skill.averageHourlyRate
          }))
      };
    }
  }
  
  SkillCategory.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
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
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'skill_categories',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    icon: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Icon URL or icon name'
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: true,
      validate: {
        is: /^#[0-9A-F]{6}$/i
      },
      comment: 'Category color code'
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true
      },
      comment: 'Category image URL'
    },
    keywords: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Search keywords for this category'
    },
    skillsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Cached count of skills in this category'
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
      comment: 'Mark as popular category'
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Featured on homepage'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Display order'
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Hierarchy level (0 = root)'
    },
    path: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Full category path for quick lookups'
    },
    seoTitle: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'SEO optimized title'
    },
    seoDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'SEO meta description'
    },
    requirements: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Common requirements for skills in this category'
    },
    safetyGuidelines: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Safety guidelines for this category'
    },
    commonTools: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Common tools used in this category'
    },
    averageRateRange: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Average rate range for skills in this category'
    },
    demandTrend: {
      type: DataTypes.ENUM('increasing', 'stable', 'decreasing'),
      allowNull: true,
      comment: 'Overall demand trend for this category'
    },
    seasonality: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Seasonal demand patterns'
    },
    relatedCategories: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'IDs of related categories'
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
    modelName: 'SkillCategory',
    tableName: 'skill_categories',
    timestamps: true,
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['slug'],
        unique: true
      },
      {
        fields: ['parentId']
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
        fields: ['level']
      },
      {
        fields: ['sortOrder']
      },
      {
        fields: ['path']
      },
      {
        fields: ['skillsCount']
      },
      {
        fields: ['keywords'],
        using: 'gin'
      },
      {
        fields: ['commonTools'],
        using: 'gin'
      }
    ],
    hooks: {
      beforeCreate: (category) => {
        // Generate slug from name if not provided
        if (!category.slug) {
          category.slug = category.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
        }
        
        // Generate keywords from name
        if (!category.keywords || category.keywords.length === 0) {
          category.keywords = category.name
            .toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 2);
        }
      },
      
      beforeUpdate: (category) => {
        // Update slug if name changed
        if (category.changed('name') && !category.changed('slug')) {
          category.slug = category.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
        }
        
        // Update keywords if name changed
        if (category.changed('name')) {
          category.keywords = category.name
            .toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 2);
        }
      },
      
      afterCreate: async (category) => {
        // Update parent skills count if this is a subcategory
        if (category.parentId) {
          await SkillCategory.updateSkillsCount(category.parentId);
        }
      },
      
      afterDestroy: async (category) => {
        // Update parent skills count
        if (category.parentId) {
          await SkillCategory.updateSkillsCount(category.parentId);
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
      roots: {
        where: {
          parentId: null,
          isActive: true
        }
      },
      withChildren: {
        include: [{
          model: sequelize.models.SkillCategory,
          as: 'children',
          where: { isActive: true },
          required: false
        }]
      },
      withSkills: {
        include: [{
          model: sequelize.models.Skill,
          as: 'skills',
          where: { isActive: true },
          required: false
        }]
      }
    }
  });
  
  // Class methods
  SkillCategory.getRootCategories = async function(options = {}) {
    return await this.scope('roots').findAll({
      order: [
        ['sortOrder', 'ASC'],
        ['isPopular', 'DESC'],
        ['name', 'ASC']
      ],
      ...options
    });
  };
  
  SkillCategory.getCategoryTree = async function() {
    const categories = await this.findAll({
      where: { isActive: true },
      order: [
        ['level', 'ASC'],
        ['sortOrder', 'ASC'],
        ['name', 'ASC']
      ]
    });
    
    // Build tree structure
    const categoryMap = new Map();
    const rootCategories = [];
    
    // First pass: create map
    categories.forEach(category => {
      categoryMap.set(category.id, {
        ...category.toJSON(),
        children: []
      });
    });
    
    // Second pass: build tree
    categories.forEach(category => {
      const categoryData = categoryMap.get(category.id);
      
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children.push(categoryData);
        }
      } else {
        rootCategories.push(categoryData);
      }
    });
    
    return rootCategories;
  };
  
  SkillCategory.searchCategories = async function(query, options = {}) {
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
          }
        ],
        isActive: true,
        ...options.where
      },
      order: [
        ['isPopular', 'DESC'],
        ['skillsCount', 'DESC'],
        ['name', 'ASC']
      ],
      ...options
    });
  };
  
  SkillCategory.updateSkillsCount = async function(categoryId) {
    const { Skill } = require('./');
    
    const count = await Skill.count({
      where: {
        categoryId,
        isActive: true
      }
    });
    
    await this.update(
      { skillsCount: count },
      { where: { id: categoryId } }
    );
    
    return count;
  };
  
  SkillCategory.getPopularCategories = async function(limit = 10) {
    return await this.scope('popular').findAll({
      limit,
      order: [
        ['skillsCount', 'DESC'],
        ['name', 'ASC']
      ]
    });
  };
  
  SkillCategory.getFeaturedCategories = async function() {
    return await this.scope('featured').findAll({
      order: [
        ['sortOrder', 'ASC'],
        ['name', 'ASC']
      ]
    });
  };
  
  return SkillCategory;
};