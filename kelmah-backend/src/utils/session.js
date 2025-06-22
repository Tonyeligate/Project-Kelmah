/**
 * Session Utility
 * Provides a lightweight in-memory session store.
 *
 * NOTE: In production you should replace this with a persistent store
 * such as Redis so the data survives restarts and can be shared across
 * multiple instances. The interface remains the same so the swap is
 * seamless.
 */

const { randomUUID } = require('crypto');

// Map<sessionId, sessionObject>
const sessions = new Map();

/**
 * Create a new session entry
 * @param {Object} param0 { userId, deviceInfo, ip }
 * @returns {Promise<Object>} newly created session
 */
exports.create = async ({ userId, deviceInfo = null, ip = null }) => {
  const id = randomUUID();
  const now = new Date();
  const session = {
    id,
    userId,
    deviceInfo,
    ip,
    createdAt: now,
    lastSeenAt: now,
    endedAt: null,
  };
  sessions.set(id, session);
  return session;
};

/**
 * Update last-seen timestamp for a session (optional helper)
 */
exports.touch = async (sessionId) => {
  const s = sessions.get(sessionId);
  if (s && !s.endedAt) {
    s.lastSeenAt = new Date();
    sessions.set(sessionId, s);
  }
};

/**
 * Get a session by its id
 */
exports.get = async (sessionId) => sessions.get(sessionId) || null;

/**
 * Return active sessions for a given user (no endedAt)
 */
exports.getActiveSessions = async (userId) => {
  return Array.from(sessions.values()).filter((s) => s.userId === userId && !s.endedAt);
};

/**
 * End a single session
 */
exports.end = async (sessionId) => {
  const s = sessions.get(sessionId);
  if (s && !s.endedAt) {
    s.endedAt = new Date();
    sessions.set(sessionId, s);
  }
};

/**
 * End all sessions for a user except the provided one (typically current)
 */
exports.endAllExcept = async (userId, keepSessionId) => {
  for (const [id, s] of sessions) {
    if (s.userId === userId && id !== keepSessionId && !s.endedAt) {
      s.endedAt = new Date();
      sessions.set(id, s);
    }
  }
};

/**
 * End ALL sessions for a user
 */
exports.endAll = async (userId) => {
  for (const [id, s] of sessions) {
    if (s.userId === userId && !s.endedAt) {
      s.endedAt = new Date();
      sessions.set(id, s);
    }
  }
}; 