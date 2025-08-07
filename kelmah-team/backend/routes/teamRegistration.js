const express = require('express');
const router = express.Router();
const TeamRegistration = require('../models/TeamRegistration');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Test endpoint to verify API connectivity
router.get('/test', (req, res) => {
  console.log('🧪 Test endpoint hit');
  res.json({
    success: true,
    message: 'Kelmah Team API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rate limiting for registration endpoints
const registrationLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many registration attempts, please try again later.'
  }
});

const paymentLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // limit each IP to 3 payment attempts per windowMs
  message: {
    error: 'Too many payment attempts, please try again later.'
  }
});

// Validation middleware
const validateRegistration = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('country')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country is required'),
  
  body('currentStatus')
    .isIn(['student', 'recent-graduate', 'employed-tech', 'employed-non-tech', 'unemployed', 'freelancer', 'entrepreneur', 'career-changer'])
    .withMessage('Please select a valid current status'),
  
  body('experience')
    .isIn(['beginner', 'basic', 'intermediate', 'advanced'])
    .withMessage('Please select a valid experience level'),
  
  body('skills')
    .isArray({ min: 1 })
    .withMessage('Please select at least one skill'),
  
  body('goals')
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Career goals must be between 20 and 1000 characters'),
  
  body('availability')
    .isIn(['10-15', '15-20', '20-25', '25+'])
    .withMessage('Please select your availability'),
  
  body('commitment')
    .isIn(['full', 'high', 'moderate'])
    .withMessage('Please select your commitment level'),
  
  body('hearAbout')
    .trim()
    .notEmpty()
    .withMessage('Please tell us how you heard about the program'),
  
  body('motivation')
    .trim()
    .isLength({ min: 50, max: 1000 })
    .withMessage('Motivation must be between 50 and 1000 characters'),
  
  body('agreement')
    .equals('true')
    .withMessage('You must agree to the terms and conditions')
];

// @route   POST /api/team/register
// @desc    Submit team registration application
// @access  Public
router.post('/register', registrationLimit, validateRegistration, async (req, res) => {
  try {
    console.log('🚀 Registration request received');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request headers:', req.headers);
    console.log('Full request data:', JSON.stringify(req.body, null, 2));

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if email already exists
    const existingRegistration = await TeamRegistration.findOne({ 
      email: req.body.email 
    });
    
    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message: 'An application with this email already exists',
        registrationId: existingRegistration._id
      });
    }

    // Check if we've reached the maximum number of applications
    const totalApplications = await TeamRegistration.countDocuments({
      status: { $in: ['confirmed', 'payment-required'] }
    });

    if (totalApplications >= 50) { // Allow 50 applications for selection of 10
      return res.status(409).json({
        success: false,
        message: 'Application period has closed. All spots have been filled.',
        waitlistAvailable: true
      });
    }

    // Create new registration
    const registrationData = {
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      source: 'kelmah-team-portal'
    };

    const registration = new TeamRegistration(registrationData);
    await registration.save();

    // Generate application score
    const applicationScore = registration.applicationScore;

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully',
      data: {
        registrationId: registration._id,
        email: registration.email,
        fullName: registration.fullName,
        status: registration.status,
        applicationScore: applicationScore,
        nextSteps: {
          paymentRequired: true,
          paymentAmount: 500,
          paymentDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      }
    });

    // TODO: Send confirmation email
    // await sendConfirmationEmail(registration.email, registration.fullName, registration._id);

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
});

// @route   POST /api/team/payment
// @desc    Process registration payment
// @access  Public
router.post('/payment', paymentLimit, async (req, res) => {
  try {
    const { registrationId, paymentMethod, paymentData, amount } = req.body;

    // Validate required fields
    if (!registrationId || !paymentMethod || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Registration ID, payment method, and amount are required'
      });
    }

    // Find registration
    const registration = await TeamRegistration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Check if payment already completed
    if (registration.paymentStatus === 'completed') {
      return res.status(409).json({
        success: false,
        message: 'Payment has already been processed for this registration'
      });
    }

    // Validate amount
    if (amount !== 500) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    // Process payment based on method
    let paymentResult;
    try {
      switch (paymentMethod) {
        case 'card':
          paymentResult = await processCardPayment(paymentData, amount);
          break;
        case 'paypal':
          paymentResult = await processPayPalPayment(paymentData, amount);
          break;
        case 'bank':
          paymentResult = await processBankTransfer(paymentData, amount);
          break;
        default:
          throw new Error('Invalid payment method');
      }
    } catch (paymentError) {
      console.error('Payment processing error:', paymentError);
      return res.status(400).json({
        success: false,
        message: 'Payment processing failed',
        error: paymentError.message
      });
    }

    // Update registration with payment info
    registration.paymentStatus = 'completed';
    registration.paymentId = paymentResult.transactionId;
    registration.amountPaid = amount;
    registration.paymentDate = new Date();
    registration.status = 'confirmed';

    await registration.save();

    // Generate transaction ID
    const transactionId = `KLM_${Date.now()}_${registration._id.toString().slice(-6)}`;

    // Send success response
    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        transactionId: transactionId,
        registrationId: registration._id,
        amount: amount,
        paymentMethod: paymentMethod,
        paymentDate: registration.paymentDate,
        status: registration.status,
        receiptUrl: `/api/team/receipt/${transactionId}`
      }
    });

    // TODO: Send payment confirmation email
    // await sendPaymentConfirmationEmail(registration.email, registration.fullName, transactionId, amount);

  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
});

// @route   GET /api/team/status/:registrationId
// @desc    Get registration status
// @access  Public
router.get('/status/:registrationId', async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await TeamRegistration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.json({
      success: true,
      data: {
        registrationId: registration._id,
        fullName: registration.fullName,
        email: registration.email,
        status: registration.status,
        paymentStatus: registration.paymentStatus,
        isSelected: registration.isSelected,
        selectionRank: registration.selectionRank,
        applicationScore: registration.applicationScore,
        registrationDate: registration.registrationDate,
        paymentDate: registration.paymentDate
      }
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/team/stats
// @desc    Get registration statistics (admin)
// @access  Private (admin only)
router.get('/stats', async (req, res) => {
  try {
    // TODO: Add admin authentication middleware
    
    const stats = await TeamRegistration.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgScore: { $avg: '$applicationScore' }
        }
      }
    ]);

    const totalApplications = await TeamRegistration.countDocuments();
    const confirmedApplications = await TeamRegistration.countDocuments({ status: 'confirmed' });
    const selectedApplications = await TeamRegistration.countDocuments({ isSelected: true });

    res.json({
      success: true,
      data: {
        totalApplications,
        confirmedApplications,
        selectedApplications,
        availableSpots: Math.max(0, 10 - selectedApplications),
        statusBreakdown: stats,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mock payment processing functions (replace with actual integrations)
async function processCardPayment(paymentData, amount) {
  // TODO: Integrate with Stripe or other payment processor
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        transactionId: `card_${Date.now()}`,
        status: 'completed'
      });
    }, 2000);
  });
}

async function processPayPalPayment(paymentData, amount) {
  // TODO: Integrate with PayPal
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        transactionId: `pp_${Date.now()}`,
        status: 'completed'
      });
    }, 1500);
  });
}

async function processBankTransfer(paymentData, amount) {
  // For bank transfers, mark as pending and require manual verification
  return {
    transactionId: `bt_${Date.now()}`,
    status: 'pending_verification'
  };
}

module.exports = router;
