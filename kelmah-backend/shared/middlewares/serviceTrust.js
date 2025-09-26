/**
 * Service Trust Middleware
 * Handles authentication for service-to-service communication
 * Services should trust API Gateway authentication headers
 */

/**
 * Middleware to verify requests are coming from API Gateway
 * Used by downstream services to trust gateway authentication
 */
const verifyGatewayRequest = (req, res, next) => {
  // Check for gateway authentication headers (new format)
  const gatewayAuth = req.headers['x-authenticated-user'];
  const authSource = req.headers['x-auth-source'];
  const internalKey = req.headers['x-internal-key'];
  const internalRequest = req.headers['x-internal-request'];

  // Allow requests from API Gateway with authenticated user info (new format)
  if (gatewayAuth && authSource === 'api-gateway') {
    try {
      // Parse user info from gateway
      req.user = JSON.parse(gatewayAuth);
      req.isGatewayAuthenticated = true;
      return next();
    } catch (error) {
      console.error('Failed to parse gateway user info:', error);
      return res.status(400).json({ 
        error: 'Invalid gateway authentication',
        message: 'Malformed user information' 
      });
    }
  }

  // Check for legacy gateway headers (backward compatibility)
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  const userEmail = req.headers['x-user-email'];

  if (userId && userRole) {
    // Construct user object from legacy headers
    req.user = {
      id: userId,
      role: userRole,
      email: userEmail || null
    };
    req.isGatewayAuthenticated = true;
    return next();
  }

  // Allow internal service requests with internal key
  if (internalKey && process.env.INTERNAL_API_KEY && internalKey === process.env.INTERNAL_API_KEY) {
    req.isInternalRequest = true;
    return next();
  }

  if (internalRequest && process.env.INTERNAL_API_KEY && internalRequest === process.env.INTERNAL_API_KEY) {
    req.isInternalRequest = true;
    return next();
  }

  // Block direct requests without gateway authentication
  return res.status(401).json({
    error: 'Direct service access not allowed',
    message: 'Requests must be routed through API Gateway'
  });
};

/**
 * Optional gateway verification - allows both gateway and direct requests
 * Used for public endpoints that may be called directly or through gateway
 */
const optionalGatewayVerification = (req, res, next) => {
  const gatewayAuth = req.headers['x-authenticated-user'];
  const authSource = req.headers['x-auth-source'];

  if (gatewayAuth && authSource === 'api-gateway') {
    try {
      req.user = JSON.parse(gatewayAuth);
      req.isGatewayAuthenticated = true;
    } catch (error) {
      console.warn('Invalid gateway authentication headers, proceeding without auth');
    }
  }

  next();
};

/**
 * Extract user info from gateway headers
 * Helper function for services to get authenticated user info
 */
const getGatewayUser = (req) => {
  if (req.isGatewayAuthenticated && req.user) {
    return req.user;
  }
  return null;
};

module.exports = {
  verifyGatewayRequest,
  optionalGatewayVerification,
  getGatewayUser
};