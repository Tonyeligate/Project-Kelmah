import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_VIEWPORTS = [
  { key: '320', width: 320, height: 900, mobile: true },
  { key: '768', width: 768, height: 1024, mobile: true },
  { key: '1024', width: 1024, height: 960, mobile: false },
  { key: '1440', width: 1440, height: 1024, mobile: false },
];

const DEFAULT_MOCK_HIRER_USER = {
  _id: 'ui-audit-hirer-1',
  id: 'ui-audit-hirer-1',
  firstName: 'Gifty',
  lastName: 'Afisa',
  email: 'giftyafisa@gmail.com',
  role: 'hirer',
  isEmailVerified: true,
};

const DEFAULT_MOCK_WORKER_USER = {
  _id: 'ui-audit-worker-1',
  id: 'ui-audit-worker-1',
  firstName: 'Kwame',
  lastName: 'Mensah',
  email: 'worker@kelmah.test',
  role: 'worker',
  isEmailVerified: true,
};

const DEFAULT_MOCK_ADMIN_USER = {
  _id: 'ui-audit-admin-1',
  id: 'ui-audit-admin-1',
  firstName: 'Kelmah',
  lastName: 'Admin',
  email: 'admin@kelmah.test',
  role: 'admin',
  isEmailVerified: true,
};

const resolveMockUser = (role) => {
  const normalizedRole = String(role || 'hirer').toLowerCase().trim();

  if (normalizedRole === 'worker') {
    return DEFAULT_MOCK_WORKER_USER;
  }

  if (normalizedRole === 'admin') {
    return DEFAULT_MOCK_ADMIN_USER;
  }

  return DEFAULT_MOCK_HIRER_USER;
};

const MODES = new Set(['capture', 'baseline', 'compare']);
const CONSOLE_IGNORE_PATTERNS = [
  /^Warning:/i,
  /Failed to load resource: the server responded with a status of 500/i,
  /Failed to load resource: net::ERR_CONNECTION_RESET/i,
  /Failed to load resource: net::ERR_SOCKET_NOT_CONNECTED/i,
  /WebSocket connection to 'ws:\/\/.*\/socket\.io\/.*' failed: Connection closed before receiving a handshake response/i,
  /WebSocket connection error: TransportError: websocket error/i,
  /WebSocket connection error \(attempt \d+\): TransportError: websocket error/i,
];
const OFFSCREEN_TAG_IGNORE = new Set([
  'path',
  'g',
  'ellipse',
  'defs',
  'clippath',
  'stop',
  'line',
  'polyline',
  'polygon',
  'use',
]);
const MAX_FAILED_REQUESTS_PER_VIEWPORT = 20;
const RENDERABLE_UI_TIMEOUT_MS = 5000;
const EMPTY_UI_RETRY_EXTRA_WAIT_MS = 800;
const UI_SETTLE_TIMEOUT_MS = 3200;
const UI_SETTLE_POLL_MS = 120;
const UI_SETTLE_RETRY_WAIT_MS = 450;
const MOCK_JWT_EXPIRY_SECONDS = 8 * 60 * 60;

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

const base64UrlEncodeJson = (value) =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

const buildMockJwt = (
  mockUser,
  expiresInSeconds = MOCK_JWT_EXPIRY_SECONDS,
) => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const userId = mockUser?._id || mockUser?.id || 'ui-audit-user';

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const payload = {
    sub: userId,
    id: userId,
    email: mockUser?.email || 'ui-audit@kelmah.test',
    role: mockUser?.role || 'hirer',
    iat: issuedAt,
    exp: issuedAt + expiresInSeconds,
  };

  return `${base64UrlEncodeJson(header)}.${base64UrlEncodeJson(payload)}.ui-audit-signature`;
};

const isLikelyProtectedRoute = (route = '/') => {
  const normalizedRoute = String(route || '/');
  const protectedPrefixes = [
    '/dashboard',
    '/worker',
    '/hirer',
    '/messages',
    '/chat',
    '/notifications',
    '/settings',
    '/contracts',
    '/payments',
    '/payment',
    '/wallet',
    '/schedule',
    '/reviews',
    '/admin',
  ];

  return protectedPrefixes.some(
    (prefix) =>
      normalizedRoute === prefix || normalizedRoute.startsWith(`${prefix}/`)
  );
};

const isPublicRouteCapture = (route = '/') => !isLikelyProtectedRoute(route);

const navigateWithFallback = async (page, url) => {
  try {
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    return;
  } catch (primaryNavigationError) {
    const primaryMessage =
      primaryNavigationError?.message || String(primaryNavigationError);
    const shouldFallbackToDomReady =
      /waiting until "networkidle"/i.test(primaryMessage) ||
      /Timeout\s*\d+ms exceeded/i.test(primaryMessage);

    if (!shouldFallbackToDomReady) {
      throw primaryNavigationError;
    }
  }

  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
};

const waitForRenderableUi = async (
  page,
  timeoutMs = RENDERABLE_UI_TIMEOUT_MS,
) => {
  try {
    await page.waitForFunction(
      () => {
        const isVisible = (el) => {
          if (!el) return false;
          const style = window.getComputedStyle(el);
          if (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            style.opacity === '0'
          ) {
            return false;
          }

          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        };

        const auditRoot =
          document.querySelector('[data-ui-audit-root]') || document.body;
        if (!auditRoot) {
          return false;
        }

        const hasVisibleHeading = Array.from(
          auditRoot.querySelectorAll('h1, h2, h3'),
        ).some((el) => isVisible(el));
        if (hasVisibleHeading) {
          return true;
        }

        const hasVisibleInteractive = Array.from(
          auditRoot.querySelectorAll(
            'a, button, input, select, textarea, [role="button"]',
          ),
        ).some((el) => isVisible(el));
        if (hasVisibleInteractive) {
          return true;
        }

        const text = (auditRoot.textContent || '').replace(/\s+/g, ' ').trim();
        return text.length >= 60;
      },
      { timeout: timeoutMs },
    );

    return true;
  } catch (_) {
    return false;
  }
};

const waitForUiToSettle = async (
  page,
  {
    timeoutMs = UI_SETTLE_TIMEOUT_MS,
    pollingMs = UI_SETTLE_POLL_MS,
  } = {},
) => {
  try {
    await page.waitForFunction(
      () => {
        const root =
          document.querySelector('[data-ui-audit-root]') || document.body;
        if (!root) {
          return false;
        }

        const hasSkeleton =
          root.querySelector(
            '.MuiSkeleton-root,[data-testid*="skeleton"],[data-skeleton="true"]',
          ) !== null;
        const hasBusyState =
          root.querySelector('[aria-busy="true"]') !== null;
        const hasLoadingLiveStatus = Array.from(
          root.querySelectorAll('[role="status"], [aria-live]'),
        ).some((node) =>
          /\b(searching|loading)\b/i.test(node?.textContent || ''),
        );

        return !hasSkeleton && !hasBusyState && !hasLoadingLiveStatus;
      },
      { timeout: timeoutMs, polling: pollingMs },
    );

    return true;
  } catch (_) {
    return false;
  }
};

const waitForFontAndLayoutStability = async (
  page,
  timeoutMs = UI_SETTLE_TIMEOUT_MS,
) => {
  try {
    await page.evaluate(async (maxWaitMs) => {
      if (document?.fonts?.ready) {
        await Promise.race([
          document.fonts.ready.catch(() => undefined),
          new Promise((resolve) => {
            window.setTimeout(resolve, maxWaitMs);
          }),
        ]);
      }

      await new Promise((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => resolve()),
        ),
      );
    }, timeoutMs);
  } catch (_) {
    // Best-effort stabilization only.
  }
};

const buildMockWorkerDirectoryPayload = (requestUrl) => {
  let page = 1;
  let limit = 12;

  try {
    const parsed = new URL(requestUrl);
    page = Number(parsed.searchParams.get('page')) || 1;
    limit = Number(parsed.searchParams.get('limit')) || 12;
  } catch (_) {
    // Keep defaults if URL parsing fails.
  }

  return {
    success: true,
    data: {
      workers: [],
      results: [],
      items: [],
      pagination: {
        currentPage: page,
        page,
        totalPages: 1,
        totalItems: 0,
        totalWorkers: 0,
        total: 0,
        limit,
      },
      fallback: false,
    },
  };
};

const buildMockPublicJobsListPayload = (requestUrl) => {
  let page = 1;
  let limit = 12;

  try {
    const parsed = new URL(requestUrl);
    page = Number(parsed.searchParams.get('page')) || 1;
    limit = Number(parsed.searchParams.get('limit')) || 12;
  } catch (_) {
    // Keep defaults if URL parsing fails.
  }

  return {
    success: true,
    data: [],
    pagination: {
      currentPage: page,
      totalPages: 1,
      totalItems: 0,
      limit,
    },
  };
};

const buildMockUserCredentialsPayload = (mockUser) => ({
  success: true,
  data: {
    _id: mockUser?._id || mockUser?.id || 'ui-audit-user',
    id: mockUser?.id || mockUser?._id || 'ui-audit-user',
    firstName: mockUser?.firstName || 'Kelmah',
    lastName: mockUser?.lastName || 'User',
    email: mockUser?.email || 'ui-audit@kelmah.test',
    role: mockUser?.role || 'hirer',
    isEmailVerified: true,
    skills: [],
    licenses: [],
    certifications: [],
  },
});

const buildMockWorkerAvailabilityPayload = () => ({
  success: true,
  data: {
    status: 'available',
    isAvailable: true,
    timezone: 'Africa/Accra',
    daySlots: [],
    schedule: [],
    nextAvailable: null,
    message: null,
    pausedUntil: null,
    lastUpdated: new Date().toISOString(),
  },
});

const buildMockWorkerCompletenessPayload = () => ({
  success: true,
  data: {
    completionPercentage: 82,
    percentage: 82,
    requiredCompletion: 84,
    optionalCompletion: 76,
    missingRequired: [],
    missingOptional: [],
    recommendations: [],
    source: {
      worker: true,
      workerProfile: true,
    },
  },
});

const buildMockMyJobsPayload = (requestUrl) => {
  let page = 1;
  let limit = 10;
  let statusFilter = null;

  try {
    const parsed = new URL(requestUrl);
    page = Number(parsed.searchParams.get('page')) || 1;
    limit = Number(parsed.searchParams.get('limit')) || 10;
    const rawStatus = String(parsed.searchParams.get('status') || '').trim();
    statusFilter = rawStatus || null;
  } catch (_) {
    // Keep defaults when parsing fails.
  }

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const allItems = [
    {
      _id: 'ui-audit-job-open-1',
      id: 'ui-audit-job-open-1',
      title: 'Electrical rewiring for 2-bedroom home',
      status: 'open',
      visibility: 'public',
      location: 'Accra',
      budget: 1500,
      paymentType: 'fixed',
      proposalCount: 3,
      createdAt: new Date(now.getTime() - dayMs * 2).toISOString(),
      endDate: new Date(now.getTime() + dayMs * 5).toISOString(),
      responseMode: 'applications',
    },
    {
      _id: 'ui-audit-job-draft-1',
      id: 'ui-audit-job-draft-1',
      title: 'Kitchen cabinet repair and refinishing',
      status: 'draft',
      visibility: 'private',
      location: 'Kumasi',
      budget: 900,
      paymentType: 'fixed',
      proposalCount: 0,
      createdAt: new Date(now.getTime() - dayMs * 1).toISOString(),
      endDate: null,
      responseMode: 'applications',
    },
  ];

  const filteredItems = statusFilter
    ? allItems.filter(
        (item) =>
          String(item.status || '').toLowerCase() ===
          String(statusFilter).toLowerCase(),
      )
    : allItems;

  const start = Math.max(0, (page - 1) * limit);
  const end = start + limit;
  const pagedItems = filteredItems.slice(start, end);
  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / Math.max(limit, 1)));

  const countsByStatus = allItems.reduce(
    (acc, item) => {
      const key = String(item.status || '').toLowerCase();
      if (Object.prototype.hasOwnProperty.call(acc, key)) {
        acc[key] += 1;
      }
      return acc;
    },
    {
      open: 0,
      'in-progress': 0,
      completed: 0,
      cancelled: 0,
      draft: 0,
    },
  );

  return {
    success: true,
    data: {
      items: pagedItems,
      pagination: {
        page,
        currentPage: page,
        limit,
        total,
        totalPages,
      },
    },
    meta: {
      pagination: {
        page,
        currentPage: page,
        limit,
        total,
        totalPages,
      },
      countsByStatus,
    },
  };
};

const evaluateUiChecks = async (page, mobile) =>
  page.evaluate(({ mobileView, offscreenTagIgnore }) => {
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
      // LinearProgress bars intentionally animate off-canvas while loading.
      if (el.classList?.contains('MuiLinearProgress-bar')) return true;
      if (el.closest('.MuiLinearProgress-bar')) return true;
      return false;
    };

    const normalizeText = (value) =>
      String(value || '').replace(/\s+/g, ' ').trim();

    const summarizeElement = (el) => {
      const rect = el.getBoundingClientRect();
      const className =
        typeof el.className === 'string'
          ? el.className
          : (el.className && typeof el.className.baseVal === 'string'
            ? el.className.baseVal
            : '');

      return {
        tag: (el.tagName || '').toLowerCase(),
        role: el.getAttribute('role') || '',
        type: el.getAttribute('type') || '',
        ariaLabel: normalizeText(el.getAttribute('aria-label')).slice(0, 120),
        className: normalizeText(className).slice(0, 200),
        text: normalizeText(el.textContent).slice(0, 120),
        width: Number(rect.width.toFixed(1)),
        height: Number(rect.height.toFixed(1)),
        left: Number(rect.left.toFixed(1)),
        right: Number(rect.right.toFixed(1)),
      };
    };

    const interactive = Array.from(
      auditRoot.querySelectorAll('a, button, input, select, textarea, [role="button"]')
    ).filter((el) => isVisible(el) && !isAuditNoiseElement(el));

    let smallTapTargets = 0;
    const smallTapTargetSamples = [];
    for (const el of interactive) {
      const rect = el.getBoundingClientRect();
      if (mobileView && (rect.width < 44 || rect.height < 44)) {
        smallTapTargets += 1;
        if (smallTapTargetSamples.length < 25) {
          smallTapTargetSamples.push(summarizeElement(el));
        }
      }
    }

    const allNodes = Array.from(auditRoot.querySelectorAll('*'));
    let offscreenElements = 0;
    const offscreenSamples = [];
    let sampled = 0;

    for (const el of allNodes) {
      if (sampled >= 3500) break;
      sampled += 1;
      if (!isVisible(el)) continue;
      if (isAuditNoiseElement(el)) continue;

      const tag = (el.tagName || '').toLowerCase();
      if (offscreenTagIgnore.includes(tag)) continue;

      const rect = el.getBoundingClientRect();
      if (rect.left <= -5000) continue;

      if (rect.right > window.innerWidth + 8 || rect.left < -8) {
        offscreenElements += 1;
        if (offscreenSamples.length < 25) {
          offscreenSamples.push(summarizeElement(el));
        }
      }
    }

    const headingElements = Array.from(auditRoot.querySelectorAll('h1, h2, h3')).filter((el) => isVisible(el));
    const headingFontSizes = new Set(
      headingElements.map((el) => Number.parseFloat(window.getComputedStyle(el).fontSize || '0')).filter(Boolean)
    );

    const textCandidates = Array.from(auditRoot.querySelectorAll('p, span, li, label, a, button, small, div')).filter((el) => {
      if (!isVisible(el)) return false;
      if (isAuditNoiseElement(el)) return false;
      return (el.textContent || '').trim().length >= 2;
    });

    let textTooSmallCount = 0;
    const textTooSmallSamples = [];
    const minSize = mobileView ? 12 : 12;
    for (const el of textCandidates.slice(0, 3000)) {
      const size = Number.parseFloat(window.getComputedStyle(el).fontSize || '0');
      if (size > 0 && size < minSize) {
        textTooSmallCount += 1;
        if (textTooSmallSamples.length < 40) {
          textTooSmallSamples.push({
            ...summarizeElement(el),
            fontSize: Number(size.toFixed(2)),
          });
        }
      }
    }

    return {
      hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      offscreenElements,
      headingCount: headingElements.length,
      uniqueHeadingFontSizes: headingFontSizes.size,
      interactiveCount: interactive.length,
      smallTapTargets,
      smallTapTargetSamples,
      textTooSmallCount,
      textTooSmallSamples,
      offscreenSamples,
      bodyScrollHeight: document.documentElement.scrollHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  }, { mobileView: mobile, offscreenTagIgnore: Array.from(OFFSCREEN_TAG_IGNORE) });

const buildMockApplicationsSummaryPayload = () => {
  const now = new Date().toISOString();
  const mockJob = {
    _id: 'ui-audit-job-1',
    id: 'ui-audit-job-1',
    title: 'Kitchen sink and tap replacement',
    status: 'open',
    applicationCounts: {
      pending: 1,
      accepted: 0,
      rejected: 0,
      under_review: 0,
      withdrawn: 0,
      total: 1,
    },
  };

  const mockApplication = {
    _id: 'ui-audit-application-1',
    id: 'ui-audit-application-1',
    jobId: 'ui-audit-job-1',
    jobTitle: 'Kitchen sink and tap replacement',
    workerId: 'ui-audit-worker-1',
    workerName: 'Kwame Mensah Plumbing Services',
    workerAvatar: '',
    workerRating: 4.6,
    coverLetter:
      'I can complete this repair quickly and provide all required tools and fittings. I am available immediately.',
    proposedRate: 350,
    estimatedDuration: '2 days',
    status: 'pending',
    createdAt: now,
  };

  return {
    success: true,
    data: {
      jobs: [mockJob],
      applications: [mockApplication],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 1,
        limit: 10,
      },
      summary: {
        totalJobs: 1,
        totalApplications: 1,
        countsByStatus: {
          pending: 1,
          accepted: 0,
          rejected: 0,
          under_review: 0,
          withdrawn: 0,
          total: 1,
        },
      },
      filters: {
        jobId: null,
        status: 'pending',
        sort: 'newest',
      },
    },
  };
};

const wireMockRoutes = async ({
  page,
  mockAuth,
  mockApplications,
  mockPublicData,
  mockUser,
  routePath,
}) => {
  const normalizedRoutePath =
    String(routePath || '/').split('?')[0] || '/';
  const isPublicRoute = isPublicRouteCapture(normalizedRoutePath);
  const shouldMockPublicStats =
    isPublicRoute &&
    (normalizedRoutePath === '/' ||
      normalizedRoutePath === '/home' ||
      normalizedRoutePath === '/jobs' ||
      mockPublicData);
  const shouldMockHomeJobsList =
    isPublicRoute &&
    (normalizedRoutePath === '/' || normalizedRoutePath === '/home');
  const shouldMockWorkerSearch =
    isPublicRoute &&
    (normalizedRoutePath === '/search' ||
      normalizedRoutePath === '/find-talents' ||
      mockPublicData);
  const shouldMockPublicJobsList =
    isPublicRoute &&
    (shouldMockHomeJobsList || shouldMockWorkerSearch || mockPublicData);

  await page.route('**/api/health/aggregate*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          gateway: { status: 'healthy' },
          services: {},
        },
      }),
    });
  });

  if (shouldMockPublicStats) {
    await page.route('**/api/jobs/stats*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            availableJobs: 124,
            activeEmployers: 32,
            skilledWorkers: 980,
            successRate: 94,
          },
        }),
      });
    });
  }

  if (shouldMockWorkerSearch) {
    const workerSearchPatterns = [
      '**/api/users/workers/search*',
      '**/api/workers/search*',
      '**/api/search/workers*',
      '**/users/workers/search*',
      '**/workers/search*',
      '**/search/workers*',
    ];

    for (const pattern of workerSearchPatterns) {
      await page.route(pattern, async (routeRequest) => {
        await routeRequest.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            buildMockWorkerDirectoryPayload(routeRequest.request().url()),
          ),
        });
      });
    }
  }

  if (shouldMockPublicJobsList) {
    await page.route(/\/api\/jobs(?:\?.*)?$/i, async (routeRequest) => {
      await routeRequest.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          buildMockPublicJobsListPayload(routeRequest.request().url()),
        ),
      });
    });
  }

  if (mockAuth) {
    const accessToken = buildMockJwt(mockUser);
    const refreshToken = buildMockJwt(
      {
        ...mockUser,
        role: `${mockUser?.role || 'hirer'}-refresh`,
      },
      14 * 24 * 60 * 60,
    );

    const authSuccessPayload = {
      success: true,
      data: {
        token: accessToken,
        refreshToken,
        user: mockUser,
      },
    };

    await page.route('**/auth/login*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(authSuccessPayload),
      });
    });

    await page.route('**/auth/verify*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            token: accessToken,
            user: mockUser,
          },
        }),
      });
    });

    await page.route('**/auth/refresh-token*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(authSuccessPayload),
      });
    });

    await page.route('**/auth/logout*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.route('**/users/me/credentials*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildMockUserCredentialsPayload(mockUser)),
      });
    });

    await page.route(/\/users\/profile\/activity(?:\?.*)?$/i, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [],
          },
        }),
      });
    });

    await page.route(/\/users\/profile(?:\?.*)?$/i, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildMockUserCredentialsPayload(mockUser)),
      });
    });

    await page.route('**/users/dashboard/analytics*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            jobsPosted: 2,
            activeJobs: 1,
            totalApplications: 1,
            responseRate: 100,
          },
        }),
      });
    });

    await page.route('**/users/workers/*/availability*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildMockWorkerAvailabilityPayload()),
      });
    });

    await page.route('**/users/workers/*/completeness*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildMockWorkerCompletenessPayload()),
      });
    });

    await page.route('**/jobs/saved*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            jobs: [],
            pagination: {
              page: 1,
              limit: 20,
              total: 0,
              totalPages: 1,
            },
          },
        }),
      });
    });

    await page.route('**/jobs/my-jobs*', async (routeRequest) => {
      await routeRequest.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          buildMockMyJobsPayload(routeRequest.request().url()),
        ),
      });
    });

    // Worker find-work and related protected views may request /api/jobs directly.
    await page.route(/\/api\/jobs(?:\?.*)?$/i, async (routeRequest) => {
      await routeRequest.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          buildMockPublicJobsListPayload(routeRequest.request().url()),
        ),
      });
    });

    await page.route('**/payments/wallet*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accounts: [
              {
                type: 'escrow',
                balance: 0,
              },
            ],
          },
        }),
      });
    });

    await page.route('**/payments/escrows*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/payments/transactions/history*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
        }),
      });
    });
  }

  if (mockApplications) {
    const summaryPayload = buildMockApplicationsSummaryPayload();
    await page.route('**/jobs/applications/received-summary*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(summaryPayload),
      });
    });

    await page.route('**/jobs/applications/summary/received*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(summaryPayload),
      });
    });

    await page.route('**/jobs/proposals*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(summaryPayload),
      });
    });
  }

  if (mockAuth || mockApplications) {
    await page.route('**/api/messages/conversations*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.route('**/api/notifications*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            notifications: [],
            unreadCount: 0,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalItems: 0,
              limit: 20,
            },
          },
        }),
      });
    });
  }
};

const performLogin = async ({
  page,
  baseUrl,
  loginPath,
  email,
  password,
  waitMs,
}) => {
  try {
    await page.goto(`${baseUrl}${loginPath}`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
  } catch (loginNavigationError) {
    const loginMessage =
      loginNavigationError?.message || String(loginNavigationError);
    const shouldFallbackToDomReady =
      /waiting until "networkidle"/i.test(loginMessage) ||
      /Timeout\s*\d+ms exceeded/i.test(loginMessage);

    if (!shouldFallbackToDomReady) {
      throw loginNavigationError;
    }

    await page.goto(`${baseUrl}${loginPath}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
  }

  const normalizedLoginPath = String(loginPath || '/login').split('?')[0] || '/login';
  const landingPath = new URL(page.url()).pathname;
  if (landingPath !== normalizedLoginPath) {
    return;
  }

  const emailField = page
    .locator(
      'input[type="email"], input[name="email"], input[autocomplete="email"], input[placeholder*="email" i]'
    )
    .first();
  const passwordField = page
    .locator(
      'input[type="password"], input[name="password"], input[autocomplete="current-password"]'
    )
    .first();
  const submitButton = page
    .locator(
      'button[type="submit"], button:has-text("Sign In"), button:has-text("Login")'
    )
    .first();

  const isLoginRoute = () => new URL(page.url()).pathname === normalizedLoginPath;

  try {
    await emailField.waitFor({ state: 'visible', timeout: 15000 });
  } catch {
    if (!isLoginRoute()) {
      return;
    }
  }

  if (!(await emailField.count())) {
    throw new Error('Login form email field not found');
  }

  if (!(await passwordField.count())) {
    throw new Error('Login form password field not found');
  }

  if (!(await submitButton.count())) {
    throw new Error('Login submit button not found');
  }

  await emailField.fill(email);
  await passwordField.fill(password);

  await Promise.all([
    page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {}),
    submitButton.click(),
  ]);

  await page.waitForTimeout(waitMs);
};

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

    if (result.uiChecks.offscreenElements > 3) {
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

    if (result.uiChecks.textTooSmallCount > 10) {
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
  const normalizedRoutePath = String(route || '/').split('?')[0] || '/';
  const isPublicRoute = isPublicRouteCapture(normalizedRoutePath);
  const baseUrl = String(args['base-url'] || args.baseUrl || process.env.UI_AUDIT_BASE_URL || 'http://127.0.0.1:3000');
  const authEmail = args['auth-email'] || args.authEmail || process.env.UI_AUDIT_AUTH_EMAIL;
  const authPassword = args['auth-password'] || args.authPassword || process.env.UI_AUDIT_AUTH_PASSWORD;
  const mockAuth = asBoolean(args['mock-auth'] || args.mockAuth, false);
  const mockRole = String(args['mock-role'] || args.mockRole || 'hirer');
  const mockApplications = asBoolean(
    args['mock-applications'] || args.mockApplications,
    false
  );
  const mockPublicData = asBoolean(
    args['mock-public-data'] || args.mockPublicData,
    false,
  );
  const loginPath = String(args['login-path'] || args.loginPath || '/login');
  const loginWaitMs = asNumber(args['login-wait-ms'] || args.loginWaitMs, 1200);
  const waitMs = asNumber(args['wait-ms'] || args.waitMs, 1200);
  const threshold = asNumber(args.threshold, 0.015);
  const fullPage = asBoolean(args['full-page'] || args.fullPage, true);
  const strict = asBoolean(args.strict, false);
  const shouldAutologinMockUser =
    mockAuth &&
    isLikelyProtectedRoute(route) &&
    (!authEmail || !authPassword);
  const effectiveAuthEmail =
    authEmail || (shouldAutologinMockUser ? 'ui-audit@kelmah.test' : null);
  const effectiveAuthPassword =
    authPassword || (shouldAutologinMockUser ? 'TestUser123!' : null);

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
  const mockUser = resolveMockUser(mockRole);

  try {
    for (const viewport of DEFAULT_VIEWPORTS) {
      const screenshotPath = path.resolve(taskDir, `${viewport.key}.png`);
      const consoleErrors = [];
      const failedRequests = [];

      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: viewport.mobile,
        hasTouch: viewport.mobile,
        deviceScaleFactor: 1,
        serviceWorkers: 'block',
      });

      const page = await context.newPage();
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          const shouldIgnore = CONSOLE_IGNORE_PATTERNS.some((pattern) => pattern.test(text));
          if (!shouldIgnore) {
            consoleErrors.push(text);
          }
        }
      });

      page.on('response', (response) => {
        const status = response.status();
        if (status < 400) {
          return;
        }

        if (failedRequests.length >= MAX_FAILED_REQUESTS_PER_VIEWPORT) {
          return;
        }

        const failedUrl = response.url();
        if (/\/favicon\.ico(?:\?|$)/i.test(failedUrl)) {
          return;
        }

        failedRequests.push(
          `${status} ${response.request().method()} ${failedUrl}`,
        );
      });

      await wireMockRoutes({
        page,
        mockAuth,
        mockApplications,
        mockPublicData,
        mockUser,
        routePath: route,
      });

      let navigationError = null;
      try {
        if (effectiveAuthEmail && effectiveAuthPassword) {
          await performLogin({
            page,
            baseUrl,
            loginPath,
            email: String(effectiveAuthEmail),
            password: String(effectiveAuthPassword),
            waitMs: loginWaitMs,
          });

          // Keep route-level console diagnostics focused on the audited screen,
          // not transitional login-view noise.
          consoleErrors.length = 0;
          failedRequests.length = 0;
        }

        const targetUrl = `${baseUrl}${route}`;
        await navigateWithFallback(page, targetUrl);

        await page.waitForTimeout(waitMs);

        let hasRenderableUi = await waitForRenderableUi(page);
        const sawTransient404Signal = () => {
          const has404Console = consoleErrors.some((entry) =>
            /404|chunk|dynamically imported module/i.test(entry),
          );
          const has404Request = failedRequests.some((entry) =>
            /(^|\s)404(\s|$)/.test(entry),
          );
          return has404Console || has404Request;
        };

        if (!hasRenderableUi && sawTransient404Signal()) {
          consoleErrors.length = 0;
          failedRequests.length = 0;
          await navigateWithFallback(page, targetUrl);
          await page.waitForTimeout(waitMs + EMPTY_UI_RETRY_EXTRA_WAIT_MS);
          hasRenderableUi = await waitForRenderableUi(page);
        }

        if (!hasRenderableUi) {
          throw new Error('Route rendered no detectable UI content before capture');
        }

        let settledUi = await waitForUiToSettle(page, {
          timeoutMs: waitMs + UI_SETTLE_TIMEOUT_MS,
        });

        if (!settledUi && isPublicRoute) {
          await page.waitForTimeout(UI_SETTLE_RETRY_WAIT_MS);
          settledUi = await waitForUiToSettle(page, {
            timeoutMs: UI_SETTLE_TIMEOUT_MS,
          });
        }

        await waitForFontAndLayoutStability(page, UI_SETTLE_TIMEOUT_MS);

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
        authenticated: Boolean(effectiveAuthEmail && effectiveAuthPassword),
        requestedUrl: `${baseUrl}${route}`,
        finalUrl: page.url(),
        screenshotPath: relativeFromWorkspace(workspaceRoot, screenshotPath),
        navigationError,
        screenshotError,
        consoleErrors,
        failedRequests,
        uiChecks,
      };

      captureResults.push(captureEntry);
      try {
        await context.close();
      } catch (closeError) {
        const closeMessage = closeError?.message || String(closeError);
        const benignCloseError =
          /Failed to find context with id/i.test(closeMessage) ||
          /Target page, context or browser has been closed/i.test(closeMessage);

        if (!benignCloseError) {
          throw closeError;
        }
      }
    }
  } finally {
    try {
      await browser.close();
    } catch (closeError) {
      const closeMessage = closeError?.message || String(closeError);
      const benignCloseError =
        /Target page, context or browser has been closed/i.test(closeMessage) ||
        /Failed to find context with id/i.test(closeMessage);

      if (!benignCloseError) {
        throw closeError;
      }
    }
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
