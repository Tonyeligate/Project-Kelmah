const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const subscriptionValidation = require('../validations/subscription.validation');
const subscriptionController = require('../controllers/subscription.controller');

// All subscription routes require authenticated admin
router.use(authenticateUser, authorizeRoles(['admin']));

router.route('/')
  .get(subscriptionController.getSubscriptions)
  .post(
    validate(subscriptionValidation.createSubscription),
    subscriptionController.createSubscription
  );

router.route('/:id')
  .get(subscriptionController.getSubscriptionById)
  .put(
    validate(subscriptionValidation.updateSubscription),
    subscriptionController.updateSubscription
  )
  .delete(subscriptionController.deleteSubscription);

module.exports = router; 