const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, '../spec-kit/generated/FRONTEND_BACKLOG_10000_ITEMS_MAR19_2026.md');
const title = 'Kelmah Frontend 10000-Item Visual & Display Backlog (March 19 2026)';
const description =
  'This backlog focuses on visual polish and display improvements for both mobile and desktop, aligned to Kelmah's mission of accessible and trustworthy marketplace experiences.';

const categories = [
  {
    title: 'Color & Contrast',
    exampleFiles: ['JobSystemTheme.js', 'Footer.jsx', 'Header.jsx', 'Button.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} color and contrast in \`${fileSample}\` to ensure text, icons, and UI elements meet WCAG AA and remain readable on low-end displays.`,
  },
  {
    title: 'Typography & Readability',
    exampleFiles: ['Typography.jsx', 'JobCard.jsx', 'WorkerProfile.jsx', 'PostContent.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} typography in \`${fileSample}\` to optimize font size, line height, and hierarchy for both small mobile screens and large desktops.`,
  },
  {
    title: 'Layout & Grid Consistency',
    exampleFiles: ['HomeLanding.jsx', 'JobSearchPage.jsx', 'WorkerDashboard.jsx', 'DashboardPage.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} layout/grid consistency in \`${fileSample}\` to avoid jumpy reflows, uneven spacing, and horizontal scroll on narrow viewports.`,
  },
  {
    title: 'Spacing & Padding',
    exampleFiles: ['Card.jsx', 'ListItem.jsx', 'ModalDialog.jsx', 'FiltersPanel.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} spacing and padding in \`${fileSample}\` to keep UIs balanced, avoid cramped content, and ensure tap targets are spaced for thumbs.`,
  },
  {
    title: 'Icons & Imagery',
    exampleFiles: ['Footer.jsx', 'JobCard.jsx', 'ProfileAvatar.jsx', 'EmptyState.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} icon and imagery usage in \`${fileSample}\` to ensure clarity, consistent style, and correct sizing across mobile and desktop.`,
  },
  {
    title: 'Interactive Feedback & States',
    exampleFiles: ['Button.jsx', 'Tabs.jsx', 'ListItem.jsx', 'Snackbar.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} interactive feedback in \`${fileSample}\` to ensure hover/active/disabled states are visible and accessible on all devices.`,
  },
  {
    title: 'Dark Mode & Theme Switching',
    exampleFiles: ['ThemeProvider.jsx', 'JobSystemTheme.js', 'SettingsPage.jsx', 'DarkModeToggle.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} dark mode support in \`${fileSample}\` to ensure all components display correctly and maintain readability in both themes.`,
  },
  {
    title: 'Responsive Images & Media',
    exampleFiles: ['JobCard.jsx', 'WorkerGallery.jsx', 'Banner.jsx', 'ProfileHeader.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} responsive images/media in \`${fileSample}\` to use srcset, lazy loading, and avoid layout shift when images load.`,
  },
  {
    title: 'Accessibility Visual Cues',
    exampleFiles: ['FocusRing.jsx', 'Tooltip.jsx', 'SkipLink.jsx', 'FormField.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} visual accessibility cues in \`${fileSample}\` like focus rings, error outlines, and keyboard indicators.`,
  },
  {
    title: 'Performance Visual Smoothness',
    exampleFiles: ['PageTransition.jsx', 'SkeletonLoader.jsx', 'Carousel.jsx', 'InfiniteScroll.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} visual smoothness in \`${fileSample}\` to avoid jank, layout shifts, and ensure animations are performant on low-end devices.`,
  },
];

const totalItems = 1000;
const startNumber = 10001;

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
  output += `${counter}. Add another visual/display improvement item to capture remaining UI edge cases.\n`;
  counter += 1;
}

fs.writeFileSync(outPath, output, 'utf8');
console.log(`Generated ${outPath} with ${totalItems} items (start=${startNumber})`);
