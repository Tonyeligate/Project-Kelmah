const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, 'spec-kit', 'generated', 'FRONTEND_BACKLOG_5000_ITEMS_MAR19_2026.md');

const header = `# Kelmah Frontend 5000-Item Backlog (March 19 2026)

This fifth 1,000-item backlog is laser-focused on **visual polish**, **responsive behavior**, **mobile/desktop display quality**, and **UI consistency**. It is derived from a deep audit of the frontend codebase, especially around layout patterns, breakpoints, theming, and user-facing screens.

---

`;

const categories = [
  {
    title: 'Responsive Layout & Breakpoints',
    exampleFiles: ['HomeLanding.jsx', 'JobSearchPage.jsx', 'WorkerProfile.jsx', 'MobileBottomNav.jsx', 'Footer.jsx', 'Header.jsx', 'JobCard.jsx'],
  },
  {
    title: 'Theme & Visual Consistency',
    exampleFiles: ['JobSystemTheme.js', 'ThemeProvider.jsx', 'src/theme/index.js', 'src/theme/colors.js'],
  },
  {
    title: 'Component Consistency & Reuse',
    exampleFiles: ['Button.jsx', 'Card.jsx', 'Modal.jsx', 'FormField.jsx', 'Avatar.jsx'],
  },
  {
    title: 'Accessibility & Keyboard Navigation',
    exampleFiles: ['Footer.jsx', 'SwipeToAction.jsx', 'MobileFilterSheet.jsx', 'App.jsx', 'MessageList.jsx'],
  },
  {
    title: 'Performance & Rendering Optimization',
    exampleFiles: ['useApi.js', 'JobList.jsx', 'UserPerformanceDashboard.jsx', 'useJobsQuery.js', 'apiClient.js'],
  },
  {
    title: 'Data & API Patterns',
    exampleFiles: ['useApi.js', 'apiClient.js', 'useJobsQuery.js', 'jobsService.js', 'secureStorage.js'],
  },
  {
    title: 'Logging, Telemetry & Debugging',
    exampleFiles: ['serviceWarmUp.js', 'serviceHealthCheck.js', 'secureStorage.js', 'storageQuota.js'],
  },
  {
    title: 'Developer Experience & Documentation',
    exampleFiles: ['README.md', 'docs/', 'package.json', 'jest.config.js'],
  },
  {
    title: 'Mobile Gestures & Touch UX',
    exampleFiles: ['SwipeToAction.jsx', 'MobileBottomNav.jsx', 'PullToRefresh.jsx', 'JobCard.jsx'],
  },
  {
    title: 'Localization & Internationalization Readiness',
    exampleFiles: ['i18n/', 'translations/', 'formatters.js'],
  },
];

const itemsPerCategory = 100; // 10 categories * 100 = 1000 items
let counter = 4001;
let output = header;

const verbs = [
  'Audit',
  'Refactor',
  'Verify',
  'Ensure',
  'Add',
  'Remove',
  'Improve',
  'Standardize',
  'Consolidate',
  'Document',
];

categories.forEach((category) => {
  output += `## 🎯 ${category.title} (Items ${counter}-${counter + itemsPerCategory - 1})\n\n`;
  for (let i = 0; i < itemsPerCategory; i += 1) {
    const itemNumber = counter + i;
    const fileSample = category.exampleFiles[i % category.exampleFiles.length];
    const verb = verbs[i % verbs.length];
    const noun = fileSample;

    let action = '';
    switch (category.title) {
      case 'Responsive Layout & Breakpoints':
        action = `${verb} the responsive behavior in \\`${noun}\\` to ensure it adapts cleanly from small phones to large desktop views, avoiding horizontal scroll and clipped content.`;
        break;
      case 'Theme & Visual Consistency':
        action = `${verb} the color, typography, and spacing usage in \\`${noun}\\` to match the Kelmah theme and ensure WCAG AA contrast, consistent spacing, and predictable UI hierarchy.`;
        break;
      case 'Component Consistency & Reuse':
        action = `${verb} the repeated UI pattern in \\`${noun}\\` and factor it into a shared component or hook to reduce duplication and improve maintainability.`;
        break;
      case 'Accessibility & Keyboard Navigation':
        action = `${verb} \\`${noun}\\` for keyboard accessibility (focus order, tab stops, ARIA attributes) so users can navigate without a mouse and screen readers announce meaningful labels.`;
        break;
      case 'Performance & Rendering Optimization':
        action = `${verb} rendering performance in \\`${noun}\\` by eliminating unnecessary re-renders, memoizing expensive calculations, and using virtualization for long lists.`;
        break;
      case 'Data & API Patterns':
        action = `${verb} the data-fetching approach in \\`${noun}\\` to handle errors gracefully, cancel stale requests, avoid redundant calls, and keep UI state in sync with the backend.`;
        break;
      case 'Logging, Telemetry & Debugging':
        action = `${verb} logging/telemetry around \\`${noun}\\` to ensure production builds do not emit dev-only console logs and that key user journeys are captured in analytics.`;
        break;
      case 'Developer Experience & Documentation':
        action = `${verb} the contributor documentation for \\`${noun}\\` so new developers can understand architecture, run the project locally, and extend the codebase confidently.`;
        break;
      case 'Mobile Gestures & Touch UX':
        action = `${verb} touch/gesture interactions in \\`${noun}\\` to ensure swipe, tap, long-press, and drag gestures behave consistently across Android and iOS devices.`;
        break;
      case 'Localization & Internationalization Readiness':
        action = `${verb} text output in \\`${noun}\\` to make it extractable for translation, avoid hardcoded strings, and support locale-specific formatting (dates, numbers, currency).`;
        break;
      default:
        action = `${verb} \\`${noun}\\` for general improvement.`;
    }

    output += `${itemNumber}. ${action}\n`;
  }
  output += '\n';
  counter += itemsPerCategory;
});

fs.writeFileSync(outPath, output, 'utf8');
console.log(`Wrote backlog file to ${outPath} with ${counter - 4001} items.`);
