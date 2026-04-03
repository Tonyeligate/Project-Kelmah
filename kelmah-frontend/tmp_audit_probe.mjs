import { chromium } from 'playwright';

const baseUrl = 'http://127.0.0.1:3000';
const targets = [
  { name: 'search-320', route: '/search', width: 320, height: 900, mobile: true },
  { name: 'search-768', route: '/search', width: 768, height: 1024, mobile: true },
];

const browser = await chromium.launch({ headless: true });

for (const target of targets) {
  const context = await browser.newContext({
    viewport: { width: target.width, height: target.height },
    isMobile: target.mobile,
    hasTouch: target.mobile,
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  await page.goto(`${baseUrl}${target.route}`, {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await page.waitForTimeout(1200);
  await page.addStyleTag({
    content:
      '*,:before,:after{animation:none !important;transition:none !important;caret-color:transparent !important;}',
  });

  const result = await page.evaluate(() => {
    const auditRoot = document.querySelector('[data-ui-audit-root]') || document.body;

    const isVisible = (el) => {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
      }
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };

    const isAuditNoiseElement = (el) => {
      if (!el || !(el instanceof Element)) {
        return false;
      }
      const text = (el.textContent || '').trim().toLowerCase();
      const aria = (el.getAttribute('aria-label') || '').trim().toLowerCase();
      if (text === 'skip to main content' || aria.includes('skip to main content')) {
        return true;
      }
      if (aria.includes('tanstack query devtools')) {
        return true;
      }
      if (el.classList?.contains('tsqd-open-btn')) {
        return true;
      }
      if (el.closest('.tsqd-open-btn')) {
        return true;
      }
      return false;
    };

    const interactive = Array.from(
      auditRoot.querySelectorAll('a, button, input, select, textarea, [role="button"], [tabindex]'),
    ).filter((el) => isVisible(el) && !isAuditNoiseElement(el));

    const small = [];
    for (const el of interactive) {
      const rect = el.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        small.push({
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || '').trim().slice(0, 80),
          aria: el.getAttribute('aria-label'),
          role: el.getAttribute('role'),
          className: el.className,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
        });
      }
    }

    return {
      interactiveCount: interactive.length,
      smallTapTargets: small.length,
      small,
    };
  });

  console.log(`### ${target.name}`);
  console.log(JSON.stringify(result, null, 2));
  await context.close();
}

await browser.close();import { chromium } from 'playwright';

const baseUrl = 'http://127.0.0.1:3000';
const targets = [
  { name: 'search-320', route: '/search', width: 320, height: 900, mobile: true },
  { name: 'search-768', route: '/search', width: 768, height: 1024, mobile: true },
];

const browser = await chromium.launch({ headless: true });

for (const target of targets) {
  const context = await browser.newContext({
    viewport: { width: target.width, height: target.height },
    isMobile: target.mobile,
    hasTouch: target.mobile,
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  await page.goto(`${baseUrl}${target.route}`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.addStyleTag({
    content: '*,:before,:after{animation:none !important;transition:none !important;caret-color:transparent !important;}',
  });

  const result = await page.evaluate(() => {
    const auditRoot = document.querySelector('[data-ui-audit-root]') || document.body;

    const isVisible = (el) => {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };

    const isAuditNoiseElement = (el) => {
      if (!el || !(el instanceof Element)) return false;
      const text = (el.textContent || '').trim().toLowerCase();
      const aria = (el.getAttribute('aria-label') || '').trim().toLowerCase();
      if (text === 'skip to main content' || aria.includes('skip to main content')) return true;
      if (aria.includes('tanstack query devtools')) return true;
      if (el.classList?.contains('tsqd-open-btn')) return true;
      if (el.closest('.tsqd-open-btn')) return true;
      return false;
    };

    const interactive = Array.from(
      auditRoot.querySelectorAll('a, button, input, select, textarea, [role="button"], [tabindex]')
    ).filter((el) => isVisible(el) && !isAuditNoiseElement(el));

    const small = [];
    for (const el of interactive) {
      const rect = el.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        small.push({
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || '').trim().slice(0, 80),
          aria: el.getAttribute('aria-label'),
          role: el.getAttribute('role'),
          className: el.className,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
        });
      }
    }

    return {
      interactiveCount: interactive.length,
      smallTapTargets: small.length,
      small,
    };
  });

  console.log(`### ${target.name}`);
  console.log(JSON.stringify(result, null, 2));
  await context.close();
}

await browser.close();
