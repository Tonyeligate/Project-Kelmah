const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, '../spec-kit/generated/FRONTEND_BACKLOG_9000_ITEMS_MAR19_2026.md');
const title = 'Kelmah Frontend 9000-Item Hooks & Data Fetching Backlog (March 19 2026)';
const description =
  'This backlog is the next 1,000-item extension focused on deeper hooks/data-fetching robustness: retries, offline sync, optimistic updates, dedupe, and stable query patterns.';

const categories = [
  {
    title: 'Advanced Hook Cancellation & Resilience',
    exampleFiles: ['useApi.js', 'useJobsQuery.js', 'useNotifications.js', 'useProfile.js'],
    template: ({ verb, fileSample }) =>
      `${verb} cancellation and resilience in \`${fileSample}\` so in-flight requests don’t update unmounted components and failures are recoverable.`,
  },
  {
    title: 'Optimistic Updates & Mutation UX',
    exampleFiles: ['useSaveJobMutation.js', 'useApplyToJobMutation.js', 'useSendMessageMutation.js', 'useCreateContractMutation.js'],
    template: ({ verb, fileSample }) =>
      `${verb} optimistic update patterns in \`${fileSample}\` to keep UI responsive while ensuring rollback on failure.`,
  },
  {
    title: 'Offline Sync & Queueing',
    exampleFiles: ['useOfflineQueue.js', 'serviceWorker.js', 'useNetworkStatus.js', 'serviceWarmUp.js'],
    template: ({ verb, fileSample }) =>
      `${verb} offline syncing and queued request handling in \`${fileSample}\` so users can work without a connection and sync when online.`,
  },
  {
    title: 'Retry Policies & Backoff',
    exampleFiles: ['apiClient.js', 'useApi.js', 'jobsService.js', 'paymentsService.js'],
    template: ({ verb, fileSample }) =>
      `${verb} retry/backoff policies in \`${fileSample}\` so transient errors retry safely without overwhelming the backend.`,
  },
  {
    title: 'Cache Invalidation & Staleness',
    exampleFiles: ['useJobsQuery.js', 'useSavedJobsQuery.js', 'useJobQuery.js', 'useProfileQuery.js'],
    template: ({ verb, fileSample }) =>
      `${verb} cache invalidation strategy in \`${fileSample}\` to keep data fresh without excessive refetches.`,
  },
  {
    title: 'Telemetry + Failure Metrics',
    exampleFiles: ['analyticsService.js', 'apiClient.js', 'useApi.js', 'useJobsQuery.js'],
    template: ({ verb, fileSample }) =>
      `${verb} telemetry/metrics for \`${fileSample}\` to understand failure rates, latency, and user impact during outages.`,
  },
  {
    title: 'Data Consistency & Conflict Resolution',
    exampleFiles: ['useSavedJobsQuery.js', 'useProfile.js', 'useNotifications.js', 'jobsService.js'],
    template: ({ verb, fileSample }) =>
      `${verb} data consistency in \`${fileSample}\` to handle conflicts (e.g., two devices updating the same record) and prevent UI drift.`,
  },
  {
    title: 'Stable Query Keys & Serialization',
    exampleFiles: ['useJobsQuery.js', 'useSavedJobsQuery.js', 'useJobQuery.js', 'useMessagesQuery.js'],
    template: ({ verb, fileSample }) =>
      `${verb} stable query key generation in \`${fileSample}\` to prevent cache explosions and ensure correct invalidation.`,
  },
  {
    title: 'Developer Docs + Recipes',
    exampleFiles: ['docs/data-fetching.md', 'docs/hooks-guidelines.md', 'README.md', 'docs/react-query.md'],
    template: ({ verb, fileSample }) =>
      `${verb} documentation in \`${fileSample}\` to provide clear recipes for building robust data fetching and mutation patterns.`,
  },
  {
    title: 'Edge Case Handling',
    exampleFiles: ['useApi.js', 'useJobsQuery.js', 'apiClient.js', 'useNetworkStatus.js'],
    template: ({ verb, fileSample }) =>
      `${verb} edge case handling in \`${fileSample}\` for unexpected conditions like partial failures, throttling, and expired sessions.`,
  },
];

const totalItems = 1000;
const startNumber = 9001;

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
    output += `${itemNumber}. ${category.template({ verb, fileSample })}\n`;
  }

  output += '\n';
  counter += itemsPerCategory;
});

while (counter < startNumber + totalItems) {
  output += `${counter}. Add another data-fetching robustness improvement item to capture remaining edge cases.\n`;
  counter += 1;
}

fs.writeFileSync(outPath, output, 'utf8');
console.log(`Generated ${outPath} with ${totalItems} items (start=${startNumber})`);
