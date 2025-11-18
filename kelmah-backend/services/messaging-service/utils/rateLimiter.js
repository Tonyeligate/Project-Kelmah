const expressRateLimit = require("express-rate-limit");

const LIMITS = {
  messaging: { windowMs: 15 * 60 * 1000, max: 500 }, // Increased for notification polling
  notifications: { windowMs: 5 * 60 * 1000, max: 200 }, // Special limit for notifications: 200 requests per 5 minutes
  default: { windowMs: 15 * 60 * 1000, max: 200 }, // Increased default limit
};

function createLimiter(key = "default") {
  const cfg = LIMITS[key] || LIMITS.default;

  return expressRateLimit({
    windowMs: cfg.windowMs,
    max: cfg.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests. Please try again later.",
    },
    keyGenerator: (req) => {
      // Prefer the authenticated user propagated from the API Gateway so each
      // account has its own bucket and shared IPs (Render/Vercel) don’t trigger 429s.
      const userId = req.user?.id || req.user?._id;
      if (userId) {
        return `user:${userId}`;
      }

      // Fall back to x-authenticated-user header if middleware hasn’t parsed it yet.
      const gatewayHeader = req.headers["x-authenticated-user"];
      if (gatewayHeader) {
        try {
          const parsed = JSON.parse(gatewayHeader);
          if (parsed?.id) {
            return `user:${parsed.id}`;
          }
        } catch (_) {
          /* swallow JSON parse errors and continue to IP fallback */
        }
      }

      // Final fallback: combine IP with optional email (legacy behaviour).
      return `${req.ip}:${(req.body?.email || "").toLowerCase()}`;
    },
  });
}

module.exports = { createLimiter };
