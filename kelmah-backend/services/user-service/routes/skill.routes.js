/**
 * Skill Routes
 * Defines API endpoints for skill operations
 */

const express = require('express');
const skillController = require('../controllers/skill.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route GET /api/skills
 * @desc Get all skills with filtering and pagination
 * @access Public
 */
router.get('/', skillController.getAllSkills);

/**
 * @route GET /api/skills/trending
 * @desc Get trending skills
 * @access Public
 */
router.get('/trending', skillController.getTrendingSkills);

/**
 * @route GET /api/skills/search
 * @desc Search skills
 * @access Public
 */
router.get('/search', skillController.searchSkills);

/**
 * @route GET /api/skills/category/:category
 * @desc Get skills by category
 * @access Public
 */
router.get('/category/:category', skillController.getSkillsByCategory);

/**
 * @route GET /api/skills/:id
 * @desc Get skill by ID
 * @access Public
 */
router.get('/:id', skillController.getSkillById);

/**
 * @route GET /api/skills/:id/related
 * @desc Get related skills
 * @access Public
 */
router.get('/:id/related', skillController.getRelatedSkills);

/**
 * @route POST /api/skills
 * @desc Create a new skill
 * @access Admin only
 */
router.post('/', authenticate, authorize('admin'), skillController.createSkill);

/**
 * @route PUT /api/skills/:id
 * @desc Update a skill
 * @access Admin only
 */
router.put('/:id', authenticate, authorize('admin'), skillController.updateSkill);

/**
 * @route DELETE /api/skills/:id
 * @desc Delete a skill
 * @access Admin only
 */
router.delete('/:id', authenticate, authorize('admin'), skillController.deleteSkill);

/**
 * @route POST /api/skills/:id/popularity
 * @desc Increment skill popularity
 * @access Private
 */
router.post('/:id/popularity', authenticate, skillController.incrementPopularity);

module.exports = router; 