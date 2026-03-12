const LOCAL_DEVELOPMENT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
];

const DEFAULT_PRODUCTION_ORIGINS = [
  'https://kelmah.com',
  'https://www.kelmah.com',
  'https://project-kelmah.vercel.app',
  'https://kelmah-frontend.vercel.app',
  'https://kelmah-frontend-cyan.vercel.app',
];

const LOCALTUNNEL_PATTERN = /^https:\/\/.*\.loca\.lt$/i;
const KNOWN_VERCEL_PREVIEW_PREFIXES = [
  'project-kelmah',
  'kelmah-frontend',
  'kelmah',
];

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildPreviewPattern = (prefix) =>
  new RegExp(`^https://${escapeRegExp(prefix)}(?:-[a-z0-9-]+)?\\.vercel\\.app$`, 'i');

const KNOWN_VERCEL_PREVIEW_PATTERNS = KNOWN_VERCEL_PREVIEW_PREFIXES.map(buildPreviewPattern);

const parseOrigins = (value) =>
  String(value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const uniqueOrigins = (origins) => Array.from(new Set(origins.filter(Boolean)));

const buildAllowedOrigins = ({
  nodeEnv = process.env.NODE_ENV,
  frontendUrl = process.env.FRONTEND_URL,
  envOrigins = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGINS,
  localTunnelUrl = process.env.LOCALTUNNEL_URL,
} = {}) => {
  const isProduction = nodeEnv === 'production';

  const origins = [
    ...LOCAL_DEVELOPMENT_ORIGINS,
    ...DEFAULT_PRODUCTION_ORIGINS,
    frontendUrl,
    ...parseOrigins(envOrigins),
    ...(!isProduction ? parseOrigins(localTunnelUrl) : []),
  ];

  return uniqueOrigins(origins);
};

const createOriginMatcher = (options = {}) => {
  const allowedOrigins = buildAllowedOrigins(options);
  const isProduction = (options.nodeEnv || process.env.NODE_ENV) === 'production';

  return {
    allowedOrigins,
    isAllowedOrigin(origin) {
      if (!origin) {
        return true;
      }

      if (allowedOrigins.includes(origin)) {
        return true;
      }

      if (KNOWN_VERCEL_PREVIEW_PATTERNS.some((pattern) => pattern.test(origin))) {
        return true;
      }

      if (!isProduction && LOCALTUNNEL_PATTERN.test(origin)) {
        return true;
      }

      return false;
    },
  };
};

module.exports = {
  buildAllowedOrigins,
  createOriginMatcher,
};