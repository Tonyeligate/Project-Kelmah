/**
 * Keep-Alive Service for Render Free Tier
 * 
 * This script pings all backend microservices every 10 minutes
 * to prevent Render free tier instances from spinning down.
 * 
 * USAGE:
 *   - Run locally: node scripts/keep-alive.js
 *   - Or deploy as a cron job on a free service like cron-job.org
 *   - Or use UptimeRobot free tier (50 monitors)
 * 
 * Services are pinged via their /health endpoint.
 */

const https = require('https');
const http = require('http');

// Service configuration - Update URLs when they change
const SERVICES = {
  'api-gateway': {
    // Uses LocalTunnel or direct Render URL
    urls: [
      process.env.API_GATEWAY_URL || 'https://kelmah-api-gateway.onrender.com',
    ],
    healthPath: '/health'
  },
  'auth-service': {
    urls: [
      process.env.AUTH_SERVICE_URL || 'https://kelmah-auth-service.onrender.com',
    ],
    healthPath: '/health'
  },
  'user-service': {
    urls: [
      process.env.USER_SERVICE_URL || 'https://kelmah-user-service.onrender.com',
    ],
    healthPath: '/health'
  },
  'job-service': {
    urls: [
      process.env.JOB_SERVICE_URL || 'https://kelmah-job-service.onrender.com',
    ],
    healthPath: '/health'
  },
  'messaging-service': {
    urls: [
      process.env.MESSAGING_SERVICE_URL || 'https://kelmah-messaging-service.onrender.com',
    ],
    healthPath: '/health'
  },
  'payment-service': {
    urls: [
      process.env.PAYMENT_SERVICE_URL || 'https://kelmah-payment-service.onrender.com',
    ],
    healthPath: '/health'
  },
  'review-service': {
    urls: [
      process.env.REVIEW_SERVICE_URL || 'https://kelmah-review-service.onrender.com',
    ],
    healthPath: '/health'
  }
};

// Ping interval in milliseconds (10 minutes = 600000ms)
// Render free tier spins down after 15 minutes of inactivity
const PING_INTERVAL = 10 * 60 * 1000;

// Timeout for each request (30 seconds for cold starts)
const REQUEST_TIMEOUT = 30000;

/**
 * Ping a single URL and return result
 */
async function pingUrl(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, { timeout: REQUEST_TIMEOUT }, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 300,
          statusCode: res.statusCode,
          responseTime,
          url,
          data: data.substring(0, 200) // Truncate response
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        success: false,
        error: err.message,
        url,
        responseTime: Date.now() - startTime
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout',
        url,
        responseTime: REQUEST_TIMEOUT
      });
    });
  });
}

/**
 * Ping all services and log results
 */
async function pingAllServices() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔄 Keep-Alive Ping - ${new Date().toISOString()}`);
  console.log('='.repeat(60));
  
  const results = {
    healthy: 0,
    unhealthy: 0,
    details: []
  };
  
  for (const [serviceName, config] of Object.entries(SERVICES)) {
    for (const baseUrl of config.urls) {
      const url = `${baseUrl}${config.healthPath}`;
      
      try {
        const result = await pingUrl(url);
        
        if (result.success) {
          results.healthy++;
          console.log(`✅ ${serviceName}: ${result.statusCode} (${result.responseTime}ms)`);
        } else {
          results.unhealthy++;
          console.log(`❌ ${serviceName}: ${result.error || result.statusCode} (${result.responseTime}ms)`);
        }
        
        results.details.push({
          service: serviceName,
          ...result
        });
      } catch (err) {
        results.unhealthy++;
        console.log(`❌ ${serviceName}: Exception - ${err.message}`);
        results.details.push({
          service: serviceName,
          success: false,
          error: err.message,
          url
        });
      }
    }
  }
  
  console.log('─'.repeat(60));
  console.log(`📊 Summary: ${results.healthy} healthy, ${results.unhealthy} unhealthy`);
  console.log(`⏰ Next ping in ${PING_INTERVAL / 60000} minutes`);
  
  return results;
}

/**
 * Start the keep-alive service
 */
function startKeepAlive() {
  console.log('🚀 Kelmah Keep-Alive Service Started');
  console.log(`📍 Monitoring ${Object.keys(SERVICES).length} services`);
  console.log(`⏱️  Ping interval: ${PING_INTERVAL / 60000} minutes`);
  
  // Initial ping
  pingAllServices();
  
  // Schedule regular pings
  setInterval(pingAllServices, PING_INTERVAL);
}

// Also export for use as module
module.exports = { pingAllServices, pingUrl, SERVICES };

// Run if executed directly
if (require.main === module) {
  startKeepAlive();
}
