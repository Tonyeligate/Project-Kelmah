/**
 * FIX ALL JOB STATUS QUERIES
 * Replace all lowercase "open" with capitalized "Open" in queries
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../controllers/job.controller.js');

console.log('Reading job.controller.js...');
let content = fs.readFileSync(filePath, 'utf8');

const fixes = [
  // Fix getJobs direct driver query check
  {
    search: /const directCount = await jobsCollection\.countDocuments\(\{ status: 'open', visibility: 'public' \}\);/g,
    replace: "const directCount = await jobsCollection.countDocuments({ status: 'Open', visibility: 'public' });",
    description: 'Direct driver query in getJobs'
  },
  // Fix getDashboardJobs
  {
    search: /recentJobs = await Job\.find\(\{ status: 'open', visibility: 'public' \}\)/g,
    replace: "recentJobs = await Job.find({ status: 'Open', visibility: 'public' })",
    description: 'getDashboardJobs recent jobs query'
  },
  // Fix getPlatformStats
  {
    search: /Job\.countDocuments\(\{ status: 'open', visibility: 'public' \}\)/g,
    replace: "Job.countDocuments({ status: 'Open', visibility: 'public' })",
    description: 'getPlatformStats count query'
  },
  {
    search: /status: 'open',\s+visibility: 'public',\s+createdAt:/g,
    replace: "status: 'Open',\n      visibility: 'public',\n      createdAt:",
    description: 'getPlatformStats recent jobs query'
  },
  // Fix getJobCategories
  {
    search: /status: 'open',\s+visibility: 'public'/g,
    replace: "status: 'Open', \n      visibility: 'public'",
    description: 'getJobCategories query'
  },
  // Fix applyToJob
  {
    search: /if \(job\.status !== 'open' \|\| job\.visibility === 'private'\)/g,
    replace: "if (job.status !== 'Open' || job.visibility === 'private')",
    description: 'applyToJob status check'
  },
  // Fix edit/delete checks
  {
    search: /if \(job\.status !== "draft" && job\.status !== "open"\)/g,
    replace: 'if (job.status !== "draft" && job.status !== "Open")',
    description: 'Edit/delete status checks'
  },
  // Fix closeJobBidding
  {
    search: /status: 'open',\s+'bidding\.bidStatus': 'open'/g,
    replace: "status: 'Open',\n      'bidding.bidStatus': 'open'",
    description: 'closeJobBidding query'
  }
];

let fixCount = 0;

fixes.forEach((fix, index) => {
  const matches = content.match(fix.search);
  if (matches) {
    console.log(`✅ Fix ${index + 1}: ${fix.description} - ${matches.length} occurrence(s)`);
    content = content.replace(fix.search, fix.replace);
    fixCount += matches.length;
  } else {
    console.log(`ℹ️  Fix ${index + 1}: ${fix.description} - No matches (may already be fixed)`);
  }
});

console.log(`\n📝 Writing updated file...`);
fs.writeFileSync(filePath, content, 'utf8');

console.log(`\n✅ COMPLETE`);
console.log(`Total fixes applied: ${fixCount}`);
console.log(`File updated: ${filePath}`);
