import fs from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';

const TOKENS = [4, 8, 12, 16, 20, 24, 32, 40, 48];
const TARGET_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.css', '.scss']);

const JS_SPACING_REGEX = /(\b(?:m|mt|mr|mb|ml|mx|my|p|pt|pr|pb|pl|px|py|margin(?:Top|Right|Bottom|Left)?|padding(?:Top|Right|Bottom|Left)?|gap|rowGap|columnGap)\s*:\s*['"])(\d+)px(['"])/g;
const CSS_SPACING_REGEX = /(\b(?:margin(?:-top|-right|-bottom|-left)?|padding(?:-top|-right|-bottom|-left)?|gap|row-gap|column-gap)\s*:\s*)(\d+)px(\s*;)/g;

const JS_VW_REGEX = /(\b(?:width|minWidth|maxWidth)\s*:\s*['"])100vw(['"])/g;
const CSS_VW_REGEX = /(\b(?:width|min-width|max-width)\s*:\s*)100vw(\s*;)/g;

const parseArgs = (argv) => {
  const out = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;

    const eq = token.indexOf('=');
    if (eq >= 0) {
      out[token.slice(2, eq)] = token.slice(eq + 1);
      continue;
    }

    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      out[key] = next;
      i += 1;
    } else {
      out[key] = true;
    }
  }

  return out;
};

const asBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).toLowerCase().trim();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
};

const toPosix = (value) => value.replace(/\\/g, '/');

const nearestToken = (value) => {
  let best = TOKENS[0];
  let bestDiff = Math.abs(value - best);

  for (const token of TOKENS) {
    const diff = Math.abs(value - token);
    if (diff < bestDiff) {
      best = token;
      bestDiff = diff;
    }
  }

  return { token: best, diff: bestDiff };
};

const collectChangedFiles = () => {
  let output = '';

  try {
    output = execSync('git diff --name-only --cached', {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'ignore'],
      encoding: 'utf8',
    });
  } catch (_) {
    output = '';
  }

  if (!output.trim()) {
    try {
      output = execSync('git diff --name-only HEAD~1..HEAD', {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'ignore'],
        encoding: 'utf8',
      });
    } catch (_) {
      output = '';
    }
  }

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
};

const normalizeFileList = (rawList) => {
  const list = [];

  for (const rawFile of rawList) {
    const normalized = rawFile.trim();
    if (!normalized) continue;

    const ext = path.extname(normalized).toLowerCase();
    if (!TARGET_EXTENSIONS.has(ext)) continue;

    if (normalized.startsWith('src/')) {
      list.push(normalized);
      continue;
    }

    if (normalized.startsWith('kelmah-frontend/src/')) {
      list.push(normalized.slice('kelmah-frontend/'.length));
      continue;
    }
  }

  return Array.from(new Set(list));
};

const applySpacingRule = (input, maxDelta, changes, fileRelativePath) => {
  const patchWithRegex = (source, regex, label) =>
    source.replace(regex, (full, prefix, rawValue, suffix) => {
      const value = Number(rawValue);
      if (!Number.isFinite(value) || value <= 0) return full;

      const { token, diff } = nearestToken(value);
      if (diff === 0 || diff > maxDelta) return full;

      changes.push({
        file: fileRelativePath,
        rule: label,
        before: `${value}px`,
        after: `${token}px`,
      });

      return `${prefix}${token}px${suffix}`;
    });

  let next = input;
  next = patchWithRegex(next, JS_SPACING_REGEX, 'spacing-token-js');
  next = patchWithRegex(next, CSS_SPACING_REGEX, 'spacing-token-css');
  return next;
};

const applyOverflowRule = (input, changes, fileRelativePath) => {
  let next = input;

  next = next.replace(JS_VW_REGEX, (full, prefix, suffix) => {
    changes.push({
      file: fileRelativePath,
      rule: 'overflow-100vw-js',
      before: '100vw',
      after: '100%',
    });
    return `${prefix}100%${suffix}`;
  });

  next = next.replace(CSS_VW_REGEX, (full, prefix, suffix) => {
    changes.push({
      file: fileRelativePath,
      rule: 'overflow-100vw-css',
      before: '100vw',
      after: '100%',
    });
    return `${prefix}100%${suffix}`;
  });

  return next;
};

const run = async () => {
  const args = parseArgs(process.argv.slice(2));

  const apply = asBoolean(args.apply, false);
  const failOnChange = asBoolean(args['fail-on-change'] || args.failOnChange, false);
  const changedMode = asBoolean(args.changed, false);
  const maxDelta = Number(args['max-delta'] || args.maxDelta || 2);

  const reportPath = path.resolve(
    process.cwd(),
    String(args.report || '../.artifacts/ui/remediation/latest.json')
  );

  const rawFiles = [];

  if (args.files) {
    rawFiles.push(
      ...String(args.files)
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean)
    );
  }

  if (rawFiles.length === 0 && changedMode) {
    rawFiles.push(...collectChangedFiles());
  }

  if (rawFiles.length === 0) {
    rawFiles.push(...collectChangedFiles());
  }

  const files = normalizeFileList(rawFiles);

  const changes = [];
  const touchedFiles = new Set();

  for (const fileRelativePath of files) {
    const filePath = path.resolve(process.cwd(), fileRelativePath);

    let before;
    try {
      before = await fs.readFile(filePath, 'utf8');
    } catch (_) {
      continue;
    }

    let after = before;
    after = applySpacingRule(after, maxDelta, changes, fileRelativePath);
    after = applyOverflowRule(after, changes, fileRelativePath);

    if (after !== before) {
      touchedFiles.add(fileRelativePath);
      if (apply) {
        await fs.writeFile(filePath, after, 'utf8');
      }
    }
  }

  await fs.mkdir(path.dirname(reportPath), { recursive: true });

  const report = {
    generatedAt: new Date().toISOString(),
    apply,
    failOnChange,
    maxDelta,
    filesScanned: files.length,
    filesChanged: touchedFiles.size,
    changeCount: changes.length,
    touchedFiles: Array.from(touchedFiles).map(toPosix),
    changes,
  };

  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`UI auto-remediation report: ${toPosix(path.relative(process.cwd(), reportPath))}`);
  console.log(`Scanned files: ${report.filesScanned}`);
  console.log(`Changed files: ${report.filesChanged}`);
  console.log(`Applied changes: ${report.changeCount}`);

  if (failOnChange && report.filesChanged > 0) {
    process.exitCode = 1;
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
