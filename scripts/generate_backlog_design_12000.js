const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, '../spec-kit/generated/FRONTEND_BACKLOG_12000_ITEMS_MAR19_2026.md');
const title = 'Kelmah Frontend 12000-Item Design & Display Backlog (March 19 2026)';
const description =
  'This backlog focuses on visual design, layout consistency, responsive display, and polished mobile/desktop presentation that aligns with Kelmah's mission as a trustworthy freelance marketplace.';

const categories = [
  {
    title: 'Responsive Layout Constraints',
    exampleFiles: ['App.jsx', 'HomeLanding.jsx', 'JobSearchPage.jsx', 'WorkerProfile.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} responsive layout constraints in \`${fileSample}\` to prevent overflow, clipped content, and inconsistent column spacing across devices.`,
  },
  {
    title: 'Design Token & Theme Consistency',
    exampleFiles: ['JobSystemTheme.js', 'ThemeProvider.jsx', 'colors.js', 'typography.js'],
    template: ({ verb, fileSample }) =>
      `${verb} design tokens in \`${fileSample}\` to ensure color/spacing/typography follows Kelmah's theme and avoids one-off values.`,
  },
  {
    title: 'Iconography & Button Layout',
    exampleFiles: ['Footer.jsx', 'Header.jsx', 'JobCard.jsx', 'ActionBar.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} iconography and button layout in \`${fileSample}\` to ensure clear tap targets, consistent sizes, and accessible labels across mobile/desktop.`,
  },
  {
    title: 'Typography & Readability',
    exampleFiles: ['JobCard.jsx', 'JobDetailPage.jsx', 'WorkerProfile.jsx', 'ReviewCard.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} typography in \`${fileSample}\` to ensure font sizes, line heights, and weight hierarchy are legible across screen sizes.`,
  },
  {
    title: 'Animation & Motion',
    exampleFiles: ['ModalDialog.jsx', 'Drawer.jsx', 'ToastManager.jsx', 'SwipeToAction.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} animation/motion in \`${fileSample}\` to ensure transitions are smooth, performant, and respect reduced-motion preferences.`,
  },
  {
    title: 'Grid & Spacing Harmonization',
    exampleFiles: ['JobList.jsx', 'WorkerGrid.jsx', 'DashboardPage.jsx', 'SearchFilters.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} grid/spacing harmonization in \`${fileSample}\` to ensure consistent margins, gutters, and alignment across screens.`,
  },
  {
    title: 'Colour Contrast & Accessibility',
    exampleFiles: ['Footer.jsx', 'Header.jsx', 'AlertBanner.jsx', 'Card.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} colour contrast in \`${fileSample}\` to ensure text and UI elements meet WCAG AA and are readable on low-end displays.`,
  },
  {
    title: 'Mobile Navigation & Gestures',
    exampleFiles: ['MobileBottomNav.jsx', 'NavDrawer.jsx', 'SwipeToAction.jsx', 'JobCard.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} mobile navigation and gestures in \`${fileSample}\` to ensure consistency, discoverability, and that gestures don't conflict with scroll.`,
  },
  {
    title: 'Empty & Error States',
    exampleFiles: ['EmptyState.jsx', 'ErrorPage.jsx', 'NotFoundPage.jsx', 'OfflineBanner.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} empty/error state design in \`${fileSample}\` so fallback states are helpful, non-scary, and guide users to next steps.`,
  },
  {
    title: 'Layout Performance',
    exampleFiles: ['JobList.jsx', 'WorkerProfile.jsx', 'DashboardPage.jsx', 'MessageList.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} layout performance in \`${fileSample}\` to ensure fast paint, avoid layout shifts, and keep the UI responsive on slow devices.`,
  },
];

const totalItems = 1000;
const startNumber = 12001;

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
  output += `${counter}. Add another visual/display improvement item to capture remaining edge cases.\n`;
  counter += 1;
}

fs.writeFileSync(outPath, output, 'utf8');
console.log(`Generated ${outPath} with ${totalItems} items (start=${startNumber})`);
