const TeamRegistration = require('../models/TeamRegistration');
const nodemailer = require('nodemailer');

class TeamRegistrationService {
  constructor() {
    this.emailTransporter = this.setupEmailTransporter();
  }

  setupEmailTransporter() {
    // Configure your email service (Gmail, SendGrid, etc.)
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'team@kelmah.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
      }
    });
  }

  /**
   * Create new team registration
   */
  async createRegistration(registrationData) {
    try {
      // Check if email already exists
      const existingRegistration = await TeamRegistration.findOne({ 
        email: registrationData.email 
      });
      
      if (existingRegistration) {
        throw new Error('Email already registered');
      }

      // Create new registration
      const registration = new TeamRegistration(registrationData);
      await registration.save();

      // Send confirmation email
      await this.sendConfirmationEmail(registration);

      return {
        success: true,
        registration: registration,
        message: 'Registration created successfully'
      };

    } catch (error) {
      console.error('Registration creation error:', error);
      throw error;
    }
  }

  /**
   * Process payment for registration
   */
  async processPayment(registrationId, paymentData) {
    try {
      const registration = await TeamRegistration.findById(registrationId);
      if (!registration) {
        throw new Error('Registration not found');
      }

      if (registration.paymentStatus === 'completed') {
        throw new Error('Payment already processed');
      }

      // Process payment based on method
      const paymentResult = await this.handlePaymentProcessing(paymentData);

      // Update registration
      registration.paymentStatus = 'completed';
      registration.paymentId = paymentResult.transactionId;
      registration.amountPaid = paymentData.amount;
      registration.paymentDate = new Date();
      registration.status = 'confirmed';

      await registration.save();

      // Send payment confirmation email
      await this.sendPaymentConfirmationEmail(registration, paymentResult);

      return {
        success: true,
        registration: registration,
        paymentResult: paymentResult,
        message: 'Payment processed successfully'
      };

    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  }

  /**
   * Handle different payment methods
   */
  async handlePaymentProcessing(paymentData) {
    const { method, amount, data } = paymentData;

    switch (method) {
      case 'card':
        return await this.processCardPayment(data, amount);
      case 'paypal':
        return await this.processPayPalPayment(data, amount);
      case 'bank':
        return await this.processBankTransfer(data, amount);
      default:
        throw new Error('Invalid payment method');
    }
  }

  /**
   * Process card payment (Stripe integration)
   */
  async processCardPayment(cardData, amount) {
    // TODO: Integrate with Stripe
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    try {
      // Mock implementation - replace with actual Stripe integration
      const paymentIntent = {
        id: `pi_${Date.now()}`,
        amount: amount * 100, // Stripe uses cents
        currency: 'usd',
        status: 'succeeded'
      };

      return {
        transactionId: paymentIntent.id,
        status: 'completed',
        amount: amount,
        currency: 'USD',
        method: 'card',
        processingFee: Math.round(amount * 0.029 + 0.30) // 2.9% + $0.30
      };

    } catch (error) {
      console.error('Card payment error:', error);
      throw new Error('Card payment failed');
    }
  }

  /**
   * Process PayPal payment
   */
  async processPayPalPayment(paypalData, amount) {
    // TODO: Integrate with PayPal SDK
    try {
      // Mock implementation
      return {
        transactionId: `pp_${Date.now()}`,
        status: 'completed',
        amount: amount,
        currency: 'USD',
        method: 'paypal',
        processingFee: Math.round(amount * 0.035) // 3.5%
      };

    } catch (error) {
      console.error('PayPal payment error:', error);
      throw new Error('PayPal payment failed');
    }
  }

  /**
   * Process bank transfer
   */
  async processBankTransfer(bankData, amount) {
    // Bank transfers require manual verification
    return {
      transactionId: `bt_${Date.now()}`,
      status: 'pending_verification',
      amount: amount,
      currency: 'USD',
      method: 'bank',
      processingFee: 0,
      verificationRequired: true
    };
  }

  /**
   * Send confirmation email
   */
  async sendConfirmationEmail(registration) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'team@kelmah.com',
        to: registration.email,
        subject: '🎉 Your Kelmah Team Application Received!',
        html: this.generateConfirmationEmailHTML(registration)
      };

      await this.emailTransporter.sendMail(mailOptions);
      console.log('Confirmation email sent to:', registration.email);

    } catch (error) {
      console.error('Email sending error:', error);
      // Don't throw error - email failure shouldn't fail the registration
    }
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmationEmail(registration, paymentResult) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'team@kelmah.com',
        to: registration.email,
        subject: '✅ Payment Confirmed - Welcome to Kelmah Team!',
        html: this.generatePaymentConfirmationEmailHTML(registration, paymentResult)
      };

      await this.emailTransporter.sendMail(mailOptions);
      console.log('Payment confirmation email sent to:', registration.email);

    } catch (error) {
      console.error('Payment email sending error:', error);
    }
  }

  /**
   * Generate confirmation email HTML
   */
  generateConfirmationEmailHTML(registration) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); color: white; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #FFD700; font-size: 2rem; margin-bottom: 10px;">KELMAH TEAM</h1>
          <h2 style="color: white; margin: 0;">Application Received! 🎉</h2>
        </div>
        
        <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 215, 0, 0.2); border-radius: 15px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #FFD700; margin-bottom: 15px;">Hello ${registration.fullName}!</h3>
          
          <p style="line-height: 1.6; color: #E5E5E5;">
            Thank you for applying to join the exclusive Kelmah Team training program! 
            We've successfully received your application and are excited about your interest.
          </p>
          
          <div style="background: rgba(255, 215, 0, 0.1); border: 1px solid rgba(255, 215, 0, 0.3); border-radius: 10px; padding: 15px; margin: 20px 0;">
            <h4 style="color: #FFD700; margin-bottom: 10px;">⚡ Next Steps:</h4>
            <ol style="color: #E5E5E5; line-height: 1.6;">
              <li><strong>Complete Payment:</strong> Secure your spot with the $500 registration fee</li>
              <li><strong>Email Confirmation:</strong> You'll receive program details within 24 hours</li>
              <li><strong>Community Access:</strong> Join our exclusive Discord server</li>
              <li><strong>Program Kickoff:</strong> January 15, 2025</li>
            </ol>
          </div>
          
          <div style="background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3); border-radius: 10px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #4caf50; text-align: center;">
              <strong>🛡️ 100% Job Placement Guarantee</strong><br>
              <small style="color: #E5E5E5;">Your investment is protected by our employment guarantee</small>
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #E5E5E5; margin-bottom: 15px;">Questions? We're here to help!</p>
          <p style="color: #FFD700;">
            📧 team@kelmah.com | 💬 @TonyShelby | 📱 +1 (555) 123-4567
          </p>
        </div>
        
        <div style="text-align: center; font-size: 0.9rem; color: #888; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
          <p>Application ID: ${registration._id}</p>
          <p>© 2025 Kelmah Team. All rights reserved.</p>
        </div>
      </div>
    `;
  }

  /**
   * Generate payment confirmation email HTML
   */
  generatePaymentConfirmationEmailHTML(registration, paymentResult) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); color: white; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #FFD700 0%, #F4C430 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 2rem; color: black;">✓</span>
          </div>
          <h1 style="color: #FFD700; font-size: 2rem; margin-bottom: 10px;">WELCOME TO KELMAH TEAM!</h1>
          <h2 style="color: white; margin: 0;">Payment Confirmed 🎉</h2>
        </div>
        
        <div style="background: rgba(255, 215, 0, 0.1); border: 2px solid #FFD700; border-radius: 15px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #FFD700; margin-bottom: 15px;">Payment Details</h3>
          
          <div style="display: grid; gap: 10px;">
            <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
              <span style="color: #E5E5E5;">Transaction ID:</span>
              <span style="color: white; font-family: monospace;">${paymentResult.transactionId}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
              <span style="color: #E5E5E5;">Amount Paid:</span>
              <span style="color: white; font-weight: bold;">$${paymentResult.amount}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
              <span style="color: #E5E5E5;">Payment Method:</span>
              <span style="color: white;">${paymentResult.method.toUpperCase()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
              <span style="color: #E5E5E5;">Date:</span>
              <span style="color: white;">${new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #FFD700; margin-bottom: 15px;">What Happens Next? 🚀</h3>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: white;">1. Welcome Email (24 hours)</strong>
            <p style="color: #E5E5E5; margin: 5px 0; font-size: 0.9rem;">Detailed program information and schedule</p>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: white;">2. Discord Access (48 hours)</strong>
            <p style="color: #E5E5E5; margin: 5px 0; font-size: 0.9rem;">Join our exclusive community server</p>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: white;">3. Orientation Session (January 15, 2025)</strong>
            <p style="color: #E5E5E5; margin: 5px 0; font-size: 0.9rem;">Virtual kickoff meeting</p>
          </div>
          
          <div>
            <strong style="color: white;">4. Learning Begins (January 22, 2025)</strong>
            <p style="color: #E5E5E5; margin: 5px 0; font-size: 0.9rem;">Foundation Phase starts</p>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #E5E5E5; margin-bottom: 15px;">Need help or have questions?</p>
          <p style="color: #FFD700;">
            📧 team@kelmah.com | 💬 @TonyShelby | 📱 +1 (555) 123-4567
          </p>
        </div>
        
        <div style="text-align: center; font-size: 0.9rem; color: #888; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
          <p>Keep this email as your payment receipt</p>
          <p>© 2025 Kelmah Team. All rights reserved.</p>
        </div>
      </div>
    `;
  }

  /**
   * Get registration statistics
   */
  async getRegistrationStats() {
    try {
      const totalApplications = await TeamRegistration.countDocuments();
      const confirmedApplications = await TeamRegistration.countDocuments({ status: 'confirmed' });
      const pendingPayments = await TeamRegistration.countDocuments({ status: 'payment-required' });
      const selectedApplicants = await TeamRegistration.countDocuments({ isSelected: true });

      const statusBreakdown = await TeamRegistration.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const experienceBreakdown = await TeamRegistration.aggregate([
        {
          $match: { status: { $in: ['confirmed', 'payment-required'] } }
        },
        {
          $group: {
            _id: '$experience',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        summary: {
          totalApplications,
          confirmedApplications,
          pendingPayments,
          selectedApplicants,
          availableSpots: Math.max(0, 10 - selectedApplicants)
        },
        breakdown: {
          status: statusBreakdown,
          experience: experienceBreakdown
        },
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Stats calculation error:', error);
      throw error;
    }
  }

  /**
   * Select top applicants for the program
   */
  async selectTopApplicants(limit = 10) {
    try {
      // Get all confirmed applications ranked by score
      const rankedApplicants = await TeamRegistration.getRankedApplicants();
      
      // Select top candidates
      const topApplicants = rankedApplicants.slice(0, limit);
      
      // Update selection status
      for (let i = 0; i < topApplicants.length; i++) {
        await TeamRegistration.findByIdAndUpdate(
          topApplicants[i]._id,
          { 
            isSelected: true,
            selectionRank: i + 1
          }
        );
      }

      return {
        success: true,
        selected: topApplicants.length,
        applicants: topApplicants
      };

    } catch (error) {
      console.error('Selection error:', error);
      throw error;
    }
  }
}

module.exports = new TeamRegistrationService();
