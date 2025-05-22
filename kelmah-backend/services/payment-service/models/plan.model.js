/**
 * Plan Model
 * Defines the structure and behavior of subscription plans in the Kelmah platform
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Plan = sequelize.define('Plan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // Plan identity
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Plan name is required'
      }
    },
    comment: 'Name of the plan'
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Plan slug is required'
      },
      is: {
        args: /^[a-z0-9-]+$/,
        msg: 'Slug can only contain lowercase letters, numbers, and hyphens'
      }
    },
    comment: 'URL-friendly identifier for the plan'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Detailed description of the plan'
  },
  // Plan type and categorization
  type: {
    type: DataTypes.ENUM(
      'freelancer',   // Plans for freelancers
      'hirer',        // Plans for job hirers
      'business',     // Plans for businesses
      'enterprise'    // Enterprise level plans
    ),
    allowNull: false,
    comment: 'Type of plan'
  },
  tier: {
    type: DataTypes.ENUM(
      'free',
      'basic',
      'standard',
      'premium',
      'pro',
      'enterprise',
      'custom'
    ),
    allowNull: false,
    comment: 'Tier level of this plan'
  },
  // Pricing details
  price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Price must be non-negative'
      }
    },
    comment: 'Regular price for this plan'
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'GHS', // Ghanaian Cedi
    allowNull: false
  },
  billingCycle: {
    type: DataTypes.ENUM(
      'monthly',      // Billed monthly
      'quarterly',    // Billed every 3 months
      'semi_annual',  // Billed every 6 months
      'annual',       // Billed yearly
      'one_time'      // One-time payment
    ),
    defaultValue: 'monthly',
    allowNull: false
  },
  // Visibility and status
  isVisible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether this plan is visible to users'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether this plan can be subscribed to'
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this is the default plan for its type'
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether to highlight this plan'
  },
  // Display order
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Order for displaying plans (lower numbers first)'
  },
  // Trial details
  trialDays: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'Trial days must be non-negative'
      }
    },
    comment: 'Number of trial days offered with this plan'
  },
  hasTrial: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this plan offers a trial period'
  },
  trialRequiresCreditCard: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether a credit card is required to start the trial'
  },
  // Features and limits
  features: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Features included in this plan'
  },
  limits: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Usage limits for this plan'
  },
  // Promotion
  isPromoted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this plan is being promoted'
  },
  promoText: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Promotional text to display with this plan'
  },
  // Comparison
  comparePosition: {
    type: DataTypes.ENUM(
      'not_shown',
      'basic',
      'standard',
      'premium'
    ),
    defaultValue: 'not_shown',
    comment: 'Position in plan comparison tables'
  },
  // Availability options
  availableRegions: {
    type: DataTypes.JSON,
    defaultValue: ['all'],
    comment: 'Regions where this plan is available'
  },
  userTypes: {
    type: DataTypes.JSON,
    defaultValue: ['all'],
    comment: 'Types of users who can subscribe to this plan'
  },
  // Discount options
  annualDiscount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'Annual discount must be non-negative'
      },
      max: {
        args: [100],
        msg: 'Annual discount cannot exceed 100%'
      }
    },
    comment: 'Percentage discount for annual billing'
  },
  // Legacy support
  replacedByPlanId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Plans',
      key: 'id'
    },
    comment: 'ID of the plan that replaced this one'
  },
  isLegacy: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this is a legacy plan not offered to new subscribers'
  },
  // Metadata
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional data for this plan'
  }
}, {
  tableName: 'plans',
  timestamps: true, // createdAt and updatedAt
  paranoid: true, // Soft deletes (deletedAt)
  indexes: [
    {
      name: 'plans_slug_idx',
      unique: true,
      fields: ['slug']
    },
    {
      name: 'plans_type_idx',
      fields: ['type']
    },
    {
      name: 'plans_tier_idx',
      fields: ['tier']
    },
    {
      name: 'plans_is_active_idx',
      fields: ['isActive']
    },
    {
      name: 'plans_is_visible_idx',
      fields: ['isVisible']
    },
    {
      name: 'plans_display_order_idx',
      fields: ['displayOrder']
    }
  ],
  hooks: {
    beforeCreate: (plan) => {
      // Generate slug from name if not provided
      if (!plan.slug && plan.name) {
        plan.slug = plan.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }
      
      // Set trial flag based on trial days
      plan.hasTrial = plan.trialDays > 0;
    }
  }
});

/**
 * Class methods
 */

// Find plan by slug
Plan.findBySlug = async function(slug) {
  return await Plan.findOne({
    where: { slug }
  });
};

// Find active plans by type
Plan.findActiveByType = async function(type, options = {}) {
  const { isVisible = true, tier, limit, offset } = options;
  
  const where = {
    type,
    isActive: true
  };
  
  if (isVisible !== undefined) {
    where.isVisible = isVisible;
  }
  
  if (tier) {
    where.tier = tier;
  }
  
  const query = {
    where,
    order: [['displayOrder', 'ASC'], ['price', 'ASC']]
  };
  
  if (limit) {
    query.limit = limit;
  }
  
  if (offset) {
    query.offset = offset;
  }
  
  return await Plan.findAll(query);
};

// Find default plan for a type
Plan.findDefaultByType = async function(type) {
  return await Plan.findOne({
    where: {
      type,
      isDefault: true,
      isActive: true
    }
  });
};

// Find featured plans
Plan.findFeatured = async function() {
  return await Plan.findAll({
    where: {
      isFeatured: true,
      isActive: true,
      isVisible: true
    },
    order: [['displayOrder', 'ASC'], ['price', 'ASC']]
  });
};

// Find plans for comparison
Plan.findForComparison = async function(type) {
  return await Plan.findAll({
    where: {
      type,
      isActive: true,
      isVisible: true,
      comparePosition: {
        [sequelize.Op.ne]: 'not_shown'
      }
    },
    order: [
      sequelize.literal(`CASE
        WHEN "comparePosition" = 'basic' THEN 1
        WHEN "comparePosition" = 'standard' THEN 2
        WHEN "comparePosition" = 'premium' THEN 3
        ELSE 4
      END`)
    ]
  });
};

// Calculate discounted price
Plan.calculateDiscountedPrice = async function(planId, billingCycle) {
  const plan = await Plan.findByPk(planId);
  
  if (!plan) {
    throw new Error('Plan not found');
  }
  
  let price = parseFloat(plan.price);
  
  // Apply annual discount if applicable
  if (billingCycle === 'annual' && plan.annualDiscount > 0) {
    const discountAmount = price * (plan.annualDiscount / 100);
    price = parseFloat((price - discountAmount).toFixed(2));
  }
  
  return price;
};

/**
 * Instance methods
 */

// Get monthly equivalent price
Plan.prototype.getMonthlyEquivalent = function() {
  const price = parseFloat(this.price);
  
  switch (this.billingCycle) {
    case 'monthly':
      return price;
    case 'quarterly':
      return parseFloat((price / 3).toFixed(2));
    case 'semi_annual':
      return parseFloat((price / 6).toFixed(2));
    case 'annual':
      return parseFloat((price / 12).toFixed(2));
    case 'one_time':
      return null; // Not applicable
    default:
      return price;
  }
};

// Get annual equivalent price
Plan.prototype.getAnnualCost = function() {
  const price = parseFloat(this.price);
  
  switch (this.billingCycle) {
    case 'monthly':
      return parseFloat((price * 12).toFixed(2));
    case 'quarterly':
      return parseFloat((price * 4).toFixed(2));
    case 'semi_annual':
      return parseFloat((price * 2).toFixed(2));
    case 'annual':
      return price;
    case 'one_time':
      return price; // One-time cost
    default:
      return price * 12;
  }
};

// Get discounted price based on billing cycle
Plan.prototype.getDiscountedPrice = function(targetBillingCycle) {
  let price = parseFloat(this.price);
  
  // Apply annual discount if applicable
  if (targetBillingCycle === 'annual' && this.annualDiscount > 0) {
    const discountAmount = price * (this.annualDiscount / 100);
    price = parseFloat((price - discountAmount).toFixed(2));
  }
  
  return price;
};

// Check if a feature is included
Plan.prototype.hasFeature = function(featureName) {
  if (!this.features) {
    return false;
  }
  
  return !!this.features[featureName];
};

// Get limit for a specific feature
Plan.prototype.getLimit = function(limitName) {
  if (!this.limits || !this.limits[limitName]) {
    return null; // No limit defined
  }
  
  return this.limits[limitName];
};

// Update plan details
Plan.prototype.updateDetails = async function(updates) {
  // Only update allowed fields
  const allowedFields = [
    'name',
    'description',
    'price',
    'currency',
    'isVisible',
    'isActive',
    'isFeatured',
    'displayOrder',
    'trialDays',
    'trialRequiresCreditCard',
    'features',
    'limits',
    'promoText',
    'isPromoted',
    'comparePosition',
    'annualDiscount',
    'metadata'
  ];
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      this[field] = updates[field];
    }
  }
  
  // Update derived fields
  if (updates.trialDays !== undefined) {
    this.hasTrial = updates.trialDays > 0;
  }
  
  return await this.save();
};

// Create a new version of this plan
Plan.prototype.createNewVersion = async function(updates = {}) {
  // Create a copy of this plan with specified updates
  const newPlanData = {
    name: this.name,
    slug: `${this.slug}-${Date.now()}`,
    description: this.description,
    type: this.type,
    tier: this.tier,
    price: this.price,
    currency: this.currency,
    billingCycle: this.billingCycle,
    isVisible: this.isVisible,
    isActive: true,
    isDefault: this.isDefault,
    isFeatured: this.isFeatured,
    displayOrder: this.displayOrder,
    trialDays: this.trialDays,
    hasTrial: this.hasTrial,
    trialRequiresCreditCard: this.trialRequiresCreditCard,
    features: this.features,
    limits: this.limits,
    isPromoted: this.isPromoted,
    promoText: this.promoText,
    comparePosition: this.comparePosition,
    availableRegions: this.availableRegions,
    userTypes: this.userTypes,
    annualDiscount: this.annualDiscount,
    metadata: {
      ...this.metadata,
      previousVersionId: this.id
    }
  };
  
  // Apply updates
  Object.assign(newPlanData, updates);
  
  // Create new plan
  const newPlan = await Plan.create(newPlanData);
  
  // Mark this plan as legacy
  this.isLegacy = true;
  this.isActive = false;
  this.replacedByPlanId = newPlan.id;
  await this.save();
  
  return newPlan;
};

module.exports = Plan; 