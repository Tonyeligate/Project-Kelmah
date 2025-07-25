const jwt = require("jsonwebtoken");
const { MessagingServiceError } = require("../utils/errorHandler");

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new MessagingServiceError("No token provided", 401);
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      throw new MessagingServiceError("Invalid token", 401);
    }
  } catch (error) {
    if (error instanceof MessagingServiceError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Optional: Role-based authorization middleware
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Not authorized to perform this action",
      });
    }
    next();
  };
};
