import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs/promises';

const baseUrl = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:4173';
const widths = [320, 360, 390, 768];
const viewportHeight = 2200;

const routes = [
  { id: 'support', path: '/support' },
  { id: 'support-help-center', path: '/support/help-center' },
  { id: 'help-alias', path: '/help' },
  { id: 'docs', path: '/docs' },
  { id: 'community', path: '/community' },
  { id: 'profile-alias-public', path: '/profile/000000000000000000000000' },
];

const outRoot = path.resolve(process.cwd(), 'qa-artifacts', 'screenshots', 'route-mobile-audit-mar16');
const jsonPath = path.resolve(outRoot, 'evidence.json');

const results = [];

const ensureDir = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const captureRouteScreens = async (browser, width) => {
  const context = await browser.newContext({
    viewport: { width, height: viewportHeight },
    isMobile: width < 900,
    hasTouch: width < 900,
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();
  const widthDir = path.resolve(outRoot, `w${width}`);
  await ensureDir(widthDir);

  for (const route of routes) {
    const url = `${baseUrl}${route.path}`;
    let error = null;

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(1000);
    } catch (err) {
      error = err?.message || String(err);
    }

    const fileName = `${route.id}.png`;
    const shotPath = path.resolve(widthDir, fileName);

    try {
      await page.screenshot({ path: shotPath, fullPage: true });
    } catch (err) {
      error = `${error ? `${error} | ` : ''}Screenshot failed: ${err?.message || err}`;
    }

    const currentUrl = page.url();
    const navCount = await page.locator('nav[aria-label="Main navigation"]').count();

    results.push({
      type: 'route-capture',
      width,
      routeId: route.id,
      requestedPath: route.path,
      finalUrl: currentUrl,
      bottomNavPresent: navCount > 0,
      screenshotPath: path.relative(process.cwd(), shotPath).replace(/\\/g, '/'),
      error,
    });
  }

  // Focused interaction checks at 390 width for support CTA routing contract.
  if (width === 390) {
    await page.goto(`${baseUrl}/support`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(800);

    let contactError = null;
    try {
      await page.getByRole('button', { name: /Contact Support/i }).click();
      await page.waitForTimeout(1200);
    } catch (err) {
      contactError = err?.message || String(err);
    }

    const contactShot = path.resolve(widthDir, 'support-contact-cta.png');
    await page.screenshot({ path: contactShot, fullPage: true });
    results.push({
      type: 'interaction-check',
      width,
      check: 'support-contact-cta',
      finalUrl: page.url(),
      hasQueryTab: page.url().includes('tab='),
      screenshotPath: path.relative(process.cwd(), contactShot).replace(/\\/g, '/'),
      error: contactError,
    });

    await page.goto(`${baseUrl}/support`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(800);

    let docsError = null;
    try {
      await page.getByRole('button', { name: /View Documentation/i }).click();
      await page.waitForTimeout(1200);
    } catch (err) {
      docsError = err?.message || String(err);
    }

    const docsShot = path.resolve(widthDir, 'support-docs-cta.png');
    await page.screenshot({ path: docsShot, fullPage: true });
    results.push({
      type: 'interaction-check',
      width,
      check: 'support-docs-cta',
      finalUrl: page.url(),
      hasQueryCategory: page.url().includes('category='),
      screenshotPath: path.relative(process.cwd(), docsShot).replace(/\\/g, '/'),
      error: docsError,
    });
  }

  await context.close();
};

const run = async () => {
  await ensureDir(outRoot);

  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of widths) {
      await captureRouteScreens(browser, width);
    }
  } finally {
    await browser.close();
  }

  await fs.writeFile(jsonPath, JSON.stringify({ baseUrl, generatedAt: new Date().toISOString(), results }, null, 2));
  console.log(`Saved evidence JSON to ${jsonPath}`);
};

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
