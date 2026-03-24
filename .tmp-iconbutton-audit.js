const fs = require('fs');
const path = require('path');

const root = 'kelmah-frontend/src/modules';
const exts = new Set(['.js', '.jsx', '.ts', '.tsx']);
const rows = [];

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(full);
      continue;
    }
    if (!exts.has(path.extname(e.name))) {
      continue;
    }
    const src = fs.readFileSync(full, 'utf8');
    const tags = [...src.matchAll(/<IconButton\b[\s\S]*?>/g)];
    if (!tags.length) {
      continue;
    }

    let localSx = 0;
    let localFocus = 0;
    for (const m of tags) {
      const t = m[0];
      if (/\bsx\s*=/.test(t)) localSx++;
      if (/focus-visible|Mui-focusVisible/.test(t)) localFocus++;
    }

    rows.push({
      file: full.replace(/\\/g, '/'),
      total: tags.length,
      localSx,
      localFocus,
      noLocalSx: tags.length - localSx,
      noLocalFocus: tags.length - localFocus,
    });
  }
}

walk(root);
rows.sort((a, b) => b.noLocalFocus - a.noLocalFocus || b.noLocalSx - a.noLocalSx || a.file.localeCompare(b.file));

const summary = {
  generatedAt: new Date().toISOString(),
  scope: root,
  filesWithIconButtons: rows.length,
  totalIconButtons: rows.reduce((s, r) => s + r.total, 0),
  totalWithLocalSx: rows.reduce((s, r) => s + r.localSx, 0),
  totalWithLocalFocus: rows.reduce((s, r) => s + r.localFocus, 0),
  totalWithoutLocalSx: rows.reduce((s, r) => s + r.noLocalSx, 0),
  totalWithoutLocalFocus: rows.reduce((s, r) => s + r.noLocalFocus, 0),
};

const outDir = 'spec-kit/generated';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(
  path.join(outDir, 'ICONBUTTON_LOCAL_COVERAGE_MAR24_2026.json'),
  JSON.stringify({ summary, rows }, null, 2)
);

let md = '# IconButton Local Coverage Audit (Mar 24, 2026)\n\n';
md += '## Summary\n';
md += '- Scope: ' + summary.scope + '\n';
md += '- Files with IconButton: ' + summary.filesWithIconButtons + '\n';
md += '- Total IconButton tags: ' + summary.totalIconButtons + '\n';
md += '- With local sx: ' + summary.totalWithLocalSx + '\n';
md += '- With local focus-visible in tag: ' + summary.totalWithLocalFocus + '\n';
md += '- Without local sx: ' + summary.totalWithoutLocalSx + '\n';
md += '- Without local focus-visible in tag: ' + summary.totalWithoutLocalFocus + '\n\n';

md += '## Top Files By Missing Local Focus\n';
md += '| File | Total | Local sx | Local focus | Missing local sx | Missing local focus |\n';
md += '|---|---:|---:|---:|---:|---:|\n';
for (const r of rows.slice(0, 120)) {
  md += '| ' + r.file + ' | ' + r.total + ' | ' + r.localSx + ' | ' + r.localFocus + ' | ' + r.noLocalSx + ' | ' + r.noLocalFocus + ' |\n';
}

fs.writeFileSync(path.join(outDir, 'ICONBUTTON_LOCAL_COVERAGE_MAR24_2026.md'), md);

console.log('WROTE spec-kit/generated/ICONBUTTON_LOCAL_COVERAGE_MAR24_2026.json');
console.log('WROTE spec-kit/generated/ICONBUTTON_LOCAL_COVERAGE_MAR24_2026.md');
console.log('SUMMARY ' + JSON.stringify(summary));