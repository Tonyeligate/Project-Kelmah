const router = require("express").Router();
const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_UPLOAD_MB || "25", 10) * 1024 * 1024,
  },
});
const path = require("path");
const fs = require("fs");
const {
  verifyGatewayRequest,
} = require("../../../shared/middlewares/serviceTrust");
const {
  hasCloudinaryConfig,
  uploadBuffer,
  toMediaAsset,
} = require("../../../shared/utils/cloudinary");
const {
  ensureAttachmentScanState,
} = require("../utils/virusScanState");

// Rate limiter
let uploadLimiter = null;
try {
  const { createLimiter } = require("../../../shared/middlewares/rateLimiter");
  uploadLimiter = createLimiter("uploads");
} catch (_) {
  uploadLimiter = (req, res, next) => next();
}

const uploadLocalAttachment = ({ file, conversationId }) => {
  const base = path.join(
    __dirname,
    "..",
    "uploads",
    "attachments",
    conversationId,
  );
  if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });

  const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `${Date.now()}_${safeName}`;
  const dest = path.join(base, filename);
  if (!dest.startsWith(base)) {
    throw new Error('Invalid filename');
  }
  fs.writeFileSync(dest, file.buffer);
  return {
    name: safeName,
    url: `/uploads/attachments/${conversationId}/${filename}`,
    secureUrl: `/uploads/attachments/${conversationId}/${filename}`,
    fileUrl: `/uploads/attachments/${conversationId}/${filename}`,
    storage: 'local',
    resourceType: file.mimetype.startsWith('image/')
      ? 'image'
      : file.mimetype.startsWith('video/')
        ? 'video'
        : 'raw',
    bytes: file.size,
    format: path.extname(safeName).replace('.', '') || null,
    originalFilename: file.originalname,
  };
};

router.post(
  "/api/messages/:conversationId/attachments",
  verifyGatewayRequest,
  uploadLimiter,
  upload.array("files", 10),
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      if (!conversationId)
        return res
          .status(400)
          .json({ success: false, message: "conversationId required" });
      // Validate files
      const allowedTypes = new Set([
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "video/mp4",
        "video/webm",
        "video/ogg",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
      ]);
      const maxFiles = 10;
      if (!Array.isArray(req.files) || req.files.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "No files uploaded" });
      }
      if (req.files.length > maxFiles) {
        return res.status(400).json({
          success: false,
          message: `Too many files. Maximum is ${maxFiles}`,
        });
      }
      for (const file of req.files) {
        if (!allowedTypes.has(file.mimetype)) {
          return res.status(400).json({
            success: false,
            message: `Unsupported file type: ${file.mimetype}`,
          });
        }
        if (file.size > 25 * 1024 * 1024) {
          return res.status(400).json({
            success: false,
            message: `File too large: ${file.originalname}`,
          });
        }
      }

      const saved = [];
      for (const file of req.files || []) {
        let stored;
        if (hasCloudinaryConfig()) {
          const uploaded = await uploadBuffer({
            buffer: file.buffer,
            folder: `messaging/${conversationId}`,
            mimeType: file.mimetype,
            filename: path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_'),
            tags: ['messaging', `conversation-${conversationId}`],
            context: {
              conversationId,
              originalFilename: path.basename(file.originalname),
            },
          });

          stored = {
            name: path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_'),
            storage: 'cloudinary',
            fileUrl: uploaded.secure_url,
            ...toMediaAsset(uploaded, {
              originalFilename: file.originalname,
              bytes: file.size,
            }),
          };
        } else {
          stored = uploadLocalAttachment({ file, conversationId });
        }

        const attachment = ensureAttachmentScanState({
          id: stored.publicId || `${Date.now()}_${stored.name}`,
          fileName: stored.name,
          originalname: file.originalname,
          url: stored.secureUrl || stored.url || stored.fileUrl,
          fileUrl: stored.fileUrl || stored.secureUrl || stored.url,
          type: file.mimetype.startsWith('image/') ? 'image' : file.mimetype.startsWith('video/') ? 'video' : 'file',
          mimeType: file.mimetype,
          size: file.size,
          fileType: file.mimetype,
          storage: stored.storage,
          publicId: stored.publicId,
          resourceType: stored.resourceType,
          thumbnailUrl: stored.thumbnailUrl || null,
          width: stored.width || null,
          height: stored.height || null,
          duration: stored.duration || null,
          format: stored.format || null,
        });
        saved.push(attachment);
      }
      return res.json({ success: true, data: { files: saved } });
    } catch (e) {
      console.error("Attachment upload error", e);
      return res.status(500).json({ success: false, message: "Upload failed" });
    }
  },
);

// Presign endpoint for messaging attachments (AWS S3 v3)
// POST presign (body)
router.post(
  "/api/uploads/presign",
  verifyGatewayRequest,
  uploadLimiter,
  async (req, res) => {
    try {
      const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
      const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
      const {
        folder = "attachments",
        filename = `file_${Date.now()}.bin`,
        contentType = "application/octet-stream",
      } = req.body || {};
      if (process.env.ENABLE_S3_UPLOADS !== "true") {
        return res.status(400).json({
          success: false,
          message: "Presign disabled. Set ENABLE_S3_UPLOADS=true",
        });
      }
      const bucket = process.env.S3_BUCKET;
      const region = process.env.AWS_REGION;
      if (!bucket || !region) {
        return res.status(500).json({
          success: false,
          message: "S3 config missing (S3_BUCKET, AWS_REGION)",
        });
      }
      // Validate policy
      const allowedContentTypes = (
        process.env.S3_ALLOWED_CONTENT_TYPES ||
        "image/jpeg,image/png,application/pdf"
      ).split(",");
      const maxSizeMb = parseInt(process.env.S3_MAX_SIZE_MB || "25", 10);
      if (!allowedContentTypes.includes(contentType)) {
        return res
          .status(400)
          .json({ success: false, message: "Unsupported content type" });
      }
      const key = `${folder}/${Date.now()}_${filename}`;
      const s3 = new S3Client({ region, credentials: undefined });
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        ACL: process.env.S3_ACL || "private",
      });
      const putUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });
      const cdnBase =
        process.env.CDN_BASE_URL ||
        `https://${bucket}.s3.${region}.amazonaws.com`;
      const getUrl = `${cdnBase}/${encodeURIComponent(key)}`;
      return res.json({
        success: true,
        data: { putUrl, getUrl, key, bucket, contentType, maxSizeMb },
      });
    } catch (e) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to presign upload" });
    }
  },
);

// GET presign (query)
router.get(
  "/api/uploads/presign",
  verifyGatewayRequest,
  uploadLimiter,
  async (req, res) => {
    try {
      const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
      const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
      const folder = req.query.folder || "attachments";
      const filename = req.query.filename || `file_${Date.now()}.bin`;
      const contentType = req.query.contentType || "application/octet-stream";
      if (process.env.ENABLE_S3_UPLOADS !== "true") {
        return res.status(400).json({
          success: false,
          message: "Presign disabled. Set ENABLE_S3_UPLOADS=true",
        });
      }
      const bucket = process.env.S3_BUCKET;
      const region = process.env.AWS_REGION;
      if (!bucket || !region) {
        return res.status(500).json({
          success: false,
          message: "S3 config missing (S3_BUCKET, AWS_REGION)",
        });
      }
      const allowedContentTypes = (
        process.env.S3_ALLOWED_CONTENT_TYPES ||
        "image/jpeg,image/png,application/pdf"
      ).split(",");
      const maxSizeMb = parseInt(process.env.S3_MAX_SIZE_MB || "25", 10);
      if (!allowedContentTypes.includes(contentType)) {
        return res
          .status(400)
          .json({ success: false, message: "Unsupported content type" });
      }
      const key = `${folder}/${Date.now()}_${filename}`;
      const s3 = new S3Client({ region, credentials: undefined });
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        ACL: process.env.S3_ACL || "private",
      });
      const putUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });
      const cdnBase =
        process.env.CDN_BASE_URL ||
        `https://${bucket}.s3.${region}.amazonaws.com`;
      const getUrl = `${cdnBase}/${encodeURIComponent(key)}`;
      return res.json({
        success: true,
        data: { putUrl, getUrl, key, bucket, contentType, maxSizeMb },
      });
    } catch (e) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to presign upload" });
    }
  },
);

module.exports = router;
