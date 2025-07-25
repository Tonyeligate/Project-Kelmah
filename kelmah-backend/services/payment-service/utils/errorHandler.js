// Error handler utility
exports.handleError = (res, error) => {
  console.error("Error:", error);

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation Error",
      errors: Object.values(error.errors).map((err) => err.message),
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      message: "Invalid ID format",
      error: error.message,
    });
  }

  if (error.code === 11000) {
    return res.status(400).json({
      message: "Duplicate entry",
      error: error.message,
    });
  }

  // Payment provider specific errors
  if (error.type === "StripeCardError") {
    return res.status(400).json({
      message: "Card error",
      error: error.message,
    });
  }

  if (error.type === "StripeInvalidRequestError") {
    return res.status(400).json({
      message: "Invalid request",
      error: error.message,
    });
  }

  if (error.type === "PayPalError") {
    return res.status(400).json({
      message: "PayPal error",
      error: error.message,
    });
  }

  // Default error response
  res.status(500).json({
    message: "Internal Server Error",
    error:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
};

// Custom error class for payment service
class PaymentServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "PaymentServiceError";
    this.statusCode = statusCode;
  }
}

exports.PaymentServiceError = PaymentServiceError;

// Error types
exports.ErrorTypes = {
  INSUFFICIENT_FUNDS: "Insufficient funds",
  INVALID_PAYMENT_METHOD: "Invalid payment method",
  PAYMENT_FAILED: "Payment failed",
  WITHDRAWAL_FAILED: "Withdrawal failed",
  REFUND_FAILED: "Refund failed",
  INVALID_AMOUNT: "Invalid amount",
  DUPLICATE_TRANSACTION: "Duplicate transaction",
  PAYMENT_METHOD_NOT_FOUND: "Payment method not found",
  WALLET_NOT_FOUND: "Wallet not found",
  TRANSACTION_NOT_FOUND: "Transaction not found",
};
