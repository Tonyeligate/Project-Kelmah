/**
 * Environment variable validation utilities
 */

function requireEnv(vars, serviceName) {
  const missing = [];
  
  for (const varName of vars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`${serviceName} missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = {
  requireEnv
};