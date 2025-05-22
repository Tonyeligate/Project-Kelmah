/**
 * Skill Controller
 * Handles API requests related to skills
 */

const { Skill } = require('../models');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Get all skills
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response
 */
exports.getAllSkills = async (req, res) => {
  try {
    const { category, status = 'active', search, limit = 50, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    
    // Build where clause based on query parameters
    const whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (category) {
      whereClause.category = category;
    }
    
    if (search) {
      const { Op } = require('sequelize');
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Get skills with pagination
    const { count, rows: skills } = await Skill.findAndCountAll({
      where: whereClause,
      order: [['popularity', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    
    return successResponse(res, {
      skills,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error(`Error fetching skills: ${error.message}`);
    return errorResponse(res, 'Failed to fetch skills', 500);
  }
};

/**
 * Get skill by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response
 */
exports.getSkillById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const skill = await Skill.findByPk(id);
    
    if (!skill) {
      return errorResponse(res, 'Skill not found', 404);
    }
    
    return successResponse(res, { skill });
  } catch (error) {
    logger.error(`Error fetching skill: ${error.message}`);
    return errorResponse(res, 'Failed to fetch skill', 500);
  }
};

/**
 * Create a new skill
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response
 */
exports.createSkill = async (req, res) => {
  try {
    const {
      name,
      category,
      subcategory,
      description,
      icon,
      isVerifiable,
      testAvailable
    } = req.body;
    
    // Validate required fields
    if (!name || !category) {
      return errorResponse(res, 'Name and category are required', 400);
    }
    
    // Check if skill with this name already exists
    const existingSkill = await Skill.findOne({
      where: {
        name: name.trim().toLowerCase()
      }
    });
    
    if (existingSkill) {
      return errorResponse(res, 'Skill with this name already exists', 409);
    }
    
    // Create new skill
    const skill = await Skill.create({
      name,
      category,
      subcategory,
      description,
      icon,
      isVerifiable: isVerifiable !== undefined ? isVerifiable : true,
      testAvailable: testAvailable !== undefined ? testAvailable : false,
      popularity: 0,
      status: 'active'
    });
    
    logger.info(`New skill created: ${skill.name}`);
    return successResponse(res, { skill }, 201);
  } catch (error) {
    logger.error(`Error creating skill: ${error.message}`);
    return errorResponse(res, 'Failed to create skill', 500);
  }
};

/**
 * Update a skill
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response
 */
exports.updateSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      subcategory,
      description,
      icon,
      isVerifiable,
      testAvailable,
      popularity,
      status
    } = req.body;
    
    // Find skill by ID
    const skill = await Skill.findByPk(id);
    
    if (!skill) {
      return errorResponse(res, 'Skill not found', 404);
    }
    
    // If name is being changed, check for duplicates
    if (name && name !== skill.name) {
      const existingSkill = await Skill.findOne({
        where: {
          name: name.trim().toLowerCase()
        }
      });
      
      if (existingSkill && existingSkill.id !== id) {
        return errorResponse(res, 'Skill with this name already exists', 409);
      }
    }
    
    // Update skill properties
    if (name) skill.name = name;
    if (category) skill.category = category;
    if (subcategory !== undefined) skill.subcategory = subcategory;
    if (description !== undefined) skill.description = description;
    if (icon !== undefined) skill.icon = icon;
    if (isVerifiable !== undefined) skill.isVerifiable = isVerifiable;
    if (testAvailable !== undefined) skill.testAvailable = testAvailable;
    if (popularity !== undefined) skill.popularity = popularity;
    if (status) skill.status = status;
    
    // Save changes
    await skill.save();
    
    logger.info(`Skill updated: ${skill.name}`);
    return successResponse(res, { skill });
  } catch (error) {
    logger.error(`Error updating skill: ${error.message}`);
    return errorResponse(res, 'Failed to update skill', 500);
  }
};

/**
 * Delete a skill
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response
 */
exports.deleteSkill = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find skill by ID
    const skill = await Skill.findByPk(id);
    
    if (!skill) {
      return errorResponse(res, 'Skill not found', 404);
    }
    
    // Soft delete the skill
    await skill.destroy();
    
    logger.info(`Skill deleted: ${skill.name}`);
    return successResponse(res, { message: 'Skill successfully deleted' });
  } catch (error) {
    logger.error(`Error deleting skill: ${error.message}`);
    return errorResponse(res, 'Failed to delete skill', 500);
  }
};

/**
 * Get trending skills
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response
 */
exports.getTrendingSkills = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const skills = await Skill.findTrending(parseInt(limit));
    
    return successResponse(res, { skills });
  } catch (error) {
    logger.error(`Error fetching trending skills: ${error.message}`);
    return errorResponse(res, 'Failed to fetch trending skills', 500);
  }
};

/**
 * Get skills by category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response
 */
exports.getSkillsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const skills = await Skill.findByCategory(category);
    
    return successResponse(res, { skills });
  } catch (error) {
    logger.error(`Error fetching skills by category: ${error.message}`);
    return errorResponse(res, 'Failed to fetch skills by category', 500);
  }
};

/**
 * Search skills
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response
 */
exports.searchSkills = async (req, res) => {
  try {
    const { query, limit = 20 } = req.query;
    
    if (!query || query.trim().length < 2) {
      return errorResponse(res, 'Search query must be at least 2 characters', 400);
    }
    
    const skills = await Skill.searchSkills(query, parseInt(limit));
    
    return successResponse(res, { skills });
  } catch (error) {
    logger.error(`Error searching skills: ${error.message}`);
    return errorResponse(res, 'Failed to search skills', 500);
  }
};

/**
 * Get related skills
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response
 */
exports.getRelatedSkills = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;
    
    const relatedSkills = await Skill.findRelated(id, parseInt(limit));
    
    return successResponse(res, { skills: relatedSkills });
  } catch (error) {
    logger.error(`Error fetching related skills: ${error.message}`);
    return errorResponse(res, 'Failed to fetch related skills', 500);
  }
};

/**
 * Increment skill popularity
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response
 */
exports.incrementPopularity = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount = 1 } = req.body;
    
    // Find skill by ID
    const skill = await Skill.findByPk(id);
    
    if (!skill) {
      return errorResponse(res, 'Skill not found', 404);
    }
    
    // Increment popularity
    await skill.incrementPopularity(parseInt(amount));
    
    return successResponse(res, { skill });
  } catch (error) {
    logger.error(`Error incrementing skill popularity: ${error.message}`);
    return errorResponse(res, 'Failed to increment skill popularity', 500);
  }
}; 