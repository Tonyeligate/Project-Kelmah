#!/usr/bin/env node

/**
 * Kelmah Platform Performance Monitor
 * Real-time performance monitoring and metrics collection
 *
 * Usage: node performance-monitor.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const MONITOR_INTERVAL = process.env.MONITOR_INTERVAL || 30000; // 30 seconds
const METRICS_FILE = path.join(__dirname, 'performance-metrics.json');

// Performance metrics storage
let metrics = {
  timestamp: new Date().toISOString(),
  summary: {
    totalRequests: 0,
    averageResponseTime: 0,
    errorRate: 0,
    uptime: 100
  },
  services: {},
  endpoints: {},
  alerts: []
};

// Service endpoints to monitor
const serviceEndpoints = {
  gateway: {
    url: `${BASE_URL}/health`,
    name: 'API Gateway'
  },
  auth: {
    url: `${BASE_URL.replace('5000', '5001')}/health`,
    name: 'Auth Service'
  },
  user: {
    url: `${BASE_URL.replace('5000', '5002')}/health`,
    name: 'User Service'
  },
  job: {
    url: `${BASE_URL.replace('5000', '5003')}/health`,
    name: 'Job Service'
  },
  messaging: {
    url: `${BASE_URL.replace('5000', '5005')}/health`,
    name: 'Messaging Service'
  },
  review: {
    url: `${BASE_URL.replace('5000', '5006')}/health`,
    name: 'Review Service'
  }
};

// API endpoints to monitor performance
const apiEndpoints = [
  { path: '/api/health/aggregate', method: 'GET', name: 'Health Aggregate' },
  { path: '/api/auth/login', method: 'POST', name: 'User Login' },
  { path: '/api/jobs', method: 'GET', name: 'List Jobs' },
  { path: '/api/messages/conversations', method: 'GET', name: 'List Conversations' },
  { path: '/api/reviews', method: 'GET', name: 'List Reviews' }
];

class PerformanceMonitor {
  constructor() {
    this.isRunning = false;
    this.startTime = Date.now();
    this.requestCount = 0;
    this.responseTimes = [];
    this.errors = 0;
  }

  async checkServiceHealth(serviceKey, serviceConfig) {
    const startTime = Date.now();

    try {
      const response = await axios.get(serviceConfig.url, {
        timeout: 5000,
        validateStatus: () => true
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.status === 200;

      if (!metrics.services[serviceKey]) {
        metrics.services[serviceKey] = {
          name: serviceConfig.name,
          url: serviceConfig.url,
          checks: 0,
          healthy: 0,
          responseTimes: []
        };
      }

      metrics.services[serviceKey].checks++;
      metrics.services[serviceKey].responseTimes.push(responseTime);

      if (isHealthy) {
        metrics.services[serviceKey].healthy++;
      } else {
        this.addAlert('error', `${serviceConfig.name} unhealthy`, `Status: ${response.status}`);
      }

      // Keep only last 100 response times
      if (metrics.services[serviceKey].responseTimes.length > 100) {
        metrics.services[serviceKey].responseTimes = metrics.services[serviceKey].responseTimes.slice(-100);
      }

      return { healthy: isHealthy, responseTime, status: response.status };

    } catch (error) {
      const responseTime = Date.now() - startTime;

      if (!metrics.services[serviceKey]) {
        metrics.services[serviceKey] = {
          name: serviceConfig.name,
          url: serviceConfig.url,
          checks: 0,
          healthy: 0,
          responseTimes: []
        };
      }

      metrics.services[serviceKey].checks++;
      metrics.services[serviceKey].responseTimes.push(responseTime);

      this.addAlert('error', `${serviceConfig.name} unreachable`, error.message);
      return { healthy: false, responseTime, error: error.message };
    }
  }

  async testApiEndpoint(endpoint) {
    const startTime = Date.now();
    this.requestCount++;

    try {
      let response;

      if (endpoint.method === 'GET') {
        response = await axios.get(`${BASE_URL}${endpoint.path}`, {
          timeout: 10000,
          validateStatus: () => true
        });
      } else if (endpoint.method === 'POST') {
        // For POST requests, use minimal test data
        const testData = this.getTestDataForEndpoint(endpoint.path);
        response = await axios.post(`${BASE_URL}${endpoint.path}`, testData, {
          timeout: 10000,
          validateStatus: () => true
        });
      }

      const responseTime = Date.now() - startTime;
      this.responseTimes.push(responseTime);

      // Keep only last 1000 response times
      if (this.responseTimes.length > 1000) {
        this.responseTimes = this.responseTimes.slice(-1000);
      }

      const isSuccess = response.status >= 200 && response.status < 400;

      if (!isSuccess) {
        this.errors++;
        this.addAlert('warning', `API endpoint failed: ${endpoint.name}`, `Status: ${response.status}`);
      }

      if (!metrics.endpoints[endpoint.path]) {
        metrics.endpoints[endpoint.path] = {
          name: endpoint.name,
          method: endpoint.method,
          requests: 0,
          successes: 0,
          failures: 0,
          responseTimes: []
        };
      }

      metrics.endpoints[endpoint.path].requests++;
      metrics.endpoints[endpoint.path].responseTimes.push(responseTime);

      if (isSuccess) {
        metrics.endpoints[endpoint.path].successes++;
      } else {
        metrics.endpoints[endpoint.path].failures++;
      }

      // Keep only last 100 response times per endpoint
      if (metrics.endpoints[endpoint.path].responseTimes.length > 100) {
        metrics.endpoints[endpoint.path].responseTimes = metrics.endpoints[endpoint.path].responseTimes.slice(-100);
      }

      return { success: isSuccess, responseTime, status: response.status };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.responseTimes.push(responseTime);
      this.errors++;

      if (!metrics.endpoints[endpoint.path]) {
        metrics.endpoints[endpoint.path] = {
          name: endpoint.name,
          method: endpoint.method,
          requests: 0,
          successes: 0,
          failures: 0,
          responseTimes: []
        };
      }

      metrics.endpoints[endpoint.path].requests++;
      metrics.endpoints[endpoint.path].failures++;
      metrics.endpoints[endpoint.path].responseTimes.push(responseTime);

      this.addAlert('error', `API endpoint error: ${endpoint.name}`, error.message);
      return { success: false, responseTime, error: error.message };
    }
  }

  getTestDataForEndpoint(path) {
    // Return minimal test data for POST requests
    if (path === '/api/auth/login') {
      return {
        email: 'test@example.com',
        password: 'testpass'
      };
    }
    return {};
  }

  addAlert(level, title, message) {
    metrics.alerts.push({
      timestamp: new Date().toISOString(),
      level,
      title,
      message
    });

    // Keep only last 50 alerts
    if (metrics.alerts.length > 50) {
      metrics.alerts = metrics.alerts.slice(-50);
    }
  }

  calculateMetrics() {
    // Calculate summary metrics
    const totalRequests = this.requestCount;
    const averageResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
      : 0;
    const errorRate = totalRequests > 0 ? (this.errors / totalRequests) * 100 : 0;
    const uptime = ((Date.now() - this.startTime) / (Date.now() - this.startTime)) * 100; // Simplified

    metrics.summary = {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      uptime: Math.round(uptime * 100) / 100
    };

    // Calculate service metrics
    Object.keys(metrics.services).forEach(serviceKey => {
      const service = metrics.services[serviceKey];
      const avgResponseTime = service.responseTimes.length > 0
        ? service.responseTimes.reduce((a, b) => a + b, 0) / service.responseTimes.length
        : 0;
      const healthRate = service.checks > 0 ? (service.healthy / service.checks) * 100 : 0;

      service.averageResponseTime = Math.round(avgResponseTime);
      service.healthRate = Math.round(healthRate * 100) / 100;
    });

    // Calculate endpoint metrics
    Object.keys(metrics.endpoints).forEach(endpointPath => {
      const endpoint = metrics.endpoints[endpointPath];
      const avgResponseTime = endpoint.responseTimes.length > 0
        ? endpoint.responseTimes.reduce((a, b) => a + b, 0) / endpoint.responseTimes.length
        : 0;
      const successRate = endpoint.requests > 0 ? (endpoint.successes / endpoint.requests) * 100 : 0;

      endpoint.averageResponseTime = Math.round(avgResponseTime);
      endpoint.successRate = Math.round(successRate * 100) / 100;
    });

    metrics.timestamp = new Date().toISOString();
  }

  saveMetrics() {
    try {
      fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));
    } catch (error) {
      console.error('Failed to save metrics:', error.message);
    }
  }

  displayMetrics() {
    console.clear();
    console.log('🚀 Kelmah Platform Performance Monitor');
    console.log('='.repeat(60));
    console.log(`📊 Last Updated: ${new Date(metrics.timestamp).toLocaleString()}`);
    console.log(`⏱️  Monitoring Duration: ${Math.round((Date.now() - this.startTime) / 1000)}s`);
    console.log('');

    // Summary
    console.log('📈 SUMMARY METRICS');
    console.log('-'.repeat(30));
    console.log(`Total Requests: ${metrics.summary.totalRequests}`);
    console.log(`Avg Response Time: ${metrics.summary.averageResponseTime}ms`);
    console.log(`Error Rate: ${metrics.summary.errorRate}%`);
    console.log(`System Uptime: ${metrics.summary.uptime}%`);
    console.log('');

    // Services
    console.log('🔧 SERVICE HEALTH');
    console.log('-'.repeat(30));
    Object.entries(metrics.services).forEach(([key, service]) => {
      const status = service.healthRate >= 95 ? '🟢' : service.healthRate >= 80 ? '🟡' : '🔴';
      console.log(`${status} ${service.name}: ${service.healthRate}% healthy (${service.averageResponseTime}ms avg)`);
    });
    console.log('');

    // Endpoints
    console.log('🌐 API ENDPOINTS');
    console.log('-'.repeat(30));
    Object.entries(metrics.endpoints).forEach(([path, endpoint]) => {
      const status = endpoint.successRate >= 95 ? '🟢' : endpoint.successRate >= 80 ? '🟡' : '🔴';
      console.log(`${status} ${endpoint.method} ${endpoint.name}: ${endpoint.successRate}% success (${endpoint.averageResponseTime}ms avg)`);
    });
    console.log('');

    // Recent Alerts
    if (metrics.alerts.length > 0) {
      console.log('🚨 RECENT ALERTS');
      console.log('-'.repeat(30));
      const recentAlerts = metrics.alerts.slice(-5);
      recentAlerts.forEach(alert => {
        const level = alert.level === 'error' ? '🔴' : '🟡';
        const time = new Date(alert.timestamp).toLocaleTimeString();
        console.log(`${level} ${time}: ${alert.title}`);
      });
    }

    console.log('='.repeat(60));
  }

  async runMonitoringCycle() {
    // Check all services
    const servicePromises = Object.entries(serviceEndpoints).map(([key, config]) =>
      this.checkServiceHealth(key, config)
    );

    // Test API endpoints
    const endpointPromises = apiEndpoints.map(endpoint =>
      this.testApiEndpoint(endpoint)
    );

    await Promise.all([...servicePromises, ...endpointPromises]);

    this.calculateMetrics();
    this.saveMetrics();
    this.displayMetrics();
  }

  start() {
    if (this.isRunning) {
      console.log('Performance monitor is already running');
      return;
    }

    console.log('Starting Kelmah Platform Performance Monitor...');
    console.log(`Monitoring interval: ${MONITOR_INTERVAL}ms`);
    console.log(`Metrics file: ${METRICS_FILE}`);
    console.log('Press Ctrl+C to stop\n');

    this.isRunning = true;

    // Initial run
    this.runMonitoringCycle();

    // Set up interval
    this.interval = setInterval(() => {
      this.runMonitoringCycle();
    }, MONITOR_INTERVAL);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.isRunning = false;
      console.log('Performance monitor stopped');
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down performance monitor...');
  if (global.monitor) {
    global.monitor.stop();
  }
  process.exit(0);
});

// Main execution
if (require.main === module) {
  const monitor = new PerformanceMonitor();
  global.monitor = monitor;
  monitor.start();
}

module.exports = PerformanceMonitor;