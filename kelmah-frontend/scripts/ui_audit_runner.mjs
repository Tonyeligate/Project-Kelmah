import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_VIEWPORTS = [
  { key: '320', width: 320, height: 900, mobile: true },
  { key: '768', width: 768, height: 1024, mobile: true },
  { key: '1024', width: 1024, height: 960, mobile: false },
  { key: '1440', width: 1440, height: 1024, mobile: false },
];

const MODES = new Set(['capture', 'baseline', 'compare']);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const toPosix = (value) => value.replace(/\\/g, '/');

const toSafeSegment = (value) =>
  String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const parseArgs = (argv) => {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;

    const eq = token.indexOf('=');
    if (eq >= 0) {
      const key = token.slice(2, eq);
      const value = token.slice(eq + 1);
      args[key] = value;
      continue;
    }

    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }

  return args;
};

const asBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  const lowered = String(value).toLowerCase().trim();
  if (['1', 'true', 'yes', 'on'].includes(lowered)) return true;
  if (['0', 'false', 'no', 'off'].includes(lowered)) return false;
  return fallback;
};

const asNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const relativeFromWorkspace = (workspaceRoot, absolutePath) =>
  toPosix(path.relative(workspaceRoot, absolutePath));

const ensureDir = async (targetDir) => {
  await fs.mkdir(targetDir, { recursive: true });
};

const parseModeAndArgs = () => {
  const maybeMode = process.argv[2];
  const mode = MODES.has(maybeMode) ? maybeMode : 'capture';
  const args = parseArgs(process.argv.slice(mode === 'capture' && !MODES.has(maybeMode) ? 2 : 3));

  return { mode, args };
};

const evaluateUiChecks = async (page, mobile) =>
  page.evaluate(({ mobileView }) => {
    const isVisible = (el) => {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };

    const interactive = Array.from(
      document.querySelectorAll('a, button, input, select, textarea, [role="button"], [tabindex]')
    ).filter((el) => isVisible(el));

    let smallTapTargets = 0;
    for (const el of interactive) {
      const rect = el.getBoundingClientRect();
      if (mobileView && (rect.width < 44 || rect.height < 44)) {
        smallTapTargets += 1;
      }
    }

    const allNodes = Array.from(document.body.querySelectorAll('*'));
    let offscreenElements = 0;
    let sampled = 0;

    for (const el of allNodes) {
      if (sampled >= 3500) break;
      sampled += 1;
      if (!isVisible(el)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.right > window.innerWidth + 1 || rect.left < -1) {
        offscreenElements += 1;
      }
    }

    const headingElements = Array.from(document.querySelectorAll('h1, h2, h3')).filter((el) => isVisible(el));
    const headingFontSizes = new Set(
      headingElements.map((el) => Number.parseFloat(window.getComputedStyle(el).fontSize || '0')).filter(Boolean)
    );

    const textCandidates = Array.from(document.querySelectorAll('p, span, li, label, a, button, small, div')).filter((el) => {
      if (!isVisible(el)) return false;
      return (el.textContent || '').trim().length >= 2;
    });

    let textTooSmallCount = 0;
    const minSize = mobileView ? 14 : 12;
    for (const el of textCandidates.slice(0, 3000)) {
      const size = Number.parseFloat(window.getComputedStyle(el).fontSize || '0');
      if (size > 0 && size < minSize) {
        textTooSmallCount += 1;
      }
    }

    return {
      hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      offscreenElements,
      headingCount: headingElements.length,
      uniqueHeadingFontSizes: headingFontSizes.size,
      interactiveCount: interactive.length,
      smallTapTargets,
      textTooSmallCount,
      bodyScrollHeight: document.documentElement.scrollHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  }, { mobileView: mobile });

const compareImages = async ({ browser, baselinePath, currentPath, diffPath, channelTolerance = 24 }) => {
  const [baselineBuffer, currentBuffer] = await Promise.all([
    fs.readFile(baselinePath),
    fs.readFile(currentPath),
  ]);

  const baselineDataUrl = `data:image/png;base64,${baselineBuffer.toString('base64')}`;
  const currentDataUrl = `data:image/png;base64,${currentBuffer.toString('base64')}`;

  const context = await browser.newContext({ viewport: { width: 16, height: 16 } });
  const page = await context.newPage();

  try {
    const comparison = await page.evaluate(
      async ({ baselineSrc, currentSrc, tolerance }) => {
        const loadImage = (src) =>
          new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Unable to decode image source'));
            img.src = src;
          });

        const [baselineImage, currentImage] = await Promise.all([
          loadImage(baselineSrc),
          loadImage(currentSrc),
        ]);

        if (
          baselineImage.width !== currentImage.width ||
          baselineImage.height !== currentImage.height
        ) {
          return {
            ok: false,
            reason: `Dimension mismatch baseline(${baselineImage.width}x${baselineImage.height}) vs current(${currentImage.width}x${currentImage.height})`,
            mismatchRatio: 1,
            diffPixels: baselineImage.width * baselineImage.height,
            totalPixels: baselineImage.width * baselineImage.height,
            diffDataUrl: null,
          };
        }

        const width = baselineImage.width;
        const height = baselineImage.height;
        const totalPixels = width * height;

        const readCanvas = document.createElement('canvas');
        readCanvas.width = width;
        readCanvas.height = height;
        const readCtx = readCanvas.getContext('2d', { willReadFrequently: true });

        readCtx.clearRect(0, 0, width, height);
        readCtx.drawImage(baselineImage, 0, 0);
        const baselineData = readCtx.getImageData(0, 0, width, height).data;

        readCtx.clearRect(0, 0, width, height);
        readCtx.drawImage(currentImage, 0, 0);
        const currentData = readCtx.getImageData(0, 0, width, height).data;

        const diffCanvas = document.createElement('canvas');
        diffCanvas.width = width;
        diffCanvas.height = height;
        const diffCtx = diffCanvas.getContext('2d');
        const diffImageData = diffCtx.createImageData(width, height);

        let diffPixels = 0;
        for (let i = 0; i < baselineData.length; i += 4) {
          const dr = Math.abs(baselineData[i] - currentData[i]);
          const dg = Math.abs(baselineData[i + 1] - currentData[i + 1]);
          const db = Math.abs(baselineData[i + 2] - currentData[i + 2]);
          const da = Math.abs(baselineData[i + 3] - currentData[i + 3]);
          const delta = dr + dg + db + da;

          if (delta > tolerance) {
            diffPixels += 1;
            diffImageData.data[i] = 255;
            diffImageData.data[i + 1] = 0;
            diffImageData.data[i + 2] = 0;
            diffImageData.data[i + 3] = 255;
          } else {
            diffImageData.data[i] = currentData[i];
            diffImageData.data[i + 1] = currentData[i + 1];
            diffImageData.data[i + 2] = currentData[i + 2];
            diffImageData.data[i + 3] = 80;
          }
        }

        diffCtx.putImageData(diffImageData, 0, 0);

        return {
          ok: true,
          reason: null,
          diffPixels,
          totalPixels,
          mismatchRatio: diffPixels / totalPixels,
          diffDataUrl: diffCanvas.toDataURL('image/png'),
        };
      },
      {
        baselineSrc: baselineDataUrl,
        currentSrc: currentDataUrl,
        tolerance: channelTolerance,
      }
    );

    if (comparison.diffDataUrl) {
      const diffBase64 = comparison.diffDataUrl.split(',')[1];
      await fs.writeFile(diffPath, Buffer.from(diffBase64, 'base64'));
    }

    return comparison;
  } finally {
    await context.close();
  }
};

const buildScorecard = ({ captureResults, compareResults, threshold }) => {
  let visualHierarchyScore = 5;
  let spacingScore = 5;
  let positioningScore = 5;
  let interactionScore = 5;
  let densityScore = 5;

  const issues = [];

  const addIssue = ({ breakpoint, type, severity, message, details }) => {
    issues.push({
      id: `ISSUE-${String(issues.length + 1).padStart(3, '0')}`,
      breakpoint,
      type,
      severity,
      message,
      details: details || null,
    });
  };

  for (const result of captureResults) {
    if (result.navigationError) {
      addIssue({
        breakpoint: result.breakpoint,
        type: 'navigation',
        severity: 'critical',
        message: 'Navigation to target route failed',
        details: result.navigationError,
      });
      interactionScore -= 2;
      continue;
    }

    if (result.screenshotError) {
      addIssue({
        breakpoint: result.breakpoint,
        type: 'capture',
        severity: 'critical',
        message: 'Screenshot capture failed',
        details: result.screenshotError,
      });
      interactionScore -= 2;
      continue;
    }

    if (result.uiChecks.hasHorizontalOverflow) {
      addIssue({
        breakpoint: result.breakpoint,
        type: 'overflow',
        severity: 'critical',
        message: 'Horizontal overflow detected',
      });
      spacingScore -= 2;
      positioningScore -= 2;
      densityScore -= 1;
    }

    if (result.uiChecks.offscreenElements > 0) {
      addIssue({
        breakpoint: result.breakpoint,
        type: 'clipping',
        severity: 'high',
        message: `${result.uiChecks.offscreenElements} elements rendered off-screen horizontally`,
      });
      positioningScore -= 1;
    }

    if (result.mobile && result.uiChecks.smallTapTargets > 0) {
      addIssue({
        breakpoint: result.breakpoint,
        type: 'tap-target',
        severity: 'high',
        message: `${result.uiChecks.smallTapTargets} interactive elements are below 44px target size`,
      });
      interactionScore -= 2;
    }

    if (result.uiChecks.textTooSmallCount > 0) {
      addIssue({
        breakpoint: result.breakpoint,
        type: 'typography',
        severity: 'medium',
        message: `${result.uiChecks.textTooSmallCount} text nodes are below recommended minimum size`,
      });
      visualHierarchyScore -= 1;
    }

    if (result.uiChecks.headingCount === 0) {
      addIssue({
        breakpoint: result.breakpoint,
        type: 'hierarchy',
        severity: 'medium',
        message: 'No visible heading elements detected',
      });
      visualHierarchyScore -= 1;
    }

    if (result.consoleErrors.length > 0) {
      addIssue({
        breakpoint: result.breakpoint,
        type: 'console',
        severity: 'medium',
        message: `${result.consoleErrors.length} console errors detected`,
        details: result.consoleErrors.slice(0, 5),
      });
      interactionScore -= 1;
    }
  }

  for (const diff of compareResults) {
    if (diff.reason) {
      addIssue({
        breakpoint: diff.breakpoint,
        type: 'diff-error',
        severity: 'critical',
        message: 'Visual diff could not be computed',
        details: diff.reason,
      });
      visualHierarchyScore -= 1;
      spacingScore -= 1;
      positioningScore -= 1;
      densityScore -= 1;
      continue;
    }

    if (diff.mismatchRatio > threshold) {
      addIssue({
        breakpoint: diff.breakpoint,
        type: 'visual-regression',
        severity: 'high',
        message: `Mismatch ratio ${(diff.mismatchRatio * 100).toFixed(2)}% exceeds threshold ${(threshold * 100).toFixed(2)}%`,
      });
      visualHierarchyScore -= 1;
      spacingScore -= 1;
      positioningScore -= 1;
      densityScore -= 1;
    }
  }

  visualHierarchyScore = clamp(visualHierarchyScore, 0, 5);
  spacingScore = clamp(spacingScore, 0, 5);
  positioningScore = clamp(positioningScore, 0, 5);
  interactionScore = clamp(interactionScore, 0, 5);
  densityScore = clamp(densityScore, 0, 5);

  const totalScore =
    visualHierarchyScore +
    spacingScore +
    positioningScore +
    interactionScore +
    densityScore;

  const minCategoryScore = Math.min(
    visualHierarchyScore,
    spacingScore,
    positioningScore,
    interactionScore,
    densityScore
  );

  const hasCritical = issues.some((issue) => issue.severity === 'critical');
  const pass = totalScore >= 22 && minCategoryScore >= 4 && !hasCritical;

  return {
    scorecard: {
      visualHierarchyScore,
      spacingScore,
      positioningScore,
      interactionScore,
      densityScore,
      totalScore,
      threshold,
      pass,
    },
    issues,
  };
};

const main = async () => {
  const { mode, args } = parseModeAndArgs();

  const rawTaskId = args['task-id'] || args.taskId;
  const rawBaselineId = args['baseline-id'] || args.baselineId;
  const route = String(args.route || '/');
  const baseUrl = String(args['base-url'] || args.baseUrl || process.env.UI_AUDIT_BASE_URL || 'http://127.0.0.1:3000');
  const waitMs = asNumber(args['wait-ms'] || args.waitMs, 1200);
  const threshold = asNumber(args.threshold, 0.015);
  const fullPage = asBoolean(args['full-page'] || args.fullPage, true);
  const strict = asBoolean(args.strict, false);

  if (!rawTaskId) {
    throw new Error('Missing required argument: --task-id <value>');
  }

  if ((mode === 'baseline' || mode === 'compare') && !rawBaselineId) {
    throw new Error(`Mode "${mode}" requires --baseline-id <value>`);
  }

  const taskId = toSafeSegment(rawTaskId);
  const baselineId = rawBaselineId ? toSafeSegment(rawBaselineId) : null;

  if (!taskId) {
    throw new Error('Invalid --task-id. Use letters, numbers, dash, underscore, or dot.');
  }

  const workspaceRoot = path.resolve(process.cwd(), '..');
  const artifactsRoot = path.resolve(workspaceRoot, '.artifacts', 'ui');
  const taskDir = path.resolve(artifactsRoot, taskId);
  const baselineDir = baselineId ? path.resolve(artifactsRoot, 'baselines', baselineId) : null;

  await ensureDir(taskDir);
  if (baselineDir) await ensureDir(baselineDir);

  const captureResults = [];
  const compareResults = [];

  const browser = await chromium.launch({ headless: true });

  try {
    for (const viewport of DEFAULT_VIEWPORTS) {
      const screenshotPath = path.resolve(taskDir, `${viewport.key}.png`);
      const consoleErrors = [];

      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: viewport.mobile,
        hasTouch: viewport.mobile,
        deviceScaleFactor: 1,
      });

      const page = await context.newPage();
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      let navigationError = null;
      try {
        await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(waitMs);
        await page.addStyleTag({
          content:
            '*,:before,:after{animation:none !important;transition:none !important;caret-color:transparent !important;}',
        });
      } catch (err) {
        navigationError = err?.message || String(err);
      }

      let screenshotError = null;
      let uiChecks = {
        hasHorizontalOverflow: false,
        offscreenElements: 0,
        headingCount: 0,
        uniqueHeadingFontSizes: 0,
        interactiveCount: 0,
        smallTapTargets: 0,
        textTooSmallCount: 0,
        bodyScrollHeight: 0,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
      };

      if (!navigationError) {
        try {
          uiChecks = await evaluateUiChecks(page, viewport.mobile);
        } catch (err) {
          screenshotError = `UI check failure: ${err?.message || String(err)}`;
        }
      }

      if (!navigationError && !screenshotError) {
        try {
          await page.screenshot({ path: screenshotPath, fullPage });
        } catch (err) {
          screenshotError = err?.message || String(err);
        }
      }

      const captureEntry = {
        breakpoint: viewport.key,
        width: viewport.width,
        height: viewport.height,
        mobile: viewport.mobile,
        requestedUrl: `${baseUrl}${route}`,
        finalUrl: page.url(),
        screenshotPath: relativeFromWorkspace(workspaceRoot, screenshotPath),
        navigationError,
        screenshotError,
        consoleErrors,
        uiChecks,
      };

      captureResults.push(captureEntry);
      await context.close();
    }
  } finally {
    await browser.close();
  }

  if (mode === 'baseline') {
    for (const viewport of DEFAULT_VIEWPORTS) {
      const source = path.resolve(taskDir, `${viewport.key}.png`);
      const destination = path.resolve(baselineDir, `${viewport.key}.png`);
      await fs.copyFile(source, destination);
    }

    const baselineManifest = {
      baselineId,
      route,
      baseUrl,
      generatedAt: new Date().toISOString(),
      screenshots: DEFAULT_VIEWPORTS.map((viewport) => `${viewport.key}.png`),
    };

    await fs.writeFile(
      path.resolve(baselineDir, 'manifest.json'),
      `${JSON.stringify(baselineManifest, null, 2)}\n`
    );
  }

  if (mode === 'compare') {
    const diffBrowser = await chromium.launch({ headless: true });
    try {
      for (const viewport of DEFAULT_VIEWPORTS) {
        const baselinePath = path.resolve(baselineDir, `${viewport.key}.png`);
        const currentPath = path.resolve(taskDir, `${viewport.key}.png`);
        const diffPath = path.resolve(taskDir, `diff-${viewport.key}.png`);

        let comparison;

        try {
          comparison = await compareImages({
            browser: diffBrowser,
            baselinePath,
            currentPath,
            diffPath,
          });
        } catch (err) {
          comparison = {
            ok: false,
            reason: err?.message || String(err),
            mismatchRatio: 1,
            diffPixels: 0,
            totalPixels: 0,
          };
        }

        compareResults.push({
          breakpoint: viewport.key,
          baselinePath: relativeFromWorkspace(workspaceRoot, baselinePath),
          currentPath: relativeFromWorkspace(workspaceRoot, currentPath),
          diffPath: relativeFromWorkspace(workspaceRoot, diffPath),
          mismatchRatio: comparison.mismatchRatio,
          diffPixels: comparison.diffPixels,
          totalPixels: comparison.totalPixels,
          reason: comparison.reason || null,
        });
      }
    } finally {
      await diffBrowser.close();
    }
  }

  const { scorecard, issues } = buildScorecard({
    captureResults,
    compareResults,
    threshold,
  });

  const hasCaptureFailures = captureResults.some((entry) => entry.navigationError || entry.screenshotError);
  const hasRegressionFailures = compareResults.some(
    (entry) => entry.reason || entry.mismatchRatio > threshold
  );

  const report = {
    mode,
    taskId,
    baselineId,
    route,
    baseUrl,
    threshold,
    strict,
    generatedAt: new Date().toISOString(),
    captureResults,
    compareResults,
    scorecard,
    issuesCount: issues.length,
    failureSummary: {
      hasCaptureFailures,
      hasRegressionFailures,
      strictFailed: strict && !scorecard.pass,
    },
  };

  await fs.writeFile(path.resolve(taskDir, 'capture-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(path.resolve(taskDir, 'scorecard.json'), `${JSON.stringify(scorecard, null, 2)}\n`);
  await fs.writeFile(path.resolve(taskDir, 'issues.json'), `${JSON.stringify(issues, null, 2)}\n`);

  console.log(`UI audit artifacts written to ${relativeFromWorkspace(workspaceRoot, taskDir)}`);
  console.log(`Score: ${scorecard.totalScore}/25 | Pass: ${scorecard.pass ? 'true' : 'false'}`);

  if (mode === 'compare') {
    for (const diff of compareResults) {
      const ratioPct = (diff.mismatchRatio * 100).toFixed(2);
      console.log(`Breakpoint ${diff.breakpoint}: mismatch ${ratioPct}% (threshold ${(threshold * 100).toFixed(2)}%)`);
    }
  }

  if (hasCaptureFailures || hasRegressionFailures || (strict && !scorecard.pass)) {
    process.exitCode = 1;
  }
};

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
