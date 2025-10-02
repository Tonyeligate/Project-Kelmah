// CRITICAL INSIGHT: Path Forwarding Issue

console.log('='.repeat(80));
console.log('UNDERSTANDING HTTP-PROXY-MIDDLEWARE PATH BEHAVIOR');
console.log('='.repeat(80));

console.log('\n📌 THE PROBLEM:');
console.log('Job-service logs show: /api/jobs/?status=open');
console.log('Job-service expects: /?status=open (after app.use("/api/jobs") strips prefix)');
console.log('');

console.log('🔍 WHY THIS HAPPENS:');
console.log('1. Gateway receives: /api/jobs/?status=open');
console.log('2. ensureBasePrefix ensures /api/jobs prefix exists');
console.log('3. pathRewrite returns: /api/jobs?status=open (slash removed)');
console.log('4. http-proxy-middleware forwards: /api/jobs?status=open');
console.log('5. Job-service receives: /api/jobs?status=open');
console.log('6. app.use("/api/jobs", router) strips: /api/jobs');
console.log('7. Router receives: ?status=open');
console.log('8. Route "/" expects: / or /?query');
console.log('9. Express route matching: "?status=open" does NOT match "/"');
console.log('10. Result: 404 Not Found');

console.log('\n❌ THE ROOT CAUSE:');
console.log('When app.use("/api/jobs", router) strips the prefix,');
console.log('it leaves "?status=open" with NO LEADING SLASH!');
console.log('Express routes require a leading slash!');

console.log('\n✅ THE SOLUTION:');
console.log('Option 1: pathRewrite should return "/?status=open" (WITH leading slash)');
console.log('   - Strips /api/jobs prefix entirely');
console.log('   - Leaves just the path relative to the router');
console.log('');
console.log('Option 2: Job-service should NOT mount at /api/jobs');
console.log('   - Mount at "/" and let it receive /api/jobs?query directly');
console.log('   - Routes would be router.get("/api/jobs", ...)');
console.log('');
console.log('Option 3: Use req.path instead of req.url in route matching');
console.log('   - req.path strips query string: /api/jobs/?query → /api/jobs/');
console.log('   - But this requires changing Express routing behavior');

console.log('\n🎯 RECOMMENDED FIX:');
console.log('Change pathRewrite to REMOVE /api/jobs prefix:');
console.log('');
console.log('pathRewrite: (path) => {');
console.log('  // Strip /api/jobs prefix since job-service will mount at /api/jobs');
console.log('  let normalized = path.replace(/\\/\\/+/g, "/");');
console.log('  normalized = normalized.replace(/\\/\\?/g, "?");');
console.log('  // Remove /api/jobs prefix');
console.log('  normalized = normalized.replace(/^\\/api\\/jobs/, "");');
console.log('  // Ensure leading slash');
console.log('  if (!normalized.startsWith("/") && !normalized.startsWith("?")) {');
console.log('    normalized = "/" + normalized;');
console.log('  }');
console.log('  return normalized;');
console.log('}');
console.log('');
console.log('Result:');
console.log('/api/jobs/?status=open → /?status=open');
console.log('/api/jobs/123 → /123');
console.log('/api/jobs → /');

console.log('\n' + '='.repeat(80));
