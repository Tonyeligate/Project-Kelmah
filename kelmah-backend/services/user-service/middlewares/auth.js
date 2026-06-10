const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    
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
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ success: false, message: 'Request body is required' });
  }

  const errors = [];

  // isAvailable must be boolean
  if ('isAvailable' in body && typeof body.isAvailable !== 'boolean') {
    errors.push('isAvailable must be a boolean');
  }

  // timezone must be a non-empty string
  if ('timezone' in body && (typeof body.timezone !== 'string' || body.timezone.trim().length === 0)) {
    errors.push('timezone must be a non-empty string');
  }

  // dailyHours must be a number between 0 and 24
  if ('dailyHours' in body) {
    const dh = Number(body.dailyHours);
    if (!Number.isFinite(dh) || dh < 0 || dh > 24) {
      errors.push('dailyHours must be a number between 0 and 24');
    }
  }

  // weeklyHoursCap must be a number between 0 and 168
  if ('weeklyHoursCap' in body) {
    const wh = Number(body.weeklyHoursCap);
    if (!Number.isFinite(wh) || wh < 0 || wh > 168) {
      errors.push('weeklyHoursCap must be a number between 0 and 168');
    }
  }

  // daySlots must be an array of valid slot objects
  if ('daySlots' in body) {
    if (!Array.isArray(body.daySlots)) {
      errors.push('daySlots must be an array');
    } else {
      body.daySlots.forEach((slot, i) => {
        if (typeof slot !== 'object' || slot === null) {
          errors.push(`daySlots[${i}] must be an object`);
        } else {
          if (typeof slot.dayOfWeek !== 'number' || slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
            errors.push(`daySlots[${i}].dayOfWeek must be a number between 0 and 6`);
          }
          if (slot.slots !== undefined && !Array.isArray(slot.slots)) {
            errors.push(`daySlots[${i}].slots must be an array`);
          }
        }
      });
    }
  }

  // holidays must be an array of objects with a valid date
  if ('holidays' in body) {
    if (!Array.isArray(body.holidays)) {
      errors.push('holidays must be an array');
    } else {
      body.holidays.forEach((h, i) => {
        if (typeof h !== 'object' || h === null || !h.date) {
          errors.push(`holidays[${i}] must be an object with a date field`);
        } else if (isNaN(new Date(h.date).getTime())) {
          errors.push(`holidays[${i}].date must be a valid date`);
        }
      });
    }
  }

  // pausedUntil must be a valid date if provided
  if ('pausedUntil' in body && body.pausedUntil !== null) {
    if (isNaN(new Date(body.pausedUntil).getTime())) {
      errors.push('pausedUntil must be a valid date');
    }
  }

  // notes must be a string
  if ('notes' in body && typeof body.notes !== 'string') {
    errors.push('notes must be a string');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Invalid availability payload', errors });
  }

  next();
};

module.exports = { authenticate, authorizeRoles, validateAvailabilityPayload };