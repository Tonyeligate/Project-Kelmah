#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Paths to messaging components to refactor
const filesToRefactor = [
  '../kelmah-frontend/src/modules/messaging/components/common/ConversationList.jsx',
  '../kelmah-frontend/src/modules/messaging/components/common/ChatWindow.jsx'
];

filesToRefactor.forEach(relativePath => {
  const componentPath = path.join(__dirname, relativePath);
  let code = fs.readFileSync(componentPath, 'utf8');

  // Perform replacements
  code = code
    // Dark overlay for paper backgrounds
    .replace(/rgba\\(26, 26, 26, ([0-9.]+)\\)/g, 'alpha(theme.palette.primary.main, $1)')
    .replace(/rgba\\(255, 215, 0, ([0-9.]+)\\)/g, 'alpha(theme.palette.secondary.main, $1)')
    .replace(/rgba\\(255, 255, 255, ([0-9.]+)\\)/g, 'alpha(theme.palette.common.white, $1)');

  // Write back
  fs.writeFileSync(componentPath, code, 'utf8');
  console.log(`Refactored inline rgba colors in ${relativePath}`);
});

console.log('Refactored inline rgba colors to theme alpha in ConversationList.jsx'); 