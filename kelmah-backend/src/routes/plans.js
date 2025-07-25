const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const planValidation = require('../validations/plan.validation');
const planController = require('../controllers/plan.controller');

// All plan routes require authenticated admin
router.use(authenticateUser, authorizeRoles(['admin']));

router.route('/')
  .get(planController.getPlans)
  .post(
    validate(planValidation.createPlan),
    planController.createPlan
  );

router.route('/:id')
  .get(planController.getPlanById)
  .put(
    validate(planValidation.updatePlan),
    planController.updatePlan
  )
  .delete(planController.deletePlan);

module.exports = router; 