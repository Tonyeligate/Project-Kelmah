/**
 * Logger Utility
 * Provides consistent logging functionality for the payment service
 */

const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format (more readable for development)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'payment-service' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error' 
    }),
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log') 
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'exceptions.log') 
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'rejections.log') 
    })
  ]
});

// If we're not in production, also log to the console with a more readable format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

/**
 * Log HTTP requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} options - Additional options
 */
logger.logRequest = (req, res, options = {}) => {
  const { level = 'debug', excludePaths = ['/health', '/metrics'] } = options;
  
  // Skip logging for excluded paths
  if (excludePaths.includes(req.path)) {
    return;
  }
  
  const logData = {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.user ? req.user.id : null,
    requestId: req.headers['x-request-id'] || null,
    ...options.additionalData
  };
  
  logger.log(level, `HTTP Request: ${req.method} ${req.path}`, logData);
};

/**
 * Log payment activities
 * @param {String} action - The payment action performed
 * @param {Object} data - Payment data
 * @param {Object} options - Additional options
 */
logger.logPaymentActivity = (action, data, options = {}) => {
  const { level = 'info', sensitive = false } = options;
  
  // Mask sensitive data if requested
  const logData = { ...data };
  
  if (sensitive && logData.cardDetails) {
    // Mask card details
    if (logData.cardDetails.number) {
      logData.cardDetails.number = `****${logData.cardDetails.number.slice(-4)}`;
    }
    if (logData.cardDetails.cvv) {
      logData.cardDetails.cvv = '***';
    }
  }
  
  logger.log(level, `Payment Activity: ${action}`, {
    action,
    data: logData,
    timestamp: new Date().toISOString()
  });
};

// Extend logger with specific payment service log methods
logger.paymentProcessed = (paymentData) => {
  logger.info(`Payment processed: ${paymentData.paymentNumber || paymentData.id}`, {
    paymentId: paymentData.id,
    paymentNumber: paymentData.paymentNumber,
    amount: paymentData.amount,
    currency: paymentData.currency,
    status: paymentData.status
  });
};

logger.paymentFailed = (paymentData, error) => {
  logger.error(`Payment failed: ${paymentData.paymentNumber || paymentData.id}`, {
    paymentId: paymentData.id,
    paymentNumber: paymentData.paymentNumber,
    amount: paymentData.amount,
    currency: paymentData.currency,
    errorCode: paymentData.errorCode || error.code,
    errorMessage: paymentData.errorMessage || error.message
  });
};

logger.escrowAction = (action, escrowData) => {
  logger.info(`Escrow ${action}: ${escrowData.escrowNumber || escrowData.id}`, {
    escrowId: escrowData.id,
    escrowNumber: escrowData.escrowNumber,
    amount: escrowData.amount,
    status: escrowData.status,
    action
  });
};

logger.disputeAction = (action, disputeData) => {
  logger.info(`Dispute ${action}: ${disputeData.disputeNumber || disputeData.id}`, {
    disputeId: disputeData.id,
    disputeNumber: disputeData.disputeNumber,
    status: disputeData.status,
    action
  });
};

logger.subscriptionAction = (action, subscriptionData) => {
  logger.info(`Subscription ${action}: ${subscriptionData.subscriptionNumber || subscriptionData.id}`, {
    subscriptionId: subscriptionData.id,
    subscriptionNumber: subscriptionData.subscriptionNumber,
    userId: subscriptionData.userId,
    planId: subscriptionData.planId,
    status: subscriptionData.status,
    action
  });
};

module.exports = logger; 