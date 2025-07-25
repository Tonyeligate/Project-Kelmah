const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Import routes
const messageRoutes = require("./routes/message.routes");
const conversationRoutes = require("./routes/conversation.routes");
const notificationRoutes = require("./routes/notification.routes");

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Set mongoose strictQuery option to suppress deprecation warning
mongoose.set('strictQuery', false);

// Connect to MongoDB
const mongoUri = process.env.MESSAGING_MONGO_URI || process.env.MONGODB_URI;
console.log("Attempting to connect to MongoDB...");
mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000,
  })
  .then(() => {
    console.log("Connected to MongoDB");

    // Start server
    const PORT = process.env.PORT || 3003;
    app.listen(PORT, () => {
      console.log(`Messaging service is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
    if (error.message.includes("IP") || error.message.includes("whitelist")) {
      console.error("💡 SOLUTION: Add 0.0.0.0/0 to MongoDB Atlas Network Access whitelist for production deployment");
      console.error("💡 Go to: MongoDB Atlas > Network Access > Add IP Address > Allow Access from Anywhere");
    }
    console.error("Environment check:");
    console.error("MESSAGING_MONGO_URI:", process.env.MESSAGING_MONGO_URI ? "✅ Set" : "❌ Not set");
    console.error("MONGODB_URI:", process.env.MONGODB_URI ? "✅ Set" : "❌ Not set");
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  // Close server & exit process
  process.exit(1);
});
