const express = require('express');
const router = express.Router();
const ContractTemplate = require('../models/ContractTemplate');
const Contract = require('../models/Contract');
const { authenticate, authorize } = require('../middlewares/auth');
const { validationResult, body, param, query } = require('express-validator');

/**
 * Contract Templates Routes for Ghana Trade Services
 * Handles CRUD operations for contract templates with Ghana-specific features
 */

// Validation middleware
const validateTemplate = [
  body('name')
    .notEmpty()
    .withMessage('Template name is required')
    .isLength({ max: 200 })
    .withMessage('Template name must be less than 200 characters'),
  
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
    
  body('category')
    .isIn(['plumbing', 'electrical', 'carpentry', 'painting', 'cleaning', 'security', 'gardening', 'masonry', 'general'])
    .withMessage('Invalid category'),
    
  body('estimatedDuration')
    .notEmpty()
    .withMessage('Estimated duration is required'),
    
  body('template.title')
    .notEmpty()
    .withMessage('Template title is required'),
    
  body('template.scope')
    .notEmpty()
    .withMessage('Template scope is required'),
    
  body('template.terms')
    .notEmpty()
    .withMessage('Template terms are required')
];

const validateContractGeneration = [
  body('clientName')
    .notEmpty()
    .withMessage('Client name is required'),
    
  body('workerName')
    .notEmpty()
    .withMessage('Worker name is required'),
    
  body('projectLocation')
    .notEmpty()
    .withMessage('Project location is required'),
    
  body('totalAmount')
    .isNumeric()
    .withMessage('Total amount must be a number')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be positive')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * @route   GET /api/contract-templates
 * @desc    Get all contract templates with filtering and search
 * @access  Public (for approved templates)
 */
router.get('/', async (req, res) => {
  try {
    const {
      category,
      search,
      popular,
      limit = 20,
      page = 1,
      sortBy = 'popularity'
    } = req.query;

    let query = {
      isActive: true,
      approvalStatus: 'approved'
    };

    // Add category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Add popular filter
    if (popular === 'true') {
      query.isPopular = true;
    }

    let templates;
    
    // Handle search
    if (search && search.trim()) {
      templates = await ContractTemplate.searchTemplates(search, category, parseInt(limit));
    } else {
      // Handle sorting
      let sortOptions = {};
      switch (sortBy) {
        case 'popularity':
          sortOptions = { isPopular: -1, 'usage.timesUsed': -1 };
          break;
        case 'usage':
          sortOptions = { 'usage.timesUsed': -1 };
          break;
        case 'recent':
          sortOptions = { createdAt: -1 };
          break;
        case 'name':
          sortOptions = { name: 1 };
          break;
        default:
          sortOptions = { isPopular: -1, 'usage.timesUsed': -1 };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      templates = await ContractTemplate.find(query)
        .sort(sortOptions)
        .limit(parseInt(limit))
        .skip(skip)
        .populate('createdBy', 'name email')
        .populate('approvedBy', 'name email');
    }

    // Get total count for pagination
    const totalCount = await ContractTemplate.countDocuments(query);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      data: {
        templates,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching contract templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contract templates',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/contract-templates/categories
 * @desc    Get all available categories with template counts
 * @access  Public
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await ContractTemplate.aggregate([
      {
        $match: {
          isActive: true,
          approvalStatus: 'approved'
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          popularCount: {
            $sum: { $cond: [{ $eq: ['$isPopular', true] }, 1, 0] }
          },
          avgUsage: { $avg: '$usage.timesUsed' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error fetching template categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/contract-templates/popular
 * @desc    Get popular contract templates
 * @access  Public
 */
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const templates = await ContractTemplate.findPopular(parseInt(limit));

    res.json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('Error fetching popular templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular templates',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/contract-templates/:id
 * @desc    Get a specific contract template
 * @access  Public (for approved templates)
 */
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid template ID')
], handleValidationErrors, async (req, res) => {
  try {
    const template = await ContractTemplate.findOne({
      _id: req.params.id,
      isActive: true,
      approvalStatus: 'approved'
    }).populate('createdBy', 'name email');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Contract template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });

  } catch (error) {
    console.error('Error fetching contract template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contract template',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/contract-templates
 * @desc    Create a new contract template
 * @access  Private (Admin or verified professionals)
 */
router.post('/', [
  authenticate,
  authorize(['admin', 'verified_professional']),
  ...validateTemplate
], handleValidationErrors, async (req, res) => {
  try {
    const templateData = {
      ...req.body,
      createdBy: req.user.id,
      isPredefined: false,
      approvalStatus: req.user.role === 'admin' ? 'approved' : 'pending'
    };

    // Auto-approve if created by admin
    if (req.user.role === 'admin') {
      templateData.approvedBy = req.user.id;
      templateData.approvedAt = new Date();
    }

    const template = new ContractTemplate(templateData);
    await template.save();

    await template.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Contract template created successfully',
      data: template
    });

  } catch (error) {
    console.error('Error creating contract template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create contract template',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/contract-templates/:id
 * @desc    Update a contract template
 * @access  Private (Admin or template creator)
 */
router.put('/:id', [
  authenticate,
  param('id').isMongoId().withMessage('Invalid template ID'),
  ...validateTemplate
], handleValidationErrors, async (req, res) => {
  try {
    const template = await ContractTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Contract template not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && template.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this template'
      });
    }

    // Update template
    Object.assign(template, req.body);

    // Reset approval status if not admin
    if (req.user.role !== 'admin' && template.approvalStatus === 'approved') {
      template.approvalStatus = 'pending';
      template.approvedBy = undefined;
      template.approvedAt = undefined;
    }

    // Increment version
    const [major, minor, patch] = template.version.split('.').map(Number);
    template.version = `${major}.${minor}.${patch + 1}`;

    await template.save();
    await template.populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Contract template updated successfully',
      data: template
    });

  } catch (error) {
    console.error('Error updating contract template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contract template',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/contract-templates/:id
 * @desc    Delete (deactivate) a contract template
 * @access  Private (Admin or template creator)
 */
router.delete('/:id', [
  authenticate,
  param('id').isMongoId().withMessage('Invalid template ID')
], handleValidationErrors, async (req, res) => {
  try {
    const template = await ContractTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Contract template not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && template.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this template'
      });
    }

    // Soft delete by deactivating
    template.isActive = false;
    await template.save();

    res.json({
      success: true,
      message: 'Contract template deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting contract template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contract template',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/contract-templates/:id/generate-contract
 * @desc    Generate a contract from a template
 * @access  Private
 */
router.post('/:id/generate-contract', [
  authenticate,
  param('id').isMongoId().withMessage('Invalid template ID'),
  ...validateContractGeneration
], handleValidationErrors, async (req, res) => {
  try {
    const template = await ContractTemplate.findOne({
      _id: req.params.id,
      isActive: true,
      approvalStatus: 'approved'
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Contract template not found'
      });
    }

    // Generate contract data from template
    const contractData = template.generateContract(req.body);
    
    // Add user information
    contractData.createdBy = req.user.id;
    contractData.participants = [
      { userId: req.user.id, role: 'creator' }
    ];

    // Create the contract
    const contract = new Contract(contractData);
    await contract.save();

    // Increment template usage
    await template.incrementUsage();

    await contract.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Contract generated successfully',
      data: contract
    });

  } catch (error) {
    console.error('Error generating contract:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate contract',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/contract-templates/:id/increment-usage
 * @desc    Increment template usage count
 * @access  Private
 */
router.post('/:id/increment-usage', [
  authenticate,
  param('id').isMongoId().withMessage('Invalid template ID')
], handleValidationErrors, async (req, res) => {
  try {
    const template = await ContractTemplate.findOne({
      _id: req.params.id,
      isActive: true,
      approvalStatus: 'approved'
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Contract template not found'
      });
    }

    await template.incrementUsage();

    res.json({
      success: true,
      message: 'Template usage incremented',
      data: {
        timesUsed: template.usage.timesUsed,
        lastUsed: template.usage.lastUsed
      }
    });

  } catch (error) {
    console.error('Error incrementing template usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to increment template usage',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/contract-templates/:id/approve
 * @desc    Approve a pending contract template
 * @access  Private (Admin only)
 */
router.put('/:id/approve', [
  authenticate,
  authorize(['admin']),
  param('id').isMongoId().withMessage('Invalid template ID')
], handleValidationErrors, async (req, res) => {
  try {
    const template = await ContractTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Contract template not found'
      });
    }

    template.approvalStatus = 'approved';
    template.approvedBy = req.user.id;
    template.approvedAt = new Date();

    await template.save();
    await template.populate(['createdBy', 'approvedBy'], 'name email');

    res.json({
      success: true,
      message: 'Contract template approved successfully',
      data: template
    });

  } catch (error) {
    console.error('Error approving contract template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve contract template',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/contract-templates/:id/reject
 * @desc    Reject a pending contract template
 * @access  Private (Admin only)
 */
router.put('/:id/reject', [
  authenticate,
  authorize(['admin']),
  param('id').isMongoId().withMessage('Invalid template ID'),
  body('reason').notEmpty().withMessage('Rejection reason is required')
], handleValidationErrors, async (req, res) => {
  try {
    const template = await ContractTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Contract template not found'
      });
    }

    template.approvalStatus = 'rejected';
    template.rejectionReason = req.body.reason;
    template.rejectedBy = req.user.id;
    template.rejectedAt = new Date();

    await template.save();

    res.json({
      success: true,
      message: 'Contract template rejected successfully'
    });

  } catch (error) {
    console.error('Error rejecting contract template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject contract template',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;