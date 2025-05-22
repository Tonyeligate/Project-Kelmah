/**
 * Contract Template Controller
 * Handles API requests for contract templates
 */

const ContractTemplate = require('../models/contract-template.model');
const { validateUUID } = require('../../../utils/validators');
const { sendError } = require('../../../utils/error-handler');

/**
 * Get all contract templates
 * @route GET /api/contract-templates
 */
exports.getAllTemplates = async (req, res) => {
  try {
    const { jobType, isDefault } = req.query;
    let templates;

    if (jobType) {
      templates = await ContractTemplate.findByJobType(jobType);
    } else if (isDefault === 'true') {
      templates = await ContractTemplate.findDefaults();
    } else {
      templates = await ContractTemplate.findAll({
        order: [['createdAt', 'DESC']]
      });
    }

    res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching contract templates:', error);
    sendError(res, error);
  }
};

/**
 * Get a specific contract template by ID
 * @route GET /api/contract-templates/:id
 */
exports.getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID format'
      });
    }

    const template = await ContractTemplate.findByPk(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Contract template not found'
      });
    }

    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching contract template:', error);
    sendError(res, error);
  }
};

/**
 * Create a new contract template
 * @route POST /api/contract-templates
 */
exports.createTemplate = async (req, res) => {
  try {
    const { title, description, jobType, content, variables, isDefault } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!title || !jobType || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title, job type, and content are required'
      });
    }

    // Create the template
    const template = await ContractTemplate.create({
      title,
      description,
      jobType,
      content,
      variables: variables || [],
      isDefault: isDefault || false,
      createdBy: userId,
      updatedBy: userId
    });

    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error creating contract template:', error);
    sendError(res, error);
  }
};

/**
 * Update an existing contract template
 * @route PUT /api/contract-templates/:id
 */
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, jobType, content, variables, isDefault } = req.body;
    const userId = req.user.id;

    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID format'
      });
    }

    // Find the template
    const template = await ContractTemplate.findByPk(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Contract template not found'
      });
    }

    // Check permission (only creator or admin can update)
    if (template.createdBy !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this template'
      });
    }

    // Update template
    await template.update({
      title: title || template.title,
      description: description !== undefined ? description : template.description,
      jobType: jobType || template.jobType,
      content: content || template.content,
      variables: variables || template.variables,
      isDefault: isDefault !== undefined ? isDefault : template.isDefault,
      updatedBy: userId
    });

    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error updating contract template:', error);
    sendError(res, error);
  }
};

/**
 * Delete a contract template
 * @route DELETE /api/contract-templates/:id
 */
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID format'
      });
    }

    // Find the template
    const template = await ContractTemplate.findByPk(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Contract template not found'
      });
    }

    // Check permission (only creator or admin can delete)
    if (template.createdBy !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this template'
      });
    }

    // Delete the template (soft delete)
    await template.destroy();

    res.status(200).json({
      success: true,
      message: 'Contract template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contract template:', error);
    sendError(res, error);
  }
};

/**
 * Generate contract from template with variables
 * @route POST /api/contract-templates/:id/generate
 */
exports.generateContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { variables } = req.body;

    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID format'
      });
    }

    // Find the template
    const template = await ContractTemplate.findByPk(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Contract template not found'
      });
    }

    // Generate contract with variables
    const contractContent = template.generateContract(variables || {});

    res.status(200).json({
      success: true,
      data: {
        content: contractContent,
        template: template.title,
        jobType: template.jobType,
        missingVariables: template.variables.filter(v => !variables || !variables[v])
      }
    });
  } catch (error) {
    console.error('Error generating contract:', error);
    sendError(res, error);
  }
};

/**
 * Get templates created by the current user
 * @route GET /api/contract-templates/my-templates
 */
exports.getMyTemplates = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const templates = await ContractTemplate.findByCreator(userId);

    res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching user templates:', error);
    sendError(res, error);
  }
}; 