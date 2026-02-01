// Understanding Express app.use() path mounting

console.log('='.repeat(80));
console.log('HOW EXPRESS APP.USE() WORKS WITH PATH MOUNTING');
console.log('='.repeat(80));

console.log('\n📚 SCENARIO 1: Gateway forwards /api/jobs?query');
console.log('-'.repeat(80));
console.log('1. Job-service receives HTTP request: GET /api/jobs?status=open');
console.log('2. Job-service has: app.use("/api/jobs", router)');
console.log('3. Express checks: Does request path start with /api/jobs? YES');
console.log('4. Express strips /api/jobs from path');
console.log('5. Router receives: req.url = "/?status=open" or req.path = "/"');
console.log('6. Route router.get("/") matches? YES ✅');
console.log('7. Controller receives req.query = { status: "open" }');

console.log('\n📚 SCENARIO 2: Gateway forwards /?query (prefix removed)');
console.log('-'.repeat(80));
console.log('1. Job-service receives HTTP request: GET /?status=open');
console.log('2. Job-service has: app.use("/api/jobs", router)');
console.log('3. Express checks: Does request path start with /api/jobs? NO');
console.log('4. Express does NOT mount router');
console.log('5. Falls through to 404 handler');
console.log('6. Result: 404 ❌');

console.log('\n📚 SCENARIO 3: Current bug - Query without slash');
console.log('-'.repeat(80));
console.log('1. Job-service receives: GET /api/jobs?status=open (no slash before ?)');
console.log('2. Job-service has: app.use("/api/jobs", router)');
console.log('3. Express strips /api/jobs');
console.log('4. Router receives: req.url = "?status=open" (NO LEADING SLASH!)');
console.log('5. Express route matching requires leading slash');
console.log('6. Route router.get("/") expects path "/" or "/?query"');
console.log('7. Path "?status=open" does NOT match "/" because no leading slash');
console.log('8. Result: 404 ❌');

console.log('\n🎯 THE REAL ISSUE:');
console.log('='.repeat(80));
console.log('When Express strips the mount path /api/jobs from /api/jobs?query');
console.log('It results in: ?query (no leading slash)');
console.log('But routes expect: /?query (with leading slash)');
console.log('');
console.log('Express behavior:');
console.log('  /api/jobs/search?q=test  →  /search?q=test  ✅');
console.log('  /api/jobs/?status=open   →  /?status=open    ✅');
console.log('  /api/jobs?status=open    →  ?status=open     ❌ NO LEADING SLASH!');

console.log('\n✅ THE SOLUTION:');
console.log('='.repeat(80));
console.log('Gateway must forward: /api/jobs/?status=open (WITH slash before ?)');
console.log('NOT: /api/jobs?status=open (WITHOUT slash before ?)');
console.log('');
console.log('Corrected pathRewrite:');
console.log('  1. Input: /api/jobs/?status=open');
console.log('  2. Already has slash before ? - keep it!');
console.log('  3. Output: /api/jobs/?status=open');
console.log('  4. Job-service receives: /api/jobs/?status=open');
console.log('  5. Express strips /api/jobs: /?status=open');
console.log('  6. Router route "/" matches: /?status=open ✅');

console.log('\n🔧 FIX: DONT STRIP THE SLASH BEFORE QUERY!');
console.log('='.repeat(80));
console.log('pathRewrite: (path) => {');
console.log('  let normalized = path.replace(/\\/\\/+/g, "/");  // Remove double slashes');
console.log('  // DO NOT remove slash before query!');
console.log('  // The slash is necessary for Express to leave a leading slash after stripping mount path');
console.log('  return normalized;  // Keep /api/jobs/?query as-is');
console.log('}');

console.log('\n' + '='.repeat(80));
