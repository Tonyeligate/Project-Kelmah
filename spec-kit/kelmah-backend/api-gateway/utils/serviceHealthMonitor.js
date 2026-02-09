/**
 * Service Health Monitor for API Gateway
 * Continuously monitors downstream services and updates circuit breakers
 */

const axios = require('axios');
const CircuitBreaker = require('./circuitBreaker');

class ServiceHealthMonitor {
  constructor() {
    this.circuitBreakers = new Map();
    this.healthCheckInterval = 30000; // 30 seconds
    this.healthCheckTimeout = 10000; // 10 seconds
    this.isMonitoring = false;
    
    // Service health endpoints
    this.services = new Map();
    
    console.log('🏥 Service Health Monitor initialized');
  }

  // Register a service for monitoring
  registerService(serviceName, baseUrl, healthEndpoint = '/api/health') {
    if (!baseUrl || typeof baseUrl !== 'string') {
      console.warn(`⚠️ Invalid URL for service ${serviceName}: ${baseUrl}`);
      return null;
    }

    this.services.set(serviceName, {
      baseUrl,
      healthEndpoint,
      lastCheck: null,
      lastStatus: 'unknown'
    });

    // Initialize circuit breaker
    const circuitBreaker = new CircuitBreaker(serviceName, {
      failureThreshold: 3,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 300000 // 5 minutes
    });
    
    this.circuitBreakers.set(serviceName, circuitBreaker);
    
    console.log(`📋 Registered service: ${serviceName} at ${baseUrl}`);
    return circuitBreaker;
  }

  // Get circuit breaker for a service
  getCircuitBreaker(serviceName) {
    return this.circuitBreakers.get(serviceName);
  }

  // Check health of a specific service
  async checkServiceHealth(serviceName) {
    const service = this.services.get(serviceName);
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    
    if (!service || !circuitBreaker) {
      return { healthy: false, error: 'Service not registered' };
    }

    try {
      const startTime = Date.now();
      const response = await axios.get(
        `${service.baseUrl}${service.healthEndpoint}`,
        {
          timeout: this.healthCheckTimeout,
          validateStatus: (status) => status < 500, // Accept 2xx, 3xx, 4xx
          headers: {
            'User-Agent': 'kelmah-api-gateway-health-monitor',
            'X-Health-Check': 'true'
          }
        }
      );
      
      const responseTime = Date.now() - startTime;
      const isHealthy = response.status >= 200 && response.status < 400;
      
      service.lastCheck = Date.now();
      service.lastStatus = isHealthy ? 'healthy' : 'unhealthy';
      
      if (isHealthy) {
        circuitBreaker.recordSuccess();
      } else {
        circuitBreaker.recordFailure();
      }
      
      return {
        healthy: isHealthy,
        status: response.status,
        responseTime,
        data: response.data
      };
      
    } catch (error) {
      service.lastCheck = Date.now();
      service.lastStatus = 'error';
      circuitBreaker.recordFailure();
      
      return {
        healthy: false,
        error: error.message,
        code: error.code
      };
    }
  }

  // Check health of all registered services
  async checkAllServices() {
    const results = {};
    const healthPromises = [];
    
    for (const serviceName of this.services.keys()) {
      healthPromises.push(
        this.checkServiceHealth(serviceName).then(result => ({
          serviceName,
          ...result
        }))
      );
    }
    
    try {
      const healthResults = await Promise.allSettled(healthPromises);
      
      healthResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const { serviceName, ...healthData } = result.value;
          results[serviceName] = healthData;
        } else {
          const serviceName = Array.from(this.services.keys())[index];
          results[serviceName] = {
            healthy: false,
            error: result.reason?.message || 'Health check failed'
          };
        }
      });
      
    } catch (error) {
      console.error('🚨 Error during health checks:', error);
    }
    
    return results;
  }

  // Start continuous monitoring
  startMonitoring() {
    if (this.isMonitoring) {
      console.log('🏥 Health monitoring already running');
      return;
    }
    
    this.isMonitoring = true;
    console.log(`🏥 Starting health monitoring every ${this.healthCheckInterval / 1000}s`);
    
    // Initial health check
    this.checkAllServices().then(results => {
      console.log('🏥 Initial health check completed:', 
        Object.keys(results).map(name => `${name}: ${results[name].healthy ? '✅' : '❌'}`).join(', ')
      );
    });
    
    // Periodic health checks
    this.monitoringTimer = setInterval(async () => {
      try {
        const results = await this.checkAllServices();
        const healthyCount = Object.values(results).filter(r => r.healthy).length;
        const totalCount = Object.keys(results).length;
        
        if (healthyCount < totalCount) {
          console.log(`🏥 Health check: ${healthyCount}/${totalCount} services healthy`);
        }
        
      } catch (error) {
        console.error('🚨 Error in health monitoring:', error);
      }
    }, this.healthCheckInterval);
  }

  // Stop continuous monitoring
  stopMonitoring() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    this.isMonitoring = false;
    console.log('🏥 Health monitoring stopped');
  }

  // Get overall system status
  getSystemStatus() {
    const serviceStatuses = {};
    let healthyServices = 0;
    let totalServices = 0;
    
    for (const [serviceName, service] of this.services) {
      const circuitBreaker = this.circuitBreakers.get(serviceName);
      const metrics = circuitBreaker ? circuitBreaker.getHealthMetrics() : {};
      
      serviceStatuses[serviceName] = {
        lastCheck: service.lastCheck,
        lastStatus: service.lastStatus,
        circuitBreakerState: metrics.state || 'unknown',
        successRate: metrics.successRate || 0,
        baseUrl: service.baseUrl
      };
      
      if (service.lastStatus === 'healthy') {
        healthyServices++;
      }
      totalServices++;
    }
    
    return {
      overall: {
        healthy: healthyServices,
        total: totalServices,
        healthPercentage: totalServices > 0 ? Math.round((healthyServices / totalServices) * 100) : 0
      },
      services: serviceStatuses,
      timestamp: new Date().toISOString()
    };
  }

  // Get service-specific middleware that checks circuit breaker
  getServiceMiddleware(serviceName) {
    return (req, res, next) => {
      const circuitBreaker = this.getCircuitBreaker(serviceName);
      
      if (!circuitBreaker) {
        return res.status(503).json({
          error: `${serviceName} not registered in health monitor`,
          timestamp: new Date().toISOString()
        });
      }
      
      if (!circuitBreaker.allowRequest()) {
        return res.status(503).json(circuitBreaker.getBlockedResponse());
      }
      
      // Add circuit breaker to request context
      req.circuitBreaker = circuitBreaker;
      next();
    };
  }
}

module.exports = ServiceHealthMonitor;
