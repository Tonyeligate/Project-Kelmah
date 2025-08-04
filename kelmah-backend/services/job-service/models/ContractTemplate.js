const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * Contract Template Schema for Ghana Trade Services
 * Stores predefined and custom contract templates with legal compliance
 */
const ContractTemplateSchema = new Schema(
  {
    // Basic template information
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    
    description: {
      type: String,
      required: true,
      maxlength: 500
    },
    
    category: {
      type: String,
      required: true,
      enum: [
        'plumbing',
        'electrical', 
        'carpentry',
        'painting',
        'cleaning',
        'security',
        'gardening',
        'masonry',
        'general'
      ]
    },
    
    // Template metadata
    isActive: {
      type: Boolean,
      default: true
    },
    
    isPopular: {
      type: Boolean,
      default: false
    },
    
    isPredefined: {
      type: Boolean,
      default: false // true for system templates, false for user-created
    },
    
    // Estimated project details
    estimatedDuration: {
      type: String,
      required: true // e.g., "1-3 days", "2-4 weeks"
    },
    
    priceRange: {
      min: {
        type: Number,
        min: 0
      },
      max: {
        type: Number,
        min: 0
      },
      currency: {
        type: String,
        default: 'GHS' // Ghana Cedis
      }
    },
    
    // Template content
    template: {
      title: {
        type: String,
        required: true,
        trim: true
      },
      
      scope: {
        type: String,
        required: true,
        maxlength: 2000
      },
      
      terms: {
        type: String,
        required: true,
        maxlength: 10000
      },
      
      // Ghana-specific legal provisions
      ghanaSpecific: {
        type: String,
        maxlength: 3000
      },
      
      // Payment terms template
      paymentTerms: {
        type: String,
        maxlength: 2000
      },
      
      // Warranty and guarantee clauses
      warrantyTerms: {
        type: String,
        maxlength: 1500
      }
    },
    
    // Template features and capabilities
    features: [{
      type: String,
      maxlength: 200
    }],
    
    // Legal compliance requirements
    legalClauses: [{
      type: String,
      maxlength: 300
    }],
    
    // Required deliverables for this type of work
    defaultDeliverables: [{
      name: {
        type: String,
        required: true,
        maxlength: 200
      },
      description: {
        type: String,
        maxlength: 500
      },
      isRequired: {
        type: Boolean,
        default: true
      }
    }],
    
    // Default milestones for this type of work
    defaultMilestones: [{
      title: {
        type: String,
        required: true,
        maxlength: 200
      },
      description: {
        type: String,
        maxlength: 500
      },
      percentage: {
        type: Number,
        min: 0,
        max: 100
      },
      order: {
        type: Number,
        required: true
      }
    }],
    
    // Usage statistics
    usage: {
      timesUsed: {
        type: Number,
        default: 0
      },
      lastUsed: {
        type: Date
      },
      successRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      }
    },
    
    // Template customization options
    customizationOptions: {
      allowPriceModification: {
        type: Boolean,
        default: true
      },
      allowTermsModification: {
        type: Boolean,
        default: true
      },
      allowMilestoneModification: {
        type: Boolean,
        default: true
      },
      requiredFields: [{
        fieldName: String,
        displayName: String,
        fieldType: {
          type: String,
          enum: ['text', 'number', 'date', 'select', 'textarea']
        },
        isRequired: {
          type: Boolean,
          default: false
        },
        options: [String] // for select fields
      }]
    },
    
    // Version control
    version: {
      type: String,
      default: '1.0.0'
    },
    
    // Creator information (for custom templates)
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    
    // Approval status for custom templates
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved' // predefined templates are auto-approved
    },
    
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    
    approvedAt: {
      type: Date
    },
    
    // Ghana-specific compliance
    ghanaCompliance: {
      hasGhanaLegalReview: {
        type: Boolean,
        default: false
      },
      
      applicableLaws: [{
        type: String,
        enum: [
          'Ghana Building Code',
          'Labour Act 2003',
          'Environmental Protection Agency Act',
          'Ghana Water Company Regulations',
          'Electricity Company Ghana Standards',
          'Electronic Transactions Act',
          'Contract Act 1960',
          'Professional Bodies Registration Act'
        ]
      }],
      
      requiredPermits: [{
        permitName: String,
        issuingAuthority: String,
        isRequired: Boolean
      }],
      
      emergencyContacts: [{
        service: String, // e.g., 'Police', 'Fire Service', 'ECG'
        number: String,
        description: String
      }]
    },
    
    // SEO and search optimization
    tags: [{
      type: String,
      lowercase: true,
      trim: true
    }],
    
    searchKeywords: [{
      type: String,
      lowercase: true,
      trim: true
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for efficient querying
ContractTemplateSchema.index({ category: 1, isActive: 1 });
ContractTemplateSchema.index({ isPopular: 1, isActive: 1 });
ContractTemplateSchema.index({ tags: 1 });
ContractTemplateSchema.index({ searchKeywords: 1 });
ContractTemplateSchema.index({ 'usage.timesUsed': -1 });
ContractTemplateSchema.index({ createdAt: -1 });

// Text search index for searching templates
ContractTemplateSchema.index({
  name: 'text',
  description: 'text',
  'template.title': 'text',
  'template.scope': 'text',
  tags: 'text',
  searchKeywords: 'text'
});

// Virtual for formatted price range
ContractTemplateSchema.virtual('formattedPriceRange').get(function() {
  if (this.priceRange && this.priceRange.min && this.priceRange.max) {
    return `₵${this.priceRange.min.toLocaleString()} - ₵${this.priceRange.max.toLocaleString()}`;
  }
  return 'Price on request';
});

// Virtual for completion rate
ContractTemplateSchema.virtual('completionRate').get(function() {
  return this.usage.successRate || 0;
});

// Pre-save middleware to update search keywords
ContractTemplateSchema.pre('save', function(next) {
  // Auto-generate search keywords from name, description, and features
  const keywords = new Set();
  
  // Add words from name and description
  const nameWords = this.name.toLowerCase().split(/\s+/);
  const descWords = this.description.toLowerCase().split(/\s+/);
  
  [...nameWords, ...descWords].forEach(word => {
    if (word.length > 2) keywords.add(word);
  });
  
  // Add category
  keywords.add(this.category);
  
  // Add features
  this.features.forEach(feature => {
    const words = feature.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 2) keywords.add(word);
    });
  });
  
  this.searchKeywords = Array.from(keywords);
  next();
});

// Static method to find templates by category
ContractTemplateSchema.statics.findByCategory = function(category) {
  return this.find({ 
    category: category, 
    isActive: true,
    approvalStatus: 'approved'
  }).sort({ isPopular: -1, 'usage.timesUsed': -1 });
};

// Static method to find popular templates
ContractTemplateSchema.statics.findPopular = function(limit = 10) {
  return this.find({ 
    isPopular: true, 
    isActive: true,
    approvalStatus: 'approved'
  })
  .sort({ 'usage.timesUsed': -1 })
  .limit(limit);
};

// Static method to search templates
ContractTemplateSchema.statics.searchTemplates = function(query, category = null, limit = 20) {
  const searchCriteria = {
    $text: { $search: query },
    isActive: true,
    approvalStatus: 'approved'
  };
  
  if (category && category !== 'all') {
    searchCriteria.category = category;
  }
  
  return this.find(searchCriteria, { score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" }, 'usage.timesUsed': -1 })
    .limit(limit);
};

// Instance method to increment usage
ContractTemplateSchema.methods.incrementUsage = function() {
  this.usage.timesUsed += 1;
  this.usage.lastUsed = new Date();
  return this.save();
};

// Instance method to update success rate
ContractTemplateSchema.methods.updateSuccessRate = function(isSuccessful) {
  // Simple moving average for success rate
  const currentRate = this.usage.successRate || 0;
  const totalUses = this.usage.timesUsed || 1;
  
  if (isSuccessful) {
    this.usage.successRate = ((currentRate * (totalUses - 1)) + 100) / totalUses;
  } else {
    this.usage.successRate = (currentRate * (totalUses - 1)) / totalUses;
  }
  
  return this.save();
};

// Instance method to generate contract from template
ContractTemplateSchema.methods.generateContract = function(customData) {
  const contractData = {
    templateId: this._id,
    templateName: this.name,
    title: customData.title || this.template.title,
    scope: this.template.scope,
    terms: this.template.terms,
    ghanaSpecific: this.template.ghanaSpecific,
    
    // Custom fields
    clientName: customData.clientName,
    workerName: customData.workerName,
    projectLocation: customData.projectLocation,
    startDate: customData.startDate,
    completionDate: customData.completionDate,
    totalAmount: customData.totalAmount,
    depositAmount: customData.depositAmount,
    specialInstructions: customData.specialInstructions,
    
    // Default milestones
    milestones: this.defaultMilestones.map(milestone => ({
      ...milestone.toObject(),
      status: 'pending',
      amount: customData.totalAmount ? 
        (customData.totalAmount * milestone.percentage / 100) : 0
    })),
    
    // Default deliverables
    deliverables: this.defaultDeliverables.map(deliverable => ({
      ...deliverable.toObject(),
      status: 'pending'
    })),
    
    category: this.category,
    createdAt: new Date(),
    status: 'draft'
  };
  
  return contractData;
};

// Export the model
module.exports = mongoose.model("ContractTemplate", ContractTemplateSchema);