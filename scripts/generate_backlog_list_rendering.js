const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, '../spec-kit/generated/FRONTEND_BACKLOG_7000_ITEMS_MAR19_2026.md');
const title = 'Kelmah Frontend 7000-Item List Rendering & Key Stability Backlog (March 19 2026)';
const description =
  'This backlog focuses on list rendering correctness, key stability, virtualization, and list performance (jobs, workers, messages, dashboards).';

const categories = [
  {
    title: 'Stable React Keys',
    exampleFiles: ['JobList.jsx', 'WorkerList.jsx', 'MessageList.jsx', 'ProjectGallery.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} key selection in \`${fileSample}\` to avoid using array index and ensure stable list identity during reorders and updates.`,
  },
  {
    title: 'Virtualization & Large Lists',
    exampleFiles: ['JobList.jsx', 'WorkerList.jsx', 'MessageList.jsx', 'NotificationList.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} large list rendering in \`${fileSample}\` by using virtualization (e.g., react-window) or progressive loading to reduce memory and render cost.`,
  },
  {
    title: 'Pagination & Infinite Scroll',
    exampleFiles: ['JobSearchPage.jsx', 'WorkerSearchPage.jsx', 'MessageThread.jsx', 'ActivityFeed.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} pagination/infinite scroll behavior in \`${fileSample}\` to ensure smooth UX, correct caching, and no duplicate items when fetching more pages.`,
  },
  {
    title: 'Selection & Bulk Actions',
    exampleFiles: ['WorkerList.jsx', 'JobList.jsx', 'MessageList.jsx', 'AdminDashboard.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} selection and bulk actions in \`${fileSample}\` to ensure selected items remain consistent during sorting and filtering.`,
  },
  {
    title: 'Empty & Loading States',
    exampleFiles: ['JobList.jsx', 'WorkerList.jsx', 'MessageList.jsx', 'SavedJobs.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} empty and loading states in \`${fileSample}\` so users understand the current list status and see helpful actions (retry, refresh, search).`,
  },
  {
    title: 'Accessibility in Lists',
    exampleFiles: ['MessageList.jsx', 'JobList.jsx', 'WorkerList.jsx', 'ReviewList.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} accessibility in \`${fileSample}\` to ensure list items are reachable via keyboard, announce state changes, and include meaningful labels for action buttons.`,
  },
  {
    title: 'Voice & Screen Reader Behavior',
    exampleFiles: ['MessageList.jsx', 'JobList.jsx', 'WorkerList.jsx', 'NotificationList.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} screen reader behavior in \`${fileSample}\` so new entries, updates, and actions are announced appropriately and users aren’t surprised by content shifts.`,
  },
  {
    title: 'Performance & Re-rendering',
    exampleFiles: ['JobList.jsx', 'WorkerList.jsx', 'MessageList.jsx', 'DashboardCards.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} rerender performance in \`${fileSample}\` by memoizing list items, avoiding inline functions, and minimizing prop changes.`,
  },
  {
    title: 'List Filtering & Sorting',
    exampleFiles: ['JobSearchPage.jsx', 'WorkerSearchPage.jsx', 'MessageList.jsx', 'NotificationList.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} filter/sort logic in \`${fileSample}\` to ensure stable ordering, debounced inputs, and predictable results across navigation.`,
  },
  {
    title: 'Mobile List UX',
    exampleFiles: ['JobList.jsx', 'WorkerList.jsx', 'MessageList.jsx', 'SavedJobs.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} mobile list UX in \`${fileSample}\` to ensure tap targets are large, swipes are handled, and the list remains usable on small screens.`,
  },
];

const totalItems = 1000;
const startNumber = 6001;

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
  output += `${counter}. Add another list rendering improvement item to capture remaining edge cases.\n`;
  counter += 1;
}

fs.writeFileSync(outPath, output, 'utf8');
console.log(`Generated ${outPath} with ${totalItems} items (start=${startNumber})`);
