const fs = require('fs');
const path = require('path');

const INCLUDE_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.html']);
const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage']);

const replacements = [
  { find: new RegExp('\uFFFD', 'g'), replace: '' },
  { find: new RegExp('\u2193', 'g'), replace: '↓' },
  { find: new RegExp('\u2192', 'g'), replace: '→' },
  { find: new RegExp('\u2713', 'g'), replace: '✓' },
  { find: new RegExp('\u2022', 'g'), replace: '•' },
  { find: new RegExp('\u261D\uFE0F', 'g'), replace: '☝️' },
  { find: new RegExp('\u20B5', 'g'), replace: '₵' },
  { find: new RegExp('\u2013', 'g'), replace: '–' },
  { find: new RegExp('\u2014', 'g'), replace: '—' },
  { find: new RegExp('\u2018', 'g'), replace: "'" },
  { find: new RegExp('\u2019', 'g'), replace: "'" },
  { find: new RegExp('\u201C', 'g'), replace: '"' },
  { find: new RegExp('\u201D', 'g'), replace: '"' },
];

let filesProcessed = 0;
let filesChanged = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!INCLUDE_EXTS.has(ext)) continue;

    filesProcessed += 1;
    let content = fs.readFileSync(fullPath, 'utf8');
    const original = content;

    replacements.forEach(({ find, replace }) => {
      content = content.replace(find, replace);
    });

    if (content !== original) {
      filesChanged += 1;
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Patched: ${fullPath}`);
    }
  }
}

function main() {
  const root = path.resolve(__dirname, '..');
  walk(root);
  console.log('Done. filesProcessed=', filesProcessed, 'filesChanged=', filesChanged);
}

main();
