#!/usr/bin/env node

/**
 * 🚀 GOD MODE: Remove ALL Mock Data Script
 * 
 * This script systematically removes all mock data fallbacks from the entire codebase
 * and replaces them with proper error handling and empty data structures.
 */

const fs = require('fs');
const path = require('path');

// Directories to scan for mock data
const SCAN_DIRECTORIES = [
  'kelmah-frontend/src/modules',
  'kelmah-frontend/src/api',
  'kelmah-frontend/src/components'
];

// Patterns to identify and replace mock data
const MOCK_PATTERNS = [
  // Console warnings about using mock data
  {
    search: /console\.warn\(\s*['"](.*?)using mock data['"]/g,
    replace: 'console.warn($1service unavailable'
  },
  // Mock data return objects - common patterns
  {
    search: /return\s*{\s*workers:\s*\[[\s\S]*?\],?\s*}/g,
    replace: 'return { workers: [] }'
  },
  {
    search: /return\s*{\s*jobs:\s*\[[\s\S]*?\],?\s*}/g,
    replace: 'return { jobs: [] }'
  },
  {
    search: /return\s*{\s*contracts:\s*\[[\s\S]*?\],?\s*}/g,
    replace: 'return { contracts: [] }'
  },
  {
    search: /return\s*{\s*notifications:\s*\[[\s\S]*?\],?\s*}/g,
    replace: 'return { notifications: [] }'
  },
  {
    search: /return\s*{\s*conversations:\s*\[[\s\S]*?\],?\s*}/g,
    replace: 'return { conversations: [] }'
  },
  {
    search: /return\s*{\s*methods:\s*\[[\s\S]*?\],?\s*}/g,
    replace: 'return { methods: [] }'
  },
  {
    search: /return\s*{\s*transactions:\s*\[[\s\S]*?\],?\s*}/g,
    replace: 'return { transactions: [] }'
  },
  {
    search: /return\s*{\s*escrows:\s*\[[\s\S]*?\],?\s*}/g,
    replace: 'return { escrows: [] }'
  },
  {
    search: /return\s*{\s*bills:\s*\[[\s\S]*?\],?\s*}/g,
    replace: 'return { bills: [] }'
  },
  {
    search: /return\s*{\s*applications:\s*\[[\s\S]*?\],?\s*}/g,
    replace: 'return { applications: [] }'
  },
  // Default values for common data structures
  {
    search: /balance:\s*\d+\.?\d*/g,
    replace: 'balance: 0'
  },
  {
    search: /currency:\s*['"][^'"]*['"]/g,
    replace: 'currency: "GHS"'
  }
];

// Specific large mock data blocks to remove entirely
const LARGE_MOCK_BLOCKS = [
  // Large arrays with multiple mock objects
  /\[[\s\S]*?{\s*id:\s*['"][^'"]*['"][\s\S]*?}\s*,?\s*\]/g,
  // Mock objects with detailed properties
  /{\s*id:\s*['"][^'"]*['"][\s\S]*?createdAt:[\s\S]*?}/g
];

function getAllFiles(dirPath, filePattern = /\.(js|jsx|ts|tsx)$/) {
  const files = [];
  
  function scanDirectory(currentPath) {
    try {
      const items = fs.readdirSync(currentPath);
      
      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'build') {
          scanDirectory(fullPath);
        } else if (stat.isFile() && filePattern.test(item)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Cannot read directory ${currentPath}:`, error.message);
    }
  }
  
  scanDirectory(dirPath);
  return files;
}

function removeMockDataFromFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Remove large mock data blocks first
    for (const pattern of LARGE_MOCK_BLOCKS) {
      const newContent = content.replace(pattern, '[]');
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    }
    
    // Apply pattern-based replacements
    for (const pattern of MOCK_PATTERNS) {
      const newContent = content.replace(pattern.search, pattern.replace);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    }
    
    // Specific replacements for common mock data structures
    content = content.replace(
      /\/\/ Mock data[\s\S]*?return\s*{[\s\S]*?};/g,
      'return { data: [] };'
    );
    
    content = content.replace(
      /\/\*\*[\s\S]*?Mock[\s\S]*?\*\//g,
      ''
    );
    
    // Clean up empty catch blocks with just mock returns
    content = content.replace(
      /catch\s*\([^)]*\)\s*{\s*console\.warn\([^}]*\);\s*return\s*{[^}]*};\s*}/g,
      'catch (error) {\n      console.warn(\'Service unavailable:\', error.message);\n      throw error;\n    }'
    );
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 GOD MODE: Removing ALL Mock Data from Codebase\n');
  
  let totalFiles = 0;
  let modifiedFiles = 0;
  
  for (const directory of SCAN_DIRECTORIES) {
    const fullPath = path.resolve(directory);
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️  Directory not found: ${directory}`);
      continue;
    }
    
    console.log(`📁 Scanning: ${directory}`);
    const files = getAllFiles(fullPath);
    
    for (const file of files) {
      totalFiles++;
      
      if (removeMockDataFromFile(file)) {
        modifiedFiles++;
        const relativePath = path.relative(process.cwd(), file);
        console.log(`  ✅ Modified: ${relativePath}`);
      }
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   📄 Total files scanned: ${totalFiles}`);
  console.log(`   🔧 Files modified: ${modifiedFiles}`);
  console.log(`   🚀 Mock data removal complete!\n`);
  
  if (modifiedFiles > 0) {
    console.log('🎯 Next steps:');
    console.log('   1. Review the changes');
    console.log('   2. Test the application');
    console.log('   3. Commit the changes');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { removeMockDataFromFile, getAllFiles };