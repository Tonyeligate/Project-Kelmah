/**
 * Resilient Proxy Middleware for API Gateway
 * Handles downstream service failures gracefully with circuit breaker integration
 */

const { createProxyMiddleware } = require('http-proxy-middleware');

class ResilientProxy {
  constructor(healthMonitor) {
    this.healthMonitor = healthMonitor;
  }

  // Create a resilient proxy middleware for a service
  createProxy(serviceName, options = {}) {
    const {
      target,
      pathRewrite = {},
      changeOrigin = true,
      timeout = 30000,
      ...otherOptions
    } = options;

    // Validate target URL
    if (!target || typeof target !== 'string' || target.length === 0) {
      console.error(`❌ Invalid target URL for ${serviceName}: ${target}`);
      return this.createFallbackMiddleware(serviceName, 'Invalid service configuration');
    }

    try {
      const proxy = createProxyMiddleware({
        target,
        changeOrigin,
        pathRewrite,
        timeout,
        proxyTimeout: timeout,
        ...otherOptions,
        
        // Handle proxy errors gracefully
        onError: (err, req, res) => {
          console.error(`🚨 Proxy error for ${serviceName}:`, err.message);
          
          // Record failure in circuit breaker
          const circuitBreaker = this.healthMonitor.getCircuitBreaker(serviceName);
          if (circuitBreaker) {
            circuitBreaker.recordFailure();
          }
          
          // Send appropriate error response
          if (!res.headersSent) {
            const statusCode = this.getErrorStatusCode(err);
            res.status(statusCode).json({
              error: `${serviceName} is temporarily unavailable`,
              message: 'Service is experiencing connectivity issues. Please try again later.',
              details: process.env.NODE_ENV === 'development' ? err.message : undefined,
              timestamp: new Date().toISOString()
            });
          }
        },
        
        // Handle successful responses
        onProxyRes: (proxyRes, req, res) => {
          // Record success/failure based on status code
          const circuitBreaker = this.healthMonitor.getCircuitBreaker(serviceName);
          if (circuitBreaker) {
            if (proxyRes.statusCode < 500) {
              circuitBreaker.recordSuccess();
            } else {
              circuitBreaker.recordFailure();
            }
          }
          
          // Add service info to response headers
          res.setHeader('X-Service-Name', serviceName);
          res.setHeader('X-Service-Status', proxyRes.statusCode < 500 ? 'healthy' : 'degraded');
        },
        
        // Add request logging
        onProxyReq: (proxyReq, req, res) => {
          console.log(`🔄 Proxying ${req.method} ${req.url} to ${serviceName}`);
        }
      });

      // Wrap the proxy with circuit breaker check
      return this.wrapWithCircuitBreaker(serviceName, proxy);
      
    } catch (error) {
      console.error(`❌ Failed to create proxy for ${serviceName}:`, error.message);
      return this.createFallbackMiddleware(serviceName, `Proxy creation failed: ${error.message}`);
    }
  }

  // Wrap proxy middleware with circuit breaker logic
  wrapWithCircuitBreaker(serviceName, proxyMiddleware) {
    return (req, res, next) => {
      const circuitBreaker = this.healthMonitor.getCircuitBreaker(serviceName);
      
      if (!circuitBreaker) {
        console.warn(`⚠️ No circuit breaker found for ${serviceName}`);
        return proxyMiddleware(req, res, next);
      }
      
      // Check if circuit breaker allows the request
      if (!circuitBreaker.allowRequest()) {
        console.log(`🚫 Circuit breaker blocked request to ${serviceName}`);
        return res.status(503).json(circuitBreaker.getBlockedResponse());
      }
      
      // Add circuit breaker context to request
      req.circuitBreaker = circuitBreaker;
      req.serviceName = serviceName;
      
      // Proceed with proxy
      return proxyMiddleware(req, res, next);
    };
  }

  // Create fallback middleware when proxy creation fails
  createFallbackMiddleware(serviceName, errorMessage) {
    return (req, res, next) => {
      console.error(`🚫 Fallback middleware triggered for ${serviceName}: ${errorMessage}`);
      
      res.status(503).json({
        error: `${serviceName} is temporarily unavailable`,
        message: 'Service configuration issue. Please contact support if this persists.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        fallback: true,
        timestamp: new Date().toISOString()
      });
    };
  }

  // Determine appropriate status code based on error type
  getErrorStatusCode(error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return 503; // Service Unavailable
    }
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      return 504; // Gateway Timeout
    }
    if (error.code === 'ECONNRESET') {
      return 502; // Bad Gateway
    }
    return 502; // Default to Bad Gateway for proxy errors
  }

  // Create a health check endpoint for the gateway itself
  createHealthEndpoint() {
    return (req, res) => {
      const systemStatus = this.healthMonitor.getSystemStatus();
      const isHealthy = systemStatus.overall.healthPercentage >= 50; // At least 50% services healthy
      
      const response = {
        status: isHealthy ? 'healthy' : 'degraded',
        gateway: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          pid: process.pid
        },
        services: systemStatus,
        timestamp: new Date().toISOString()
      };
      
      res.status(isHealthy ? 200 : 503).json(response);
    };
  }

  // Create aggregate health endpoint
  createAggregateHealthEndpoint() {
    return async (req, res) => {
      try {
        const healthResults = await this.healthMonitor.checkAllServices();
        const systemStatus = this.healthMonitor.getSystemStatus();
        
        const response = {
          overall: systemStatus.overall,
          services: {},
          timestamp: new Date().toISOString()
        };
        
        // Combine real-time results with circuit breaker state
        Object.keys(healthResults).forEach(serviceName => {
          const healthResult = healthResults[serviceName];
          const circuitBreaker = this.healthMonitor.getCircuitBreaker(serviceName);
          const metrics = circuitBreaker ? circuitBreaker.getHealthMetrics() : {};
          
          response.services[serviceName] = {
            healthy: healthResult.healthy,
            status: healthResult.status,
            responseTime: healthResult.responseTime,
            circuitBreaker: {
              state: metrics.state,
              successRate: metrics.successRate,
              failureCount: metrics.failureCount
            },
            error: healthResult.error
          };
        });
        
        const healthyCount = Object.values(response.services).filter(s => s.healthy).length;
        const isOverallHealthy = healthyCount >= Object.keys(response.services).length * 0.5;
        
        res.status(isOverallHealthy ? 200 : 503).json(response);
        
      } catch (error) {
        console.error('🚨 Error in aggregate health check:', error);
        res.status(500).json({
          error: 'Health check system error',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };
  }
}

module.exports = ResilientProxy;
