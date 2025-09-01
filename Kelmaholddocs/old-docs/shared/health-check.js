/**
 * Health Check Utility
 * Standardized health check endpoints for all Kelmah services
 */

const mongoose = require('mongoose');
const axios = require('axios');

/**
 * Basic health check response
 * @param {string} serviceName - Name of the service
 * @param {string} version - Service version
 * @returns {object} Health check response
 */
function getBasicHealth(serviceName, version = '1.0.0') {
  return {
    service: serviceName,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    pid: process.pid
  };
}

/**
 * Check MongoDB connection health
 * @returns {Promise<object>} MongoDB health status
 */
async function checkMongoHealth() {
  try {
    if (!mongoose.connection.readyState) {
      return {
        status: 'disconnected',
        message: 'MongoDB not connected',
        readyState: 0
      };
    }
    
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting', 
      3: 'disconnecting'
    };
    
    if (state === 1) {
      // Test the connection with a simple ping
      await mongoose.connection.db.admin().ping();
      
      return {
        status: 'healthy',
        state: states[state],
        readyState: state,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      };
    } else {
      return {
        status: 'unhealthy',
        state: states[state],
        readyState: state
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: error.message,
      readyState: mongoose.connection.readyState
    };
  }
}

/**
 * Check external service health
 * @param {string} serviceUrl - URL of the service to check
 * @param {string} serviceName - Name of the service
 * @param {number} timeout - Request timeout in ms
 * @returns {Promise<object>} Service health status
 */
async function checkServiceHealth(serviceUrl, serviceName, timeout = 5000) {
  try {
    const startTime = Date.now();
    const response = await axios.get(`${serviceUrl}/health`, { 
      timeout,
      validateStatus: (status) => status < 500 // Accept 4xx as "reachable"
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: response.status === 200 ? 'healthy' : 'degraded',
      url: serviceUrl,
      responseTime: `${responseTime}ms`,
      statusCode: response.status,
      version: response.data?.version || 'unknown'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      url: serviceUrl,
      error: error.code || error.message,
      timeout: error.code === 'ECONNABORTED'
    };
  }
}

/**
 * Check system resources
 * @returns {object} System health information
 */
function checkSystemHealth() {
  const memUsage = process.memoryUsage();
  const totalMem = memUsage.heapTotal + memUsage.external;
  const usedMem = memUsage.heapUsed;
  const memPercent = ((usedMem / totalMem) * 100).toFixed(2);
  
  return {
    memory: {
      used: `${Math.round(usedMem / 1024 / 1024)}MB`,
      total: `${Math.round(totalMem / 1024 / 1024)}MB`,
      percentage: `${memPercent}%`,
      raw: memUsage
    },
    uptime: {
      process: `${Math.round(process.uptime())}s`,
      system: process.platform !== 'win32' ? `${Math.round(require('os').uptime())}s` : 'N/A'
    },
    cpu: {
      usage: process.cpuUsage(),
      load: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0]
    }
  };
}

/**
 * Create comprehensive health check endpoint
 * @param {string} serviceName - Name of the service
 * @param {object} options - Health check options
 * @returns {Function} Express route handler
 */
function createHealthCheck(serviceName, options = {}) {
  const {
    version = '1.0.0',
    checkMongo = true,
    externalServices = [],
    customChecks = []
  } = options;
  
  return async (req, res) => {
    const startTime = Date.now();
    const health = getBasicHealth(serviceName, version);
    
    // Add detailed query parameter for more info
    const detailed = req.query.detailed === 'true';
    
    try {
      const checks = {};
      
      // Check MongoDB if enabled
      if (checkMongo) {
        checks.database = await checkMongoHealth();
      }
      
      // Check external services
      if (externalServices.length > 0) {
        checks.externalServices = {};
        const serviceChecks = externalServices.map(async (service) => {
          const result = await checkServiceHealth(service.url, service.name);
          return { name: service.name, result };
        });
        
        const results = await Promise.allSettled(serviceChecks);
        results.forEach((result, index) => {
          const serviceName = externalServices[index].name;
          checks.externalServices[serviceName] = result.status === 'fulfilled' 
            ? result.value.result 
            : { status: 'error', error: result.reason.message };
        });
      }
      
      // Run custom health checks
      if (customChecks.length > 0) {
        checks.custom = {};
        for (const check of customChecks) {
          try {
            checks.custom[check.name] = await check.fn();
          } catch (error) {
            checks.custom[check.name] = {
              status: 'error',
              error: error.message
            };
          }
        }
      }
      
      // Add system information if detailed
      if (detailed) {
        checks.system = checkSystemHealth();
      }
      
      // Determine overall health status
      const hasUnhealthyChecks = Object.values(checks).some(check => {
        if (typeof check === 'object' && check.status) {
          return check.status === 'unhealthy' || check.status === 'error';
        }
        if (typeof check === 'object') {
          return Object.values(check).some(subCheck => 
            subCheck.status === 'unhealthy' || subCheck.status === 'error'
          );
        }
        return false;
      });
      
      health.status = hasUnhealthyChecks ? 'degraded' : 'healthy';
      health.checks = checks;
      health.responseTime = `${Date.now() - startTime}ms`;
      
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
      
    } catch (error) {
      health.status = 'error';
      health.error = error.message;
      health.responseTime = `${Date.now() - startTime}ms`;
      
      res.status(503).json(health);
    }
  };
}

/**
 * Create readiness check endpoint
 * @param {object} options - Readiness check options
 * @returns {Function} Express route handler
 */
function createReadinessCheck(options = {}) {
  const { requiredServices = [], checkMongo = true } = options;
  
  return async (req, res) => {
    const ready = { ready: true, checks: {} };
    
    try {
      // Check MongoDB readiness
      if (checkMongo) {
        const mongoHealth = await checkMongoHealth();
        ready.checks.database = mongoHealth;
        if (mongoHealth.status !== 'healthy') {
          ready.ready = false;
        }
      }
      
      // Check required services
      if (requiredServices.length > 0) {
        ready.checks.services = {};
        for (const service of requiredServices) {
          const serviceHealth = await checkServiceHealth(service.url, service.name, 3000);
          ready.checks.services[service.name] = serviceHealth;
          if (serviceHealth.status !== 'healthy') {
            ready.ready = false;
          }
        }
      }
      
      const statusCode = ready.ready ? 200 : 503;
      res.status(statusCode).json(ready);
      
    } catch (error) {
      ready.ready = false;
      ready.error = error.message;
      res.status(503).json(ready);
    }
  };
}

/**
 * Create liveness check endpoint
 * @returns {Function} Express route handler
 */
function createLivenessCheck() {
  return (req, res) => {
    res.status(200).json({
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  };
}

module.exports = {
  createHealthCheck,
  createReadinessCheck,
  createLivenessCheck,
  checkMongoHealth,
  checkServiceHealth,
  checkSystemHealth,
  getBasicHealth
};