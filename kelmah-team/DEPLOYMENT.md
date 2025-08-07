# Kelmah Team Recruitment - Deployment Guide

This guide walks you through deploying the Kelmah Team recruitment portal to production.

## 📋 Pre-Deployment Checklist

### Environment Setup
- [ ] Node.js 16+ installed
- [ ] MongoDB database configured
- [ ] Email service configured (Gmail, SendGrid, etc.)
- [ ] Payment processors configured (Stripe, PayPal)
- [ ] Domain name and SSL certificate ready

### Configuration Files
- [ ] Environment variables configured
- [ ] API endpoints updated for production
- [ ] Database connections tested
- [ ] Email templates reviewed

## 🌐 Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Build and Deploy**
```bash
cd kelmah-team
npm run build
vercel --prod
```

3. **Configure Environment Variables**
```bash
vercel env add VITE_API_BASE_URL production
vercel env add VITE_STRIPE_PUBLISHABLE_KEY production
vercel env add VITE_PAYPAL_CLIENT_ID production
```

### Option 2: Netlify

1. **Build Project**
```bash
npm run build
```

2. **Deploy to Netlify**
```bash
netlify deploy --prod --dir=dist
```

3. **Configure Redirects** (create `_redirects` file in `public/`)
```
/*    /index.html   200
```

### Option 3: Traditional Hosting

1. **Build for Production**
```bash
npm run build
```

2. **Upload `dist/` folder** to your web server

3. **Configure Web Server**
   - Nginx configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/kelmah-team/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

## 🔧 Backend Integration

### Connect to Existing Kelmah Backend

1. **Copy Backend Files**
```bash
# Copy to your main Kelmah backend
cp -r kelmah-team/backend/* ../kelmah-backend/services/team-service/
```

2. **Install Dependencies**
```bash
cd ../kelmah-backend/services/team-service/
npm install express mongoose nodemailer express-validator express-rate-limit
```

3. **Update Main Server**
Add to your main `app.js` or `server.js`:
```javascript
const teamRegistrationRoutes = require('./services/team-service/routes/teamRegistration');
app.use('/api/team', teamRegistrationRoutes);
```

### Standalone Backend Deployment

1. **Create Express Server** (`kelmah-team/backend/server.js`):
```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const teamRoutes = require('./routes/teamRegistration');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kelmah-team');

// Routes
app.use('/api/team', teamRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Kelmah Team API running on port ${PORT}`);
});
```

2. **Deploy Backend**
- **Heroku**: `git push heroku main`
- **DigitalOcean**: Use their App Platform
- **Railway**: Connect your GitHub repository

## 🔐 Environment Variables

### Frontend (.env.production)
```env
VITE_API_BASE_URL=https://api.kelmah.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
VITE_ENVIRONMENT=production
VITE_SITE_URL=https://team.kelmah.com
```

### Backend (.env)
```env
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/kelmah-team
JWT_SECRET=your-jwt-secret-key
STRIPE_SECRET_KEY=sk_live_...
PAYPAL_CLIENT_SECRET=your_paypal_secret
EMAIL_USER=team@kelmah.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=https://team.kelmah.com
WEBHOOK_SECRET=your-webhook-secret
```

## 🗄️ Database Setup

### MongoDB Collections

1. **TeamRegistration Collection**
```javascript
// Indexes for production
db.teamregistrations.createIndex({ "email": 1 }, { unique: true });
db.teamregistrations.createIndex({ "registrationDate": -1 });
db.teamregistrations.createIndex({ "status": 1 });
db.teamregistrations.createIndex({ "isSelected": 1, "selectionRank": 1 });
```

### Database Migration
```bash
# Run migration script
node backend/scripts/createIndexes.js
```

## 📧 Email Configuration

### Gmail Setup
1. Enable 2-factor authentication
2. Generate app password
3. Use app password in EMAIL_PASSWORD

### SendGrid Setup
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
```

## 💳 Payment Integration

### Stripe Setup
1. Get live API keys from Stripe Dashboard
2. Configure webhooks for payment events
3. Test with Stripe CLI:
```bash
stripe listen --forward-to localhost:5001/webhook/stripe
```

### PayPal Setup
1. Create PayPal app in developer console
2. Configure live credentials
3. Set up webhook endpoints

## 🔒 Security Configuration

### SSL/HTTPS
```nginx
# Force HTTPS redirect
server {
    listen 80;
    server_name team.kelmah.com;
    return 301 https://$server_name$request_uri;
}
```

### Security Headers
```javascript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  next();
});
```

### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## 🧪 Testing in Production

### Health Checks
- [ ] API endpoints responding
- [ ] Database connections working
- [ ] Email delivery functioning
- [ ] Payment processing working
- [ ] Form validation working
- [ ] Mobile responsiveness verified

### Performance Testing
```bash
# Load testing with Artillery
npm install -g artillery
artillery quick --duration 60 --rate 10 https://team.kelmah.com
```

### Monitoring Setup
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Database monitoring
- [ ] Email delivery monitoring
- [ ] Payment transaction monitoring

## 📊 Analytics & Monitoring

### Google Analytics
```html
<!-- Add to index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
```

### Error Tracking (Sentry)
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV
});
```

## 🚀 Go-Live Checklist

### Pre-Launch
- [ ] All tests passing
- [ ] Performance optimization completed
- [ ] Security review completed
- [ ] Backup procedures established
- [ ] Monitoring configured
- [ ] Error alerting configured

### Launch Day
- [ ] Deploy backend services
- [ ] Deploy frontend application
- [ ] Configure DNS settings
- [ ] Test all functionality
- [ ] Monitor error logs
- [ ] Test payment processing
- [ ] Verify email delivery

### Post-Launch
- [ ] Monitor application performance
- [ ] Check error rates
- [ ] Verify user registrations
- [ ] Monitor payment success rates
- [ ] Review application analytics

## 🔧 Troubleshooting

### Common Issues

**API Connection Failed**
- Check CORS configuration
- Verify API URL in environment variables
- Check network connectivity

**Payment Processing Errors**
- Verify API keys are correct
- Check webhook configurations
- Review payment provider logs

**Email Delivery Issues**
- Check SMTP credentials
- Verify sender reputation
- Review spam folder policies

**Database Connection Issues**
- Verify connection string
- Check database permissions
- Review network security groups

### Log Locations
- **Frontend**: Browser developer console
- **Backend**: PM2 logs or server logs
- **Database**: MongoDB logs
- **Payment**: Stripe/PayPal dashboards

## 📞 Support

For deployment assistance:
- **Technical Support**: tech@kelmah.com
- **Deployment Issues**: deploy@kelmah.com
- **Emergency Contact**: +1 (555) 123-4567

---

**Remember**: Always test in staging environment before production deployment!
