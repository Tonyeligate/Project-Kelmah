/**
 * Auth Service
 * Handles authentication, authorization, and user identity management
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from multiple locations
console.log('Loading environment variables...');
// Try auth-service/.env first (most specific)
const authServiceEnvPath = path.resolve(__dirname, '.env');
console.log(`Checking for .env at: ${authServiceEnvPath}`);
const authServiceEnvResult = dotenv.config({ path: authServiceEnvPath });
if (authServiceEnvResult.error) {
  console.log(`No .env found at ${authServiceEnvPath}`);
} else {
  console.log(`Loaded .env from ${authServiceEnvPath}`);
}

// Try parent directories as fallback
const parentEnvPath = path.resolve(__dirname, '../../.env');
console.log(`Checking for .env at: ${parentEnvPath}`);
const parentEnvResult = dotenv.config({ path: parentEnvPath });
if (parentEnvResult.error) {
  console.log(`No .env found at ${parentEnvPath}`);
} else {
  console.log(`Loaded .env from ${parentEnvPath}`);
}

// Log all important environment variables
console.log('Environment Variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '[SET]' : '[NOT SET]');
console.log('- JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? '[SET]' : '[NOT SET]');
console.log('- SMTP_HOST:', process.env.SMTP_HOST);
console.log('- SMTP_PORT:', process.env.SMTP_PORT);
console.log('- SMTP_USER:', process.env.SMTP_USER);
console.log('- SMTP_PASS:', process.env.SMTP_PASS ? '[SET]' : '[NOT SET]');
console.log('- EMAIL_FROM:', process.env.EMAIL_FROM);

// Import config and other modules after environment variables are loaded
const config = require("./config");
const { notFound } = require("./utils/errorTypes");
const mongoose = require("mongoose");
const { connectDB, sequelize } = require("./config/db");

// Import routes
const authRoutes = require("./routes/auth.routes");

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security middleware
app.use(helmet());
// CORS middleware: whitelist production front-end and local dev hosts
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (e.g., curl/postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// API routes
app.use("/api/auth", authRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    service: "Auth Service",
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint with API information
app.get("/", (req, res) => {
  res.status(200).json({
    name: "Auth Service API",
    version: "1.0.0",
    description: "Authentication service for the Kelmah platform",
    health: "/health",
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || "error";

  res.status(statusCode).json({
    success: false,
    status,
    message: err.message,
    errors: err.errors || null,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Start server
const PORT = process.env.PORT || process.env.AUTH_SERVICE_PORT || 5001;
// Alias environment variables to expected names
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || process.env.REFRESH_TOKEN_SECRET;
process.env.MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// Check for required environment variables
const requiredEnvVars = ["JWT_SECRET", "JWT_REFRESH_SECRET", "MONGO_URI"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error("Error: Missing required environment variables:");
  missingEnvVars.forEach((envVar) => console.error(`- ${envVar}`));
  process.exit(1);
}

// Connect to databases (MongoDB + SQL)
Promise.all([
  connectDB(), // Mongoose MongoDB
  sequelize.authenticate(), // Sequelize SQL
])
  .then(() => {
    console.log("MongoDB and Sequelize connections established");
    return sequelize.sync(); // Ensure SQL models are synced
  })
  .then(() => {
    console.log("Sequelize models synced");
    // Start the server after DBs are ready
    app.listen(PORT, () => {
      console.log(`Auth Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection or sync error:", err);
    process.exit(1);
  });

module.exports = app;
