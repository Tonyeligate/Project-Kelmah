const express = require("express");
const router = express.Router();
const paymentMethodController = require("../controllers/paymentMethod.controller");
const { authenticate } = require("../middlewares/auth");

// Apply authentication middleware to all routes
router.use(authenticate);

// Payment method routes
router.get("/", paymentMethodController.getPaymentMethods);
router.post("/", paymentMethodController.addPaymentMethod);
router.patch("/:paymentMethodId", paymentMethodController.updatePaymentMethod);
router.delete("/:paymentMethodId", paymentMethodController.removePaymentMethod);
router.post(
  "/:paymentMethodId/verify",
  paymentMethodController.verifyPaymentMethod,
);

// Set a payment method as default
router.put(
  "/:paymentMethodId/default",
  (req, res, next) => {
    req.body = { isDefault: true };
    next();
  },
  paymentMethodController.updatePaymentMethod,
);

router.patch(
  "/:paymentMethodId/default",
  (req, res, next) => {
    req.body = { isDefault: true };
    next();
  },
  paymentMethodController.updatePaymentMethod,
);

module.exports = router;
