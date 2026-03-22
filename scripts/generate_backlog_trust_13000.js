const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, '../spec-kit/generated/FRONTEND_BACKLOG_13000_ITEMS_MAR19_2026.md');
const title = 'Kelmah Frontend 13000-Item Trust, Navigation & Marketplace UX Backlog (March 19 2026)';
const description = 'This backlog continues the 1,000-item expansion with a focus on trust signals, navigation clarity, marketplace workflows, and display polish across mobile and desktop.';

const categories = [
  {
    title: 'Trust Signals & Verification',
    exampleFiles: ['WorkerProfile.jsx', 'VerificationBadge.jsx', 'ReviewSystem.jsx', 'TrustPanel.jsx'],
    template: ({ verb, fileSample }) => `${verb} trust and verification UI in \`${fileSample}\` so workers and hirers can quickly assess reliability, identity, and credibility.`,
  },
  {
    title: 'Navigation Clarity',
    exampleFiles: ['Header.jsx', 'SideNav.jsx', 'BreadcrumbNavigation.jsx', 'MobileBottomNav.jsx'],
    template: ({ verb, fileSample }) => `${verb} navigation clarity in \`${fileSample}\` so users always know where they are and how to reach the next relevant marketplace task.`,
  },
  {
    title: 'Marketplace Discovery',
    exampleFiles: ['HomeLanding.jsx', 'JobSearchPage.jsx', 'WorkerSearchPage.jsx', 'RecommendationsPanel.jsx'],
    template: ({ verb, fileSample }) => `${verb} discovery surfaces in \`${fileSample}\` so users can quickly find jobs, workers, categories, and suggested matches.`,
  },
  {
    title: 'Job Posting & Application UX',
    exampleFiles: ['JobForm.jsx', 'JobDetailPage.jsx', 'JobApplication.jsx', 'ApplicationManagementPage.jsx'],
    template: ({ verb, fileSample }) => `${verb} job posting/application flows in \`${fileSample}\` so the marketplace experience stays simple, guided, and confidence-building.`,
  },
  {
    title: 'Messaging & Conversation UX',
    exampleFiles: ['MessagingPage.jsx', 'MessageThread.jsx', 'MessageComposer.jsx', 'ChatList.jsx'],
    template: ({ verb, fileSample }) => `${verb} conversation UI in \`${fileSample}\` so chat stays readable, responsive, and easy to use on small screens.`,
  },
  {
    title: 'Payments & Confirmation States',
    exampleFiles: ['PaymentCenterPage.jsx', 'CheckoutForm.jsx', 'ReceiptView.jsx', 'InvoiceSummary.jsx'],
    template: ({ verb, fileSample }) => `${verb} payment confirmation UI in \`${fileSample}\` so users see clear pricing, payment status, and proof of completion.`,
  },
  {
    title: 'Profile & Portfolio Presentation',
    exampleFiles: ['WorkerProfile.jsx', 'PortfolioGallery.jsx', 'ProfileHeader.jsx', 'SkillsChipList.jsx'],
    template: ({ verb, fileSample }) => `${verb} profile and portfolio presentation in \`${fileSample}\` so worker experience and capability are visually strong and easy to scan.`,
  },
  {
    title: 'Support & Help Content',
    exampleFiles: ['SupportContact.jsx', 'HelpCenter.jsx', 'FAQPage.jsx', 'ReportIssue.jsx'],
    template: ({ verb, fileSample }) => `${verb} support and help content in \`${fileSample}\` so users can recover quickly from confusion, errors, or disputes.`,
  },
  {
    title: 'Content Density & Scanability',
    exampleFiles: ['DashboardPage.jsx', 'JobCard.jsx', 'WorkerCard.jsx', 'ReviewCard.jsx'],
    template: ({ verb, fileSample }) => `${verb} content density in \`${fileSample}\` so important information is easy to scan without overwhelming mobile users.`,
  },
  {
    title: 'Cross-Device Display Fidelity',
    exampleFiles: ['App.jsx', 'HomeLanding.jsx', 'Footer.jsx', 'ModalDialog.jsx'],
    template: ({ verb, fileSample }) => `${verb} display fidelity in \`${fileSample}\` so the same screen feels coherent on phones, tablets, laptops, and large desktops.`,
  },
];

const totalItems = 1000;
const startNumber = 13001;
const verbs = ['Audit', 'Refactor', 'Verify', 'Ensure', 'Add', 'Remove', 'Improve', 'Standardize', 'Consolidate', 'Document'];

let output = `# ${title}\n\n${description}\n\n---\n\n`;
const itemsPerCategory = Math.floor(totalItems / categories.length);
let counter = startNumber;

categories.forEach((category) => {
  output += `## 🎯 ${category.title} (Items ${counter}-${counter + itemsPerCategory - 1})\n\n`;
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
  output += `${counter}. Add another trust/navigation improvement item that strengthens the Kelmah marketplace experience.\n`;
  counter += 1;
}

fs.writeFileSync(outPath, output, 'utf8');
console.log(`Generated ${outPath} with ${totalItems} items (start=${startNumber})`);
