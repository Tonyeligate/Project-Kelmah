const path = require('path');
const fs = require('fs');
const { logger } = require('../utils/logger');
const {
  hasCloudinaryConfig,
  uploadBuffer,
  toMediaAsset,
  resolveResourceType,
} = require('../../../shared/utils/cloudinary');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// SECURITY FIX: Sanitize filename to prevent path traversal attacks
// file.originalname is user-controlled and could contain ../../ sequences
const sanitizeFilename = (name) => {
  // Strip directory components — only keep the basename
  const base = path.basename(name || 'upload');
  // Remove any remaining suspicious characters
  return base.replace(/[^\w.\-() ]/g, '_') || 'upload';
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file

const uploadToLocalDisk = ({ file, folder, userId }) => {
  const dest = path.join(__dirname, '../../uploads', folder, userId);
  ensureDir(dest);
  const safeName = sanitizeFilename(file.originalname);
  const target = path.join(dest, safeName);
  fs.writeFileSync(target, file.buffer);
  return {
    name: safeName,
    url: `/uploads/${folder}/${userId}/${safeName}`,
    secureUrl: `/uploads/${folder}/${userId}/${safeName}`,
    originalFilename: file.originalname,
    bytes: file.size,
    resourceType: resolveResourceType(file.mimetype),
    format: path.extname(safeName).replace('.', '') || null,
    uploadedAt: new Date(),
    storage: 'local',
  };
};

const uploadViaConfiguredStorage = async ({ file, folder, userId, tags = [] }) => {
  if (hasCloudinaryConfig()) {
    const result = await uploadBuffer({
      buffer: file.buffer,
      folder,
      mimeType: file.mimetype,
      filename: sanitizeFilename(file.originalname),
      tags,
      context: {
        userId: String(userId || 'anonymous'),
        originalFilename: sanitizeFilename(file.originalname),
      },
    });

    return {
      name: sanitizeFilename(file.originalname),
      storage: 'cloudinary',
      ...toMediaAsset(result, {
        originalFilename: file.originalname,
        bytes: file.size,
      }),
    };
  }

  return uploadToLocalDisk({ file, folder, userId });
};

const validateFiles = (files, allowedTypes) => {
  if (files.length === 0) {
    return 'No files uploaded';
  }
  for (const f of files) {
    if (!allowedTypes.has(f.mimetype)) {
      return `Unsupported file type: ${f.mimetype}`;
    }
    if (f.size > MAX_FILE_SIZE) {
      return `File too large: ${f.originalname} (max 10MB)`;
    }
  }
  return null;
};

const uploadFiles = async ({ req, res, folder, allowedTypes, tags = [] }) => {
  try {
    const files = req.files || [];
    const validationError = validateFiles(files, allowedTypes);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const userId = req.user?.id || req.user?._id || 'anonymous';
    const saved = [];
    for (const file of files) {
      const stored = await uploadViaConfiguredStorage({
        file,
        folder,
        userId,
        tags,
      });
      saved.push(stored);
    }
    return res.json({ success: true, data: { files: saved } });
  } catch (err) {
    logger.error('uploadFiles error', err);
    return res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

exports.uploadWorkSamples = async (req, res) => {
  return uploadFiles({
    req,
    res,
    folder: 'portfolio',
    allowedTypes: new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf']),
    tags: ['portfolio'],
  });
};

exports.uploadCertificates = async (req, res) => {
  return uploadFiles({
    req,
    res,
    folder: 'certificates',
    allowedTypes: new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']),
    tags: ['certificate'],
  });
};

exports.uploadMedia = async (req, res) => {
  const folder = String(req.body?.folder || 'media')
    .replace(/[^a-zA-Z0-9/_-]/g, '-')
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '') || 'media';

  return uploadFiles({
    req,
    res,
    folder,
    allowedTypes: new Set([
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/ogg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]),
    tags: ['kelmah-media'],
  });
};




