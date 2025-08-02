/**
 * User Service
 * Handles user profile management, settings, and user-related operations
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const config = require("./config");
const { notFound } = require("./utils/errorTypes");

// Database connection and model initialization
const { sequelize } = require("./config/db");
const initUserModel = require("./models/User");
const initSettingModel = require("./models/Setting");
const initNotificationModel = require("./models/Notification");

const User = initUserModel(sequelize);
const Setting = initSettingModel(sequelize);
const Notification = initNotificationModel(sequelize);

// Import routes
const userRoutes = require("./routes/user.routes");
const profileRoutes = require("./routes/profile.routes");
const settingsRoutes = require("./routes/settings.routes");

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security middleware
app.use(helmet());
// CORS configuration with multiple allowed origins
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
    
    if (!origin) return callback(null, true); // Allow no origin (mobile apps, etc.)
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-User-ID", "X-User-Role", "X-Request-ID", "X-Client-Version", "X-Target-Service", "X-Service-Client"],
};

app.use(cors(corsOptions));

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// API routes
app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/settings", settingsRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    service: "User Service",
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint with API information
app.get("/", (req, res) => {
  res.status(200).json({
    name: "User Service API",
    version: "1.0.0",
    description: "User management service for the Kelmah platform",
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
const PORT = process.env.USER_SERVICE_PORT || 5002;

// Only start the server if this file is run directly
if (require.main === module) {
  sequelize.authenticate()
    .then(() => {
      console.log("User Service SQL connection established");
      return sequelize.sync();
    })
    .then(() => {
      console.log("User Service models synced");
      app.listen(PORT, () => {
        console.log(`User Service running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error("User Service database error:", err);
      process.exit(1);
    });
}

module.exports = app;
