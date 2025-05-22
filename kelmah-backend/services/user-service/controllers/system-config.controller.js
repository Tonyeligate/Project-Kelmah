/**
 * System Config Controller
 * Handles system configuration management
 */

const { SystemConfig, AdminActionLog, User } = require('../models');
const { validationResult } = require('express-validator');

// Get all configuration settings (admin only)
exports.getAllConfigs = async (req, res) => {
  try {
    // Fetch all configs grouped by category
    const configs = await SystemConfig.findAll({
      order: [['category', 'ASC'], ['key', 'ASC']]
    });

    // Group configs by category
    const groupedConfigs = {};
    configs.forEach(config => {
      if (!groupedConfigs[config.category]) {
        groupedConfigs[config.category] = [];
      }
      groupedConfigs[config.category].push({
        id: config.id,
        key: config.key,
        value: config.value,
        description: config.description,
        dataType: config.dataType,
        isPublic: config.isPublic,
        defaultValue: config.defaultValue,
        possibleValues: config.possibleValues,
        updatedAt: config.updatedAt
      });
    });

    return res.status(200).json({
      success: true,
      message: 'System configurations retrieved successfully',
      data: groupedConfigs
    });
  } catch (error) {
    console.error('Error fetching system configs:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching system configurations',
      error: error.message
    });
  }
};

// Get public configurations (accessible to all users)
exports.getPublicConfigs = async (req, res) => {
  try {
    const publicConfigs = await SystemConfig.getPublicConfigs();
    
    // Convert values to appropriate types
    const formattedConfigs = {};
    
    for (const config of publicConfigs) {
      if (!formattedConfigs[config.category]) {
        formattedConfigs[config.category] = {};
      }
      
      // Parse the value based on dataType
      let parsedValue;
      try {
        switch (config.dataType) {
          case 'number':
            parsedValue = parseFloat(config.value);
            break;
          case 'boolean':
            parsedValue = config.value === 'true';
            break;
          case 'json':
          case 'array':
            parsedValue = JSON.parse(config.value);
            break;
          default:
            parsedValue = config.value;
        }
      } catch (error) {
        console.error(`Error parsing config value: ${error.message}`);
        parsedValue = config.value; // Fallback to string
      }
      
      formattedConfigs[config.category][config.key] = parsedValue;
    }

    return res.status(200).json({
      success: true,
      message: 'Public configurations retrieved successfully',
      data: formattedConfigs
    });
  } catch (error) {
    console.error('Error fetching public configs:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching public configurations',
      error: error.message
    });
  }
};

// Get configurations by category
exports.getConfigsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }
    
    const configs = await SystemConfig.getByCategory(category);
    
    // Return appropriate response based on user role
    // If admin, return all details; if regular user, only return public configs
    const isAdmin = req.user && req.user.role === 'admin';
    
    const filteredConfigs = isAdmin 
      ? configs 
      : configs.filter(config => config.isPublic);
      
    return res.status(200).json({
      success: true,
      message: `${category} configurations retrieved successfully`,
      data: filteredConfigs
    });
  } catch (error) {
    console.error(`Error fetching ${req.params.category} configs:`, error);
    return res.status(500).json({
      success: false,
      message: `Error fetching ${req.params.category} configurations`,
      error: error.message
    });
  }
};

// Update a configuration setting (admin only)
exports.updateConfig = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    
    const { category, key, value, description, isPublic, possibleValues, defaultValue } = req.body;
    
    if (!category || !key) {
      return res.status(400).json({
        success: false,
        message: 'Category and key are required'
      });
    }
    
    const adminId = req.user.id;
    
    // First, set the main value
    const updatedConfig = await SystemConfig.setValue(category, key, value, adminId);
    
    // Then update other properties if provided
    if (description !== undefined) updatedConfig.description = description;
    if (isPublic !== undefined) updatedConfig.isPublic = isPublic;
    if (possibleValues !== undefined) updatedConfig.possibleValues = possibleValues;
    if (defaultValue !== undefined) updatedConfig.defaultValue = defaultValue;
    
    await updatedConfig.save();
    
    // Log this admin action
    if (AdminActionLog) {
      await AdminActionLog.logAction({
        req,
        adminId,
        actionType: 'update_config',
        targetType: 'system_config',
        targetId: `${category}.${key}`,
        details: {
          category,
          key,
          oldValue: updatedConfig._previousDataValues.value,
          newValue: value
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Configuration updated successfully',
      data: {
        id: updatedConfig.id,
        category,
        key,
        value: updatedConfig.value,
        dataType: updatedConfig.dataType,
        description: updatedConfig.description,
        isPublic: updatedConfig.isPublic,
        updatedAt: updatedConfig.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating config:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating configuration',
      error: error.message
    });
  }
};

// Delete a configuration setting (admin only)
exports.deleteConfig = async (req, res) => {
  try {
    const { id } = req.params;
    
    const config = await SystemConfig.findByPk(id);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }
    
    // Store info for logging
    const { category, key } = config;
    
    await config.destroy();
    
    // Log this admin action
    if (AdminActionLog) {
      await AdminActionLog.logAction({
        req,
        adminId: req.user.id,
        actionType: 'delete_config',
        targetType: 'system_config',
        targetId: `${category}.${key}`,
        details: {
          category,
          key
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting config:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting configuration',
      error: error.message
    });
  }
};

// Initialize or reset default configurations
exports.initializeDefaults = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    // Define default configuration settings
    const defaultConfigs = [
      // Security settings
      {
        category: 'security',
        key: 'password_min_length',
        value: '8',
        description: 'Minimum password length',
        dataType: 'number',
        isPublic: true
      },
      {
        category: 'security',
        key: 'password_require_special',
        value: 'true',
        description: 'Require special characters in passwords',
        dataType: 'boolean',
        isPublic: true
      },
      {
        category: 'security',
        key: 'password_require_number',
        value: 'true',
        description: 'Require numbers in passwords',
        dataType: 'boolean',
        isPublic: true
      },
      {
        category: 'security',
        key: 'token_expiry',
        value: '86400',
        description: 'JWT token expiry in seconds',
        dataType: 'number',
        isPublic: false
      },
      
      // Email settings
      {
        category: 'email',
        key: 'verification_required',
        value: 'true',
        description: 'Require email verification for new accounts',
        dataType: 'boolean',
        isPublic: true
      },
      {
        category: 'email',
        key: 'welcome_email_enabled',
        value: 'true',
        description: 'Send welcome email to new users',
        dataType: 'boolean',
        isPublic: false
      },
      
      // Payment settings
      {
        category: 'payment',
        key: 'platform_fee_percentage',
        value: '10',
        description: 'Platform fee percentage',
        dataType: 'number',
        isPublic: true
      },
      {
        category: 'payment',
        key: 'minimum_withdrawal_amount',
        value: '50',
        description: 'Minimum amount for withdrawal',
        dataType: 'number',
        isPublic: true
      },
      
      // Jobs settings
      {
        category: 'jobs',
        key: 'max_active_listings',
        value: '10',
        description: 'Maximum active job listings per hirer',
        dataType: 'number',
        isPublic: true
      },
      {
        category: 'jobs',
        key: 'listing_expiry_days',
        value: '30',
        description: 'Days until job listings expire',
        dataType: 'number',
        isPublic: true
      },
      
      // System settings
      {
        category: 'system',
        key: 'maintenance_mode',
        value: 'false',
        description: 'System maintenance mode',
        dataType: 'boolean',
        isPublic: true
      },
      {
        category: 'system',
        key: 'maintenance_message',
        value: 'System is currently undergoing maintenance. Please check back later.',
        description: 'Message to display during maintenance',
        dataType: 'string',
        isPublic: true
      }
    ];
    
    // Create or update each default config
    for (const config of defaultConfigs) {
      const { category, key, value, description, dataType, isPublic } = config;
      
      // Find or create
      const [configInstance, created] = await SystemConfig.findOrCreate({
        where: { category, key },
        defaults: {
          value,
          description,
          dataType,
          isPublic,
          updatedBy: adminId
        }
      });
      
      // If it already exists and this is a reset operation, update it
      if (!created && req.query.reset === 'true') {
        configInstance.value = value;
        configInstance.description = description;
        configInstance.dataType = dataType;
        configInstance.isPublic = isPublic;
        configInstance.updatedBy = adminId;
        await configInstance.save();
      }
    }
    
    // Log this admin action
    if (AdminActionLog) {
      await AdminActionLog.logAction({
        req,
        adminId,
        actionType: 'initialize_configs',
        targetType: 'system_config',
        targetId: 'all',
        details: {
          reset: req.query.reset === 'true'
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      message: req.query.reset === 'true' 
        ? 'System configurations reset to defaults successfully' 
        : 'Default system configurations initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing default configs:', error);
    return res.status(500).json({
      success: false,
      message: 'Error initializing default configurations',
      error: error.message
    });
  }
}; 