const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const walletController = require('../controllers/wallet.controller');

// All wallet routes require authenticated admin
router.use(authenticateUser, authorizeRoles(['admin']));

router.route('/')
  .get(walletController.getWallets)
  .post(walletController.createWallet);

router.route('/:id')
  .get(walletController.getWalletById)
  .put(walletController.updateWallet)
  .delete(walletController.deleteWallet);

module.exports = router; 