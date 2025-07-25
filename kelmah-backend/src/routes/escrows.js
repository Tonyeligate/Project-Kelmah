const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const escrowController = require('../controllers/escrow.controller');

// All escrow routes require authenticated admin
router.use(authenticateUser, authorizeRoles(['admin']));

router.route('/')
  .get(escrowController.getEscrows)
  .post(escrowController.createEscrow);

router.route('/:id')
  .get(escrowController.getEscrowById)
  .put(escrowController.updateEscrow)
  .delete(escrowController.deleteEscrow);

module.exports = router; 