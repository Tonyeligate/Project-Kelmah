const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Import routes
const transactionRoutes = require("./routes/transaction.routes");
const walletRoutes = require("./routes/wallet.routes");
const paymentMethodRoutes = require("./routes/paymentMethod.routes");
const billRoutes = require("./routes/bill.routes");
const paymentsRoutes = require("./routes/payments.routes");

// Create Express app

// Import centralized logger
const { createLogger, createHttpLogger, createErrorLogger, setupGlobalErrorHandlers } = require('./utils/logger');

// Create service logger
const logger = createLogger('payment-service');

// Setup global error handlers
setupGlobalErrorHandlers(logger);

logger.info('payment-service starting...', { 
  nodeVersion: process.version,
  environment: process.env.NODE_ENV || 'development'
});

const app = express();

// Middleware
app.use(helmet());
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://kelmah-frontend-cyan.vercel.app', // Current production frontend
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://kelmah-frontend-mu.vercel.app', // Legacy URL for compatibility
      process.env.FRONTEND_URL || 'https://kelmah-frontend-cyan.vercel.app'
    ].filter(Boolean);
    
    // Allow all Vercel preview and deployment URLs
    const vercelPatterns = [
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*-kelmahs-projects\.vercel\.app$/,
      /^https:\/\/project-kelmah.*\.vercel\.app$/,
      /^https:\/\/kelmah-frontend.*\.vercel\.app$/
    ];
    
    if (!origin) return callback(null, true); // Allow no origin (mobile apps, etc.)
    
    // Check exact matches first
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    
    // Check Vercel patterns
    const isVercelPreview = vercelPatterns.some(pattern => pattern.test(origin));
    if (isVercelPreview) {
      logger.info(`✅ CORS allowed Vercel preview: ${origin}`);
      callback(null, true);
      return;
    }
    
    logger.info(`🚨 CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(morgan("dev"));

// Add HTTP request logging
app.use(createHttpLogger(logger));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/payments/transactions", transactionRoutes);
app.use("/api/payments/wallet", walletRoutes);
app.use("/api/payments/methods", paymentMethodRoutes);
app.use("/api/payments/bills", billRoutes);
app.use("/api/payments", paymentsRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Connect to MongoDB for payment service
const mongoUri = process.env.PAYMENT_MONGO_URI || process.env.MONGODB_URI;
mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    logger.info("Connected to MongoDB");

    // Start server
    const PORT = process.env.PORT || 3004;
    
// Error logging middleware (must be last)
app.use(createErrorLogger(logger));

app.listen(PORT, () => {
      logger.info(`Payment service is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error("MongoDB connection error:", error);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Promise Rejection:", err);
  // Close server & exit process
  process.exit(1);
});
