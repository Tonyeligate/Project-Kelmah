import { chromium } from 'playwright';

const baseUrl =
  process.env.SMOKE_BASE_URL || 'https://kelmah-frontend-cyan.vercel.app';
const email = process.env.SMOKE_EMAIL;
const password = process.env.SMOKE_PASSWORD;

if (!email || !password) {
  throw new Error(
    'SMOKE_EMAIL and SMOKE_PASSWORD are required to run auth refresh smoke test.',
  );
}

const LOGIN_PATH_RE = /\/login(?:[\/?#]|$)/i;
const AUTH_ENDPOINT_RE = /\/api\/auth\/(login|verify|refresh-token)(?:\?|$)/i;
const LOGIN_ENDPOINT_RE = /\/api\/auth\/login(?:\?|$)/i;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await context.newPage();

let phase = 'initial';
const authResponses = [];
const authRequestFailures = [];
let loginResponseSummary = null;

page.on('response', (response) => {
  const url = response.url();
  if (!AUTH_ENDPOINT_RE.test(url)) {
    return;
  }

  authResponses.push({
    phase,
    url,
    method: response.request().method(),
    status: response.status(),
  });
});

page.on('requestfailed', (request) => {
  const url = request.url();
  if (!AUTH_ENDPOINT_RE.test(url)) {
    return;
  }

  authRequestFailures.push({
    phase,
    url,
    method: request.method(),
    failureText: request.failure()?.errorText || 'unknown',
  });
});

const waitForSettledNetwork = async () => {
  await page.waitForLoadState('networkidle', { timeout: 45000 }).catch(() => {});
};

const navigate = async (url) => {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await waitForSettledNetwork();
};

const fillFirstWorkingSelector = async (selectors, value, label) => {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) === 0) {
      continue;
    }

    try {
      await locator.fill(value, { timeout: 10000 });
      return selector;
    } catch {
      // Try next selector.
    }
  }

  throw new Error(`Unable to fill ${label}`);
};

const clickFirstWorkingLocator = async (candidates, label) => {
  for (const candidate of candidates) {
    try {
      if ((await candidate.count()) === 0) {
        continue;
      }
      await candidate.first().click({ timeout: 10000 });
      return true;
    } catch {
      // Try next candidate.
    }
  }

  throw new Error(`Unable to click ${label}`);
};

const urlPath = (urlValue) => {
  try {
    const parsed = new URL(urlValue);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return String(urlValue || '');
  }
};

const isAuthenticatedRoute = (urlValue) => !LOGIN_PATH_RE.test(urlPath(urlValue));

let smokeResult = null;
let failed = false;

try {
  phase = 'open-login';
  await navigate(`${baseUrl}/login`);

  phase = 'fill-login-form';
  await fillFirstWorkingSelector(
    [
      'input[name="email"]',
      'input[type="email"]',
      'input[autocomplete="email"]',
      'input[placeholder*="email" i]',
      'input[id*="email" i]',
    ],
    email,
    'email field',
  );

  await fillFirstWorkingSelector(
    [
      'input[name="password"]',
      'input[type="password"]',
      'input[autocomplete="current-password"]',
      'input[placeholder*="password" i]',
      'input[id*="password" i]',
    ],
    password,
    'password field',
  );

  phase = 'submit-login';
  const loginResponsePromise = page
    .waitForResponse((response) => LOGIN_ENDPOINT_RE.test(response.url()), {
      timeout: 60000,
    })
    .catch(() => null);

  await clickFirstWorkingLocator(
    [
      page.getByRole('button', { name: /sign in|log in|login/i }),
      page.locator('button[type="submit"]'),
      page.locator('button:has-text("Sign In")'),
      page.locator('button:has-text("Log In")'),
      page.locator('button:has-text("Login")'),
    ],
    'login submit button',
  );

  const loginResponse = await loginResponsePromise;
  if (loginResponse) {
    let bodyPreview = null;
    try {
      const text = await loginResponse.text();
      bodyPreview = text.slice(0, 400);
    } catch {
      bodyPreview = null;
    }

    loginResponseSummary = {
      status: loginResponse.status(),
      url: loginResponse.url(),
      bodyPreview,
    };
  }

  phase = 'post-login-settle';
  await page.waitForTimeout(5000);
  await waitForSettledNetwork();

  const loginUrl = page.url();
  const isLoggedInAfterLogin = isAuthenticatedRoute(loginUrl);

  phase = 'hard-refresh';
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(5000);
  await waitForSettledNetwork();

  phase = 'post-refresh';
  await page.waitForTimeout(2500);

  const postRefreshUrl = page.url();
  const isLoggedInAfterRefresh = isAuthenticatedRoute(postRefreshUrl);

  const secureStoragePresence = await page.evaluate(() => ({
    hasLocalSecureData: Boolean(window.localStorage.getItem('kelmah_secure_data')),
    hasSessionSecureData: Boolean(window.sessionStorage.getItem('kelmah_secure_session_data')),
    hasAuthSyncSignal: Boolean(window.localStorage.getItem('kelmah_auth_sync')),
  }));

  const visibleAlerts = await page.evaluate(() => {
    const alertCandidates = [
      ...Array.from(document.querySelectorAll('[role="alert"]')),
      ...Array.from(document.querySelectorAll('.MuiAlert-message')),
    ];

    return alertCandidates
      .map((node) => (node.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 6);
  });

  const refreshPhaseResponses = authResponses.filter((entry) =>
    entry.phase === 'hard-refresh' || entry.phase === 'post-refresh',
  );

  const verify401AfterRefresh = refreshPhaseResponses.some(
    (entry) => /\/api\/auth\/verify(?:\?|$)/i.test(entry.url) && entry.status === 401,
  );

  const refresh401AfterRefresh = refreshPhaseResponses.some(
    (entry) => /\/api\/auth\/refresh-token(?:\?|$)/i.test(entry.url) && entry.status === 401,
  );

  const logoutLoopDetected =
    verify401AfterRefresh &&
    refresh401AfterRefresh &&
    !isLoggedInAfterRefresh;

  smokeResult = {
    baseUrl,
    loginUrl,
    postRefreshUrl,
    isLoggedInAfterLogin,
    isLoggedInAfterRefresh,
    verify401AfterRefresh,
    refresh401AfterRefresh,
    logoutLoopDetected,
    loginResponseSummary,
    visibleAlerts,
    secureStoragePresence,
    authResponses,
    authRequestFailures,
  };

  if (!isLoggedInAfterLogin || !isLoggedInAfterRefresh || logoutLoopDetected) {
    failed = true;
  }
} catch (error) {
  failed = true;
  smokeResult = {
    baseUrl,
    error: error?.message || String(error),
    phase,
    loginResponseSummary,
    authResponses,
    authRequestFailures,
  };
}

console.log(JSON.stringify(smokeResult, null, 2));

await context.close();
await browser.close();

if (failed) {
  process.exit(1);
}
