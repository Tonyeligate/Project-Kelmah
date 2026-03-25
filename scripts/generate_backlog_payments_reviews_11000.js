const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, '../spec-kit/generated/FRONTEND_BACKLOG_11000_ITEMS_MAR19_2026.md');
const title = 'Kelmah Frontend 11000-Item Payments / Reviews / Trust Backlog (March 19 2026)';
const description =
  'This backlog focuses on payments, reviews, trust signals, messaging fidelity, localization completeness, analytics instrumentation, and other critical product flows aligned to Kelmah's marketplace purpose.';

const categories = [
  {
    title: 'Payments & Transactions',
    exampleFiles: ['PaymentCenterPage.jsx', 'CheckoutForm.jsx', 'InvoicePage.jsx', 'paymentService.js'],
    template: ({ verb, fileSample }) =>
      `${verb} payments UX in \`${fileSample}\` to ensure clarity, error handling, receipts, and clear status when transactions are pending or fail.`,
  },
  {
    title: 'Review & Trust Signals',
    exampleFiles: ['ReviewSystem.jsx', 'WorkerProfile.jsx', 'RatingStars.jsx', 'ReviewForm.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} review and trust UI in \`${fileSample}\` to ensure reviews are credible, easy to submit, and help users choose reliable workers.`,
  },
  {
    title: 'Messaging Fidelity & Delivery',
    exampleFiles: ['MessageThread.jsx', 'MessagingPage.jsx', 'SocketProvider.jsx', 'MessageComposer.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} messaging fidelity in \`${fileSample}\` to ensure delivery states, read receipts, and offline message queuing behave correctly.`,
  },
  {
    title: 'Localization & Content Completeness',
    exampleFiles: ['i18n/index.js', 'LocaleSwitcher.jsx', 'translations/en.json', 'translations/gh.json'],
    template: ({ verb, fileSample }) =>
      `${verb} localization completeness in \`${fileSample}\` to ensure all UI strings are translated and regional formatting is correct.`,
  },
  {
    title: 'Analytics Instrumentation',
    exampleFiles: ['analyticsService.js', 'TrackingProvider.jsx', 'JobList.jsx', 'CheckoutForm.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} analytics instrumentation in \`${fileSample}\` to ensure key user actions are tracked without leaking PII and can be analyzed for product improvements.`,
  },
  {
    title: 'Security & Privacy UI',
    exampleFiles: ['PrivacySettings.jsx', 'SessionManagement.jsx', 'LoginPage.jsx', 'AccountDelete.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} security/privacy UX in \`${fileSample}\` to ensure users can manage sessions, data permissions, and understand how their info is used.`,
  },
  {
    title: 'Onboarding & First-Time Experience',
    exampleFiles: ['OnboardingFlow.jsx', 'WelcomePage.jsx', 'SetupWizard.jsx', 'TutorialOverlay.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} onboarding flows in \`${fileSample}\` so new users can get started quickly and understand key marketplace mechanics.`,
  },
  {
    title: 'Error States & Help',
    exampleFiles: ['ErrorPage.jsx', 'NotFoundPage.jsx', 'SupportContact.jsx', 'ErrorBoundary.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} error states in \`${fileSample}\` to ensure users get helpful guidance and recovery actions when something goes wrong.`,
  },
  {
    title: 'Accessibility Compliance',
    exampleFiles: ['Footer.jsx', 'Header.jsx', 'JobCard.jsx', 'SignupForm.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} accessibility compliance in \`${fileSample}\` to ensure keyboard navigation, screen reader experience, and contrast meet WCAG AA requirements.`,
  },
  {
    title: 'Performance & Load Resilience',
    exampleFiles: ['App.jsx', 'JobList.jsx', 'DashboardPage.jsx', 'ProfilePage.jsx'],
    template: ({ verb, fileSample }) =>
      `${verb} performance and load resilience in \`${fileSample}\` to ensure smooth UI under high data volume and slow network conditions.`,
  },
];

const totalItems = 1000;
const startNumber = 11001;

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
  output += `${counter}. Add another marketplace-focused UX improvement item to capture edge cases for reliability and trust.\n`;
  counter += 1;
}

fs.writeFileSync(outPath, output, 'utf8');
console.log(`Generated ${outPath} with ${totalItems} items (start=${startNumber})`);
