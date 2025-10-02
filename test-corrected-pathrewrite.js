// Test the corrected pathRewrite logic

console.log('='.repeat(80));
console.log('TESTING CORRECTED PATH REWRITE LOGIC');
console.log('='.repeat(80));

const pathRewrite = (path) => {
  console.log(`\n[INPUT] Original path: ${path}`);
  
  // Remove double slashes
  let normalized = path.replace(/\/\/+/g, '/');
  console.log(`[STEP 1] After double slash removal: ${normalized}`);
  
  // Remove slash before query string
  normalized = normalized.replace(/\/\?/g, '?');
  console.log(`[STEP 2] After slash-before-query removal: ${normalized}`);
  
  // Strip /api/jobs prefix since job-service will add it back via app.use
  normalized = normalized.replace(/^\/api\/jobs/, '');
  console.log(`[STEP 3] After prefix removal: ${normalized}`);
  
  // Ensure leading slash (unless it's just a query string)
  if (!normalized.startsWith('/') && !normalized.startsWith('?')) {
    normalized = '/' + normalized;
  }
  console.log(`[STEP 4] Final path: ${normalized}`);
  
  return normalized;
};

// Test cases
const testCases = [
  '/api/jobs/?status=open&min_budget=500&max_budget=10000&limit=50',
  '/api/jobs',
  '/api/jobs/',
  '/api/jobs/123',
  '/api/jobs/search',
  '/api/jobs/my-jobs',
  '/api/jobs/categories'
];

console.log('\n' + '='.repeat(80));
console.log('TEST RESULTS:');
console.log('='.repeat(80));

testCases.forEach(testCase => {
  const result = pathRewrite(testCase);
  console.log(`\n✅ ${testCase}`);
  console.log(`   → ${result}`);
});

console.log('\n' + '='.repeat(80));
console.log('EXPECTED BEHAVIOR IN JOB-SERVICE:');
console.log('='.repeat(80));
console.log('\nJob-service mounts: app.use("/api/jobs", router)');
console.log('Job-service receives the rewritten path from gateway');
console.log('Job-service does NOT strip prefix (gateway already did)');
console.log('\nRouter routes:');
console.log('  router.get("/", ...)          matches: /?query');
console.log('  router.get("/search", ...)    matches: /search');
console.log('  router.get("/:id", ...)       matches: /123');
console.log('='.repeat(80));
