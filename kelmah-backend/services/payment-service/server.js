const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
// removed morgan; using shared JSON logger

// Import routes
// Support both naming variants for compatibility
const transactionRoutes = require("./routes/transactions.routes");
const walletRoutes = require("./routes/wallet.routes");
const paymentMethodRoutes = require("./routes/paymentMethod.routes");
const billRoutes = require("./routes/bill.routes");
const paymentsRoutes = require("./routes/payments.routes");
const escrowRoutes = require("./routes/escrow.routes");
// Escrow routes do not exist yet; transactions/escrows are handled by wallet controller for now

// Create Express app

// Import centralized logger
const { createLogger, createHttpLogger, createErrorLogger, setupGlobalErrorHandlers } = require('./utils/logger');

// Create service logger
const logger = createLogger('payment-service');

// Setup global error handlers
setupGlobalErrorHandlers(logger);

logger.info('payment-service starting...', { 
  nodeVersion: process.version,
  environment: process.env.NODE_ENV || 'development'
});

// Fail-fast env validation
try {
  const { requireEnv } = require('../../shared/utils/envValidator');
  if (process.env.NODE_ENV === 'production') {
    requireEnv(['JWT_SECRET', 'MONGODB_URI'], 'payment-service');
    // At least one provider key must be present for payments
    if (!(
      process.env.STRIPE_SECRET_KEY ||
      process.env.PAYSTACK_SECRET_KEY ||
      process.env.MTN_MOMO_PRIMARY_KEY || process.env.MTN_SUBSCRIPTION_KEY ||
      process.env.VODAFONE_CLIENT_ID || process.env.AIRTELTIGO_CLIENT_ID
    )) {
      console.error('payment-service: No payment provider keys configured');
      process.exit(1);
    }
  } else if (!process.env.JWT_SECRET) {
    console.error('Payment Service missing JWT_SECRET. Exiting.');
    process.exit(1);
  }
} catch {}

const app = express();
// Optional tracing
try { require('../../shared/utils/tracing').initTracing('payment-service'); } catch {}
try { const monitoring = require('../../shared/utils/monitoring'); monitoring.initErrorMonitoring('payment-service'); monitoring.initTracing('payment-service'); } catch {}

// Middleware
app.use(helmet());
// Unified CORS (env-driven allowlist + Vercel previews)
const corsOptions = {
  origin: function (origin, callback) {
    const envAllow = (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      process.env.FRONTEND_URL,
      ...envAllow,
    ].filter(Boolean);

    const vercelPatterns = [
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*-kelmahs-projects\.vercel\.app$/,
      /^https:\/\/project-kelmah.*\.vercel\.app$/,
      /^https:\/\/kelmah-frontend.*\.vercel\.app$/,
    ];

    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || vercelPatterns.some((re) => re.test(origin))) {
      return callback(null, true);
    }
    logger.info(`🚨 CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With','X-Request-ID'],
};

app.use(cors(corsOptions));
// request/response logging is handled by createHttpLogger

// Add HTTP request logging
app.use(createHttpLogger(logger));

// Rate limiting (shared Redis-backed limiter with fallback)
try {
  const { createLimiter } = require('../auth-service/middlewares/rateLimiter');
  app.use(createLimiter('default'));
} catch (err) {
  const rateLimit = require('express-rate-limit');
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' },
  });
  app.use(limiter);
}

// Mount webhooks BEFORE JSON parser to preserve raw bodies for signature verification
app.use('/api/webhooks', require('./routes/webhooks.routes'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/payments/transactions", transactionRoutes);
app.use("/api/payments/wallet", walletRoutes);
app.use("/api/payments/methods", paymentMethodRoutes);
app.use("/api/payments/escrows", escrowRoutes);
app.use("/api/payments/bills", billRoutes);
app.use("/api/payments", paymentsRoutes);
// Webhooks are mounted above JSON parser

// Provider health endpoint for monitoring
const providersHealth = (req, res) => {
  const providers = {
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
    paystack: Boolean(process.env.PAYSTACK_SECRET_KEY),
    mtn: Boolean(process.env.MTN_MOMO_API_KEY || process.env.MTN_MOMO_PRIMARY_KEY),
    vodafone: Boolean(process.env.VODAFONE_CASH_API_KEY || process.env.VODAFONE_CLIENT_ID),
    airteltigo: Boolean(process.env.AIRTELTIGO_CLIENT_ID || process.env.AIRTELTIGO_MERCHANT_ID),
  };
  res.json({ success: true, data: { providers } });
};

app.get('/health/providers', providersHealth);
app.get('/api/health/providers', providersHealth); // API Gateway compatibility

// Health check endpoint
const healthResponse = (req, res) => {
  const dbReady = mongoose.connection?.readyState === 1;
  res.status(200).json({ service: 'payment-service', status: dbReady ? 'healthy' : 'degraded', db: dbReady ? 'connected' : 'disconnected', timestamp: new Date().toISOString() });
};

app.get("/health", healthResponse);
app.get("/api/health", healthResponse); // API Gateway compatibility

app.get('/health/ready', (req, res) => {
  const ready = mongoose.connection?.readyState === 1;
  res.status(ready ? 200 : 503).json({ ready, timestamp: new Date().toISOString() });
});

app.get('/api/health/ready', (req, res) => {
  const ready = mongoose.connection?.readyState === 1;
  res.status(ready ? 200 : 503).json({ ready, timestamp: new Date().toISOString() });
});

app.get('/health/live', (req, res) => {
  res.status(200).json({ alive: true, timestamp: new Date().toISOString() });
});

app.get('/api/health/live', (req, res) => {
  res.status(200).json({ alive: true, timestamp: new Date().toISOString() });
});

// Lightweight reconciliation trigger for schedulers (e.g., GitHub Actions cron)
// Non-blocking: runs reconcile in background and returns 202 immediately
app.post('/health/reconcile', (req, res) => {
  try {
    const since = req.query.since;
    const limit = req.query.limit;
    // Defer import to avoid circular deps at boot
    const transactionRoutes = require('./routes/transactions.routes');
    // Kick off reconcile via internal HTTP call to reuse auth/middleware
    // but here we call controller directly to avoid auth requirement since this is internal
    const controller = require('./controllers/transaction.controller');
    setImmediate(async () => {
      try {
        await controller.reconcile({ query: { since, limit }, user: { _id: 'scheduler' } }, { json: () => {} });
      } catch (_) {}
    });
    res.status(202).json({ success: true, message: 'Reconciliation started' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to start reconciliation' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start HTTP server first; connect to MongoDB with retry to avoid ECS crash loops
const mongoUri = process.env.PAYMENT_MONGO_URI || process.env.MONGODB_URI;
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
};

const PORT = process.env.PORT || 3004;
let httpServerStarted = false;

async function connectDbWithRetry() {
  const baseDelayMs = 5000;
  let attempt = 0;
  // Keep retrying DB connection with backoff to avoid container exits when DB is unavailable
  for (;;) {
    try {
      await mongoose.connect(mongoUri, mongoOptions);
      logger.info('Connected to MongoDB');

      // Optional background reconciliation without external scheduler (requires DB)
      try {
        const enableReconcile = (process.env.ENABLE_RECONCILE_CRON || 'false').toLowerCase() === 'true';
        const intervalMinutes = Math.max(5, parseInt(process.env.RECONCILE_INTERVAL_MINUTES || '30'));
        if (enableReconcile) {
          const controller = require('./controllers/transaction.controller');
          const tick = async () => {
            const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            await controller.reconcile(
              { query: { since, limit: 200 }, user: { _id: 'cron' } },
              { json: (payload) => logger.info('Reconcile tick complete', payload) }
            );
          };
          setInterval(() => {
            tick().catch((e) => logger.error('Reconcile tick failed', { error: e?.message }));
          }, intervalMinutes * 60 * 1000);
          logger.info(`Reconcile cron enabled (every ${intervalMinutes} minutes)`);
        }
      } catch (e) {
        logger.error('Failed to initialize reconcile cron', { error: e?.message });
      }

      break;
    } catch (err) {
      attempt += 1;
      const delay = Math.min(baseDelayMs * attempt, 30000);
      logger.error('MongoDB connection error:', err?.message || err);
      logger.info(`Retrying MongoDB connection in ${Math.floor(delay / 1000)}s (attempt ${attempt})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Error logging middleware (must be last before listen)
app.use(createErrorLogger(logger));

// Start server immediately so /health endpoints are available regardless of DB
if (!httpServerStarted) {
  app.listen(PORT, () => {
    httpServerStarted = true;
    logger.info(`Payment service is running on port ${PORT}`);
  });
}

// Begin DB connection attempts in background
connectDbWithRetry();

// Handle unhandled promise rejections (do not exit to keep task alive)
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Promise Rejection:", err);
});
