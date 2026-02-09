#!/usr/bin/env node

/**
 * Test Token Generation and Verification
 * Tests the crypto hash logic used in email verification
 */

const crypto = require('crypto');

console.log('🔐 TOKEN GENERATION & VERIFICATION TEST');
console.log('======================================');

function testTokenLogic() {
  console.log('\n1. 🧪 Testing token generation logic...');
  
  // Simulate the generateVerificationToken function
  const generateVerificationToken = () => {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    console.log('   📝 Raw token (sent in email):', token);
    console.log('   🔒 Hashed token (stored in DB):', hashedToken);
    console.log('   📏 Raw token length:', token.length);
    console.log('   📏 Hashed token length:', hashedToken.length);
    
    return { raw: token, hashed: hashedToken };
  };
  
  // Simulate the findByVerificationToken function
  const findByVerificationToken = (rawToken, storedHashedToken) => {
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    
    console.log('\n2. 🔍 Testing token verification logic...');
    console.log('   📝 Input raw token:', rawToken);
    console.log('   🔒 Computed hash:', hashedToken);
    console.log('   🔒 Stored hash:', storedHashedToken);
    console.log('   ✅ Tokens match:', hashedToken === storedHashedToken);
    
    return hashedToken === storedHashedToken;
  };
  
  // Run the test
  const tokens = generateVerificationToken();
  const verificationResult = findByVerificationToken(tokens.raw, tokens.hashed);
  
  console.log('\n3. 🎯 Test Result...');
  if (verificationResult) {
    console.log('   ✅ Token generation and verification logic is CORRECT');
  } else {
    console.log('   ❌ Token generation and verification logic is BROKEN');
  }
  
  // Test with wrong token
  console.log('\n4. 🚫 Testing with wrong token...');
  const wrongToken = crypto.randomBytes(32).toString('hex');
  const wrongVerification = findByVerificationToken(wrongToken, tokens.hashed);
  
  if (!wrongVerification) {
    console.log('   ✅ Wrong token correctly rejected');
  } else {
    console.log('   ❌ Wrong token incorrectly accepted');
  }
  
  // Test URL encoding issues
  console.log('\n5. 🌐 Testing URL encoding scenarios...');
  
  const urlEncodedToken = encodeURIComponent(tokens.raw);
  console.log('   🔗 URL encoded token:', urlEncodedToken);
  console.log('   📏 URL encoded length:', urlEncodedToken.length);
  console.log('   ✅ URL encoding needed:', urlEncodedToken !== tokens.raw);
  
  const decodedToken = decodeURIComponent(urlEncodedToken);
  const decodedVerification = findByVerificationToken(decodedToken, tokens.hashed);
  
  if (decodedVerification) {
    console.log('   ✅ URL encoded/decoded token works correctly');
  } else {
    console.log('   ❌ URL encoding/decoding breaks token verification');
  }
}

function printTokenTroubleshooting() {
  console.log('\n🔧 TOKEN TROUBLESHOOTING GUIDE');
  console.log('==============================');
  console.log('Common token verification issues:');
  console.log('');
  console.log('1. 🔗 URL ENCODING ISSUES:');
  console.log('   • Token contains special characters that get URL encoded');
  console.log('   • Frontend doesn\'t decode the token before sending to API');
  console.log('   • Solution: Use URL-safe tokens or proper decoding');
  console.log('');
  console.log('2. ⏰ TOKEN EXPIRATION:');
  console.log('   • Check emailVerificationExpires field in database');
  console.log('   • Ensure current time < expiration time');
  console.log('   • Default expiration is 24 hours');
  console.log('');
  console.log('3. 🗄️ DATABASE ISSUES:');
  console.log('   • Token not saved to database after generation');
  console.log('   • MongoDB connection issues during save/find');
  console.log('   • Case sensitivity in token storage/retrieval');
  console.log('');
  console.log('4. 🔐 HASH MISMATCH:');
  console.log('   • Different hashing algorithm used');
  console.log('   • Token modified during transmission');
  console.log('   • Character encoding issues (UTF-8 vs ASCII)');
  console.log('');
  console.log('5. 🌐 FRONTEND-BACKEND MISMATCH:');
  console.log('   • Frontend calls wrong API endpoint');
  console.log('   • Token parameter name mismatch');
  console.log('   • CORS or authentication headers issues');
}

// Run the test
if (require.main === module) {
  testTokenLogic();
  printTokenTroubleshooting();
}

module.exports = { testTokenLogic };