// Understanding Express Route Matching with Query Strings

const express = require('express');
const app = express();

const router = express.Router();

// Mount router at /api/jobs
app.use('/api/jobs', router);

// Define route
router.get('/', (req, res) => {
  console.log('Route matched!');
  console.log('req.path:', req.path);
  console.log('req.url:', req.url);
  console.log('req.query:', req.query);
  res.json({ success: true });
});

// Test different URLs
console.log('='.repeat(80));
console.log('TESTING EXPRESS ROUTE MATCHING');
console.log('='.repeat(80));

const testUrls = [
  '/api/jobs',
  '/api/jobs/',
  '/api/jobs?status=open',
  '/api/jobs/?status=open',
];

// Simulate requests
app._router.stack.forEach(layer => {
  if (layer.name === 'router' && layer.regexp.test('/api/jobs')) {
    console.log('\nRouter found for /api/jobs');
    console.log('Regexp:', layer.regexp);
  }
});

console.log('\n' + '='.repeat(80));
console.log('Expected behavior:');
console.log('/api/jobs → router receives: /');
console.log('/api/jobs/ → router receives: /');
console.log('/api/jobs?status=open → router receives: /?status=open');
console.log('/api/jobs/?status=open → router receives: /?status=open');
console.log('='.repeat(80));
