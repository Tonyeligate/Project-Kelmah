// Simple monitoring utilities for containerized deployment
function initErrorMonitoring(serviceName) {
  try {
    if ((process.env.ENABLE_SENTRY || "").toLowerCase() !== "true") {
      return { enabled: false };
    }
    const Sentry = require("@sentry/node");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || "development",
      serverName: serviceName,
    });
    return { enabled: true, Sentry };
  } catch (err) {
    return { enabled: false };
  }
}

function initTracing(serviceName) {
  return { enabled: false, serviceName }; // Delegate to tracing.js
}

module.exports = { initErrorMonitoring, initTracing };
