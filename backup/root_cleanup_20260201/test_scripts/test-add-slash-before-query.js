// Test adding slash before query string

console.log('='.repeat(80));
console.log('TESTING: ADD SLASH BEFORE QUERY STRING');
console.log('='.repeat(80));

const pathRewrite = (path) => {
  console.log(`\n[INPUT] ${path}`);
  
  // Remove double slashes
  let normalized = path.replace(/\/\/+/g, '/');
  console.log(`[STEP 1] After double slash removal: ${normalized}`);
  
  // ADD slash before query string if missing
  if (normalized.includes('?') && !normalized.includes('/?')) {
    normalized = normalized.replace('?', '/?');
  }
  console.log(`[STEP 2] Final: ${normalized}`);
  
  return normalized;
};

const testCases = [
  '/api/jobs?status=open&min_budget=500',  // Frontend sends this (no slash)
  '/api/jobs/?status=open',                 // Already has slash
  '/api/jobs',                              // No query string
  '/api/jobs/',                             // Trailing slash, no query
  '/api/jobs/123',                          // Specific job ID
  '/api/jobs/search?q=test',                // Search with query (no slash before ?)
];

console.log('\n' + '='.repeat(80));
console.log('TEST RESULTS:');
console.log('='.repeat(80));

testCases.forEach(testCase => {
  const result = pathRewrite(testCase);
  const icon = testCase.includes('?') && !testCase.includes('/?') ? '🔧' : '✅';
  console.log(`\n${icon} ${testCase} → ${result}`);
});

console.log('\n' + '='.repeat(80));
console.log('EXPECTED BEHAVIOR:');
console.log('='.repeat(80));
console.log('Gateway receives: /api/jobs?status=open (no slash)');
console.log('ensureBasePrefix: /api/jobs?status=open (already has prefix)');
console.log('pathRewrite ADDS slash: /api/jobs/?status=open');
console.log('Forwarded to job-service: /api/jobs/?status=open');
console.log('Express strips /api/jobs: /?status=open');
console.log('Route "/" matches: /?status=open ✅');
console.log('='.repeat(80));
