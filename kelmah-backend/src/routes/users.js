const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const userController = require('../controllers/user.controller');

// Public user routes (authenticated users only)
// Get current user's credentials/profile
router.get('/me/credentials', authenticateUser, userController.getMyCredentials);

// Bookmark management
router.get('/bookmarks', authenticateUser, userController.getMyBookmarks);
router.post('/workers/:id/bookmark', authenticateUser, userController.toggleWorkerBookmark);

// User settings
router.get('/settings', authenticateUser, userController.getMySettings);
router.put('/settings', authenticateUser, userController.updateMySettings);

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