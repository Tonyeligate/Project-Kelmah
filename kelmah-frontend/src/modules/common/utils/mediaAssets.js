const asTrimmedString = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : '';

const DEFAULT_ALLOWED_MEDIA_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  'kelmah.com',
  'www.kelmah.com',
  'project-kelmah.vercel.app',
  'kelmah-frontend.vercel.app',
  'kelmah-frontend-cyan.vercel.app',
  'res.cloudinary.com',
  'lh3.googleusercontent.com',
  'secure.gravatar.com',
  'cdnjs.cloudflare.com',
  'basemaps.cartocdn.com',
  'tile.openstreetmap.org',
]);

const EXTRA_ALLOWED_MEDIA_HOSTS = String(
  import.meta.env.VITE_ALLOWED_MEDIA_HOSTS || '',
)
  .split(',')
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

const ALLOWED_MEDIA_HOSTS = new Set([
  ...DEFAULT_ALLOWED_MEDIA_HOSTS,
  ...EXTRA_ALLOWED_MEDIA_HOSTS,
]);

const isAllowedMediaUrl = (value) => {
  const normalized = asTrimmedString(value);
  if (!normalized) {
    return false;
  }

  if (
    normalized.startsWith('/') ||
    normalized.startsWith('./') ||
    normalized.startsWith('../') ||
    normalized.startsWith('blob:') ||
    normalized.startsWith('data:image/')
  ) {
    return true;
  }

  try {
    const parsed = new URL(normalized);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    if (
      typeof window !== 'undefined' &&
      parsed.origin === window.location.origin
    ) {
      return true;
    }

    return ALLOWED_MEDIA_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
};

const sanitizeMediaUrl = (value) => {
  const normalized = asTrimmedString(value);
  return isAllowedMediaUrl(normalized) ? normalized : '';
};

const truncateText = (value, maxLength = 32) => {
  const normalized = asTrimmedString(value);
  if (!normalized) return '';
  return normalized.length > maxLength
    ? `${normalized.slice(0, Math.max(0, maxLength - 1))}…`
    : normalized;
};

const escapeSvgText = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const flattenSources = (sources = []) =>
  sources.flatMap((source) => {
    if (Array.isArray(source)) {
      return flattenSources(source);
    }
    return [source];
  });

export const resolveMediaAssetUrl = (asset, options = {}) => {
  const { preferThumbnail = false } = options;

  if (!asset) {
    return '';
  }

  if (typeof asset === 'string') {
    return sanitizeMediaUrl(asset);
  }

  if (Array.isArray(asset)) {
    for (const item of asset) {
      const resolved = resolveMediaAssetUrl(item, options);
      if (resolved) {
        return resolved;
      }
    }
    return '';
  }

  if (typeof asset !== 'object') {
    return '';
  }

  const preferredCandidates = preferThumbnail
    ? [
        asset.thumbnailUrl,
        asset.previewUrl,
        asset.secureUrl,
        asset.secure_url,
        asset.url,
        asset.fileUrl,
        asset.src,
      ]
    : [
        asset.url,
        asset.secureUrl,
        asset.secure_url,
        asset.fileUrl,
        asset.src,
        asset.thumbnailUrl,
        asset.previewUrl,
      ];

  for (const candidate of preferredCandidates) {
    const resolved = sanitizeMediaUrl(candidate);
    if (resolved) {
      return resolved;
    }
  }

  const nestedCandidates = [
    asset.image,
    asset.mainImage,
    asset.coverImage,
    asset.avatar,
    asset.profilePicture,
    asset.profileImage,
    asset.photo,
  ];

  for (const candidate of nestedCandidates) {
    const resolved = resolveMediaAssetUrl(candidate, options);
    if (resolved) {
      return resolved;
    }
  }

  return '';
};

export const resolveMediaAssetUrls = (...sources) => {
  const seen = new Set();

  return flattenSources(sources)
    .map((source) => resolveMediaAssetUrl(source))
    .filter(Boolean)
    .filter((url) => {
      if (seen.has(url)) {
        return false;
      }
      seen.add(url);
      return true;
    });
};

export const resolveProfileImageUrl = (entity = {}) =>
  resolveMediaAssetUrl([
    entity?.profilePicture,
    entity?.profileImage,
    entity?.avatar,
    entity?.photo,
    entity?.image,
  ]);

const normalizeEntityId = (value) => {
  if (!value) return '';
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }
  if (typeof value === 'object') {
    return normalizeEntityId(
      value._id || value.id || value.ownerId || value.jobId || value.$oid,
    );
  }
  return '';
};

const isBoundToJobCover = (job = {}) => {
  const metadata = job?.coverImageMetadata;
  const currentJobId = normalizeEntityId(job?.id || job?._id || job?.jobId);

  if (!metadata || typeof metadata !== 'object' || !currentJobId) {
    return false;
  }

  if (metadata.ownerType && metadata.ownerType !== 'job') {
    return false;
  }

  const metadataJobId = normalizeEntityId(metadata.jobId || metadata.ownerId);
  if (metadataJobId) {
    return metadataJobId === currentJobId;
  }

  const bindingKey = asTrimmedString(
    metadata.imageBindingKey || metadata.bindingKey,
  );
  if (bindingKey) {
    return bindingKey === `job:${currentJobId}:cover`;
  }

  return false;
};

const JOB_VISUAL_THEMES = {
  plumbing: {
    start: '#0f766e',
    end: '#0ea5e9',
    accent: '#67e8f9',
    badge: '#cffafe',
  },
  electrical: {
    start: '#312e81',
    end: '#2563eb',
    accent: '#facc15',
    badge: '#dbeafe',
  },
  carpentry: {
    start: '#78350f',
    end: '#b45309',
    accent: '#fde68a',
    badge: '#fef3c7',
  },
  construction: {
    start: '#374151',
    end: '#0f766e',
    accent: '#f59e0b',
    badge: '#dcfce7',
  },
  painting: {
    start: '#7c3aed',
    end: '#ec4899',
    accent: '#f9a8d4',
    badge: '#f5d0fe',
  },
  welding: {
    start: '#9a3412',
    end: '#ea580c',
    accent: '#fdba74',
    badge: '#ffedd5',
  },
  masonry: {
    start: '#7c2d12',
    end: '#c2410c',
    accent: '#fdba74',
    badge: '#ffedd5',
  },
  roofing: {
    start: '#14532d',
    end: '#16a34a',
    accent: '#86efac',
    badge: '#dcfce7',
  },
  flooring: {
    start: '#1f2937',
    end: '#0f766e',
    accent: '#5eead4',
    badge: '#ccfbf1',
  },
  tiling: {
    start: '#1d4ed8',
    end: '#0891b2',
    accent: '#93c5fd',
    badge: '#dbeafe',
  },
  hvac: {
    start: '#0f172a',
    end: '#2563eb',
    accent: '#93c5fd',
    badge: '#dbeafe',
  },
  landscaping: {
    start: '#166534',
    end: '#15803d',
    accent: '#86efac',
    badge: '#dcfce7',
  },
  'interior design': {
    start: '#7c2d12',
    end: '#be123c',
    accent: '#fda4af',
    badge: '#ffe4e6',
  },
  'general repairs': {
    start: '#334155',
    end: '#475569',
    accent: '#facc15',
    badge: '#fef9c3',
  },
  handyman: {
    start: '#334155',
    end: '#0f766e',
    accent: '#facc15',
    badge: '#fef9c3',
  },
  default: {
    start: '#0f172a',
    end: '#0f766e',
    accent: '#facc15',
    badge: '#fef3c7',
  },
};

const getJobCategoryKey = (job = {}) =>
  asTrimmedString(job?.category || job?.type || 'default').toLowerCase();

const getJobLocationLabel = (job = {}) => {
  const rawLocation = job?.location || job?.locationDetails;

  if (typeof rawLocation === 'string') {
    return asTrimmedString(rawLocation);
  }

  if (rawLocation && typeof rawLocation === 'object') {
    const locationParts = [
      rawLocation.city,
      rawLocation.region,
      rawLocation.country,
      rawLocation.address,
      rawLocation.district,
    ]
      .map((part) => asTrimmedString(part))
      .filter(Boolean);

    if (locationParts.length) {
      return locationParts.join(', ');
    }
  }

  return 'Ghana';
};

const createJobFallbackVisual = (job = {}) => {
  const categoryKey = getJobCategoryKey(job);
  const theme = JOB_VISUAL_THEMES[categoryKey] || JOB_VISUAL_THEMES.default;
  const categoryLabel = escapeSvgText(
    truncateText(job?.category || job?.type || 'Trade Opportunity', 24),
  );
  const titleLabel = escapeSvgText(
    truncateText(job?.title || 'Skilled trade opportunity', 34),
  );
  const locationLabel = escapeSvgText(
    truncateText(getJobLocationLabel(job), 28),
  );
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720" role="img" aria-label="${categoryLabel} job preview">
      <defs>
        <linearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${theme.start}" />
          <stop offset="100%" stop-color="${theme.end}" />
        </linearGradient>
        <linearGradient id="glow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </linearGradient>
      </defs>
      <rect width="1200" height="720" rx="36" fill="url(#hero)" />
      <circle cx="1030" cy="120" r="160" fill="${theme.accent}" fill-opacity="0.16" />
      <circle cx="210" cy="620" r="210" fill="#ffffff" fill-opacity="0.08" />
      <rect x="74" y="72" width="270" height="64" rx="32" fill="${theme.badge}" fill-opacity="0.96" />
      <text x="110" y="114" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="700" fill="#0f172a">${categoryLabel}</text>
      <rect x="74" y="180" width="612" height="16" rx="8" fill="url(#glow)" />
      <text x="74" y="292" font-family="Inter, Arial, sans-serif" font-size="72" font-weight="800" fill="#ffffff">${titleLabel}</text>
      <text x="74" y="356" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="500" fill="rgba(255,255,255,0.88)">${locationLabel}</text>
      <text x="74" y="618" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="600" fill="rgba(255,255,255,0.92)">Kelmah trade-ready job preview</text>
      <rect x="74" y="560" width="428" height="18" rx="9" fill="rgba(255,255,255,0.18)" />
      <rect x="74" y="560" width="236" height="18" rx="9" fill="${theme.accent}" fill-opacity="0.9" />
      <path d="M882 492c40-86 72-132 96-138 33-8 53 46 97 46 32 0 55-22 79-74v162H806c18-6 43-5 76 4Z" fill="rgba(255,255,255,0.14)" />
      <path d="M810 528c34-20 69-30 104-30 39 0 82 13 128 40v118H810V528Z" fill="rgba(255,255,255,0.12)" />
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.replace(/\s{2,}/g, ' ').trim())}`;
};

export const resolveJobVisualUrl = (job = {}, options = {}) => {
  const resolvedCoverImage = isBoundToJobCover(job)
    ? resolveMediaAssetUrl([job?.coverImage, job?.coverImageMetadata], options)
    : '';
  const resolvedGalleryImage = resolveMediaAssetUrl(
    [job?.images, job?.attachments, job?.media, job?.gallery],
    options,
  );
  const resolved = resolvedCoverImage || resolvedGalleryImage;

  if (resolved) {
    return resolved;
  }

  if (options.includeFallback === false) {
    return '';
  }

  return createJobFallbackVisual(job);
};
