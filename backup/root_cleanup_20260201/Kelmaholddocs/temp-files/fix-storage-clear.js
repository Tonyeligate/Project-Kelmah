/**
 * Clear corrupted storage script - Run in browser console
 */
console.log('🔧 Clearing corrupted localStorage and sessionStorage...');

// Clear all storage
localStorage.clear();
sessionStorage.clear();

// Also clear specific Kelmah keys if they exist
const kelmahKeys = [
  'kelmah_secure_storage',
  'kelmah_auth_token',
  'kelmah_user_data',
  'user',
  'token',
  'authToken',
  'refreshToken'
];

kelmahKeys.forEach(key => {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
});

console.log('✅ Storage cleared successfully!');
console.log('🔄 Please refresh the page to continue');

// Optional: Automatically refresh after 2 seconds
setTimeout(() => {
  console.log('🔄 Auto-refreshing page...');
  window.location.reload();
}, 2000);