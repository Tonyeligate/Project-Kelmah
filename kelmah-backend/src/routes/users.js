const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const userController = require('../controllers/user.controller');

// Admin-only user management routes
router.route('/')
  .get(authenticateUser, authorizeRoles('admin'), userController.getUsers)
  .post(authenticateUser, authorizeRoles('admin'), userController.createUser);

router.route('/search')
  .get(authenticateUser, authorizeRoles('admin'), userController.searchUsers);

router.route('/:id')
  .get(authenticateUser, authorizeRoles('admin'), userController.getUserById)
  .put(authenticateUser, authorizeRoles('admin'), userController.updateUser)
  .delete(authenticateUser, authorizeRoles('admin'), userController.deleteUser);

module.exports = router; 