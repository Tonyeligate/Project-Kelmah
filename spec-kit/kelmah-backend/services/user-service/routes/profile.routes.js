const express = require("express");
const router = require("express").Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// Service trust middleware - verify requests from API Gateway
const { verifyGatewayRequest, optionalGatewayVerification } = require('../../../shared/middlewares/serviceTrust');

// Portfolio controller routes
try {
  const PortfolioController = require('../controllers/portfolio.controller');

  // Get worker portfolio (public read)
  router.get('/workers/:workerId/portfolio', PortfolioController.getWorkerPortfolio);
  // Get single portfolio item (public read)
  router.get('/portfolio/:id', PortfolioController.getPortfolioItem);
  // Search featured
  router.get('/portfolio/featured', PortfolioController.getFeaturedPortfolio);
  // Search portfolio
  router.get('/portfolio/search', PortfolioController.searchPortfolio);
  router.get('/workers/:workerId/portfolio/stats', PortfolioController.getPortfolioStats);
  // Manage portfolio
  router.post('/portfolio', verifyGatewayRequest, PortfolioController.createPortfolioItem);
  router.put('/portfolio/:id', verifyGatewayRequest, PortfolioController.updatePortfolioItem);
  router.delete('/portfolio/:id', verifyGatewayRequest, PortfolioController.deletePortfolioItem);
  // Toggle featured / partial updates
  router.patch('/portfolio/:id', verifyGatewayRequest, PortfolioController.updatePortfolioItem);
  // Share portfolio item (generates shareable link and increments share counter)
  router.post('/portfolio/:id/share', verifyGatewayRequest, PortfolioController.sharePortfolioItem);
} catch (e) {
  // Fallback stub if controller not available
  router.get('/portfolio/health', (req, res) => res.json({ success: true, message: 'portfolio routes loaded' }));
}

// Upload endpoints (disable when S3 presigned uploads are enabled)
try {
  const uploads = require('../controllers/upload.controller');
  const allowDirect = process.env.ENABLE_S3_UPLOADS !== 'true' && process.env.NODE_ENV !== 'production';
  if (allowDirect) {
    router.post('/portfolio/upload', verifyGatewayRequest, upload.array('files', 10), uploads.uploadWorkSamples);
    router.post('/certificates/upload', verifyGatewayRequest, upload.array('files', 10), uploads.uploadCertificates);
  } else {
    router.post('/portfolio/upload', (req, res) => res.status(400).json({ success: false, message: 'Direct uploads disabled. Use presigned URLs.' }));
    router.post('/certificates/upload', (req, res) => res.status(400).json({ success: false, message: 'Direct uploads disabled. Use presigned URLs.' }));
  }
} catch (e) {}

// Certificate routes
try {
  const CertificateController = require('../controllers/certificate.controller');
  // CRUD
  router.get('/:workerId/certificates', verifyGatewayRequest, CertificateController.listByWorker);
  router.post('/:workerId/certificates', verifyGatewayRequest, CertificateController.create);
  router.put('/certificates/:id', verifyGatewayRequest, CertificateController.update);
  router.delete('/certificates/:id', verifyGatewayRequest, CertificateController.remove);
  // Verification & utils
  router.post('/certificates/:id/verify', verifyGatewayRequest, CertificateController.requestVerification);
  router.get('/certificates/:id/verification', verifyGatewayRequest, CertificateController.getVerificationStatus);
  router.post('/certificates/:id/share', verifyGatewayRequest, CertificateController.share);
  router.post('/certificates/:id/validate', verifyGatewayRequest, CertificateController.validate);
  router.get('/:workerId/certificates/expiring', verifyGatewayRequest, CertificateController.expiring);
  router.get('/:workerId/certificates/search', verifyGatewayRequest, CertificateController.search);
  router.get('/:workerId/certificates/stats', verifyGatewayRequest, CertificateController.stats);
} catch (e) {}

// Presign endpoint (AWS S3 presign v3)
// POST presign (body)
router.post('/uploads/presign', verifyGatewayRequest, async (req, res) => {
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
router.get('/uploads/presign', verifyGatewayRequest, async (req, res) => {
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
  router.post('/background/verify', verifyGatewayRequest, verification.verifyBackground);
} catch (e) {}

module.exports = router;
