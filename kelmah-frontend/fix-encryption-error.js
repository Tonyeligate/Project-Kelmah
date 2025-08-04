/**
 * Fix script for malformed UTF-8 data encryption error
 * This script clears potentially corrupted localStorage data
 */

console.log('🔧 Fixing malformed UTF-8 decryption error...');

// List of keys that might contain encrypted data
const keysToCheck = [
  'kelmah_secure_storage',
  'kelmah_auth_token', 
  'kelmah_user_data',
  'user',
  'token',
  'authToken',
  'refreshToken'
];

// Clear potentially corrupted keys
keysToCheck.forEach(key => {
  if (localStorage.getItem(key)) {
    console.log(`📦 Clearing potentially corrupted key: ${key}`);
    localStorage.removeItem(key);
  }
});

// Also clear session storage
keysToCheck.forEach(key => {
  if (sessionStorage.getItem(key)) {
    console.log(`📦 Clearing session storage key: ${key}`);
    sessionStorage.removeItem(key);
  }
});

console.log('✅ Cleared potentially corrupted storage data');
console.log('🔄 Please refresh the page to continue');