const express = require("express");
const router = express.Router();
const paymentMethodController = require("../controllers/paymentMethod.controller");
const { verifyGatewayRequest } = require("../../../shared/middlewares/serviceTrust");

// Apply authentication middleware to all routes
router.use(verifyGatewayRequest);

// Payment method routes
router.get("/", paymentMethodController.getPaymentMethods);
router.post("/", paymentMethodController.addPaymentMethod);
router.patch("/:paymentMethodId", paymentMethodController.updatePaymentMethod);
router.put("/:paymentMethodId", paymentMethodController.updatePaymentMethod); // PUT alias for gateway compatibility
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
