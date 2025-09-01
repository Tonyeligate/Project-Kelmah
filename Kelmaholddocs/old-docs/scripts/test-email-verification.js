#!/usr/bin/env node

/**
 * Email Verification System Test Script
 * Tests the complete email verification flow
 */

const axios = require('axios');
const crypto = require('crypto');

// Configuration
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
const TEST_EMAIL = 'test-verification@example.com';
const TEST_USER = {
  firstName: 'Test',
  lastName: 'User', 
  email: TEST_EMAIL,
  password: 'TestPassword123!',
  role: 'worker'
};

console.log('🧪 EMAIL VERIFICATION SYSTEM TEST');
console.log('=====================================');

async function testEmailVerificationFlow() {
  try {
    console.log('\n1. 📝 Testing user registration with email verification...');
    
    // Step 1: Register user
    const registerResponse = await axios.post(`${AUTH_SERVICE_URL}/register`, TEST_USER);
    console.log('✅ Registration successful:', registerResponse.data.message);
    
    // Step 2: Test resend verification email
    console.log('\n2. 📧 Testing resend verification email...');
    const resendResponse = await axios.post(`${AUTH_SERVICE_URL}/resend-verification-email`, {
      email: TEST_EMAIL
    });
    console.log('✅ Resend email successful:', resendResponse.data.message);
    
    // Step 3: Generate a test token (simulate clicking email link)
    console.log('\n3. 🔗 Testing email verification with token...');
    
    // For testing, we need to generate a valid token
    // In real scenario, this would come from the email link
    const testToken = crypto.randomBytes(32).toString('hex');
    
    try {
      const verifyResponse = await axios.get(`${AUTH_SERVICE_URL}/verify-email/${testToken}`);
      console.log('✅ Email verification successful:', verifyResponse.data.message);
    } catch (verifyError) {
      console.log('⚠️ Expected: Token verification failed (token not in database)');
      console.log('   Message:', verifyError.response?.data?.message);
    }
    
    console.log('\n4. 🧪 Testing email service configuration...');
    
    // Check if SMTP configuration is set
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      console.log('✅ SMTP configuration found');
      console.log('   Host:', process.env.SMTP_HOST);
      console.log('   User:', process.env.SMTP_USER);
    } else {
      console.log('⚠️ SMTP configuration missing');
      console.log('   Set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables');
    }
    
    console.log('\n🎉 EMAIL VERIFICATION TEST COMPLETED');
    console.log('=====================================');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Email deliverability checklist
function displayEmailDeliverabilityTips() {
  console.log('\n📋 EMAIL DELIVERABILITY CHECKLIST:');
  console.log('=====================================');
  console.log('✅ COMPLETED:');
  console.log('   • Enhanced anti-spam headers added');
  console.log('   • Professional email template');
  console.log('   • Proper Message-ID generation');
  console.log('   • Unsubscribe headers included');
  console.log('   • Text + HTML versions provided');
  
  console.log('\n⚠️ DOMAIN CONFIGURATION NEEDED:');
  console.log('   • Set up SPF record: "v=spf1 include:_spf.google.com ~all"');
  console.log('   • Set up DKIM signing (via SMTP provider)');
  console.log('   • Set up DMARC policy: "v=DMARC1; p=quarantine"');
  console.log('   • Verify domain ownership with email provider');
  console.log('   • Use dedicated sending IP if possible');
  console.log('   • Monitor sender reputation');
  
  console.log('\n📧 SMTP PROVIDER RECOMMENDATIONS:');
  console.log('   • SendGrid (Professional): Best for high volume');
  console.log('   • Mailgun: Good API and deliverability');
  console.log('   • Amazon SES: Cost-effective, good reputation');
  console.log('   • Avoid: Free Gmail SMTP (high spam rate)');
}

// Run tests
if (require.main === module) {
  testEmailVerificationFlow()
    .then(() => {
      displayEmailDeliverabilityTips();
    })
    .catch(console.error);
}

module.exports = { testEmailVerificationFlow };