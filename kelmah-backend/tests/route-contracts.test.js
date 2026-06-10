/**
 * Route Contract Smoke Tests
 *
 * Validates that every service route file:
 *   1. Mounts specific literal routes BEFORE parameterised :id routes (no shadowing)
 *   2. Protected endpoints attach verifyGatewayRequest or authorizeRoles middleware
 *   3. Exports a valid Express Router
 *
 * Run with:  node tests/route-contracts.test.js
 * Exit code: 0 = all pass, 1 = failures found
 */

const fs = require('fs');
const path = require('path');

// ── Colour helpers ────────────────────────────────────────────────────────────
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let totalChecks = 0;
let failures = 0;

function pass(msg) {
  totalChecks++;
  console.log(`  ${GREEN}✓${RESET} ${msg}`);
}

function fail(msg) {
  totalChecks++;
  failures++;
  console.log(`  ${RED}✗${RESET} ${msg}`);
}

function warn(msg) {
  console.log(`  ${YELLOW}⚠${RESET} ${msg}`);
}

// ── Static route file analysis ────────────────────────────────────────────────

/**
 * Parse a route file and extract route definitions in order.
 * Returns an array of { line, method, path, hasAuth, raw }
 */
function extractRoutes(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const lines = src.split('\n');

  const routes = [];
  let routerUseAuth = false; // tracks if router.use(verifyGatewayRequest) has appeared

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];

    // Detect router.use(verifyGatewayRequest) — all routes after this are implicitly protected
    if (/router\.use\s*\(\s*verifyGatewayRequest/.test(raw)) {
      routerUseAuth = true;
      continue;
    }

    // Match router.get/post/put/patch/delete("path", ...)
    const m = raw.match(
      /router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/,
    );
    if (!m) continue;

    const [, method, routePath] = m;

    const hasExplicitAuth =
      /verifyGatewayRequest|authorizeRoles|optionalGatewayVerification/.test(raw);

    routes.push({
      line: i + 1,
      method: method.toUpperCase(),
      path: routePath,
      hasAuth: routerUseAuth || hasExplicitAuth,
      raw: raw.trim(),
    });
  }

  return routes;
}

/**
 * Check that no parameterised route (e.g. /:id) appears before a specific literal
 * route at the same nesting depth, which would shadow it.
 *
 * Regex-constrained params like /:id([a-fA-F0-9]{24}) are EXCLUDED because
 * Express will only match them on strings that satisfy the regex, so they
 * cannot shadow literal routes like /my-jobs.
 */
function checkRouteShadowing(serviceName, filePath, routes) {
  const paramRoutesSeen = new Map();
  let localFailures = 0;

  for (const route of routes) {
    const segments = route.path.split('/').filter(Boolean);

    // A route is parameterised at top level if its first segment starts with ':'
    const isTopParam = segments.length >= 1 && segments[0].startsWith(':');
    const isParamOnly = segments.length === 1 && segments[0].startsWith(':');

    // Skip regex-constrained params — they don't shadow literals
    const hasRegexConstraint = /:\w+\(/.test(route.path);
    if (hasRegexConstraint) continue;

    const baseKey = `${route.method}`;

    if (isTopParam || isParamOnly) {
      if (!paramRoutesSeen.has(baseKey)) {
        paramRoutesSeen.set(baseKey, route);
      }
    } else {
      // This is a literal route — check if a param route already appeared above it
      const earlier = paramRoutesSeen.get(baseKey);
      if (earlier) {
        localFailures++;
        fail(
          `[${serviceName}] Route shadowing: ${route.method} ${route.path} (line ${route.line}) ` +
            `may be shadowed by earlier param route ${earlier.method} ${earlier.path} (line ${earlier.line}) — ` +
            `move literal routes above parameterised ones`,
        );
      }
    }
  }

  if (localFailures === 0) {
    pass(`[${serviceName}] No route shadowing detected in ${path.basename(filePath)}`);
  }
}

/**
 * Verify that mutation endpoints (POST, PUT, PATCH, DELETE) have auth middleware.
 * Public GETs are allowed, but mutations without auth are flagged.
 *
 * Known exceptions:
 *  - Webhook/callback/stripe/paystack endpoints use signature verification instead
 *  - Health/validate endpoints are intentionally public
 *  - Files whose parent server.js applies auth at mount level (messaging-service)
 *    are flagged as warnings, not failures
 */

// Services whose server.js applies verifyGatewayRequest at router mount level —
// route files won't show inline auth, but they ARE protected at runtime.
const MOUNT_LEVEL_AUTH_SERVICES = new Set(['messaging-service']);

function checkAuthOnMutations(serviceName, filePath, routes) {
  const unprotected = routes.filter(
    (r) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(r.method) && !r.hasAuth,
  );

  if (unprotected.length === 0) {
    pass(`[${serviceName}] All mutation routes in ${path.basename(filePath)} have auth middleware`);
  } else {
    for (const r of unprotected) {
      // Allow webhook routes, health checks, and payment signature endpoints
      if (/webhook|health|callback|validate|stripe|paystack|reactivate/i.test(r.path)) {
        warn(`[${serviceName}] ${r.method} ${r.path} (line ${r.line}) has no auth — allowed (webhook/public)`);
        continue;
      }
      // If service applies auth at mount level, downgrade to warning
      if (MOUNT_LEVEL_AUTH_SERVICES.has(serviceName)) {
        warn(`[${serviceName}] ${r.method} ${r.path} (line ${r.line}) has no route-level auth — mount-level auth expected`);
        continue;
      }
      fail(
        `[${serviceName}] ${r.method} ${r.path} (line ${r.line}) has no auth middleware — ` +
          `add verifyGatewayRequest or authorizeRoles`,
      );
    }
  }
}

/**
 * Validate that the file exports a valid Router (or at least exports something).
 */
function checkExport(serviceName, filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  if (/module\.exports\s*=/.test(src)) {
    pass(`[${serviceName}] ${path.basename(filePath)} exports module`);
  } else {
    fail(`[${serviceName}] ${path.basename(filePath)} does NOT export module`);
  }
}

// ── Discover route files ──────────────────────────────────────────────────────

const servicesDir = path.resolve(__dirname, '..', 'services');
const routeFiles = [];

const serviceNames = fs.readdirSync(servicesDir).filter((d) => {
  const full = path.join(servicesDir, d);
  return fs.statSync(full).isDirectory() && !d.startsWith('.');
});

for (const svc of serviceNames) {
  const routesDir = path.join(servicesDir, svc, 'routes');
  if (!fs.existsSync(routesDir)) continue;

  const files = fs.readdirSync(routesDir).filter((f) => f.endsWith('.routes.js'));
  for (const f of files) {
    routeFiles.push({ service: svc, file: path.join(routesDir, f) });
  }
}

// ── Run checks ────────────────────────────────────────────────────────────────

console.log('\n━━━ Route Contract Smoke Tests ━━━\n');
console.log(`Found ${routeFiles.length} route files across ${serviceNames.length} services\n`);

for (const { service, file } of routeFiles) {
  console.log(`\n📂 ${service} / ${path.basename(file)}`);
  try {
    const routes = extractRoutes(file);
    if (routes.length === 0) {
      warn(`No routes parsed from ${path.basename(file)} (may use non-standard pattern)`);
      continue;
    }

    checkExport(service, file);
    checkRouteShadowing(service, file, routes);
    checkAuthOnMutations(service, file, routes);
  } catch (err) {
    fail(`[${service}] Error analysing ${path.basename(file)}: ${err.message}`);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (failures === 0) {
  console.log(`\n${GREEN}All ${totalChecks} checks passed ✓${RESET}\n`);
} else {
  console.log(`\n${RED}${failures} of ${totalChecks} checks failed ✗${RESET}\n`);
}

process.exit(failures > 0 ? 1 : 0);
