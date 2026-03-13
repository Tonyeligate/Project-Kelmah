const normalizeString = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : '';

const DEFAULT_ALLOWED_EXTERNAL_HOSTS = [
  'kelmah.com',
  'www.kelmah.com',
  'project-kelmah.vercel.app',
  'kelmah-frontend.vercel.app',
  'kelmah-frontend-cyan.vercel.app',
  'meet.google.com',
  'zoom.us',
  'teams.microsoft.com',
  'calendar.google.com',
  'google.com',
  'www.google.com',
  'maps.google.com',
  'paystack.com',
  'checkout.paystack.com',
  'wa.me',
  'api.whatsapp.com',
];

const EXTRA_ALLOWED_EXTERNAL_HOSTS = String(
  import.meta.env.VITE_ALLOWED_EXTERNAL_LINK_HOSTS || '',
)
  .split(',')
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

const asHostSet = (hosts) => {
  if (!hosts) return new Set();
  if (hosts instanceof Set) return new Set([...hosts].map((h) => String(h).toLowerCase()));
  if (Array.isArray(hosts)) return new Set(hosts.map((h) => String(h).toLowerCase()));
  return new Set([String(hosts).toLowerCase()]);
};

export const ALLOWED_EXTERNAL_HOSTS = new Set([
  ...DEFAULT_ALLOWED_EXTERNAL_HOSTS,
  ...EXTRA_ALLOWED_EXTERNAL_HOSTS,
]);

export const MEETING_ALLOWED_HOSTS = new Set([
  'meet.google.com',
  'zoom.us',
  'teams.microsoft.com',
  ...ALLOWED_EXTERNAL_HOSTS,
]);

export const GOOGLE_MAPS_ALLOWED_HOSTS = new Set([
  'google.com',
  'www.google.com',
  'maps.google.com',
  ...ALLOWED_EXTERNAL_HOSTS,
]);

export const NOTIFICATION_ALLOWED_HOSTS = new Set(ALLOWED_EXTERNAL_HOSTS);

const isHostAllowed = (hostname, allowedHosts) => {
  const normalizedHost = String(hostname || '').toLowerCase();
  if (!normalizedHost) return false;

  for (const allowedHost of allowedHosts) {
    if (
      normalizedHost === allowedHost ||
      normalizedHost.endsWith(`.${allowedHost}`)
    ) {
      return true;
    }
  }

  return false;
};

export const isSafeInternalPath = (value) => {
  const normalized = normalizeString(value);
  if (!normalized) return false;

  return (
    normalized.startsWith('/') &&
    !normalized.startsWith('//') &&
    !/[\r\n]/.test(normalized)
  );
};

export const sanitizeExternalUrl = (value, options = {}) => {
  const {
    allowedHosts = ALLOWED_EXTERNAL_HOSTS,
    requireHttps = true,
  } = options;

  const normalized = normalizeString(value);
  if (!normalized) return null;

  try {
    const parsed = new URL(normalized);
    const protocol = parsed.protocol.toLowerCase();

    if (protocol !== 'http:' && protocol !== 'https:') {
      return null;
    }

    if (requireHttps && protocol !== 'https:') {
      return null;
    }

    const hostAllowlist = asHostSet(allowedHosts);
    if (hostAllowlist.size > 0 && !isHostAllowed(parsed.hostname, hostAllowlist)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
};

export const isSafeExternalUrl = (value, options = {}) =>
  Boolean(sanitizeExternalUrl(value, options));

export const openExternalUrl = (value, options = {}) => {
  const safeUrl = sanitizeExternalUrl(value, options);
  if (!safeUrl) {
    return false;
  }

  window.open(safeUrl, '_blank', 'noopener,noreferrer');
  return true;
};
