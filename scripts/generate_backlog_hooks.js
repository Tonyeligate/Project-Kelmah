const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, '../spec-kit/generated/FRONTEND_BACKLOG_6000_ITEMS_MAR19_2026.md');
const title = 'Kelmah Frontend 6000-Item Hooks & Data Fetching Backlog (March 19 2026)';
const description =
  'This backlog focuses on Hooks, data fetching, react-query patterns, API client resilience, and error handling in the frontend.';

const categories = [
  {
    title: 'Hook Stability & Cancellation',
    exampleFiles: ['useApi.js', 'useJobsQuery.js', 'useProfile.js', 'useNotifications.js'],
    template: ({ verb, fileSample }) =>
      `${verb} the hook behavior in \`${fileSample}\` to ensure stable state, avoid stale closures, and prevent unmounted updates (cancel in-flight requests).`,
  },
  {
    title: 'React Query Cache & Keying',
    exampleFiles: ['useJobsQuery.js', 'useSavedJobsQuery.js', 'useJobQuery.js', 'useMessagesQuery.js'],
    template: ({ verb, fileSample }) =>
      `${verb} cache key generation in \`${fileSample}\` to avoid cache churn, ensure stable keys, and align with invalidation strategy.`,
  },
  {
    title: 'API Client Resilience',
    exampleFiles: ['apiClient.js', 'jobsService.js', 'userService.js', 'paymentService.js'],
    template: ({ verb, fileSample }) =>
      `${verb} the API client code in \`${fileSample}\` to handle retries, 429 rate-limits, backoff, and request cancellation cleanly.`,
  },
  {
    title: 'Error Handling & UX Mapping',
    exampleFiles: ['useApi.js', 'toastService.js', 'ErrorBoundary.jsx', 'ErrorPage.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} the error-to-UI mapping in \`${fileSample}\` so users see friendly messages and consistent retry options when networking fails.`,
  },
  {
    title: 'Network State & Offline Behavior',
    exampleFiles: ['useNetworkStatus.js', 'OfflineBanner.jsx', 'serviceHealthCheck.js', 'serviceWarmUp.js'],
    template: ({ verb, fileSample }) =>
      `${verb} network state handling in \`${fileSample}\` so offline/online transitions and retry behavior are predictable and user-friendly.`,
  },
  {
    title: 'Request Deduplication & Cancellation',
    exampleFiles: ['apiClient.js', 'useApi.js', 'useJobsQuery.js', 'useMessagesQuery.js'],
    template: ({ verb, fileSample }) =>
      `${verb} request deduplication and abort handling in \`${fileSample}\` so duplicate requests do not flood the backend and unmounted components don't update state.`,
  },
  {
    title: 'Testing & Mocking',
    exampleFiles: ['__tests__/useApi.test.js', '__tests__/useJobsQuery.test.js', '__tests__/apiClient.test.js', '__mocks__/apiClient.js'],
    template: ({ verb, fileSample }) =>
      `${verb} tests for \`${fileSample}\` to cover retries, token refresh, cache invalidation, and error states under simulated flaky networks.`,
  },
  {
    title: 'Logging & Telemetry',
    exampleFiles: ['apiClient.js', 'useApi.js', 'serviceHealthCheck.js', 'analyticsService.js'],
    template: ({ verb, fileSample }) =>
      `${verb} telemetry/logging around \`${fileSample}\` to ensure key data fetch failures are captured without leaking PII, and to allow post-mortem for user-facing incidents.`,
  },
  {
    title: 'Performance & Efficiency',
    exampleFiles: ['useJobsQuery.js', 'useSavedJobsQuery.js', 'useJobQuery.js', 'useMessagesQuery.js'],
    template: ({ verb, fileSample }) =>
      `${verb} performance of \`${fileSample}\` by avoiding unnecessary re-fetches, minimizing suspense flicker, and preventing excessive render churn.`,
  },
  {
    title: 'Documentation & Onboarding',
    exampleFiles: ['docs/data-fetching.md', 'docs/react-query.md', 'docs/hooks-guidelines.md', 'README.md'],
    template: ({ verb, fileSample }) =>
      `${verb} the documentation for \`${fileSample}\` so developers understand expected patterns, common pitfalls, and how to contribute safely.`,
  },
];

const totalItems = 1000;
const startNumber = 5001;

const verbs = ['Audit', 'Refactor', 'Verify', 'Ensure', 'Add', 'Remove', 'Improve', 'Standardize', 'Consolidate', 'Document'];

let output = `# ${title}\n\n${description}\n\n---\n\n`;

const itemsPerCategory = Math.floor(totalItems / categories.length);
let counter = startNumber;

categories.forEach((category) => {
  const rangeEnd = counter + itemsPerCategory - 1;
  output += `## 🎯 ${category.title} (Items ${counter}-${rangeEnd})\n\n`;

  for (let i = 0; i < itemsPerCategory; i += 1) {
    const itemNumber = counter + i;
    const fileSample = category.exampleFiles[i % category.exampleFiles.length];
    const verb = verbs[i % verbs.length];
    const action = category.template({ verb, fileSample });
    output += `${itemNumber}. ${action}\n`;
  }

  output += '\n';
  counter += itemsPerCategory;
});

while (counter < startNumber + totalItems) {
  output += `${counter}. Add another data-fetching improvement item to capture remaining edge cases.\n`;
  counter += 1;
}

fs.writeFileSync(outPath, output, 'utf8');
console.log(`Generated ${outPath} with ${totalItems} items (start=${startNumber})`);
