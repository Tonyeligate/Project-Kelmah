/**
 * Monitoring utilities for auth service
 */

function initErrorMonitoring(serviceName) {
  console.log(`Initialized error monitoring for ${serviceName}`);
}

function initTracing(serviceName) {
  console.log(`Initialized tracing for ${serviceName}`);
}

module.exports = {
  initErrorMonitoring,
  initTracing
};