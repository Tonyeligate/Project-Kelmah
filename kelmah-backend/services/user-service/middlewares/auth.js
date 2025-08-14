const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userId = decoded.id || decoded.sub;
    if (!userId) return res.status(401).json({ message: 'Invalid token' });
    
    req.user = { 
      id: userId, 
      email: decoded.email, 
      role: decoded.role, 
      version: decoded.version 
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  next();
};

const validateAvailabilityPayload = (req, res, next) => {
  // Basic validation for availability payload
  next();
};

module.exports = { authenticate, authorizeRoles, validateAvailabilityPayload };