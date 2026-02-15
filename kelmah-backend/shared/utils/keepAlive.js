/**
 * Keep-Alive Utility for Render Microservices
 * Prevents services from spinning down due to inactivity on Render free tier.
 *
 * Features:
 * - Self-ping: each service pings itself to reset the inactivity timer
 * - Cross-service pings: each service pings all siblings to wake them up
 * - Staggered initial pings to avoid thundering herd on cold start
 * - Retry with backoff for services that are still waking up
 * - Skips localhost URLs in production (useless on Render)
 */

const axios = require('axios');

// Render free tier spins down after ~15 min of inactivity.
// Ping every 10 minutes to stay well inside the window.
const DEFAULT_INTERVAL_MS = parseInt(process.env.KEEP_ALIVE_INTERVAL || '600000', 10); // 10 min
const PING_TIMEOUT_MS = 25000; // 25s – Render cold starts can take 20s+
const INITIAL_DELAY_MS = 15000; // 15s – let the service finish booting first

/**
 * Determine whether we're running on Render (or another cloud host)
 */
const isCloudEnv = () =>
  !!(process.env.RENDER || process.env.RENDER_SERVICE_ID || process.env.IS_PULL_REQUEST) ||
  process.env.NODE_ENV === 'production';

/**
 * Build the map of sibling service URLs from environment variables.
 * In production, only include URLs that point to real cloud hosts
 * (skip anything still defaulting to localhost).
 */
const buildServiceMap = (selfName) => {
  const raw = {
    'api-gateway': process.env.API_GATEWAY_URL,
    'auth-service': process.env.AUTH_SERVICE_URL,
    'user-service': process.env.USER_SERVICE_URL,
    'job-service': process.env.JOB_SERVICE_URL,
    'payment-service': process.env.PAYMENT_SERVICE_URL,
    'messaging-service': process.env.MESSAGING_SERVICE_URL,
    'review-service': process.env.REVIEW_SERVICE_URL
  };

  const cloud = isCloudEnv();
  const map = {};

  for (const [name, url] of Object.entries(raw)) {
    if (!url) continue;
    // In production, skip localhost URLs – they can't reach other containers
    if (cloud && url.includes('localhost')) continue;
    // Skip self – self-ping is handled separately
    if (name === selfName) continue;
    map[name] = url;
  }

  return map;
};

/**
 * Resolve the external URL of *this* service for self-pinging.
 * On Render, RENDER_EXTERNAL_URL is set automatically.
 * Otherwise fall back to explicit env vars.
 */
const getSelfUrl = (serviceName) => {
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL;

  const envKey = serviceName.toUpperCase().replace(/-/g, '_') + '_URL';
  return process.env[envKey] || null;
};

class KeepAliveManager {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.enabled = process.env.KEEP_ALIVE_ENABLED !== 'false';
    this.interval = DEFAULT_INTERVAL_MS;
    this.logger = options.logger || console;
    this.timer = null;
    this.selfTimer = null;
    this.lastPingTimes = new Map();
    this.services = buildServiceMap(serviceName);
    this.selfUrl = getSelfUrl(serviceName);
  }

  start() {
    if (!this.enabled) {
      this.logger.info(`Keep-alive disabled via KEEP_ALIVE_ENABLED=false`);
      return;
    }

    if (this.timer) {
      this.logger.warn('Keep-alive already running');
      return;
    }

    const siblingCount = Object.keys(this.services).length;
    const hasSelf = !!this.selfUrl;

    this.logger.info(`🔄 Keep-alive started for ${this.serviceName}`, {
      interval: `${this.interval / 1000}s`,
      siblings: siblingCount,
      selfPing: hasSelf,
      selfUrl: this.selfUrl || '(none – set <SERVICE>_URL env var)'
    });

    // --- Self-ping: runs every 8 minutes to keep THIS service alive ---
    if (hasSelf) {
      const selfInterval = Math.min(this.interval, 8 * 60 * 1000);
      this.selfTimer = setInterval(() => this._pingSelf(), selfInterval);
      // First self-ping after boot
      setTimeout(() => this._pingSelf(), INITIAL_DELAY_MS);
    }

    // --- Sibling pings: stagger the first run, then repeat ---
    if (siblingCount > 0) {
      // Stagger initial ping by 20-40s so not all services hammer at once
      const jitter = INITIAL_DELAY_MS + Math.floor(Math.random() * 20000);
      setTimeout(() => this.pingAllServices(), jitter);

      this.timer = setInterval(() => {
        this.pingAllServices();
      }, this.interval);
    }
  }

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.selfTimer) { clearInterval(this.selfTimer); this.selfTimer = null; }
    this.logger.info(`Keep-alive stopped for ${this.serviceName}`);
  }

  // ---- Self-ping ----
  async _pingSelf() {
    if (!this.selfUrl) return;
    try {
      await axios.get(`${this.selfUrl}/health`, {
        timeout: 10000,
        headers: { 'User-Agent': 'Kelmah-SelfPing/1.0', 'X-Keep-Alive-Ping': 'true' }
      });
      this.logger.debug(`🏓 Self-ping OK (${this.serviceName})`);
    } catch (err) {
      this.logger.warn(`🏓 Self-ping FAIL (${this.serviceName}): ${err.message}`);
    }
  }

  // ---- Sibling pings ----
  async pingAllServices() {
    const startTime = Date.now();
    const entries = Object.entries(this.services);
    if (entries.length === 0) return [];

    // Ping all siblings concurrently
    const results = await Promise.allSettled(
      entries.map(([name, url]) => this.pingService(name, url))
    );

    const mapped = results.map((r, i) =>
      r.status === 'fulfilled' ? r.value : { service: entries[i][0], success: false, error: r.reason?.message }
    );

    const ok = mapped.filter(r => r.success).length;
    this.logger.info(`Keep-alive cycle done`, {
      from: this.serviceName,
      success: `${ok}/${mapped.length}`,
      duration: `${Date.now() - startTime}ms`
    });

    return mapped;
  }

  async pingService(name, url) {
    const t0 = Date.now();
    try {
      const res = await axios.get(`${url}/health`, {
        timeout: PING_TIMEOUT_MS,
        headers: {
          'X-Keep-Alive-Ping': 'true',
          'X-Ping-Source': this.serviceName,
          'User-Agent': 'Kelmah-KeepAlive/1.0'
        }
      });

      const dur = Date.now() - t0;
      this.lastPingTimes.set(name, new Date());
      this.logger.debug(`✅ Pinged ${name} (${res.status}) in ${dur}ms`);
      return { service: name, success: true, status: res.status, duration: dur };
    } catch (error) {
      const dur = Date.now() - t0;
      this.logger.warn(`❌ Ping failed ${name}: ${error.message} (${dur}ms)`);
      return { service: name, success: false, error: error.message, duration: dur };
    }
  }

  getStatus() {
    return {
      enabled: this.enabled,
      serviceName: this.serviceName,
      interval: this.interval,
      running: !!this.timer,
      selfPing: !!this.selfTimer,
      selfUrl: this.selfUrl,
      services: Object.keys(this.services),
      lastPingTimes: Object.fromEntries(this.lastPingTimes)
    };
  }

  async triggerPing() {
    return await this.pingAllServices();
  }
}

/**
 * Create and initialize keep-alive manager for a service
 */
function initKeepAlive(serviceName, options = {}) {
  const manager = new KeepAliveManager(serviceName, options);

  if (process.env.KEEP_ALIVE_AUTOSTART !== 'false') {
    manager.start();
  }

  process.on('SIGTERM', () => manager.stop());
  process.on('SIGINT', () => manager.stop());

  return manager;
}

/**
 * Express middleware to expose keep-alive status endpoint
 */
function keepAliveMiddleware(manager) {
  return function(req, res, next) {
    if (req.path === '/health/keepalive' || req.path === '/api/health/keepalive') {
      return res.json({ success: true, data: manager.getStatus() });
    }
    next();
  };
}

/**
 * Express route handler to trigger manual ping
 */
function keepAliveTriggerHandler(manager) {
  return async function(req, res) {
    try {
      const results = await manager.triggerPing();
      res.json({ success: true, message: 'Keep-alive ping triggered', data: results });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to trigger keep-alive ping', error: error.message });
    }
  };
}

module.exports = {
  KeepAliveManager,
  initKeepAlive,
  keepAliveMiddleware,
  keepAliveTriggerHandler
};
