const express = require("express");
const router = require("express").Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// Minimal auth middleware (trust gateway to pass Authorization)
const authenticate = (req, res, next) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Unauthorized' });
  // In production, verify JWT here. For now accept presence as service sits behind API Gateway.
  next();
};

// Portfolio controller routes
try {
  const PortfolioController = require('../controllers/portfolio.controller');

  // Get worker portfolio
  router.get('/workers/:workerId/portfolio', authenticate, PortfolioController.getWorkerPortfolio);
  // Get single portfolio item
  router.get('/portfolio/:id', authenticate, PortfolioController.getPortfolioItem);
  // Search featured
  router.get('/portfolio/featured', PortfolioController.getFeaturedPortfolio);
  // Search portfolio
  router.get('/portfolio/search', PortfolioController.searchPortfolio);
  router.get('/workers/:workerId/portfolio/stats', authenticate, PortfolioController.getPortfolioStats);
  // Manage portfolio
  router.post('/portfolio', authenticate, PortfolioController.createPortfolioItem);
  router.put('/portfolio/:id', authenticate, PortfolioController.updatePortfolioItem);
  router.delete('/portfolio/:id', authenticate, PortfolioController.deletePortfolioItem);
} catch (e) {
  // Fallback stub if controller not available
  router.get('/portfolio/health', (req, res) => res.json({ success: true, message: 'portfolio routes loaded' }));
}

// Upload endpoints (disable when S3 presigned uploads are enabled)
try {
  const uploads = require('../controllers/upload.controller');
  const allowDirect = process.env.ENABLE_S3_UPLOADS !== 'true';
  if (allowDirect) {
    router.post('/portfolio/upload', authenticate, upload.array('files', 10), uploads.uploadWorkSamples);
    router.post('/certificates/upload', authenticate, upload.array('files', 10), uploads.uploadCertificates);
  } else {
    router.post('/portfolio/upload', (req, res) => res.status(400).json({ success: false, message: 'Direct uploads disabled. Use presigned URLs.' }));
    router.post('/certificates/upload', (req, res) => res.status(400).json({ success: false, message: 'Direct uploads disabled. Use presigned URLs.' }));
  }
} catch (e) {}

// Certificate routes
try {
  const CertificateController = require('../controllers/certificate.controller');
  // CRUD
  router.get('/:workerId/certificates', authenticate, CertificateController.listByWorker);
  router.post('/:workerId/certificates', authenticate, CertificateController.create);
  router.put('/certificates/:id', authenticate, CertificateController.update);
  router.delete('/certificates/:id', authenticate, CertificateController.remove);
  // Verification & utils
  router.post('/certificates/:id/verify', authenticate, CertificateController.requestVerification);
  router.get('/certificates/:id/verification', authenticate, CertificateController.getVerificationStatus);
  router.post('/certificates/:id/share', authenticate, CertificateController.share);
  router.post('/certificates/:id/validate', authenticate, CertificateController.validate);
  router.get('/:workerId/certificates/expiring', authenticate, CertificateController.expiring);
  router.get('/:workerId/certificates/search', authenticate, CertificateController.search);
  router.get('/:workerId/certificates/stats', authenticate, CertificateController.stats);
} catch (e) {}

// Presign endpoint (AWS S3 presign v3)
// POST presign (body)
router.post('/uploads/presign', authenticate, async (req, res) => {
  try {
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    const {
      folder = 'portfolio',
      filename = `file_${Date.now()}.bin`,
      contentType = 'application/octet-stream',
      cacheControl = 'public, max-age=31536000'
    } = req.body || {};

    if (process.env.ENABLE_S3_UPLOADS !== 'true') {
      return res.status(400).json({ success: false, message: 'Presign disabled. Set ENABLE_S3_UPLOADS=true' });
    }

    const bucket = process.env.S3_BUCKET;
    const region = process.env.AWS_REGION;
    if (!bucket || !region) {
      return res.status(500).json({ success: false, message: 'S3 config missing (S3_BUCKET, AWS_REGION)' });
    }

    // Validate policy
    const allowedContentTypes = (process.env.S3_ALLOWED_CONTENT_TYPES || 'image/jpeg,image/png,application/pdf').split(',');
    const maxSizeMb = parseInt(process.env.S3_MAX_SIZE_MB || '25', 10);
    if (!allowedContentTypes.includes(contentType)) {
      return res.status(400).json({ success: false, message: 'Unsupported content type' });
    }
    const key = `${folder}/${Date.now()}_${filename}`;
    const s3 = new S3Client({ region, credentials: undefined });
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      CacheControl: cacheControl,
      ACL: process.env.S3_ACL || 'private'
    });
    const putUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });
    const cdnBase = process.env.CDN_BASE_URL || `https://${bucket}.s3.${region}.amazonaws.com`;
    const getUrl = `${cdnBase}/${encodeURIComponent(key)}`;
    return res.json({ success: true, data: { putUrl, getUrl, key, bucket, contentType, maxSizeMb } });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to presign upload' });
  }
});

// GET presign (querystring) for easier cache/CDN usage
router.get('/uploads/presign', authenticate, async (req, res) => {
  try {
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    const folder = req.query.folder || 'portfolio';
    const filename = req.query.filename || `file_${Date.now()}.bin`;
    const contentType = req.query.contentType || 'application/octet-stream';
    if (process.env.ENABLE_S3_UPLOADS !== 'true') {
      return res.status(400).json({ success: false, message: 'Presign disabled. Set ENABLE_S3_UPLOADS=true' });
    }
    const bucket = process.env.S3_BUCKET;
    const region = process.env.AWS_REGION;
    if (!bucket || !region) {
      return res.status(500).json({ success: false, message: 'S3 config missing (S3_BUCKET, AWS_REGION)' });
    }
    const allowedContentTypes = (process.env.S3_ALLOWED_CONTENT_TYPES || 'image/jpeg,image/png,application/pdf').split(',');
    const maxSizeMb = parseInt(process.env.S3_MAX_SIZE_MB || '25', 10);
    if (!allowedContentTypes.includes(contentType)) {
      return res.status(400).json({ success: false, message: 'Unsupported content type' });
    }
    const key = `${folder}/${Date.now()}_${filename}`;
    const s3 = new S3Client({ region, credentials: undefined });
    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType, ACL: process.env.S3_ACL || 'private' });
    const putUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });
    const cdnBase = process.env.CDN_BASE_URL || `https://${bucket}.s3.${region}.amazonaws.com`;
    const getUrl = `${cdnBase}/${encodeURIComponent(key)}`;
    return res.json({ success: true, data: { putUrl, getUrl, key, bucket, contentType, maxSizeMb } });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to presign upload' });
  }
});

// Background verification (stub)
try {
  const verification = require('../controllers/verification.controller');
  router.post('/background/verify', authenticate, verification.verifyBackground);
} catch (e) {}

module.exports = router;
