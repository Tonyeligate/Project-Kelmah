const { v2: cloudinary } = require('cloudinary');

let configured = false;

const hasCloudinaryConfig = () => Boolean(
  process.env.CLOUDINARY_CLOUD_NAME
  && process.env.CLOUDINARY_API_KEY
  && process.env.CLOUDINARY_API_SECRET,
);

const ensureCloudinaryConfigured = () => {
  if (configured) return true;
  if (!hasCloudinaryConfig()) return false;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
  return true;
};

const resolveResourceType = (mimeType = '') => {
  const normalized = String(mimeType).toLowerCase();
  if (normalized.startsWith('image/')) return 'image';
  if (normalized.startsWith('video/')) return 'video';
  return 'auto';
};

const buildThumbnailUrl = (result) => {
  if (!result?.public_id) return null;

  if (result.resource_type === 'image') {
    return cloudinary.url(result.public_id, {
      secure: true,
      resource_type: 'image',
      transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
    });
  }

  if (result.resource_type === 'video') {
    return cloudinary.url(result.public_id, {
      secure: true,
      resource_type: 'video',
      format: 'jpg',
      transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
    });
  }

  return null;
};

const toMediaAsset = (result, extra = {}) => ({
  url: result?.secure_url || result?.url || null,
  secureUrl: result?.secure_url || result?.url || null,
  publicId: result?.public_id || null,
  resourceType: result?.resource_type || null,
  originalFilename: extra.originalFilename || result?.original_filename || null,
  bytes: result?.bytes ?? extra.bytes ?? null,
  width: result?.width ?? null,
  height: result?.height ?? null,
  duration: result?.duration ?? null,
  format: result?.format || null,
  thumbnailUrl: buildThumbnailUrl(result),
  uploadedAt: new Date(),
  ...extra,
});

const uploadBuffer = async ({
  buffer,
  folder,
  mimeType,
  filename,
  resourceType,
  tags = [],
  context,
}) => {
  if (!buffer) {
    throw new Error('A file buffer is required for Cloudinary upload');
  }
  if (!ensureCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  const resolvedResourceType = resourceType || resolveResourceType(mimeType);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resolvedResourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        filename_override: filename,
        tags,
        context,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );
    stream.end(buffer);
  });
};

const isDataUri = (value = '') => /^data:[^;]+;base64,/.test(String(value));

const uploadDataUri = async ({ dataUri, folder, filename, resourceType, tags = [], context }) => {
  if (!isDataUri(dataUri)) {
    throw new Error('Invalid data URI payload');
  }
  if (!ensureCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  return cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: resourceType || 'image',
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    filename_override: filename,
    tags,
    context,
  });
};

module.exports = {
  cloudinary,
  hasCloudinaryConfig,
  ensureCloudinaryConfigured,
  resolveResourceType,
  toMediaAsset,
  uploadBuffer,
  uploadDataUri,
  isDataUri,
};