/**
 * Job Service
 * Handles job postings, applications, and job-related operations
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const config = require("./config");
const { notFound } = require('./utils/errorTypes');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Import Sequelize instance for DB connection
const { sequelize } = require("./models");

// Import routes
const jobRoutes = require("./routes/job.routes");

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security middleware
app.use(helmet());
// CORS configuration for production and development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://kelmah-frontend.onrender.com',
      'https://project-kelmah.onrender.com',
      'https://kelmah-frontend-ecru.vercel.app',
      'https://kelmah-frontend-mu.vercel.app',
      process.env.FRONTEND_URL // Dynamic frontend URL from environment
    ].filter(Boolean); // Remove any undefined values
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 200 // for legacy browser support
};

app.use(cors(corsOptions));

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// API routes
app.use("/api/jobs", jobRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    service: "Job Service",
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint with API information
app.get("/", (req, res) => {
  res.status(200).json({
    name: "Job Service API",
    version: "1.0.0",
    description: "Job management service for the Kelmah platform",
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
const PORT = process.env.JOB_SERVICE_PORT || 5003;

// Only start the server if this file is run directly
if (require.main === module) {
  sequelize.authenticate()
    .then(() => {
      console.log('Job Service Postgres connection established');
      return sequelize.sync();
    })
    .then(() => {
      console.log('Job Service models synced');
  app.listen(PORT, () => {
    console.log(`Job Service running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Job Service database connection error:', err);
      process.exit(1);
  });
}

module.exports = app;
