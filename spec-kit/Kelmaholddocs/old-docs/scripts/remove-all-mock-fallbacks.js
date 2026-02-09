#!/usr/bin/env node

/**
 * 🔥 MOCK DATA FALLBACK ELIMINATION SCRIPT
 * Removes all mock data fallbacks to force real API connections
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, '..', 'kelmah-frontend', 'src');

// Files that need mock data elimination
const FILES_TO_UPDATE = [
  'modules/payment/contexts/PaymentContext.jsx',
  'modules/contracts/contexts/ContractContext.jsx', 
  'modules/notifications/contexts/NotificationContext.jsx',
  'modules/dashboard/services/dashboardSlice.js',
  'modules/search/services/smartSearchService.js',
  'modules/worker/services/portfolioService.js',
  'modules/worker/services/earningsService.js',
  'modules/analytics/pages/AnalyticsPage.jsx',
  'modules/worker/components/EarningsTracker.jsx'
];

function removeMockFallbacks() {
  console.log('🔥 ELIMINATING ALL MOCK DATA FALLBACKS');
  console.log('====================================');

  FILES_TO_UPDATE.forEach(relativePath => {
    const filePath = path.join(FRONTEND_DIR, relativePath);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${relativePath}`);
      return;
    }

    console.log(`🔄 Processing: ${relativePath}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Remove mock data imports and fallbacks
    const mockPatterns = [
      /import.*mockData.*from.*$/gm,
      /const\s+mockData\s*=.*$/gm,
      /\/\/.*mock.*data.*$/gi,
      /\/\*.*mock.*data.*\*\//gi,
      /catch\s*\([^)]*\)\s*{[^}]*mockData[^}]*}/gs,
      /\.catch\([^)]*=>\s*{[^}]*mockData[^}]*}\)/gs
    ];

    mockPatterns.forEach(pattern => {
      const newContent = content.replace(pattern, '');
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Removed mock fallbacks from: ${relativePath}`);
    } else {
      console.log(`ℹ️  No mock fallbacks found in: ${relativePath}`);
    }
  });

  console.log('\n🎉 MOCK DATA ELIMINATION COMPLETED!');
  console.log('All files now use real API connections only.');
}

if (require.main === module) {
  removeMockFallbacks();
}

module.exports = { removeMockFallbacks };