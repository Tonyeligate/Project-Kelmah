const { PaymentMethod, User } = require("../models");
const stripe = require("../services/stripe");
const paypal = require("../services/paypal");
const { validatePaymentMethod } = require('../utils/validation');
const { handleError } = require('../utils/controllerUtils');

const maskPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  const digits = String(phoneNumber).replace(/\s+/g, '');
  const last4 = digits.slice(-4);
  return `${digits.slice(0, 4)} •••• ${last4}`;
};

// Get user's payment methods
exports.getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.find({
      user: getUserId(req),
    })
      .select("-cardDetails -bankDetails -paypalDetails")
      .lean();

    const sanitized = (paymentMethods || []).map((pm) => {
      if (pm?.type !== 'mobile_money') return pm;

      const provider =
        pm?.mobileDetails?.provider ||
        pm?.metadata?.providerName ||
        pm?.metadata?.provider ||
        'Mobile Money';
      const masked = maskPhoneNumber(pm?.mobileDetails?.phoneNumber);

      const { mobileDetails, ...rest } = pm;
      return {
        ...rest,
        name: pm?.name || `${provider} Mobile Money`,
        phoneNumber: masked,
        displayValue: masked,
      };
    });

    res.json(sanitized);
  } catch (error) {
    handleError(res, error);
  }
};

// Add payment method
exports.addPaymentMethod = async (req, res) => {
  try {
    const { error } = validatePaymentMethod(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const {
      type,
      isDefault,
      cardDetails,
      bankDetails,
      paypalDetails,
      mobileDetails,
      billingAddress,
      metadata,
    } = req.body;

    // Process payment method based on type
    let processedDetails;
    switch (type) {
      case "credit_card":
        processedDetails = await stripe.addCard(cardDetails);
        break;
      case "bank_account":
        processedDetails = await stripe.addBankAccount(bankDetails);
        break;
      case "paypal":
        processedDetails = await paypal.addPayPalAccount(paypalDetails);
        break;
      case "mobile_money":
        processedDetails = {
          provider: 'mobile_money',
          providerId: `momo:${mobileDetails?.provider || 'unknown'}:${mobileDetails?.phoneNumber || ''}`,
        };
        break;
      default:
        throw new Error("Invalid payment method type");
    }

    const paymentMethod = new PaymentMethod({
      user: getUserId(req),
      type,
      isDefault,
      cardDetails: type === "credit_card" ? processedDetails : undefined,
      bankDetails: type === "bank_account" ? processedDetails : undefined,
      paypalDetails: type === "paypal" ? processedDetails : undefined,
      mobileDetails: type === "mobile_money" ? mobileDetails : undefined,
      billingAddress,
      metadata: {
        ...metadata,
        provider: metadata?.provider || processedDetails.provider || 'stripe',
        providerName:
          type === 'mobile_money'
            ? mobileDetails?.provider
            : metadata?.providerName,
        providerId: processedDetails.providerId,
      },
    });

    if (isDefault) {
      await paymentMethod.setAsDefault();
    }

    await paymentMethod.save();

    res.status(201).json({
      message: "Payment method added successfully",
      data: paymentMethod,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Update payment method
exports.updatePaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const { isDefault, billingAddress } = req.body;

    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      user: getUserId(req),
    });

    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    if (isDefault) {
      await paymentMethod.setAsDefault();
    }

    if (billingAddress) {
      paymentMethod.billingAddress = billingAddress;
    }

    await paymentMethod.save();

    res.json({
      message: "Payment method updated successfully",
      data: paymentMethod,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Remove payment method
exports.removePaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId } = req.params;

    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      user: getUserId(req),
    });

    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    // Remove from payment provider
    const provider = paymentMethod?.metadata?.provider;
    switch (provider) {
      case "stripe":
        await stripe.removePaymentMethod(paymentMethod.metadata.providerId);
        break;
      case "paypal":
        await paypal.removePayPalAccount(paymentMethod.metadata.providerId);
        break;
    }

    await paymentMethod.remove();

    res.json({ message: "Payment method removed successfully" });
  } catch (error) {
    handleError(res, error);
  }
};

// Verify payment method
exports.verifyPaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const { verificationData } = req.body;

    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      user: getUserId(req),
    });

    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    let verificationResult;
    switch (paymentMethod.metadata.provider) {
      case "stripe":
        verificationResult = await stripe.verifyPaymentMethod(
          paymentMethod.metadata.providerId,
          verificationData,
        );
        break;
      case "paypal":
        verificationResult = await paypal.verifyPayPalAccount(
          paymentMethod.metadata.providerId,
          verificationData,
        );
        break;
      default:
        throw new Error("Unsupported payment provider");
    }

    await paymentMethod.updateVerificationStatus(
      verificationResult.success ? "verified" : "failed",
    );

    res.json({
      message: verificationResult.success
        ? "Payment method verified successfully"
        : "Payment method verification failed",
      data: verificationResult,
    });
  } catch (error) {
    handleError(res, error);
  }
};
