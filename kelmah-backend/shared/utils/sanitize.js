/**
 * Shared Sanitization Utilities
 * Provides common security helpers used across all microservices.
 */

/**
 * Escape a user-supplied string so it is safe to use inside a RegExp or
 * MongoDB `$regex`.  Prevents ReDoS (Regular Expression Denial of Service).
 *
 * @param {string} str - Raw user input
 * @returns {string} Escaped string safe for `new RegExp()` / `$regex`
 */
function escapeRegex(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Pick only allowed keys from an object (field allowlist).
 * Use this instead of spreading `req.body` into DB operations to prevent
 * mass-assignment / property-injection vulnerabilities.
 *
 * @param {Object} source - The raw input object (e.g. req.body)
 * @param {string[]} allowed - Array of permitted key names
 * @returns {Object} New object containing only the allowed keys that exist in source
 */
function pickAllowedFields(source, allowed) {
  if (!source || typeof source !== 'object') return {};
  const result = {};
  for (const key of allowed) {
    if (key in source) {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Sanitize an error message for client-facing responses.
 * Strips internal details (file paths, stack traces, connection strings)
 * and returns a generic message for 500-level errors.
 *
 * @param {Error} err - The original error
 * @param {string} [fallback] - Optional user-friendly fallback message
 * @returns {string} Safe message for the response body
 */
function sanitizeErrorMessage(err, fallback = 'An unexpected error occurred') {
  if (!err) return fallback;
  const code = err.statusCode || 500;
  // For client errors (4xx), the message is usually intentional
  if (code >= 400 && code < 500) {
    return err.message || fallback;
  }
  // For server errors, never leak internal details
  return fallback;
}

/**
 * Clamp a user-supplied `limit` query parameter to a safe maximum.
 *
 * @param {*} raw - Raw query value (string or number)
 * @param {number} [defaultVal=20] - Default if raw is missing/invalid
 * @param {number} [max=100] - Maximum allowed value
 * @returns {number}
 */
function clampLimit(raw, defaultVal = 20, max = 100) {
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return defaultVal;
  return Math.min(parsed, max);
}

module.exports = {
  escapeRegex,
  pickAllowedFields,
  sanitizeErrorMessage,
  clampLimit,
};
