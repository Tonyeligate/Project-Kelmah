// CI/boot-time environment validation helper
function requireEnv(keys = []) {
  const missing = keys.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');
  if (missing.length > 0) {
    const err = new Error(`Missing required environment variables: ${missing.join(', ')}`);
    err.code = 'ENV_MISSING';
    throw err;
  }
}

module.exports = { requireEnv };


