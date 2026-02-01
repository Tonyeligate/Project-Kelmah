# Kelmah Platform Performance Monitor

Real-time performance monitoring and metrics collection for the Kelmah freelance marketplace.

## Overview

The Performance Monitor provides comprehensive monitoring of:

- ✅ **Service Health**: All microservices availability and response times
- 📊 **API Performance**: Endpoint response times and success rates
- 🚨 **Alert System**: Real-time alerts for performance issues
- 💾 **Metrics Storage**: Persistent metrics collection in JSON format
- 📈 **Real-time Dashboard**: Live console display of system metrics

## Features

### Service Monitoring
- **API Gateway**: Central routing performance
- **Auth Service**: Authentication response times
- **User Service**: Profile and data access performance
- **Job Service**: Job posting and search performance
- **Messaging Service**: Real-time communication performance
- **Review Service**: Rating and feedback system performance

### API Endpoint Monitoring
- Health check endpoints
- Authentication endpoints (login/register)
- Job management endpoints
- Messaging endpoints
- Review system endpoints

### Alert System
- **Error Alerts**: Service failures and API errors
- **Warning Alerts**: Performance degradation
- **Health Alerts**: Service recovery notifications

## Usage

### Start Monitoring
```bash
npm run monitor
```

### Direct Execution
```bash
node performance-monitor.js
```

### Custom Configuration
```bash
# Custom API base URL
API_BASE_URL=https://your-tunnel-url.loca.lt/api node performance-monitor.js

# Custom monitoring interval (milliseconds)
MONITOR_INTERVAL=60000 node performance-monitor.js
```

## Output Example

```
🚀 Kelmah Platform Performance Monitor
============================================================
📊 Last Updated: 12/26/2024, 3:45:30 PM
⏱️  Monitoring Duration: 300s

📈 SUMMARY METRICS
------------------------------
Total Requests: 150
Avg Response Time: 245ms
Error Rate: 2.5%
System Uptime: 100%

🔧 SERVICE HEALTH
------------------------------
🟢 API Gateway: 98% healthy (120ms avg)
🟢 Auth Service: 95% healthy (180ms avg)
🟢 User Service: 97% healthy (150ms avg)
🟡 Job Service: 85% healthy (320ms avg)
🟢 Messaging Service: 96% healthy (200ms avg)
🟢 Review Service: 94% healthy (160ms avg)

🌐 API ENDPOINTS
------------------------------
🟢 GET Health Aggregate: 98% success (145ms avg)
🟢 POST User Login: 95% success (280ms avg)
🟢 GET List Jobs: 97% success (220ms avg)
🟢 GET List Conversations: 94% success (190ms avg)
🟢 GET List Reviews: 96% success (170ms avg)

🚨 RECENT ALERTS
------------------------------
🟡 3:44:15 PM: Job Service response time increased
🔴 3:43:50 PM: Messaging Service temporarily unreachable
============================================================
```

## Metrics Storage

Performance data is automatically saved to `performance-metrics.json`:

```json
{
  "timestamp": "2024-12-26T15:45:30.000Z",
  "summary": {
    "totalRequests": 150,
    "averageResponseTime": 245,
    "errorRate": 2.5,
    "uptime": 100
  },
  "services": {
    "gateway": {
      "name": "API Gateway",
      "url": "http://localhost:5000/health",
      "checks": 10,
      "healthy": 10,
      "responseTimes": [120, 115, 130, 125, 118, 122, 119, 121, 117, 123],
      "averageResponseTime": 120,
      "healthRate": 100
    }
  },
  "endpoints": {
    "/api/health/aggregate": {
      "name": "Health Aggregate",
      "method": "GET",
      "requests": 10,
      "successes": 10,
      "failures": 0,
      "responseTimes": [145, 142, 148, 139, 151, 143, 147, 141, 149, 144],
      "averageResponseTime": 145,
      "successRate": 100
    }
  },
  "alerts": [
    {
      "timestamp": "2024-12-26T15:44:15.000Z",
      "level": "warning",
      "title": "Job Service response time increased",
      "message": "Average response time exceeded 300ms threshold"
    }
  ]
}
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_BASE_URL` | `http://localhost:5000` | Base URL for API Gateway |
| `MONITOR_INTERVAL` | `30000` | Monitoring cycle interval (ms) |

### Thresholds

The monitor uses these performance thresholds:

- **Response Time**: Warning at 300ms, Critical at 1000ms
- **Health Rate**: Warning below 95%, Critical below 80%
- **Success Rate**: Warning below 95%, Critical below 90%
- **Error Rate**: Warning above 5%, Critical above 10%

## Integration

### CI/CD Integration

Add performance monitoring to your deployment pipeline:

```yaml
- name: Performance Monitoring
  run: |
    timeout 300 npm run monitor &
    sleep 60
    # Run your tests
    npm run test:integration
    # Check performance metrics
    node scripts/check-performance.js
```

### Dashboard Integration

The metrics JSON can be consumed by monitoring dashboards:

```javascript
const metrics = require('./performance-metrics.json');

// Send to monitoring service
monitoringService.sendMetrics(metrics);
```

### Alert Integration

Configure alerts to trigger notifications:

```javascript
const metrics = require('./performance-metrics.json');

// Check for critical alerts
const criticalAlerts = metrics.alerts.filter(alert => alert.level === 'error');
if (criticalAlerts.length > 0) {
  notificationService.sendAlert('Performance Issues Detected', criticalAlerts);
}
```

## Troubleshooting

### Common Issues

**Services Not Detected**
```
🟡 Service response time increased
```
**Solution**: Check if all microservices are running and accessible.

**High Error Rates**
```
🔴 Error Rate: 15.2%
```
**Solution**: Review recent alerts and service logs for root causes.

**Slow Response Times**
```
🟡 Avg Response Time: 450ms
```
**Solution**: Check database performance and service resource usage.

### Debug Mode

Enable detailed logging:
```bash
DEBUG=* node performance-monitor.js
```

### Manual Metrics Check

View current metrics:
```bash
cat performance-metrics.json | jq '.summary'
```

## Performance Benchmarks

### Expected Performance Ranges

| Component | Expected Response Time | Target Success Rate |
|-----------|----------------------|-------------------|
| API Gateway | < 150ms | > 99% |
| Auth Service | < 200ms | > 95% |
| User Service | < 180ms | > 95% |
| Job Service | < 250ms | > 95% |
| Messaging Service | < 200ms | > 95% |
| Review Service | < 170ms | > 95% |

### Optimization Targets

- **P95 Response Time**: < 500ms for all endpoints
- **Error Rate**: < 1% under normal load
- **Service Availability**: > 99.5% uptime
- **API Success Rate**: > 99% for core endpoints

## Contributing

When adding new monitoring features:

1. Update service endpoints configuration
2. Add new API endpoints to monitor
3. Implement appropriate alert thresholds
4. Update documentation and examples
5. Test with various failure scenarios

## Support

For performance monitoring issues:
- Check `performance-metrics.json` for detailed metrics
- Review service logs for error details
- Monitor system resources (CPU, memory, network)
- Contact the platform team for optimization assistance