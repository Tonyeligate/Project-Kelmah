const express = require('express');
const jobController = require('../controllers/job.controller');
const userController = require('../controllers/user.controller');
const { validate } = require('../middlewares/validator');
const Joi = require('joi');

const router = express.Router();

// Validation schemas for search endpoints
const searchJobsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).default(10),
  search: Joi.string().allow('', null),
  category: Joi.string().trim().optional(),
  skills: Joi.string().pattern(/^[^,]+(,[^,]+)*$/).optional(),
  budget: Joi.string().pattern(/^\d+(-\d+)?$/).optional(),
  location: Joi.string().trim().optional(),
  type: Joi.string().trim().optional(),
  sort: Joi.string().trim().optional()
});
const searchUsersSchema = Joi.object({
  q: Joi.string().allow('').required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).default(10)
});

// Job search with filtering, sorting, pagination, and text search
router.get(
  '/jobs',
  validate(searchJobsSchema, 'query'),
  jobController.getJobs
);

// User search by name or email
router.get(
  '/users',
  validate(searchUsersSchema, 'query'),
  userController.searchUsers
);

module.exports = router; 