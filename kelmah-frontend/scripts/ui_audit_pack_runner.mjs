import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const MODES = new Set(['capture', 'baseline', 'compare', 'ensure-baselines']);
const REQUIRED_VIEWPORTS = ['320', '768', '1024', '1440'];

const toSafeSegment = (value) =>
  String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const toPosix = (value) => value.replace(/\\/g, '/');

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

const parseMode = () => {
  const maybeMode = process.argv[2];
  const mode = MODES.has(maybeMode) ? maybeMode : 'compare';
  const args = parseArgs(process.argv.slice(MODES.has(maybeMode) ? 3 : 2));
  return { mode, args };
};

const exists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch (_) {
    return false;
  }
};

const runNode = (args, label) => {
  const result = spawnSync('node', args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? 'unknown'}`);
  }
};

const loadRoutePack = async (packName, configPath) => {
  const raw = await fs.readFile(configPath, 'utf8');
  const parsed = JSON.parse(raw);
  const effectivePack = packName || parsed.defaultPack;

  if (!effectivePack || !parsed.packs || !parsed.packs[effectivePack]) {
    throw new Error(`Route pack '${effectivePack || ''}' not found in ${configPath}`);
  }

  const pack = parsed.packs[effectivePack];
  const routes = Array.isArray(pack.routes) ? pack.routes : [];
  if (routes.length === 0) {
    throw new Error(`Route pack '${effectivePack}' has no routes`);
  }

  return {
    packName: effectivePack,
    description: pack.description || '',
    routes,
  };
};

const getBaselinePath = (workspaceRoot, baselineId, viewportKey) =>
  path.resolve(workspaceRoot, '.artifacts', 'ui', 'baselines', baselineId, `${viewportKey}.png`);

const hasCompleteBaseline = async (workspaceRoot, baselineId) => {
  for (const viewportKey of REQUIRED_VIEWPORTS) {
    const target = getBaselinePath(workspaceRoot, baselineId, viewportKey);
    if (!(await exists(target))) {
      return false;
    }
  }
  return true;
};

const buildAuditArgs = ({
  mode,
  route,
  routeTaskId,
  baseUrl,
  baselineId,
  strict,
}) => {
  const args = [
    'scripts/ui_audit_runner.mjs',
    mode,
    '--task-id',
    routeTaskId,
    '--route',
    route.path,
    '--base-url',
    baseUrl,
  ];

  if (mode === 'baseline' || mode === 'compare') {
    args.push('--baseline-id', baselineId);
  }

  if (strict) {
    args.push('--strict', 'true');
  }

  if (route.mockAuth) {
    args.push('--mock-auth', 'true');
  }

  if (route.mockRole) {
    args.push('--mock-role', String(route.mockRole));
  }

  if (route.mockApplications) {
    args.push('--mock-applications', 'true');
  }

  if (route.mockPublicData) {
    args.push('--mock-public-data', 'true');
  }

  if (route.authEmail) {
    args.push('--auth-email', String(route.authEmail));
  }

  if (route.authPassword) {
    args.push('--auth-password', String(route.authPassword));
  }

  if (route.loginPath) {
    args.push('--login-path', String(route.loginPath));
  }

  return args;
};

const readRouteReport = async (workspaceRoot, routeTaskId) => {
  const reportPath = path.resolve(workspaceRoot, '.artifacts', 'ui', routeTaskId, 'capture-report.json');
  if (!(await exists(reportPath))) {
    return {
      reportPath: toPosix(path.relative(workspaceRoot, reportPath)),
      found: false,
      score: null,
      pass: false,
    };
  }

  const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
  return {
    reportPath: toPosix(path.relative(workspaceRoot, reportPath)),
    found: true,
    score: report?.scorecard?.totalScore ?? null,
    pass: report?.scorecard?.pass ?? false,
  };
};

const writePackReport = async ({
  workspaceRoot,
  taskId,
  mode,
  packName,
  baseUrl,
  routeResults,
}) => {
  const outDir = path.resolve(workspaceRoot, '.artifacts', 'ui', 'packs', taskId);
  await fs.mkdir(outDir, { recursive: true });

  const overallPass = routeResults.every((r) => r.ok === true);
  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    packName,
    baseUrl,
    overallPass,
    routes: routeResults,
  };

  const outPath = path.resolve(outDir, 'pack-report.json');
  await fs.writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`Pack report: ${toPosix(path.relative(workspaceRoot, outPath))}`);
  return overallPass;
};

const run = async () => {
  const { mode, args } = parseMode();

  const configPath = path.resolve(
    process.cwd(),
    String(args.config || 'scripts/ui_audit_route_packs.json')
  );
  const packInfo = await loadRoutePack(args.pack, configPath);

  const packName = packInfo.packName;
  const baseUrl = String(args['base-url'] || process.env.UI_AUDIT_BASE_URL || 'http://127.0.0.1:3000');
  const strict = asBoolean(args.strict, false);
  const autoBaseline = asBoolean(args['auto-baseline'], false);

  const defaultTaskId = `${mode}-${packName}-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const taskId = toSafeSegment(args['task-id'] || defaultTaskId);
  if (!taskId) {
    throw new Error('Invalid --task-id value');
  }

  const workspaceRoot = path.resolve(process.cwd(), '..');
  const routeResults = [];

  for (const route of packInfo.routes) {
    const routeId = toSafeSegment(route.id || route.path);
    const routeTaskId = toSafeSegment(`${taskId}-${routeId}`);
    const baselineId = toSafeSegment(route.baselineId || `${packName}-${routeId}`);

    if (mode === 'ensure-baselines') {
      const complete = await hasCompleteBaseline(workspaceRoot, baselineId);
      if (complete) {
        routeResults.push({
          routeId,
          routePath: route.path,
          baselineId,
          mode: 'baseline-check',
          ok: true,
          skipped: true,
          reason: 'baseline-exists',
        });
        continue;
      }

      const seedTaskId = toSafeSegment(`baseline-seed-${baselineId}`);
      const baselineArgs = buildAuditArgs({
        mode: 'baseline',
        route,
        routeTaskId: seedTaskId,
        baseUrl,
        baselineId,
        strict,
      });

      try {
        runNode(baselineArgs, `baseline seed for ${route.path}`);
        routeResults.push({
          routeId,
          routePath: route.path,
          baselineId,
          mode: 'baseline',
          ok: true,
          skipped: false,
        });
      } catch (error) {
        routeResults.push({
          routeId,
          routePath: route.path,
          baselineId,
          mode: 'baseline',
          ok: false,
          skipped: false,
          error: error.message,
        });
      }

      continue;
    }

    if (mode === 'compare') {
      const baselineExists = await hasCompleteBaseline(workspaceRoot, baselineId);
      if (!baselineExists) {
        if (!autoBaseline) {
          routeResults.push({
            routeId,
            routePath: route.path,
            baselineId,
            mode,
            ok: false,
            error: `Baseline '${baselineId}' is missing. Run ui:pack:ensure-baselines or ui:pack:baseline first.`,
          });
          continue;
        }

        const seedTaskId = toSafeSegment(`baseline-seed-${baselineId}`);
        const seedArgs = buildAuditArgs({
          mode: 'baseline',
          route,
          routeTaskId: seedTaskId,
          baseUrl,
          baselineId,
          strict,
        });

        try {
          runNode(seedArgs, `auto baseline seed for ${route.path}`);
        } catch (error) {
          routeResults.push({
            routeId,
            routePath: route.path,
            baselineId,
            mode: 'baseline',
            ok: false,
            error: `Auto baseline failed: ${error.message}`,
          });
          continue;
        }
      }
    }

    const auditArgs = buildAuditArgs({
      mode,
      route,
      routeTaskId,
      baseUrl,
      baselineId,
      strict,
    });

    try {
      runNode(auditArgs, `${mode} for ${route.path}`);
      const routeReport = await readRouteReport(workspaceRoot, routeTaskId);
      routeResults.push({
        routeId,
        routePath: route.path,
        baselineId,
        mode,
        ok: true,
        reportPath: routeReport.reportPath,
        score: routeReport.score,
        pass: routeReport.pass,
      });
    } catch (error) {
      const routeReport = await readRouteReport(workspaceRoot, routeTaskId);
      routeResults.push({
        routeId,
        routePath: route.path,
        baselineId,
        mode,
        ok: false,
        reportPath: routeReport.reportPath,
        score: routeReport.score,
        pass: routeReport.pass,
        error: error.message,
      });
    }
  }

  const packPass = await writePackReport({
    workspaceRoot,
    taskId,
    mode,
    packName,
    baseUrl,
    routeResults,
  });

  if (!packPass) {
    process.exitCode = 1;
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
