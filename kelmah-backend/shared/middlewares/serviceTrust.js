/**
 * Service Trust Middleware
 * Handles authentication for service-to-service communication
 * Services should trust API Gateway authentication headers
 */

const crypto = require('crypto');

/**
 * Whitelist-validate a parsed user object from the gateway header.
 * Only known, safe properties are kept — everything else is stripped.
 */
function validateGatewayUser(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const { id, email, role, firstName, lastName, isEmailVerified, tokenVersion } = parsed;

  // id and role are mandatory
  if (!id || typeof id !== 'string') return null;
  if (!role || typeof role !== 'string') return null;

  const ALLOWED_ROLES = ['worker', 'hirer', 'admin', 'super_admin', 'staff'];

  return {
    id,
    email: typeof email === 'string' ? email : null,
    role,
    firstName: typeof firstName === 'string' ? firstName : null,
    lastName: typeof lastName === 'string' ? lastName : null,
    isEmailVerified: typeof isEmailVerified === 'boolean' ? isEmailVerified : false,
    tokenVersion: typeof tokenVersion === 'number' ? tokenVersion : 0
  };
}

/**
 * Timing-safe string comparison to prevent timing attacks on secrets.
 */
function timingSafeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

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
    // Verify HMAC signature if INTERNAL_API_KEY is configured (prevents header spoofing)
    const signature = req.headers['x-gateway-signature'];
    const hmacSecret = process.env.INTERNAL_API_KEY || process.env.JWT_SECRET || '';
    if (hmacSecret && signature) {
      const expected = crypto.createHmac('sha256', hmacSecret).update(gatewayAuth).digest('hex');
      if (!timingSafeCompare(signature, expected)) {
        return res.status(401).json({
          error: 'Invalid gateway signature',
          message: 'Gateway authentication header signature mismatch'
        });
      }
    }
    try {
      const parsed = JSON.parse(gatewayAuth);
      const user = validateGatewayUser(parsed);
      if (!user) {
        return res.status(400).json({
          error: 'Invalid gateway authentication',
          message: 'User information failed validation'
        });
      }
      req.user = user;
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

  // Legacy gateway headers — require HMAC verification to prevent header spoofing
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  const userEmail = req.headers['x-user-email'];

  if (userId && userRole) {
    // Verify HMAC signature for legacy headers too
    const legacySignature = req.headers['x-gateway-signature'];
    const legacyHmacSecret = process.env.INTERNAL_API_KEY || process.env.JWT_SECRET || '';
    if (!legacyHmacSecret || !legacySignature) {
      return res.status(401).json({
        error: 'Legacy gateway headers require HMAC verification',
        message: 'Missing signature for legacy service trust'
      });
    }
    const expectedLegacy = crypto.createHmac('sha256', legacyHmacSecret).update(`${userId}:${userRole}`).digest('hex');
    if (!timingSafeCompare(legacySignature, expectedLegacy)) {
      return res.status(401).json({
        error: 'Invalid legacy gateway signature',
        message: 'Legacy header signature mismatch'
      });
    }
    const ALLOWED_ROLES = ['worker', 'hirer', 'admin', 'super_admin', 'staff'];
    if (!ALLOWED_ROLES.includes(userRole)) {
      return res.status(403).json({
        error: 'Invalid role',
        message: 'Unrecognized user role in gateway headers'
      });
    }
    req.user = {
      id: userId,
      role: userRole,
      email: userEmail || null
    };
    req.isGatewayAuthenticated = true;
    return next();
  }

  // Allow internal service requests with internal key (timing-safe comparison)
  if (internalKey && process.env.INTERNAL_API_KEY && timingSafeCompare(internalKey, process.env.INTERNAL_API_KEY)) {
    req.isInternalRequest = true;
    return next();
  }

  if (internalRequest && process.env.INTERNAL_API_KEY && timingSafeCompare(internalRequest, process.env.INTERNAL_API_KEY)) {
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
      const parsed = JSON.parse(gatewayAuth);
      const user = validateGatewayUser(parsed);
      if (user) {
        req.user = user;
        req.isGatewayAuthenticated = true;
      }
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