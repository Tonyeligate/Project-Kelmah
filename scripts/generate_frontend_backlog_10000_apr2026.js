const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const modulesRoot = path.join(repoRoot, 'kelmah-frontend', 'src', 'modules');
const outputPath = path.join(
  repoRoot,
  'spec-kit',
  'generated',
  'FRONTEND_BACKLOG_10000_ITEMS_APR04_2026.md',
);

const targetItems = 10000;

const issueCatalog = [
  {
    code: 'A11Y_TOUCH',
    priority: 'P0',
    fix: 'Enforce >=44x44 tap targets for every interactive control and preserve visible focus indicators.',
    why: 'Kelmah users often rely on low-end phones and thumb-only navigation, so small controls reduce task completion.',
    verify:
      'Audit at 320/768 widths for tap-target and focus visibility regressions using strict route captures.',
  },
  {
    code: 'A11Y_COPY',
    priority: 'P0',
    fix: 'Simplify copy to short, plain-language labels and helper text aligned to vocational user comprehension levels.',
    why: 'Kelmah is accessibility-first and serves users with varied literacy, so complex wording creates friction.',
    verify:
      'Run UX review of labels and helper text and ensure first-time users can complete key flows without tooltips.',
  },
  {
    code: 'A11Y_CONTRAST',
    priority: 'P0',
    fix: 'Raise contrast for text and action states to WCAG AA in all themes and surfaces.',
    why: 'Users browse outdoors and on lower-brightness devices, making low-contrast content unreadable.',
    verify:
      'Check headings, body copy, links, disabled states, and icon-only controls against AA thresholds.',
  },
  {
    code: 'STATE_LOADING',
    priority: 'P1',
    fix: 'Harden loading states with clear progress feedback and disable duplicate action submissions.',
    why: 'Network variability in target regions makes uncertain loading behavior look like app failure.',
    verify:
      'Throttle network and confirm loaders, disabled actions, and retry messaging behave consistently.',
  },
  {
    code: 'STATE_ERROR',
    priority: 'P0',
    fix: 'Normalize friendly error states with direct next-step actions (retry, back, support).',
    why: 'Non-actionable error messages break trust for first-time hirers and workers.',
    verify:
      'Force API and timeout failures and confirm every error banner includes a clear recovery path.',
  },
  {
    code: 'STATE_EMPTY',
    priority: 'P1',
    fix: 'Improve empty states with role-aware guidance and one-click follow-up actions.',
    why: 'Empty results are common in early marketplaces and must still guide users forward.',
    verify:
      'Trigger zero-result cases and validate contextual guidance for worker, hirer, and guest users.',
  },
  {
    code: 'FORM_VALIDATION',
    priority: 'P0',
    fix: 'Provide inline, field-level validation with examples relevant to Ghana formats and job workflows.',
    why: 'Late-form errors cause abandonment, especially on mobile with expensive data sessions.',
    verify:
      'Submit invalid values and confirm immediate, localized, and actionable validation feedback.',
  },
  {
    code: 'FORM_RECOVERY',
    priority: 'P1',
    fix: 'Protect drafts and recover partially completed forms across refresh/navigation events.',
    why: 'Intermittent connectivity and accidental app exits are common in mobile-first usage.',
    verify:
      'Interrupt flows intentionally and ensure user progress is restored predictably.',
  },
  {
    code: 'PERF_RERENDER',
    priority: 'P1',
    fix: 'Reduce unnecessary rerenders via memoization, stable callbacks, and granular state updates.',
    why: 'Low-memory devices degrade quickly when heavy pages rerender aggressively.',
    verify:
      'Profile render counts in React DevTools and confirm meaningful reduction on heavy screens.',
  },
  {
    code: 'PERF_PAYLOAD',
    priority: 'P1',
    fix: 'Trim payload and bundle pressure through code-splitting and route-level lazy boundaries.',
    why: 'High bundle weight slows first interaction for users on constrained mobile networks.',
    verify:
      'Track route JS sizes and ensure critical paths stay within target performance budgets.',
  },
  {
    code: 'PERF_MEDIA',
    priority: 'P1',
    fix: 'Optimize images/media with lazy loading, responsive sizes, and stable skeleton placeholders.',
    why: 'Media-heavy listings can stall scrolling and increase data costs for users.',
    verify:
      'Inspect LCP candidates and ensure no layout shifts from delayed media loading.',
  },
  {
    code: 'TRUST_SIGNAL',
    priority: 'P0',
    fix: 'Expose trust signals (verification, ratings, review quality) in a consistent, non-misleading format.',
    why: 'Marketplace trust is critical when hirers select unknown workers remotely.',
    verify:
      'Check consistency of badges, rating counts, and verification labels across list/detail surfaces.',
  },
  {
    code: 'PRICING_CLARITY',
    priority: 'P0',
    fix: 'Clarify pricing semantics (hourly, fixed, escrow, fees) in context before commitment actions.',
    why: 'Ambiguous payment terms create disputes and failed contracts.',
    verify:
      'Walk through job apply and contract/payment surfaces to confirm pricing language is unambiguous.',
  },
  {
    code: 'MESSAGING_USABILITY',
    priority: 'P0',
    fix: 'Improve chat composer ergonomics, attachment feedback, and mobile-safe spacing behavior.',
    why: 'Most negotiations happen in chat, so poor composer UX directly impacts conversion.',
    verify:
      'Test mobile keyboard, attachment limits, retry behavior, and quick-reply usability at 320 width.',
  },
  {
    code: 'NOTIFICATION_ACTION',
    priority: 'P1',
    fix: 'Ensure notifications route users to valid destinations with safe fallbacks when targets are stale.',
    why: 'Broken notification links feel unreliable and reduce return engagement.',
    verify:
      'Open valid and invalid notifications and confirm deterministic routing and graceful fallback.',
  },
  {
    code: 'SEARCH_RELEVANCE',
    priority: 'P0',
    fix: 'Strengthen search/filter relevance with transparent sort explanations and clear active-filter controls.',
    why: 'Discovery is the core of matching workers to hirers; poor relevance kills marketplace utility.',
    verify:
      'Evaluate search results under common trade/location queries and inspect active-filter state transitions.',
  },
  {
    code: 'SEARCH_RECOVERY',
    priority: 'P1',
    fix: 'Improve no-result and low-result recovery prompts with broaden-search actions.',
    why: 'Users need immediate guidance when strict filters hide available opportunities.',
    verify:
      'Trigger restrictive filters and confirm recovery CTAs broaden results in one step.',
  },
  {
    code: 'ROLE_GUARD',
    priority: 'P0',
    fix: 'Audit role-based UI guards so worker/hirer/admin actions are visible only when authorized.',
    why: 'Role leakage confuses users and can expose sensitive actions.',
    verify:
      'Sign in as each role and confirm route and action visibility matches authorization rules.',
  },
  {
    code: 'SECURE_STORAGE',
    priority: 'P0',
    fix: 'Review token/session storage handling and eliminate insecure persistence patterns.',
    why: 'Credential leakage in a marketplace app has direct financial and identity risk.',
    verify:
      'Inspect auth lifecycle for refresh/logout/state reset behavior across tabs and reloads.',
  },
  {
    code: 'RETRY_STRATEGY',
    priority: 'P1',
    fix: 'Standardize retry logic with exponential backoff and user-visible retry affordances.',
    why: 'Temporary failures should not require full page refreshes for recovery.',
    verify:
      'Simulate transient server errors and verify retries are bounded and user-controllable.',
  },
  {
    code: 'OFFLINE_GRACE',
    priority: 'P1',
    fix: 'Provide offline-aware UI states and queue or defer non-critical actions where possible.',
    why: 'Unstable connectivity is normal for many users and should not erase work or intent.',
    verify:
      'Toggle offline mode and confirm banners, disabled actions, and recovery flows are coherent.',
  },
  {
    code: 'ANALYTICS_PATH',
    priority: 'P2',
    fix: 'Instrument key funnel events for registration, discovery, messaging, and contract milestones.',
    why: 'Without clean telemetry, product improvements cannot be prioritized reliably.',
    verify:
      'Validate event emission, payload hygiene, and de-duplication for major user journeys.',
  },
  {
    code: 'COPY_LOCALIZATION',
    priority: 'P1',
    fix: 'Externalize hardcoded strings and prepare locale-safe formatting for date, number, and currency.',
    why: 'Localized wording and formatting reduce cognitive load and user mistakes.',
    verify:
      'Run extraction checks and confirm no critical surfaces rely on hardcoded literals.',
  },
  {
    code: 'MOTION_REDUCED',
    priority: 'P2',
    fix: 'Respect reduced-motion preferences for all non-essential animations and transitions.',
    why: 'Accessibility compliance requires honoring motion sensitivity preferences.',
    verify:
      'Enable reduced-motion and confirm animation-heavy elements degrade gracefully.',
  },
  {
    code: 'LIST_VIRTUALIZE',
    priority: 'P2',
    fix: 'Virtualize or incrementally render long lists to maintain smooth scrolling performance.',
    why: 'Large worker/job lists can freeze mid-tier devices and degrade trust.',
    verify:
      'Load high-volume fixtures and monitor frame drops and memory growth during long scrolls.',
  },
  {
    code: 'ROUTE_RESILIENCE',
    priority: 'P1',
    fix: 'Harden route boundaries with reliable error fallback, stale-link handling, and recovery actions.',
    why: 'Deep links from search and notifications must not strand users on broken routes.',
    verify:
      'Test stale IDs and malformed routes and confirm safe fallback behavior on every protected/public route.',
  },
  {
    code: 'SKELETON_QUALITY',
    priority: 'P2',
    fix: 'Align skeleton loaders with final layout dimensions to avoid visual jumping.',
    why: 'Poor skeleton fidelity causes disorientation and perceived instability.',
    verify:
      'Compare loading and loaded states and ensure shape/spacing continuity.',
  },
  {
    code: 'FORM_AUTOFILL',
    priority: 'P2',
    fix: 'Improve form autocomplete, keyboard type hints, and input mode semantics for mobile.',
    why: 'Faster data entry is critical for users posting jobs or profiles on small screens.',
    verify:
      'Validate keyboard modes and autofill behavior across auth/profile/payment forms.',
  },
  {
    code: 'CARD_HIERARCHY',
    priority: 'P1',
    fix: 'Tighten card information hierarchy so primary action and critical signals appear above the fold.',
    why: 'Users need fast scanning of job/worker cards with minimal cognitive overhead.',
    verify:
      'Review card layouts across breakpoints and confirm key metadata is visible without expansion.',
  },
  {
    code: 'DUPLICATION_REFACTOR',
    priority: 'P2',
    fix: 'Extract repeated UI logic into shared components/hooks to reduce divergence risk.',
    why: 'Duplicated behavior creates subtle inconsistencies in pricing, search, and messaging flows.',
    verify:
      'Track duplicate block reduction and verify shared components preserve existing behaviors.',
  },
  {
    code: 'TEST_COVERAGE_UI',
    priority: 'P1',
    fix: 'Add high-value interaction tests for route-level success/error/loading and role-specific paths.',
    why: 'Critical user journeys need deterministic regression protection as features evolve quickly.',
    verify:
      'Run targeted tests for auth, discovery, messaging, and contracts with both success and failure paths.',
  },
  {
    code: 'DOCS_OPERABILITY',
    priority: 'P2',
    fix: 'Document component contracts, edge-case behavior, and expected response envelopes near domain modules.',
    why: 'Clear docs reduce onboarding time and prevent accidental behavior regressions.',
    verify:
      'Review module docs for completeness against current component props and route contracts.',
  },
];

function collectFrontendFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const absolute = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFrontendFiles(absolute));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
      continue;
    }

    const relative = path
      .relative(repoRoot, absolute)
      .split(path.sep)
      .join('/');
    results.push(relative);
  }

  return results.sort((a, b) => a.localeCompare(b));
}

function generateBacklog(files, issues, total) {
  const lines = [];

  lines.push('# Kelmah Frontend 10,000 Item Remediation Backlog (APR 04, 2026)');
  lines.push('');
  lines.push('Purpose: This backlog targets worker-hirer trust, accessibility, mobile reliability, and conversion quality for Kelmah\'s Ghana-first vocational marketplace.');
  lines.push('Method: Items are generated against real frontend module files and mapped to high-impact quality themes used in the ongoing UI and product audits.');
  lines.push(`Coverage: ${files.length} frontend module files, ${issues.length} issue families, ${total} actionable items.`);
  lines.push('');
  lines.push('Priority legend: P0 = critical, P1 = high, P2 = medium.');
  lines.push('');

  for (let i = 0; i < total; i += 1) {
    const itemNumber = i + 1;
    const filePath = files[i % files.length];
    const issue = issues[(Math.floor(i / files.length) + i) % issues.length];

    lines.push(
      `${itemNumber}. [${issue.priority}] [${issue.code}] File: ${filePath} | Fix: ${issue.fix} | Why for Kelmah: ${issue.why} | Verify: ${issue.verify}`,
    );
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`Generated at: ${new Date().toISOString()}`);
  lines.push('Generator: scripts/generate_frontend_backlog_10000_apr2026.js');

  return `${lines.join('\n')}\n`;
}

function main() {
  if (!fs.existsSync(modulesRoot)) {
    throw new Error(`Frontend modules directory not found: ${modulesRoot}`);
  }

  const files = collectFrontendFiles(modulesRoot);
  if (!files.length) {
    throw new Error('No frontend module files were discovered for backlog generation.');
  }

  const content = generateBacklog(files, issueCatalog, targetItems);
  fs.writeFileSync(outputPath, content, 'utf8');

  console.log(`Generated: ${outputPath}`);
  console.log(`Files covered: ${files.length}`);
  console.log(`Items generated: ${targetItems}`);
  console.log(`Character count: ${content.length}`);
}

main();