const path = require('path');
const fs = require('fs');
const { logger } = require('../utils/logger');

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

exports.uploadWorkSamples = async (req, res) => {
  try {
    const files = req.files || [];
    const allowedTypes = new Set(['image/jpeg','image/png','image/gif','application/pdf']);
    if (files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    for (const f of files) {
      if (!allowedTypes.has(f.mimetype)) {
        return res.status(400).json({ success: false, message: `Unsupported file type: ${f.mimetype}` });
      }
      if (f.size > MAX_FILE_SIZE) {
        return res.status(400).json({ success: false, message: `File too large: ${f.originalname} (max 10MB)` });
      }
    }
    const userId = req.user?.id || 'anonymous';
    const dest = path.join(__dirname, '../../uploads', 'work-samples', userId);
    ensureDir(dest);
    const saved = [];
    for (const file of files) {
      const safeName = sanitizeFilename(file.originalname);
      const target = path.join(dest, safeName);
      fs.writeFileSync(target, file.buffer);
      saved.push({ name: safeName, url: `/uploads/work-samples/${userId}/${safeName}` });
    }
    return res.json({ success: true, data: { files: saved } });
  } catch (err) {
    logger.error('uploadWorkSamples error', err);
    return res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

exports.uploadCertificates = async (req, res) => {
  try {
    const files = req.files || [];
    const allowedTypes = new Set(['image/jpeg','image/png','image/gif','application/pdf']);
    if (files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    for (const f of files) {
      if (!allowedTypes.has(f.mimetype)) {
        return res.status(400).json({ success: false, message: `Unsupported file type: ${f.mimetype}` });
      }
      if (f.size > MAX_FILE_SIZE) {
        return res.status(400).json({ success: false, message: `File too large: ${f.originalname} (max 10MB)` });
      }
    }
    const userId = req.user?.id || 'anonymous';
    const dest = path.join(__dirname, '../../uploads', 'certificates', userId);
    ensureDir(dest);
    const saved = [];
    for (const file of files) {
      const safeName = sanitizeFilename(file.originalname);
      const target = path.join(dest, safeName);
      fs.writeFileSync(target, file.buffer);
      saved.push({ name: safeName, url: `/uploads/certificates/${userId}/${safeName}` });
    }
    return res.json({ success: true, data: { files: saved } });
  } catch (err) {
    logger.error('uploadCertificates error', err);
    return res.status(500).json({ success: false, message: 'Upload failed' });
  }
};




