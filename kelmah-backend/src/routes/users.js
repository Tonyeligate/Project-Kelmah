const express = require('express');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const userController = require('../controllers/user.controller');
const { validate } = require('../middlewares/validator');
const Joi = require('joi');
const reviewController = require('../controllers/review.controller');
const reviewValidation = require('../validations/review.validation');

const router = express.Router();

// Validation schemas for users endpoints
const getUsersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).default(10)
});
const userIdSchema = Joi.object({
  id: Joi.string().uuid().required()
});
const updateUserSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50),
  lastName: Joi.string().trim().min(2).max(50),
  email: Joi.string().trim().email(),
  role: Joi.string().valid('admin','hirer','worker','staff'),
  phone: Joi.string().pattern(/^(\\+\\d{1,3}[- ]?)?\\d{10}$/)
}).min(1);

// Nested review routes for users
// Public: get reviews for a specific user
router.get(
  '/:id/reviews',
  validate(userIdSchema, 'params'),
  reviewController.getReviewsForWorker
);

// Protected: create a review for a specific user (hirer only)
router.post(
  '/:id/reviews',
  authenticateUser,
  authorizeRoles('hirer'),
  (req, res, next) => { req.body.reviewee = req.params.id; next(); },
  validate(reviewValidation.createReview),
  reviewController.createReview
);

// Protect all user routes: only admin
router.use(authenticateUser);
router.use(authorizeRoles('admin'));

// GET /api/users - list users
router.get(
  '/',
  validate(getUsersSchema, 'query'),
  userController.getUsers
);

// GET /api/users/:id - get a single user
router.get(
  '/:id',
  validate(userIdSchema, 'params'),
  userController.getUserById
);

// PUT /api/users/:id - update a user
router.put(
  '/:id',
  validate(userIdSchema, 'params'),
  validate(updateUserSchema),
  userController.updateUser
);

// DELETE /api/users/:id - delete a user
router.delete(
  '/:id',
  validate(userIdSchema, 'params'),
  userController.deleteUser
);

module.exports = router; 