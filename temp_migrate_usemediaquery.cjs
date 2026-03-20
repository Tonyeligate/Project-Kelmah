const fs = require('fs');
const path = require('path');

const ROOT = path.join(process.cwd(), 'kelmah-frontend', 'src');
const EXCLUDED = path.join('kelmah-frontend', 'src', 'hooks', 'useResponsive.js').replace(/\\/g, '/');

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (/\.(js|jsx|ts|tsx)$/i.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function splitSpecifiers(inner) {
  return inner
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function replaceNamedImport(text, source, removeNames = []) {
  const re = new RegExp(`import\\s*{([\\s\\S]*?)}\\s*from\\s*['\"]${escapeRegExp(source)}['\"];?`, 'g');
  return text.replace(re, (_m, inner) => {
    let specs = splitSpecifiers(inner);
    specs = specs.filter((s) => !removeNames.includes(s));
    if (!specs.length) {
      return '';
    }
    return `import { ${specs.join(', ')} } from '${source}';`;
  });
}

function upsertNamedImport(text, source, addNames = []) {
  const re = new RegExp(`import\\s*{([\\s\\S]*?)}\\s*from\\s*['\"]${escapeRegExp(source)}['\"];?`, 'g');
  const match = re.exec(text);

  if (match) {
    const existing = splitSpecifiers(match[1]);
    const merged = [...new Set([...existing, ...addNames])];
    const replacement = `import { ${merged.join(', ')} } from '${source}';`;
    return text.slice(0, match.index) + replacement + text.slice(match.index + match[0].length);
  }

  const importMatches = [...text.matchAll(/import[\s\S]*?from\s*['"][^'"]+['"];?\r?\n/g)];
  const importLine = `import { ${[...new Set(addNames)].join(', ')} } from '${source}';\n`;
  if (!importMatches.length) {
    return importLine + text;
  }

  const last = importMatches[importMatches.length - 1];
  const insertAt = last.index + last[0].length;
  return text.slice(0, insertAt) + importLine + text.slice(insertAt);
}

const files = walk(ROOT)
  .map((f) => ({ full: f, rel: path.relative(process.cwd(), f).replace(/\\/g, '/') }))
  .filter(({ rel }) => rel !== EXCLUDED)
  .filter(({ rel }) => !/\.test\.(js|jsx|ts|tsx)$/i.test(rel));

const touched = [];
const unresolved = [];

for (const file of files) {
  let text = fs.readFileSync(file.full, 'utf8');
  const original = text;

  if (!/useMediaQuery\s*\(/.test(text)) {
    continue;
  }

  text = text.replace(/useMediaQuery\(\s*theme\.breakpoints\.down\(\s*'md'\s*\)\s*\)/g, "useBreakpointDown('md')");
  text = text.replace(/useMediaQuery\(\s*theme\.breakpoints\.down\(\s*'sm'\s*\)\s*\)/g, "useBreakpointDown('sm')");
  text = text.replace(/useMediaQuery\(\s*theme\.breakpoints\.down\(\s*'lg'\s*\)\s*\)/g, "useBreakpointDown('lg')");

  text = text.replace(/useMediaQuery\(\s*theme\.breakpoints\.up\(\s*'md'\s*\)\s*\)/g, "useBreakpointUp('md')");
  text = text.replace(/useMediaQuery\(\s*theme\.breakpoints\.up\(\s*'lg'\s*\)\s*\)/g, "useBreakpointUp('lg')");

  text = text.replace(/useMediaQuery\(\s*theme\.breakpoints\.between\(\s*'sm'\s*,\s*'md'\s*\)\s*\)/g, "useBreakpointBetween('sm', 'md')");

  text = text.replace(/useMediaQuery\(\s*\(\s*\w+\s*\)\s*=>\s*\w+\.breakpoints\.down\(\s*'([a-z]+)'\s*\)\s*\)/g, (_m, bp) => `useBreakpointDown('${bp}')`);

  text = text.replace(/useMediaQuery\(\s*['"]\(max-width:\s*(\d+)px\)['"]\s*\)/g, (_m, px) => `useMaxWidth(${px})`);

  const neededHooks = [];
  if (/\buseBreakpointDown\s*\(/.test(text)) neededHooks.push('useBreakpointDown');
  if (/\buseBreakpointUp\s*\(/.test(text)) neededHooks.push('useBreakpointUp');
  if (/\buseBreakpointBetween\s*\(/.test(text)) neededHooks.push('useBreakpointBetween');
  if (/\buseMaxWidth\s*\(/.test(text)) neededHooks.push('useMaxWidth');

  text = text.replace(/^\s*import\s+useMediaQuery\s+from\s+['"]@mui\/material\/useMediaQuery['"];?\r?\n/gm, '');
  text = replaceNamedImport(text, '@mui/material', ['useMediaQuery']);

  if (!/\buseTheme\s*\(/.test(text)) {
    text = replaceNamedImport(text, '@mui/material', ['useTheme']);
    text = replaceNamedImport(text, '@mui/material/styles', ['useTheme']);
  }

  if (neededHooks.length) {
    text = upsertNamedImport(text, '@/hooks/useResponsive', neededHooks);
  }

  text = text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\r?\n\s*\r?\n\s*\r?\n/g, '\n\n');

  const hasUnresolved = /\buseMediaQuery\s*\(/.test(text);
  if (hasUnresolved) {
    unresolved.push(file.rel);
  }

  if (text !== original) {
    fs.writeFileSync(file.full, text, 'utf8');
    touched.push(file.rel);
  }
}

console.log('TOUCHED_COUNT=' + touched.length);
for (const rel of touched) console.log('TOUCHED ' + rel);
console.log('UNRESOLVED_COUNT=' + unresolved.length);
for (const rel of unresolved) console.log('UNRESOLVED ' + rel);
