/**
 * Keep-Alive Utility for Render Microservices
 * Prevents services from spinning down due to inactivity
 * 
 * Features:
 * - Periodic health checks to all services
 * - Self-ping capability
 * - Cascading pings (each service pings others)
 * - Configurable intervals
 */

const axios = require('axios');

class KeepAliveManager {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.enabled = process.env.KEEP_ALIVE_ENABLED !== 'false';
    this.interval = parseInt(process.env.KEEP_ALIVE_INTERVAL || '720000'); // 12 minutes default
    this.logger = options.logger || console;
    this.timer = null;
    this.lastPingTimes = new Map();
    
    // Service URLs from environment or defaults
    this.services = {
      'api-gateway': process.env.API_GATEWAY_URL || 'http://localhost:5000',
      'auth-service': process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
      'user-service': process.env.USER_SERVICE_URL || 'http://localhost:5002',
      'job-service': process.env.JOB_SERVICE_URL || 'http://localhost:5003',
      'payment-service': process.env.PAYMENT_SERVICE_URL || 'http://localhost:5004',
      'messaging-service': process.env.MESSAGING_SERVICE_URL || 'http://localhost:5005',
      'review-service': process.env.REVIEW_SERVICE_URL || 'http://localhost:5006'
    };

    // Remove self from ping list
    delete this.services[serviceName];
  }

  /**
   * Start the keep-alive mechanism
   */
  start() {
    if (!this.enabled) {
      this.logger.info('Keep-alive disabled via KEEP_ALIVE_ENABLED=false');
      return;
    }

    if (this.timer) {
      this.logger.warn('Keep-alive already running');
      return;
    }

    this.logger.info(`🔄 Keep-alive started for ${this.serviceName}`, {
      interval: `${this.interval / 1000}s`,
      servicesCount: Object.keys(this.services).length
    });

    // Initial ping after 30 seconds
    setTimeout(() => this.pingAllServices(), 30000);

    // Then ping at regular intervals
    this.timer = setInterval(() => {
      this.pingAllServices();
    }, this.interval);
  }

  /**
   * Stop the keep-alive mechanism
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.logger.info(`Keep-alive stopped for ${this.serviceName}`);
    }
  }

  /**
   * Ping all registered services
   */
  async pingAllServices() {
    const startTime = Date.now();
    const results = [];

    for (const [name, url] of Object.entries(this.services)) {
      try {
        const result = await this.pingService(name, url);
        results.push(result);
      } catch (error) {
        results.push({
          service: name,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    this.logger.info(`Keep-alive ping cycle complete`, {
      success: `${successCount}/${totalCount}`,
      duration: `${duration}ms`,
      from: this.serviceName
    });

    return results;
  }

  /**
   * Ping a specific service
   */
  async pingService(name, url) {
    const pingStart = Date.now();
    
    try {
      const response = await axios.get(`${url}/health`, {
        timeout: 10000,
        headers: {
          'X-Keep-Alive-Ping': 'true',
          'X-Ping-Source': this.serviceName,
          'User-Agent': 'Kelmah-KeepAlive/1.0'
        }
      });

      const duration = Date.now() - pingStart;
      this.lastPingTimes.set(name, new Date());

      this.logger.debug(`✅ Pinged ${name}`, {
        status: response.status,
        duration: `${duration}ms`
      });

      return {
        service: name,
        success: true,
        status: response.status,
        duration,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const duration = Date.now() - pingStart;
      
      // Don't log errors for localhost services (development)
      if (!url.includes('localhost')) {
        this.logger.warn(`❌ Failed to ping ${name}`, {
          url,
          error: error.message,
          duration: `${duration}ms`
        });
      }

      return {
        service: name,
        success: false,
        error: error.message,
        duration,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get keep-alive status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      serviceName: this.serviceName,
      interval: this.interval,
      running: !!this.timer,
      services: Object.keys(this.services),
      lastPingTimes: Object.fromEntries(this.lastPingTimes)
    };
  }

  /**
   * Manual trigger for ping cycle
   */
  async triggerPing() {
    return await this.pingAllServices();
  }
}

/**
 * Create and initialize keep-alive manager for a service
 */
function initKeepAlive(serviceName, options = {}) {
  const manager = new KeepAliveManager(serviceName, options);
  
  // Auto-start if not disabled
  if (process.env.KEEP_ALIVE_AUTOSTART !== 'false') {
    manager.start();
  }

  // Graceful shutdown
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
      return res.json({
        success: true,
        data: manager.getStatus()
      });
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
      res.json({
        success: true,
        message: 'Keep-alive ping triggered',
        data: results
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to trigger keep-alive ping',
        error: error.message
      });
    }
  };
}

module.exports = {
  KeepAliveManager,
  initKeepAlive,
  keepAliveMiddleware,
  keepAliveTriggerHandler
};
