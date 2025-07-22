/**
 * Auth Service
 * Handles authentication, authorization, and user identity management
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const config = require("./config");
const { notFound } = require("./utils/errorTypes");
const mongoose = require("mongoose");
const { connectDB, sequelize } = require("./config/db");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

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
// CORS middleware: reflect request origin to allow dynamic front-end domains
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
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
