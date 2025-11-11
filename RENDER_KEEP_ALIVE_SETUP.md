# Render Keep-Alive System Setup Guide

## 🎯 Purpose
Prevent Render microservices from spinning down after 15 minutes of inactivity by implementing a comprehensive keep-alive system.

## 📋 System Components

### 1. **Internal Keep-Alive Manager** (`shared/utils/keepAlive.js`)
Each microservice runs its own keep-alive manager that:
- Pings all other services every 12 minutes
- Maintains service health status
- Provides status endpoints for monitoring
- Auto-starts on service initialization

### 2. **GitHub Actions External Pinger** (`.github/workflows/keep-services-alive.yml`)
External health checks that run every 10 minutes:
- Pings all microservices from GitHub's infrastructure
- Runs independently of your services
- Provides redundant keep-alive mechanism
- Free and reliable through GitHub Actions

### 3. **Service Health Endpoints**
Each service now exposes:
- `GET /health/keepalive` - Keep-alive status
- `POST /health/keepalive/trigger` - Manual ping trigger

## 🚀 Setup Instructions

### Step 1: Configure GitHub Secrets
Add these secrets to your GitHub repository (Settings → Secrets → Actions):

```
API_GATEWAY_URL=https://your-api-gateway.onrender.com
AUTH_SERVICE_URL=https://your-auth-service.onrender.com
USER_SERVICE_URL=https://your-user-service.onrender.com
JOB_SERVICE_URL=https://your-job-service.onrender.com
PAYMENT_SERVICE_URL=https://your-payment-service.onrender.com
MESSAGING_SERVICE_URL=https://your-messaging-service.onrender.com
REVIEW_SERVICE_URL=https://your-review-service.onrender.com
```

### Step 2: Configure Environment Variables on Render
For each microservice on Render, add these environment variables:

#### Common Variables (All Services)
```bash
KEEP_ALIVE_ENABLED=true
KEEP_ALIVE_INTERVAL=720000  # 12 minutes in milliseconds
KEEP_ALIVE_AUTOSTART=true
```

#### Service-Specific URLs
Each service needs to know the URLs of other services. Add these to **each service**:

```bash
API_GATEWAY_URL=https://your-api-gateway.onrender.com
AUTH_SERVICE_URL=https://your-auth-service.onrender.com
USER_SERVICE_URL=https://your-user-service.onrender.com
JOB_SERVICE_URL=https://your-job-service.onrender.com
PAYMENT_SERVICE_URL=https://your-payment-service.onrender.com
MESSAGING_SERVICE_URL=https://your-messaging-service.onrender.com
REVIEW_SERVICE_URL=https://your-review-service.onrender.com
```

### Step 3: Deploy the Updated Services
After pushing the code:

1. **Commit and push changes**:
   ```bash
   git add .
   git commit -m "Add keep-alive system to prevent Render spin-down"
   git push origin main
   ```

2. **Verify auto-deployment** on Render:
   - Each service should automatically redeploy
   - Check deployment logs for "Keep-alive manager initialized" messages

### Step 4: Enable GitHub Actions Workflow
1. Go to your repository on GitHub
2. Navigate to **Actions** tab
3. Enable workflows if not already enabled
4. The `Keep Microservices Alive` workflow should appear
5. It will run automatically every 10 minutes

### Step 5: Verify Operation

#### Check Internal Keep-Alive Status
```bash
# Check any service's keep-alive status
curl https://your-service.onrender.com/health/keepalive

# Expected response:
{
  "success": true,
  "data": {
    "enabled": true,
    "serviceName": "job-service",
    "interval": 720000,
    "running": true,
    "services": ["api-gateway", "auth-service", "user-service", ...],
    "lastPingTimes": { ... }
  }
}
```

#### Manually Trigger Keep-Alive Ping
```bash
# Trigger immediate ping cycle
curl -X POST https://your-service.onrender.com/health/keepalive/trigger

# Expected response:
{
  "success": true,
  "message": "Keep-alive ping triggered",
  "data": [
    { "service": "api-gateway", "success": true, "status": 200, "duration": 145 },
    { "service": "auth-service", "success": true, "status": 200, "duration": 89 },
    ...
  ]
}
```

#### Check GitHub Actions Logs
1. Go to **Actions** tab in your repository
2. Click on **Keep Microservices Alive** workflow
3. View recent runs to see ping results
4. Each run should show successful pings to all services

## 🔧 Configuration Options

### Adjust Ping Interval
Default is 12 minutes. To change:

```bash
# In Render environment variables
KEEP_ALIVE_INTERVAL=600000  # 10 minutes
KEEP_ALIVE_INTERVAL=900000  # 15 minutes (not recommended - too close to spin-down)
```

### Disable Keep-Alive for Development
```bash
# In local .env or Render env vars
KEEP_ALIVE_ENABLED=false
```

### Disable Auto-Start
```bash
# If you want to manually control when keep-alive starts
KEEP_ALIVE_AUTOSTART=false
```

## 📊 Monitoring

### Health Check with Keep-Alive Status
```bash
# Regular health check now includes keep-alive info
curl https://your-service.onrender.com/health

# Response includes:
{
  "service": "Job Service",
  "status": "OK",
  "timestamp": "2025-11-11T...",
  "keepAlive": {
    "enabled": true,
    "serviceName": "job-service",
    "interval": 720000,
    "running": true,
    "services": [...],
    "lastPingTimes": {...}
  }
}
```

### View GitHub Actions Dashboard
- Navigate to repository **Actions** tab
- See execution history of keep-alive workflow
- Green checkmarks = all services pinged successfully
- Red X = one or more services failed to respond

## 🐛 Troubleshooting

### Issue: Services Still Spinning Down
**Possible Causes:**
1. GitHub Actions workflow not enabled
2. Environment variables not set correctly on Render
3. Service URLs pointing to wrong endpoints
4. Keep-alive disabled via environment variable

**Solutions:**
- Verify all GitHub secrets are set correctly
- Check Render environment variables for each service
- Test manual ping: `curl -X POST https://service.onrender.com/health/keepalive/trigger`
- Check GitHub Actions logs for errors

### Issue: Keep-Alive Not Starting
**Check logs for:**
```
✅ Keep-alive manager initialized for [service-name]
🔄 Keep-alive started for [service-name]
```

**If missing:**
- Verify `KEEP_ALIVE_ENABLED=true` is set
- Verify `KEEP_ALIVE_AUTOSTART=true` is set
- Check for errors in service startup logs

### Issue: Ping Failures Between Services
**Common causes:**
- Incorrect service URLs in environment variables
- Network connectivity issues
- Service not fully started when ping occurs

**Solutions:**
- Verify all service URLs are correct and accessible
- Check service health independently: `curl https://service.onrender.com/health`
- Wait 30 seconds after deployment before expecting pings

## 💡 Best Practices

1. **Use Both Systems**: Internal keep-alive + GitHub Actions for redundancy
2. **Monitor Regularly**: Check GitHub Actions dashboard weekly
3. **Test After Deployment**: Manually trigger pings after updates
4. **Set Appropriate Intervals**: 10-12 minutes is optimal
5. **Update URLs**: When services change URLs, update all environment variables

## 🔄 How It Works

### Internal Keep-Alive Flow
```
Service Starts
    ↓
Keep-Alive Manager Initializes (30s delay)
    ↓
Pings All Other Services
    ↓
Waits 12 Minutes
    ↓
Repeats Forever
```

### External GitHub Actions Flow
```
Cron Schedule Triggers (Every 10 min)
    ↓
GitHub Actions Runner Starts
    ↓
Pings All Services via curl
    ↓
Reports Success/Failure
    ↓
Completes (Waits for Next Schedule)
```

### Combined Protection
With both systems running:
- **Every 10 minutes**: GitHub Actions pings all services
- **Every 12 minutes**: Each service pings all others
- **Result**: Services receive pings every 2-3 minutes on average
- **Render spin-down**: Requires 15 minutes of inactivity
- **Protection**: ✅ Services NEVER spin down

## 📈 Expected Behavior

### After Successful Setup
- ✅ No more cold starts from spin-down
- ✅ Consistent response times
- ✅ Services always available
- ✅ Automatic recovery if one ping system fails
- ✅ Visible monitoring via GitHub Actions

### Service Logs Should Show
```
[Keep-Alive] Keep-alive started for job-service, interval: 720s, servicesCount: 6
[Keep-Alive] ✅ Pinged api-gateway, status: 200, duration: 145ms
[Keep-Alive] ✅ Pinged auth-service, status: 200, duration: 89ms
[Keep-Alive] Keep-alive ping cycle complete, success: 6/6, duration: 892ms
```

## 🎉 Success Indicators

You'll know the system is working when:
1. GitHub Actions workflow shows green checkmarks every 10 minutes
2. Service logs show keep-alive ping cycles every 12 minutes
3. `/health/keepalive` endpoints return `running: true`
4. No more "service unavailable" errors from cold starts
5. Consistent sub-second response times to all endpoints

## 🔒 Security Notes

- Keep-alive pings use public health endpoints (no auth required)
- No sensitive data transmitted in pings
- Service URLs should be HTTPS in production
- GitHub Actions uses secure secrets storage
- Internal pings use service-to-service communication

## 📚 Additional Resources

- [Render Spin Down Documentation](https://render.com/docs/free#free-web-services)
- [GitHub Actions Scheduled Workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [HTTP Health Checks Best Practices](https://microservices.io/patterns/observability/health-check-api.html)

---

**Status**: ✅ Implemented across all microservices
**Last Updated**: November 11, 2025
**Maintained By**: Kelmah Platform Team
