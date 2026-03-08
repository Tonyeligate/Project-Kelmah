const asTrimmedString = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : '';

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
    return asTrimmedString(asset);
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
    const resolved = asTrimmedString(candidate);
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
