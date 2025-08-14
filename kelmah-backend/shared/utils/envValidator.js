function requireEnv(vars, serviceName) {
  const missing = vars.filter((v) => !process.env[v]);
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.error(`[env] ${serviceName || 'service'} missing required env: ${missing.join(', ')}`);
    process.exit(1);
  }
}

module.exports = { requireEnv };


