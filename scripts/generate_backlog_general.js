const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, '../spec-kit/generated/FRONTEND_BACKLOG_8000_ITEMS_MAR19_2026.md');
const title = 'Kelmah Frontend 8000-Item Visual & UX Backlog (March 19 2026)';
const description =
  'This backlog focuses on visual polish, mobile/desktop UX, accessibility, and overall product refinement aligned to Kelmah’s mission.';

const categories = [
  {
    title: 'Mobile Layout & Touch UX',
    exampleFiles: ['MobileBottomNav.jsx', 'SwipeToAction.jsx', 'JobCard.jsx', 'MessageList.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} mobile layout or touch interaction in \`${fileSample}\` to ensure good ergonomics, accessible hit targets, and consistent mobile navigation.`,
  },
  {
    title: 'Desktop Layout & Multi-Column Views',
    exampleFiles: ['DashboardPage.jsx', 'WorkerProfile.jsx', 'JobSearchPage.jsx', 'ReportsPage.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} desktop layout in \`${fileSample}\` to ensure responsiveness, whitespace balance, and readable multi-column content.`,
  },
  {
    title: 'Visual Consistency & Theming',
    exampleFiles: ['JobSystemTheme.js', 'ThemeProvider.jsx', 'components/common/Branding.jsx', 'theme/index.js'],
    template: ({ verb, fileSample }) =>
      `${verb} theming in \`${fileSample}\` to ensure consistent colors, typography, spacing, and visual hierarchy across the app.`,
  },
  {
    title: 'Accessibility & Screen Reader UX',
    exampleFiles: ['Footer.jsx', 'SkipLink.jsx', 'App.jsx', 'ModalDialog.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} accessibility in \`${fileSample}\` to ensure screen reader users and keyboard-only users have a clear, coherent experience.`,
  },
  {
    title: 'Form UX & Validation',
    exampleFiles: ['JobForm.jsx', 'ProfileForm.jsx', 'LoginPage.jsx', 'SignupPage.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} form UX in \`${fileSample}\` to provide clear validation feedback, prevent data loss, and make multi-step forms consistent.`,
  },
  {
    title: 'Navigation & Information Architecture',
    exampleFiles: ['Navigation.jsx', 'AppRoutes.jsx', 'SideNav.jsx', 'BreadcrumbNavigation.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} navigation in \`${fileSample}\` so users can find key workflows quickly and deep links behave reliably.`,
  },
  {
    title: 'Branding & Onboarding',
    exampleFiles: ['OnboardingFlow.jsx', 'WelcomePage.jsx', 'LandingPage.jsx', 'TutorialOverlay.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} onboarding content in \`${fileSample}\` to ensure users understand Kelmah’s value prop and quickly reach their first success.`,
  },
  {
    title: 'Localization & Regional Formatting',
    exampleFiles: ['i18n/index.js', 'formatters.js', 'locale/messages.js', 'languageSwitcher.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} localization readiness in \`${fileSample}\` to support multiple languages and regional formats (dates, numbers, currency).`,
  },
  {
    title: 'Performance & Perceived Speed',
    exampleFiles: ['App.jsx', 'JobList.jsx', 'MessageList.jsx', 'DashboardPage.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} perceived performance in \`${fileSample}\` by improving skeleton loading, reducing jank, and speeding up time-to-interactive.`,
  },
  {
    title: 'Design System & Component Library',
    exampleFiles: ['components/common/Button.jsx', 'components/common/Card.jsx', 'components/common/Modal.jsx', 'components/common/Avatar.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} design system consistency in \`${fileSample}\` to ensure components behave predictably and encourage reuse over one-off implementations.`,
  },
];

const totalItems = 1000;
const startNumber = 7001;

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
  output += `${counter}. Add another UI/UX improvement item to cover edge-case visual or interaction issues.\n`;
  counter += 1;
}

fs.writeFileSync(outPath, output, 'utf8');
console.log(`Generated ${outPath} with ${totalItems} items (start=${startNumber})`);
