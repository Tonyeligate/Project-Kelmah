/**
 * Circuit Breaker Pattern Implementation for API Gateway
 * Prevents cascade failures and provides graceful degradation
 */

class CircuitBreaker {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 120000; // 2 minutes
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    
    // Success/failure tracking for the monitoring period
    this.recentRequests = [];
    
    console.log(`🔌 Circuit breaker initialized for ${serviceName}`);
  }

  // Check if circuit should be OPEN (failing)
  shouldOpenCircuit() {
    return this.failureCount >= this.failureThreshold;
  }

  // Check if enough time has passed to try HALF_OPEN
  canAttemptReset() {
    return Date.now() > this.nextAttemptTime;
  }

  // Record a successful request
  recordSuccess() {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.addRequest(true);
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      console.log(`✅ Circuit breaker CLOSED for ${this.serviceName} - service recovered`);
    }
  }

  // Record a failed request
  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.addRequest(false);
    
    if (this.state === 'CLOSED' && this.shouldOpenCircuit()) {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.resetTimeout;
      console.log(`🚨 Circuit breaker OPEN for ${this.serviceName} - service marked as down`);
    } else if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.resetTimeout;
      console.log(`🚨 Circuit breaker back to OPEN for ${this.serviceName} - retry failed`);
    }
  }

  // Add request to recent tracking
  addRequest(wasSuccessful) {
    const now = Date.now();
    this.recentRequests.push({ time: now, success: wasSuccessful });
    
    // Clean old requests outside monitoring period
    this.recentRequests = this.recentRequests.filter(
      req => now - req.time < this.monitoringPeriod
    );
  }

  // Get service health metrics
  getHealthMetrics() {
    const now = Date.now();
    const recentRequests = this.recentRequests.filter(
      req => now - req.time < this.monitoringPeriod
    );
    
    const totalRequests = recentRequests.length;
    const successfulRequests = recentRequests.filter(req => req.success).length;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;
    
    return {
      state: this.state,
      failureCount: this.failureCount,
      successRate: Math.round(successRate),
      totalRequests,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime
    };
  }

  // Check if request should be allowed
  allowRequest() {
    switch (this.state) {
      case 'CLOSED':
        return true;
        
      case 'OPEN':
        if (this.canAttemptReset()) {
          this.state = 'HALF_OPEN';
          console.log(`🔄 Circuit breaker HALF_OPEN for ${this.serviceName} - attempting recovery`);
          return true;
        }
        return false;
        
      case 'HALF_OPEN':
        return true;
        
      default:
        return false;
    }
  }

  // Get appropriate error response for blocked requests
  getBlockedResponse() {
    const metrics = this.getHealthMetrics();
    return {
      error: `${this.serviceName} is temporarily unavailable`,
      message: 'Service is experiencing issues. Please try again later.',
      circuitBreaker: {
        state: this.state,
        nextRetryIn: this.nextAttemptTime ? Math.max(0, this.nextAttemptTime - Date.now()) : 0,
        failureCount: this.failureCount
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = CircuitBreaker;
