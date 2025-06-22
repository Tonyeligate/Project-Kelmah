require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import routes
const transactionRoutes = require('./routes/transaction.routes');
const walletRoutes = require('./routes/wallet.routes');
const paymentMethodRoutes = require('./routes/paymentMethod.routes');
const billRoutes = require('./routes/bill.routes');
const paymentsRoutes = require('./routes/payments.routes');

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/payments', paymentsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
})
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start server
    const PORT = process.env.PORT || 3004;
    app.listen(PORT, () => {
      console.log(`Payment service is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});
