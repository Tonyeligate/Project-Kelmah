/**
 * Session Utilities
 * Manages user sessions with in-memory storage for development
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

// In-memory session store for development (use Redis in production)
const sessions = new Map();

  /**
   * Create a new session
 * @param {Object} data - Session data including userId and device info
 * @returns {Object} - Created session
 */
exports.create = async (data) => {
  const sessionId = uuidv4();
  
  // Sanitize deviceInfo to prevent "Cannot read properties of undefined" errors
  let sanitizedDeviceInfo = {};
  if (data.deviceInfo) {
    sanitizedDeviceInfo = {
      browser: {
        name: data.deviceInfo.browser?.name || 'Unknown',
        version: data.deviceInfo.browser?.version || 'Unknown'
      },
      os: {
        name: data.deviceInfo.os?.name || 'Unknown',
        version: data.deviceInfo.os?.version || 'Unknown'
      },
      device: {
        type: data.deviceInfo.device?.type || 'Unknown'
      }
    };
  }

      const session = {
    id: sessionId,
    userId: data.userId,
    deviceInfo: sanitizedDeviceInfo, // Use the sanitized version
    ip: data.ip,
        createdAt: new Date(),
        lastActive: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  };
  
  // Store in memory
  sessions.set(sessionId, session);
  
  logger.info(`Created new session: ${sessionId} for user: ${data.userId}`);
      return session;
};

/**
 * Get a session by ID
 * @param {string} sessionId - Session ID
 * @returns {Object|null} - Session data or null if not found
 */
exports.get = async (sessionId) => {
  return sessions.get(sessionId) || null;
};

/**
 * Get all sessions for a user
 * @param {string} userId - User ID 
 * @returns {Array} - Array of sessions
 */
exports.getAllForUser = async (userId) => {
  const userSessions = [];
  
  for (const session of sessions.values()) {
    if (session.userId === userId) {
      userSessions.push(session);
    }
  }
  
  return userSessions;
};

/**
 * Update a session's last active timestamp
 * @param {string} sessionId - Session ID
 * @returns {boolean} - Success status
 */
exports.updateActivity = async (sessionId) => {
  const session = sessions.get(sessionId);
  
  if (!session) {
    return false;
  }
  
  session.lastActive = new Date();
  sessions.set(sessionId, session);
  
  return true;
};

/**
 * End a specific session
 * @param {string} sessionId - Session ID
 * @returns {boolean} - Success status
 */
exports.end = async (sessionId) => {
  return sessions.delete(sessionId);
};

/**
 * End all sessions for a user except current
   * @param {string} userId - User ID
 * @param {string} currentSessionId - Current session ID to keep
 * @returns {number} - Number of sessions terminated
 */
exports.endAllForUser = async (userId, currentSessionId) => {
  let count = 0;
  
  for (const [sessionId, session] of sessions.entries()) {
    if (session.userId === userId && sessionId !== currentSessionId) {
      sessions.delete(sessionId);
      count++;
    }
  }
  
  return count;
};

  /**
   * Clean up expired sessions
 * Should be called periodically
 * @returns {number} - Number of sessions cleaned up
 */
exports.cleanupExpired = async () => {
  const now = new Date();
  let count = 0;
  
  for (const [sessionId, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(sessionId);
      count++;
    }
  }
  
  logger.info(`Cleaned up ${count} expired sessions`);
  return count;
}; 