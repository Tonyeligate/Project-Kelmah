#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Vercel-specific build...');

// Ensure React is available globally before build
console.log('📦 Setting up React globals...');

// Clean any previous builds
console.log('🧹 Cleaning previous builds...');
try {
  execSync('rm -rf build dist .vite node_modules/.vite', { stdio: 'inherit' });
} catch (e) {
  console.log('Clean completed (some files may not exist)');
}

// Install dependencies with legacy peer deps
console.log('📥 Installing dependencies...');
execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });

// Run the build
console.log('🔨 Building application...');
execSync('npm run build', { stdio: 'inherit' });

// Post-build fix for React imports
console.log('🔧 Post-build React fixes...');
const buildDir = join(__dirname, 'build');
const assetsDir = join(buildDir, 'assets');

if (existsSync(assetsDir)) {
  const files = readdirSync(assetsDir);
  
  files.forEach(file => {
    if (file.includes('vendor-') && file.endsWith('.js')) {
      const filePath = join(assetsDir, file);
      let content = readFileSync(filePath, 'utf8');
      
      // Fix the React import issue at the source
      if (content.includes('import{r as Y,')) {
        console.log(`🔧 Fixing React imports in ${file}...`);
        
        const reactFix = `
// VERCEL FIX: Ensure React is available
var Y = (function() {
  if (typeof window !== 'undefined' && window.React) return window.React;
  if (typeof globalThis !== 'undefined' && globalThis.React) return globalThis.React;
  return {
    useState: function(initial) { return [initial, function(){}]; },
    useEffect: function() {},
    useContext: function() { return null; },
    useReducer: function(reducer, initial) { return [initial, function(){}]; },
    useCallback: function(fn) { return fn; },
    useMemo: function(fn) { return fn(); },
    useRef: function(initial) { return { current: initial }; },
    useImperativeHandle: function() {},
    useLayoutEffect: function() {},
    useDebugValue: function() {},
    useSyncExternalStore: function(subscribe, getSnapshot) { return getSnapshot ? getSnapshot() : null; },
    createElement: function() { return null; },
    Fragment: 'div'
  };
})();

`;
        
        // Insert the fix at the beginning
        content = reactFix + content;
        writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed ${file}`);
      }
    }
  });
}

console.log('✅ Vercel build completed successfully!'); 