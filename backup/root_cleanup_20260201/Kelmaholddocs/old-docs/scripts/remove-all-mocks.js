#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Directories to scan for mock data
const SCAN_DIRECTORIES = [
  './src',
  './modules',
  './components',
  './services'
];

function getAllFiles(dir) {
  const files = [];
  
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      files.push(...getAllFiles(fullPath));
    } else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function removeMockDataFromFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Remove mock data patterns
    const mockPatterns = [
      /const\s+mockData\s*=\s*[\s\S]*?;/g,
      /\/\*\s*MOCK\s*DATA[\s\S]*?\*\//g,
      /\/\/\s*MOCK:[\s\S]*?$/gm,
      /return\s*{[^}]*mock[^}]*}/gi
    ];
    
    for (const pattern of mockPatterns) {
      const newContent = content.replace(pattern, '');
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    }
    
    // Fix catch blocks to throw errors instead of returning mock data
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